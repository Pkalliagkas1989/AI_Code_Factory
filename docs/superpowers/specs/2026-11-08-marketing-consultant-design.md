# Marketing Consultant design

## Intent and approved scope

Continue the approved strategist + producer design: a standalone `/marketing`
skill for AI Code Factory and its products, with optional factory consultation.
Each assignment produces usable work, traceable reasoning and a measurable next
step. The 2026-11-08 follow-up limits repository-wide improvements to marketing
integration and docs; it does not authorize unrelated engine changes.

## Approaches

The earlier discussion considered advisor-only, strategist + producer, and an
autonomous operator. The user approved strategist + producer, serving both the
factory and products. A reviewer-only approach cannot independently produce
campaigns or analyze results. Publishing and spending are outside version one.
This document records that approved scope; it introduces no new approval gate.

## Architecture and implementation choices

- Claude Code project skill at `.claude/skills/marketing/SKILL.md` with a shared
  research reference and complete linked bibliography for the ten principles.
- Business records at `marketing/businesses/<id>/`: brief, results history and
  per-task reports. Private runtime records are ignored by git. Portable
  templates and a public factory brief example ship with the skill.
- Local Python standard-library helper for two cohorts' binary outcomes:
  observed rates, Wilson 95% intervals and descriptive uplift. It never
  declares a winner, computes revenue, or treats observational data as causal.
- Factory consultation writes one `marketing.md` in the job folder before the
  spec. An optional `reviewer-marketing` fits the existing reviewer protocol.
  Existing Python job state and dashboard behavior remain unchanged.
- Orchestrator, spec writer, builder and approver carry the evidence and
  business-decision boundaries through the existing pipeline.

## Constraints and non-goals

No dependencies, automatic publishing, contacting customers, ad spend, production
writes, merge or automatic push. User authorization to push this implementation
branch is separate from the behavior of the installed factory. No fabricated
customer data, testimonials, citations, effects or guaranteed sales. Do not force
all ten principles into each assignment. Keep company/product evidence separate.
No unrelated factory-engine or todo-app changes.

## Acceptance and verification

1. `/marketing <business-id> <task>` produces a draft, relevant source links,
   limitations, assumptions, alternatives and a measurable next action.
2. All ten research principles have primary publication references and explicit
   transfer limits. Every capability links to its evidence basis; local design
   choices are distinguished from experimentally demonstrated effects.
3. Business and experiment templates record source provenance, budgets, metrics,
   guardrails, sampling rationale and inconclusive outcomes.
4. Factory jobs can consult the same skill before specification, and opt into
   marketing review without weakening security/code or the human merge gate.
5. The analysis CLI rejects malformed/impossible counts and handles zeros. Tests
   verify known Wilson values and rate calculations. It reads local input only.
6. Three behavioral cases exercise factory marketing, a low-evidence product and
   a poor campaign. Fixtures are synthetic; no business success is claimed.
7. Existing factory tests, new helper tests, skill validation, local-link checks
   and independent review pass before the feature branch is pushed for review.
