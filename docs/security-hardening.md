# Security hardening — 2026-11-12

This follows the source-only review of main, the marketing feature and the todo
example. The original review did not establish an externally reachable service
or a confirmed exploit. This change strengthens defaults and checks local
failure cases; it is not a production deployment or a new penetration test.

## Changes

- Dashboard instructions and fallback bind explicitly to `127.0.0.1`. Dynamic
  structural fields are escaped, numeric metadata is bounded, malformed jobs
  are normalized, and at most the latest 100 review rounds are loaded.
- Factory config requires unique, safe reviewer names with security/code always
  present. Valid IDs, regular bounded files, atomic replacement and per-job
  locks protect state updates. Current-round reports and unchanged full commit
  IDs gate review and approval. Fresh build-dispatch timestamps reject old build reports; explicit invalidation
  parks stale work for human recovery. Human rework starts a fresh three-round cycle.
- Config sets explicit chain and recorded-use limits. The orchestrator checks
  before each dispatch; the helper checks builds, rounds and approval. Missing
  usage, concurrent in-flight calls and provider billing need separate limits.
- Private marketing synthesis has no shell or web tools. Fresh public research
  goes to a separate web-only agent with sanitized, approved public context.
  Specifications have no shell. Native file mutation hooks constrain role
  outputs and builder paths; they reject policy paths, traversal and symlinks.
- Pitch capture uses a disposable browser profile, an allocated local debugging
  port, bounded startup/RPC/cleanup, validated frame inputs and signal cleanup.
- The separate todo example validates complete saved snapshots and legacy data
  before recovery. Invalid data falls back as a whole; original storage is not
  silently overwritten. Its development server also binds to loopback.
- Ignore rules cover common local secret files. Copy/publication guidance calls
  for inspection of archives, screenshots, private records and reachable history.

## Enforcement limits

Claude Code must explicitly trust the project for project hooks to run; `-p`
alone does not grant that trust. Version 2.1.295 or newer supports the configured
`onFailure: block`. Do not disable hooks or bypass them when a guard fails.
The guards check native Write/Edit/NotebookEdit calls. They do not isolate reads,
Bash, test subprocesses, MCP tools or the parent orchestrator. Builder/review
shell commands require a host sandbox and appropriate runtime permissions.

Role checks authorize outputs across registered jobs, not a cryptographically
bound per-invocation job identity. Job metadata and hook configuration are
trusted local inputs. Same-user hostile processes and check/use filesystem
races require OS isolation. No claim of complete confinement is made.

Loopback serving has no authentication and exposes served files to local
processes. Do not forward the port or serve private exports to untrusted users.
The static dashboard is a local viewer, not a production web server. Browser
cleanup cannot survive machine shutdown or SIGKILL; partial frames can remain.

## Verification

Regression suites cover helper transitions/config/paths/concurrent increments,
agent guards, dashboard injection and resource bounds, capture lifecycle and
failure cleanup, marketing count calculations and todo snapshot recovery.
Local results on 2026-11-12:

| Suite | Passed |
| --- | ---: |
| Factory helper + native write guards | 59 |
| Marketing analyzer | 8 |
| Dashboard | 7 |
| Pitch capture | 12 |
| Todo app (separate branch) | 72 |

Main's complete automated suite passed 86 tests. The todo suite passed 72 on
its separate branch before shared-factory integration; the example branch's
handoff records the final integrated run. Agent frontmatter parsed, marketing
skill validation passed, 76 local Markdown links resolved, and whitespace and
capture syntax checks passed.

Live bounded checks used an empty temporary server directory (HTTP 200 and
`lsof` showed only `127.0.0.1`), a one-frame capture in disposable Chrome, and
Claude Code 2.1.322 in a separately trusted synthetic fixture. The copied native
hook allowed a registered spec write and blocked an out-of-scope write. A second
probe returned exit 1 and `onFailure: block` prevented the file write. No private
business records or normal browser profile were used. This proves those probe
paths, not a complete hostile-build sandbox or every agent role at runtime.
An independent focused review found three recovery/data edge cases; each was
fixed and covered by regressions, with no remaining blocker in that review.

See the repository handoff for publication evidence. Unit
checks do not establish trusted-hook execution, real customer outcomes or
production isolation. Live checks are reported separately when performed.

## Sources

Primary implementation documentation, checked 2026-11-12:

1. Anthropic. *Create custom subagents*. Claude Code documentation.
   <https://code.claude.com/docs/en/sub-agents>. Tool allowlists and scoped hooks.
2. Anthropic. *Hooks reference*. Claude Code documentation.
   <https://code.claude.com/docs/en/hooks>. PreToolUse input, exit code 2,
   project trust and hook failure behavior.
3. Python Software Foundation. *http.server*. Python documentation.
   <https://docs.python.org/3/library/http.server.html>. Explicit bind option
   and development-server limits.
4. Python Software Foundation. *fcntl — The fcntl and ioctl system calls*.
   <https://docs.python.org/3/library/fcntl.html>. POSIX advisory file locking.
5. Chrome DevTools. *Chrome DevTools Protocol*.
   <https://chromedevtools.github.io/devtools-protocol/>. Browser targets,
   sessions and protocol responses. A random endpoint is not user authentication.

Marketing research remains in the separate
[bibliography](../.claude/skills/marketing/references/bibliography.md), with
source-access and transfer limitations. Tests use synthetic fixtures rather
than claimed real campaign data.
