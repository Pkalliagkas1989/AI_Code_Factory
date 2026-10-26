VERDICT: CHANGES

## Why
- The new "Mark all as done" button matches the quiet button style and works in dark mode, but it makes the footer overflow: "Clear completed" now wraps alone onto a second line, even on a 1100 px desktop.

## Seen in the app
- Ran the dev server on 5143 and loaded 3 todos (1 done). Screenshots: ui-desktop-light.png, ui-desktop-dark.png, ui-phone-light.png, ui-phone-dark.png, ui-desktop-dark-alldone.png in this folder. The system rendered dark for the first shots, so "light" ones are probably dark too; the light palette was not seen separately. Styling uses existing tokens only, so low risk.
- Footer: "2 items left  Mark all as done" on the left, filters on the right, "Clear completed" dropped onto its own row on both desktop and phone. On the phone it sits beside the filters, which is fine.
- After clicking, the button is disabled and dimmed ("0 items left"), as intended.

## Findings
1. src/styles.css:46 / src/index.html:19 The `.status` group (count + button) takes enough width that the footer's three groups no longer fit in the 480 px column, so "Clear completed" wraps alone on desktop and looks orphaned. Fix: keep the footer on one line at desktop width (e.g. reduce padding/gap, or move "Mark all as done" so it sits with "Clear completed"/elsewhere, such as a row above the filters) so the footer does not wrap into an unbalanced layout.

## Notes
- Wording and disabled state are good.
