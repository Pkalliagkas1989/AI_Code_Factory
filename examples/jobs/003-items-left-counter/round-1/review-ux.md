VERDICT: PASS

## Why
- The change only moves the "item/items left" wording into a tested function. The visible text, position and styling are unchanged.
- The counter updated correctly in the browser.

## Seen in the app
- Opened http://localhost:5132/index.html with empty storage: "0 items left". Added two todos: "1 item left", then "2 items left". Ticked one: "1 item left". Unticked it: "2 items left". Switched to Active and back to All: the count stayed at 2. Deleted both: "0 items left".
- Checked at 375 px width. Screenshots: round-1/ux-desktop.png, round-1/ux-mobile.png. I did not open them to inspect the layout. The diff has no HTML or CSS changes.
- I did not test the edit flow by hand. It goes through the same render path.

## Findings
None.
