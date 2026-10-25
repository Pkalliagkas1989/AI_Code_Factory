# Factory config

Settings for this project. The orchestrator and every agent read this file,
so keep it short.

base_branch: example/todo-app
reviewers: security, ux, ui, code
always: security, code
paths.ux: src/
paths.ui: src/
light_paths: *.md, docs/

<!--
base_branch  The branch jobs start from and merge back into.
reviewers    Review lenses, each matching .claude/agents/reviewer-<lens>.md.
             Web apps: security, ux, ui, code. Backends: security, api, data, code.
always       Lenses that run in every round. Keep security and code here.
paths.<lens> Path prefixes. A conditional lens runs only when a changed file
             starts with one of them. Without a paths line, it always runs.
light_paths  Low-risk changes. When every changed file matches, the security
             review uses Sonnet instead of Opus. It still runs.
-->

## Setup for a new worktree

Commands the orchestrator runs inside every new worktree, after `CLAUDE.md`'s
fresh-checkout setup. Leave empty if there are none.

```bash
```

## Decided by the human

Product calls the human has already made, one per line, with the date. Agents
treat them as settled: the spec-writer follows them and the approver doesn't
hold a job for them again. Leave empty if there are none.

## Notes for agents

Project facts every agent needs that `CLAUDE.md` doesn't say.
