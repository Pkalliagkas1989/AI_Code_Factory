#!/usr/bin/env python3
"""Deterministic helpers for the /factory orchestrator.

Run every command from the main checkout. Each prints JSON (or one word) on
stdout. Exit code 1 means stop and tell the user: stderr says why.

  new <slug> <feature> [--after <job>]
                            claim a job id, write job.json, create the worktree
                            (from the base branch, or on top of another job's branch)
  info <job-id>             paths, ports, the prompt prefix and the human's decisions
  resume <job-id>           what runs next, after an interruption or a lost session
  interrupt <job-id> <run>  record that an agent run stopped early (usage limit, crash)
  start-round <job-id> <N>  choose this round's reviewers and record the round
  verdict <job-id> <N> <lens>  read and record one reviewer's verdict
  build <job-id>            read build.md's status (READY, RETRY or BLOCKED)
  approve <job-id>          record the reviewed head and enter the approve stage
  decision <job-id>         read decision.md's recommendation (MERGE or HOLD)
  done <job-id>             check the merge reached the base branch
  set <job-id> key=value…   set stage, or record a run's cost:
                            "tokens.builder r1=48128" "seconds.builder r1=134"
                            (+= adds to it, for a run resumed after an interruption)
"""
import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

STAGES = ("spec", "build", "review", "approve", "ready", "needs-human", "merged")
BROWSER_LENSES = ("ux", "ui")  # reviews that must open the running app


def fail(msg):
    print(f"factory: {msg}", file=sys.stderr)
    sys.exit(1)


def git(*args, check=True):
    r = subprocess.run(["git", *args], capture_output=True, text=True)
    if check and r.returncode:
        fail(f"git {' '.join(args)} failed: {r.stderr.strip()}")
    return r


def out(value):
    print(json.dumps(value, indent=2) if isinstance(value, (dict, list)) else value)


def repo():
    return Path(git("rev-parse", "--show-toplevel").stdout.strip())


def config():
    path = repo() / "factory" / "config.md"
    if not path.is_file():
        fail(f"{path} not found")
    text = re.sub(r"<!--.*?-->", "", path.read_text(), flags=re.S)
    keys = {}
    for line in text.split("\n## ", 1)[0].splitlines():
        m = re.match(r"^([a-z_]+(?:\.[a-z0-9_-]+)?):\s*(.*)$", line.strip())
        if m:
            keys[m[1]] = m[2].strip()
    split = lambda v: [x.strip() for x in v.split(",") if x.strip()]
    cfg = {
        "base": keys.get("base_branch") or "main",
        "reviewers": split(keys.get("reviewers", "")),
        "always": split(keys.get("always", "")),
        "light": split(keys.get("light_paths", "")),
        "paths": {k[len("paths."):]: split(v) for k, v in keys.items() if k.startswith("paths.")},
    }
    # "## Decided by the human": product calls already made, so agents don't hold on them again
    decided = re.search(r"^## Decided by the human\s*$(.*?)(?=^## |\Z)", text, re.M | re.S)
    cfg["decided"] = re.findall(r"^\s*[-*]\s+(.+?)\s*$", decided[1], re.M) if decided else []
    if not cfg["reviewers"]:
        fail("config.md has no reviewers line")
    missing = {"security", "code"} - set(cfg["always"])
    if missing:
        fail(f"config.md: always must include {', '.join(sorted(missing))}")
    return cfg


def job_dir(job_id):
    d = repo() / "factory" / "jobs" / job_id
    if not (d / "job.json").is_file():
        fail(f"no job {job_id} (expected {d}/job.json)")
    return d


def find_job(ref):
    """A job by full id or by its 3-digit number."""
    jobs = repo() / "factory" / "jobs"
    if re.fullmatch(r"\d{3}", ref):
        hits = [p.name for p in jobs.glob(f"{ref}-*") if (p / "job.json").is_file()] if jobs.is_dir() else []
        if not hits:
            fail(f"no job {ref}")
        return hits[0]
    job_dir(ref)
    return ref


