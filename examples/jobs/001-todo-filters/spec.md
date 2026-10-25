# Todo filters and "Clear completed"

> Feature: Add filter buttons below the list to show All, Active or Completed todos, and a "Clear completed" button that removes all finished todos.

## Context
- `src/index.html`: one page with `form#new-todo`, `ul#list` and `p#count` (aria-live, "N items left").
- `src/todos.js`: pure functions (`addTodo`, `toggleTodo`, `removeTodo`, `remaining`). They return new arrays and never mutate. A todo is `{ id, text, done }`.
- `src/app.js`: holds `todos` in memory. `update(next)` saves to localStorage under `todos` and calls `render()`, which rebuilds `#list` with DOM APIs and `textContent`.
- `src/styles.css`: every colour, spacing and radius value comes from the `:root` tokens, and there is a dark-mode override. Buttons default to the accent style. `.delete` shows how to make a quieter button.
- `test/todos.test.js`: tests use `node:test`. Run them with `npm test`.
- Conventions (CLAUDE.md): logic goes in `todos.js` and DOM work in `app.js`. Every new `todos.js` function gets a test. No semicolons, single quotes, 2-space indent.

## Requirements
1. Add two pure functions to `src/todos.js`. Neither may mutate its input.
   - `filterTodos(todos, filter)`: `'all'` returns every todo, `'active'` returns those with `done: false`, and `'completed'` returns those with `done: true`. Any other value behaves like `'all'`.
   - `clearCompleted(todos)`: returns only the todos with `done: false`.
2. Add tests for both functions to `test/todos.test.js`. Cover each filter value, an unknown filter value, clearing, and the fact that the input is not mutated.
3. In `src/index.html`, add a footer section below `#list`, next to `#count`, with three filter buttons labelled "All", "Active" and "Completed", plus a "Clear completed" button. All of them must be `type="button"`.
4. In `src/app.js`, keep the current filter in a module variable that starts as `'all'`. Clicking a filter button sets it and re-renders. `render()` shows `filterTodos(todos, filter)`. `#count` still uses `remaining(todos)` over all todos.
5. The selected filter button has `aria-pressed="true"` and the other two have `aria-pressed="false"`. The selected button also looks different, and that style uses only the CSS tokens.
6. "Clear completed" calls `update(clearCompleted(todos))`, so the result is saved to localStorage. It is `disabled` when no todo is done.
7. Toggling or deleting a todo while a filter is active updates the visible list right away. For example, a todo ticked while the "Active" filter is on disappears from the list.
8. Footer styles go in `src/styles.css` and use only the existing variables. Dark mode must still look right. Filter buttons should look quieter than the accent "Add" button.
9. Follow the code style in CLAUDE.md. Add no dependencies. Do not change `.claude/` or `factory/`.

## Acceptance criteria
1. `npm test` passes and includes new tests named for `filterTodos` and `clearCompleted`.
2. `grep -n "export function filterTodos\|export function clearCompleted" src/todos.js` returns two lines.
3. Start `npm run dev -- 8123` and open `http://localhost:8123/index.html`. "All", "Active", "Completed" and "Clear completed" buttons appear below the list, and the browser console shows no errors.
4. Add todos "a", "b" and "c", then tick "b".
   - "Active" shows "a" and "c".
   - "Completed" shows only "b".
   - "All" shows all three.
   - The count says "2 items left" under every filter.
5. While "Active" is selected, it has `aria-pressed="true"` and the other two filter buttons have `"false"` (check in devtools). It also looks highlighted.
6. With "b" ticked, click "Clear completed". Only "a" and "c" remain. Reload the page and "b" is still gone. The button is now disabled.
7. On the "Active" filter, tick "a". It disappears from the list straight away.
8. Switch the OS to dark mode. The footer buttons are readable and use the dark tokens. `src/styles.css` gains no new hex colours outside `:root`.
9. `git diff --stat factory-test-app` shows changes only under `src/` and `test/`.

## Out of scope
- Saving the chosen filter (in localStorage or the URL hash) or adding routing.
- An empty-state message, a "toggle all" control, editing todos, or animations.
- Changing existing functions, the storage key or the data shape.
- Changing `.claude/`, `factory/`, `README.md` or `MANUAL.md`.

## Assumptions
- The filter is not saved and goes back to "All" on reload. The request doesn't ask for it to be saved.
- "Clear completed" is disabled rather than hidden when nothing is done. This keeps the layout stable and is easy to understand.
- No confirmation dialog for "Clear completed". It's a small local app and the request didn't ask for one.
- The count keeps showing items left across all todos, not just the filtered view. This matches the usual todo-app behaviour.
- CLAUDE.md doesn't need updating because the layout and conventions don't change.
