# Technical implementation references

Official documentation inspected 2026-11-08. These sources document mechanics;
they are not empirical evidence that a marketing tactic or this factory works.

- Anthropic. (n.d.). *Extend Claude with skills*. Claude Code documentation.
  https://code.claude.com/docs/en/skills — project `.claude/skills/<name>/SKILL.md`,
  frontmatter, slash invocation and supporting references. The new skill uses
  the same project discovery pattern as the existing `/factory`.
- Anthropic. (n.d.). *Create custom subagents*. Claude Code documentation.
  https://code.claude.com/docs/en/sub-agents — project `.claude/agents/` Markdown
  definitions, tools and model fields. Consultant and reviewer share the
  marketing guidance by reading its files explicitly.
- Git project. (n.d.). *git-worktree*. Git documentation.
  https://git-scm.com/docs/git-worktree — linked worktrees share repository
  metadata while maintaining separate working directories. This change was
  developed in a feature worktree, preserving the example checkout.
- Python Software Foundation. (n.d.). *json — JSON encoder and decoder*. Python
  documentation. https://docs.python.org/3/library/json.html — the local helper
  reads JSON and writes structured results using the standard library. Input
  validation rejects invalid counts. No network or third-party package is used.

The consultation trigger, per-business directory layout, privacy defaults and
review prompts are local design decisions. The existing factory helper's generic
reviewer protocol supports the optional lens; regression tests exercise it.
End-to-end Claude Code orchestration and campaign efficacy require separate
runtime and field validation. See [measurement](measurement.md) for the
published statistical method and its actual scope.
