# Skill Assessment: how it works and how to add a skill

Research and sources: [skill-assessment-research.md](skill-assessment-research.md).

## What a result is
- 20 scenario questions per skill: 4 subskills x 5 items, tiers in order F, F, W, W, A. Four options each; display order is shuffled per run (seeded, saved with progress).
- **Level** = highest consecutive tier passed (a tier passes at 75%: 6/8, 6/8, 3/4). `consistency: 'mixed'` when a harder tier is passed while an easier one is failed.
- **Subskill band** from tier-weighted points (F=1, W=2, A=3; max 9): >=7 Strength, >=4 Solid, else Develop. Shown as "x of 5 correct, indicative" because 5 items cannot support a precise score.
- A self-rating before the test is **not** scored. The report compares it with the measured band (over / under / accurate).
- Everything is deterministic; no model is involved in scoring. Levels and cut-offs are **provisional**.

## Where things live
| Piece | Path |
|---|---|
| Public question bank (no answers) | `supabase/functions/_shared/skills/<slug>.bank.js` |
| Answer keys (**server-only**) | `supabase/functions/_shared/skills/<slug>.keys.js` |
| Skill list (metadata only, frozen subskill ids) | `supabase/functions/_shared/skills/registry.js` |
| Scoring + bank validation | `supabase/functions/_shared/skill-core.js` |
| Submit function | `supabase/functions/submit-skill-assessment/index.ts` |
| Tables | `supabase/migrations/0018_skill_assessments.sql`, `0019_skill_courses.sql` |
| Rollbacks (do **not** move into migrations/) | `supabase/rollback/` |
| Course seed (source of truth) | `supabase/seed/skill_courses.json` |

Nothing under `src/` may import `*.keys.js` or `skill-core.js`.

**The keys are git-ignored** (see `.gitignore`) because this repository is public and they hold every correct answer. They exist only on the maintainer's machine and in the deployed function; `deploy-function.mjs` uploads them from there. A fresh clone has no keys, so the key checks in `skill-core.test.mjs` are skipped. If the repo becomes private, remove the `.gitignore` line and commit them.

## Add a skill
1. Write `<slug>.bank.js` and `<slug>.keys.js` (copy an existing pair). Every wrong option needs a misconception tag; explanations describe the concept and never name the right option.
2. Add the skill to `registry.js` (slug, title, summary, minutes, `riasecAffinity`, 4 subskills). **Subskill ids are frozen once courses use them.**
3. Add the import pair and one line to the `SKILLS` map in `submit-skill-assessment/index.ts`.
4. `npm test`. `validateBank` fails on: wrong tier pattern, missing keys/tags, "all/none of the above", answer data in the public bank, correct answer in one position more than 35% of the time, or the longest option correct more than 40% of the time.
5. Have an independent reader answer every item from the public bank only; investigate every disagreement with the key.
6. Add courses to `supabase/seed/skill_courses.json` (>= 3 per subskill per level; real, opened, https). `node supabase/seed/skill_courses.test.mjs` checks coverage.
7. Deploy: `node supabase/scripts/deploy-function.mjs submit-skill-assessment`, then `node supabase/scripts/seed-courses.mjs`, then `node supabase/scripts/check-course-links.mjs --db --apply`.

## Operating notes
- Course `levels` are the **learner starting levels** a resource suits, not the level it leads to.
- A course is hidden from reports only when `link_state = 'broken'` (404/410 or DNS failure). Bot-blocked sites stay visible as `unknown`; check them in admin.
- Item statistics (admin) need at least 30 sittings per bank version before flags appear.
- Local dev against the live function: `npx vite --port 5183 --strictPort` (the function's allowed origins list that port).
- The Management API is rate-limited per minute: batch SQL into one statement.
