RECOMMEND: MERGE

## In short
This job adds a "Mark all as done" button right beside the "N items left" counter. One click ticks every open todo, whichever filter is showing. The button is greyed out when nothing is left to tick. All four reviewers passed it, the tests pass, and I recommend merging it. Merge job 003 first, because this job is built on top of it.

## What each department did
- **Spec**: Asked for a one-way "Mark all as done" button next to the counter. It reuses the look of "Clear completed", saves like any other change, and is disabled when no todos are open.
- **Build**: Added a small, tested function that marks every todo done, plus the button and its wiring. In round 2 the footer layout was fixed so the counter and the button share the first row, with the filters and "Clear completed" on the row below. 21 of 21 tests pass, and every criterion was checked by hand in a browser.
- **Security**: Passed. The button only changes todos already saved in the user's own browser. Nothing goes over the network, and no dependencies or user-written HTML were added.
- **User experience (UX)**: Passed. The reviewer tried it on phone and desktop widths, including clicking it while the "Completed" filter was showing. Everything got ticked and the button then greyed out.
- **Visual design (UI)**: Passed. The round 1 problem, where "Clear completed" ended up alone on its own line, is fixed. The footer looks right in light and dark mode on desktop and phone.
- **Code quality**: Passed. The new logic follows the project rules (a separate, tested function that doesn't change its input), and both commit messages are well formed.

## Acceptance criteria
1. Tests pass, including the new ones: met. I ran `npm test` myself and got 21 of 21 passing.
2. The function and its tests exist: met. I saw `export function completeAll` in `src/todos.js` and three `completeAll` tests in the diff.
3. The button sits beside "0 items left" and is disabled on an empty list, with no console errors: met (build.md, UX and UI screenshots).
4. With three todos and one ticked, clicking the button ticks all three, the counter shows 0 and the button greys out: met (build.md).
5. All todos stay ticked after a reload: met. build.md shows the saved data with all three `done:true`.
6. The button works from the "Completed" filter: met (build.md and the UX review).
7. It can be reached and used with the keyboard, and is skipped when disabled: met (build.md).
8. It is readable in dark mode and matches "Clear completed": met. Colours are identical, and the UI review checked the dark screenshots.

## Your decision
Merging adds the new button to the todo footer and moves the counter and button onto their own row above the filters. Nothing risky is touched: no logins, no money, no server, no new packages. Todos still stay in this browser only, which you already decided on 2026-10-25.

One thing about the order. This job's base is job 003's branch, which has not been merged yet. Merge job 003 first using the commands in `factory/jobs/003-items-left-counter/decision.md`. Then merge this job into `example/todo-app` as shown below. Git found no conflicts. Also, your main checkout has an uncommitted change to `factory/config.md`. Commit or stash it before step 1.

## Commands
Run these in a terminal, one step at a time. Nothing is merged until you do.
If a step prints an error, stop there and ask Claude what to do.

**0. First, merge job 003**
Follow every step in `/Users/pkalliag/Dev/AI_Code_Factory/factory/jobs/003-items-left-counter/decision.md`, including its `/factory done 003-items-left-counter`. Deleting the 003 branch is fine, because this job's branch already contains its work.

**1. Go to the project and check it's clean**
```bash
cd /Users/pkalliag/Dev/AI_Code_Factory && git switch example/todo-app && git status --short
```
Only `factory/backlog.md` may be listed. Commit or stash anything else first.

**2. Merge**
```bash
git merge --no-ff factory/004-mark-all-done \
  -m "feat(todos): add a mark all as done button next to the counter" \
  -m "A new Mark all as done button beside the items-left counter ticks
every open todo in one click, whatever filter is showing, and saves
the list as usual. It is disabled when no todos are open. The logic
lives in a new tested completeAll function in todos.js. The counter
and button now share the footer's first row, with the filters and
Clear completed on the row below." \
  -m "Factory job: 004-mark-all-done"
```

**3. Clean up the job's branch and folder**
```bash
git worktree remove /Users/pkalliag/Dev/AI_Code_Factory-factory/004-mark-all-done && git branch -d factory/004-mark-all-done
```

**4.** Back in Claude Code, run `/factory done 004-mark-all-done`.

When you are ready to publish: `git push origin example/todo-app`

Not merging? In Claude Code, run `/factory rework 004-mark-all-done <what to change>`
instead.
