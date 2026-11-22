"use strict";
/* Self-checking DP tables: <div class="table-check" data-answers="0,1,2,..." data-coins="1,3,4">
   with one <input> per unknown cell. Marks each cell, gives a targeted hint for the first wrong cell. */
(() => {
  for (const box of document.querySelectorAll(".table-check")) {
    const answers = box.dataset.answers.split(",").map(Number),
      coins = box.dataset.coins.split(",").map(Number),
      inputs = [...box.querySelectorAll("input[data-cell]")],
      feedback = box.querySelector(".tc-feedback");
    const say = (text, ok) => {
      feedback.hidden = false;
      feedback.textContent = text;
      feedback.classList.toggle("tc-good", !!ok);
    };
    const firstWrong = () => inputs.find((inp) => inp.value.trim() === "" || Number(inp.value) !== answers[+inp.dataset.cell]);
    box.querySelector(".tc-check").addEventListener("click", () => {
      let right = 0;
      for (const inp of inputs) {
        const filled = inp.value.trim() !== "", ok = filled && Number(inp.value) === answers[+inp.dataset.cell];
        inp.classList.toggle("tc-ok", ok);
        inp.classList.toggle("tc-bad", filled && !ok);
        if (ok) right++;
      }
      if (right === inputs.length) {
        const last = answers.length - 1;
        say(`All ${right} cells correct. dp[${last}] = ${answers[last]}, so ${last} needs ${answers[last]} coins.`, true);
      } else {
        const w = firstWrong();
        say(`${right} of ${inputs.length} correct. Check dp[${w.dataset.cell}] first, or press Hint.`);
        w.focus();
      }
    });
    box.querySelector(".tc-hint").addEventListener("click", () => {
      const w = firstWrong();
      if (!w) {
        say("Every cell is already correct.", true);
        return;
      }
      const a = +w.dataset.cell, usable = coins.filter((c) => c <= a);
      const terms = usable.map((c) => `dp[${a - c}]`).join(", "),
        values = usable.map((c) => answers[a - c]).join(", ");
      say(`dp[${a}] = 1 + min(${terms}) = 1 + min(${values}). Only coins that fit (≤ ${a}) are used.`);
      w.focus();
    });
    box.querySelector(".tc-reset").addEventListener("click", () => {
      for (const inp of inputs) {
        inp.value = "";
        inp.classList.remove("tc-ok", "tc-bad");
      }
      feedback.hidden = true;
    });
  }
})();
