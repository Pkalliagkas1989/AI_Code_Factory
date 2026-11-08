# Marketing workspace

Use `/marketing <business-id> <task>` in Claude Code. The consultant prepares
strategy, copy, experiments and analysis for the factory or a product. It does
not publish, send messages or spend money.

## Per-business records

```
marketing/businesses/<business-id>/
  brief.md
  results.md
  runs/<unique-task-id>/report.md
```

IDs are single lowercase kebab-case names (`ai-code-factory`, `stock-notes`).
The skill creates a provisional brief when one is missing, using the
[brief template](../.claude/skills/marketing/templates/brief.md). For the factory,
start from the [public example](../.claude/skills/marketing/examples/ai-code-factory-brief.md)
and verify its dated facts. Products get their own evidence and results.

Business records are gitignored by default because they can include non-public
plans and aggregate customer results. Do not force-add private data. Publish
only deliberately sanitized examples after human review. Ignoring files is not
access control: inspect exports, links and dashboard reports too.

## Factory connection

Set `marketing_business: <business-id>` at the top of `factory/config.md` to
consult marketing for a relevant job before its spec. Leave it empty to disable
consultation. The orchestrator reads this setting directly; no new job state or
dashboard stage is introduced. See the [factory skill](../.claude/skills/factory/SKILL.md).

To add a marketing review gate, append `marketing` to `reviewers` and add
`paths.marketing` with the project's real marketing file prefixes. No paths line
means the reviewer always runs. Keep security and code in `always`. Consultation
and review are separate: review may run without a consultation, and consultation
does not count as review. See the [manual](../MANUAL.md#marketing-consultant).

## Evidence and validation

[Research](../.claude/skills/marketing/references/research.md) qualifies all ten
principles. The [bibliography](../.claude/skills/marketing/references/bibliography.md)
records primary publications, stable IDs and access limits. The
[measurement guide](../.claude/skills/marketing/references/measurement.md) explains
the local analysis helper and its limits. No real campaign dataset is bundled.

```bash
python3 -m unittest discover -s .claude/skills/marketing/scripts
python3 -m unittest discover -s .claude/skills/factory/scripts
python3 .claude/skills/marketing/scripts/analyze.py .claude/skills/marketing/examples/synthetic-counts.json
```

[Three behavioral cases](../.claude/skills/marketing/references/evaluation.md)
cover the factory, low-evidence products and poor campaigns. Validation checks
software/instructions, not sales effectiveness; live tests still need approval,
real data and the predefined measurement plan.
