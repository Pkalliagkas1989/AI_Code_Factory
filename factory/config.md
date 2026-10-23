# Factory config

Settings for this project. The orchestrator and every agent read this file.

base_branch: main
reviewers: security, ux, ui, code

<!--
base_branch  The branch jobs start from and merge back into.
reviewers    Comma-separated review lenses, each matching
             .claude/agents/reviewer-<lens>.md. All of them run in parallel.
             Web apps: security, ux, ui, code
             Backends: security, api, data, code
-->

## Setup for a new worktree

Commands the orchestrator runs inside every new worktree, after
`CLAUDE.md`'s own fresh-checkout setup. Leave empty if there are none.

```bash
```

## Notes for agents

Project facts every agent must know that `CLAUDE.md` doesn't say, for example
where the Python environment lives or which commands must never run.
