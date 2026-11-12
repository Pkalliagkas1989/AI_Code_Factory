#!/usr/bin/env python3
"""Fail-closed PreToolUse guard for native file mutation tools.

This is an application check, not filesystem isolation: Bash, test subprocesses,
other tools and check/use races require a host sandbox and trusted configuration.
CLAUDE_PROJECT_DIR must identify the trusted main checkout, not an agent worktree.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import sys

JOB_ID = re.compile(r'[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+){0,3}')
REPORTS = {'spec-writer': 'spec.md', 'builder': 'build.md',
           'approver': 'decision.md', 'marketing-consultant': 'marketing.md'}
REVIEWERS = {'reviewer-' + lens for lens in ('api', 'code', 'data', 'marketing', 'security', 'ui', 'ux')}


def clean_path(value):
    if not isinstance(value, str) or not value or '\x00' in value:
        raise ValueError('missing or invalid absolute path')
    path = Path(value)
    if not path.is_absolute() or '..' in path.parts:
        raise ValueError('absolute paths without traversal are required')
    for part in (path, *path.parents):
        if part.is_symlink():
            raise ValueError('symlink paths are forbidden')
    if path.exists() and (not path.is_file() or path.stat().st_nlink != 1):
        raise ValueError('target must be a regular file without hard links')
    return path


def registered_worktree(root, worktree, branch):
    """Check Git registration as well as trusted job metadata."""
    result = subprocess.run(['git', '-C', str(root), 'worktree', 'list', '--porcelain'],
                            capture_output=True, text=True, timeout=5, check=False,
                            env={**os.environ, 'GIT_OPTIONAL_LOCKS': '0'})
    expected = f'worktree {worktree}\n'
    ref = f'branch refs/heads/{branch}'
    return result.returncode == 0 and any(block.startswith(expected) and ref in block.splitlines()
                                          for block in result.stdout.split('\n\n'))


def load_job(root, job_id):
    if not JOB_ID.fullmatch(job_id):
        raise ValueError('invalid job ID')
    path = clean_path(str(root / 'factory/jobs' / job_id / 'job.json'))
    try:
        job = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError('unregistered or malformed job') from exc
    if (not isinstance(job, dict) or job.get('id') != job_id
            or job.get('branch') != f'factory/{job_id}'
            or type(job.get('round')) is not int or job['round'] < 0):
        raise ValueError('invalid job registration')
    expected = root.parent / f'{root.name}-factory' / job_id
    if job.get('worktree') != str(expected):
        raise ValueError('worktree does not match factory registration layout')
    return job, expected


def check_write(root, role, payload):
    root = Path(root).resolve(strict=True)
    if role not in REPORTS and role not in REVIEWERS:
        raise ValueError('unknown agent role')
    if not isinstance(payload, dict) or payload.get('tool_name') not in {'Write', 'Edit', 'NotebookEdit'}:
        raise ValueError('unexpected tool payload')
    args = payload.get('tool_input')
    if not isinstance(args, dict):
        raise ValueError('missing tool input')
    key = 'notebook_path' if payload['tool_name'] == 'NotebookEdit' else 'file_path'
    target = clean_path(args.get(key))
    jobs = root / 'factory/jobs'
    if target.is_relative_to(jobs):
        relative = target.relative_to(jobs)
        if len(relative.parts) < 2:
            raise ValueError('missing registered job output')
        job_id = relative.parts[0]
        job, _ = load_job(root, job_id)
        output = Path(*relative.parts[1:])
        if role in REVIEWERS:
            if job['round'] < 1:
                raise ValueError('no review round has started')
            expected = Path(f'round-{job["round"]}/review-{role.removeprefix("reviewer-")}.md')
        else:
            expected = Path(REPORTS[role])
        if output != expected:
            raise ValueError('role may only write its current report')
        return
    if role == 'builder':
        worktrees = root.parent / f'{root.name}-factory'
        if target.is_relative_to(worktrees):
            relative = target.relative_to(worktrees)
            if len(relative.parts) < 2:
                raise ValueError('missing code path')
            job, worktree = load_job(root, relative.parts[0])
            if any(p in {'.claude', 'factory', '.git'} for p in relative.parts[1:]):
                raise ValueError('factory policy and Git metadata are protected')
            # Check worktree ancestry even when the requested file does not exist.
            clean_path(str(worktree / '.guard-path-check'))
            if registered_worktree(root, worktree, job['branch']):
                return
    raise ValueError('path is outside the registered role output')


def main():
    try:
        if len(sys.argv) != 2 or not os.environ.get('CLAUDE_PROJECT_DIR'):
            raise ValueError('trusted CLAUDE_PROJECT_DIR and role are required')
        payload = json.load(sys.stdin)
        check_write(Path(os.environ['CLAUDE_PROJECT_DIR']), sys.argv[1], payload)
    except (ValueError, OSError, TypeError, subprocess.SubprocessError) as exc:
        print(f'factory write guard denied: {exc}', file=sys.stderr)
        return 2  # Claude Code PreToolUse: blocking error, no operation runs.
    return 0


if __name__ == '__main__':
    sys.exit(main())