def base_of(job, cfg):
    # Jobs record their own base; older job.json files predate that
    return job.get("base") or cfg["base"]


def load(job_id):
    return json.loads((job_dir(job_id) / "job.json").read_text())


def save(job):
    # Write then rename, so the dashboard never reads a half-written file
    path = repo() / "factory" / "jobs" / job["id"] / "job.json"
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(job, indent=2) + "\n")
    os.replace(tmp, path)


def first_line(path, pattern, what):
    if not path.is_file():
        fail(f"{path} is missing")
    lines = path.read_text().splitlines()
    m = re.fullmatch(pattern, lines[0].strip()) if lines else None
    if not m:
        fail(f"{what}: first line of {path} must match {pattern!r}, got {lines[0] if lines else '(empty)'!r}")
    return m[1]


def info(job, cfg):
    root = repo()
    n = int(job["id"][:3])
    base = base_of(job, cfg)
    paths = (f"Job folder: {root}/factory/jobs/{job['id']}. Worktree: {job['worktree']}. "
             f"Branch: {job['branch']}. Base: {base}. Config: {root}/factory/config.md.")
    return {
        "id": job["id"],
        "branch": job["branch"],
        "worktree": job["worktree"],
        "job_folder": f"{root}/factory/jobs/{job['id']}",
        "base": base,
        "after": job.get("after"),
        "prompt_prefix": paths,
        "builder_port": 5100 + 10 * n,
        "reviewer_ports": {lens: 5101 + 10 * n + i for i, lens in enumerate(cfg["reviewers"])},
        "decided": cfg["decided"],
    }


def cmd_new(slug, feature, *rest):
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+){0,3}", slug):
        fail("slug must be 1 to 4 lowercase words joined by '-'")
    if rest and (len(rest) != 2 or rest[0] != "--after"):
        fail("new takes <slug> <feature> and optionally --after <job>")
    cfg = config()
    # A chain: build on an earlier job's branch instead of the config's base
    after = find_job(rest[1]) if rest else None
    base = load(after)["branch"] if after else cfg["base"]
    if git("rev-parse", "--verify", "--quiet", base, check=False).returncode:
        fail(f"base branch {base} does not exist")
    root = repo()
    jobs = root / "factory" / "jobs"
    claims = jobs / ".claims"  # one empty file per number; hidden from the dashboard
    claims.mkdir(parents=True, exist_ok=True)
    while True:
        used = [int(p.name[:3]) for p in [*jobs.iterdir(), *claims.iterdir()] if re.match(r"\d{3}", p.name)]
        n = max(used, default=0) + 1
        try:
            os.close(os.open(claims / f"{n:03d}", os.O_CREAT | os.O_EXCL))
            break
        except FileExistsError:
            continue  # another session took this number; try the next
    job_id = f"{n:03d}-{slug}"
    if git("rev-parse", "--verify", "--quiet", f"factory/{job_id}", check=False).returncode == 0:
        fail(f"branch factory/{job_id} already exists; delete it or pick another slug")
    (jobs / job_id).mkdir()
    job = {
        "id": job_id,
        "feature": feature,
        "branch": f"factory/{job_id}",
        "worktree": str(root.parent / f"{root.name}-factory" / job_id),
        "base": base,
        "after": after,
        "stage": "spec",
        "round": 0,
        "reviews": {lens: "pending" for lens in cfg["reviewers"]},
    }
    save(job)
    git("worktree", "add", "-b", job["branch"], job["worktree"], base)
    out(info(job, cfg))


def light_match(path, patterns):
    return any(fnmatch.fnmatch(path, p) if "*" in p else path.startswith(p) for p in patterns)


