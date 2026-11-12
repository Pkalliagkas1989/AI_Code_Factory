# Experiments and results analysis

Design basis: [R19](bibliography.md#r19). Rate intervals:
[R20](bibliography.md#r20), [R21](bibliography.md#r21). The templates and gates
below are local design choices informed by these sources, not a tested product.

## Before launch

Define one primary outcome tied to value (for example qualified pilots per
eligible visitor); clicks and opens are diagnostic. Record eligibility, exposure
unit, allocation, control/variant, dates, attribution window and data source.
Record budget/effort, minimum useful effect, baseline and sample-size/power
rationale. Do not supply an arbitrary universal sample size. No baseline or low
traffic: propose discovery or a feasibility pilot and label it exploratory.

Predefine adoption, revision, stop and inconclusive rules and customer/economic
guardrails. Avoid unplanned repeated significance checks. Check logging,
independent assignment, unequal allocation and sample-ratio problems. Document
confounding, missing outcomes, seasonality and selection effects. No randomized
comparison means observed differences are not causal lift.

## Count-analysis helper

From the project root:

```bash
python3 .claude/skills/marketing/scripts/analyze.py path/to/local-counts.json
# Or pipe the same JSON to the command with no filename.
```

Input has `control` and `variant` objects, each containing integer `participants`
and `successes`, with `0 <= successes <= participants`. A success is one binary
outcome per participant in the same fixed window. Do not put repeated events,
revenue totals, percentages, correlated sessions or a different funnel's
numbers into these fields. The helper cannot verify the provenance or design.

For each rate p=k/n, z=1.959963984540054, d=1+z²/n:

- center = (p+z²/(2n))/d
- half-width = z√(p(1−p)/n+z²/(4n²))/d
- Wilson 95% limits = center ± half-width, bounded to [0,1].

The script also reports variant−control in percentage points, and relative lift
(variant−control)/control. Rates and relative lift are proportions: 0.5 lift
means 50%, while a difference of 5 means five percentage points. Zero exposure
produces null estimates, not a zero conversion rate. Zero baseline makes
relative lift undefined (null); zero successes do not imply zero uncertainty.

**Limits:** these are marginal intervals, not an interval or significance test
for the difference. Overlap or non-overlap must not be used as this tool's
winner rule. It does not calculate power, causal attribution, guardrails,
multiple-testing corrections or revenue. Use a suitable design/analysis before
adopting a campaign; report inconclusive results honestly.

The [synthetic count fixture](../examples/synthetic-counts.json) (10/100 vs
15/100) yields rates 10% vs 15%, +5 percentage points and +50% descriptive
relative lift. It is a software test fixture, not measured business performance.
No real campaign dataset has been supplied with this implementation.

## Results review

Retain original counts and definitions. Compare qualified outcomes, costs and
customer guardrails against the predefined rule. Report uncertainty, departures
from the plan and whether findings are exploratory or confirmatory. A high click
rate with weak qualification or rising refunds can justify stopping. If poor
fit is the bottleneck, revise the product/audience before amplifying promotion.
Append observed results only to the same business's private history. Never
replace a previous result or fabricate the missing control group.
