RECOMMEND: MERGE

## In short
The "items left" counter below the list already worked. This job moves its
wording ("1 item left", "2 items left") into a small tested function, as the
project rules require. Users see no difference. I recommend merging.

## What each department did
- **Spec**: Found the counter already exists. Planned only to move the
  singular/plural wording into `src/todos.js` with tests, and to change no
  page markup or styles.
- **Build**: Added `itemsLeftLabel`, used it in the page code, and added two
  tests. All 18 tests pass. A browser run covered add, tick, untick, edit,
  delete and the filters, with no console errors.
- **Security**: No new inputs, storage or network use. The counter text still
  goes into the page safely. PASS.
- **Code quality**: Only the three planned files changed. The code is clean
  and the commit message is good. PASS.
- **UX**: Clicked through the app. The counter updated correctly and the
  filters did not change the number. PASS.
- **UI**: Screenshots on desktop and phone show the counter in the same place
  and style as before. PASS.

## Acceptance criteria
1. Tests pass and include the new ones: met. I ran them: 18 pass, 0 fail.
2. The new function is defined, imported, used and tested: met. Seen in the diff.
3. The old inline wording is gone from `src/app.js`: met. Seen in the diff.
4. Only `src/todos.js`, `src/app.js` and `test/todos.test.js` changed: met.
   I checked the diff summary.
5. The counter behaves correctly in the browser: met, per the build's step-by-step
   browser log and the UX review's own click-through.

## Your decision
Merging changes no behaviour. It only tidies the code and adds tests. The
branch merges with no conflicts and has one well-formed commit. Heads-up for
step 1: your main checkout currently also shows `factory/config.md` as
modified. Commit or stash it before merging.

## Commands
Run these in a terminal, one step at a time. Nothing is merged until you do.
If a step prints an error, stop there and ask Claude what to do.

**1. Go to the project and check it's clean**
```bash
cd /Users/pkalliag/Dev/AI_Code_Factory && git switch example/todo-app && git status --short
```
Only `factory/backlog.md` may be listed. Commit or stash anything else first.

**2. Merge**
```bash
git merge --no-ff factory/003-items-left-counter \
  -m "refactor(todos): move items-left wording into a tested function" \
  -m "The footer counter wording (1 item left / N items left) moves from
app.js into itemsLeftLabel in todos.js, with unit tests for 0, 1 and
several active todos. This keeps list logic in todos.js as CLAUDE.md
requires. Users see no change." \
  -m "Factory job: 003-items-left-counter"
```

**3. Clean up the job's branch and folder**
```bash
git worktree remove /Users/pkalliag/Dev/AI_Code_Factory-factory/003-items-left-counter && git branch -d factory/003-items-left-counter
```

**4.** Back in Claude Code, run `/factory done 003-items-left-counter`.

When you are ready to publish: `git push origin example/todo-app`

Not merging? In Claude Code, run `/factory rework 003-items-left-counter <what to change>`
instead. Since users see no difference, cancelling the job is also a fair choice.
