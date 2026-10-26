# Several named todo lists

> Feature: Let people keep several named todo lists. A list switcher above the input shows every list and which one is open; people can add a list (name required, trimmed, at most 40 characters, unique ignoring case), rename it with the same rules, and delete it after a confirmation, but never the last list. Each list keeps its own todos; the filters, the items-left counter, "Mark all as done" and "Clear completed" act on the open list only. The app reopens the last open list after a reload. Todos saved before this change move into a list called "My todos" without losing any.

## Context
- `src/todos.js`: pure functions on one todo array (`addTodo`, `toggleTodo`, `removeTodo`, `remaining`, `itemsLeftLabel`, `filterTodos`, `clearCompleted`, `completeAll`, `editTodo`). Ids are `max + 1` (see `addTodo`). Everything returns new arrays.
- `src/app.js`: holds `todos` and `filter` in module state; `load()` reads `localStorage['todos']` (a JSON array of `{ id, text, done }`, falls back to `[]` on bad JSON); `update(next)` saves and calls `render()`. All footer buttons call `update(fn(todos))`.
- `src/index.html`: `h1`, then `form#new-todo`, `ul#list`, `footer` with `#count`, `#complete-all`, `.filters` (buttons with `aria-pressed`), `#clear-completed`.
- `src/styles.css`: tokens on `:root` with a dark-mode override; `.filter[aria-pressed="true"]` and `.quiet` are the existing small-button styles.
- `test/todos.test.js`: `node:test` + `node:assert/strict`, one `test()` per behaviour, including "does not mutate" checks.
- Decided by the human (config): todos stay in this browser only (localStorage); no accounts, sync or server.

## Requirements
1. **Data model.** A list is `{ id, name, todos }` where `todos` is the existing todo array. App state is the array of lists plus the id of the open list. List ids are numbers given as `max + 1`, like todo ids.
2. **Pure list logic in `src/todos.js`**, no DOM or storage, never mutating input. At minimum:
   - name validation: trims, rejects empty, rejects more than 40 characters (after trimming, measured with `.length`), rejects a name equal to another list's name ignoring case (`toLowerCase()` on both trimmed names). When renaming, the list's own current name does not count as a clash (so changing only its case is allowed). Returns which rule failed (or nothing) so the UI can show a message.
   - add a list (returns lists with the new list appended, trimmed name, empty todos; unchanged lists if the name is invalid);
   - rename a list (same rules; unchanged if invalid);
   - remove a list (returns lists unchanged if it is the last one);
   - replace the todos of one list by id;
   - build the initial state from the raw stored values (see 6 and 7), including picking the open list.
   Each new function gets tests in `test/todos.test.js` following the existing style, including a no-mutation test.
3. **Switcher UI** in `src/index.html`, between the `h1` and `form#new-todo`: one button per list showing its name (via `textContent`), the open list marked with `aria-pressed="true"` (others `"false"`), in a group with an accessible label (e.g. `role="group" aria-label="Lists"`), plus controls to add a list, rename the open list and delete the open list. Clicking a list button opens that list.
4. **Add / rename.** Use an inline text field (with a visible or visually-hidden label, `maxlength="40"`), not `window.prompt`. Enter or a submit button saves; Escape cancels. When a rule fails, nothing is saved, the field stays open, and a short message saying which rule failed is shown in an element with `aria-live="polite"` via `textContent`. A newly added list becomes the open list. Renaming keeps the same list open and its todos unchanged.
5. **Delete.** Deleting the open list asks with `window.confirm` naming the list; Cancel changes nothing. On OK the list and its todos are removed and the first remaining list opens. When only one list exists, the delete control is `disabled`.
6. **Per-list scope.** Adding, toggling, editing and deleting todos, the filters, `#count`, "Mark all as done" and "Clear completed" (including their disabled states) all use only the open list's todos. The selected filter stays as it is when switching lists.
7. **Storage.** Save lists and the open list id in localStorage under a new key (e.g. `todoLists`) on every change, including switching lists, using the existing try/catch pattern. On load, if the new key holds valid data, use it and open the saved list id; if that id no longer exists or is missing, open the first list. Invalid JSON or a wrong shape is treated as "no new data".
8. **Migration.** When there is no valid new data, create one list named `My todos` containing every todo from the old `todos` key unchanged (same ids, text, done), or an empty `My todos` if that key is missing, empty or invalid. Do not delete or rewrite the old `todos` key.
9. **Style** in `src/styles.css` only through existing CSS variables; reuse the `.filter`/`.quiet` look for list buttons where it fits; works in light and dark mode and at the 480px max width with long (40-character) names wrapping or truncating without breaking the layout.
10. **Docs.** Update the `src/app.js` / `src/todos.js` lines under Layout in `CLAUDE.md` to mention named lists and the storage key(s). Do not touch `.claude/` or `factory/`.
11. Follow the code conventions in `CLAUDE.md` (no semicolons, single quotes, 2-space indent, no dependencies, user text via `textContent` only).

