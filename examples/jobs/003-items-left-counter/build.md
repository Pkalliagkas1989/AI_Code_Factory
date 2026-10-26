STATUS: READY

# Build: Items-left counter

## Summary
The singular/plural counter wording moves out of `app.js` into a pure, unit-tested `itemsLeftLabel(todos)` in `src/todos.js`, which is built on `remaining()`. `render()` now sets `count.textContent = itemsLeftLabel(todos)`. `remaining` stays imported because `clearButton.disabled` uses it. Users see no change. Commit `ade5fb2`.
Files changed: `src/todos.js`, `src/app.js`, `test/todos.test.js`.

## Acceptance criteria
1. [x] `npm test` passes: 18/18. The output includes "itemsLeftLabel uses the singular only for one active todo" and "itemsLeftLabel ignores done todos and does not mutate".
2. [x] The grep finds the export at `src/todos.js:23`, the import at `src/app.js:2`, the use at `src/app.js:73`, and tests at `test/todos.test.js:31,37`.
3. [x] `grep -n "'item' : 'items'" src/app.js` prints nothing (exit 1).
4. [x] `git diff example/todo-app --stat` lists only `src/app.js`, `src/todos.js` and `test/todos.test.js`.
5. [x] Checked with agent-browser on port 5130 after clearing localStorage. Reading `#count` gave:
   - start: "0 items left"
   - after adding the first todo: "1 item left"
   - after adding the second: "2 items left"
   - after ticking one: "1 item left"
   - Active, Completed and All filters: "1 item left" each time
   - after unticking: "2 items left"
   - after editing the text and pressing Enter: "2 items left"
   - after editing to empty and pressing Enter: "1 item left"
   - after deleting with ×: "0 items left"

   `agent-browser console` and `errors` were both empty.

## Validation
- `npm test`: pass (18 tests, 0 fail)
- The grep checks for criteria 2 and 3: pass
- `git diff example/todo-app --stat`: pass
- Browser run: pass, with no console errors

## Log
### Round 1
- Added `itemsLeftLabel` and two tests: 0, 1 and 2 active todos; done todos not counted; input not mutated.
- Wired `itemsLeftLabel` into `render()`.
- `index.html` and `styles.css` are unchanged.
- In an early browser run, a fuzzy `find --name Completed` click hit "Clear completed". That was a mistake in my test script, not a bug in the app. I redid the whole sequence with exact selectors and the results above come from that run.
