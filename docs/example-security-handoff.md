# Todo example security follow-up — 2026-11-12

The example retains its todo app, archived job evidence and
`base_branch: example/todo-app`. Shared main security hardening and the existing
marketing integration were merged into the example. No example app files were
added to main.

Saved state now requires valid complete list/todo records, safe positive unique
IDs, boolean completion and nonblank names/text. Invalid snapshots fall back
as a whole to validated legacy data or defaults. Valid strings remain intact;
original raw storage is not silently overwritten. Allocating IDs at the safe
integer boundary uses a free safe ID, preserving add/save/reload behavior.
The development server explicitly binds to `127.0.0.1`.

Validation on the final integrated example tree:

- Factory helper and native guard tests: 59 passed.
- Marketing analyzer: 8 passed.
- All Node tests: 91 passed (72 todo, 7 dashboard, 12 pitch capture).
- Total: 158 tests, zero failures.

Commands: `python3 -m unittest discover -s .claude/skills/factory/scripts`,
`python3 -m unittest discover -s .claude/skills/marketing/scripts`, and
`node --test`. This workstation used the bundled Node runtime because its
separate system Node installation is broken. No repository dependencies were
added to work around that workstation issue.

See [shared security boundaries and sources](security-hardening.md) for the
live loopback/Chrome/Claude probes and remaining host-sandbox, project-trust and
recorded-budget limitations. Review private material and reachable history
before copying/publishing archives; ignore rules do not sanitize tracked files.
