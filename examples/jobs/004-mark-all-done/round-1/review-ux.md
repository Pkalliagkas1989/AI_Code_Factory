VERDICT: PASS

## Why
- "Mark all as done" sits right beside the items-left counter, ticks every todo, is disabled when none are active, and the result survives a reload.
- It looks like "Clear completed" and fits at phone width.

## Seen in the app
- Opened http://localhost:5142/index.html at 375 px (dark mode). Empty: button present and disabled (ux-empty.png).
- Added 3 todos, ticked one: "2 items left", button enabled beside the counter (ux-some.png). Clicked it: "0 items left", button disabled (ux-all.png). After reload all 3 still ticked, button still disabled.
- Accessibility tree shows a real button with its name; disabled state is exposed. Did not test the filter case or console in the browser.

## Findings
None.

## Notes
- Filter-independent behaviour is by code (completeAll acts on the whole list), not tried in the browser.
