# Live Claude Code validation

Date: 2026-11-08. Starting implementation: `5920561` on
`feat/marketing-consultant`. Claude Code CLI: **2.1.319**. Tests used the real,
authenticated CLI, project skills and project-defined agents; these were not
Codex-agent substitutes or scripted simulations of model behavior.

## Isolation and method

- Temporary local Git fixtures had no remotes. Product: a synthetic Markdown
  page for manual stock counts. No customer or campaign data was supplied.
- Business records held distinct preservation markers. Hash/prefix assertions
  checked unchanged briefs, earlier reports, other-business files and history.
- Sessions used project-only settings and an empty strict MCP configuration.
  Web tools were disabled; supplied references were used with access limitations.
- Standalone/orchestrator sessions selected Sonnet (`claude-sonnet-5-5` in CLI
  initialization). Factory roles kept their configured models. The separate
  direct approver test initialized as `claude-opus-5-5`.
- Streamed tool events, generated files, helper state and Git diffs were inspected.
  Raw session logs remain outside the published repository; they contain no real
  campaign evidence and are not a commercial benchmark.

## Observed failures and fixes

| Live observation | Root cause and correction | Recheck |
| --- | --- | --- |
| Identical `/marketing` task reused the earlier report and wrote no new history entry. | Explicit invocation versus resume semantics were insufficiently precise. Each invocation now creates a distinct run unless the user asks to inspect/resume/update an existing one. History retains the appropriate draft/planned/observed status. | Same prompt created suffixed runs; earlier report and history prefix were preserved. |
| Standalone draft used “Tell us how you count stock” despite the matching business's settled “Review prototype scope” CTA. | Standalone instructions did not explicitly load matching factory-config decisions. They now read settled decisions only when `marketing_business` matches the requested business. | Same prompt used the approved CTA, acknowledged previous drafts were unapproved, and changed no product code or other-business records. |
| Factory-business draft called AI Code Factory an “early prototype” without evidence of its maturity. | Conservative-sounding stage/absence claims were not explicitly covered. The skill now treats maturity and negative capability/result claims as facts needing named-business evidence; previous drafts do not validate them. | Same prompt produced a new run that explicitly rejected the earlier unsupported label, left maturity unverified and preserved the other business records. |

## Completed live scenarios

1. **Product marketing and persistence.** `/marketing stock-notes` created
   actual draft/discovery reports and appended private history. Repeated commands
   produced distinct IDs after the fix. Original report/brief hashes, existing
   history prefix, another business's files and product content were preserved.
2. **Factory marketing and missing brief.** `/marketing ai-code-factory` created
   a provisional brief, launch/pilot report and results history. It did not apply
   stock-notes decisions or change existing product records. It explicitly
   identified README/example facts unavailable in the portable fixture rather
   than treating the packaged example as verified customer evidence.
3. **Full configured factory job.** Real Agent launches: marketing-consultant,
   spec-writer, builder, reviewer-security, reviewer-code, reviewer-marketing and
   approver. The branch changed only the draft page. All three reviews were PASS;
   decision was MERGE and helper stage `ready`. No merge or push occurred.
4. **Interrupted pre-spec recovery.** The helper recorded an interrupted
   marketing run with no report. Live `/factory resume` completed consultation
   before spec, recorded reported usage and cleared the interruption. A deliberate
   checkpoint then stopped before build; helper next step was `builder`.
5. **Interrupted-builder recovery.** A helper-recorded builder interruption was
   resumed through READY build. Consultation/spec hashes were unchanged;
   interruption cleared; next step was `start-round 1`. No review round was
   started at that deliberate checkpoint.
6. **Changed-offer rework.** The completed job was reworked with an explicitly
   unapproved free-consultation offer conflicting with the settled CTA. Marketing
   advice refreshed. Page content stayed identical to the round-1 reviewed
   content; the builder recorded the conflict. Round-2 security/code PASS,
   marketing skipped on unchanged paths retaining round-1 PASS. Actual approver
   returned HOLD and helper stage `needs-human`.
7. **Direct approver hold scenario.** Copied actual reviewed artifacts were
   augmented with a clearly labeled synthetic unmet/unapproved paid-offer
   requirement. The real approver wrote HOLD despite earlier technical PASS
   reviews, citing business conflict, unmet requirements and stale review scope.

## Reproduction outline

In a throwaway project, copy the current `.claude/` and factory files, supply
project instructions and ignored private business records, initialize Git and
configure security/code/marketing review with `paths.marketing: content/`.
Set `marketing_business: stock-notes` and the settled scope/CTA above.

Invoke the real commands through authenticated Claude Code (interactive or
`claude -p`), preserving the actual project skills:

```text
/marketing stock-notes draft a neutral landing headline, scope paragraph and CTA, plus a bounded discovery plan
/factory Add a neutral scope paragraph and the approved CTA to content/index.md; draft only
/factory resume <helper-recorded-interrupted-job>
/factory rework <ready-job> propose a conflicting unapproved offer; refresh advice and flag the human decision
```

For headless runs, the tested controls were `--setting-sources project`,
`--strict-mcp-config --mcp-config '{"mcpServers":{}}'`, `--no-session-persistence`,
explicit tool permissions, disabled WebSearch/WebFetch and bounded per-session
`--max-budget-usd`. Grant access only to the fixture and its sibling worktrees.
Do not disable permission checks or supply real customer data for these tests.

## Limits

Recorded interruption states exercise the real recovery command; they are not
forced process-kill, operating-system-crash or concurrent-write tests. Portable
fixture examples do not verify a production website, real campaign performance,
all UI/API/data lenses, every possible model output or future runtime versions.
One successful rerun of a prompt is regression evidence, not deterministic
compliance. Continue checking actual artifacts and human decisions.

Published source metadata and study limitations remain in the
[bibliography](../.claude/skills/marketing/references/bibliography.md). No new
full-text review or marketing-effect result is claimed by this live test report.