def cmd_start_round(job_id, n):
    n = int(n)
    job, cfg = load(job_id), config()
    branch, base = job["branch"], base_of(job, cfg)
    whole = git("diff", "--name-only", f"{base}...{branch}").stdout.split()
    if n == 1:
        changed = whole
    else:
        prev = job.get("reviewed", {}).get(str(n - 1)) or fail(f"round {n - 1} was never recorded")
        changed = git("diff", "--name-only", f"{prev}..{branch}").stdout.split()

    run, skipped = [], []
    ports = info(job, cfg)["reviewer_ports"]
    for lens in cfg["reviewers"]:
        prefixes = cfg["paths"].get(lens)
        hits = [f for f in changed if prefixes and any(f.startswith(p) for p in prefixes)]
        if lens in cfg["always"]:
            reason = "always runs"
        elif n > 1 and job["reviews"].get(lens) == "CHANGES":
            reason = "asked for changes last round"
        elif prefixes is None:
            reason = "no paths line, so it always runs"
        elif hits:
            reason = f"{hits[0]} changed"
        else:
            where = "since the last review" if n > 1 else "in this job"
            skipped.append({"lens": lens, "reason": f"no file under {', '.join(prefixes)} changed {where}"})
            continue
        run.append({"lens": lens, "port": ports[lens], "reason": reason})

    # Security drops to sonnet only when every changed file in the job is low-risk
    light = bool(whole) and all(light_match(f, cfg["light"]) for f in whole)
    (job_dir(job_id) / f"round-{n}").mkdir(exist_ok=True)
    job.update(stage="review", round=n)
    job.setdefault("reviewed", {})[str(n)] = git("rev-parse", "--short", branch).stdout.strip()
    job["reviews"] = {lens: "pending" for lens in cfg["reviewers"]}
    for s in skipped:
        job["reviews"][s["lens"]] = "skipped"
    save(job)
    out({"round": n, "run": run, "skipped": skipped, "security_model": "sonnet" if light else "opus",
         # Without it the builder and the UX/UI reviewers can only read the code
         "browser": shutil.which("agent-browser") is not None})


def cmd_verdict(job_id, n, lens):
    job = load(job_id)
    if job["reviews"].get(lens) is None:
        fail(f"{lens} is not a reviewer of {job_id}")
    path = job_dir(job_id) / f"round-{n}" / f"review-{lens}.md"
    verdict = first_line(path, r"VERDICT: (PASS|CHANGES)", lens)
    job["reviews"][lens] = verdict
    save(job)
    values = job["reviews"].values()
    result = "pending" if "pending" in values else ("CHANGES" if "CHANGES" in values else "PASS")
    text = path.read_text()
    # The reviewer's first reason, shown to the human; None when it wrote no ## Why
    why = re.search(r"^## Why\s*\n\s*[-*]\s*(.+)", text, re.M)
    report = {"lens": lens, "verdict": verdict, "why": why[1].strip() if why else None, "round_result": result}
    if lens in BROWSER_LENSES:
        # These reviews must look at the running app; "Not opened: …" or no section means they didn't
        seen = re.search(r"^## Seen in the app\s*\n\s*[-*]?\s*(.+)", text, re.M)
        report["seen_in_app"] = bool(seen) and not seen[1].strip().lower().startswith("not opened")
        report["browser"] = shutil.which("agent-browser") is not None
    out(report)


def new_commits(job, cfg):
    since = job.get("reviewed", {}).get(str(job["round"])) or base_of(job, cfg)
    return int(git("rev-list", "--count", f"{since}..{job['branch']}").stdout.strip())


def cmd_build(job_id):
    job, cfg = load(job_id), config()
    status = first_line(job_dir(job_id) / "build.md", r"STATUS: (READY|BLOCKED)", "builder")
    if status == "BLOCKED":
        # A block with nothing committed is often a glitch (an empty read, a dropped
        # tool call): one automatic retry per round before it reaches the human
        if new_commits(job, cfg) == 0 and job.get("retried") != job["round"]:
            job["retried"] = job["round"]
            save(job)
            out("RETRY")
            return
        job["stage"] = "needs-human"
        save(job)
    out(status)


def cmd_approve(job_id):
    job = load(job_id)
    job.update(stage="approve", head=git("rev-parse", job["branch"]).stdout.strip())
    save(job)
    out(job["head"])


def cmd_decision(job_id):
    job = load(job_id)
    rec = first_line(job_dir(job_id) / "decision.md", r"RECOMMEND: (MERGE|HOLD)", "approver")
    job["stage"] = "ready" if rec == "MERGE" else "needs-human"
    save(job)
    out(rec)


