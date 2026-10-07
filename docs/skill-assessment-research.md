# Skill assessment: research findings and sources

Saved 2026-10-08 for use when designing and building the Skill Assessment module. Findings are decision-relevant only; see the build plan for how they were applied.

## Part A — Research findings (decision-relevant only)

### Executive conclusion
For a low-stakes, unproctored, self-serve coaching product, the strongest feasible method is a **short criterion-referenced performance test**. It has five parts:
- **Scenario-based single-best-answer items.** For soft skills these are situational judgement tests (SJTs) with "what *should* you do" (knowledge) instructions. For analytical skills they are objectively keyed tasks.
- **Tiered by difficulty.** Items are tagged to behaviourally described proficiency levels.
- **Wrong options tagged by misconception.**
- **A self-rating before the test,** to show self-estimate vs measured.
- **A level, not a percentage, as the headline.** Subskills are shown honestly as indicative bands.

What we should not do:
- Self-ratings as the score.
- LLM-graded scores in the MVP.
- Item-level adaptive testing.
- Certification badges.

### What we learned
1. **Self-report is not skill measurement.** Self-estimated vs actual performance correlates about r ≈ .32 in a meta-analysis. People who are worst at a skill tend to lack the knowledge needed to judge it, though the classic Dunning–Kruger quartile pattern is partly a statistical artifact.
   → CAT's Likert method cannot be the *score*. Self-rating is valuable as a *calibration insight*.
2. **Validities after the Sackett et al. (2022) re-correction:**

   | Method | Validity |
   |---|---|
   | Structured interview | .42 |
   | Job knowledge tests | .40 |
   | Work samples | .33 |
   | Cognitive ability | .31 (not the long-cited .51) |

   Applied-knowledge tests ("knows how" on Miller's pyramid) are scalable and still strong. Work samples ("shows how") have higher fidelity but need human or AI grading.
3. **SJTs reach ρ ≈ .26–.34 for job performance** (McDaniel 2001/2007).
   - **Knowledge instructions** correlate more with ability and fake less than **behavioural-tendency instructions**.
   - SJTs fake less than self-report personality inventories.
   → Use knowledge instructions.
4. **Subskill scores are usually noise.** Subscores from fewer than about 10 items "almost never" add value over the total, and about 20 items are needed (Sinharay & Haberman, ETS / NCME).
   → Show subskills as **indicative bands with "based on N questions"**, never precise percentages.
5. **Adaptive testing is premature.** It needs an item bank calibrated with item response theory (IRT), about 200 items × about 150 examinees, and small-sample calibration capitalises on chance. Multistage testing avoids pre-calibration but still needs more keyed items than we have.
   → Ship fixed forms with tiers. **Log every item response** for later calibration and two-stage routing.
6. **LLM grading is unreliable as the score owner.** The 2025–26 literature is mixed:
   - Some studies find low human–LLM agreement (QWK) and weak within-model consistency (Kendall's W < .30).
   - Locked, evidence-anchored rubrics help but don't eliminate drift.
   → MVP scoring is deterministic. A future AI-scored open task would be a separate, labelled "indicative" signal.
7. **Cheating is real for high-stakes tests and low-stakes for ours.** About 37% of job seekers admit unauthorised AI use, and unproctored score inflation is about 4× that of proctored tests. LinkedIn **retired its skill badges in 2023**, citing fraud and hirers preferring applied evidence.
   → No credential. Keep keys off every client bundle. Log time per item and flag low-effort runs.
8. **Levels must be criterion-referenced with behavioural anchors.** Examples are Dreyfus, SFIA ("progressive, distinct, consistent" levels), and NAEP (Below Basic → Advanced). Cut scores normally come from Angoff (expert) or Bookmark (data plus item ordering).
   → Provisional tier-mastery cut-offs now, re-set by Bookmark once data exists.
9. **Certainty-based marking** (Gardner-Medwin; +1/+2/+3 for a correct answer, 0/−2/−6 for an error, by confidence level) improves metacognition. It is a later option. The MVP uses a cheaper self-rating before the test.

### What we might be getting wrong
- **The keys are authored without an expert panel.** Mitigation: a blind-solve check by an independent agent (Part D), a rationale on every item, review by Samir, and admin item statistics.
- **The cut-offs are judgement, not data.** They are labelled provisional, and the bank version is stored so cut-offs can be re-set.
- **20 items measure "knows how", not "does".** The results copy states this scope.
- **Retakes inflate scores through practice effects.** `attempt_no` is stored and shown in admin, retakes are rate-limited, and results never reveal the correct answers.

### Sources
- Sackett, Zhang, Berry, Lievens (2022), *J. Applied Psychology*. Summaries: https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance · https://testgorilla.com/blog/hiring-tools-validity-revisited
- Self-assessment meta-analysis: https://scapps.org/jems/index.php/1/article/view/1095 · Dunning–Kruger critique: https://pmc.ncbi.nlm.nih.gov/articles/PMC8883889 · https://www.Gwern.net/doc/iq/2020-gignac.pdf
- SJTs: https://web.pdx.edu/~mccunee/quant_621/Outlines/McDaniel%20et%20al%202001%20SJTs.doc · https://eprints.whiterose.ac.uk/id/eprint/159850/ · https://experts.umn.edu/en/publications/the-effects-of-response-instructions-on-situational-judgment-test/ · https://www.humrro.org/blog/evidence-and-experience-based-best-practices-situational-judgment-tests/ · https://fis.leuphana.de/en/publications/sweet-little-lies-an-in-depth-analysis-of-faking-behavior-on-situ/
- Subscores: https://www.ets.org/research/policy_research_reports/publications/report/2008/jdne.html · https://www.ets.org/research/policy_research_reports/publications/report/2010/issf.html · https://ncme.org/wp-content/uploads/2025/10/Module-32-Subscores-I-A-Statistical-Overview-Sinh-1.pdf
- Adaptive / multistage: https://caa.cankaya.edu.tr/items/917dd58b-8a35-4631-8a2c-a2abbb04990f · https://ncme.org/wp-content/uploads/2025/10/Module-25-Multi-stage-Testing-Hendrickson-Summer-1.pdf
- LLM scoring: https://arxiv.org/html/2601.08654 · https://arxiv.org/pdf/2508.02442v1
- Cheating: https://testgorilla.com/blog/cheating-pre-employment-skills-tes · https://proctor360.com/blog/applicants-cheat-pre-hire-assessments · https://www.linkedin.com/help/learning/answer/a1690529
- Levels / standard setting: https://sfia-online.org/en/about-sfia/how-sfia-works · https://en.wikipedia.org/wiki/Dreyfus_model_of_skill_acquisition · https://pmc.ncbi.nlm.nih.gov/articles/PMC4671208 · https://pmc.ncbi.nlm.nih.gov/articles/PMC7778792/
- Certainty-based marking: https://www.ucl.ac.uk/lapt/REAP_CBM.htm

---