## Acceptance criteria
1. `cd <worktree> && npm test` passes, and `test/todos.test.js` contains tests for each new function in `src/todos.js` (validation: empty, spaces only, 41 chars rejected, 40 chars accepted, duplicate in another case rejected, own name in another case accepted on rename; remove refuses last list; initial state from old data and from bad JSON; no mutation).
2. `grep -n innerHTML src/*.js` prints nothing.
3. With `localStorage` set to only `todos = [{"id":1,"text":"a","done":false},{"id":2,"text":"b","done":true}]` (DevTools > Application), reloading `npm run dev -- 8000` at `http://localhost:8000/index.html` shows one list `My todos` pressed, with both todos and "1 item left"; the `todos` key is still present.
4. With empty localStorage, the page loads with one empty list `My todos` and no console errors.
5. Adding a list named `  Work  ` creates `Work` and opens it with an empty list; adding `work`, an empty name, or a 41-character name (pasted) is refused with a visible message and no new list.
6. Renaming `Work` to `WORK` succeeds; renaming it to `my todos` is refused with a message.
7. Todos added in `Work` do not appear in `My todos`, and back. With a filter on Active, switching lists keeps Active selected and shows only the open list's active todos. `#count`, "Mark all as done" and "Clear completed" change only the open list.
8. Delete on `Work` shows a confirm naming `Work`; Cancel keeps it; OK removes it and opens `My todos`. With one list left, the delete control is disabled.
9. Opening `Work`, then reloading, reopens `Work` with its todos.
10. A list named `<b>x</b>` shows those characters literally in the switcher.
11. With the OS in dark mode, the switcher and name field use the dark colours; no hard-coded colours are added to `src/styles.css` (`git diff src/styles.css` shows no new hex values).
12. `git diff --stat factory/004-mark-all-done` lists only files under `src/`, `test/` and `CLAUDE.md`.

## Out of scope
- Reordering lists, drag and drop, moving todos between lists, list colours or icons.
- Per-list remembered filters, undo for deletes, keyboard shortcuts beyond Enter/Escape in the name field.
- Removing the old `todos` key, export/import, sync of any kind.
- Restyling existing parts of the page beyond what is needed to fit the switcher.

## Assumptions
- New storage key alongside the old one, which is left untouched: no data can be lost if the first save fails. Cost: stale copy stays in localStorage.
- 40 characters means JavaScript `.length` after trimming; matches `maxlength` and is simplest.
- After deleting the open list the first remaining list opens: predictable and simple.
- The filter is page-level and kept across list switches: the request only says filters act on the open list.
- Exact wording of the validation messages and the confirm text is public copy; the builder writes short plain sentences and the approver may want to check them.
- `window.confirm` is acceptable as the confirmation: it is native, accessible and needs no new UI.
- This is a medium-size change (new storage format plus migration of saved user data); the approver may want to look closely at items 7 and 8.
