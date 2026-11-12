# AI Code Factory

This is the **todo example branch**, including the shared factory and marketing
workflow. Run `npm run dev -- 8000` and open <http://127.0.0.1:8000/index.html>.
The development server binds to this computer only. `npm test` runs the Node
suites; the [example handoff](docs/example-security-handoff.md) records the full
Python and Node validation. Historical factory artifacts remain in `examples/`.

**Build a feature you can inspect before merging. Prepare marketing you can test before launching.**

AI Code Factory is a local workflow for [Claude Code](https://code.claude.com/).
It combines project skills, specialist agents and small Python helpers. Your
project's instructions, Git history and review files stay central to the work.

| Start with | Get back |
| --- | --- |
| `/factory <feature>` | A specification, implementation on a separate branch, review files and a MERGE/HOLD recommendation. |
| `/marketing <business-id> <task>` | Usable marketing drafts, evidence and assumptions, an experiment or discovery plan, and a private results history. |

The installed factory stops at the human merge decision. Marketing produces
drafts and recommendations; it does not publish, contact customers or spend.

[User manual](MANUAL.md) · [Marketing guide](marketing/README.md) ·
[Research and bibliography](.claude/skills/marketing/references/bibliography.md) ·
[Validation and remaining gates](docs/marketing-handoff.md) ·
[Security boundaries and checks](docs/security-hardening.md)

## Build with `/factory`

```text
/factory Add an items-left counter to the task list
```

```text
request → optional marketing consultation → specification → build
                                                            ↓
                              security · code · configured specialist reviews
                                                            ↓
                       changes needed? → rework, up to two extra rounds
                                                            ↓
                                    approver → human merge decision
```

Each job gets a `factory/<job-id>` branch and its own Git worktree. Agents
write inspectable artifacts: `spec.md`, `build.md`, `round-N/review-*.md` and
`decision.md`. The final report explains what changed, what was checked, what
remains unresolved and which commands the human can run next.

Security and code review run every round. Other lenses run according to the
project's configured paths; a reviewer that requests changes runs again.
Available lenses cover UX, UI, API, data and marketing. Passing agent review is
review evidence, not proof of security or production readiness.

The factory never merges, pushes, deletes branches or removes worktrees. It
hands those actions back to the human. Business decisions such as new prices,
guarantees and public claims remain explicit approval points.

## Work with `/marketing`

```text
/marketing ai-code-factory draft a developer launch campaign
/marketing stock-notes plan customer discovery before launch
/marketing stock-notes analyze our latest pilot results
```

One consultant serves the factory itself and the products built with it. Each
business has its own audience, offer, evidence, decisions and history:

```text
marketing/businesses/<business-id>/
  brief.md
  results.md
  runs/<task-id>/report.md
```

Assignments produce actual copy, campaign briefs, email drafts, sales scripts,
interview questions or results analysis. Each includes its research basis,
relevant limits, assumptions, a credible alternative and a measurable next step.
Missing customer evidence stays unknown. Weak product fit can lead to a
recommendation to do discovery, revise the product or stop promotion.

The [research guide](.claude/skills/marketing/references/research.md) qualifies ten
principles rather than forcing every tactic into every campaign. The
[bibliography](.claude/skills/marketing/references/bibliography.md) records 21
academic publications plus NIST method documentation, source access and transfer
limits. Published research informs the proposals; real business results require
local evidence and testing. The bundled count and evaluation fixtures are synthetic.

Private business records are ignored by Git. Keep the ignore rules when copying
the workflow, and review reports before sharing them through the dashboard or
exporting them. See [templates and examples](marketing/README.md).

## Add it to a project

You need an authenticated Claude Code installation, Git with worktree support,
and Python 3 on macOS/Linux. Use Claude Code 2.1.295 or newer, review the
agent hooks, and explicitly trust the project interactively before running the
workflow. The Python helpers use the standard library, with no package
installation. A browser tool is optional for reviews of a running UI; see the
[manual](MANUAL.md) for setup and the limitations of code-only reviews.

1. Copy `.claude/` and `factory/` into the project root. For marketing, also copy
   `marketing/`, excluding other businesses' private records. Merge existing
   configurations carefully instead of overwriting them.
2. Add the runtime ignore rules to the project's `.gitignore`:

   ```gitignore
   /factory/jobs/*
   !/factory/jobs/.gitkeep
   /marketing/businesses/*
   !/marketing/businesses/.gitkeep
   __pycache__/
   ```
3. Use [templates/CLAUDE.md](templates/CLAUDE.md) to describe the stack, setup,
   checks and conventions. Merge it into any existing project instructions.
4. Edit `factory/config.md`: choose the base branch, reviewer paths, setup
   commands and settled human decisions. Keep `security` and `code` in both
   `reviewers` and `always`.
5. Commit the setup, open Claude Code in the project and try one small feature.
   For marketing alone, run `/marketing` with a separate business ID; it can
   start a provisional brief from verified project facts.

### Connect marketing to factory jobs

For consultation on relevant jobs, set the business ID in `factory/config.md`:

```text
marketing_business: stock-notes
```

Leave it empty to disable consultation. When enabled, the orchestrator consults
marketing before the specification for positioning, offers, public copy, landing
pages, onboarding or conversion work. Its `marketing.md` is input to the spec
writer, builder and approver. Unrelated jobs skip it.

Marketing review is a separate optional gate. Adapt these paths to the project:

```text
reviewers: security, ux, ui, code, marketing
always: security, code
paths.marketing: src/landing/, src/onboarding/, content/
```

These are path prefixes. Without `paths.marketing`, marketing review always
runs. Consultation does not count as review and does not replace technical gates.

## Commands

| Command | Purpose |
| --- | --- |
| `/factory <feature>` | Run a feature through specification, build, review and approval. |
| `/factory next [n]` | Take the next backlog item, or batch up to three suitable small items. |
| `/factory chain N [after JOB]` | Build separate dependent jobs without merging between them. |
| `/factory resume <job-id>` | Continue an interrupted job from its recorded state. |
| `/factory rework <job-id> <note>` | Rework a job waiting for the human. |
| `/factory done <job-id>` | Verify the human's merge and update the job status. |
| `/marketing <business-id> <task>` | Produce a business-specific draft, plan or analysis. |

## Inspect jobs and costs

Serve the dashboard locally from the repository root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory factory
```

Open [the local dashboard](http://127.0.0.1:8000/dashboard.html). It shows stages,
review verdicts and job artifacts. Agent token counts and durations appear when
the runtime reports them; missing usage is not guessed. Conditional reviews,
bounded rework and focused context reduce repeated work, but there is no fixed
cost or time-saving guarantee.

## Verify the helpers

```bash
python3 -m unittest discover -s .claude/skills/factory/scripts
python3 -m unittest discover -s .claude/skills/marketing/scripts
python3 .claude/skills/marketing/scripts/analyze.py .claude/skills/marketing/examples/synthetic-counts.json
```

The count helper reports conversion rates, per-cohort Wilson 95% intervals and
descriptive uplift. It does not test the difference between cohorts or declare a
campaign winner. Read the [measurement guide](.claude/skills/marketing/references/measurement.md)
before using real data. [Official implementation references](.claude/skills/marketing/references/implementation.md)
document the Claude Code, Git and Python mechanics.

See the [handoff](docs/marketing-handoff.md) for exact automated and live test
coverage, discovered issues and remaining operational or field-validation gates.

## Examples and origins

The [`example/todo-app` branch](https://github.com/Pkalliagkas1989/AI_Code_Factory/tree/example/todo-app/examples)
contains a small todo app developed through factory jobs, with retained specs,
reviews and decisions. These are examples, not a benchmark of future results.

Watch the [20-second pitch](pitch/ai-code-factory.mp4)
([production notes](pitch/README.md)). The original workflow was inspired by
ZazenCodes' [Build Your Own AI Software Factory with Claude Code](https://www.youtube.com/watch?v=ctoaIC4LHmI).
