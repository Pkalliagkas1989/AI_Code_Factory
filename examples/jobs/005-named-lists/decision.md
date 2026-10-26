RECOMMEND: MERGE

## In short
People can now keep several named todo lists, each with its own todos. A row of list buttons sits above the input. Todos you already have move into a list called "My todos", and the old saved copy is kept. The round-1 bug is fixed: deleting a list now closes a half-finished rename. All four reviews pass, the tests pass, and I recommend MERGE.

## What each department did
- **Spec**: Asked for a list switcher with add, rename and delete. Names must be non-empty, at most 40 characters and unique ignoring case, and the last list can't be deleted. Todos, filters and footer buttons act on the open list only. The app reopens the last list after a reload, and existing todos move into "My todos" without loss.
- **Build**: Added tested list functions in `src/todos.js`, plus the switcher, the inline name field and per-list behaviour in the page. Lists are saved under a new browser storage key, `todoLists`. 35 unit tests pass, and every criterion was checked in a real browser. Round 2 fixed the rename-after-delete bug.
- **Security**: List names and todo text go onto the page only as plain text. There is no server, no new dependency and no secret. No findings.
- **UX (how it behaves)**: Checked adding, renaming and deleting in the browser, including delete with a rename field open, and the phone width. No findings. Minor taste note: error messages are muted grey.
- **UI (how it looks)**: Checked the list buttons in light and dark mode at desktop and phone widths. They match the page's style and long names don't break the layout. No findings.
- **Code quality**: Round 2's fix reuses one small helper and changes nothing else. The tests pass and only the allowed files changed. No findings.

## Acceptance criteria
1. Tests for each new function: met. I ran `npm test`: 35 of 35 pass.
2. No `innerHTML`: met. I checked with grep and it found nothing.
3. Old todos move into "My todos": met. I fed the spec's two old todos into the start-up function myself. Both ended up in "My todos" unchanged. The code only reads the old key and never rewrites it.
4. Empty storage gives one empty "My todos": met. Checked by the builder in the browser with no console errors. I confirmed the logic by hand.
5. Add-list rules: met. I checked that "  Work  " becomes "Work", "work" is refused as a duplicate, 41 characters are refused and 40 are allowed. One nuance: the text box stops typing or pasting at 40 characters, so a pasted 41-character name gets cut to 40 and accepted. The 40-character rule still holds.
6. Rename rules: met. I checked that "Work" to "WORK" is accepted and "my todos" is refused.
7. Each list keeps its own todos and footer: met. The builder checked it in the browser and the UX reviewer agreed.
8. Delete asks first and is disabled for the last list: met. The builder and the UX reviewer both checked it, including the round-2 fix.
9. The open list comes back after a reload: met. The builder checked it in the browser, and a unit test covers the saved open list.
10. A name like `<b>x</b>` shows literally: met. Names are set as plain text, as the builder checked.
11. Dark mode and no new hard-coded colours: met. I grepped the CSS change and found no colour codes. The UI reviewer checked dark mode.
12. Only `src/`, `test/` and `CLAUDE.md` changed: met. I checked the diff summary.

Branch check: it merges into `factory/004-mark-all-done` with no conflicts. All three commit messages follow Conventional Commits.

## Your decision
Merging adds named lists. It also changes how the app saves data in the browser. Todos now live under a new `todoLists` key, and the old `todos` key stays as a frozen copy. Nothing is lost on the first load. This only uses browser storage, which matches your decision of 2026-10-25 that todos stay in this browser only. One thing to keep in mind: if you later undo this change, the app goes back to the frozen old copy. Todos added after the merge would not show.

This job sits on top of 004 and 003, which are not merged yet. The commands below merge it into 004's branch, using 004's worktree, because that branch is checked out there. Merge 004 into 003, and then 003 into `example/todo-app`, using those jobs' own commands. Another way is to merge `factory/005-named-lists` straight into `example/todo-app` once, which brings in all three jobs.

Before step 3: the UI reviewer left a stray screenshot, `ui-phone-dark.png`, in this job's worktree. Step 3 deletes it first, because git won't remove a worktree that has untracked files.

## Commands
Run these in a terminal, one step at a time. Nothing is merged until you do.
If a step prints an error, stop there and ask Claude what to do.

**1. Go to the base branch's checkout and check it's clean**
```bash
cd /Users/pkalliag/Dev/AI_Code_Factory-factory/004-mark-all-done && git status --short
```
Nothing should be listed. Commit or stash anything else first.

**2. Merge**
```bash
git merge --no-ff factory/005-named-lists \
  -m "feat(lists): let people keep several named todo lists" \
  -m "Add a list switcher above the input with add, rename and delete for
the open list. Names are trimmed, required, at most 40 characters and
unique ignoring case; the last list cannot be deleted. Todos, filters,
the counter, Mark all as done and Clear completed act on the open list.
Lists and the open list are saved under the new localStorage key
todoLists; existing todos move into a My todos list and the old todos
key is only read, never changed." \
  -m "Factory job: 005-named-lists"
```

**3. Clean up the job's branch and folder**
```bash
rm /Users/pkalliag/Dev/AI_Code_Factory-factory/005-named-lists/ui-phone-dark.png && git worktree remove /Users/pkalliag/Dev/AI_Code_Factory-factory/005-named-lists && git branch -d factory/005-named-lists
```

**4.** Back in Claude Code, run `/factory done 005-named-lists`.

When you are ready to publish, first merge 004 and 003 down into `example/todo-app`. Then run `git push origin example/todo-app` from `/Users/pkalliag/Dev/AI_Code_Factory`.

Not merging? In Claude Code, run `/factory rework 005-named-lists <what to change>` instead.
