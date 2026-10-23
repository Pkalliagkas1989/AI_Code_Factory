# AI Code Factory

A software factory for [Claude Code](https://claude.com/claude-code): one skill,
seven subagents and a handful of markdown files. Type `/factory <feature>` and a
team of agents writes a spec, builds it on its own git branch, reviews it from
four angles, and then either merges it into `main` or asks you to decide.

```
request ─► spec-writer ─► builder ─► security · ux · ui · code  (in parallel)
                             ▲                    │
                             └──── CHANGES ◄──────┤  (max 2 extra rounds)
                                                  ▼ all PASS
                     merge into main ◄─ APPROVE ─ approver ─ ESCALATE ─► needs you
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
    approver.md               opus     → decision.md
factory/
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
  starts with `APPROVE` or `ESCALATE`.
- The four reviewers run **in parallel**. When any of them asks for changes, the
  same builder is resumed with their feedback.
- The approver escalates anything risky to you: payments, auth, deployment
  config, new dependencies, database migrations, and business decisions.
- Every job gets its own **git worktree** (`../<repo>-factory/<job-id>/`) on a
  `factory/<job-id>` branch. Open several Claude sessions and run `/factory` in
  each to build features in parallel.
- The factory **never pushes**. You decide when to push.

## Commands

```
/factory <feature>               run a new feature through the loop
/factory next                    run the first unchecked item in factory/backlog.md
/factory approve <job-id>        merge a job that is waiting for you
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
4. If the project has pages to look at, install
   [`agent-browser`](https://github.com/vercel-labs/agent-browser) so the
   builder and the UX/UI reviewers can see the running app.
5. Commit on `main`, open Claude Code in the project and run `/factory <feature>`.

The review checklists are general on purpose. Ask Claude to tailor them to your
stack once you know what matters most.

## Dashboard

```bash
cd factory && python3 -m http.server
```

Open <http://localhost:8000/dashboard.html>. Cards move across the stages, the
review chips turn green or red as verdicts come in, and jobs waiting for you are
highlighted. Click a card to read its files. It refreshes every 2 seconds.
