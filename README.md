# AI Code Factory

A software factory for [Claude Code](https://claude.com/claude-code): one skill,
seven subagents and a handful of markdown files. Type `/factory <feature>` and a
team of agents writes a spec, builds it on its own git branch, and reviews it
from four angles. Then the approver explains each department's work in plain
words and hands you the exact commands to merge it. **You always do the merge.**

```
request ─► spec-writer ─► builder ─► security · ux · ui · code  (in parallel)
                             ▲                    │
                             └──── CHANGES ◄──────┤  (max 2 extra rounds)
                                                  ▼
                                              approver ─► plain-language report
                                                        + recommendation (MERGE / HOLD)
                                                        + merge commands for you to run
```

Inspired by ZazenCodes' video
[Build Your Own AI Software Factory with Claude Code](https://www.youtube.com/watch?v=ctoaIC4LHmI).
All files here were written for this repo.

## What's inside

```
.claude/
  skills/factory/SKILL.md     orchestrator: runs the loop, owns each job.json
  agents/
    spec-writer.md            opus     → spec.md
    builder.md                opus     → code commits + build.md
    reviewer-security.md      opus     → round-N/review-security.md
    reviewer-ux.md            sonnet   → round-N/review-ux.md
    reviewer-ui.md            sonnet   → round-N/review-ui.md
    reviewer-code.md          sonnet   → round-N/review-code.md
    reviewer-api.md           sonnet   → round-N/review-api.md   (backends)
    reviewer-data.md          sonnet   → round-N/review-data.md  (backends)
    approver.md               opus     → decision.md (report + merge commands)
factory/
  config.md                   base branch, reviewers, environment notes
  backlog.md                  feature queue for /factory next
  dashboard.html              live board of all jobs
  jobs/                       runtime state, one folder per job (gitignored)
templates/
  CLAUDE.md                   fill-in template for your project
```

## How it works

- The Claude session that runs `/factory` is the **orchestrator**. It starts
  every agent and is the only writer of the job's `job.json`.
- Agents don't share a conversation. They read files, and each writes **one**
  file. Reviews start with `VERDICT: PASS` or `VERDICT: CHANGES`; the decision
  starts with `RECOMMEND: MERGE` or `RECOMMEND: HOLD`.
- The reviewers run **in parallel**. Which ones run is set in `factory/config.md`. When any of them asks for changes, the
  same builder is resumed with their feedback.
- The approver writes `decision.md`: a short plain-language summary of what
  each department (spec, build, security, UX, design, code) did, a
  recommendation (MERGE, or HOLD for anything risky like payments, auth,
  deployment config, new dependencies, migrations or business decisions), and
  ready-to-paste merge commands.
- **The factory never merges, pushes or deletes branches.** You run the
  commands, then `/factory done <job-id>` confirms the merge on the dashboard.
- **Production-ready commit messages**: your project's convention from
  `CLAUDE.md`, otherwise [Conventional Commits](https://www.conventionalcommits.org)
  (`feat(auth): add password reset` plus a body explaining what and why). The
  code reviewer rejects vague messages, and the approver writes the merge
  commit message.
- Every job gets its own **git worktree** (`../<repo>-factory/<job-id>/`) on a
  `factory/<job-id>` branch. Open several Claude sessions and run `/factory` in
  each to build features in parallel.

## Commands

```
/factory <feature>               run a new feature through the loop
/factory next                    run the first unchecked item in factory/backlog.md
/factory done <job-id>           after you ran the merge commands: verify and mark merged
/factory rework <job-id> <note>  send a waiting job back to the builder with feedback
```

## Adding it to a project

1. Copy `.claude/` and `factory/` into the project's root.
2. Add these lines to the project's `.gitignore`:
   ```
   /factory/jobs/*
   !/factory/jobs/.gitkeep
   ```
3. Copy `templates/CLAUDE.md` to the project root (or merge it into the existing
   one) and fill it in. Agents learn the setup, dev server, tests and
   conventions from it, and nothing else.
4. Edit `factory/config.md`: the base branch, the reviewers
   (`security, ux, ui, code` for web apps, `security, api, data, code` for
   backends), and any environment notes the agents need.
5. If the project has pages to look at, install
   [`agent-browser`](https://github.com/vercel-labs/agent-browser) so the
   builder and the UX/UI reviewers can see the running app.
6. Commit on the base branch, open Claude Code in the project and run `/factory <feature>`.

The review checklists are general on purpose. Ask Claude to tailor them to your
stack once you know what matters most.

## Dashboard

```bash
cd factory && python3 -m http.server
```

Open <http://localhost:8000/dashboard.html>. Cards move across the stages, the
review chips turn green or red as verdicts come in, and jobs waiting for you
("ready to merge" or "needs you") are highlighted. Click a card to read its files. It refreshes every 2 seconds.
