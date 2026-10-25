RECOMMEND: MERGE

## In short
The todo app gets a row of buttons under the list. You can show All, Active (not done) or Completed todos, and a "Clear completed" button deletes every finished todo. All checks pass, all four reviewers approved, and the change stays inside the app's own files, so I recommend merging.

## What each department did
- **Spec**: Asked for two small list functions (filter and clear), the footer buttons, a highlighted selected filter, and a clear button that saves its result and is greyed out when nothing is done. The chosen filter is deliberately not remembered after a reload.
- **Build**: Built it in two commits, one for the list logic with 7 new tests and one for the page, buttons and styles. All 11 tests pass. The builder also ran each browser check from the spec in a headless browser, in light and dark mode.
- **Security**: Found nothing. The filter value only comes from fixed buttons, user text is still shown safely, and nothing new is stored or sent anywhere.
- **User experience (UX)**: Found nothing blocking. Buttons are real, labelled buttons that screen readers can use. Noted that the highlighted filter is subtle and an empty filtered list just looks blank (out of scope for this job).
- **Visual design (UI)**: Found nothing blocking. The new styles use only the existing colour and spacing settings, so dark mode keeps working, and the filters look quieter than the "Add" button. The greyed-out clear button has low contrast, which is normal for a disabled button.
- **Code quality**: Found nothing. The code does what the spec asks, the tests pass, and the commit messages follow the project's format.

## Acceptance criteria
1. Tests pass, including new filterTodos and clearCompleted tests: met. I ran `npm test` myself: 11 of 11 pass.
2. Both functions exist in `src/todos.js`: met. I checked: lines 23 and 29.
3. Buttons show below the list with no console errors: met per build.md (only a missing-favicon 404 that was already there before).
4. Active / Completed / All show the right todos, count stays "2 items left": met per build.md browser run. The code counts over all todos, not the filtered view.
5. Selected filter is marked `aria-pressed="true"` and highlighted: met per build.md and the code.
6. Clear completed removes "b", survives a reload, then disables itself: met per build.md. It saves through the normal save path.
7. Ticking a todo under "Active" hides it at once: met per build.md.
8. Dark mode readable, no new hard-coded colours: met. I checked: 0 new colour codes in the stylesheet diff.
9. Only `src/` and `test/` changed: met. I checked the diff: 5 files, all in those folders.

## Your decision
Merging adds the filter buttons and the "Clear completed" button to the todo page. Nothing touches login, payments, deployment or data outside the browser, and no packages were added. "Clear completed" deletes without asking first. The spec chose this on purpose, but if you want a confirmation, ask for a rework instead.

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
git merge --no-ff factory/001-todo-filters \
  -m "feat(ui): add todo filters and a clear completed button" \
  -m "Add a footer under the todo list with All, Active and Completed
filter buttons and a Clear completed button. The selected filter is
marked with aria-pressed and is not saved across reloads. Clear
completed saves through update() and is disabled when nothing is
done. Adds pure filterTodos and clearCompleted functions with tests." \
  -m "Factory job: 001-todo-filters"
```

**3. Clean up the job's branch and folder**
```bash
git worktree remove /Users/pkalliag/Dev/AI_Code_Factory-factory/001-todo-filters && git branch -d factory/001-todo-filters
```

**4.** Back in Claude Code, run `/factory done 001-todo-filters`.

When you are ready to publish: `git push origin factory-test-app`

Not merging? In Claude Code, run `/factory rework 001-todo-filters <what to change>`
instead.
