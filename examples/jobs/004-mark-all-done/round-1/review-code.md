VERDICT: PASS

## Why
- The "Mark all as done" button sits next to the counter, is disabled when nothing is active, and ticks every todo through the normal save path.
- The new `completeAll` function is pure and has three tests; all 21 tests pass.
- Code matches the repo conventions, uses only existing CSS variables and the `.quiet` style, and the commit message is well formed.

## Checks
npm test: pass (21/21)
Browser check: not run (code read only)

## Findings
None.

## Notes
- `#count` keeps its id and aria-live; the filter does not affect the button, as required.
