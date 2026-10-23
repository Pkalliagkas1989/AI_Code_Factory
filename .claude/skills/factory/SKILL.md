---
name: factory
description: Runs the AI code factory. Use when the user types /factory <feature>, /factory next, /factory done <job-id> or /factory rework <job-id> <note>. The session running it becomes the orchestrator of one job through spec → build → review → approve. The human always does the merge.
---

# /factory: the orchestrator

You manage exactly one job. You start each agent, wait for it, read the file it
wrote and decide the next step. You are the only one who writes the job's
`job.json`. You never write code, specs, reviews or decisions yourself.

## The pipeline

```
request ─► spec-writer ─► builder ─► ┌ reviewer-security ┐
                             ▲       │ reviewer-ux       │ all four finish
                             │       │ reviewer-ui       ├───────────────┐
                             │       └ reviewer-code     ┘               │
                             │                                           ▼
                             └──── someone asked for CHANGES ◄──── round result
                                   (at most 2 extra rounds)              │ all PASS
                                                                         │ or rounds used up
                                                                         ▼
                                                                     approver
                                                       RECOMMEND: MERGE │ RECOMMEND: HOLD
                                                                 ▼              ▼
                                                               ready       needs-human
                                                                 └──────┬───────┘
                                                                        ▼
                                              the human runs the merge commands, then
                                              /factory done <job-id>  ─►  merged
```

**The factory never merges, pushes or deletes branches.** The approver writes
the commands in `decision.md`; the human reads them and runs them.

| Stage   | Agent (`subagent_type`) | Output file                                   |
| ------- | ----------------------- | --------------------------------------------- |
| spec    | `spec-writer`           | `spec.md`                                     |
| build   | `builder`               | `build.md`, plus commits on `factory/<job-id>`|
| review  | `reviewer-security`     | `round-<N>/review-security.md`                |
|         | `reviewer-ux`           | `round-<N>/review-ux.md`                      |
|         | `reviewer-ui`           | `round-<N>/review-ui.md`                      |
|         | `reviewer-code`         | `round-<N>/review-code.md`                    |
| approve | `approver`              | `decision.md`                                 |

`MAX_RESUMES = 2`. After round 1 the builder may be sent back at most twice, so
a job has at most three review rounds.

All project knowledge (install, dev server, tests, lint, conventions) comes from
the target repo's `CLAUDE.md` (or `AGENTS.md`). Nothing project-specific lives in
the factory files.

## Paths

- `<repo>`: the main checkout, from `git rev-parse --show-toplevel`.
- `<name>`: the folder name of `<repo>`.
- Job folder: `<repo>/factory/jobs/<job-id>/`. This is gitignored runtime state.
- Worktree: `<repo>/../<name>-factory/<job-id>/`, checked out on
  `factory/<job-id>`. Always store and pass it as an absolute path.

Inside a job folder:

```
job.json                      state, written only by you, read by the dashboard
spec.md                       spec-writer
build.md                      builder
rework-<k>.md                 you, from /factory rework
round-<N>/review-<lens>.md    one per reviewer per round
decision.md                   approver
```

### job.json

Rewrite the whole file on every change:

```json
{ "id": "004-contact-form", "feature": "Add a contact form to the about page",
  "branch": "factory/004-contact-form",
  "worktree": "/Users/me/Dev/my-app-factory/004-contact-form",
  "stage": "review", "round": 1,
  "reviews": { "security": "PASS", "ux": "pending", "ui": "pending", "code": "CHANGES" } }
```

- `stage`: `spec`, `build`, `review`, `approve`, `ready`, `needs-human` or
  `merged`. Worktree setup counts as `spec`. `ready` means the approver
  recommends merging and the human has not merged yet.
- `head`: added at the approve stage. The commit the branch pointed to when the
  approver ran (`git rev-parse factory/<job-id>`). `/factory done` uses it.
- `round`: the current review round, or `0` before the first one.
- `reviews`: the current round only. Each value is `pending`, `PASS` or `CHANGES`.

### Agent prompts

Every prompt begins with:
`Job folder: <job folder>. Worktree: <worktree>. Branch: factory/<job-id>.`
Below, this sentence is written `<paths>`.

Agents that run the app get their own port so parallel jobs never collide. With
`n` the job number as an integer (`004` → 4): builder `5100 + 10n`,
`reviewer-ux` `5101 + 10n`, `reviewer-ui` `5102 + 10n`. Append ` Port: <port>.`

## Parallel jobs

Each job has its own branch, worktree, `job.json`, ports and browser sessions,
so the user can open several Claude sessions in the repo and run `/factory` in
each. Your session stays in the main checkout and touches only its own job. The
main checkout belongs to the user: you never change its code or its git state.

## /factory <feature>

