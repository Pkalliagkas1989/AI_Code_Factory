# Edit a todo's text by double-clicking it

> Feature: Let people edit a todo's text by double-clicking it. Enter or clicking away saves, Escape cancels, and saving empty text deletes the todo.

## Context
- `src/app.js` `render()` builds each `<li>` from scratch on every `update()`: a checkbox (`id="todo-<id>"`), a `<label htmlFor=checkbox>` showing `t.text` via `textContent`, and a `.delete` button. `update(next)` saves to localStorage and re-renders.
- `src/todos.js` holds pure list functions (`addTodo`, `toggleTodo`, `removeTodo`, ...) that return new arrays; `addTodo` trims text and ignores empty text. Each has a test in `test/todos.test.js` (Node's `node:test`).
- `src/styles.css` styles `li`, `label`, `form input` with the `:root` tokens (`--surface`, `--border`, `--text`, `--radius`, `--space`), with a dark-mode override block.
- Gotcha: the label is tied to the checkbox, so each click of a double-click toggles the todo, and the first toggle re-renders the list (replacing the label) before `dblclick` fires. The builder must make sure a double-click opens the editor and leaves `done` unchanged.

## Requirements
1. Add a pure function `editTodo(todos, id, text)` to `src/todos.js`: it trims `text`; if the trimmed text is empty it returns the list without that todo; otherwise it returns a new array where that todo's `text` is the trimmed text (other fields and other todos unchanged). Never mutates the input. Unknown `id` returns an equal copy.
2. Add tests for `editTodo` to `test/todos.test.js`: updates and trims text, empty or whitespace-only text removes the todo, does not mutate its input, other todos untouched.
3. In `src/app.js`, double-clicking a todo's text replaces the label with a text `<input>` pre-filled with the current text, focused, with the text selected. It has an accessible name (e.g. `aria-label="Edit <text>"`, set as an attribute, not via `innerHTML`).
4. While editing: Enter saves; blur (clicking away) saves; Escape cancels and restores the original text without saving. Saving goes through `update(editTodo(todos, id, input.value))`, so empty text deletes the todo and the change persists in localStorage.
5. Each edit commits at most once: Enter followed by the blur caused by re-rendering must not save twice, and Escape must not be followed by a save from the resulting blur.
6. Double-clicking the text must not change the todo's done state (see the gotcha in Context). A single click on the text still toggles the checkbox as today.
7. User text goes into the page only via `textContent` / `value` / `setAttribute`, never `innerHTML`.
8. Style the edit input in `src/styles.css` using only existing CSS variables, so it fits the row (fills the label's space) and looks right in light and dark mode.
9. Follow the code style in `CLAUDE.md` (no semicolons, single quotes, 2-space indent). No new dependencies.

## Acceptance criteria
1. `npm test` passes, and `test/todos.test.js` contains tests that call `editTodo` covering: text updated and trimmed, empty/whitespace text removes the todo, input not mutated.
2. `grep -n "export function editTodo" src/todos.js` finds the function; `grep -n innerHTML src/app.js` finds nothing.
3. Run `npm run dev -- 8123`, open `http://localhost:8123/index.html`, add "Buy milk". Double-click the text: a focused text field appears with "Buy milk" selected, and the checkbox is still unticked. Same check on a ticked todo: it stays ticked.
4. Change the text to "Buy oat milk" and press Enter: the row shows "Buy oat milk". Reload the page: it still shows "Buy oat milk".
5. Double-click, type "Call mum", then click elsewhere on the page: the row shows "Call mum" and it survives a reload.
6. Double-click, type something, press Escape: the row shows the old text, and it is unchanged after reload.
7. Double-click, clear the field (or type only spaces), press Enter: the todo is gone, the "items left" count drops by one, and it stays gone after reload. Same result when clicking away instead of pressing Enter.
8. After pressing Enter or Escape, localStorage `todos` was written once per edit at most (no duplicate or lost edits); the browser console shows no errors during any of the above.
9. A single click on a todo's text still toggles it done/undone.
10. With the OS/browser in dark mode, the edit field uses the dark surface and text colours (no white box on dark background).

## Out of scope
- Editing via keyboard shortcut or an edit button (only double-click was asked for).
- Editing anything besides the text (done state, order).
- Undo, edit history, or confirmation before deleting via empty text.
- Changes to `.claude/` or `factory/`, or to `CLAUDE.md`.

## Assumptions
- Text is trimmed on save, matching `addTodo`; reason: consistent with existing add behaviour.
- Saving unchanged text is a no-op in effect (writing the same value is fine); reason: simplest correct behaviour.
- No keyboard-only way to start editing is added; reason: the request names double-click only. The UX reviewer may raise this; the approver can decide whether to add it in a follow-up.
- No `CLAUDE.md` update is needed; its layout and conventions still describe the project after this change.
