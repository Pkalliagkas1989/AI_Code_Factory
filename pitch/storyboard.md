# /brag plan: AI Code Factory

**Angle:** One command gets you a whole dev team (spec, build, four reviewers, approver), and it still won't merge without you.
**Hook (0–3s):** `/factory let people edit a todo by double-clicking it` typed into a terminal, then "One command. A whole dev team."
**Highlights:** (1) the seven-agent loop, (2) the code reviewer catching a real bug the tests missed (job 002, round 1 → round 2), (3) the dashboard and the approver's MERGE report with tokens counted.
**Punchline:** "The factory never merges. You do."
**Tone:** default: punchy, clean, a little playful.
**Visual identity:** the factory dashboard's dark tokens (bg #12151b, panel #1b1f27, ink #e6e9ef, muted #8d94a5, accent #7c8dff, pass #4cc47e, changes #f08a5d, human #f2b544), system UI font plus ui-monospace, 10px card radii, pill chips.
**Format:** landscape 1920×1080, 30fps, 20s. Music at 120 BPM (beat 0.5s, bar 2s). Every cut lands on a beat.

## Storyboard
| # | Time | Scene |
|---|---|---|
| 1 | 0.0–3.0 | Terminal: the command types itself, then the headline "One command. A whole dev team." |
| 2 | 3.0–7.0 | "Seven agents. One loop.": spec-writer → builder → security/ux/ui/code (parallel) → approver pop in on beats; a pulse runs the loop; the CHANGES arrow loops back |
| 3 | 7.0–11.0 | Four review cards for round 1: code shows CHANGES with the real finding ("click two todos quickly → the first tick is lost"); at 9.0 round 2 flips everything to PASS. Caption: "Caught a bug the tests missed." |
| 4 | 11.0–15.0 | Dashboard: card 002-edit-todo moves through the columns to "ready to merge" (220k tokens · 12 agent runs · 9m 36s); the decision panel slides in with RECOMMEND: MERGE and the git merge command |
| 5 | 15.0–20.0 | "The factory never merges." / "You do." → end card: AI Code Factory, `/factory <feature>`, github.com/Pkalliagkas1989/AI_Code_Factory |

Data: everything comes from the real job records in factory/jobs/002-edit-todo. Local paths are left out (the merge command is shown without the `cd /Users/...` line).
Music: synthesized at 120 BPM in A minor (kick, hats, bass, pads), with soft sfx ticks on scene cuts in the same key.
