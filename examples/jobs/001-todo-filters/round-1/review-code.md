VERDICT: PASS

## Why
- The code matches every requirement in the spec: the pure functions, the footer markup, the filter state, aria-pressed, and "Clear completed" saving through `update()` and disabling itself.
- `npm test` passes (11 of 11), and the diff touches only `src/` and `test/`.
- The commits are in Conventional Commits form, with a body explaining what and why.

## Checks
- npm test: pass (11/11, including the new filterTodos and clearCompleted tests)
- git diff --stat factory-test-app...HEAD: pass (only src/ and test/ changed)
- No new hex colours outside :root in styles.css: pass
- Not run: the browser and dev-server acceptance criteria (3 to 7) and the dark-mode check. I judged those by reading the diff.

## Findings
None.

## Notes
- The count still covers all todos, and the filter starts at `'all'` and is not persisted, as the spec says.
