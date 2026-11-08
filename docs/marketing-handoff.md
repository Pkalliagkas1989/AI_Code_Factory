# Marketing Consultant handoff

Date: 2026-11-08. Scope: standalone marketing plus repository integration/docs.
Review branch: `feat/marketing-consultant`, based on `main` at `2851b99`.
The original `example/todo-app` checkout remains clean and unchanged.
The user subsequently authorized live testing, feature updates, merge to main
and a rewrite of the main README.

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

## Live validation follow-up

The [live validation report](marketing-live-validation.md) records actual Claude
Code **2.1.319** runs, prompts, model/runtime settings, observations and limits.
The new runs replace the earlier “not live-tested” status above:

- Standalone product and factory-business assignments created real private
  brief/report/history artifacts in synthetic local projects.
- Repeated-invocation and matching-business CTA failures were observed, fixed
  and rechecked with the same prompts. A separate unsupported factory-maturity
  label was also observed and corrected in a fresh same-prompt report.
- Hash/prefix checks preserved prior reports, briefs, existing history and
  other-business records; product content was untouched by standalone work.
- A complete configured factory job ran consultation, spec, build, security/code/
  marketing review and approval, ending `ready` with all reviews PASS.
- Live recovery from helper-recorded marketing/builder interruptions completed
  consultation before spec and a READY build without rewriting completed inputs.
- Changed-offer rework refreshed advice, retained settled page content and ended
  HOLD/`needs-human`. A direct approver scenario also held unmet/unapproved
  business requirements despite prior technical PASS reviews.
- Independent review identified a status-label wording conflict (fixed to allow
  observed history) and a README overstatement (fixed to identify only count and
  evaluation fixtures as synthetic). No unresolved substantive findings.

No factory engine or statistical helper change was needed. The existing 34
Python tests pass. Skill validation and documentation references are checked
alongside the feature update. Regression cases D–F are in the skill evaluation
reference. These runs use actual Claude tools and agents, not the earlier
instruction-guided simulation.

## Delivery and next action

Live test gates are complete for this change. Feature update `63e9aad` was
pushed to `feat/marketing-consultant` and merged into `main` by merge commit
`77f22c7`, as explicitly authorized by the user. The main README was rewritten
around the two commands, setup, optional integration, evidence and validation.
The original example checkout is preserved. The installed tools still do not
merge or push; this repository-maintenance merge was separately authorized.
On merged main, factory tests passed 26/26, analysis tests passed 8/8, the
skill validator passed, all 70 checked local Markdown references resolved, and
git whitespace checks passed. Feature ancestry was verified. Main publication
is checked against the remote commit before completion is reported.

No actual campaign/customer dataset was supplied. Source access limitations
remain explicit; no new full-text research review or campaign efficacy claim is
made. Recorded interruptions are recovery checkpoints, not forced-kill tests.
UI/API/data reviews, concurrent writers, production deployment and real campaign
outcomes are not established by these bounded fixtures.

Next operational use: select the real business brief, approve any publication,
contact or spend, and collect outcomes under a predefined measurement plan.
No campaign publication, customer contact, ad spend or deployment was performed.
