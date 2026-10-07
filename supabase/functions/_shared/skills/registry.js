// Skill registry — METADATA ONLY (no items), so listing skills never ships a
// question bank. Plain ESM, zero imports. Subskill ids are FROZEN: courses in
// the catalog are tagged with them, so renaming one orphans those courses.

export const SKILLS = [
  {
    slug: 'data-literacy',
    title: 'Data Literacy',
    summary: 'Read charts and tables, work with percentages and averages, and judge whether evidence supports a claim.',
    minutes: 14,
    riasecAffinity: ['I', 'C'],
    subskills: [
      { id: 'reading-charts', label: 'Reading charts & tables' },
      { id: 'proportions', label: 'Proportions & percentages' },
      { id: 'averages-variation', label: 'Averages & variation' },
      { id: 'evidence-causation', label: 'Evidence & causation' },
    ],
  },
  {
    slug: 'workplace-communication',
    title: 'Workplace Communication',
    summary: 'Write and speak clearly, adapt to your audience, listen well, and handle difficult conversations.',
    minutes: 14,
    riasecAffinity: ['S', 'E'],
    subskills: [
      { id: 'clarity-structure', label: 'Clarity & structure' },
      { id: 'audience-tone', label: 'Audience & tone' },
      { id: 'listening-questions', label: 'Listening & questions' },
      { id: 'difficult-conversations', label: 'Difficult conversations' },
    ],
  },
]

export function listSkills() {
  return SKILLS
}

export function getSkillMeta(slug) {
  return SKILLS.find((s) => s.slug === slug) ?? null
}
