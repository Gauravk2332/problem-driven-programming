"""Generate index.html with a static, crawlable lecture roadmap.

Usage: python3 make_index.py <repo-dir>
The lecture data lives here (single source); site.js only filters the
rendered list, so the roadmap works without JavaScript.
"""
import html
import sys
from pathlib import Path

PUBLISHED = {19: ("lectures/19-study.html", "lectures/19.html")}

MODULES = [
    ("Algorithm Foundations", [
        (1, "Algorithm Fundamentals", "Characteristics of algorithms; design paradigms"),
        (2, "Time and Space Complexity", "Best, average and worst cases"),
        (3, "Asymptotic Analysis", "Big-O, Omega and Theta"),
        (4, "Recurrence Relations", "Master Theorem"),
        (5, "Algorithm Design Strategies", "Divide and conquer; introduction to greedy and DP"),
    ]),
    ("Mathematical Algorithms", [
        (6, "Prime Numbers and Sieve", "Sieve of Eratosthenes"),
        (7, "Euclidean Algorithm", "GCD and HCF"),
        (8, "Modular Arithmetic", "Modular inverse; binary exponentiation"),
        (9, "Catalan Numbers", "Pigeonhole principle"),
    ]),
    ("Hashing", [
        (10, "Hashing Techniques", "Hash functions, maps and sets"),
        (11, "Collision Handling", "Resolution techniques; load factor; rehashing"),
    ]),
    ("Greedy Algorithms", [
        (12, "Greedy Strategy", "Greedy-choice property; optimal substructure"),
        (13, "Designing Greedy Algorithms", "Greedy problems"),
        (14, "Activity Selection", "Interval scheduling"),
        (15, "Job Sequencing with Deadlines", "Maximum-profit scheduling"),
        (16, "Priority Queue Based Greedy Algorithms", "Priority queues and greedy decisions"),
        (17, "Greedy Scheduling Algorithms", "Scheduling strategies"),
        (18, "Greedy Performance and Correctness", "Proof, complexity and applications"),
    ]),
    ("Dynamic Programming and Integrated Problem Solving", [
        (19, "Dynamic Programming Fundamentals", "Overlapping subproblems; principle of optimality; identifying DP"),
        (20, "DP Solution Design", "Memoization; tabulation; states; transitions; space reduction"),
        (21, "0/1 Knapsack", "Include/exclude decisions; DP table"),
        (22, "Unbounded Knapsack and Coin Change", "Repeated selection; minimum coins; counting combinations"),
        (23, "Subset Sum", "Boolean DP; equal sum partition"),
        (24, "Longest Increasing Subsequence", "Sequence-based DP"),
        (25, "Edit Distance", "String transformations; two-dimensional DP"),
        (26, "Advanced DP Techniques", "Partition DP; bitmask DP; digit DP"),
        (27, "Integrated Problem Solving", "Algorithm selection; optimization; fast I/O; debugging"),
    ]),
]

e = html.escape


def catalog():
    out = []
    for i, (title, lessons) in enumerate(MODULES, 1):
        first, last = lessons[0][0], lessons[-1][0]
        rng = f"Lectures {first:02d}–{last:02d}" if first != last else f"Lecture {first:02d}"
        live = sum(1 for l in lessons if l[0] in PUBLISHED)
        status = f"{live} published" if live else "coming"
        is_open = " open" if live else ""
        out.append(
            f'<details class="module" data-module="{i}"{is_open}><summary><span>'
            f'Module {i:02d} · {e(title)}<small>{rng} · {len(lessons)} lectures · {status}</small>'
            f'</span></summary><ol class="lesson-list">'
        )
        for num, name, topics in lessons:
            search = e(f"{num} {name} {topics} {title}".lower())
            if num in PUBLISHED:
                study, teach = PUBLISHED[num]
                out.append(
                    f'<li class="lesson published" data-search="{search}">'
                    f'<span class="lesson-code">{num:02d}</span><div class="lesson-body">'
                    f'<strong><a href="{study}">{e(name)}</a></strong><span>{e(topics)}</span></div>'
                    f'<div class="actions"><a class="tag focus" href="{study}">Study</a>'
                    f'<a class="tag" href="{teach}">Class view</a><a class="tag" href="lectures/{num}-revision.html">Revision sheet</a></div></li>'
                )
            else:
                out.append(
                    f'<li class="lesson" data-search="{search}">'
                    f'<span class="lesson-code">{num:02d}</span><div class="lesson-body">'
                    f'<strong>{e(name)}</strong><span>{e(topics)}</span></div>'
                    f'<span class="tag">Coming</span></li>'
                )
        out.append("</ol></details>")
    return "".join(out)