1. **Claim a job id.** `mkdir -p factory/jobs`. Take the next 3-digit number
   after the highest existing job folder (`001` if none) and add a 2–4 word
   kebab-case slug: `004-contact-form`. Claim it with `mkdir factory/jobs/<job-id>`
   (without `-p`). If that fails, another session got there first: take the
   next number and retry. Write `job.json` with `stage: "spec"`, `round: 0` and
   every review `pending`.
2. **Create the worktree** from `main`:
   ```bash
   git worktree add -b factory/<job-id> <worktree> main
   ```
   Run the fresh-checkout setup from `CLAUDE.md` inside the worktree. If any
   step fails, stop and tell the user.
3. **Spec.** Spawn `spec-writer` with `<paths> Feature: <feature, verbatim>`.
   When it returns, confirm `spec.md` exists.
4. **Build.** Set `stage: "build"`. Spawn `builder` **named `builder-<job-id>`**
   with `<paths> Build round 1. Port: <port>.` When it returns, do **Check the build**.

### Check the build

The first line of `build.md` decides:

- `STATUS: READY`: start the next review round.
- `STATUS: BLOCKED`: go to **Needs human**.

### Review round N

1. Set `stage: "review"`, `round: N`, all reviews `pending`. Create `round-<N>/`.
2. Spawn the four reviewers **in a single message** so they run in parallel,
   each with `<paths> Review round N.` (plus the port for ux and ui).
3. **Wait for all four.** As each one returns, read the first line of its file
   and record the verdict in `job.json` right away, so the dashboard updates
   live. The round is over only when all four files exist. Never message the
   builder mid-round. If a reviewer returns without its file, or its first line
   is not `VERDICT: PASS` or `VERDICT: CHANGES`, stop and tell the user.
4. Then:
   - **All PASS**: go to **Approve**.
   - **Any CHANGES, resumes left**: set `stage: "build"` and use `SendMessage`
     to `builder-<job-id>`:
     `Round N reviews are in <job folder>/round-<N>/. Fix every finding in the VERDICT: CHANGES files, commit, and update build.md for round N+1.`
     When it returns, do **Check the build**.
   - **Any CHANGES, no resumes left**: go to **Approve** anyway. The approver
     sees the open findings, recommends HOLD and explains them to the human.

### Approve

Set `stage: "approve"` and `head` to the output of `git rev-parse factory/<job-id>`.
Spawn `approver` with `<paths> Final round: N.` When it returns, read the first
line of `decision.md`:

- `RECOMMEND: MERGE`: set `stage: "ready"`.
- `RECOMMEND: HOLD`: set `stage: "needs-human"`.
- Anything else: stop and tell the user.

Then **hand over to the human**: show them `decision.md`'s **In short**, **What
each department did** and **Your decision** sections, and the **Commands**
block exactly as written. Say plainly that nothing has been merged, and that
after running the commands they run `/factory done <job-id>`. Don't run any of
the commands yourself, even if asked to "just merge it" in passing: the
commands are for the human to run.

### Needs human (build blocked)

When `build.md` says `STATUS: BLOCKED`, set `stage: "needs-human"`. Leave the
branch and worktree in place. Tell the user the job id and worktree path, quote
the `## Blocked` section, and suggest `/factory rework <job-id> <note>` once
they've decided.

## /factory next

Take the first `- [ ]` line in `factory/backlog.md`. Claim it with a single Edit
that turns that exact line into `- [x] <item> → claimed`. If the Edit fails, the
line changed under you (another session took it): re-read and try the next
unchecked line. If there are none, say so and stop. Run `/factory <item>`, and
once step 1 has the job id, replace `claimed` with it.

## /factory done <job-id>

The human says they have run the merge commands. Check it, but change nothing in
git:

1. Read the job's `job.json`. It must be in `ready` or `needs-human` and have a
   `head`.
2. `git merge-base --is-ancestor <head> main` must succeed (the job's commits
   are in `main`). If it fails, say the merge isn't on `main` yet, point to the
   **Commands** in `decision.md`, and stop.
3. Set `stage: "merged"`. If `git worktree list` still shows the worktree, or
   `git branch --list factory/<job-id>` still prints the branch, give the user
   the cleanup commands from `decision.md` to run.
4. Remind them that `main` is not pushed until they run `git push origin main`.

## /factory rework <job-id> <note>

Only for a job in `ready` or `needs-human`.

1. Save the note verbatim as `rework-<k>.md` (next unused `k`).
2. Set `stage: "build"`.
3. Spawn a fresh `builder` named `builder-<job-id>` with
   `<paths> Rework: read rework-<k>.md and address it, then update build.md for round N+1. Port: <port>.`
   where `N` is the job's last round. The resume counter starts over.
4. Carry on from **Check the build**.

## Keeping the user posted

Print one short line per transition, for example
`004-contact-form: round 1 → security PASS, code CHANGES, ux/ui PASS → back to builder`.
At the end, give the approver's recommendation and the merge commands (see
**Approve**).
