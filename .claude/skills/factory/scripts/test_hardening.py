"""Regression tests for factory state/config/path hardening (dummy local repos)."""
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path
from test_factory import FactoryTest, CONFIG, SCRIPT


class HardeningTest(FactoryTest):
    def start(self):
        self.repo.f('new', 'safe', 'Safe feature')
        self.repo.f('set', '001-safe', 'stage=build')
        self.repo.commit_in('001-safe')
        self.repo.write('001-safe', 'build.md', 'STATUS: READY\n')
        self.repo.f('build', '001-safe')

    def review(self, verdict='PASS'):
        self.repo.f('start-round', '001-safe', '1')
        for lens in ['security', 'code']:
            self.repo.write('001-safe', f'round-1/review-{lens}.md', f'VERDICT: {verdict}\n')
            self.repo.f('verdict', '001-safe', '1', lens)

    def test_invalid_reviewer_config_is_rejected_before_job_creation(self):
        path = self.repo.root/'factory/config.md'
        for reviewers, always in [('code','security, code'), ('security, code, code','security, code'),
                                  ('security, code, ../escape','security, code'),
                                  ('security, code','security, code, ux')]:
            with self.subTest(reviewers=reviewers, always=always):
                path.write_text(CONFIG.replace('reviewers: security, code', f'reviewers: {reviewers}')
                                .replace('always: security, code', f'always: {always}'))
                result=self.repo.f('new','bad','Bad',ok=False)
                self.assertNotEqual(result.returncode,0)
        self.assertFalse((self.repo.root/'factory/jobs').exists())

    def test_path_traversal_selector_cannot_read_external_job(self):
        outside=self.repo.root.parent/'outside';outside.mkdir()
        (outside/'job.json').write_text(json.dumps({'id':'001-safe','stage':'ready'}))
        result=self.repo.f('info','../../../outside',ok=False)
        self.assertNotEqual(result.returncode,0)
        self.assertIn('job',result.stderr)

    def test_embedded_job_id_must_match_directory(self):
        self.repo.f('new','safe','Safe')
        p=self.repo.root/'factory/jobs/001-safe/job.json'
        job=json.loads(p.read_text());job['id']='002-other';p.write_text(json.dumps(job))
        result=self.repo.f('set','001-safe','tokens.builder=1',ok=False)
        self.assertNotEqual(result.returncode,0)
        self.assertFalse((p.parent.parent/'002-other').exists())

    def test_symlinked_job_state_is_rejected_without_overwriting_target(self):
        self.repo.f('new','safe','Safe')
        p=self.repo.root/'factory/jobs/001-safe/job.json'
        target=self.repo.root.parent/'external.json';target.write_text(p.read_text())
        p.unlink();p.symlink_to(target)
        before=target.read_bytes()
        result=self.repo.f('set','001-safe','tokens.builder=1',ok=False)
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(target.read_bytes(),before)

    def test_start_round_requires_ready_build_and_next_round(self):
        self.repo.f('new','safe','Safe')
        self.assertNotEqual(self.repo.f('start-round','001-safe','1',ok=False).returncode,0)
        self.repo.f('set','001-safe','stage=build')
        self.repo.commit_in('001-safe');self.repo.write('001-safe','build.md','STATUS: READY\n')
        self.repo.f('build','001-safe')
        self.assertNotEqual(self.repo.f('start-round','001-safe','2',ok=False).returncode,0)
        self.repo.f('start-round','001-safe','1')
        self.assertNotEqual(self.repo.f('start-round','001-safe','1',ok=False).returncode,0)

    def test_stale_round_verdict_and_changed_head_are_rejected(self):
        self.start();self.repo.f('start-round','001-safe','1')
        self.repo.write('001-safe','round-1/review-code.md','VERDICT: PASS\n')
        self.assertNotEqual(self.repo.f('verdict','001-safe','2','code',ok=False).returncode,0)
        self.repo.commit_in('001-safe','later.txt')
        self.assertNotEqual(self.repo.f('verdict','001-safe','1','code',ok=False).returncode,0)

    def test_merge_decision_requires_pass_reviews_and_fresh_approved_head(self):
        self.start();self.review('CHANGES');self.repo.f('approve','001-safe')
        self.repo.write('001-safe','decision.md','RECOMMEND: MERGE\n')
        self.assertNotEqual(self.repo.f('decision','001-safe',ok=False).returncode,0)
        self.repo.write('001-safe','decision.md','RECOMMEND: HOLD\n')
        self.assertEqual(self.repo.f('decision','001-safe'),'HOLD')

    def test_changed_head_after_approval_cannot_become_ready(self):
        self.start();self.review();self.repo.f('approve','001-safe')
        self.repo.commit_in('001-safe','unreviewed.txt')
        self.repo.write('001-safe','decision.md','RECOMMEND: MERGE\n')
        self.assertNotEqual(self.repo.f('decision','001-safe',ok=False).returncode,0)

    def test_stage_cannot_skip_review_or_approval(self):
        self.repo.f('new','safe','Safe')
        self.assertNotEqual(self.repo.f('set','001-safe','stage=ready',ok=False).returncode,0)
        self.assertNotEqual(self.repo.f('approve','001-safe',ok=False).returncode,0)

    def test_concurrent_usage_increments_do_not_lose_updates(self):
        self.repo.f('new','safe','Safe')
        procs=[subprocess.Popen([sys.executable,str(SCRIPT),'set','001-safe','tokens.builder+=1'],
                               cwd=self.repo.root,stdout=subprocess.PIPE,stderr=subprocess.PIPE) for _ in range(20)]
        for p in procs:
            stdout,stderr=p.communicate(timeout=20)
            self.assertEqual(p.returncode,0,stderr.decode())
        self.assertEqual(self.repo.job('001-safe')['tokens']['builder'],20)

    def test_explicit_chain_limit_and_recorded_budget_gate(self):
        config=self.repo.root/'factory/config.md'
        config.write_text(CONFIG.replace('always: security, code',
                                        'always: security, code\nmax_chain_jobs: 2\nmax_job_tokens: 10\nmax_job_seconds: 60'))
        self.repo.f('new','safe','Safe')
        self.repo.f('new','second','Second','--after','001-safe')
        self.assertNotEqual(self.repo.f('new','third','Third','--after','002-second',ok=False).returncode,0)
        self.repo.f('set','001-safe','tokens.builder=10')
        state=self.repo.f('budget','001-safe')
        self.assertFalse(state['allowed'])
        self.repo.f('set','001-safe','stage=build')
        self.repo.write('001-safe','build.md','STATUS: READY\n')
        self.assertNotEqual(self.repo.f('build','001-safe',ok=False).returncode,0)

    def test_stale_report_files_are_rejected(self):
        self.start();self.repo.f('start-round','001-safe','1')
        self.repo.write('001-safe','round-1/review-code.md','VERDICT: PASS\n')
        path=self.repo.root/'factory/jobs/001-safe/round-1/review-code.md'
        os.utime(path,(1,1))
        self.assertNotEqual(self.repo.f('verdict','001-safe','1','code',ok=False).returncode,0)

    def test_current_round_cannot_skip_mandatory_reviews_by_state_tampering(self):
        self.start();self.review();self.repo.f('approve','001-safe')
        path=self.repo.root/'factory/jobs/001-safe/job.json'
        job=json.loads(path.read_text());job['reviews']['security']='skipped';path.write_text(json.dumps(job))
        self.repo.write('001-safe','decision.md','RECOMMEND: MERGE\n')
        self.assertNotEqual(self.repo.f('decision','001-safe',ok=False).returncode,0)

    def test_blank_usage_name_does_not_corrupt_state(self):
        self.repo.f('new', 'safe', 'Safe')
        before = self.repo.job('001-safe')
        self.assertNotEqual(self.repo.f('set', '001-safe', 'tokens. =1', ok=False).returncode, 0)
        self.assertEqual(self.repo.job('001-safe'), before)

    def test_round_limit_requires_human_rework(self):
        self.start()
        for n in range(1, 4):
            self.repo.f('start-round', '001-safe', str(n))
            for lens in ['security', 'code']:
                self.repo.write('001-safe', f'round-{n}/review-{lens}.md', 'VERDICT: CHANGES\n')
                self.repo.f('verdict', '001-safe', str(n), lens)
            if n < 3:
                self.repo.f('set', '001-safe', 'stage=build')
                self.repo.commit_in('001-safe', f'change{n}.txt')
                self.repo.write('001-safe', 'build.md', 'STATUS: READY\n')
                self.repo.f('build', '001-safe')
        self.assertNotEqual(self.repo.f('set', '001-safe', 'stage=build', ok=False).returncode, 0)
        self.repo.f('approve', '001-safe')
        self.repo.write('001-safe', 'decision.md', 'RECOMMEND: HOLD\n')
        self.repo.f('decision', '001-safe')
        self.repo.f('set', '001-safe', 'stage=build')
        self.repo.commit_in('001-safe', 'human-rework.txt')
        self.repo.write('001-safe', 'build.md', 'STATUS: READY\n')
        self.repo.f('build', '001-safe')
        self.repo.f('start-round', '001-safe', '4')

    def test_stale_build_cannot_certify_new_head(self):
        self.start(); self.review('CHANGES')
        self.repo.f('set', '001-safe', 'stage=build')
        self.repo.commit_in('001-safe', 'unbuilt.txt')
        self.assertNotEqual(self.repo.f('build', '001-safe', ok=False).returncode, 0)
        self.assertEqual(self.repo.f('resume', '001-safe')['next'], 'builder')

    def test_changed_head_recovery_requires_human_rework(self):
        self.start(); self.repo.f('start-round', '001-safe', '1')
        self.repo.commit_in('001-safe', 'unexpected.txt')
        self.repo.f('invalidate', '001-safe')
        self.assertEqual(self.repo.f('resume', '001-safe')['next'], 'human')
        self.assertNotEqual(self.repo.f('done', '001-safe', ok=False).returncode, 0)
        self.repo.f('set', '001-safe', 'stage=build')
        self.repo.write('001-safe', 'build.md', 'STATUS: READY\n')
        self.repo.f('build', '001-safe')
        self.repo.f('start-round', '001-safe', '2')
        self.assertEqual(self.repo.job('001-safe')['reviews']['code'], 'pending')

    def test_human_rework_rechecks_whole_job_for_pending_lens(self):
        config = self.repo.root/'factory/config.md'
        config.write_text(CONFIG.replace('reviewers: security, code', 'reviewers: security, code, ui').replace('always: security, code', 'always: security, code\npaths.ui: ui/'))
        self.repo.f('new', 'safe', 'Safe')
        self.repo.f('set', '001-safe', 'stage=build')
        (Path(self.repo.job('001-safe')['worktree'])/'ui').mkdir()
        self.repo.commit_in('001-safe', 'ui/page.txt')
        self.repo.write('001-safe', 'build.md', 'STATUS: READY\n')
        self.repo.f('build', '001-safe'); self.repo.f('start-round', '001-safe', '1')
        self.repo.f('invalidate', '001-safe')
        self.repo.f('set', '001-safe', 'stage=build')
        self.repo.commit_in('001-safe', 'backend.txt')
        self.repo.write('001-safe', 'build.md', 'STATUS: READY\n')
        self.repo.f('build', '001-safe')
        result = self.repo.f('start-round', '001-safe', '2')
        self.assertIn('ui', [r['lens'] for r in result['run']])