def cmd_done(job_id):
    job, cfg = load(job_id), config()
    if job["stage"] not in ("ready", "needs-human") or not job.get("head"):
        fail(f"{job_id} is in stage {job['stage']}; only a job waiting for you can be marked done")
    base = base_of(job, cfg)
    if git("merge-base", "--is-ancestor", job["head"], base, check=False).returncode:
        fail(f"{job_id} is not merged into {base} yet; run the Commands in decision.md first")
    job["stage"] = "merged"
    save(job)
    out({
        "merged": True,
        "worktree_left": job["worktree"] in git("worktree", "list", "--porcelain").stdout,
        "branch_left": bool(git("branch", "--list", job["branch"]).stdout.strip()),
    })


def cmd_set(job_id, *pairs):
    job = load(job_id)
    for pair in pairs:
        key, sep, value = pair.partition("=")
        if not sep:
            fail(f"expected key=value, got {pair!r}")
        if key == "stage":
            if value not in STAGES:
                fail(f"stage must be one of {', '.join(STAGES)}")
            job["stage"] = value
        elif key.split(".")[0] in ("tokens", "seconds") and "." in key and value.isdigit():
            field, run = key.split(".", 1)
            add = run.endswith("+")
            run = run.rstrip("+").strip()
            costs = job.setdefault(field, {})
            costs[run] = costs.get(run, 0) + int(value) if add else int(value)
            # A recorded cost means the run finished
            job.get("interrupted", {}).pop(run, None)
        else:
            fail(f"set only takes stage=…, tokens.<run>=<number> or seconds.<run>=<number>, got {key!r}")
    save(job)
    out("ok")


def cmd_interrupt(job_id, run):
    job = load(job_id)
    job.setdefault("interrupted", {})[run] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    save(job)
    out("ok")


def cmd_resume(job_id):
    job, cfg = load(job_id), config()
    d = job_dir(job_id)
    stage, n = job["stage"], job["round"]
    pending = [lens for lens, v in job["reviews"].items() if v == "pending"] if stage == "review" else []
    if stage == "spec":
        step = "builder" if (d / "spec.md").is_file() else "spec-writer"
    elif stage == "build":
        # Builder still owes work when build.md is missing, the run was cut short,
        # or nothing was committed since the last reviewed round
        owed = (not (d / "build.md").is_file() or any(r.startswith("builder") for r in job.get("interrupted", {}))
                or (n > 0 and new_commits(job, cfg) == 0))
        step = "builder" if owed else f"start-round {n + 1}"
    elif stage == "review":
        values = job["reviews"].values()
        step = "reviewers" if pending else ("builder" if "CHANGES" in values else "approve")
    elif stage == "approve":
        step = "decision" if (d / "decision.md").is_file() else "approver"
    else:
        step = "none" if stage == "merged" else "human"
    out({"id": job_id, "stage": stage, "round": n, "next": step, "pending_lenses": pending,
         "interrupted": sorted(job.get("interrupted", {}))})


COMMANDS = {
    "new": (cmd_new, (2, 4)), "info": (lambda j: out(info(load(j), config())), 1),
    "resume": (cmd_resume, 1), "interrupt": (cmd_interrupt, 2),
    "start-round": (cmd_start_round, 2), "verdict": (cmd_verdict, 3), "build": (cmd_build, 1),
    "approve": (cmd_approve, 1), "decision": (cmd_decision, 1), "done": (cmd_done, 1),
    "set": (cmd_set, None),
}

if __name__ == "__main__":
    name, args = (sys.argv[1], sys.argv[2:]) if len(sys.argv) > 1 else ("", [])
    if name not in COMMANDS:
        fail(__doc__)
    fn, argc = COMMANDS[name]
    counts = argc if isinstance(argc, tuple) else (argc,)
    if len(args) not in counts if argc is not None else len(args) < 2:
        fail(f"{name} takes {' or '.join(map(str, counts)) if argc else 'at least 2'} argument(s)\n{__doc__}")
    fn(*args)
