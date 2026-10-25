"""Tests for factory.py. Each test builds a throwaway git repo with a factory
config and runs the script in it, the way the orchestrator does.

    python3 -m unittest discover -s .claude/skills/factory/scripts
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("factory.py")

CONFIG = """# Factory config

base_branch: main
reviewers: security, code
always: security, code

## Decided by the human

- The Engineer role has no password in the prototype (approved 2026-10-25).
- Dark theme only for the demo.

## Notes for agents

- Local only.
"""


class Repo:
    def __init__(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / "app"
        self.root.mkdir()
        self.git("init", "-q", "-b", "main")
        self.git("config", "user.email", "t@example.com")
        self.git("config", "user.name", "Test")
        (self.root / "factory").mkdir()
        (self.root / "factory" / "config.md").write_text(CONFIG)
        (self.root / "app.txt").write_text("one\n")
        self.git("add", ".")
        self.git("commit", "-q", "-m", "init")

    def git(self, *args, cwd=None):
        return subprocess.run(["git", *args], cwd=cwd or self.root, capture_output=True, text=True, check=True).stdout

    def f(self, *args, ok=True):
        r = subprocess.run([sys.executable, str(SCRIPT), *args], cwd=self.root, capture_output=True, text=True)
        if ok and r.returncode:
            raise AssertionError(f"factory {' '.join(args)} failed: {r.stderr}")
        if not ok:
            return r
        try:
            return json.loads(r.stdout)
        except json.JSONDecodeError:
            return r.stdout.strip()

    def job(self, job_id):
        return json.loads((self.root / "factory" / "jobs" / job_id / "job.json").read_text())

    def commit_in(self, job_id, name="change.txt"):
        wt = Path(self.job(job_id)["worktree"])
        (wt / name).write_text("x\n")
        self.git("add", ".", cwd=wt)
        self.git("commit", "-q", "-m", "feat: change", cwd=wt)

    def write(self, job_id, name, text):
        (self.root / "factory" / "jobs" / job_id / name).write_text(text)

    def close(self):
        self.tmp.cleanup()


class FactoryTest(unittest.TestCase):
    def setUp(self):
        self.repo = Repo()

    def tearDown(self):
        self.repo.close()


class ChainTest(FactoryTest):
    def test_new_without_after_uses_the_config_base(self):
        info = self.repo.f("new", "first", "First feature")
        self.assertEqual(info["base"], "main")
        self.assertEqual(self.repo.job("001-first")["base"], "main")

    def test_new_after_a_job_starts_from_its_branch(self):
        self.repo.f("new", "first", "First feature")
        self.repo.commit_in("001-first", "first.txt")
        info = self.repo.f("new", "second", "Second feature", "--after", "001")
        self.assertEqual(info["base"], "factory/001-first")
        self.assertIn("Base: factory/001-first.", info["prompt_prefix"])
        self.assertEqual(self.repo.job("002-second")["base"], "factory/001-first")
        self.assertTrue((Path(info["worktree"]) / "first.txt").is_file())

    def test_after_takes_a_full_job_id_too(self):
        self.repo.f("new", "first", "First feature")
        info = self.repo.f("new", "second", "Second", "--after", "001-first")
        self.assertEqual(info["base"], "factory/001-first")

    def test_after_an_unknown_job_fails_without_claiming_a_folder(self):
        r = self.repo.f("new", "second", "Second", "--after", "009", ok=False)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("no job 009", r.stderr)
        jobs = self.repo.root / "factory" / "jobs"
        self.assertFalse(jobs.is_dir() and any((p / "job.json").is_file() for p in jobs.iterdir()))

    def test_review_round_diffs_against_the_job_base(self):
        self.repo.f("new", "first", "First")
        self.repo.commit_in("001-first", "first.txt")
        self.repo.f("new", "second", "Second", "--after", "001")
        self.repo.commit_in("002-second", "second.txt")
        self.repo.write("002-second", "build.md", "STATUS: READY\n")
        self.repo.f("build", "002-second")
        self.repo.f("start-round", "002-second", "1")
        changed = self.repo.git("diff", "--name-only", "factory/001-first...factory/002-second").split()
        self.assertEqual(changed, ["second.txt"])

    def test_an_old_job_without_base_falls_back_to_the_config(self):
        self.repo.f("new", "first", "First")
        path = self.repo.root / "factory" / "jobs" / "001-first" / "job.json"
        job = json.loads(path.read_text())
        del job["base"]
        path.write_text(json.dumps(job))
        self.assertEqual(self.repo.f("info", "001-first")["base"], "main")


class DecidedTest(FactoryTest):
    def test_info_lists_what_the_human_decided(self):
        info = self.repo.f("new", "first", "First")
        self.assertEqual(info["decided"], [
            "The Engineer role has no password in the prototype (approved 2026-10-25).",
            "Dark theme only for the demo.",
        ])

    def test_no_section_means_an_empty_list(self):
        cfg = self.repo.root / "factory" / "config.md"
        cfg.write_text(CONFIG.split("## Decided")[0])
        self.repo.git("commit", "-qam", "no decided")
        self.assertEqual(self.repo.f("new", "first", "First")["decided"], [])


class ResumeTest(FactoryTest):
    def test_costs_add_up_with_plus_equals(self):
        self.repo.f("new", "first", "First")
        self.repo.f("set", "001-first", "tokens.builder r1=15309", "seconds.builder r1=10")
        self.repo.f("set", "001-first", "tokens.builder r1+=87718", "seconds.builder r1+=374")
        job = self.repo.job("001-first")
        self.assertEqual(job["tokens"]["builder r1"], 103027)
        self.assertEqual(job["seconds"]["builder r1"], 384)

    def test_interrupt_is_recorded_and_cleared_by_recording_the_cost(self):
        self.repo.f("new", "first", "First")
        self.repo.f("interrupt", "001-first", "builder r1")
        self.assertIn("builder r1", self.repo.job("001-first")["interrupted"])
        self.repo.f("set", "001-first", "tokens.builder r1+=500")
        self.assertNotIn("builder r1", self.repo.job("001-first").get("interrupted", {}))

    def test_resume_says_what_runs_next(self):
        self.repo.f("new", "first", "First")
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "spec-writer")
        self.repo.write("001-first", "spec.md", "# Spec\n")
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "builder")
        self.repo.f("set", "001-first", "stage=build")
        self.repo.f("interrupt", "001-first", "builder r1")
        r = self.repo.f("resume", "001-first")
        self.assertEqual((r["next"], r["interrupted"]), ("builder", ["builder r1"]))
        self.repo.commit_in("001-first")
        self.repo.write("001-first", "build.md", "STATUS: READY\n")
        self.repo.f("set", "001-first", "tokens.builder r1+=1")
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "build")
        self.repo.f("build", "001-first")
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "start-round 1")
        self.repo.f("start-round", "001-first", "1")
        (self.repo.root / "factory" / "jobs" / "001-first" / "round-1" / "review-code.md").write_text("VERDICT: PASS\n")
        self.repo.f("verdict", "001-first", "1", "code")
        r = self.repo.f("resume", "001-first")
        self.assertEqual((r["next"], r["pending_lenses"]), ("reviewers", ["security"]))
        (self.repo.root / "factory" / "jobs" / "001-first" / "round-1" / "review-security.md").write_text("VERDICT: PASS\n")
        self.repo.f("verdict", "001-first", "1", "security")
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "approve")
        self.repo.f("approve", "001-first")
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "approver")
        self.repo.write("001-first", "decision.md", "RECOMMEND: MERGE\n")
        self.repo.f("decision", "001-first")
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "human")

    def test_a_blocked_build_with_no_changes_is_retried_once(self):
        self.repo.f("new", "first", "First")
        self.repo.f("set", "001-first", "stage=build")
        self.repo.write("001-first", "build.md", "STATUS: BLOCKED\n\n## Blocked\nA read came back empty.\n")
        self.assertEqual(self.repo.f("build", "001-first"), "RETRY")
        self.assertEqual(self.repo.job("001-first")["stage"], "build")
        self.assertEqual(self.repo.f("build", "001-first"), "BLOCKED")
        self.assertEqual(self.repo.job("001-first")["stage"], "needs-human")

    def test_a_blocked_build_with_commits_goes_straight_to_the_human(self):
        self.repo.f("new", "first", "First")
        self.repo.f("set", "001-first", "stage=build")
        self.repo.commit_in("001-first")
        self.repo.write("001-first", "build.md", "STATUS: BLOCKED\n\n## Blocked\nThe spec contradicts itself.\n")
        self.assertEqual(self.repo.f("build", "001-first"), "BLOCKED")


class ReviewFixesTest(FactoryTest):
    """Cases from the code review of the first version."""

    def ready(self, job_id="001-first"):
        self.repo.write(job_id, "build.md", "STATUS: READY\n")
        return self.repo.f("build", job_id)

    def review(self, n, verdicts, job_id="001-first"):
        self.repo.f("start-round", job_id, str(n))
        for lens, v in verdicts.items():
            (self.repo.root / "factory" / "jobs" / job_id / f"round-{n}" / f"review-{lens}.md").write_text(f"VERDICT: {v}\n")
            self.repo.f("verdict", job_id, str(n), lens)

    def test_resume_after_a_retry_sends_the_builder_back(self):
        self.repo.f("new", "first", "First")
        self.repo.f("set", "001-first", "stage=build")
        self.repo.write("001-first", "build.md", "STATUS: BLOCKED\n")
        self.assertEqual(self.repo.f("build", "001-first"), "RETRY")
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "builder")

    def test_resume_does_not_trust_a_build_md_from_the_last_round(self):
        self.repo.f("new", "first", "First")
        self.repo.f("set", "001-first", "stage=build")
        self.repo.commit_in("001-first", "a.txt")
        self.ready()
        self.review(1, {"security": "PASS", "code": "CHANGES"})
        self.repo.f("set", "001-first", "stage=build")
        self.repo.commit_in("001-first", "half-a-fix.txt")  # then the session dies
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "builder")
        self.ready()
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "start-round 2")

    def test_resume_stops_at_the_round_limit(self):
        self.repo.f("new", "first", "First")
        self.repo.f("set", "001-first", "stage=build")
        for n in (1, 2, 3):
            self.repo.commit_in("001-first", f"r{n}.txt")
            self.ready()
            self.review(n, {"security": "PASS", "code": "CHANGES"})
            if n < 3:
                self.assertEqual(self.repo.f("resume", "001-first")["next"], "builder")
                self.repo.f("set", "001-first", "stage=build")
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "approve")

    def test_resume_after_rework_runs_the_approver_again(self):
        self.repo.f("new", "first", "First")
        self.repo.f("set", "001-first", "stage=build")
        self.repo.commit_in("001-first")
        self.ready()
        self.review(1, {"security": "PASS", "code": "PASS"})
        self.repo.f("approve", "001-first")
        self.repo.write("001-first", "decision.md", "RECOMMEND: MERGE\n")
        self.repo.f("decision", "001-first")
        self.repo.f("set", "001-first", "stage=build")  # /factory rework
        self.repo.commit_in("001-first", "rework.txt")
        self.ready()
        self.review(2, {"security": "PASS", "code": "PASS"})
        self.repo.f("approve", "001-first")  # old decision.md is still there
        self.assertEqual(self.repo.f("resume", "001-first")["next"], "approver")

    def test_a_review_file_without_a_recorded_verdict_is_not_spawned_again(self):
        self.repo.f("new", "first", "First")
        self.repo.f("set", "001-first", "stage=build")
        self.repo.commit_in("001-first")
        self.ready()
        self.repo.f("start-round", "001-first", "1")
        (self.repo.root / "factory" / "jobs" / "001-first" / "round-1" / "review-code.md").write_text("VERDICT: PASS\n")
        r = self.repo.f("resume", "001-first")
        self.assertEqual((r["pending_lenses"], r["verdict_lenses"]), (["security"], ["code"]))

    def test_rework_gets_its_own_retry(self):
        self.repo.f("new", "first", "First")
        self.repo.f("set", "001-first", "stage=build")
        self.repo.write("001-first", "build.md", "STATUS: BLOCKED\n")
        self.assertEqual(self.repo.f("build", "001-first"), "RETRY")
        self.repo.commit_in("001-first")
        self.ready()
        self.review(1, {"security": "PASS", "code": "PASS"})
        self.repo.f("approve", "001-first")
        self.repo.write("001-first", "decision.md", "RECOMMEND: MERGE\n")
        self.repo.f("decision", "001-first")
        self.repo.f("set", "001-first", "stage=build")  # /factory rework
        self.repo.write("001-first", "build.md", "STATUS: BLOCKED\n")
        self.assertEqual(self.repo.f("build", "001-first"), "RETRY")

    def test_new_rejects_three_arguments(self):
        r = self.repo.f("new", "first", "First", "--after", ok=False)
        self.assertNotEqual(r.returncode, 0)

    def test_interrupt_strips_the_run_name(self):
        self.repo.f("new", "first", "First")
        self.repo.f("interrupt", "001-first", "builder r1 ")
        self.repo.f("set", "001-first", "tokens.builder r1+=1")
        self.assertEqual(self.repo.job("001-first").get("interrupted", {}), {})


class ChainMergeTest(FactoryTest):
    def chain(self):
        self.repo.f("new", "first", "First")
        self.repo.commit_in("001-first", "first.txt")
        self.repo.f("new", "second", "Second", "--after", "001")
        self.repo.commit_in("002-second", "second.txt")
        self.repo.write("002-second", "build.md", "STATUS: READY\n")
        self.repo.f("build", "002-second")

    def finish(self, job_id):
        self.repo.f("start-round", job_id, "1")
        for lens in ("security", "code"):
            (self.repo.root / "factory" / "jobs" / job_id / "round-1" / f"review-{lens}.md").write_text("VERDICT: PASS\n")
            self.repo.f("verdict", job_id, "1", lens)
        self.repo.f("approve", job_id)
        self.repo.write(job_id, "decision.md", "RECOMMEND: MERGE\n")
        self.repo.f("decision", job_id)

    def test_a_chained_job_still_works_after_its_base_branch_is_deleted(self):
        self.chain()
        wt = self.repo.job("001-first")["worktree"]
        self.repo.git("merge", "-q", "--no-ff", "factory/001-first", "-m", "merge 001")
        self.repo.git("worktree", "remove", wt)
        self.repo.git("branch", "-d", "factory/001-first")
        out = self.repo.f("start-round", "002-second", "1")
        self.assertEqual(out["round"], 1)

    def test_merging_the_last_job_of_a_chain_into_main_marks_every_job_done(self):
        self.chain()
        self.finish("002-second")
        self.repo.f("set", "001-first", "stage=build")
        self.repo.write("001-first", "build.md", "STATUS: READY\n")
        self.repo.f("build", "001-first")
        self.finish("001-first")
        self.repo.git("merge", "-q", "--no-ff", "factory/002-second", "-m", "merge the chain")
        self.assertTrue(self.repo.f("done", "002-second")["merged"])
        self.assertTrue(self.repo.f("done", "001-first")["merged"])


if __name__ == "__main__":
    unittest.main()