def module_options():
    return "".join(
        f'<option value="{i}">Module {i:02d} · {e(t)}</option>' for i, (t, _) in enumerate(MODULES, 1)
    )


TOTAL = sum(len(l) for _, l in MODULES)
LIVE = len(PUBLISHED)

HERO_SVG = Path(__file__).with_name("hero.svg").read_text().strip()

PAGE = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Problem Driven Programming (R1UC544B): problem-first interactive lectures on algorithms, greedy methods and dynamic programming, for self-study and revision.">
<title>Problem Driven Programming · R1UC544B</title>
<link rel="stylesheet" href="assets/site.css?v=2"><script src="assets/site.js?v=2" defer></script></head>
<body><a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap nav"><a class="brand" href="#home"><span>DP</span><span>Problem Driven Programming<small>R1UC544B · COURSE COMPANION</small></span></a>
<nav class="navlinks" aria-label="Main navigation"><a href="#lectures">Lectures</a><a href="#format">How a lecture works</a><a href="#lab">Try it</a><a href="#resources">Resources</a><a class="nav-cta" href="lectures/19-study.html">Open Lecture 19</a></nav></div></header>
<main id="main">
<div class="hero" id="home"><div class="wrap hero-grid"><div>
<p class="kicker">R1UC544B · Problem Driven Programming</p>
<h1>Start with a problem.<br>Discover the algorithm.</h1>
<p>Each lecture opens with a concrete problem you can attempt on paper, lets you find the technique by trying it, and only then states the theory, the code and the complexity. It covers the R1UC544B syllabus from algorithm analysis to dynamic programming.</p>
<p class="hero-meta">You need: one programming language (C++, Java or Python), arrays, functions and basic recursion.</p>
<div class="actions"><a class="btn" href="lectures/19-study.html">Study Lecture 19 →</a><a class="btn secondary" href="lectures/19.html">Lecture 19 class view</a></div></div>
<div class="visual">{HERO_SVG}<div class="visual-caption">From Lecture 19: the same subproblem, F(3), solved twice.</div></div></div></div>
<div class="stats"><div class="wrap stat-grid">
<div class="stat"><strong>{LIVE} of {TOTAL}</strong><span>Lectures published</span></div>
<div class="stat"><strong>{len(MODULES)}</strong><span>Syllabus modules</span></div>
<div class="stat"><strong>2</strong><span>Ways to learn each lecture: Study and Class view</span></div></div></div>
<div class="wrap">
<section id="lectures" aria-labelledby="lectures-h"><p class="kicker">01 / Course roadmap</p><h2 id="lectures-h">All 27 lectures</h2>
<p class="section-intro">Lectures 01–18 follow the existing course outline. Lectures 19–27 group the dynamic programming topics into one sequence. Lectures are published one at a time; anything marked “Coming” has no page yet.</p>
<div class="filters" id="filters" hidden><label for="search">Search</label><input type="search" id="search" placeholder="knapsack, hashing, complexity…"><label for="module-filter">Module</label><select id="module-filter"><option value="all">All modules</option>{module_options()}</select></div>
<p class="result-count" id="result-count" aria-live="polite"></p>
<div id="catalog">{catalog()}</div><p class="empty" id="catalog-empty" hidden>No matching lectures. Try another keyword.</p></section>
<section id="format" aria-labelledby="format-h"><p class="kicker">02 / How a lecture works</p><h2 id="format-h">One problem, six steps</h2>
<p class="section-intro">Every published lecture follows the same order, so students always know what comes next. Lecture 19 uses climbing stairs, Fibonacci, coin change and shortest paths as its problems.</p>
<ol class="flow">
<li class="card"><span class="number">01</span><h3>Problem</h3><p>A concrete question to try before any definition.</p></li>
<li class="card"><span class="number">02</span><h3>Discover</h3><p>Brute force first, then an interactive lab shows where it wastes work.</p></li>
<li class="card"><span class="number">03</span><h3>Formalize</h3><p>Definitions, recurrences and proofs in exam language.</p></li>
<li class="card"><span class="number">04</span><h3>Code</h3><p>The same idea in C++, Java and Python, plus judge problems to submit.</p></li>
<li class="card"><span class="number">05</span><h3>Practice</h3><p>Graded questions with hints and revealable solutions.</p></li>
<li class="card"><span class="number">06</span><h3>Revise</h3><p>Glossary, formula sheet and exam-style prompts.</p></li></ol>
<div class="modes">
<article class="card"><span class="tag focus">Study</span><h3>Learn at your own pace</h3><p>One chapter at a time, quick checks with feedback, a six-question mastery test, progress saved in your browser and an offline copy. No account needed.</p></article>
<article class="card"><span class="tag">Class view</span><h3>Revise what was shown in class</h3><p>The full lecture as presented, one section at a time. Write on it with the pen or whiteboard (saved only in your browser) and hide the answers to test yourself.</p></article></div></section>
<section id="lab" aria-labelledby="lab-h"><p class="kicker">03 / Try it</p><h2 id="lab-h">Build Fibonacci from stored answers</h2>
<p class="section-intro">A small sample of the labs inside each lecture. Press Next and predict each value before it appears.</p>
<div class="card demo"><div><span class="tag focus">From Lecture 19</span><h3 style="margin-top:9px">Reuse the last two answers</h3><p>Start from the base cases F(0) and F(1). Each new value needs only the two values already in the table, so nothing is computed twice. Lecture 20 (coming) turns this into tabulation.</p>
<div class="demo-controls"><button id="reset" type="button">Reset</button><button id="prev" type="button">Previous</button><button class="primary" id="play" type="button" aria-pressed="false">Play</button><button id="next" type="button">Next</button></div></div>
<div><div id="cells" class="cells" aria-label="Fibonacci table"></div><p id="demo-status" class="demo-status" aria-live="polite">Enable JavaScript to step through the table.</p></div></div>
<p class="note">Lecture 19 has four full labs: a recursion tree, a bottom-up table, a work-count comparison and a greedy-versus-DP coin table. <a href="lectures/19-study.html#discover">Open the recursion tree lab</a>.</p></section>
<section id="resources" aria-labelledby="resources-h"><p class="kicker">04 / Further learning</p><h2 id="resources-h">Where to go next</h2>
<p class="section-intro">Outside resources that pair well with specific lectures. Course pages are written independently of them.</p>
<div class="cards resources">
<article class="card"><h3>VisuAlgo</h3><p>Animated recursion trees, sorting and graph algorithms. Pairs with lectures 04 and 19.</p><a href="https://visualgo.net/en/recursion" target="_blank" rel="noopener noreferrer">Open the VisuAlgo recursion tree ↗</a></article>
<article class="card"><h3>MIT 6.006 (Spring 2020)</h3><p>Lecture notes and problem sets at university level. Lectures 15–18 cover dynamic programming.</p><a href="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/" target="_blank" rel="noopener noreferrer">Open MIT 6.006 on OpenCourseWare ↗</a></article>
<article class="card"><h3>CP-Algorithms</h3><p>Precise write-ups with code for number theory, hashing and DP. Pairs with lectures 06–11 and 19–26.</p><a href="https://cp-algorithms.com/" target="_blank" rel="noopener noreferrer">Open CP-Algorithms ↗</a></article>
<article class="card"><h3>USACO Guide</h3><p>Topic-by-topic practice ladders, from easy to contest level. Good for extra DP problems.</p><a href="https://usaco.guide/gold/intro-dp" target="_blank" rel="noopener noreferrer">Open the USACO Guide DP module ↗</a></article>
<article class="card"><h3>CSES Problem Set</h3><p>Short problems with an online judge. The Dynamic Programming section matches lectures 19–25.</p><a href="https://cses.fi/problemset/" target="_blank" rel="noopener noreferrer">Open the CSES problem set ↗</a></article>
<article class="card"><h3>Algorithm Visualizer</h3><p>Write code and watch it run step by step. Useful for checking your own implementations.</p><a href="https://github.com/algorithm-visualizer/algorithm-visualizer" target="_blank" rel="noopener noreferrer">Open Algorithm Visualizer on GitHub ↗</a></article>
</div></section>
</div></main>
<footer class="footer"><div class="wrap"><span>Problem Driven Programming · R1UC544B</span><span>{LIVE} of {TOTAL} lectures published · Progress stays in your browser · No account required</span></div></footer>
</body></html>
"""

repo = Path(sys.argv[1])
(repo / "index.html").write_text(PAGE)
print("wrote", repo / "index.html", f"({LIVE}/{TOTAL} published)")
