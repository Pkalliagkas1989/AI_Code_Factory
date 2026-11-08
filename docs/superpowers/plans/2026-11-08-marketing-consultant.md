# Marketing Consultant Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; one independent whole-branch review at the end.

**Goal:** Ship the approved evidence-led Marketing Consultant and factory integration.
**Architecture:** Reuse Claude Code skills and agent files, with private per-business records and a local descriptive analysis helper. Keep the factory engine unchanged.
**Tech Stack:** Markdown and Python 3 standard library.
**Spec:** `docs/superpowers/specs/2026-11-08-marketing-consultant-design.md`

## Global constraints

No dependencies, unrelated engine changes, invented observations, autonomous
publishing or spending. Preserve the original checkout. Push only the separate
feature branch after verification; never merge main.

## Review focus

- Product data must not leak into another business or public source control.
- Missing customer evidence must remain unknown, not become invented proof.
- Observational campaign data and clicks must not become causal sales claims.
- Optional consultation must not omit mandatory review or override business holds.
- Research must distinguish direct marketing evidence, extrapolation and dispute.

## Task 1: Descriptive analysis helper

Files: `.claude/skills/marketing/scripts/{analyze.py,test_analyze.py}`.
Interface: `analyze(data)` consumes `control` and `variant`, each with integer
`participants` and `successes`; returns rates, Wilson 95% intervals, absolute
percentage-point difference and relative lift (null for zero baseline).

- [x] Write CLI tests for 10/100 vs 15/100, published Wilson formula boundaries,
  zero exposures, impossible counts, booleans, missing arms and invalid JSON.
- [x] Run tests before implementation; expect failure because helper is absent.
- [x] Implement input validation and local JSON CLI; no winner or causal output.
- [x] Run helper suite; expect all tests pass. Commit with what/why body.

## Task 2: Consultant and evidence base

Files: `.claude/skills/marketing/SKILL.md`, `references/`, `templates/`,
`examples/`, and `marketing/README.md`, `marketing/businesses/.gitkeep`, `.gitignore`.
Interface: reports retain business/task identity; stable source IDs in the
bibliography support research, templates and analysis method documentation.

- [x] Write workflow, capability/evidence map, ten qualified principles and
  bibliography using primary publisher/author/institution records.
- [x] Add brief, experiment, report and result templates, sanitized factory
  example, three synthetic evaluation cases and analysis method reference.
- [x] Validate skill frontmatter and local links. Exercise analysis example.
- [x] Run three scenario evaluations; inspect deliverables for the five review
  risks above. Keep raw evaluation artifacts out of the published tree.

## Task 3: Factory integration and repository documentation

Files: `.claude/agents/{marketing-consultant,reviewer-marketing,spec-writer,builder,approver}.md`,
`.claude/skills/factory/{SKILL.md,references/job-state.md}`, `factory/config.md`,
`README.md`, `MANUAL.md`, `templates/CLAUDE.md`, and factory script tests.
Interface: optional config `marketing_business` routes pre-spec consultation to
job `marketing.md`; optional reviewer uses existing PASS/CHANGES protocol.

- [x] Document consultation timing, missing brief behavior, rework/resume and
  agent file ownership. Read only the applicable business brief and results.
- [x] Add integration tests for optional marketing lens, re-review after changes
  and mandatory security/code retention. No engine changes expected.
- [x] Run both Python suites and documentation/skill checks; inspect full diff.
- [x] Request independent whole-branch review; resolve material findings.
- [x] Record results, remaining gates and next action in `docs/marketing-handoff.md`.
  Prepare committed `feat/marketing-consultant` for the authorized review push.
  Publication must be confirmed by remote SHA before reporting completion;
  leave main untouched.

## Execution record

Implemented inline in the isolated feature worktree. Research and behavior
follow the recovered approved scope, with the user-confirmed integration/docs
boundary. No new engine implementation was needed: integration tests verify
the existing generic lens protocol. The script's RED→GREEN cycle, scenario
evaluation, independent review, checks and remaining runtime/field gates are
recorded in the handoff. No unresolved substantive review findings.

## Later delivery authorization

The 2026-11-08 follow-up explicitly authorized live Claude Code testing, fixes
on the same feature branch, merging to main and rewriting the main README.
That supersedes the original review-only publication boundary for this repository
maintenance task. Installed factory/marketing behavior keeps its no-merge/no-push
boundary. Actual runs, fixes and delivery are recorded in the handoff.
