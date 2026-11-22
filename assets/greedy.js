"use strict";
/* Step-through labs: greedy labs for lectures 12-18, plus lab types registered in window.PDP_LABS
   (assets/found.js, lectures 1-11), which must load before this file.
   Markup: <figure class="g-lab" data-g-lab="TYPE"> with [data-in=NAME] inputs, [data-apply],
   step controls ([data-reset] [data-prev] [data-play] [data-next] [data-end] [data-speed]),
   [data-code] [data-vars] [data-vis] [data-note] [data-result] [data-error].
   Fill-in tables: <div class="g-fill"> with input[data-answer] cells and [data-check-table]. */
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const fail = m => { throw new Error(m); };
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function ints(text, label, min, max, maxCount, distinct) {
    const parts = String(text).split(/[\s,]+/).filter(Boolean);
    if (parts.length > maxCount) fail(`Use at most ${maxCount} ${label}.`);
    const out = parts.map(p => {
      if (!/^\d+$/.test(p)) fail(`“${p}” is not a whole number.`);
      const v = Number(p);
      if (v < min || v > max) fail(`Each ${label.replace(/s$/, "")} must be between ${min} and ${max}.`);
      return v;
    });
    if (distinct && new Set(out).size !== out.length) fail(`Repeated ${label} are not allowed.`);
    return out;
  }
  function one(text, label, min, max) {
    const t = String(text).trim();
    if (!/^\d+$/.test(t)) fail(`${label} must be a whole number.`);
    const v = Number(t);
    if (v < min || v > max) fail(`${label} must be between ${min} and ${max}.`);
    return v;
  }
  function pairs(text, label, sep, maxCount, check) {
    const parts = String(text).split(/[\s,]+/).filter(Boolean);
    if (parts.length > maxCount) fail(`Use at most ${maxCount} ${label}.`);
    return parts.map(p => {
      const m = p.split(sep);
      if (m.length !== 2 || !/^\d+$/.test(m[0]) || !/^\d+$/.test(m[1])) fail(`Write each ${label.replace(/s$/, "")} as a${sep}b, for example 3${sep}5.`);
      const a = Number(m[0]), b = Number(m[1]);
      check(a, b);
      return [a, b];
    });
  }
  const overlap = (a, b) => a.s < b.f && b.s < a.f;           // half-open intervals
  const fmt = x => Number.isInteger(x) ? String(x) : x.toFixed(2);

  function timeline(items, cls, labelOf) {
    if (!items.length) return '<p class="g-empty">No intervals.</p>';
    const lo = Math.min(...items.map(x => x.s)), hi = Math.max(...items.map(x => x.f)), span = Math.max(1, hi - lo);
    let ticks = "";
    const step = span > 12 ? 2 : 1;
    for (let t = lo; t <= hi; t += step) ticks += `<span style="left:${(100 * (t - lo) / span).toFixed(2)}%">${t}</span>`;
    return `<div class="g-time">${items.map(x => `<div class="g-row"><span class="g-name">${esc(labelOf ? labelOf(x) : x.name)}</span><div class="g-track"><span class="g-bar ${cls(x)}" style="left:${(100 * (x.s - lo) / span).toFixed(2)}%;width:${(100 * (x.f - x.s) / span).toFixed(2)}%">[${x.s},${x.f})</span></div></div>`).join("")}<div class="g-row g-axis"><span class="g-name"></span><div class="g-track">${ticks}</div></div></div>`;
  }
  const chips = (arr, cls) => `<div class="g-chips">${arr.map((x, i) => `<span class="g-chip ${cls ? cls(x, i) : ""}">${esc(x)}</span>`).join("") || '<span class="g-empty">empty</span>'}</div>`;

  function minCoins(coins, amount) {
    const best = Array(amount + 1).fill(Infinity);
    best[0] = 0;
    for (let a = 1; a <= amount; a++) for (const c of coins) if (c <= a && best[a - c] + 1 < best[a]) best[a] = best[a - c] + 1;
    return best[amount];
  }

  const LABS = {
    coins: {
      code: ["sort coins in decreasing order", "for each coin c:", "  while remaining ≥ c: take c", "if remaining > 0: greedy is stuck", "compare with the true optimum"],
      parse: q => {
        const coins = ints(q.coins, "coins", 1, 100, 8, true);
        if (!coins.length) fail("Enter at least one coin.");
        return {coins, amount: one(q.amount, "Amount", 0, 300)};
      },
      run({coins, amount}) {
        const order = [...coins].sort((a, b) => b - a), steps = [], used = [];
        let rem = amount;
        const vis = cur => `<p class="g-label">Coins taken</p>${chips(used.map(String))}<p class="g-label">Remaining: <b>${rem}</b> · coin order</p>${chips(order.map(String), c => Number(c) === cur ? "current" : "")}`;
        steps.push({line: 0, note: `Order: ${order.join(", ")}. Remaining ${rem}.`, vars: {remaining: rem, taken: "none"}, vis: vis(null)});
        for (const c of order) {
          if (rem < c) { steps.push({line: 1, note: `Coin ${c} is larger than ${rem}; move on.`, vars: {coin: c, remaining: rem, count: used.length}, vis: vis(c)}); continue; }
          while (rem >= c) {
            rem -= c; used.push(c);
            steps.push({line: 2, note: `Take ${c}; ${rem} left.`, vars: {coin: c, remaining: rem, count: used.length}, vis: vis(c)});
          }
        }
        const opt = minCoins(coins, amount);
        if (rem > 0) steps.push({line: 3, note: `Greedy is stuck with ${rem} left. ${opt === Infinity ? "No combination works." : `A correct answer exists: ${opt} coins.`}`, vars: {remaining: rem}, vis: vis(null)});
        const g = rem > 0 ? Infinity : used.length;
        const verdict = g === opt ? (opt === Infinity ? "No exact change exists." : `Greedy is optimal here: ${g} coins.`) : g === Infinity ? `Greedy fails; optimum is ${opt} coins.` : `Greedy uses ${g} coins but ${opt} is possible.`;
        steps.push({line: 4, note: verdict, vars: {greedy: g === Infinity ? "stuck" : g, optimum: opt === Infinity ? "none" : opt}, vis: vis(null), result: verdict});
        return steps;
      }
    },

    fknap: {
      code: ["ratio = value / weight for every item", "sort items by ratio, highest first", "for each item:", "  take = min(weight, room left)", "  gain = value × take / weight", "stop when the bag is full"],
      parse: q => {
        const items = pairs(q.items, "items", ":", 6, (w, v) => { if (w < 1 || w > 50) fail("Weights must be between 1 and 50."); if (v > 500) fail("Values must be at most 500."); });
        if (!items.length) fail("Enter at least one item.");
        return {items: items.map(([w, v], i) => ({name: LETTERS[i], w, v})), cap: one(q.cap, "Capacity", 0, 200)};
      },
      run({items, cap}) {
        const order = [...items].sort((a, b) => b.v * a.w - a.v * b.w);   // stable by ratio
        const taken = {}, steps = [];
        let room = cap, total = 0;
        const vis = cur => `<table class="g-table"><thead><tr><th>Item</th><th>w</th><th>v</th><th>v/w</th><th>taken</th></tr></thead><tbody>${order.map(it => `<tr class="${it.name === cur ? "current" : taken[it.name] ? "chosen" : ""}"><td>${it.name}</td><td>${it.w}</td><td>${it.v}</td><td>${fmt(it.v / it.w)}</td><td>${taken[it.name] ? `${taken[it.name]}/${it.w}` : "—"}</td></tr>`).join("")}</tbody></table><div class="g-meter" role="img" aria-label="Bag ${cap - room} of ${cap} filled"><span style="width:${cap ? (100 * (cap - room) / cap) : 0}%"></span></div><p class="g-label">Bag: ${cap - room} / ${cap} · value ${fmt(total)}</p>`;
        steps.push({line: 0, note: "Compute value per unit weight.", vars: {capacity: cap}, vis: vis(null)});
        steps.push({line: 1, note: `Order: ${order.map(it => it.name).join(", ")}.`, vars: {room}, vis: vis(null)});
        for (const it of order) {
          if (room === 0) { steps.push({line: 5, note: "The bag is full; the remaining items are not used.", vars: {room, total: fmt(total)}, vis: vis(null)}); break; }
          const take = Math.min(it.w, room);
          steps.push({line: 3, note: `${it.name}: take ${take} of ${it.w}${take < it.w ? " (a fraction)" : ""}.`, vars: {item: it.name, take, room}, vis: vis(it.name)});
          taken[it.name] = take; room -= take; total += it.v * take / it.w;
          steps.push({line: 4, note: `Gain ${fmt(it.v * take / it.w)}; total ${fmt(total)}, room ${room}.`, vars: {item: it.name, total: fmt(total), room}, vis: vis(it.name)});
        }
        const r = `Maximum value ${fmt(total)}.`;
        steps.push({line: 5, note: r, vars: {total: fmt(total)}, vis: vis(null), result: r});
        return steps;
      }
    },

    activity: {
      code: ["order candidates by the chosen rule", "for each candidate x:", "  if x overlaps nothing chosen: take x", "  else: reject x", "compare with the optimum"],
      parse: q => {
        const iv = pairs(q.items, "intervals", "-", 12, (s, f) => { if (f > 48) fail("Times must be at most 48."); if (s >= f) fail("Each interval needs start < finish."); });
        return {acts: iv.map(([s, f], i) => ({name: LETTERS[i], s, f})), rule: q.rule || "finish"};
      },
      run({acts, rule}) {
        const status = {}, steps = [];
        const vis = cur => timeline(acts, x => x.name === cur ? "current" : status[x.name] || "");
        const chosen = [];
        const names = {finish: "earliest finish", start: "earliest start", shortest: "shortest duration", conflicts: "fewest conflicts"};
        if (rule === "conflicts") {
          let rem = [...acts];
          steps.push({line: 0, note: "Fewest conflicts: repeatedly take the remaining interval that overlaps the fewest others.", vars: {remaining: rem.length}, vis: vis(null)});
          while (rem.length) {
            const count = x => rem.filter(y => y !== x && overlap(x, y)).length;
            let best = rem[0];
            for (const x of rem) if (count(x) < count(best) || (count(x) === count(best) && x.f < best.f)) best = x;
            chosen.push(best); status[best.name] = "chosen";
            steps.push({line: 2, note: `Take ${best.name} (${count(best)} conflicts).`, vars: {taken: chosen.map(x => x.name).join(" "), conflicts: count(best)}, vis: vis(best.name)});
            for (const y of rem) if (y !== best && overlap(best, y)) status[y.name] = "rejected";
            rem = rem.filter(y => y !== best && !overlap(best, y));
            steps.push({line: 3, note: "Remove everything that overlaps it.", vars: {taken: chosen.map(x => x.name).join(" "), remaining: rem.length}, vis: vis(null)});
          }
        } else {
          const key = {finish: x => x.f, start: x => x.s, shortest: x => x.f - x.s}[rule];
          const order = [...acts].sort((a, b) => key(a) - key(b));
          steps.push({line: 0, note: `Order by ${names[rule]}: ${order.map(x => x.name).join(", ") || "none"}.`, vars: {rule: names[rule]}, vis: vis(null)});
          for (const x of order) {
            const clash = chosen.find(c => overlap(c, x));
            if (!clash) { chosen.push(x); status[x.name] = "chosen"; steps.push({line: 2, note: `Take ${x.name} [${x.s},${x.f}).`, vars: {candidate: x.name, taken: chosen.map(c => c.name).join(" ")}, vis: vis(x.name)}); }
            else { status[x.name] = "rejected"; steps.push({line: 3, note: `Reject ${x.name}: it overlaps ${clash.name}.`, vars: {candidate: x.name, taken: chosen.map(c => c.name).join(" ")}, vis: vis(x.name)}); }
          }
        }
        let best = 0, last = -Infinity;
        for (const x of [...acts].sort((a, b) => a.f - b.f)) if (x.s >= last) { best++; last = x.f; }
        const Name = names[rule][0].toUpperCase() + names[rule].slice(1);
        const r = chosen.length === best ? `${Name} selects ${chosen.length}: optimal here (maximum ${best}).` : `${Name} selects only ${chosen.length}; the maximum is ${best}. This input is a counterexample.`;
        steps.push({line: 4, note: r, vars: {selected: chosen.length, maximum: best}, vis: vis(null), result: r});
        return steps;
      }
    },

    jobs: {
      code: ["sort jobs by profit, highest first", "for each job (p, d):", "  t = latest free slot ≤ min(d, slots)", "  if t exists: put job in slot t", "  else: reject job", "answer = total profit in slots"],
      parse: q => {
        const js = pairs(q.items, "jobs", ":", 8, (p, d) => { if (p > 999) fail("Profits must be at most 999."); if (d < 1 || d > 8) fail("Deadlines must be between 1 and 8."); });
        return {jobs: js.map(([p, d], i) => ({name: "J" + (i + 1), p, d}))};
      },
      run({jobs}) {
        const size = jobs.length ? Math.min(jobs.length, Math.max(...jobs.map(j => j.d))) : 0;
        const slot = Array(size + 1).fill(null), status = {}, steps = [];
        let total = 0;
        const order = [...jobs].sort((a, b) => b.p - a.p);
        const vis = (cur, probe) => `<div class="g-slots">${slot.slice(1).map((n, i) => `<span class="g-slot ${i + 1 === probe ? "current" : n ? "chosen" : ""}"><small>slot ${i + 1}</small>${n || "free"}</span>`).join("") || '<span class="g-empty">no slots</span>'}</div>${chips(order.map(j => `${j.name} p${j.p} d${j.d}`), (x, i) => order[i].name === cur ? "current" : status[order[i].name] || "")}`;
        steps.push({line: 0, note: `${size} slot${size === 1 ? "" : "s"}; order ${order.map(j => j.name).join(", ") || "none"}.`, vars: {slots: size}, vis: vis(null)});
        for (const j of order) {
          let t = Math.min(j.d, size);
          while (t >= 1 && slot[t]) t--;
          steps.push({line: 2, note: t ? `${j.name} (deadline ${j.d}): latest free slot is ${t}.` : `${j.name} (deadline ${j.d}): slots 1..${Math.min(j.d, size)} are full.`, vars: {job: j.name, profit: j.p, deadline: j.d, slot: t || "none"}, vis: vis(j.name, t)});
          if (t) { slot[t] = j.name; status[j.name] = "chosen"; total += j.p; steps.push({line: 3, note: `Place ${j.name} in slot ${t}; profit ${total}.`, vars: {job: j.name, total}, vis: vis(j.name)}); }
          else { status[j.name] = "rejected"; steps.push({line: 4, note: `Reject ${j.name}.`, vars: {job: j.name, total}, vis: vis(j.name)}); }
        }
        const r = `Maximum profit ${total}; order ${slot.slice(1).filter(Boolean).join(" → ") || "none"}.`;
        steps.push({line: 5, note: r, vars: {total}, vis: vis(null), result: r});
        return steps;
      }
    },

    merge: {
      code: ["put every size in a min-heap", "while the heap has 2 or more:", "  a = pop smallest, b = pop smallest", "  cost += a + b; push a + b", "answer = total cost"],
      parse: q => {
        const xs = ints(q.items, "sizes", 1, 999, 8, false);
        if (!xs.length) fail("Enter at least one size.");
        return {xs, huffman: q.mode === "huffman"};
      },
      run({xs, huffman}) {
        let heap = xs.map((v, i) => ({v, id: i, sym: huffman ? LETTERS[i].toLowerCase() : null, kids: null}));
        let counter = xs.length, cost = 0;
        const log = [], steps = [];
        const sorted = () => [...heap].sort((a, b) => a.v - b.v || a.id - b.id);
        const vis = hl => `<p class="g-label">Heap (smallest first)</p>${chips(sorted().map(n => n.sym ? `${n.sym}:${n.v}` : String(n.v)), (x, i) => hl && hl.includes(sorted()[i]) ? "current" : "")}<p class="g-label">Merges</p>${chips(log)}`;
        steps.push({line: 0, note: `Heap holds ${heap.length} item${heap.length === 1 ? "" : "s"}.`, vars: {cost}, vis: vis(null)});
        while (heap.length > 1) {
          const [a, b] = sorted();
          steps.push({line: 2, note: `Pop the two smallest: ${a.v} and ${b.v}.`, vars: {a: a.v, b: b.v, cost}, vis: vis([a, b])});
          heap = heap.filter(n => n !== a && n !== b);
          const n = {v: a.v + b.v, id: counter++, sym: null, kids: [a, b]};
          heap.push(n); cost += n.v; log.push(`${a.v}+${b.v}=${n.v}`);
          steps.push({line: 3, note: `Push ${n.v}; total cost ${cost}.`, vars: {pushed: n.v, cost}, vis: vis([n])});
        }
        let extra = "";
        if (huffman) {
          const codes = {};
          const walk = (n, p) => { if (!n.kids) codes[n.sym] = p || "0"; else { walk(n.kids[0], p + "0"); walk(n.kids[1], p + "1"); } };
          walk(heap[0], "");
          extra = " Codes: " + Object.keys(codes).sort().map(s => `${s}=${codes[s]}`).join(", ") + ".";
        }
        const r = (huffman ? `Encoded length ${cost} bits.` : `Minimum total merge cost ${cost}.`) + extra;
        steps.push({line: 4, note: r, vars: {cost}, vis: vis(null), result: r});
        return steps;
      }
    },

    rooms: {
      code: ["sort intervals by start time", "for each interval x:", "  if earliest-free room is free by x.start: reuse it", "  else: open a new room", "  record room's new finish = x.finish", "answer = rooms opened"],
      parse: q => {
        const iv = pairs(q.items, "intervals", "-", 10, (s, f) => { if (f > 48) fail("Times must be at most 48."); if (s >= f) fail("Each interval needs start < finish."); });
        return {acts: iv.map(([s, f], i) => ({name: LETTERS[i], s, f}))};
      },
      run({acts}) {
        const order = [...acts].sort((a, b) => a.s - b.s), roomOf = {}, steps = [];
        let free = [], rooms = 0;
        const heapText = () => [...free].sort((a, b) => a.f - b.f || a.r - b.r).map(x => `R${x.r} free at ${x.f}`);
        const vis = cur => timeline(order, x => x.name === cur ? "current" : roomOf[x.name] ? "room" + (((roomOf[x.name] - 1) % 4) + 1) : "", x => roomOf[x.name] ? `${x.name} · R${roomOf[x.name]}` : x.name) + `<p class="g-label">Heap of room finish times</p>${chips(heapText())}`;
        steps.push({line: 0, note: `Order by start: ${order.map(x => x.name).join(", ") || "none"}.`, vars: {rooms}, vis: vis(null)});
        for (const x of order) {
          free.sort((a, b) => a.f - b.f || a.r - b.r);
          let r;
          if (free.length && free[0].f <= x.s) { r = free.shift().r; steps.push({line: 2, note: `${x.name} [${x.s},${x.f}): room R${r} is free by ${x.s}; reuse it.`, vars: {interval: x.name, room: "R" + r, rooms}, vis: vis(x.name)}); }
          else { r = ++rooms; steps.push({line: 3, note: `${x.name} [${x.s},${x.f}): every room is busy at ${x.s}; open R${r}.`, vars: {interval: x.name, room: "R" + r, rooms}, vis: vis(x.name)}); }
          roomOf[x.name] = r; free.push({f: x.f, r});
          steps.push({line: 4, note: `R${r} is busy until ${x.f}.`, vars: {interval: x.name, rooms}, vis: vis(null)});
        }
        let depth = 0;
        for (const x of acts) depth = Math.max(depth, acts.filter(y => y.s <= x.s && x.s < y.f).length);
        const r = `${rooms} room${rooms === 1 ? "" : "s"}; the most intervals alive at one moment is ${depth}, so no schedule can use fewer.`;
        steps.push({line: 5, note: r, vars: {rooms, depth}, vis: vis(null), result: r});
        return steps;
      }
    },

    kruskal: {
      code: ["sort edges by weight", "for each edge (u, v, w):", "  if find(u) ≠ find(v): accept, union(u, v)", "  else: reject (it closes a cycle)", "stop after V − 1 accepted edges"],
      parse: q => {
        const parts = String(q.items).split(/[\s,]+/).filter(Boolean);
        if (parts.length > 14) fail("Use at most 14 edges.");
        const edges = parts.map(p => {
          const m = /^([A-Ha-h])([A-Ha-h]):(\d{1,2})$/.exec(p);
          if (!m) fail(`Write each edge as AB:7 (vertices A–H, weight 0–99). “${p}” is not valid.`);
          const u = m[1].toUpperCase(), v = m[2].toUpperCase();
          if (u === v) fail("An edge must join two different vertices.");
          return {u, v, w: Number(m[3])};
        });
        if (!edges.length) fail("Enter at least one edge.");
        return {edges};
      },
      run({edges}) {
        const V = [...new Set(edges.flatMap(e => [e.u, e.v]))].sort();
        const parent = Object.fromEntries(V.map(v => [v, v]));
        const find = x => { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; };
        const order = [...edges].sort((a, b) => a.w - b.w), status = new Map(), steps = [];
        let cost = 0, used = 0;
        const pos = {};
        V.forEach((v, i) => { const t = 2 * Math.PI * i / V.length - Math.PI / 2; pos[v] = [150 + 105 * Math.cos(t), 112 + 88 * Math.sin(t)]; });
        const comps = () => { const g = {}; for (const v of V) (g[find(v)] = g[find(v)] || []).push(v); return Object.values(g).map(c => "{" + c.join("") + "}"); };
        const vis = cur => `<svg class="g-graph" viewBox="0 0 300 225" role="img" aria-label="Graph with accepted edges highlighted">${order.map(e => { const [x1, y1] = pos[e.u], [x2, y2] = pos[e.v]; const c = e === cur ? "current" : status.get(e) || ""; return `<line class="${c}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/><text class="w ${c}" x="${((x1 + x2) / 2).toFixed(1)}" y="${((y1 + y2) / 2 - 3).toFixed(1)}">${e.w}</text>`; }).join("")}${V.map(v => `<circle cx="${pos[v][0].toFixed(1)}" cy="${pos[v][1].toFixed(1)}" r="12"/><text class="v" x="${pos[v][0].toFixed(1)}" y="${(pos[v][1] + 4).toFixed(1)}">${v}</text>`).join("")}</svg><p class="g-label">Components</p>${chips(comps())}`;
        steps.push({line: 0, note: `Edge order: ${order.map(e => e.u + e.v + "(" + e.w + ")").join(", ")}.`, vars: {vertices: V.length}, vis: vis(null)});
        for (const e of order) {
          if (used === V.length - 1) { steps.push({line: 4, note: "V − 1 edges accepted: the tree is complete.", vars: {cost}, vis: vis(null)}); break; }
          const ru = find(e.u), rv = find(e.v);
          if (ru !== rv) { parent[ru] = rv; status.set(e, "chosen"); cost += e.w; used++; steps.push({line: 2, note: `Accept ${e.u}${e.v} (${e.w}): it joins two components. Cost ${cost}.`, vars: {edge: e.u + e.v, weight: e.w, cost, accepted: used}, vis: vis(e)}); }
          else { status.set(e, "rejected"); steps.push({line: 3, note: `Reject ${e.u}${e.v} (${e.w}): ${e.u} and ${e.v} are already connected.`, vars: {edge: e.u + e.v, weight: e.w, cost}, vis: vis(e)}); }
        }
        const r = used === V.length - 1 ? `Minimum spanning tree cost ${cost} with ${used} edges.` : `The graph is disconnected: only ${used} of ${V.length - 1} edges could be accepted (a spanning forest of cost ${cost}).`;
        steps.push({line: 4, note: r, vars: {cost, accepted: used}, vis: vis(null), result: r});
        return steps;
      }
    }
  };

  function setup(fig) {
    const lab = LABS[fig.dataset.gLab];
    if (!lab) return;
    const q = s => fig.querySelector(s);
    const code = q("[data-code]"), vars = q("[data-vars]"), visEl = q("[data-vis]"), note = q("[data-note]"), res = q("[data-result]"), err = q("[data-error]"), play = q("[data-play]");
    code.innerHTML = lab.code.map((l, i) => `<span class="trace-line" data-line="${i}">${esc(l)}</span>`).join("");
    let steps = [], i = 0, timer = null;
    const stop = () => { clearInterval(timer); timer = null; play.textContent = "Play"; play.setAttribute("aria-pressed", "false"); };
    function render() {
      const s = steps[i];
      code.querySelectorAll(".trace-line").forEach(l => l.classList.toggle("current", Number(l.dataset.line) === s.line));
      vars.textContent = Object.entries(s.vars).map(([k, v]) => `${k} = ${v}`).join("\n");
      visEl.innerHTML = s.vis;
      note.textContent = `Step ${i + 1} of ${steps.length}. ${s.note}`;
      res.textContent = s.result || "";
      q("[data-prev]").disabled = i === 0;
      q("[data-next]").disabled = q("[data-end]").disabled = i === steps.length - 1;
    }
    function load() {
      stop();
      const vals = {};
      fig.querySelectorAll("[data-in]").forEach(el => { vals[el.dataset.in] = el.value; });
      try { steps = lab.run(lab.parse(vals)); err.textContent = ""; i = 0; render(); }
      catch (e) { err.textContent = e.message; }
    }
    q("[data-apply]").onclick = load;
    fig.querySelectorAll("select[data-in]").forEach(s => s.addEventListener("change", load));
    fig.querySelectorAll("input[data-in]").forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); load(); } }));
    q("[data-reset]").onclick = () => { stop(); i = 0; render(); };
    q("[data-prev]").onclick = () => { stop(); if (i > 0) { i--; render(); } };
    q("[data-next]").onclick = () => { stop(); if (i < steps.length - 1) { i++; render(); } };
    q("[data-end]").onclick = () => { stop(); i = steps.length - 1; render(); };
    play.onclick = () => {
      if (timer) return stop();
      if (i === steps.length - 1) i = 0;
      play.textContent = "Pause"; play.setAttribute("aria-pressed", "true");
      render();
      timer = setInterval(() => { if (i < steps.length - 1) { i++; render(); } if (i === steps.length - 1) stop(); }, 1100 / Number(q("[data-speed]").value || 1));
    };
    document.addEventListener("lecture-section-change", () => { if (!fig.offsetParent) stop(); });
    load();
  }

  function setupFill(box) {
    const cells = [...box.querySelectorAll("input[data-answer]")], fb = box.querySelector("[data-fill-feedback]");
    const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, " ").replace(/\s*([,+])\s*/g, "$1");
    const ok = c => c.dataset.answer.split("|").some(a => norm(a) === norm(c.value));
    box.querySelector("[data-check-table]").onclick = () => {
      const empty = cells.filter(c => !c.value.trim()).length;
      let right = 0;
      cells.forEach(c => { const good = c.value.trim() && ok(c); c.classList.toggle("is-right", !!good); c.classList.toggle("is-wrong", !!c.value.trim() && !good); c.setAttribute("aria-invalid", c.value.trim() && !good ? "true" : "false"); if (good) right++; });
      fb.hidden = false;
      fb.className = "study-feedback " + (right === cells.length ? "correct" : "incorrect");
      fb.textContent = right === cells.length ? `All ${cells.length} cells correct. ${box.dataset.done || ""}` : `${right} of ${cells.length} correct${empty ? `, ${empty} empty` : ""}. ${box.dataset.hint || "Re-check the highlighted cells."}`;
    };
    box.querySelector("[data-show-table]").onclick = () => { cells.forEach(c => { c.value = c.dataset.answer.split("|")[0]; c.classList.remove("is-wrong"); c.classList.add("is-right"); }); fb.hidden = false; fb.className = "study-feedback"; fb.textContent = "Answers shown. Clear the table and try again without looking."; };
    box.querySelector("[data-clear-table]").onclick = () => { cells.forEach(c => { c.value = ""; c.classList.remove("is-right", "is-wrong"); c.removeAttribute("aria-invalid"); }); fb.hidden = true; };
  }

  Object.keys(window.PDP_LABS || {}).forEach(k => { if (!LABS[k]) LABS[k] = window.PDP_LABS[k]; });   // labs from found.js
  document.querySelectorAll("figure.g-lab[data-g-lab]").forEach(setup);
  document.querySelectorAll(".g-fill").forEach(setupFill);
})();
