# Marketing Consultant handoff

Date: 2026-11-08. Scope: standalone marketing plus repository integration/docs.
Review branch: `feat/marketing-consultant`, based on `main` at `2851b99`.
The original `example/todo-app` checkout remains clean and unchanged.

## Delivered

- `/marketing <business-id> <task>` for factory and product strategy, usable
  drafts, discovery, experiments and results review, with separate private
  briefs/history/report files per business.
- [Ten qualified principles](../.claude/skills/marketing/references/research.md),
  [22-entry bibliography](../.claude/skills/marketing/references/bibliography.md)
  (21 academic publications plus NIST method documentation), and
  [official technical references](../.claude/skills/marketing/references/implementation.md).
  Sources document access basis; abstracts/excerpts are not represented as
  full-text critical appraisal. Transfer limits and contested results remain visible.
- Python standard-library analysis of supplied binary counts: rates, Wilson
  intervals and descriptive differences. No causal/winner or sales claim.
- Optional pre-spec consultant and optional marketing reviewer in the existing
  factory loop, carrying evidence/business holds through spec, build and approval.
  Security/code and human merge gates remain. No engine/schema changes.
- [Installation and use](../marketing/README.md), business/experiment/report/result
  templates, a public factory brief and explicitly synthetic count/evaluation inputs.

## Verification evidence

- Baseline factory suite: 23 tests passed before changes.
- Current factory suite: 26 tests passed, including optional marketing selection,
  unrelated-path skip, mandatory security/code retention and re-review after CHANGES.
- New analysis helper: 8 tests passed. Initial pre-implementation run failed
  because the helper did not exist; implemented tests then passed. Cases cover
  expected rates/lift, Wilson reference values, zero/all successes, zero exposure,
  impossible/noninteger counts, wrong structures and malformed JSON.
- Reproduce: `python3 -m unittest discover -s .claude/skills/factory/scripts`
  and `python3 -m unittest discover -s .claude/skills/marketing/scripts`.
- Synthetic 10/100 versus 15/100 CLI run: 10% vs 15%, +5 percentage points,
  +50% descriptive relative lift; uncertainty/attribution limitations printed.
- Skill-creator validator passed; both new agent YAML headers parsed correctly.
  All 60 local Markdown references, source IDs and git whitespace checked. Private business
  paths ignored; `.gitkeep` remains tracked.
- Independent consultant evaluation generated actual A/B/C report artifacts:
  factory launch, low-evidence product and sequential poor-campaign review all
  met the rubric. Unsupported €10,000 savings were excluded; case C correctly
  reported CTR 5%→10%, lead yield 1%→0.8%, cost/lead €20→€25 without a causal claim.
  Evaluation fixtures and thresholds are synthetic/local design choices.
- A temporary instruction-guided file-lifecycle simulation verified two unique
  run IDs, collision suffixing, append-only draft history and byte-preservation
  of the existing brief, first report and other business records. Its small
  runner tests the prescribed file operations, not future model compliance.
- Independent whole-branch review at `2f4e94c`: no substantive must-fix findings.
  Source spot checks supported bibliography metadata and evidence limitations.

## Remaining gates and next action

Review this feature branch before merging. Run a live Claude Code smoke test of
standalone invocation and configured consultation, interrupted resume, changed-offer
rework and approver holds in a throwaway project before operational adoption.
The automated tests exercise the helper and generic reviewer protocol; model
evaluations exercise instructions, not live Claude Code orchestration or a
commercial benchmark. Claude Code 2.1.319 is installed locally but no full factory
job was launched for this change.

No actual campaign/customer dataset was supplied. R02 publisher retrieval failed
in the behavioral evaluator and was disclosed; existing publisher metadata and
research references were retained without claiming fresh full-text verification.
A real campaign still needs verified scope/links, business inputs, approved caps,
contact/publication/spend authorization and a predefined measurement plan.

No campaign publication, customer contact, ad spend, main merge or deployment
was performed.
User authorized pushing this implementation branch for review; the installed
marketing/factory tools retain their separate no-push/no-merge behavior.
