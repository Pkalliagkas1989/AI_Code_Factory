# Mark all as done button

> Feature: Next to that counter, add a "Mark all as done" button that ticks every active todo at once; it is disabled when there are no active todos

## Context
- "That counter" is the items-left counter `<p id="count" aria-live="polite">` in the `<footer>` of `src/index.html`, filled in `render()` in `src/app.js` via `itemsLeftLabel(todos)` (added by job 003, the base branch).
- The footer (`src/styles.css` line 44) is `display: flex; justify-content: space-between`, so a new direct child of the footer would be pushed away from the counter, not sit next to it.
- Existing pattern to copy: the "Clear completed" button. It is a `<button type="button" id="clear-completed" class="quiet">` in `index.html`; `app.js` looks it up once, sets `clearButton.disabled = ...` in `render()`, and its click handler calls `update(clearCompleted(todos))`. `.quiet` and `.quiet:disabled` styles already exist in `src/styles.css`.
- List logic lives in `src/todos.js` as pure, non-mutating functions; each is tested in `test/todos.test.js` (Node's `node:test`, run with `npm test`). `remaining(todos)` already counts active todos.
- Decided by the human (config, 2026-10-25): todos stay in localStorage only. This feature only uses the existing `update()` save path.

## Requirements
1. Add a pure function `completeAll(todos)` to `src/todos.js` that returns a new array where every todo has `done: true`, keeping `id` and `text` unchanged, and never mutates its input. Add it to the import lists in `src/app.js` and `test/todos.test.js`.
2. Add tests in `test/todos.test.js` for `completeAll`: a mix of active and done todos all come back done with the same ids and texts; the input array and its objects are not mutated; an empty list returns an empty array.
3. Add a `<button type="button" id="complete-all" class="quiet">Mark all as done</button>` in `src/index.html`, placed visually right next to `#count` (for example, wrap `#count` and the button in one footer child such as `<div class="status">` laid out with `display: flex; align-items: center; gap: ...` using the existing `--space` variable). Keep `#count`'s `id` and `aria-live` unchanged.
4. In `src/app.js`, look the button up once at the top like `clearButton`, wire its click to `update(completeAll(todos))`, and in `render()` set its `disabled` to `remaining(todos) === 0`.
5. The button ticks every active todo regardless of the current filter (All / Active / Completed), and the result is saved to localStorage through `update()`.
6. Any new CSS uses only the existing CSS variables, so dark mode keeps working. Reuse the `.quiet` class for the button's look and its disabled state.

## Acceptance criteria
1. `npm test` passes, including the new `completeAll` tests.
2. `grep -n "export function completeAll" src/todos.js` finds one match, and `grep -n "completeAll" test/todos.test.js` finds the import and at least one test.
3. Run `npm run dev -- 8004` and open `http://localhost:8004/index.html` with empty localStorage: the "Mark all as done" button appears directly beside the "0 items left" counter and is disabled. The browser console shows no errors.
4. Add three todos and tick one: the button is enabled. Click it: all three checkboxes are ticked, the counter reads "0 items left", and the button becomes disabled.
5. Reload the page after step 4: all three todos are still ticked (saved to localStorage) and the button is still disabled.
6. Untick one todo, switch to the "Completed" filter, and click "Mark all as done": switching back to "All" shows all todos ticked.
7. The button can be reached with Tab and activated with Enter or Space when enabled; when disabled it is skipped by Tab.
8. With the OS in dark mode, the button and counter stay readable and match the "Clear completed" button's style.

## Out of scope
- A toggle that un-ticks everything when all are done (the request is one-way "mark all as done").
- A confirmation dialog, undo, or keyboard shortcut.
- Changing the counter wording, filters, "Clear completed", or the footer's other layout.
- Any change to `.claude/` or `factory/`.

## Assumptions
- One-way action, not a toggle: the request says "ticks every active todo" and "disabled when there are no active todos", which rules out an un-tick mode.
- It acts on all todos, not just those visible under the current filter: "every active todo" refers to the list's state, not the view.
- The button uses the low-emphasis `.quiet` style like "Clear completed": both are bulk footer actions, so they should look alike.
- Button text is exactly "Mark all as done", taken from the request.
