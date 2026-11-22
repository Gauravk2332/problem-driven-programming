# Default lecture development standard

Applies to the entire Problem Driven Programming (R1UC544B) repository. The course owner's approved reference is **the Claude-enhanced Lecture 19**, as inspected on 22 November 2026. Use the current reference pages and shared assets as the starting point for each new lecture. Do not revert established functionality or replace the approved presentation with an earlier layout.

## Reference implementation

- `lectures/19.html`: Class view (reference blob `16a597da126c9665df05defeef0312ab20b8af9e` at adoption).
- `lectures/19-study.html`: Study mode (reference blob `12af440ae4fd9b6e6c4a860f646897943bb9f128`).
- `lectures/19-revision.html`: printable revision sheet (reference blob `1b7fd2300749261aa5a3807220659049cb322769`).
- `tools/make_index.py`: source of truth for the generated homepage/roadmap, with static links.
- `assets/`: inspect current shared components before adding new ones. `sw.js`: versioned offline package.

The blob IDs record the approved baseline, not immutable dependency pins. Preserve subsequent improvements. Read these files directly before authoring; do not infer the standard from filenames or old assistant summaries.

## Non-negotiable teaching philosophy

Start with a concrete, attemptable problem; allow discovery of the limitation or pattern; develop intuition; introduce accurate definitions and formal reasoning; derive the algorithm; connect recurrence/logic to implementation; analyse time and auxiliary space; then practise and revise. Prefer a few coherent examples over disconnected theory. Keep the content undergraduate-appropriate and syllabus-aligned. Optional advanced detail should be clearly separated from essential delivery. Never add arbitrary lecture duration labels or reserve blank page space for handwriting.

## Three deliverables per published lecture

### 1. Class view — `lectures/NN.html`

Use Lecture 19's compact academic interface, persistent Class view / Study links, headings, section navigation, Present / All sections layout switch and diagram focus controls. Preserve classroom pen/highlighter/eraser/shapes/laser, undo/redo, local annotations, and continuous whiteboard with adjustable split view, pan, zoom, paper selection and export. Use the current workspace and board assets rather than reimplementing older paginated boards.

The approved structure is problem and objectives → visual discovery → formal properties/correctness → worked examples → how to recognize/apply the technique → from recurrence or algorithm design to code → practice → exam practice → summary/references. Adapt the exact section count, titles and examples to the topic; do not copy Fibonacci into unrelated lectures.

Explain why an approach works, and distinguish relevant alternatives with a counterexample when appropriate. Give editable inputs, step controls, synchronized pseudocode/live state/dependency highlighting where useful. Include classroom-ready questions with hidden solutions. Use the compact top bar; less frequent controls belong in menus.

### 2. Study mode — `lectures/NN-study.html`

Default student destination on the course homepage. Write a separate learning narrative, not a duplicate of Class view: prerequisite recap, familiar problem, plain-language intuition, guided visual exploration, formal concepts, explanation of why each step is needed, code, recognizing the technique, common confusions, basic-to-challenging practice, mastery check, and exam revision. Preserve the student-focused, responsive chapter navigation and local completion/resume features. Reuse the same verified algorithm implementations and consistent worked-example data in both modes.

Provide hints and feedback that explain why an answer is correct or incorrect. Where a table/trace is central, let the student construct it independently, not merely watch a solution. Do not equate self-marked completion with measured mastery. Use the assessment component appropriately for the actual item count.

### 3. Revision sheet — `lectures/NN-revision.html`

Follow Lecture 19's concise A4 print/save-as-PDF design: definitions, formulas/algorithm rules, complexity, one or more representative worked examples, distinctions, common mistakes and full-marks answer guidance. Link back to both lecture modes. Verify the actual printed output fits without clipping; if essential material needs more space, allow another page rather than hiding it. This companion is not a third replacement for Study or Class view.

## Code, practice and assessment

- Include runnable, equivalent C++, Java and Python examples for the algorithms taught, with language tabs and Copy using `assets/code.css` / `assets/code.js`. Show the connection from state/recurrence (or algorithm logic) to code and complexity; include annotated sample output and relevant constraints, overflow/impossible-case notes. A language selection should remain consistent across examples. For conceptual lectures, choose relevant illustrative code, not unrelated implementations.
- Include a mix of conceptual, numerical, trace/table, algorithm-selection and independent problem-solving activities. Include relevant verified external judge links (e.g. LeetCode/CSES), clearly matched to prerequisite level and topic; do not suggest the website executes code when it only displays/copies it.
- Include exam practice grouped into 2-, 5-, and 10-mark questions where appropriate, with model answers, mark allocation and worked reasoning. Lecture 19 uses five short, three medium and two long questions; treat this as a useful baseline, not a mandatory fixed count or official exam prediction. Keep exam questions aligned to the syllabus.
- Use the existing `.code-tabs` / `.code-pane` components and practice styles. The current `table-check.js` specifically handles minimum-coin tables using `data-answers`, `data-coins`, and `input[data-cell]`; do not blindly reuse its coin-specific hint logic for unrelated DP tables. Extend or parameterize shared code only as needed.
- Cite reliable university/course materials and authoritative programming resources; write original explanations and diagrams. Respect source boundaries and do not invent references.

## Publishing and compatibility

1. Inspect the approved Lecture 19 pages and the current shared assets.
2. Create all three topic-specific pages and appropriate visualization code. Keep shared layout and functionality shared, avoiding copied algorithm logic between modes.
3. Register all three pages in the static roadmap generator `tools/make_index.py` (currently `PUBLISHED` plus the corresponding revision link), regenerate `index.html`; do not treat generated HTML as its own source of truth. Ensure new links and homepage featured content are correct.
4. Add the three pages and all versioned local dependencies to the offline pack. Inspect the current service worker and per-lecture save messaging, which still refer to Lecture 19; generalize consistently when adding more lectures rather than claiming that saving a new lecture works automatically. Bump cache/asset versions as needed while keeping safe fallback behavior.
5. Preserve existing annotation/progress storage keys and stable section IDs when possible. Append compatible content at a section's end; for layout-changing revisions use a new content revision and preserve/export earlier ink rather than overlaying it onto unrelated text. Retain migrated whiteboard data. Keep saved language preference.
6. Do not add accounts, tracking, paid dependencies, or a backend without explicit approval. Use mobile-friendly, keyboard-accessible semantic controls and descriptive labels; maintain the compact visual design.

## Release quality gate

- Check syllabus scope, source accuracy, all numerical examples, recurrence/base cases, complexity and answer keys independently. Test runnable code with representative edge cases in each language; report if a compiler is unavailable.
- Check all three pages for unique IDs, script/DOM references, cross-links, asset references, no timing labels, and consistent shared examples. Exercise the animation and practice logic including boundary, unreachable or tie cases where relevant.
- Test mode switching, navigation, assessment feedback, code tabs and copy, offline pack completeness, and regression of shared drawing/whiteboard controls. Check desktop/projector/mobile layout and keyboard access. Verify print rendering of the revision sheet.
- Distinguish simulated unit/DOM tests, actual browser interaction, physical stylus testing, and offline-disconnected testing. Verify the public GitHub Pages deployment separately from commits. Do not claim a test or deployment passed without evidence; clearly disclose outstanding checks.
- Keep Lecture 19 as the reference template, not a mandate to inflate every lecture. Maintain quality and topic-specific educational judgment.

## Scope of this adoption

This document records the approved current revision as the default for future development. It is not an instruction to rewrite Lecture 19 or publish other lectures without a content request. If the course owner approves a newer standard, update these instructions and the README accordingly.
