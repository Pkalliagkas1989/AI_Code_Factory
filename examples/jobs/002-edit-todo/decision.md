RECOMMEND: MERGE

## In short
People can now double-click a todo's text to change it. Enter or clicking away saves, Escape cancels, and saving empty text deletes the todo. All four reviewers passed it in round 2, the tests pass, and it merges cleanly, so I recommend merging.

## What each department did
- **Spec**: Asked for inline editing on double-click, plus a small list function `editTodo` with tests. The spec also flagged a trap: a double-click must not tick or untick the todo.
- **Build**: Built the editor and the `editTodo` function, with 5 new unit tests (16 in total, all passing). Every acceptance check was run in a real browser, including dark mode and a count of saves to storage. In round 2 it fixed a bug where clicking two todos quickly lost the first tick.
- **Security**: Text you type still goes into the page only as plain text, never as code. No network calls, packages or secrets were added. PASS.
- **Code quality**: In round 1 it found the bug with two quick clicks. It checked the round 2 fix and found nothing else. PASS.
- **User experience**: The editor opens focused with the text selected and has a name screen readers can announce. Each edit saves once. PASS. It notes there is no keyboard-only way to start editing, which the spec left out on purpose.
- **Visual design**: The edit box uses only the app's existing colours and spacing, so it works in dark mode and on narrow screens. PASS.

## Acceptance criteria
1. Tests pass and cover editTodo: met. I ran `node --test test/todos.test.js` myself: 16 pass, 0 fail.
2. editTodo exists and app.js has no innerHTML: met. I checked both in the diff and with grep.
3. Double-click opens a focused, selected field and leaves the tick unchanged: met (build.md browser check, and the code cancels the pending toggle on double-click).
4. Enter saves and it survives a reload: met (build.md).
5. Clicking away saves and it survives a reload: met (build.md).
6. Escape restores the old text: met (build.md, 0 writes to storage).
7. Empty text deletes the todo, with Enter or by clicking away: met (build.md, the count drops by one).
8. One save per edit and no console errors: met (build.md counted storage writes; the code has a one-time guard).
9. A single click on the text still ticks the todo: met (build.md). It now happens about 250 ms after the click.
10. Dark mode edit field: met (build.md measured the dark colours).

## Your decision
Merging adds double-click editing to the todo list. One small change in feel: clicking a todo's text now ticks it about a quarter of a second later than before, so a double-click can open the editor instead. Clicking the checkbox itself is still instant. Try it once to check the delay feels fine. A keyboard-only way to start editing would be a good follow-up job.

## Commands
Run these in a terminal, one step at a time. Nothing is merged until you do.
If a step prints an error, stop there and ask Claude what to do.

**1. Go to the project and check it's clean**
```bash
cd /Users/pkalliag/Dev/AI_Code_Factory && git switch factory-test-app && git status --short
```
Only `factory/backlog.md` may be listed. Commit or stash anything else first.

**2. Merge**
```bash
git merge --no-ff factory/002-edit-todo \
  -m "feat(ui): edit a todo's text by double-clicking it" \
  -m "Double-clicking a todo's text opens an inline text field with the
text selected. Enter or clicking away saves, Escape cancels, and saving
empty text deletes the todo. A single click on the text now toggles
after a short delay so a double-click does not change the done state.
Adds editTodo to src/todos.js with unit tests." \
  -m "Factory job: 002-edit-todo"
```

**3. Clean up the job's branch and folder**
```bash
git worktree remove /Users/pkalliag/Dev/AI_Code_Factory-factory/002-edit-todo && git branch -d factory/002-edit-todo
```

**4.** Back in Claude Code, run `/factory done 002-edit-todo`.

When you are ready to publish: `git push origin factory-test-app`

Not merging? In Claude Code, run `/factory rework 002-edit-todo <what to change>`
instead.
