STATUS: READY

# Build: Edit a todo's text by double-clicking it

## Summary
Double-clicking a todo's text opens an inline text field (focused, text selected, `aria-label="Edit <text>"`). Enter or blur saves via `update(editTodo(...))`; Escape cancels. A `finished` guard makes each edit commit once; after Enter/Escape focus returns to the todo's checkbox. To stop a double-click from toggling `done`, the label's click now cancels the native toggle and toggles after 250 ms. Pending toggles are kept per todo id (`toggleTimers` Map), and a `dblclick` cancels only its own todo's timer. Clicks with `detail === 0` (keyboard/assistive tech) keep the native immediate toggle; the checkbox itself is unchanged.

Files: `src/todos.js` (`editTodo`), `test/todos.test.js` (5 tests), `src/app.js` (label click/dblclick, `startEdit`), `src/styles.css` (`li .edit`, tokens only).

## Acceptance criteria
1. [x] `npm test`: 16 pass, 0 fail. The new tests cover update+trim, empty/whitespace removal, untouched neighbours, unknown id copy and no mutation.
2. [x] `grep -n "export function editTodo" src/todos.js` gives line 33. `grep -n innerHTML src/app.js` finds nothing.
3. [x] agent-browser on port 5120: dblclick on unticked "Buy milk" gave activeElement `.edit`, value and selection "Buy milk", aria-label "Edit Buy milk", checkbox still false. Dblclick on ticked "Walk dog": the box stays true.
4. [x] Typed "Buy oat milk" + Enter: the row shows it, 1 localStorage write, focus on `#todo-1`. After reload it is still there.
5. [x] Typed "Call mum" + click on h1: the row shows "Call mum" with 1 write. It survives a reload.
6. [x] Typed "Nope" + Escape: the row still shows "Call mum" with 0 writes. Unchanged after reload.
7. [x] Cleared + Enter: the todo is removed and the count goes from 3 to 2 items left (1 write). Spaces + click away: removed, 2 to 1 items left, 1 write. Both stay gone after reload.
8. [x] A `setItem` wrapper showed exactly 1 write for each save and 0 for Escape. `agent-browser errors` and `console` showed no errors.
9. [x] Single click on the label toggles: false to true and back, persisted. Note: the headless tab reports `visibilityState: hidden`, so Chrome throttles the 250 ms timer. The check needed a 2 s wait there. In a visible tab the delay is 250 ms. Round 2: clicking A then B quickly ticks both, and a double-click on A leaves both unchanged.
10. [x] `set media dark`: the edit field background is rgb(36,36,34) (`--surface`) and its text rgb(236,236,234) (`--text`). Screenshots in both modes show it filling the label space with no row height change.

## Validation
- `npm test`: pass (16/16), rerun in round 2.
- `grep` checks above: pass.
- Browser checks via agent-browser session `002-edit-todo-builder` (closed, server stopped).

## Log
### Round 1
Implemented `editTodo` + tests, inline editor, and the double-click/toggle fix. A delayed label toggle was chosen over toggling and reverting, so the done state never flickers and no extra writes happen. Trade-off: a single click on the text toggles about 250 ms later than before. A double-click slower than 250 ms but inside the OS double-click window still toggles once before the editor opens. Reviewers may want to weigh this.

### Round 2
- code #1 (a shared `toggleTimer` meant a click on B cancelled A's pending toggle): fixed in `fix(ui): keep pending toggles when clicking another todo quickly`. Timers are now in a Map keyed by todo id, and `cancelToggle(id)` clears only that todo's timer. Checked in the browser: A then B clicked back to back left both `done: true`. A double-click on A opened the editor with nothing written. A single click on A then unticked it.
- security, ui, ux: PASS, no findings. The ux note about delete-while-editing needing a second click is left as is: it is an edge case and the spec does not cover it.
