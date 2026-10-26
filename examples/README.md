# Example: a todo app built with the AI Code Factory

This branch, `example/todo-app`, is a small todo-list web app that grows one
feature at a time through `/factory`. Each feature has a full record of how the
factory built it: the spec, the build report, every review, the approver's
decision and what it cost.

## What the factory built, and what it didn't

| Part | Built by | Record |
| --- | --- | --- |
| Starting app: add, tick and delete todos, saved in the browser | Written by hand, to give the factory a real project to work on | commit `b4ce7dc` |
| Filters (All / Active / Completed) and "Clear completed" | Factory job 001, 1 review round | [`jobs/001-todo-filters`](jobs/001-todo-filters) |
| Edit a todo by double-clicking it | Factory job 002, 2 review rounds | [`jobs/002-edit-todo`](jobs/002-edit-todo) |
| "N items left" wording moved into a tested function | Factory job 003, 1 review round | [`jobs/003-items-left-counter`](jobs/003-items-left-counter) |
| "Mark all as done" button next to the counter | Factory job 004, 2 review rounds, built on top of 003 | [`jobs/004-mark-all-done`](jobs/004-mark-all-done) |
| Several named todo lists, with old todos moved into "My todos" | Factory job 005, 1 round plus a rework, built on top of 004 | [`jobs/005-named-lists`](jobs/005-named-lists) |

Every feature from here on goes through the factory.

## The jobs so far

| Job | Rounds | Agent runs | Tokens | What happened |
| --- | --- | --- | --- | --- |
| 001-todo-filters | 1 | 8 | 131k | All four reviewers passed. The code reviewer at first answered only in chat and had to be reminded to write its file, which led to the "one reminder" rule. |
| 002-edit-todo | 2 | 12 | 220k | The code reviewer caught a real bug the tests missed: ticking two todos quickly lost the first tick. Fixed in round 2. |
| 003-items-left-counter | 1 | 7 | 107k | The counter already existed (job 001 added it). The spec writer noticed and turned the job into a small clean-up instead of building it twice. |
| 004-mark-all-done | 2 | 12 | 208k | Started on 003's unmerged branch with `--after`. The UI reviewer sent it back once because "Clear completed" wrapped onto its own line. |
| 005-named-lists | 2 | 13 | 290k* | The heaviest job: about 300 lines and 14 new tests. The builder hit a usage limit and was resumed. The approver held it for a bug a reviewer had called minor (a pending rename could rename the wrong list); one rework fixed it. |

\* Job 005's builder reported no tokens for the part before the usage limit,
so its real cost is somewhat higher.

Jobs 003 to 005 ran as a chain: each started on the one before without a
merge in between, and the three were merged in order at the end. They also
used the factory's "Decided by the human" list: the approver of job 004 and 005
relied on the decision that todos stay in the browser instead of holding for it.

Things to know when reading the records:

- In jobs 001 and 002 the UX and design reviewers only read the code. They didn't
  open the app, even in job 002 when the browser tool was installed. The
  factory now requires them to open it and checks that they did, so jobs 003
  to 005 include their screenshots.
- Job 002's second builder run reports 47k tokens for a 45-second fix. That
  figure probably includes its round 1 work, so the job total may be higher
  than the real cost.

To read a job, open its folder and start with `decision.md`, the approver's
plain-language summary. `job.json` has the tokens and time for every agent run.
The paths and branch names inside the records are as they were when the job
ran (this branch was called `factory-test-app` then).

## Run the app

Needs Node 20 or newer. There is nothing to install.

```bash
npm test                 # unit tests
npm run dev -- 8080      # then open http://localhost:8080/index.html
```

## Add the next feature

1. Bring in the latest factory: `git switch example/todo-app && git merge main`.
2. In Claude Code, on this branch: `/factory <the feature>`, or add it to
   `factory/backlog.md` and run `/factory next`.
3. Review the approver's report and run its merge commands, then
   `/factory done <job-id>`.
4. Keep the record: `cp -R factory/jobs/<job-id> examples/jobs/`, add a row to
   the tables above, and commit.
