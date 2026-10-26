STATUS: READY

# Build: Several named todo lists

## Summary
People can now keep several named todo lists. A switcher above the input has one button per list (the open list is `aria-pressed`), plus New list / Rename list / Delete list. Names go in an inline field with `maxlength="40"`: Enter or Save saves, and Escape or Cancel closes it. When a name breaks a rule, the message appears in `#list-message` (`aria-live="polite"`). Todos, filters, the counter, "Mark all as done" and "Clear completed" act on the open list only. State is saved as `{ lists, openId }` under `todoLists`. When there is no valid saved data, the old `todos` key is moved into a "My todos" list. The old key is only read.

Files: `src/todos.js` (listNameError, addList, renameList, removeList, setListTodos, initialState), `test/todos.test.js`, `src/app.js`, `src/index.html`, `src/styles.css`, `CLAUDE.md`.

Deleting a list closes the list-name field, so a pending rename can't rename the list that opens next.

Commits: `4db434b feat(todos): add pure logic for named todo lists`, `9501c2d feat(lists): let people keep several named todo lists`, `b8bbaa1 fix(lists): close the list-name field when a list is deleted`.

## Acceptance criteria
1. [x] npm test passes and the new functions have tests: 35/35 pass. There are tests for empty and spaces-only names, 40 characters accepted and 41 rejected, a duplicate in another case, the list's own name in another case on rename, removeList refusing the last list, initialState from old data and from bad JSON or the wrong shape, a saved/missing/stale openId, and no mutation.
2. [x] `grep -n innerHTML src/*.js` prints nothing (exit 1).
3. [x] Only the old `todos` key set (a, b done), then reload: tabs `["My todos:true"]`, items `a,b`, "1 item left". The `todos` key is unchanged. Checked in agent-browser on port 5150, not 8000.
4. [x] Empty localStorage: one pressed `My todos`, no items, "0 items left", delete disabled. `agent-browser errors` and `console` were empty.
5. [x] `  Work  ` creates and opens `Work` with no todos. `work`, an empty name and spaces only were refused with "Another list already has that name." / "Enter a name for the list.", the field stayed open and the list count stayed at 2. **Note:** a real paste of 41 characters is cut to 40 by the required `maxlength="40"` and then accepted as a valid 40-character name. Setting a 41-character value directly (bypassing maxlength) and submitting shows "List names can be at most 40 characters." and adds no list. The spec's maxlength requirement and this criterion's "pasted" wording pull against each other. The approver may want to look.
6. [x] `Work` renamed to `WORK`: saved, still open. `WORK` renamed to `my todos`: refused with "Another list already has that name.", field stays open. Changing only the case of a list's own name is also accepted for `My todos`.
7. [x] Work (w1 done, w2, w3) and My todos (a, b done) do not share todos. With Active selected, switching keeps Active and shows only the open list's active todos. "Mark all as done" and "Clear completed" in Work left My todos, its count and its button states unchanged.
8. [x] Delete on Work opens the confirm `Delete the list "Work" and all its todos?`. Dismiss keeps it. Accept removes it, opens `My todos`, moves focus to that tab and disables Delete list. Round 2: with Rename open on Work (value `Renamed`), accepting Delete hides the name field, clears `#list-message`, leaves tabs `["My todos:true"]` and focuses `My todos`; no errors or console output.
9. [x] Opened Work, added `w4`, reloaded: Work is pressed and shows `w4`.
10. [x] A list named `<b>x</b>` shows those characters literally (`textContent` `<b>x</b>`, 0 child elements).
11. [x] Dark media: name field background `rgb(36,36,34)` (`--surface`), body `rgb(26,26,24)`. Screenshots in dark and light look right. `git diff src/styles.css` adds no hex values (grep exit 1).
12. [x] `git diff --stat factory/004-mark-all-done` lists only CLAUDE.md, src/*, test/todos.test.js.

Layout: a 40-character unbroken name wraps inside its button at 480px and 320px, with no horizontal scroll (scrollWidth equals clientWidth).

## Validation
- `npm test`: pass (35 tests), rerun in round 2 after the fix.
- `grep -n innerHTML src/*.js`: no output.
- Hex grep on `git diff src/styles.css`: no output.
- agent-browser on `npm run dev -- 5150`: the checks above, no page errors, in rounds 1 and 2. Browser closed and server stopped afterwards.

## Log
### Round 1
I built the pure list functions with tests, then the switcher UI, per-list scope, storage under `todoLists` with migration, the styles, and the CLAUDE.md layout lines. Choices beyond the spec:
- Todo event handlers capture their list id, so a delayed label toggle or an edit blur after a list switch never changes another list.
- The rename field closes when another list is opened.
- A Cancel button sits next to Save for mouse users.
- After a delete, focus moves to the newly opened tab.

The run was interrupted once by a usage limit and resumed. No work was lost.

### Round 2
Rework-1: "close the list-name field when a list is deleted, so a pending rename can't rename the newly opened list". Fixed in `src/app.js`: a `hideNameField()` helper (hide form, reset `nameMode`, clear message) is now used by the tab switch, `closeNameField()` and the Delete handler, which calls it after the confirm is accepted. Dismissing the confirm leaves the field as it was. Checked in agent-browser (see criterion 8). `npm test` passes.
