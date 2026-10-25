# Job state and reviewer selection

Background for the orchestrator. `scripts/factory.py` implements all of this;
read this file when a script result surprises you or a user asks how a choice
was made.

## Paths

- `<repo>`: the main checkout, from `git rev-parse --show-toplevel`.
- Job folder: `<repo>/factory/jobs/<job-id>/`. This is gitignored runtime state.
- Worktree: `<repo>/../<repo name>-factory/<job-id>/`, checked out on
  `factory/<job-id>`. Always an absolute path.
- `factory/jobs/.claims/NNN`: one empty file per job number, created with an
  exclusive open, so two sessions never take the same number. The dashboard
  ignores it.

Inside a job folder:

```
job.json                      state, written only by the script, read by the dashboard
spec.md                       spec-writer
build.md                      builder
rework-<k>.md                 orchestrator, from /factory rework
round-<N>/review-<lens>.md    one per reviewer per round
decision.md                   approver
```

## job.json

```json
{ "id": "004-contact-form", "feature": "Add a contact form to the about page",
  "branch": "factory/004-contact-form",
  "worktree": "/Users/me/Dev/my-app-factory/004-contact-form",
  "stage": "review", "round": 1,
  "reviews": { "security": "PASS", "ux": "pending", "ui": "pending", "code": "CHANGES" },
  "reviewed": { "1": "5fe8659" },
  "tokens": { "spec-writer": 47430, "builder r1": 48128 } }
```

- `stage`: `spec`, `build`, `review`, `approve`, `ready`, `needs-human` or
  `merged`. Worktree setup counts as `spec`. `ready` means the approver
  recommends merging and the human has not merged yet.
- `round`: the current review round, or `0` before the first one.
- `reviews`: the current round only, one key per lens in `reviewers`, in order
  (the dashboard takes the lens names from it). Each value is `pending`,
  `PASS`, `CHANGES` or `skipped`.
- `reviewed`: the branch commit each round reviewed.
- `head`: added at the approve stage. The commit the approver judged.
  `/factory done` checks it is on the base branch.
- `tokens`: tokens per agent run, only when the agent's result reports them.
  Never guessed.

The file is rewritten whole on every change, through a temporary file and a
rename, so the dashboard never reads half of it.

## Ports

With `n` the job number (`004` → 4), the builder gets `5100 + 10n` and the
reviewer at position `i` in `reviewers` (from 0) gets `5101 + 10n + i`. Parallel
jobs never collide.

## Selecting reviewers

Security and code quality come first, so skipping only ever applies to lenses
not listed in `always`. When in doubt, a lens runs.

- Round 1: every lens in `always` runs. Another lens runs when any file changed
  by the job starts with one of its `paths.<lens>` prefixes, or when it has no
  `paths.` line.
- Round 2 and later: every lens in `always` runs again, because fixes can
  introduce new problems. Another lens runs only when it said `CHANGES` last
  round, or when files changed since the last reviewed commit match its paths.
  A skipped lens's last verdict stands; the approver reads it from the earlier
  round folder.

## Choosing models

Each agent's file sets its model. One exception: when **every** file the job
changed matches `light_paths` (a prefix, or a `*.ext` pattern), the security
reviewer runs on `sonnet` instead of `opus`. Any code change keeps it on `opus`.
