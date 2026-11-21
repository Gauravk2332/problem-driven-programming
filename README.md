# Problem Driven Programming (R1UC544B)

Course companion site: https://gauravk2332.github.io/problem-driven-programming/

Each lecture starts with a concrete problem, lets students discover the technique
through interactive labs, and then gives the theory, code in C++/Java/Python,
practice and revision material. Every lecture has two pages:

- **Study mode** (`lectures/NN-study.html`): self-paced chapters, checks with
  feedback, a mastery test, progress saved in the browser, offline copy.
- **Teach mode** (`lectures/NN.html`): presentation, pen and whiteboard,
  exam mode that hides answers, and teacher notes (timings, prompts, expected
  mistakes, board plan) that are hidden while presenting.

## Structure

```
index.html            homepage (generated, see below)
lectures/19.html      Lecture 19, Teach mode
lectures/19-study.html Lecture 19, Study mode
assets/               shared CSS/JS (labs, ink, study progress, code tabs)
sw.js                 service worker for the offline lecture pack
tools/make_index.py   source of truth for the lecture list
```

## Publishing a new lecture

1. Add `lectures/NN.html` and `lectures/NN-study.html`.
2. In `tools/make_index.py`, add the lecture to `PUBLISHED`, then run
   `python3 tools/make_index.py .` to regenerate `index.html`.
   The roadmap is plain HTML, so it works without JavaScript and is indexable.
3. Add the new files to `FILES` in `sw.js` and bump `CACHE`.

## Code blocks

Wrap each language in a `.code-pane` inside a `.code-tabs` block
(`data-lang` and `data-label` attributes) and include `assets/code.css` and
`assets/code.js`. The chosen language is remembered across the site. Without
JavaScript all languages are shown one after another.

## Teacher notes

Add `<details class="teacher-note">` as the **last** element of a Teach-mode
section. Putting new content at the end of a section keeps students' saved
pen annotations aligned with the text above it.
