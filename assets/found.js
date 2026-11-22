"use strict";
/* Labs for Modules 1-3 study pages (lectures 1-11). Registers lab types in window.PDP_LABS;
   assets/greedy.js (loaded after this file) supplies the shared step controller and fill-in tables. */
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const fail = m => { throw new Error(m); };
  function ints(text, label, min, max, maxCount, allowNeg) {
    const parts = String(text).split(/[\s,]+/).filter(Boolean);
    if (!parts.length) fail(`Enter at least one ${label.replace(/s$/, "")}.`);
    if (parts.length > maxCount) fail(`Use at most ${maxCount} ${label}.`);
    return parts.map(p => {
      if (!(allowNeg ? /^-?\d+$/ : /^\d+$/).test(p)) fail(`“${p}” is not a whole number.`);
      const v = Number(p);
      if (v < min || v > max) fail(`Each value must be between ${min} and ${max}.`);
      return v;
    });
  }
  function one(text, label, min, max) {
    const t = String(text).trim();
    if (!/^-?\d+$/.test(t)) fail(`${label} must be a whole number.`);
    const v = Number(t);
    if (v < min || v > max) fail(`${label} must be between ${min} and ${max}.`);
    return v;
  }
  const chips = (arr, cls) => `<div class="g-chips">${arr.map((x, i) => `<span class="g-chip ${cls ? cls(x, i) : ""}">${esc(x)}</span>`).join("") || '<span class="g-empty">empty</span>'}</div>`;
  const cells = (arr, cls, sub) => `<div class="f-cells">${arr.map((x, i) => `<span class="f-cell ${cls ? cls(x, i) : ""}"><small>${sub ? sub(i) : i}</small>${esc(x)}</span>`).join("")}</div>`;
  const list = a => `[${a.join(", ")}]`;

  const L = window.PDP_LABS = window.PDP_LABS || {};

  /* Lecture 1: maximum with a loop invariant */
  L.maxscan = {
    code: ["best = A[0]   (or 0 in the buggy version)", "for i = 1 .. n−1:", "  if A[i] > best: best = A[i]", "  invariant: best = max(A[0..i])", "return best"],
    parse: q => ({a: ints(q.a, "values", -999, 999, 12, true), start: q.start}),
    run({a, start}) {
      const steps = [];
      let best = start === "zero" ? 0 : a[0], comps = 0;
      const first = start === "zero" ? 0 : 1;
      const vis = (cur, done) => cells(a.map(String), (x, i) => i === cur ? "current" : i < done ? "seen" : "", i => `A[${i}]`) + `<p class="g-label">best so far: <b>${best}</b></p>`;
      steps.push({line: 0, note: start === "zero" ? "Buggy start: best = 0, before looking at any value." : `Start with the first value: best = ${best}.`, vars: {best, comparisons: 0}, vis: vis(start === "zero" ? -1 : 0, first)});
      for (let i = first; i < a.length; i++) {
        comps++;
        const bigger = a[i] > best;
        if (bigger) best = a[i];
        steps.push({line: bigger ? 2 : 1, note: `Compare A[${i}] = ${a[i]} with best: ${bigger ? `larger, so best = ${best}` : "not larger, keep best"}.`, vars: {i, "A[i]": a[i], best, comparisons: comps}, vis: vis(i, i + 1)});
      }
      const real = Math.max(...a);
      const ok = best === real;
      const msg = ok ? `best = ${best} after ${comps} comparisons. Correct: n − 1 comparisons when starting from A[0].` : `Returned ${best}, but the true maximum is ${real}: starting from 0 is wrong when every value is negative.`;
      steps.push({line: 4, note: msg, vars: {best, comparisons: comps, "true max": real}, vis: vis(-1, a.length), result: msg});
      return steps;
    }
  };

  /* Lecture 2: insertion sort with comparison counting */
  L.isort = {
    code: ["for i = 1 .. n−1:", "  key = A[i]; j = i − 1", "  while j ≥ 0:  (one comparison)", "    if A[j] ≤ key: stop", "    shift A[j] right; j = j − 1", "  place key at j + 1"],
    parse: q => ({a: ints(q.a, "values", -999, 999, 10, true)}),
    run({a}) {
      a = [...a];
      const n = a.length, steps = [];
      let comps = 0, shifts = 0;
      const vis = (sorted, cur) => cells(a.map(String), (x, i) => i === cur ? "current" : i <= sorted ? "seen" : "", i => `A[${i}]`);
      steps.push({line: 0, note: "A[0] alone is a sorted prefix.", vars: {comparisons: 0, shifts: 0}, vis: vis(0, -1)});
      for (let i = 1; i < n; i++) {
        const key = a[i];
        let j = i - 1;
        steps.push({line: 1, note: `Insert key = ${key} into the sorted prefix A[0..${i - 1}].`, vars: {i, key, comparisons: comps, shifts}, vis: vis(i - 1, i)});
        while (j >= 0) {
          comps++;
          if (a[j] <= key) { steps.push({line: 3, note: `A[${j}] = ${a[j]} ≤ ${key}: stop.`, vars: {i, j, key, comparisons: comps, shifts}, vis: vis(i - 1, j)}); break; }
          a[j + 1] = a[j]; shifts++;
          steps.push({line: 4, note: `A[${j}] = ${a[j]} > ${key}: shift it right.`, vars: {i, j, key, comparisons: comps, shifts}, vis: vis(i, j + 1)});
          j--;
        }
        a[j + 1] = key;
        steps.push({line: 5, note: `Place ${key} at index ${j + 1}.`, vars: {i, key, comparisons: comps, shifts}, vis: vis(i, j + 1)});
      }
      const worst = n * (n - 1) / 2;
      const msg = `Sorted with ${comps} comparisons and ${shifts} shifts. For n = ${n}: best case ${n - 1}, worst case ${worst}.`;
      steps.push({line: 5, note: msg, vars: {comparisons: comps, shifts, best: n - 1, worst}, vis: vis(n - 1, -1), result: msg});
      return steps;
    }
  };

  /* Lecture 3: checking a Big-O witness */
  L.witness = {
    code: ["f(n) = p·n² + q·n + r,  g(n) = n²", "choose constants c and n0", "for n = 1, 2, …:", "  compare f(n) with c·g(n)", "claim: f(n) ≤ c·g(n) for every n ≥ n0"],
    parse: q => {
      const [p, qq, r] = ints(q.f, "coefficients", 0, 50, 3);
      if (p === undefined || qq === undefined || r === undefined) fail("Give three coefficients p, q, r.");
      if (p === 0) fail("Use p ≥ 1 so that f grows like n².");
      return {p, q: qq, r, c: one(q.c, "c", 1, 100), n0: one(q.n0, "n0", 1, 40)};
    },
    run({p, q, r, c, n0}) {
      const f = n => p * n * n + q * n + r, top = Math.max(n0 + 6, 12), steps = [], rows = [];
      let firstGood = null;
      for (let n = 1; n <= 200; n++) {
        let ok = true;
        for (let m = n; m <= 400; m++) if (f(m) > c * m * m) { ok = false; break; }
        if (ok) { firstGood = n; break; }
      }
      const vis = () => `<table class="g-table"><thead><tr><th>n</th><th>f(n)</th><th>c·n²</th><th>f ≤ c·n²?</th></tr></thead><tbody>${rows.map(([n, a, b]) => `<tr class="${a <= b ? (n >= n0 ? "chosen" : "") : "bad"}"><td>${n}</td><td>${a}</td><td>${b}</td><td>${a <= b ? "yes" : "no"}</td></tr>`).join("")}</tbody></table>`;
      steps.push({line: 1, note: `Test f(n) = ${p}n² + ${q}n + ${r} against ${c}·n² with n0 = ${n0}.`, vars: {c, n0}, vis: vis()});
      for (let n = 1; n <= top; n++) {
        rows.push([n, f(n), c * n * n]);
        steps.push({line: 3, note: `n = ${n}: f = ${f(n)}, c·n² = ${c * n * n} → ${f(n) <= c * n * n ? "holds" : "fails"}${n < n0 ? " (below n0, allowed)" : ""}.`, vars: {n, "f(n)": f(n), "c·n²": c * n * n}, vis: vis()});
      }
      let msg;
      if (c < p) msg = `With c = ${c} < ${p} the claim is false for large n: f(n)/n² approaches ${p}. Choose c > ${p} (or c = ${p} only if q = r = 0).`;
      else if (firstGood !== null && n0 >= firstGood) msg = `Valid witness: f(n) ≤ ${c}n² for all n ≥ ${n0} (the inequality first holds from n = ${firstGood}). So f(n) = O(n²).`;
      else if (firstGood !== null) msg = `Not valid with n0 = ${n0}: it fails at some n ≥ ${n0}. With c = ${c}, the smallest working n0 is ${firstGood}.`;
      else msg = `No n0 up to 200 works with c = ${c}; increase c.`;
      steps.push({line: 4, note: msg, vars: {c, n0, "smallest n0": firstGood ?? "none"}, vis: vis(), result: msg});
      return steps;
    }
  };

  /* Lecture 4: recursion tree for T(n) = a T(n/b) + n^d */
  L.rtree = {
    code: ["T(n) = a·T(n/b) + n^d,  T(1) = 1", "level i has a^i nodes of size n/b^i", "level cost = a^i · (n/b^i)^d", "add the levels down to size 1", "compare with the Master Theorem"],
    parse: q => {
      const a = one(q.a, "a", 1, 8), b = one(q.b, "b", 2, 4), d = one(q.d, "d", 0, 3), n = one(q.n, "n", 1, 4096);
      let k = 0, m = n;
      while (m > 1) { if (m % b) fail(`n must be a power of b = ${b} (for example ${b ** 3}).`); m /= b; k++; }
      if (a ** k > 50000) fail("That tree is too large to show; use a smaller n.");
      return {a, b, d, n, k};
    },
    run({a, b, d, n, k}) {
      const steps = [], rows = [];
      let total = 0;
      const vis = () => `<table class="g-table"><thead><tr><th>Level</th><th>Nodes</th><th>Size</th><th>Cost per node</th><th>Level cost</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.join("</td><td>")}</td></tr>`).join("")}</tbody></table><p class="g-label">running total: <b>${total}</b></p>`;
      steps.push({line: 0, note: `Expand T(${n}) with a = ${a}, b = ${b}, d = ${d}. There are log_${b} ${n} = ${k} levels above the leaves.`, vars: {a, b, d, n}, vis: vis()});
      for (let i = 0; i <= k; i++) {
        const nodes = a ** i, size = n / b ** i, per = i === k ? 1 : size ** d, cost = nodes * per;
        total += cost;
        rows.push([i, nodes, size, per, cost]);
        steps.push({line: i === k ? 3 : 2, note: i === k ? `Leaves: ${nodes} calls of T(1) = 1 each.` : `Level ${i}: ${nodes} node(s) of size ${size}, each costing ${size}^${d} = ${per}.`, vars: {level: i, "level cost": cost, total}, vis: vis()});
      }
      const e = Math.log(a) / Math.log(b);
      const pw = x => Math.abs(x - Math.round(x)) < 1e-9 ? (Math.round(x) === 0 ? "1" : Math.round(x) === 1 ? "n" : `n^${Math.round(x)}`) : `n^${x.toFixed(2)}`;
      const cls = Math.abs(e - d) < 1e-9 ? (d === 0 ? "Θ(log n): every level costs the same" : `Θ(${pw(d)} log n): every level costs the same`) : d > e ? `Θ(${pw(d)}): the root level dominates` : `Θ(${pw(e)}): the leaves dominate`;
      const msg = `T(${n}) = ${total}. log_b a = ${e.toFixed(2)} vs d = ${d} → ${cls}.`;
      steps.push({line: 4, note: msg, vars: {"T(n)": total, "log_b a": e.toFixed(2), d}, vis: vis(), result: msg});
      return steps;
    }
  };

  /* Lecture 5: merge sort */
  L.msort = {
    code: ["mergeSort(A):", "  if |A| ≤ 1: return A", "  split A into left and right halves", "  sort each half recursively", "  merge: repeatedly take the smaller front item"],
    parse: q => ({a: ints(q.a, "values", -999, 999, 10, true)}),
    run({a}) {
      const steps = [];
      let comps = 0;
      const rec = (arr, depth) => {
        const pad = "· ".repeat(depth);
        if (arr.length <= 1) { steps.push({line: 1, note: `${pad}${list(arr)} has at most one item: already sorted.`, vars: {depth, comparisons: comps}, vis: chips(arr.map(String), () => "chosen")}); return arr; }
        const mid = Math.floor(arr.length / 2), L1 = arr.slice(0, mid), R1 = arr.slice(mid);
        steps.push({line: 2, note: `${pad}Split ${list(arr)} into ${list(L1)} and ${list(R1)}.`, vars: {depth, comparisons: comps}, vis: chips(L1.map(String), () => "current") + chips(R1.map(String))});
        const l = rec(L1, depth + 1), r = rec(R1, depth + 1), out = [];
        let i = 0, j = 0;
        while (i < l.length && j < r.length) { comps++; out.push(l[i] <= r[j] ? l[i++] : r[j++]); }
        const merged = out.concat(l.slice(i), r.slice(j));
        steps.push({line: 4, note: `${pad}Merge ${list(l)} and ${list(r)} → ${list(merged)}.`, vars: {depth, comparisons: comps}, vis: chips(merged.map(String), () => "chosen")});
        return merged;
      };
      const s = rec(a, 0), n = a.length, bound = n <= 1 ? 0 : n * Math.ceil(Math.log2(n));
      const msg = `Sorted: ${list(s)} using ${comps} comparisons (at most n⌈log₂ n⌉ = ${bound}).`;
      steps.push({line: 4, note: msg, vars: {comparisons: comps, bound}, vis: chips(s.map(String), () => "chosen"), result: msg});
      return steps;
    }
  };

  /* Lecture 6: Sieve of Eratosthenes */
  L.sieve = {
    code: ["mark 2..N as candidates", "for p = 2 while p·p ≤ N:", "  if p is still unmarked: p is prime", "    cross out p², p²+p, … ≤ N", "every unmarked number is prime"],
    parse: q => ({n: one(q.n, "N", 2, 150)}),
    run({n}) {
      const comp = new Array(n + 1).fill(false), steps = [];
      let crossings = 0;
      const vis = (p, newly) => `<div class="f-grid">${Array.from({length: n - 1}, (_, k) => k + 2).map(v => `<span class="f-num ${v === p ? "current" : newly.has(v) ? "new" : comp[v] ? "out" : ""}">${v}</span>`).join("")}</div>`;
      steps.push({line: 0, note: `All numbers 2..${n} start as candidates.`, vars: {N: n, crossings}, vis: vis(0, new Set())});
      for (let p = 2; p * p <= n; p++) {
        if (comp[p]) { steps.push({line: 2, note: `${p} is already crossed out (a multiple of a smaller prime): skip.`, vars: {p, crossings}, vis: vis(p, new Set())}); continue; }
        const newly = new Set();
        for (let m = p * p; m <= n; m += p) { crossings++; if (!comp[m]) newly.add(m); comp[m] = true; }
        steps.push({line: 3, note: `${p} is prime. Cross out its multiples from ${p * p}: ${[...newly].slice(0, 12).join(", ")}${newly.size > 12 ? ", …" : ""}${newly.size ? "" : "(none new)"}.`, vars: {p, "p²": p * p, crossings}, vis: vis(p, newly)});
      }
      const primes = [];
      for (let v = 2; v <= n; v++) if (!comp[v]) primes.push(v);
      const msg = `${primes.length} primes ≤ ${n}: ${primes.join(", ")}. Total crossings: ${crossings}.`;
      steps.push({line: 4, note: msg, vars: {primes: primes.length, crossings}, vis: vis(0, new Set()), result: msg});
      return steps;
    }
  };

  /* Lecture 7: Euclid and extended Euclid */
  L.euclid = {
    code: ["while b ≠ 0:", "  write a = q·b + r", "  (a, b) = (b, r)", "gcd = a", "back-substitute to get x, y with a·x + b·y = gcd"],
    parse: q => {
      const a = one(q.a, "a", 0, 1000000), b = one(q.b, "b", 0, 1000000);
      if (a === 0 && b === 0) fail("gcd(0, 0) is undefined; use at least one non-zero number.");
      return {a, b};
    },
    run({a, b}) {
      const steps = [], rows = [], A0 = a, B0 = b;
      const vis = () => `<table class="g-table"><thead><tr><th>a</th><th>b</th><th>q = a div b</th><th>r = a mod b</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.join("</td><td>")}</td></tr>`).join("")}</tbody></table>`;
      steps.push({line: 0, note: `Start with a = ${a}, b = ${b}.`, vars: {a, b}, vis: vis()});
      while (b !== 0) {
        const q = Math.floor(a / b), r = a % b;
        rows.push([a, b, q, r]);
        steps.push({line: 1, note: `${a} = ${q} × ${b} + ${r}. Any common divisor of ${a} and ${b} also divides ${r}.`, vars: {a, b, q, r}, vis: vis()});
        [a, b] = [b, r];
        steps.push({line: 2, note: `Continue with (${a}, ${b}).`, vars: {a, b}, vis: vis()});
      }
      const g = a;
      const ext = (x, y) => { if (y === 0) return [x, 1, 0]; const [gg, x1, y1] = ext(y, x % y); return [gg, y1, x1 - Math.floor(x / y) * y1]; };
      const [, x, y] = ext(A0, B0);
      steps.push({line: 3, note: `b = 0, so gcd(${A0}, ${B0}) = ${g} after ${rows.length} division(s).`, vars: {gcd: g, divisions: rows.length}, vis: vis()});
      const msg = `gcd = ${g}; ${A0}·(${x}) + ${B0}·(${y}) = ${A0 * x + B0 * y}. lcm = ${g ? (A0 / g) * B0 : 0}.`;
      steps.push({line: 4, note: msg, vars: {gcd: g, x, y}, vis: vis(), result: msg});
      return steps;
    }
  };

  /* Lecture 8: binary exponentiation */
  L.modpow = {
    code: ["result = 1;  base = base mod m", "while e > 0:", "  if e is odd: result = result·base mod m", "  base = base·base mod m", "  e = e div 2", "return result"],
    parse: q => ({base: one(q.base, "Base", 0, 1000000000), e: one(q.e, "Exponent", 0, 1000000000), m: one(q.m, "Modulus", 1, 1000000007)}),
    run({base, e, m}) {
      const B = BigInt, M = B(m), steps = [], E0 = e;
      let r = B(1) % M, b = B(base) % M, ee = B(e), mults = 0;
      const bits = E0.toString(2);
      const vis = used => `<p class="g-label">exponent ${E0} in binary</p>${cells(bits.split(""), (x, i) => bits.length - 1 - i === used ? "current" : bits.length - 1 - i < used ? "seen" : "", i => `2^${bits.length - 1 - i}`)}`;
      steps.push({line: 0, note: `${E0} = ${bits}₂. Start: result = ${r}, base = ${b}.`, vars: {result: r, base: b, e: ee}, vis: vis(-1)});
      let bit = 0;
      while (ee > 0n) {
        const odd = (ee & 1n) === 1n;
        if (odd) { r = r * b % M; mults++; }
        steps.push({line: 2, note: odd ? `Bit 2^${bit} is 1: result = result × ${b} mod ${m} = ${r}.` : `Bit 2^${bit} is 0: result unchanged.`, vars: {result: r, base: b, e: ee}, vis: vis(bit)});
        ee >>= 1n;
        if (ee > 0n) { b = b * b % M; mults++; }
        steps.push({line: 3, note: ee > 0n ? `Square the base: base = ${b} (this is ${base}^(2^${bit + 1}) mod ${m}).` : "No bits left.", vars: {result: r, base: b, e: ee}, vis: vis(bit)});
        bit++;
      }
      const msg = `${base}^${E0} mod ${m} = ${r}, using ${mults} modular multiplications instead of ${Math.max(E0 - 1, 0)}.`;
      steps.push({line: 5, note: msg, vars: {result: r, multiplications: mults}, vis: vis(bits.length), result: msg});
      return steps;
    }
  };

  /* Lecture 9: Catalan numbers by DP */
  L.catalan = {
    code: ["C[0] = 1", "for k = 1 .. n:", "  C[k] = Σ C[i]·C[k−1−i],  i = 0 .. k−1", "  (first pair encloses i pairs; k−1−i pairs follow)", "return C[n]"],
    parse: q => ({n: one(q.n, "n", 1, 15)}),
    run({n}) {
      const C = [1], steps = [];
      const vis = cur => cells(C.map(String), (x, i) => i === cur ? "current" : "chosen", i => `C${i}`);
      steps.push({line: 0, note: "C[0] = 1: the empty arrangement.", vars: {k: 0, "C[0]": 1}, vis: vis(0)});
      for (let k = 1; k <= n; k++) {
        let s = 0;
        const terms = [];
        for (let i = 0; i < k; i++) { s += C[i] * C[k - 1 - i]; terms.push(`${C[i]}·${C[k - 1 - i]}`); }
        C.push(s);
        steps.push({line: 2, note: `C[${k}] = ${terms.join(" + ")} = ${s}.`, vars: {k, [`C[${k}]`]: s}, vis: vis(k)});
      }
      const msg = `C[${n}] = ${C[n]}: the number of balanced strings of ${n} bracket pairs, binary trees with ${n} nodes, and triangulations of a ${n + 2}-gon.`;
      steps.push({line: 4, note: msg, vars: {[`C[${n}]`]: C[n]}, vis: vis(n), result: msg});
      return steps;
    }
  };

  /* Lecture 10: separate chaining */
  L.chain = {
    code: ["h(k) = k mod m", "insert k: append to bucket h(k) if absent", "search k: scan only bucket h(k)", "load factor α = n / m"],
    parse: q => ({keys: ints(q.keys, "keys", 0, 9999, 14), m: one(q.m, "m", 1, 13)}),
    run({keys, m}) {
      const B = Array.from({length: m}, () => []), steps = [];
      let n = 0;
      const vis = cur => `<div class="f-buckets">${B.map((b, i) => `<div class="f-bucket ${i === cur ? "current" : ""}"><span>${i}</span>${b.map(k => `<em>${k}</em>`).join("") || "<i>empty</i>"}</div>`).join("")}</div>`;
      steps.push({line: 0, note: `${m} empty buckets.`, vars: {n: 0, m, "α": 0}, vis: vis(-1)});
      for (const k of keys) {
        const h = k % m, b = B[h];
        if (b.includes(k)) { steps.push({line: 1, note: `${k} is already in bucket ${h}: a set stores it once.`, vars: {k, "h(k)": h, n}, vis: vis(h)}); continue; }
        const coll = b.length > 0;
        b.push(k); n++;
        steps.push({line: 1, note: `h(${k}) = ${k} mod ${m} = ${h}. ${coll ? `Collision: bucket ${h} already holds ${b.slice(0, -1).join(", ")}.` : "Bucket was empty."}`, vars: {k, "h(k)": h, n, "α": (n / m).toFixed(2)}, vis: vis(h)});
      }
      const longest = Math.max(...B.map(b => b.length));
      const msg = `n = ${n}, m = ${m}, α = ${(n / m).toFixed(2)}. Longest chain ${longest}: an unsuccessful search in it inspects ${longest} key(s).`;
      steps.push({line: 3, note: msg, vars: {n, m, "α": (n / m).toFixed(2), longest}, vis: vis(-1), result: msg});
      return steps;
    }
  };

  /* Lecture 11: open addressing */
  L.probe = {
    code: ["h(k) = k mod m", "for i = 0, 1, 2, …:", "  linear: (h + i) mod m;  quadratic: (h + i²) mod m", "  double: (h + i·h2(k)) mod m,  h2(k) = 7 − (k mod 7)", "  if slot is empty: place k and stop", "table full / no free slot on the probe sequence"],
    parse: q => {
      const keys = ints(q.keys, "keys", 0, 9999, 12), m = one(q.m, "m", 2, 17);
      if (!["linear", "quadratic", "double"].includes(q.mode)) fail("Choose a probing method.");
      return {keys, m, mode: q.mode};
    },
    run({keys, m, mode}) {
      const T = new Array(m).fill(null), steps = [];
      let total = 0, placed = 0;
      const pr = (k, i) => mode === "linear" ? (k % m + i) % m : mode === "quadratic" ? (k % m + i * i) % m : (k % m + i * (7 - k % 7)) % m;
      const vis = (cur, bad) => cells(T.map(x => x === null ? "·" : String(x)), (x, i) => i === cur ? "current" : bad.includes(i) ? "bad" : T[i] !== null ? "chosen" : "");
      steps.push({line: 0, note: `Empty table of ${m} slots, ${mode} probing.`, vars: {m, mode}, vis: vis(-1, [])});
      for (const k of keys) {
        const tried = [];
        let done = false;
        for (let i = 0; i < m; i++) {
          const j = pr(k, i);
          total++;
          if (T[j] === null) {
            T[j] = k; placed++; done = true;
            steps.push({line: 4, note: `Key ${k}: probe ${i} → slot ${j} is empty. Placed after ${i + 1} probe(s).`, vars: {k, i, slot: j, "total probes": total, "α": (placed / m).toFixed(2)}, vis: vis(j, tried)});
            break;
          }
          if (T[j] === k) { done = true; steps.push({line: 4, note: `Key ${k} is already in slot ${j}.`, vars: {k, slot: j}, vis: vis(j, tried)}); break; }
          tried.push(j);
          steps.push({line: mode === "double" ? 3 : 2, note: `Key ${k}: probe ${i} → slot ${j} holds ${T[j]} (collision).`, vars: {k, i, slot: j, "total probes": total}, vis: vis(j, tried)});
        }
        if (!done) steps.push({line: 5, note: `Key ${k} could not be placed: its probe sequence never reached a free slot.${mode === "quadratic" ? " Quadratic probing may visit only part of the table." : ""}`, vars: {k, "total probes": total}, vis: vis(-1, tried)});
      }
      const msg = `Placed ${placed} of ${keys.length} keys with ${total} probes in total. Load factor α = ${(placed / m).toFixed(2)}.`;
      steps.push({line: 5, note: msg, vars: {placed, "total probes": total, "α": (placed / m).toFixed(2)}, vis: vis(-1, []), result: msg});
      return steps;
    }
  };
})();
