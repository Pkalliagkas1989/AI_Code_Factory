STATUS: READY

# Build: Todo filters and "Clear completed"

## Summary
Adds pure `filterTodos` and `clearCompleted` to `src/todos.js` (with tests), plus a footer holding `#count`, the All/Active/Completed filter buttons (`aria-pressed`) and a "Clear completed" button. The filter is kept in a module variable in `app.js` and is not saved. Clear completed goes through `update()` and is disabled when no todo is done. Footer styles use only the existing tokens.

Files: `src/todos.js`, `test/todos.test.js`, `src/index.html`, `src/app.js`, `src/styles.css`.

## Acceptance criteria
`agent-browser` is not installed on this machine. I checked the browser criteria with a headless Chrome script using `playwright-core`, installed in the scratchpad and not in the repo. The script ran against `npm run dev -- 5110`.

1. [x] `npm test` passes: 11/11, including 5 `filterTodos` tests (all, active, completed, unknown filter, no mutation) and 2 `clearCompleted` tests (clearing, no mutation).
2. [x] The grep returns lines 23 and 29 of `src/todos.js`.
3. [x] The footer shows All, Active, Completed and Clear completed, all `type=button`. The only console error is a 404 for `/favicon.ico`, which the base branch already has (it has no favicon). This change adds no errors.
4. [x] With a, b, c and "b" ticked: Active shows [a, c], Completed shows [b], All shows [a, b, c]. Each view shows "2 items left".
5. [x] On Active, aria-pressed is All=false, Active=true, Completed=false. The selected button has an accent border and text (screenshot checked).
6. [x] Clear completed leaves [a, c]. After a reload it is still [a, c] and the button is disabled. The button is also disabled before anything is ticked.
7. [x] On Active, ticking "a" removes it at once (leaves [c], "1 item left"). Deleting "c" under Completed also removes it at once.
8. [x] In emulated dark mode, the footer buttons use the dark tokens (muted rgb(163,163,157), accent rgb(109,155,255)) and are readable (screenshot checked). The diff adds 0 hex colours to `styles.css`.
9. [x] `git diff --stat factory-test-app` lists only `src/` and `test/` files.

## Validation
- `npm test`: pass (11 tests)
- Browser script in headless Chrome, light and dark: pass
- `git status --porcelain`: clean

## Log
### Round 1
- Added and tested the two pure functions (commit a41c643).
- Built the footer UI, the filter state, aria-pressed and the clear button, with token-only styles (commit d0d998f).
- `agent-browser` was missing, so I used playwright-core from the scratchpad instead.
