"use strict";
/* Language tabs and copy buttons for .code-tabs blocks.
   Without JavaScript every language stays visible, one under another. */
(() => {
  const KEY = "pdp-code-lang";
  const blocks = [...document.querySelectorAll(".code-tabs")];
  if (!blocks.length) return;
  let preferred = "python";
  try { preferred = localStorage.getItem(KEY) || preferred; } catch {}

  const selectAll = lang => blocks.forEach(b => b._select && b._select(lang, false));

  blocks.forEach((block, n) => {
    const panes = [...block.querySelectorAll(".code-pane")];
    const bar = document.createElement("div");
    bar.className = "code-tablist";
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "Programming language");
    const tabs = panes.map((pane, i) => {
      const id = `code-${n}-${i}`;
      pane.id = id;
      pane.setAttribute("role", "tabpanel");
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "code-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", id);
      tab.textContent = pane.dataset.label;
      tab.addEventListener("click", () => block._select(pane.dataset.lang, true));
      tab.addEventListener("keydown", e => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const j = (i + (e.key === "ArrowRight" ? 1 : panes.length - 1)) % panes.length;
        block._select(panes[j].dataset.lang, true);
        tabs[j].focus();
      });
      bar.append(tab);
      return tab;
    });
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "code-copy";
    copy.textContent = "Copy";
    copy.addEventListener("click", async () => {
      const pane = panes.find(p => !p.hidden);
      try {
        await navigator.clipboard.writeText(pane.querySelector("code").textContent);
        copy.textContent = "Copied";
      } catch { copy.textContent = "Select and copy"; }
      setTimeout(() => { copy.textContent = "Copy"; }, 1600);
    });
    bar.append(copy);
    block.prepend(bar);
    block.classList.add("code-ready");

    block._select = (lang, remember) => {
      if (!panes.some(p => p.dataset.lang === lang)) lang = panes[0].dataset.lang;
      panes.forEach((p, i) => {
        const on = p.dataset.lang === lang;
        p.hidden = !on;
        tabs[i].setAttribute("aria-selected", String(on));
        tabs[i].tabIndex = on ? 0 : -1;
      });
      if (remember) {
        try { localStorage.setItem(KEY, lang); } catch {}
        selectAll(lang);
      }
    };
    block._select(preferred, false);
  });
})();
