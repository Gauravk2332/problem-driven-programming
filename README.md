# Problem Driven Programming (R1UC544B)

Course companion site: https://gauravk2332.github.io/problem-driven-programming/

Each lecture starts with a concrete problem, lets students discover the technique
through interactive labs, and then gives the theory, code in C++/Java/Python,
practice and revision material. Every published lecture has two learning modes and a revision companion:

- **Study mode** (`lectures/NN-study.html`): self-paced chapters, checks with
  feedback, a mastery test, progress saved in the browser, offline copy.
- **Class view** (`lectures/NN.html`): the lecture as presented, with
  section-by-section navigation, pen and whiteboard, and an option to hide
  answers for self-testing.
- **Revision sheet** (`lectures/NN-revision.html`): concise printable A4
  exam preparation, formulas, worked examples, and answer-writing guidance.

## Approved default

The current Claude-enhanced Lecture 19 is the approved reference for all future
lectures. Follow [AGENTS.md](AGENTS.md) for the content standard, reusable UI,
code and practice components, and release quality gate. Do not replace the
reference with older lecture layouts.

## Structure

```
index.html            homepage (generated, see below)
lectures/19.html      Lecture 19, Class view
lectures/19-study.html Lecture 19, Study mode
lectures/19-revision.html Lecture 19, revision sheet
AGENTS.md            approved lecture authoring and quality standard
assets/               shared CSS/JS (labs, ink, study progress, code tabs)
sw.js                 service worker for the offline lecture pack
tools/make_index.py   source of truth for the lecture list
```

## Publishing a new lecture

1. Add `lectures/NN.html`, `lectures/NN-study.html` and
   `lectures/NN-revision.html`. Follow the approved standard in `AGENTS.md`.
2. In `tools/make_index.py`, add the lecture to `PUBLISHED`, then run
   `python3 tools/make_index.py .` to regenerate `index.html`.
   The roadmap is plain HTML, so it works without JavaScript and is indexable.
3. Add the new pages and versioned assets to `FILES` in `sw.js`, generalize
   the save messaging for new lectures as needed, and bump `CACHE`.
4. Run the quality checks in `AGENTS.md` and verify public deployment.

## Code blocks

Wrap each language in a `.code-pane` inside a `.code-tabs` block
(`data-lang` and `data-label` attributes) and include `assets/code.css` and
`assets/code.js`. The chosen language is remembered across the site. Without
JavaScript all languages are shown one after another.

## Adding content to Class view

Add new material at the **end** of a section. This keeps students' saved
pen annotations aligned with the text above it.
