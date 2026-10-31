// Career fields. Each has a ladder you climb with years, performance and luck.
// Add a field here and it appears on the Job Board automatically.
import type { Education, SkillKey } from '../engine/types.ts';

export interface Rung { title: string; salary: number }

export interface FieldReq {
  minAge: number;
  maxAge?: number;
  edu?: Education;
  smarts?: number;
  health?: number;
  skill?: [SkillKey, number];
  /** if you have this much of the skill, the education requirement is waived (self-taught) */
  orSkill?: [SkillKey, number];
  flags?: string[]; // all must be true, e.g. degree_med
  flagLabels?: string[];
}

export interface Field {
  id: string;
  label: string;
  icon: string;
  blurb: string;
  difficulty: number; // 0 easy .. 1 brutal
  ladder: Rung[];
  req: FieldReq;
}

export const FIELDS: Field[] = [
  { id: 'retail', label: 'Retail & Service', icon: '🛒', blurb: 'Always hiring. Long hours, steady people skills.', difficulty: 0.1, req: { minAge: 16 },
    ladder: [{ title: 'Cashier', salary: 24000 }, { title: 'Shift Lead', salary: 32000 }, { title: 'Store Manager', salary: 49000 }, { title: 'Regional Manager', salary: 74000 }] },
  { id: 'trades', label: 'Skilled Trades', icon: '🔧', blurb: 'Hands-on work that pays well and cannot be outsourced.', difficulty: 0.3, req: { minAge: 18, edu: 'highschool', health: 45 },
    ladder: [{ title: 'Apprentice Electrician', salary: 33000 }, { title: 'Journeyman Electrician', salary: 54000 }, { title: 'Master Electrician', salary: 78000 }, { title: 'Contractor / Owner', salary: 108000 }] },
  { id: 'office', label: 'Business & Admin', icon: '🗂️', blurb: 'Offices, spreadsheets and the long climb to management.', difficulty: 0.25, req: { minAge: 18, edu: 'highschool', smarts: 40 },
    ladder: [{ title: 'Office Assistant', salary: 35000 }, { title: 'Project Coordinator', salary: 54000 }, { title: 'Manager', salary: 80000 }, { title: 'Director', salary: 120000 }] },
  { id: 'tech', label: 'Technology', icon: '💻', blurb: 'High pay and fast growth. Degree or serious self-taught skill.', difficulty: 0.5, req: { minAge: 18, edu: 'college', smarts: 55, orSkill: ['tech', 65] },
    ladder: [{ title: 'Junior Developer', salary: 64000 }, { title: 'Software Engineer', salary: 92000 }, { title: 'Senior Engineer', salary: 132000 }, { title: 'Staff Engineer', salary: 180000 }] },
  { id: 'health', label: 'Healthcare', icon: '🩺', blurb: 'Caring work with steady demand.', difficulty: 0.4, req: { minAge: 18, edu: 'college', smarts: 55, health: 50 },
    ladder: [{ title: 'Registered Nurse', salary: 74000 }, { title: 'Charge Nurse', salary: 92000 }, { title: 'Nurse Practitioner', salary: 118000 }, { title: 'Director of Nursing', salary: 145000 }] },
  { id: 'medicine', label: 'Medicine (Physician)', icon: '⚕️', blurb: 'Years of training. Prestige and a very large paycheck.', difficulty: 0.55, req: { minAge: 26, edu: 'grad', smarts: 65, flags: ['degree_med'], flagLabels: ['Medical degree'] },
    ladder: [{ title: 'Resident Physician', salary: 64000 }, { title: 'Attending Physician', salary: 210000 }, { title: 'Specialist', salary: 300000 }, { title: 'Chief of Medicine', salary: 410000 }] },
  { id: 'law', label: 'Law', icon: '⚖️', blurb: 'Argue for a living. Brutal early years, big rewards later.', difficulty: 0.55, req: { minAge: 25, edu: 'grad', smarts: 62, flags: ['degree_law'], flagLabels: ['Law degree'] },
    ladder: [{ title: 'Associate Attorney', salary: 98000 }, { title: 'Senior Attorney', salary: 150000 }, { title: 'Partner', salary: 260000 }, { title: 'Managing Partner', salary: 380000 }] },
  { id: 'finance', label: 'Finance', icon: '📈', blurb: 'Banks, markets and bonuses. Pressure is part of the deal.', difficulty: 0.45, req: { minAge: 18, edu: 'college', smarts: 60 },
    ladder: [{ title: 'Analyst', salary: 76000 }, { title: 'Associate', salary: 112000 }, { title: 'Vice President', salary: 188000 }, { title: 'Managing Director', salary: 330000 }] },
  { id: 'teaching', label: 'Teaching', icon: '🍎', blurb: 'Shape the next generation. Modest pay, lasting impact.', difficulty: 0.25, req: { minAge: 21, edu: 'college', smarts: 50 },
    ladder: [{ title: 'Teacher', salary: 52000 }, { title: 'Senior Teacher', salary: 62000 }, { title: 'Department Head', salary: 74000 }, { title: 'Principal', salary: 96000 }] },
  { id: 'creative', label: 'Creative & Media', icon: '🎨', blurb: 'Design, music and storytelling. Talent matters most.', difficulty: 0.4, req: { minAge: 16, skill: ['creativity', 40] },
    ladder: [{ title: 'Freelance Creator', salary: 28000 }, { title: 'Designer', salary: 54000 }, { title: 'Art Director', salary: 86000 }, { title: 'Creative Director', salary: 128000 }] },
  { id: 'service', label: 'Public Service', icon: '🚓', blurb: 'Police, fire and rescue. Physical, respected and demanding.', difficulty: 0.35, req: { minAge: 21, edu: 'highschool', health: 60, skill: ['athletics', 35] },
    ladder: [{ title: 'Officer', salary: 54000 }, { title: 'Sergeant', salary: 76000 }, { title: 'Lieutenant', salary: 98000 }, { title: 'Captain', salary: 128000 }] },
  { id: 'sports', label: 'Professional Sports', icon: '🏆', blurb: 'One in a million. A short, spectacular career.', difficulty: 0.85, req: { minAge: 18, maxAge: 34, health: 70, skill: ['athletics', 78] },
    ladder: [{ title: 'Minor League Player', salary: 42000 }, { title: 'Pro Starter', salary: 170000 }, { title: 'All-Star', salary: 680000 }, { title: 'Franchise Legend', salary: 2400000 }] },
  // reached through "Start a business", not the job board
  { id: 'business', label: 'Your Own Business', icon: '🏪', blurb: 'You are the boss. Feast or famine.', difficulty: 1, req: { minAge: 99 },
    ladder: [{ title: 'Startup Founder', salary: 24000 }, { title: 'Small Business Owner', salary: 64000 }, { title: 'Company Owner', salary: 150000 }, { title: 'CEO', salary: 340000 }] },
];

export const FIELD_BY_ID: Record<string, Field> = Object.fromEntries(FIELDS.map((f) => [f.id, f]));
export const JOB_BOARD_FIELDS = FIELDS.filter((f) => f.id !== 'business');
