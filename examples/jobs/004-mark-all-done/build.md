STATUS: READY

# Build: Mark all as done button

## Summary
This branch adds a pure `completeAll(todos)` function and a "Mark all as done" `.quiet` button next to the items-left counter. A new `.status` flex wrapper holds the counter and the button. The button is disabled when `remaining(todos) === 0`, and clicking it calls `update(completeAll(todos))`, which acts on all todos whatever filter is active. Commits `3f9771a` (feature) and `1e6e1a6` (footer layout fix). In round 2, `.status` got `flex-basis: 100%`, so the counter and button now take the footer's first row and the filters and "Clear completed" share the second row.
Files changed: `src/todos.js`, `src/app.js`, `src/index.html`, `src/styles.css`, `test/todos.test.js`.

## Acceptance criteria
I checked the browser criteria with agent-browser on port 5140, the port this job was given, instead of the spec's 8004.
1. [x] `npm test` passes: 21 tests, 0 failures, including the 3 new `completeAll` tests.
2. [x] grep finds `src/todos.js:38 export function completeAll`. In `test/todos.test.js`, line 3 has the import and lines 122, 131 and 139 hold the tests.
3. [x] With empty localStorage, the button is disabled and the counter reads "0 items left". The button shares a parent with `#count`, 8px (`--space`) to its right. `errors` and `console` were both empty.
4. [x] I added one, two and three and ticked one, and the button was enabled. After clicking it, the boxes were [true,true,true], the counter read "0 items left" and the button was disabled.
5. [x] After a reload, the boxes were still all ticked, the button was disabled and localStorage held all three with `done:true`.
6. [x] I unticked #2, switched to Completed and clicked the button. Back on All, the boxes were [true,true,true].
7. [x] Tab from the last todo's delete button lands on `#complete-all`, and Enter ticked everything. Space also worked when the button was enabled. When it was disabled, the same Tab moved past it to the "All" filter.
8. [x] In emulated dark mode, the button, "Clear completed" and the counter are all `rgb(163,163,157)` on `rgb(26,26,24)`. I checked a screenshot and they are readable. No new colours were added; the only new CSS rule is `.status`, which uses `var(--space)`.

## Validation
- `npm test`: passed (21/21).
- Browser console on the page: no errors (rounds 1 and 2).
- Round 2: `npm test` passed (21/21). Re-checked the footer layout and the button click at 1100px and 375px, light and dark.

## Log
### Round 1
I implemented requirements 1 to 6 in a single commit and checked all acceptance criteria in the browser.

### Round 2
- review-ui finding 1 ("Clear completed" wrapped alone onto a second row at desktop width): the counter row needs 203px, the filters 189px and "Clear completed" 124px. With the gaps that is 532px, more than the footer's 480px, so tightening padding could not keep it on one line. I took the reviewer's suggested alternative of a row above the filters and gave `.status` `flex-basis: 100%`. The footer now has row 1 "N items left · Mark all as done" and row 2 with the filters on the left and "Clear completed" on the right. Both rows are balanced at 1100px and 375px, in light and dark. The button still sits directly beside the counter, it works ("0 items left" after a click, then disabled), and the console shows no errors. Commit `1e6e1a6`.
- review-code, review-security, review-ux: PASS, no findings.
