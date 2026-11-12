"""Capability guard regressions; standard library only."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import subprocess
import sys
import unittest
from unittest.mock import patch

MODULE = Path(__file__).with_name('guard_tools.py')
spec = importlib.util.spec_from_file_location('guard_tools', MODULE)
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class WriteGuardTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve() / 'project'
        self.root.mkdir()
        self.job = self.root / 'factory/jobs/001-test'
        self.job.mkdir(parents=True)
        self.worktree = self.root.parent / 'project-factory/001-test'
        self.worktree.mkdir(parents=True)
        self.meta = {'id': '001-test', 'worktree': str(self.worktree), 'branch': 'factory/001-test', 'round': 2}
        (self.job / 'job.json').write_text(json.dumps(self.meta))

    def check(self, role, path, tool='Write'):
        return guard.check_write(self.root, role, {'tool_name': tool, 'tool_input': {'file_path': str(path)}})

    def test_role_reports(self):
        for role, name in [('spec-writer', 'spec.md'), ('builder', 'build.md'), ('approver', 'decision.md'), ('marketing-consultant', 'marketing.md'), ('reviewer-code', 'round-2/review-code.md')]:
            self.check(role, self.job / name)

    def test_cross_role_and_state_rejected(self):
        for name in ['build.md', 'job.json', 'round-1/review-code.md', 'round-2/review-security.md', 'source.py', 'round-2/extra.md']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.check('reviewer-code', self.job / name)

    def test_traversal_unregistered_relative_outside_rejected(self):
        for path in [self.job / '../001-test/spec.md', self.root / 'factory/jobs/002-test/spec.md', Path('spec.md'), self.root / 'src.py']:
            with self.subTest(path=path), self.assertRaises(ValueError):
                self.check('spec-writer', path)

    def test_symlinks_rejected(self):
        (self.job / 'spec.md').symlink_to(self.root / 'target')
        with self.assertRaises(ValueError):
            self.check('spec-writer', self.job / 'spec.md')
        (self.job / 'round-2').symlink_to(self.root, target_is_directory=True)
        with self.assertRaises(ValueError):
            self.check('reviewer-code', self.job / 'round-2/review-code.md')

    def test_symlink_registry_rejected(self):
        (self.job / 'job.json').unlink()
        target = self.root / 'metadata'
        target.write_text(json.dumps(self.meta))
        (self.job / 'job.json').symlink_to(target)
        with self.assertRaises(ValueError):
            self.check('spec-writer', self.job / 'spec.md')

    def test_builder_code_requires_git_registration_and_blocks_policy(self):
        with self.assertRaises(ValueError):
            self.check('builder', self.worktree / 'app.py')
        with patch.object(guard, 'registered_worktree', return_value=True):
            self.check('builder', self.worktree / 'src/app.py', 'Edit')
            for path in ['.claude/agents/a.md', 'factory/jobs/001-test/job.json', '.git', 'src/.git/config', 'src/.claude/config']:
                with self.subTest(path=path), self.assertRaises(ValueError):
                    self.check('builder', self.worktree / path)
            (self.worktree / 'link').symlink_to(self.root, target_is_directory=True)
            with self.assertRaises(ValueError):
                self.check('builder', self.worktree / 'link/app.py')

    def test_invalid_payloads_fail_closed(self):
        for payload in [None, [], {}, {'tool_name': 'Bash', 'tool_input': {}}, {'tool_name': 'Write', 'tool_input': {'file_path': 1}}, {'tool_name': 'Write', 'tool_input': []}]:
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                guard.check_write(self.root, 'spec-writer', payload)
        with self.assertRaises(ValueError):
            self.check('unknown', self.job / 'spec.md')

    def test_malformed_registry(self):
        for content in ['{}', '[]', 'bad json', json.dumps({**self.meta, 'id': '002-other'}), json.dumps({**self.meta, 'round': True})]:
            (self.job / 'job.json').write_text(content)
            with self.subTest(content=content), self.assertRaises(ValueError):
                self.check('spec-writer', self.job / 'spec.md')

    def test_review_round_zero_has_no_output(self):
        self.meta['round'] = 0
        (self.job / 'job.json').write_text(json.dumps(self.meta))
        for name in ['__denied__', 'round-0/review-code.md']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.check('reviewer-code', self.job / name)

    def test_lifetime_review_rounds_after_rework(self):
        self.meta['round'] = 7
        (self.job / 'job.json').write_text(json.dumps(self.meta))
        self.check('reviewer-code', self.job / 'round-7/review-code.md')

    def test_cli_denies_malformed_and_missing_environment(self):
        for payload, env in [('broken json', {'CLAUDE_PROJECT_DIR': str(self.root)}), ('{}', {})]:
            result = subprocess.run([sys.executable, str(MODULE), 'spec-writer'],
                                    input=payload, text=True, capture_output=True, env=env)
            self.assertEqual(result.returncode, 2)
            self.assertIn('denied', result.stderr)
        payload = {'tool_name': 'Write', 'tool_input': {'file_path': str(self.job / 'spec.md')}}
        result = subprocess.run([sys.executable, str(MODULE), 'spec-writer'],
                                input=json.dumps(payload), text=True, capture_output=True,
                                env={'CLAUDE_PROJECT_DIR': str(self.root)})
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_git_worktree_registration(self):
        def git(*args):
            subprocess.run(['git', '-C', str(self.root), *args], check=True,
                           capture_output=True, text=True)
        git('init')
        git('-c', 'user.name=Guard Test', '-c', 'user.email=test@example.invalid',
            'commit', '--allow-empty', '-m', 'fixture')
        git('worktree', 'add', '-b', 'factory/001-test', str(self.worktree))
        self.assertTrue(guard.registered_worktree(self.root, self.worktree, 'factory/001-test'))
        self.assertFalse(guard.registered_worktree(self.root, self.worktree, 'factory/002-wrong'))
        self.check('builder', self.worktree / 'src/new.py')

    def test_hardlinked_reports_rejected(self):
        target = self.root / 'private'
        target.write_text('private')
        os.link(target, self.job / 'spec.md')
        with self.assertRaises(ValueError):
            self.check('spec-writer', self.job / 'spec.md')

    def test_notebook_path_is_checked(self):
        with self.assertRaises(ValueError):
            guard.check_write(self.root, 'spec-writer', {'tool_name': 'NotebookEdit', 'tool_input': {'notebook_path': str(self.root / 'x.ipynb')}})


class AgentDefinitionTests(unittest.TestCase):
    def test_native_write_hooks_have_role_and_fail_closed_runtime(self):
        agents = MODULE.parents[3] / 'agents'
        for path in agents.glob('*.md'):
            front = path.read_text().split('---', 2)[1]
            if path.stem == 'marketing-researcher':
                self.assertIn('tools: WebSearch, WebFetch', front)
                self.assertIn('omitClaudeMd: true', front)
                continue
            with self.subTest(role=path.stem):
                self.assertIn('matcher: "Write|Edit|NotebookEdit"', front)
                self.assertIn('onFailure: block', front)
                self.assertIn('guard_tools.py" ' + path.stem, front)
                if path.stem in {'spec-writer', 'marketing-consultant', 'reviewer-marketing'}:
                    self.assertNotIn('Bash', front)
                if path.stem in {'marketing-consultant', 'reviewer-marketing'}:
                    self.assertNotIn('WebSearch', front)
                    self.assertNotIn('WebFetch', front)


if __name__ == '__main__':
    unittest.main()
