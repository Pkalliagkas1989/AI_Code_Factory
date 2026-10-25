# /factory next, done and rework

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
