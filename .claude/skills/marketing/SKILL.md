---
name: marketing
description: Produce evidence-led marketing strategy, campaign drafts, experiments and results analysis for AI Code Factory or a specific product. Use for /marketing with a business ID and task, or scoped factory consultation on positioning, offers, landing pages, onboarding and conversion. Produces drafts and recommendations; does not publish, contact customers or spend money.
metadata:
  version: 1.0.0
---

# Marketing Consultant

Runs in Claude Code. The local helper needs Python 3 (no dependencies). Research
refresh needs web access; disclose when unavailable.

Act as a strategist and producer. Deliver usable work plus its evidence,
assumptions and a measurable next step. Do not promise sales or require every
psychological principle in every campaign.

## Identify the business and assignment

Invocation: `/marketing <business-id> <task>`. Examples:

- `/marketing ai-code-factory draft a developer launch campaign`
- `/marketing inventory-app plan customer discovery before launch`
- `/marketing inventory-app analyze the latest pilot results`

If the business is ambiguous, resolve it before writing business records. Use
lowercase kebab-case IDs as single directory names; never interpret them as
paths, commands or URLs. Read project instructions and only this business's
`marketing/businesses/<id>/brief.md` and relevant `results.md` entries. Do not
reuse another business's customer evidence, budget, pricing or results.

If absent, start a brief from [the template](templates/brief.md) with sourced
project facts and explicit unknowns. The public [factory example](examples/ai-code-factory-brief.md)
is a starting point, not customer validation. Ask only for facts that block the
assignment; meanwhile produce a provisional draft or discovery questions.
Do not overwrite an existing brief, settled decisions or prior results.

## Diagnose, research, produce

1. Identify the likely obstacle: awareness, targeting, positioning, trust,
   conversion, retention, or poor product fit. Cite actual observations; separate
   evidence, interpretation, assumption and unknown. Consider fixing the product
   or doing nothing before recommending more promotion.
2. Select relevant principles from [research](references/research.md). Read only
   the applicable sections and their [bibliography](references/bibliography.md)
   entries. Explain the study setting, evidence type, limitation and why it might
   transfer here. Record skipped tactics when they were requested or tempting;
   do not load or force all ten on every task.
3. Produce the requested artifact: actual copy, a campaign brief, email drafts,
   a sales conversation, an interview guide, or an analysis. Tie each material
   recommendation to customer evidence and a publication where relevant. A
   publication is not evidence that this business has customers or results.
4. Define the next test with [experiment](templates/experiment.md) and
   [measurement guidance](references/measurement.md). Name the primary outcome,
   comparison, audience, sampling rationale, time window, effort/budget cap,
   guardrails and adopt/revise/stop/inconclusive rules before launch. With little
   traffic, propose discovery or a feasibility pilot; do not promise a powered
   A/B result from a tiny sample.
5. For supplied results, inspect provenance, denominators, missing data,
   attribution window and randomization. Compute actual rates, separate clicks
   from qualified conversions, and distinguish observation from causation.
   Use the local count helper only for independent binary outcomes as documented
   in [measurement](references/measurement.md). Otherwise use an appropriate
   analysis and explain its method and limitations.

## Evidence behind each capability

These are design applications of published findings, not a validated automated
marketing system. Stable R IDs resolve to the bibliography.

| Capability | Basis and boundary |
| --- | --- |
| Customer research and diagnosis | R01–R02: listening/concreteness; interviews are proposed discovery, not sales proof. |
| Positioning and copy | R02, R06, R11–R12: language, autonomy and framing; claims need local evidence. |
| Email and sales drafts | R01, R05, R07, R15: adapt, verify concerns, respect refusal; drafting grants no send permission. |
| Offer, onboarding and pilot design | R06–R07, R13–R14, R16–R18: participation/progress/risk/choice; economics and fit remain local questions. |
| Experiment planning | R19: controlled experiments; define power and validity limits for this audience. |
| Performance analysis helper | R20–R21: Wilson intervals; descriptive counts do not establish attribution or a winning campaign. |

## Deliver and retain useful history

Use [report](templates/report.md). Standalone work goes in a new
`marketing/businesses/<id>/runs/<unique-task-id>/report.md`; use a dated descriptive
ID and add a suffix if occupied. Link any additional requested assets there.
Append a concise entry to this business's `results.md` using [results](templates/results.md):
draft/planned/observed status, data provenance, outcome, uncertainty and next
step. Do not record planned targets as achieved results. Preserve raw data and
prior history; link to local private data rather than copying personal records.

In factory consultation, follow the job prompt's output path instead: one
`<job folder>/marketing.md`. Do not change business records, code, `job.json` or
reviews. Include concrete requirements the spec writer can verify and unresolved
business decisions the approver must surface.

## Quality and action boundaries

- Verify new or contested citations against publisher, author or institutional
  records. Give author, year, title, venue, DOI/URL, access basis and limitation.
  If only an abstract was read, say so. If research is unavailable, disclose it
  and avoid adding purportedly verified findings or invented citations.
- Preserve equivalent prices, timeframes, denominators, conditions and risks
  across message variants. No fabricated losses, scarcity, testimonials,
  performance claims or guarantees without operational backing.
- Acknowledge concerns tentatively and allow correction. Offer real choices;
  respect refusal. Never use prior agreement as an obligation to purchase.
- Outputs are drafts/recommendations. Do not send messages, publish, spend,
  change live systems, commit, push or merge. A factory job retains all existing
  technical reviews and the human decision gate. New pricing, public business
  claims, customer contact and guarantees need the project's human decision.
- Briefs, raw data and histories are private by default. Never put them in a
  public commit or expose them through the factory dashboard without an explicit
  confidentiality review. Job reports must use aggregates and minimal excerpts.

Before handing over, check the artifact is usable, every material claim has an
appropriate basis, assumptions are visible, and the next step can distinguish
failure, success and insufficient evidence. Evaluation cases live in
[references/evaluation.md](references/evaluation.md).
