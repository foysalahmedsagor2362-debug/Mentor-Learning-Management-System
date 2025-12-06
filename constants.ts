// Models
export const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
export const GEMINI_PRO_MODEL = 'gemini-3-pro-preview';

// Defaults
export const DEFAULT_STUDY_GOAL = "Prepare for HSC 2026 with a focus on Medical Admission basics.";
export const SUBJECTS_LIST = [
  'Physics', 'Chemistry', 'Higher Math', 'Biology', 'ICT', 'English', 'Bengali'
];

export const MOCK_TEST_TOPICS: Record<string, string[]> = {
  'Physics': ['Thermodynamics', 'Current Electricity', 'Semiconductors', 'Vector', 'Ideal Gas'],
  'Chemistry': ['Organic Chemistry', 'Periodic Properties', 'Chemical Bonding', 'Electrochemistry'],
  'Higher Math': ['Matrix & Determinants', 'Calculus', 'Trigonometry', 'Complex Numbers'],
  'Biology': ['Cell Division', 'Genetics', 'Human Physiology', 'Plant Physiology']
};
