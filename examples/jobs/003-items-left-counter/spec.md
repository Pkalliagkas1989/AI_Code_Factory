# Items-left counter

> Feature: Show how many todos are still active below the list, as "1 item left" or "N items left", updating as todos are added, ticked, edited or deleted

## Context
**This feature already exists on the base branch** (`example/todo-app` @ 402b65f, added with the app in b4ce7dc):

- `src/index.html`: `<footer>` below `<ul id="list">` holds `<p id="count" aria-live="polite">`.
- `src/todos.js`: `remaining(todos)` returns the number of todos with `done: false` (tested in `test/todos.test.js`, "removeTodo and remaining").
- `src/app.js` `render()` (near the end) sets
  `count.textContent = \`${n} ${n === 1 ? 'item' : 'items'} left\``.
  Every change (add, toggle by checkbox or label click, edit via `editTodo`, delete, clear completed) goes through `update()`, which calls `render()`, so the counter is always current. Changing the filter also re-renders; the count always counts all todos, not just the ones shown.
- `src/styles.css`: `#count` and `footer #count` are already styled with tokens (`--muted`, `--space`).

The one gap against project conventions (`CLAUDE.md`: "Logic goes in `src/todos.js` as pure functions"; "Every new function in `src/todos.js` gets a test") is that the singular/plural wording lives in `app.js` and has no unit test. This job closes that gap and nothing else.

## Requirements
1. Add a pure function `itemsLeftLabel(todos)` to `src/todos.js` that returns `'1 item left'` when exactly one todo is active, and `'<n> items left'` otherwise (including `'0 items left'`). It must use `remaining(todos)` and must not mutate its input.
2. `src/app.js` imports `itemsLeftLabel` and uses it to set `count.textContent`. The inline template literal is removed. `n` / `remaining` stay in `app.js` only if still needed for `clearButton.disabled`.
3. Add tests for `itemsLeftLabel` in `test/todos.test.js` covering 0, 1 and more than 1 active todo, and showing that done todos are not counted.
4. No change to `src/index.html` or `src/styles.css`. The visible text, position, styling and `aria-live` behaviour stay exactly as they are now.
5. Follow the code style: no semicolons, single quotes, 2-space indent.

## Acceptance criteria
1. `npm test` passes, and its output includes the new `itemsLeftLabel` test(s).
2. `grep -n "itemsLeftLabel" src/todos.js src/app.js test/todos.test.js` finds an export in `todos.js`, an import and a use in `app.js`, and at least one test.
3. `grep -n "'item' : 'items'" src/app.js` returns nothing.
4. `git diff example/todo-app --stat` shows changes only in `src/todos.js`, `src/app.js` and `test/todos.test.js`.
5. Run `npm run dev -- <port>`, open `http://localhost:<port>/index.html` and clear localStorage. Below the list the footer shows "0 items left". Add one todo: "1 item left". Add a second: "2 items left". Tick one: "1 item left". Untick it: "2 items left". Double-click a todo, change its text and press Enter: still "2 items left". Edit a todo's text to empty and press Enter: "1 item left". Delete the last todo with ×: "0 items left". Switching between All, Active and Completed never changes the number. The browser console shows no errors.

## Out of scope
- Hiding the footer or counter when the list is empty.
- Wording changes, translations, or counting completed todos.
- Any styling, markup or accessibility changes to the footer.
- Changes to `.claude/` or `factory/`.

## Assumptions
- The requested behaviour already ships. The smallest useful change is to move the wording into a tested pure function, as `CLAUDE.md` requires. The approver may cancel this job instead, since users would see no difference.
- "0 items left" stays as it is today (the request only names the 1 and N cases, and plural is correct English for zero).
- The function takes the todo array rather than a number, to match the other `todos.js` helpers.
