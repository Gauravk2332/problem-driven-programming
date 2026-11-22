"use strict";
/* Local, private ink and whiteboard workspace; no server or account.
   v5: the whiteboard is one continuous canvas with pan and zoom, and the
   panel can be resized by dragging its left edge. */
(() => {
  const sections = [...document.querySelectorAll(".lesson-section[data-title]")],
    $ = (id) => document.getElementById(id);
  const toggle = $("ink-toggle"),
    bar = $("ink-toolbar");
  if (!sections.length || !toggle || !bar) return;
  const ns = "http://www.w3.org/2000/svg",
    legacyKey = "pdp-ink-v3:" + location.pathname,
    revision = document.body.dataset.contentRevision || "",
    key = legacyKey + (revision ? ":" + revision : ""),
    board = $("whiteboard"),
    boardSvg = $("board-svg");
  const buttons = [...bar.querySelectorAll("[data-ink-tool]")],
    swatches = [...bar.querySelectorAll("[data-ink-color]")],
    color = $("ink-color"),
    width = $("ink-width"),
    undo = $("ink-undo"),
    redo = $("ink-redo"),
    clear = $("ink-clear"),
    status = $("ink-status"),
    penOnly = $("ink-pen-only");

  const PAGE_W = 1000, PAGE_GAP = 680, MIN_Z = 0.12, MAX_Z = 6,
    SECTION_MAX = 2000, BOARD_MAX = 6000, PAPER_STEP = 28;

  let opened = false,
    tool = "navigate",
    active = null,
    mode = getMode(),
    lastSection = sections[0],
    selectedBoard = false,
    storageOK = true;
  const states = new Map(),
    blank = () => ({ strokes: [], history: [], future: [], width: 0 });
  let boardBank = blank(),
    view = { x: 0, y: 0, z: 0 },
    paper = "plain",
    saved = {},
    legacyRaw = null;

  try {
    const raw = localStorage.getItem(key);
    // Work saved for an earlier version of this lecture's text: the whiteboard carries over;
    // the old page annotations would no longer line up, so they are offered as a download.
    let oldKey = null;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== key && (k === legacyKey || k.startsWith(legacyKey + ":")) && (!oldKey || oldKey === legacyKey)) oldKey = k;
    }
    if (oldKey) legacyRaw = localStorage.getItem(oldKey);
    if (raw) saved = JSON.parse(raw) || {};
    else if (legacyRaw) {
      const old = JSON.parse(legacyRaw) || {};
      saved = { board: old.board, pages: old.pages, paper: old.paper, boardView: old.boardView };
    }
  } catch {
    storageOK = false;
  }

  function validStroke(s, maxWidth) {
    return (
      s && Array.isArray(s.points) && s.points.length &&
      s.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) &&
      /^#[0-9a-f]{6}$/i.test(s.color) &&
      Number.isFinite(s.width) && s.width > 0 && s.width <= maxWidth
    );
  }
  function loadBank(x, max = SECTION_MAX, maxWidth = 40) {
    const b = blank();
    if (x && Array.isArray(x.strokes)) {
      b.strokes = x.strokes.filter((s) => validStroke(s, maxWidth)).slice(0, max);
      b.width = Number(x.width) || 0;
    }
    return b;
  }
  // Older versions stored separate 1000 x 620 pages: stack them on the continuous board.
  function boardFrom(o) {
    if (o && o.board) return loadBank(o.board, BOARD_MAX, 400);
    const b = blank();
    if (o && Array.isArray(o.pages))
      o.pages.slice(0, 100).forEach((pg, i) => {
        for (const st of loadBank(pg, BOARD_MAX, 40).strokes)
          b.strokes.push(i ? { ...st, points: st.points.map((p) => ({ x: p.x, y: p.y + i * PAGE_GAP })) } : st);
      });
    b.strokes = b.strokes.slice(0, BOARD_MAX);
    return b;
  }
  boardBank = boardFrom(saved);
  if (["plain", "grid", "ruled"].includes(saved.paper)) paper = saved.paper;
  if (saved.boardView && [saved.boardView.x, saved.boardView.y, saved.boardView.z].every(Number.isFinite))
    view = { x: saved.boardView.x, y: saved.boardView.y, z: clamp(saved.boardView.z, MIN_Z, MAX_Z) };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function getMode() {
    return document.body.classList.contains("classroom") ? "classroom" : "reading";
  }
  function make(tag, attrs = {}) {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    return e;
  }
  function data() {
    const o = {
      version: 4,
      lecture: location.pathname,
      contentRevision: revision,
      sections: {},
      board: { strokes: boardBank.strokes },
      boardView: view.z ? view : undefined,
      paper,
    };
    for (const [el, s] of states)
      o.sections[el.id] = Object.fromEntries(
        Object.entries(s.banks).map(([k, b]) => [k, { strokes: b.strokes, width: b.width }]),
      );
    return o;
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(data()));
      storageOK = true;
    } catch {
      storageOK = false;
    }
  }
  let saveTimer = null;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  }
  function current(s) {
    return s.isBoard ? boardBank : s.banks[mode];
  }
  function visibleSection() {
    if (getMode() === "classroom")
      return sections.find((s) => s.classList.contains("active")) || sections[0];
    const top = (document.querySelector(".lesson-top")?.getBoundingClientRect().bottom || 0) + 12;
    const within = (s) => {
      const r = s.getBoundingClientRect();
      return r.bottom > top && r.top < window.innerHeight;
    };
    return lastSection && within(lastSection) ? lastSection : sections.find(within) || lastSection;
  }

  // ---------------------------------------------------------------- board scene
  const defs = make("defs"),
    gridPat = make("pattern", { id: "wb-grid", width: PAPER_STEP, height: PAPER_STEP, patternUnits: "userSpaceOnUse" }),
    ruledPat = make("pattern", { id: "wb-ruled", width: PAPER_STEP, height: PAPER_STEP, patternUnits: "userSpaceOnUse" }),
    gridLine = make("path", { d: `M${PAPER_STEP} 0V${PAPER_STEP}H0`, fill: "none", stroke: "#dde5ec" }),
    ruledLine = make("path", { d: `M0 ${PAPER_STEP}H${PAPER_STEP}`, fill: "none", stroke: "#d6e0ea" }),
    bgRect = make("rect", { class: "wb-bg", fill: "#ffffff" }),
    paperRect = make("rect", { class: "wb-paper", fill: "none" }),
    inkRoot = make("g", { class: "wb-ink" }),
    brush = make("circle", { class: "wb-cursor", r: 0, fill: "none", stroke: "#102b46", visibility: "hidden" });
  gridPat.append(gridLine);
  ruledPat.append(ruledLine);
  defs.append(gridPat, ruledPat);
  boardSvg.replaceChildren(defs, bgRect, paperRect, inkRoot, brush);
  boardSvg.removeAttribute("viewBox");
  const boardState = { layer: boardSvg, root: inkRoot, isBoard: true };

  function boardRect() {
    return boardSvg.getBoundingClientRect();
  }
  function applyView() {
    const r = boardRect();
    if (!r.width || !r.height) return;
    if (!view.z) view = { x: 0, y: 0, z: clamp(r.width / PAGE_W, MIN_Z, MAX_Z) };
    const w = r.width / view.z, h = r.height / view.z;
    boardSvg.setAttribute("viewBox", `${view.x} ${view.y} ${w} ${h}`);
    for (const rect of [bgRect, paperRect]) {
      rect.setAttribute("x", view.x);
      rect.setAttribute("y", view.y);
      rect.setAttribute("width", w);
      rect.setAttribute("height", h);
    }
    gridLine.setAttribute("stroke-width", 1 / view.z);
    ruledLine.setAttribute("stroke-width", 1 / view.z);
    paperRect.setAttribute("fill", paper === "plain" ? "none" : `url(#wb-${paper})`);
    const label = $("board-zoom-label");
    if (label) label.textContent = Math.round(view.z * 100) + "%";
  }
  function zoomAt(factor, cx, cy) {
    const r = boardRect();
    if (!r.width || !view.z) return;
    const px = cx - r.left, py = cy - r.top,
      wx = view.x + px / view.z, wy = view.y + py / view.z,
      z = clamp(view.z * factor, MIN_Z, MAX_Z);
    view = { x: wx - px / z, y: wy - py / z, z };
    applyView();
    saveSoon();
  }
  function zoomCenter(factor) {
    const r = boardRect();
    zoomAt(factor, r.left + r.width / 2, r.top + r.height / 2);
  }
  function panBy(dx, dy) {
    if (!view.z) return;
    view.x -= dx / view.z;
    view.y -= dy / view.z;
    applyView();
    saveSoon();
  }
  function contentBounds() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of boardBank.strokes) {
      const pad = s.width / 2;
      for (const p of s.points) {
        x0 = Math.min(x0, p.x - pad); y0 = Math.min(y0, p.y - pad);
        x1 = Math.max(x1, p.x + pad); y1 = Math.max(y1, p.y + pad);
      }
    }
    return Number.isFinite(x0) ? { x0, y0, x1, y1 } : null;
  }
  function fitAll() {
    const r = boardRect(), b = contentBounds();
    if (!r.width) return;
    if (!b) {
      view = { x: 0, y: 0, z: clamp(r.width / PAGE_W, MIN_Z, MAX_Z) };
    } else {
      const pad = 40, bw = b.x1 - b.x0 + pad * 2, bh = b.y1 - b.y0 + pad * 2,
        z = clamp(Math.min(r.width / bw, r.height / bh, 2), MIN_Z, MAX_Z);
      view = {
        x: (b.x0 + b.x1) / 2 - r.width / z / 2,
        y: (b.y0 + b.y1) / 2 - r.height / z / 2,
        z,
      };
    }
    applyView();
    saveSoon();
  }

  // ---------------------------------------------------------------- drawing
  const target = () => (selectedBoard && !board.hidden ? boardState : states.get(visibleSection()));
  function mismatch(s) {
    if (s.isBoard) return false;
    const b = current(s), w = s.layer.getBoundingClientRect().width;
    return b.strokes.length > 0 && b.width > 0 && w > 0 && Math.abs(w - b.width) > 4;
  }
  function refresh() {
    const s = target(), b = current(s);
    undo.disabled = !b.history.length;
    redo.disabled = !b.future.length;
    clear.disabled = !b.strokes.length;
    status.textContent =
      (s.isBoard ? "Whiteboard" : "Section: " + s.section.dataset.title) +
      " · " +
      (tool === "navigate"
        ? s.isBoard ? "Move: drag to pan, Ctrl+scroll or pinch to zoom." : "Navigate: scroll and run animations."
        : tool === "erase" ? "Erase a stroke."
        : tool === "laser" ? "Laser pointer (not saved)."
        : "Draw with " + (penOnly.checked ? "stylus only." : "pen, mouse or touch.") +
          (s.isBoard ? " Hold Space and drag to move." : "")) +
      (mismatch(s) ? " Marks hidden because lesson width changed; restore the layout to see them." : "") +
      (storageOK ? " · Saved locally on this browser." : " · Local storage unavailable; export to keep your work.");
    for (const sw of swatches) sw.setAttribute("aria-pressed", String(sw.dataset.inkColor === color.value));
  }
  function pathD(points) {
    if (!points.length) return "";
    if (points.length === 1) return "M" + points[0].x + " " + points[0].y + " l0.01 0";
    return points.map((p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
  }
  function shapePoints(kind, a, b) {
    const x = a.x, y = a.y, u = b.x, v = b.y;
    if (kind === "line") return [a, b];
    if (kind === "box") return [a, { x: u, y }, { x: u, y: v }, { x, y: v }, a];
    if (kind === "circle") {
      const cx = (x + u) / 2, cy = (y + v) / 2, rx = Math.abs(u - x) / 2, ry = Math.abs(v - y) / 2;
      return Array.from({ length: 65 }, (_, i) => ({
        x: cx + rx * Math.cos((i * Math.PI) / 32),
        y: cy + ry * Math.sin((i * Math.PI) / 32),
      }));
    }
    if (kind === "arrow") {
      const a0 = Math.atan2(v - y, u - x), l = Math.min(24, Math.hypot(u - x, v - y) * 0.35);
      return [a, b, { x: u - l * Math.cos(a0 - 0.55), y: v - l * Math.sin(a0 - 0.55) }, b,
        { x: u - l * Math.cos(a0 + 0.55), y: v - l * Math.sin(a0 + 0.55) }];
    }
    return [a, b];
  }
  function svgPath(s, stroke) {
    const el = make("path", {
      d: pathD(stroke.points), fill: "none", stroke: stroke.color, "stroke-width": stroke.width,
      "stroke-linecap": "round", "stroke-linejoin": "round", opacity: stroke.opacity,
    });
    (s.root || s.layer).append(el);
    return el;
  }
  function render(s) {
    (s.root || s.layer).replaceChildren();
    for (const stroke of current(s).strokes) svgPath(s, stroke);
    if (s.isBoard) applyView();
    else s.layer.classList.toggle("ink-mismatch", mismatch(s));
  }
  function renderAll() {
    for (const s of states.values()) render(s);
    render(boardState);
    refresh();
  }
  function snapshot(b) {
    b.history.push({ strokes: b.strokes.slice(), width: b.width });
    if (b.history.length > 60) b.history.shift();
    b.future = [];
  }
  function restore(b, snap) {
    b.strokes = snap.strokes;
    b.width = snap.width;
  }
  function distance(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy,
      t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }
  function erase(s, p) {
    const b = current(s), k = s.isBoard ? 1 / view.z : 1;
    for (let i = b.strokes.length - 1; i >= 0; i--) {
      const v = b.strokes[i], pts = v.points, r = Math.max(12 * k, v.width / 2 + 5 * k);
      let hit = pts.length === 1 && distance(p, pts[0], pts[0]) <= r;
      for (let j = 1; !hit && j < pts.length; j++) hit = distance(p, pts[j - 1], pts[j]) <= r;
      if (hit) {
        if (!active.changed) {
          snapshot(b);
          active.changed = true;
        }
        b.strokes.splice(i, 1);
        render(s);
        return;
      }
    }
  }
  function point(s, e) {
    if (s.isBoard) {
      const r = boardRect();
      return { x: view.x + (e.clientX - r.left) / view.z, y: view.y + (e.clientY - r.top) / view.z };
    }
    const r = s.layer.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(r.width, e.clientX - r.left)),
      y: Math.max(0, Math.min(r.height, e.clientY - r.top)),
    };
  }
  function finish(e) {
    if (!active || (e && e.pointerId !== active.id)) return;
    const a = active;
    active = null;
    if (a.s.layer.hasPointerCapture?.(a.id))
      try { a.s.layer.releasePointerCapture(a.id); } catch {}
    if (a.changed || a.stroke) save();
    refresh();
  }
  function cancelStroke() {
    if (!active) return;
    const a = active, b = current(a.s);
    active = null;
    if (a.stroke) {
      const i = b.strokes.lastIndexOf(a.stroke);
      if (i >= 0) b.strokes.splice(i, 1);
      a.path?.remove();
      if (b.history.length) b.history.pop();
    } else if (a.changed && b.history.length) {
      restore(b, b.history.pop());
      render(a.s);
    }
    refresh();
  }
  function laser(s, e) {
    if (tool !== "laser" || !opened || (penOnly.checked && e.pointerType !== "pen")) return;
    const p = point(s, e);
    let dot = s.layer.querySelector(".laser-dot");
    if (!dot) {
      dot = make("circle", { class: "laser-dot", fill: "#ef4444", stroke: "#fff" });
      s.layer.append(dot);
    }
    const k = s.isBoard ? 1 / view.z : 1;
    dot.setAttribute("r", 7 * k);
    dot.setAttribute("stroke-width", 2 * k);
    dot.setAttribute("cx", p.x);
    dot.setAttribute("cy", p.y);
  }
  function down(s, e) {
    if (!opened || tool === "navigate" || tool === "laser" || active || e.button !== 0 ||
      e.isPrimary === false || (penOnly.checked && e.pointerType !== "pen") || mismatch(s)) return;
    e.preventDefault();
    selectedBoard = s.isBoard === true;
    if (!s.isBoard) lastSection = s.section;
    const p = point(s, e), b = current(s);
    active = { id: e.pointerId, s, changed: false, origin: p };
    try { s.layer.setPointerCapture(e.pointerId); } catch {}
    if (tool === "erase") {
      erase(s, p);
      return;
    }
    snapshot(b);
    if (!s.isBoard && !b.strokes.length) b.width = s.layer.getBoundingClientRect().width;
    const base = Number(width.value) * (tool === "highlight" ? 4 : 1);
    const stroke = {
      color: color.value,
      width: s.isBoard ? +(base / view.z).toFixed(2) : base,
      opacity: tool === "highlight" ? 0.3 : 1,
      points: [p],
    };
    b.strokes.push(stroke);
    active.stroke = stroke;
    active.path = svgPath(s, stroke);
  }
  function move(s, e) {
    laser(s, e);
    if (!active || active.id !== e.pointerId || active.s !== s) return;
    e.preventDefault();
    const samples = e.getCoalescedEvents?.() || [];
    for (const sample of samples.length ? samples : [e]) {
      const p = point(s, sample);
      if (tool === "erase") erase(s, p);
      else if (["line", "arrow", "box", "circle"].includes(tool)) active.stroke.points = shapePoints(tool, active.origin, p);
      else active.stroke.points.push(p);
    }
    if (active.path) active.path.setAttribute("d", pathD(active.stroke.points));
  }
  function attach(s) {
    s.layer.addEventListener("pointerdown", (e) => down(s, e));
    s.layer.addEventListener("pointermove", (e) => move(s, e));
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) s.layer.addEventListener(name, finish);
    s.layer.addEventListener("pointerleave", () => s.layer.querySelector(".laser-dot")?.remove());
  }
  for (const section of sections) {
    const layer = make("svg", { class: "ink-layer", "aria-hidden": "true" });
    section.classList.add("ink-section");
    section.append(layer);
    const existing = saved.sections?.[section.id] || {};
    const s = {
      section, layer,
      banks: { reading: loadBank(existing.reading), classroom: loadBank(existing.classroom) },
    };
    states.set(section, s);
    attach(s);
  }

  // ---------------------------------------------------------------- board input: draw, pan, pinch, wheel
  const touches = new Map();
  let gesture = null, pan = null, spaceDown = false;
  function wantsPan(e) {
    return tool === "navigate" || !opened || spaceDown || e.button === 1 ||
      (penOnly.checked && e.pointerType === "touch");
  }
  function startGesture() {
    const [a, b] = [...touches.values()];
    gesture = {
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      view: { ...view },
    };
  }
  function updateGesture() {
    const [a, b] = [...touches.values()], r = boardRect(), g = gesture;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      z = clamp(g.view.z * (dist / g.dist), MIN_Z, MAX_Z),
      wx = g.view.x + (g.mid.x - r.left) / g.view.z,
      wy = g.view.y + (g.mid.y - r.top) / g.view.z;
    view = { x: wx - (mid.x - r.left) / z, y: wy - (mid.y - r.top) / z, z };
    applyView();
  }
  function showBrush(e) {
    const drawing = opened && !spaceDown && !pan && !gesture && e.pointerType !== "touch" &&
      ["pen", "highlight", "line", "arrow", "box", "circle"].includes(tool);
    if (!drawing || !view.z) {
      brush.setAttribute("visibility", "hidden");
      return;
    }
    const p = point(boardState, e), w = Number(width.value) * (tool === "highlight" ? 4 : 1);
    brush.setAttribute("cx", p.x);
    brush.setAttribute("cy", p.y);
    brush.setAttribute("r", Math.max(w / 2, 1.5) / view.z);
    brush.setAttribute("fill", color.value);
    brush.setAttribute("fill-opacity", tool === "highlight" ? 0.35 : 0.9);
    brush.setAttribute("stroke", "#ffffff");
    brush.setAttribute("stroke-width", 1.5 / view.z);
    brush.setAttribute("visibility", "visible");
  }
  function setPanCursor(on) {
    boardSvg.classList.toggle("wb-panning", on);
  }
  boardSvg.addEventListener("pointerdown", (e) => {
    selectedBoard = true;
    if (document.activeElement?.closest?.("button,select")) document.activeElement.blur();
    if (e.pointerType === "touch") {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) {
        cancelStroke();
        pan = null;
        startGesture();
        e.preventDefault();
        return;
      }
      if (touches.size > 2) return;
    }
    if (wantsPan(e)) {
      if (e.button !== 0 && e.button !== 1) return;
      e.preventDefault();
      pan = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try { boardSvg.setPointerCapture(e.pointerId); } catch {}
      setPanCursor(true);
      return;
    }
    down(boardState, e);
    refresh();
  });
  boardSvg.addEventListener("pointermove", (e) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture) {
      if (touches.size >= 2) updateGesture();
      e.preventDefault();
      return;
    }
    if (pan && pan.id === e.pointerId) {
      panBy(e.clientX - pan.x, e.clientY - pan.y);
      pan.x = e.clientX;
      pan.y = e.clientY;
      e.preventDefault();
      return;
    }
    move(boardState, e);
    showBrush(e);
  });
  function boardUp(e) {
    touches.delete(e.pointerId);
    if (gesture && touches.size < 2) {
      gesture = null;
      saveSoon();
    }
    if (pan && pan.id === e.pointerId) {
      pan = null;
      setPanCursor(false);
      try { boardSvg.releasePointerCapture(e.pointerId); } catch {}
    }
    finish(e);
  }
  for (const name of ["pointerup", "pointercancel"]) boardSvg.addEventListener(name, boardUp);
  boardSvg.addEventListener("lostpointercapture", (e) => {
    if (pan && pan.id === e.pointerId) {
      pan = null;
      setPanCursor(false);
    }
    finish(e);
  });
  boardSvg.addEventListener("pointerleave", () => {
    boardSvg.querySelector(".laser-dot")?.remove();
    brush.setAttribute("visibility", "hidden");
  });
  boardSvg.addEventListener("auxclick", (e) => e.button === 1 && e.preventDefault());
  boardSvg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? boardRect().height : 1;
    if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * unit * 0.0022), e.clientX, e.clientY);
    else if (e.shiftKey && !e.deltaX) panBy(-e.deltaY * unit, 0);
    else panBy(-e.deltaX * unit, -e.deltaY * unit);
  }, { passive: false });

  // ---------------------------------------------------------------- toolbar
  function choose(t) {
    finish();
    if (t === "highlight" && tool !== "highlight") color.value = "#eab308";
    else if (t === "pen" && tool === "highlight") color.value = "#174cbd";
    tool = t;
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.inkTool === t));
    for (const s of [...states.values(), boardState]) {
      s.layer.classList.toggle("ink-active", opened && t !== "navigate" && (!board.hidden ? s.isBoard : true));
      s.layer.classList.toggle("pen-only", penOnly.checked);
      s.layer.classList.toggle("laser-mode", t === "laser");
      s.layer.classList.toggle("ink-eraser", t === "erase");
      if (t !== "laser") s.layer.querySelector(".laser-dot")?.remove();
    }
    boardSvg.classList.toggle("wb-move", t === "navigate" || !opened);
    refresh();
  }
  function openTools(v) {
    opened = v;
    toggle.setAttribute("aria-expanded", String(v));
    bar.hidden = !v;
    if (!v) {
      const menu = $("ink-options");
      if (menu) menu.open = false;
    }
    document.body.classList.toggle("ink-open", v);
    choose(v ? "pen" : "navigate");
    document.dispatchEvent(new Event("pdp-layout-change"));
  }
  toggle.onclick = () => openTools(!opened);
  for (const b of buttons) b.onclick = () => choose(b.dataset.inkTool);
  for (const b of swatches)
    b.onclick = () => {
      color.value = b.dataset.inkColor;
      refresh();
    };
  color.oninput = refresh;
  penOnly.onchange = () => choose(tool);
  undo.onclick = () => {
    finish();
    const s = target(), b = current(s);
    if (b.history.length) {
      b.future.push({ strokes: b.strokes.slice(), width: b.width });
      restore(b, b.history.pop());
      render(s);
      save();
    }
    refresh();
  };
  redo.onclick = () => {
    finish();
    const s = target(), b = current(s);
    if (b.future.length) {
      b.history.push({ strokes: b.strokes.slice(), width: b.width });
      restore(b, b.future.pop());
      render(s);
      save();
    }
    refresh();
  };
  clear.onclick = () => {
    finish();
    const s = target(), b = current(s);
    if (b.strokes.length && window.confirm("Clear " + (s.isBoard ? "the whole whiteboard?" : "annotations on the current section?"))) {
      snapshot(b);
      b.strokes = [];
      b.width = 0;
      render(s);
      save();
    }
    refresh();
  };
  function download(body, name, type) {
    const url = URL.createObjectURL(body instanceof Blob ? body : new Blob([body], { type })),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  $("ink-export").onclick = () => download(JSON.stringify(data(), null, 2), "pdp-lecture-annotations.json", "application/json");
  const oldExport = $("ink-export-legacy");
  if (oldExport && legacyRaw) {
    oldExport.hidden = false;
    oldExport.onclick = () => download(legacyRaw, "pdp-lecture-earlier-annotations.json", "application/json");
  }
  $("ink-import").onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 12000000) throw Error("File too large");
      const o = JSON.parse(await file.text());
      if (![3, 4].includes(o.version) || o.lecture !== location.pathname || !o.sections || !(o.board || Array.isArray(o.pages)))
        throw Error("Not an annotation backup for this lecture");
      const same = (o.contentRevision || "") === revision;
      if (!window.confirm(same
        ? "Replace this lecture's saved annotations and whiteboard?"
        : "This backup uses a different lecture layout. Import the whiteboard only? Current lecture annotations will be kept.")) return;
      if (same)
        for (const [el, s] of states) {
          s.banks.reading = loadBank(o.sections[el.id]?.reading);
          s.banks.classroom = loadBank(o.sections[el.id]?.classroom);
        }
      boardBank = boardFrom(o);
      paper = ["plain", "grid", "ruled"].includes(o.paper) ? o.paper : "plain";
      view = { x: 0, y: 0, z: 0 };
      boardRefresh();
      renderAll();
      fitAll();
      save();
    } catch (err) {
      window.alert("Could not import annotations: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  // ---------------------------------------------------------------- board chrome
  function boardRefresh() {
    $("board-paper").value = paper;
    $("board-sheet").dataset.paper = paper;
    render(boardState);
    refresh();
  }
  function boardOpen(v) {
    finish();
    board.hidden = !v;
    selectedBoard = v;
    $("board-toggle").setAttribute("aria-pressed", String(v));
    document.body.classList.toggle("board-open", v);
    if (v) {
      if (!opened) openTools(true);
      choose("pen");
      // Keep Space free for panning: a focused toolbar button would otherwise toggle on Space.
      if (document.activeElement?.closest?.("button")) document.activeElement.blur();
    } else choose("navigate");
    document.dispatchEvent(new Event("pdp-layout-change"));
    requestAnimationFrame(renderAll);
  }
  function setFull(wide) {
    board.classList.toggle("board-full", wide);
    document.body.classList.toggle("board-wide", wide);
    $("board-size").textContent = wide ? "Split view" : "Expand";
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
      renderAll();
    });
  }
  $("board-toggle").onclick = () => boardOpen(board.hidden);
  $("board-close").onclick = () => boardOpen(false);
  $("board-size").onclick = () => setFull(!board.classList.contains("board-full"));
  $("board-zoom-in").onclick = () => zoomCenter(1.25);
  $("board-zoom-out").onclick = () => zoomCenter(0.8);
  $("board-zoom-label").onclick = () => zoomCenter(1 / view.z);
  $("board-fit").onclick = fitAll;
  $("board-paper").onchange = (e) => {
    paper = e.target.value;
    boardRefresh();
    save();
  };
  $("board-export").onclick = () => {
    const b = contentBounds();
    if (!b) {
      window.alert("The whiteboard is empty.");
      return;
    }
    const pad = 30, x = b.x0 - pad, y = b.y0 - pad, w = b.x1 - b.x0 + pad * 2, h = b.y1 - b.y0 + pad * 2,
      scale = Math.min(2, 4000 / Math.max(w, h));
    const copy = boardSvg.cloneNode(true);
    copy.querySelector(".laser-dot")?.remove();
    copy.querySelector(".wb-cursor")?.remove();
    copy.setAttribute("xmlns", ns);
    copy.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
    copy.setAttribute("width", Math.round(w * scale));
    copy.setAttribute("height", Math.round(h * scale));
    for (const rect of copy.querySelectorAll(".wb-bg,.wb-paper")) {
      rect.setAttribute("x", x); rect.setAttribute("y", y);
      rect.setAttribute("width", w); rect.setAttribute("height", h);
    }
    for (const line of copy.querySelectorAll("pattern path")) line.setAttribute("stroke-width", 1);
    const svgText = new XMLSerializer().serializeToString(copy),
      img = new Image(),
      url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((png) => png ? download(png, "pdp-whiteboard.png") : download(svgText, "pdp-whiteboard.svg", "image/svg+xml"), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      download(svgText, "pdp-whiteboard.svg", "image/svg+xml");
    };
    img.src = url;
  };

  // Drag the left edge of the panel to resize it.
  const WIDTH_KEY = "pdp-board-width", handle = $("board-resize");
  function setBoardWidth(px, persist) {
    const max = Math.max(360, window.innerWidth - 340), w = Math.round(clamp(px, 320, max));
    document.documentElement.style.setProperty("--board-w", w + "px");
    if (persist) try { localStorage.setItem(WIDTH_KEY, String(w)); } catch {}
    return w;
  }
  try {
    const w = Number(localStorage.getItem(WIDTH_KEY));
    if (w) setBoardWidth(w, false);
  } catch {}
  if (handle) {
    let drag = null;
    handle.addEventListener("pointerdown", (e) => {
      if (board.classList.contains("board-full")) return;
      e.preventDefault();
      drag = { id: e.pointerId };
      handle.setPointerCapture(e.pointerId);
      handle.classList.add("dragging");
      document.body.classList.add("board-resizing");
    });
    handle.addEventListener("pointermove", (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const right = window.innerWidth - board.getBoundingClientRect().right;
      setBoardWidth(window.innerWidth - right - e.clientX, false);
      applyView();
    });
    const end = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      drag = null;
      handle.classList.remove("dragging");
      document.body.classList.remove("board-resizing");
      setBoardWidth(board.getBoundingClientRect().width, true);
      window.dispatchEvent(new Event("resize"));
      document.dispatchEvent(new Event("pdp-layout-change"));
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
    handle.addEventListener("dblclick", () => setFull(true));
    handle.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      setBoardWidth(board.getBoundingClientRect().width + (e.key === "ArrowLeft" ? 40 : -40), true);
      window.dispatchEvent(new Event("resize"));
      document.dispatchEvent(new Event("pdp-layout-change"));
    });
  }
  if (window.ResizeObserver) new ResizeObserver(() => applyView()).observe(boardSvg);

  // ---------------------------------------------------------------- global events
  document.getElementById("mode-toggle")?.addEventListener("click", () => {
    finish();
    mode = getMode();
    renderAll();
  });
  document.addEventListener("lecture-section-change", () => {
    finish();
    requestAnimationFrame(refresh);
  });
  document.addEventListener("pdp-layout-change", () => requestAnimationFrame(renderAll));
  window.addEventListener("resize", () => requestAnimationFrame(renderAll));
  window.addEventListener("scroll", () => {
    if (opened && !active) refresh();
  }, { passive: true });
  const typing = (e) => e.target.closest?.("input,select,textarea,[contenteditable]");
  document.addEventListener("keydown", (e) => {
    if (e.key === " " && !board.hidden && !typing(e) && !e.target.closest?.("button,a,summary")) {
      e.preventDefault();
      if (!spaceDown) {
        spaceDown = true;
        boardSvg.classList.add("wb-move");
      }
      return;
    }
    if (e.key === "Escape" && opened && tool !== "navigate") {
      choose("navigate");
      e.preventDefault();
    }
    if (!opened || e.target.closest("input,select,textarea,button,a,summary")) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      (e.shiftKey ? redo : undo).click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo.click();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === " " && spaceDown) {
      spaceDown = false;
      boardSvg.classList.toggle("wb-move", tool === "navigate" || !opened);
    }
  });
  boardRefresh();
  choose("navigate");
  renderAll();
})();
