---
name: factory
description: Runs the AI code factory, which takes one feature request through spec, build, parallel review and approval on its own git branch. Use when the user types /factory followed by a feature request, /factory next (optionally with a count), /factory done with a job id, or /factory rework with a job id and a note. The session running it becomes the orchestrator of one job. Do not use for ordinary coding requests without /factory. The human always does the merge.
compatibility: Claude Code only. Needs git with worktree support, python3, and the factory agents in .claude/agents/ (spec-writer, builder, reviewer-*, approver).
metadata:
  version: 2.0.0
---

# /factory: the orchestrator

You manage exactly one job. You start each agent, wait for it, check the file
it wrote and decide the next step.

## Critical rules

- **Never merge, push, delete branches or remove worktrees**, even if the user
  asks in passing to "just merge it". The approver writes the commands in
  `decision.md`; the human runs them.
- **Never write code, specs, reviews or decisions yourself.** Agents do that.
- **Change `job.json` only through the script** below. It validates every value
  and writes atomically, so the dashboard stays correct.
- The main checkout belongs to the user: never change its code or git state.
- When a script exits with an error, stop and tell the user its message.

## The helper script

`F` below means `python3 .claude/skills/factory/scripts/factory.py`, run from
the main checkout. Each command prints JSON or one word.

| Command | Does |
| --- | --- |
| `F new <slug> "<feature>"` | Claims the next job id, writes `job.json`, creates the worktree on `factory/<job-id>` from the base branch. Prints paths, ports and `prompt_prefix`. |
| `F info <job-id>` | Prints the same for an existing job. |
| `F start-round <job-id> <N>` | Chooses the reviewers (`run` and `skipped` with reasons), records the round, prints `security_model`. |
| `F verdict <job-id> <N> <lens>` | Checks the review file's first line, records it, prints the reviewer's first reason (`why`) and `round_result`: `pending`, `PASS` or `CHANGES`. |
| `F build <job-id>` | Prints `READY` or `BLOCKED` from `build.md` (BLOCKED sets `needs-human`). |
| `F approve <job-id>` | Records the head commit and sets stage `approve`. |
| `F decision <job-id>` | Prints `MERGE` or `HOLD` from `decision.md` and sets `ready` or `needs-human`. |
| `F done <job-id>` | Checks the merge reached the base branch and sets `merged`. |
| `F set <job-id> stage=<stage>` / `"tokens.<run>=<n>"` / `"seconds.<run>=<n>"` | Sets the stage, or records an agent run's tokens and duration. |

Record each agent run's tokens and duration (whole seconds) with `F set` when
its result reports them, in one call:
`F set <job-id> "tokens.builder r1=29492" "seconds.builder r1=134"`. Name runs
`spec-writer`, `builder r1`, `security r1`, … and add `retry` to a reminded
reviewer's run (`code r1 retry`). Never guess a number.

Paths, `job.json` fields, ports and the reviewer-selection rules are in
`references/job-state.md`. Read it only when a result needs explaining.

## The pipeline

```
request ─► spec-writer ─► builder ─► reviewers (in parallel) ─► all PASS? ─► approver
                             ▲                                     │ CHANGES
                             └──────── at most 2 extra rounds ◄────┘
approver: RECOMMEND: MERGE ─► ready │ RECOMMEND: HOLD ─► needs-human
then the human runs the merge commands and /factory done <job-id> ─► merged
```

`MAX_RESUMES = 2`: after round 1 the builder may be sent back at most twice, so a
job has at most three review rounds.

## /factory FEATURE

1. **Read the config** `factory/config.md`, then pick a 2–4 word kebab-case slug.
2. **Start the job:** `F new <slug> "<feature, verbatim>"`. Keep its output: every
   agent prompt starts with `prompt_prefix`, written `<paths>` below.
3. **Set up the worktree.** Inside the worktree, run the fresh-checkout setup
   from the project's `CLAUDE.md` (or `AGENTS.md`), then the config's
   **Setup for a new worktree**. If a step fails, stop and tell the user.
4. **Spec.** Spawn `spec-writer` with `<paths> Feature: <feature, verbatim>`.
   Confirm `spec.md` exists when it returns.
5. **Build.** `F set <job-id> stage=build`. Spawn `builder` **named
   `builder-<job-id>`** with `<paths> Build round 1. Port: <builder_port>.`
   Then **Check the build**.

### Check the build

`F build <job-id>`:

