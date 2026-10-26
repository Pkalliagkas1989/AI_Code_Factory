VERDICT: PASS

## Why
- The list switcher works as specified: add, rename, switching, per-list todos, reload keeps the open list, and refusals show a clear message.
- It stays usable at phone width and in dark mode, with proper buttons, a labelled group, and focus returning sensibly.

## Seen in the app
- Served the worktree on port 5953 (port 5152 was already held by an unrelated app, "Aethorax mission planner").
- Fresh load: one list "My todos" pressed, Delete list disabled.
- Added "  Work  " -> "Work" opened. Adding "work" -> "Another list already has that name." (field stays open). Escape closes it.
- Renamed Work to "WORK" -> accepted, still open. Renaming to "my todos" -> refused with message (ux-error.png). Escape closed the field and focus went back to "Rename list".
- Todo added in WORK, reload: WORK reopened with 1 todo.
- Added a list named "<b>x</b> aaaa..." (40 chars): shown literally, no overflow at 375 px (scrollWidth 375): ux-phone.png. Dark mode looks consistent: ux-dark.png.
- Not exercised in the browser: window.confirm delete flow (read in code: names the list, Cancel does nothing, focus moves to the open tab).

## Findings
None.

## Notes
- Tab list buttons reuse the filter look, so a long-named tab spans the full width; fine.
- The list message is shown in muted grey for errors; a stronger error colour might help but is taste.
