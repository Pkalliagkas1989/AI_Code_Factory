# AI Code Factory — User Manual

A step-by-step guide for anyone using the factory, technical or not.

## 1. What the AI Code Factory is

The AI Code Factory turns a one-sentence feature request into finished, reviewed code on its own git branch. You then decide whether to merge it. It runs inside [Claude Code](https://claude.com/claude-code) and is started with one command: `/factory <feature>`.

Think of it as a small software company made of AI agents. Each agent is a "department" with one job:

1. **Spec writer** turns your request into a written plan with a checklist of what "done" means.
2. **Builder** writes the code on a separate branch, so your main code is never touched.
3. **Reviewers** check the work in parallel: security, code quality, and depending on the project, user experience, visual design, APIs or data.
4. If any reviewer asks for changes, the builder fixes them. This repeats at most 2 extra rounds.
5. **Approver** explains in plain words what each department did, recommends MERGE or HOLD, and gives you the exact commands to merge.

**The one rule that never changes: the factory never merges, pushes or deletes branches. A human always does the merge.** Nothing reaches your main code until you run the commands yourself.

### Words used in this manual

| Word | Meaning in plain language |
| --- | --- |
| Job | One feature request going through the factory. Each has an id, for example `004-contact-form`. |
| Branch | A separate copy of the code where changes are made safely. Factory branches are named `factory/<job-id>`. |
| Base branch | Your main line of code, usually `main`. Merging copies the job's changes into it. |
| Worktree | A separate folder on your disk holding the job's branch, so several jobs can run at once. |
| Round | One pass of building plus reviewing. Round 1 is the first build. |
| Verdict | A reviewer's answer: `PASS` (fine) or `CHANGES` (needs fixes). |
| Merge | Accepting the job's changes into the base branch. Only you do this. |

## 2. Setting it up in a project (one time)

Setup takes 6 steps and is done once per project. A developer usually does it; after that, anyone who can open Claude Code in the project can use the factory.

### What you need first

- **Claude Code** installed and signed in.
- **git**, with the project already in a git repository.
- **Python 3**. The factory's helper script needs it, and so does the live dashboard (section 7). On a Mac it is usually already installed; check with `python3 --version`.
- **agent-browser** ([link](https://github.com/vercel-labs/agent-browser)), only for projects with web pages, so the agents can look at the running app.

### The 6 steps

1. **Copy the factory files.** Copy the `.claude/` folder and the `factory/` folder from this repository into the root folder of your project.
2. **Hide the job files from git.** Add these two lines to the project's `.gitignore` file:

   ```
   /factory/jobs/*
   !/factory/jobs/.gitkeep
   ```
3. **Describe your project.** Copy `templates/CLAUDE.md` to the project root (or merge it into an existing `CLAUDE.md`) and fill in every section: stack, folder layout, setup commands, dev server command, test commands and conventions. **This file is the only place the agents learn how your project works.** Vague answers here lead to weaker results.
4. **Configure the factory.** Edit `factory/config.md` (see the table below).
5. **Optional: install agent-browser** if the project has pages to look at.
6. **Commit** these files on the base branch, open Claude Code in the project folder, and run your first `/factory <feature>`.

### The settings in `factory/config.md`

| Setting | What it controls | Default |
| --- | --- | --- |
| `base_branch` | The branch jobs start from and are merged back into. | `main` |
| `reviewers` | Which reviewers exist. Web apps: `security, ux, ui, code`. Backends (servers, APIs): `security, api, data, code`. | `security, ux, ui, code` |
| `always` | Reviewers that run every round. Must include `security` and `code`. | `security, code` |
| `paths.<reviewer>` | Folders that trigger an optional reviewer. Example: `paths.ux: src/` means the UX review runs only when files in `src/` changed. A reviewer with no `paths` line always runs. | `paths.ux: src/`, `paths.ui: src/` |
| `light_paths` | Low-risk files, such as documentation. When every changed file matches, the security review uses a cheaper model. It still runs. | `*.md, docs/` |
| Setup for a new worktree | Extra commands run in each new job folder, after the setup in `CLAUDE.md`. | empty |
| Notes for agents | Facts every agent must know that `CLAUDE.md` doesn't say. A merge-check command written here is added to the approver's merge steps. | empty |

The review checklists are general on purpose. Once you know what matters most in your project, ask Claude to tailor the reviewer files in `.claude/agents/` to your stack.

## 3. The four commands

You control the factory with four commands, typed into Claude Code inside your project folder.

| Command | When to use it | Example |
| --- | --- | --- |
| `/factory <feature>` | Start a new job from a feature description. | `/factory Add a contact form to the about page` |
| `/factory next [n]` | Take the next item from the backlog list. With `n` (2 or 3), group up to that many small items into one job. | `/factory next` or `/factory next 3` |
| `/factory done <job-id>` | Tell the factory you have merged a job. It checks the merge really happened and marks the job merged. | `/factory done 004-contact-form` |
| `/factory rework <job-id> <note>` | Send a finished job back to the builder with your feedback, instead of merging. | `/factory rework 004-contact-form Make the submit button blue and add a phone field` |

### Writing a good feature request

The spec writer works only from your sentence and the project files, so be concrete. Say **what** should happen, **where**, and **for whom**. Leave out how to code it.

- Weak: `/factory improve the form`
- Strong: `/factory On the about page, add a contact form with name, email and message fields. Show an error if the email is invalid and a thank-you message after sending.`

When something is unclear, the spec writer makes an assumption and writes it down in `spec.md`. The approver flags any assumption that is really a business decision (prices, public wording, what is free or paid).

### Using the backlog

The file `factory/backlog.md` is a to-do list of features, one per line:

```
- [ ] Add a footer with the current year and a link to the GitHub repo
- [ ] Show a loading spinner while the product list loads
```

`/factory next` takes the first unchecked line, marks it `- [x] … → 004-footer-year`, and runs it as a job. With `/factory next 2` or `/factory next 3`, small related items are grouped into one job to save cost. Items about login, permissions, payments, secrets, database migrations or deployment are **never grouped**. They always run as their own job so their review gets full attention.

## 4. What happens during a job, step by step

A job runs by itself from your request to the approver's report. You are needed only at the end, or if the builder gets stuck.

```
                                   ┌──── CHANGES: back to the builder (max 2 more rounds) ────┐
                                   ▼                                                          │
 Your request ─► Spec writer ─► Builder ─► Reviewers (in parallel) ─► All PASS? ──────────────┘
                                   ▲                                      │ all PASS, or no rounds left
                                   │ /factory rework                      ▼
                                   └──────────────── You decide ◄──── Approver (MERGE or HOLD)
                                                         │
                                                         ▼ run the merge commands
                                                   /factory done ─► Merged
```

If a reviewer asks for changes, the job loops back to the builder, at most 2 extra times. You can also send it back yourself with `/factory rework`.

1. **A job id is claimed.** The next number plus a short name, for example `004-contact-form`. A folder is created at `factory/jobs/004-contact-form/`.
2. **A separate workspace is made.** A new branch `factory/004-contact-form` and a new folder next to your project (`../<project>-factory/004-contact-form/`). The setup commands from `CLAUDE.md` and `config.md` run there. Your own project folder is never changed.
3. **Spec.** The spec writer reads your request and the project, and writes `spec.md`: requirements and a numbered list of acceptance criteria (checks that prove the feature works).
4. **Build.** The builder writes the code, tests every acceptance criterion, commits on the job's branch, and writes `build.md`. Its first line is `STATUS: READY` or `STATUS: BLOCKED`. Blocked means it needs a human decision; the job stops and waits for you (section 8).
5. **Review, round 1.** All selected reviewers run at the same time. Each writes one file in `round-1/` starting with `VERDICT: PASS` or `VERDICT: CHANGES`. Claude prints one line telling you which reviewers were skipped and why.
6. **Fix rounds.** If any reviewer says CHANGES, the same builder fixes every finding and a new round starts. There are at most 3 review rounds in total. Security and code review run every round; other reviewers re-run only when needed.
7. **Approve.** When everything passes, or rounds run out, the approver writes `decision.md` and Claude shows you its summary and commands. The job now waits for you.

### Files in a job folder

Everything a job produces is a readable text file in `factory/jobs/<job-id>/`. You can open any of them.

| File | Written by | What it holds |
| --- | --- | --- |
| `job.json` | The orchestrator (the Claude session you typed in), through its helper script | Current stage, round, verdicts and token use. The dashboard reads it. |
| `spec.md` | Spec writer | Requirements, acceptance criteria and assumptions. |
| `build.md` | Builder | What was built, how each criterion was tested, `STATUS: READY` or `BLOCKED`. |
| `round-<N>/review-<name>.md` | Each reviewer | Verdict and findings for round N. |
| `rework-<k>.md` | The orchestrator | Your note from `/factory rework`, saved word for word. |
| `decision.md` | Approver | Plain-language report, MERGE or HOLD, and the merge commands. |

### Job stages

| Stage | Meaning | Who acts |
| --- | --- | --- |
| `spec` | Setting up and writing the spec | Factory |
| `build` | Builder is writing or fixing code | Factory |
| `review` | Reviewers are checking | Factory |
| `approve` | Approver is writing the report | Factory |
| `ready` | Approver recommends MERGE (shown as "ready to merge") | **You** |
| `needs-human` | Approver recommends HOLD, or the builder is blocked (shown as "needs you") | **You** |
| `merged` | You merged it and confirmed with `/factory done` | Nobody, finished |

### Running several jobs at once

Each job has its own branch, folder and ports, so jobs don't collide. Open a second Claude Code window in the same project and run another `/factory` command there. Each window manages one job.

## 5. The departments and what each one checks

The factory has 9 agents. Each reads files, writes exactly one file, and never talks to the others directly. The "model" column shows which Claude model runs it: Opus is the strongest, Sonnet is faster and cheaper.

| Agent | Model | What it does | Runs |
| --- | --- | --- | --- |
| Spec writer | Opus | Turns your request into requirements and acceptance criteria. | Once per job |
| Builder | Opus | Writes the code, tests it, commits, and fixes review findings. | Every round |
| Security reviewer | Opus | Who can access what, unsafe handling of user input, leaked data, committed passwords or keys, payments and login logic, spam protection, new third-party packages. | Every round |
| Code reviewer | Sonnet | Does it do what the spec says, is it as simple as possible, does it reuse existing code, does it follow project conventions, are commit messages clear. Runs the tests. | Every round |
| UX reviewer | Sonnet | Tries the feature as a user: flows, loading and error states, wording, accessibility, mobile. | Web apps, when screen files changed |
| UI reviewer | Sonnet | Checks the visual design matches the rest of the app. | Web apps, when screen files changed |
| API reviewer | Sonnet | Endpoints, request and response formats, error messages, and that existing clients keep working. | Backends, when API files changed |
| Data reviewer | Sonnet | Database changes and migrations, data consistency, query efficiency, private data. | Backends, when data files changed |
| Approver | Opus | Reads everything, checks one criterion itself, recommends MERGE or HOLD, and writes the merge commands. | Once, at the end |

The security review drops to Sonnet only when a job changes nothing but low-risk files such as documentation (`light_paths`). Any code change keeps it on Opus.

### Why some reviewers are skipped

Every agent costs roughly 40,000 tokens just to start, so the factory skips reviewers that have nothing to check. Security and code review are **never** skipped. A UX or UI review is skipped only if no files in its area changed. When in doubt, it runs. A skipped reviewer's last verdict still counts.

## 6. Reading the report and merging

When a job finishes, Claude shows you the approver's report from `decision.md`. Nothing has been merged yet. You choose one of three outcomes: merge, send it back, or leave it.

### What the report contains

| Section | What to look for |
| --- | --- |
| First line | `RECOMMEND: MERGE` or `RECOMMEND: HOLD`. |
| In short | 2 or 3 sentences: what the job delivers and the recommendation. |
| What each department did | 1 to 3 plain sentences per agent: what was planned, built and checked, and what was found. |
| Acceptance criteria | Each check from the spec, marked met or not met, with how it was confirmed. |
| Your decision | With MERGE: what will change. With HOLD: the exact question you need to answer, and which files to read. |
| Commands | Copy-and-paste terminal commands to merge and clean up. |

### When the approver says HOLD

HOLD does not mean the work is bad. It means a human must look first. The approver always says HOLD when the change:

- touches money, access or identity: payments, login, permissions, or database security rules;
- changes deployment, CI, hosting settings or build scripts;
- changes a database structure, sends email, writes production data, or adds a new third-party package;
- relies on an assumption that is really a business decision, such as prices or public wording;
- still has open review findings after the last round, or fails any merge check.

Read the **Your decision** section, answer its question, and then either merge or send it back.

### Option A: merge it

Open a terminal and run the commands from the report **one step at a time**. They look like this, with real names and paths filled in:

1. **Check your project is clean.** `cd <project> && git switch main && git status --short`. Only `factory/backlog.md` may be listed. If other files appear, commit or set them aside first.
2. **Merge.** A `git merge --no-ff factory/<job-id> -m "..."` command with a ready-written message.
3. **Optional check.** If your config names a merge check (for example a test command), run it. If it fails, undo with `git reset --merge ORIG_HEAD` and stop.
4. **Clean up.** `git worktree remove <folder> && git branch -d factory/<job-id>` deletes the job's temporary folder and branch.
5. **Confirm.** Back in Claude Code, type `/factory done <job-id>`. It checks the merge really happened and marks the job merged.
6. **Publish when ready.** `git push origin main` sends the change to the shared repository. Until you do this, the merge exists only on your computer.

**If any step prints an error, stop there and ask Claude what to do.** Don't continue to the next step.

### Option B: send it back

Type `/factory rework <job-id> <what to change>`. Your note is saved word for word, a fresh builder works on it, and the job goes through review again with a new set of up to 3 rounds. Be specific: "the error message should say which field is wrong" works better than "fix the errors".

### Option C: leave it

You don't have to decide right away. The job, its branch and its folder stay in place until you merge or rework it.

## 7. Watching progress on the dashboard

The dashboard is a web page that shows every job as a card moving across the stages. It refreshes itself every 2 seconds.

1. Open a terminal in your project folder.
2. Run: `cd factory && python3 -m http.server`
3. Open <http://localhost:8000/dashboard.html> in your browser.
4. To stop it, go back to the terminal and press `Ctrl+C`.

What you see on each card:

- The job id and the feature request.
- A coloured chip per reviewer: green for PASS, red for CHANGES.
- Total tokens used and the number of agent runs, so cost stays visible.
- Highlighted cards marked **ready to merge** or **needs you** are waiting for you.

Click a card to read its files (spec, build report, reviews, decision).

## 8. Troubleshooting and common questions

| Situation | What it means | What to do |
| --- | --- | --- |
| The job stopped with `STATUS: BLOCKED` | The builder needs a decision it can't make, such as a missing password or an unclear requirement. Claude quotes the reason. | Answer it with `/factory rework <job-id> <your answer>`. |
| Setup failed when the job started | A setup command from `CLAUDE.md` or `config.md` did not work. | Fix the command in that file, then start the job again. |
| `/factory done` says the merge isn't there yet | The job's commits are not on the base branch. | Run the merge commands in `decision.md` first, then try again. |
| `git status` lists unexpected files before merging | You have unsaved work in the project. | Commit it, or ask Claude to help set it aside, before merging. |
| A merge command prints an error | Usually a conflict with other recent changes. | Stop. Ask Claude what to do. Do not run the next step. |
| `/factory next` says there is nothing to do | All backlog lines are checked. | Add new `- [ ]` lines to `factory/backlog.md`. |
| A reviewer finished without writing its file | The reviewer answered in chat only. A chat answer never counts as a review. | Nothing. Claude reminds that reviewer once to write its file; the reviewer still decides. Only if it fails again does the job stop and ask you. |

**Can the factory break my main code?** No. It works on a separate branch in a separate folder and never merges, pushes or deletes branches. Your main code changes only when you run the merge commands.

**Can I tell it to "just merge it"?** No. Claude will not run the merge commands for you, even if asked. This is deliberate.

**Do my colleagues see the change after I merge?** Only after `git push origin main`. Merging alone changes only your computer.

**How much does a job cost?** Each agent run is roughly 40,000 tokens or more. A job that passes in one round uses 5 to 7 agent runs (spec writer, builder, 2 to 4 reviewers, approver); each fix round adds more. The dashboard shows the exact total per job.

**Where do I learn more?** Read `README.md` in the repository, and the agent instructions in `.claude/agents/`.
