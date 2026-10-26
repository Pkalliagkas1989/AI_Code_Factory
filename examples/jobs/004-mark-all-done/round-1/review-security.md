VERDICT: PASS

## Why
- The new "Mark all as done" button only changes data already in the user's own browser; it sends and receives nothing over the network.
- No user text is added to the page in a new way: the button label is fixed text in the HTML, and the counter still uses `textContent`.
- No new dependencies, secrets or external resources.

## Findings
None.

## Notes
- `completeAll` (src/todos.js:38) spreads existing todo objects loaded from localStorage; that data is the user's own and the rendering path is unchanged, so no new risk.
