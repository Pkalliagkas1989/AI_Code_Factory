# /factory next, chain, resume, done and rework

Read this file only when the user runs one of these commands. `F` is
`python3 .claude/skills/factory/scripts/factory.py`, run from the main checkout.

## /factory next [n]

Take the first `- [ ]` line in `factory/backlog.md`. Claim it with a single Edit
that turns that exact line into `- [x] <item> → claimed`. If the Edit fails, the
line changed under you (another session took it): re-read and try the next
unchecked line. If there are none, say so and stop. Run `/factory <item>`, and
once `F new` has printed the job id, replace `claimed` with it.

**Batching** (`n` from 2 to 3) saves the per-agent startup cost on small fixes.
Claim up to `n` unchecked items one at a time, as above, and run them as **one**
job. The feature text is the items as a numbered list, and the slug describes
the group. Batch only items that are each small and that touch related code.
Never batch an item about auth, permissions, payments, secrets, migrations or
deployment: run it alone, so its review is not diluted. If any item is like
that, claim it as a job of its own and tell the user.

## /factory chain N [after JOB]

For backlog items that build on each other, when nothing is merged in between
(a plan's tasks, a demo, a test run). Runs the next `N` unchecked items as
**separate** jobs, each one on top of the job before it.

1. Claim the first unchecked item as in **/factory next** and run it as
   `/factory <item>`. Give `F new` `--after <JOB>` when the user named one,
   otherwise no `--after`.
2. When that job reaches `ready` or `needs-human`, take the next item and run it
   with `F new … --after <previous job-id>`. Don't wait for the human to merge:
   the chain is the point. A `needs-human` job still counts as done for the
   chain; tell the user it is waiting for them and carry on.
3. Stop early when a job ends `BLOCKED`, because everything after it would build
   on a broken branch. Tell the user which items are left.
4. At the end, list each job with its recommendation and tokens, and say which
   branch holds the whole chain (the last job's).

**Merging a chain.** Either merge the last job's branch into the base branch
once, which brings in every job before it, or merge each job into the one it
builds on from the top down. Then run `/factory done` for every job: a chained
job counts as merged when its work reached its own base or the config's
`base_branch`. Never delete a job's branch while a later job still builds on
it; the approver leaves that cleanup out for you.

Never change `base_branch` in the config to chain jobs.

## /factory resume JOB-ID

After a usage limit, a crash or a lost session. Run `F resume <job-id>` and do
what `next` says, then carry on from that point in `SKILL.md`:

| `next` | Do |
| --- | --- |
| `spec-writer` | Check the worktree exists and run its setup again (step 3 of **/factory FEATURE**), then spawn the spec-writer. |
| `builder` | If the stage is still `spec`, run `F set <job-id> stage=build` first. Then `SendMessage` to `builder-<job-id>` if it still exists, else spawn a fresh builder named `builder-<job-id>` with `<prompt_prefix> Build round <round + 1, or 1>. Port: <builder_port>. You were interrupted: read build.md and git log first and continue; don't redo finished work.` |
| `build` | **Check the build**: the builder finished but `F build` never ran. |
| `start-round N` | **Review round N**. |
| `reviewers` | Run `F verdict` for each lens in `verdict_lenses` (its file is already written). Spawn only the lenses in `pending_lenses`, as in **Review round N** step 2. |
| `approve` | **Approve**. |
| `approver` | Spawn the approver with `<paths> Final round: <round>.` |
| `decision` | Run `F decision <job-id>` and hand over. |
| `human` / `none` | Nothing to run: show the job's state. |

If `interrupted` lists runs, tell the user which ones were cut short.

## /factory done JOB-ID

The human says they have run the merge commands. Check it, but change nothing in
git:

1. Run `F done <job-id>`. It checks the job is waiting for the human, that its
   reviewed commit is on the base branch, and then marks it `merged`.
2. If it fails because the merge isn't on the base yet, point to the
   **Commands** in `decision.md` and stop.
3. If it reports `worktree_left` or `branch_left`, give the user the cleanup
   commands from `decision.md` to run.
4. Remind them that the base branch is not pushed until they run
   `git push origin <base>`.

## /factory rework JOB-ID NOTE

Only for a job in `ready` or `needs-human`.

1. Save the note verbatim as `rework-<k>.md` in the job folder (next unused `k`).
2. Run `F set <job-id> stage=build`, then `F info <job-id>` for the prompt prefix
   and the builder port.
3. Spawn a fresh `builder` named `builder-<job-id>` with
   `<prompt_prefix> Rework: read rework-<k>.md and address it, then update build.md for round N+1. Port: <builder_port>.`
   where `N` is the job's last round. The resume counter starts over.
4. Carry on from **Check the build** in `SKILL.md`.