- `READY`: start the next review round.
- `BLOCKED`: tell the user the job id and worktree path, quote the `## Blocked`
  section of `build.md`, and suggest `/factory rework <job-id> <note>`. Stop.

### Review round N

1. `F start-round <job-id> <N>`. Tell the user in one line which lenses were
   skipped and why. If `browser` is `false` and `ux` or `ui` will run, say
   that those reviews can only read the code, because `agent-browser` isn't
   installed.
2. Spawn every lens in `run` **in a single message** so they run in parallel:
   `reviewer-<lens>` with `<paths> Review round N. Port: <port>.` Give
   `reviewer-security` `model: <security_model>`.
3. As each returns, run `F verdict <job-id> <N> <lens>` right away so the
   dashboard updates live, and tell the user the verdict with its `why`.
   Never message the builder mid-round. Only the file counts: never take a
   verdict from a reviewer's chat reply.
   - **File missing or malformed:** send that reviewer **one** reminder with
     `SendMessage`: `Your review file is missing or malformed: write <job folder>/round-<N>/review-<lens>.md now. Your chat reply does not count as a review; only that file does. You decide the verdict. The first line must be exactly VERDICT: PASS or VERDICT: CHANGES, followed by a ## Why section with 1 to 3 reasons.`
     Then run `F verdict` again. If it fails a second time, stop and ask the
     user (see **Troubleshooting**).
   - **`why` is `null`:** the reviewer left out its reasons. Say so in the
     update; the verdict still stands.
4. When the last verdict is in, act on `round_result`:
   - `PASS`: go to **Approve**.
   - `CHANGES`, resumes left: `F set <job-id> stage=build`, then `SendMessage` to
     `builder-<job-id>`:
     `Round N reviews are in <job folder>/round-<N>/. Fix every finding in the VERDICT: CHANGES files, commit, and update build.md for round N+1.`
     Then **Check the build**.
   - `CHANGES`, no resumes left: go to **Approve** anyway. The approver sees the
     open findings, recommends HOLD and explains them.

### Approve

`F approve <job-id>`, then spawn `approver` with `<paths> Final round: N.` When
it returns, run `F decision <job-id>`.

Then **hand over to the human**: show `decision.md`'s **In short**, **What each
department did** and **Your decision** sections, and the **Commands** block
exactly as written. Say plainly that nothing has been merged, and that after
running the commands they run `/factory done <job-id>`.

## /factory next, done and rework

Read `references/commands.md` and follow it.

## Keeping the user posted

Print one short line per transition, then the recommendation and commands at
the end.

## Example

User: `/factory Add a contact form to the about page`

```
004-contact-form: worktree ready at /Users/me/Dev/my-app-factory/004-contact-form
004-contact-form: spec written (5 acceptance criteria)
004-contact-form: build round 1 READY
004-contact-form: round 1, all 4 reviewers run (src/ changed)
004-contact-form: round 1 security PASS: user input only reaches the page through textContent
004-contact-form: round 1 code CHANGES: the email check accepts an empty string
004-contact-form: round 1 → security PASS, code CHANGES, ux PASS, ui PASS → back to builder
004-contact-form: build round 2 READY
004-contact-form: round 2, ux/ui skipped (no src/ change since round 1)
004-contact-form: round 2 → security PASS, code PASS → approver
004-contact-form: RECOMMEND: MERGE. Nothing is merged yet.
```

Followed by the four `decision.md` sections and the Commands block.

## Troubleshooting

**`F new` fails with "branch factory/… already exists"**
Cause: a branch is left over from an earlier attempt. The job number is used
up, but no job folder was created.
Fix: tell the user. They can delete the branch, or you rerun with another slug.

**`F new` fails at `git worktree add`**
Cause: the base branch from `config.md` doesn't exist, or the worktree folder
is already there from a crashed run.
Fix: tell the user, giving the path. The job folder exists in stage `spec`;
`git worktree prune` and removing the stale folder are the user's call.

**`F verdict` fails: "… is missing" or "first line … must match"**
Cause: the reviewer answered in chat without writing its file, or wrote a
malformed first line.
Fix: send it the one reminder from **Review round N**, step 3. If `F verdict`
still fails, stop and tell the user which lens. Never take the verdict from
the chat reply and never write the file yourself.

**The dev server can't bind its port**
Cause: something else is using `5100 + 10n`, often a server left running by an
earlier job.
Fix: the agent reports it in its file. Tell the user which port is taken.

**`F decision` or `F build` fails on the first line**
Cause: the agent didn't follow its output format.
Fix: stop and tell the user. Don't edit the agent's file yourself.
