// Stub for resume skill extraction. Replace with a real backend call
// (e.g. POST /api/resume/parse) once the parsing service is wired up.
// Until then, this returns a small curated mock so the UI flow works
// end-to-end and the user can review / edit before saving.

const MOCK_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'GraphQL',
  'REST APIs',
  'Tailwind CSS',
  'Figma',
  'Jest',
  'Playwright',
  'CI/CD',
  'PostgreSQL',
];

export interface ParseResumeResult {
  skills: string[];
}

export async function parseResumeSkills(file: File): Promise<ParseResumeResult> {
  void file;
  await new Promise((r) => setTimeout(r, 600));
  return { skills: MOCK_SKILLS };
}
