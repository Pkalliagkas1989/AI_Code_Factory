VERDICT: PASS

## Why
- The "N items left" wording now lives in a pure, tested function `itemsLeftLabel` in `src/todos.js`, and `app.js` uses it. This is what the spec asked for.
- Only `src/todos.js`, `src/app.js` and `test/todos.test.js` changed, and the visible text is the same as before.
- The commit message follows Conventional Commits and explains what and why.

## Checks
npm test: pass (18/18, includes the two new itemsLeftLabel tests)
git diff example/todo-app...HEAD: only the three allowed files changed
Browser check: not run (the change is a pure refactor of the same string)

## Findings
None.

## Notes
- The inline template literal is gone from app.js. `remaining` is still imported and used for `clearButton.disabled`, as the spec allows.
