# Backlog

`/factory next` takes the first unchecked item, builds it, and checks it off
with its job id. Add one feature per line.

- [ ] Example: add a footer with the current year and a link to the GitHub repo
- [x] Show how many todos are still active below the list, as "1 item left" or "N items left", updating as todos are added, ticked, edited or deleted → 003-items-left-counter
- [x] Next to that counter, add a "Mark all as done" button that ticks every active todo at once; it is disabled when there are no active todos → 004-mark-all-done
- [x] Let people keep several named todo lists. A list switcher above the input shows every list and which one is open; people can add a list (name required, trimmed, at most 40 characters, unique ignoring case), rename it with the same rules, and delete it after a confirmation, but never the last list. Each list keeps its own todos; the filters, the items-left counter, "Mark all as done" and "Clear completed" act on the open list only. The app reopens the last open list after a reload. Todos saved before this change move into a list called "My todos" without losing any. → 005-named-lists
