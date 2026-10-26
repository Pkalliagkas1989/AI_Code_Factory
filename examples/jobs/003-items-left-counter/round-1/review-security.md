VERDICT: PASS

## Why
- This change only moves the "N items left" wording into a small tested helper. It adds no new inputs, storage or network access.
- The counter text still goes into the page with `textContent`, so it can't inject HTML.
- No new dependencies, secrets or files outside `src/` and `test/`.

## Findings
None.

## Notes
- `itemsLeftLabel` only builds its string from a number that `remaining()` computes, so no user text reaches the label.
