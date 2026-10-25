VERDICT: PASS

## Why
- The round 1 bug is fixed. Pending toggles are now kept per todo, so clicking todo B quickly no longer cancels todo A's tick.
- Tests pass (16/16), there is no innerHTML in src/app.js, and the commit message is well formed.

## Checks
npm test: pass (16/16)
grep innerHTML src/app.js: pass (none)

## Findings
None.

## Notes
- The fix is small: a Map of timers keyed by id, with `cancelToggle(id)` as the helper.
