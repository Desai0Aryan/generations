import type { SchoolTier } from '../engine/types.ts';

export const TIER_INFO: Record<SchoolTier, { label: string; length: number; tuition: number; rep: number; blurb: string }> = {
  community: { label: 'Community college', length: 2, tuition: 4000, rep: 0, blurb: '2 years · $4k/yr · associate degree' },
  state: { label: 'State university', length: 4, tuition: 10000, rep: 1, blurb: '4 years · $10k/yr · bachelor\'s' },
  private: { label: 'Private college', length: 4, tuition: 22000, rep: 3, blurb: '4 years · $22k/yr · bachelor\'s' },
  elite: { label: 'Elite university', length: 4, tuition: 38000, rep: 6, blurb: '4 years · $38k/yr · needs high smarts' },
};

export const MAJORS: { id: string; label: string; icon: string; hint: string }[] = [
  { id: 'stem', label: 'Science & Engineering', icon: '🔬', hint: 'Tech and research paths' },
  { id: 'business', label: 'Business & Economics', icon: '📊', hint: 'Finance, management, startups' },
  { id: 'health', label: 'Health Sciences', icon: '🧬', hint: 'Nursing, medicine, therapy' },
  { id: 'arts', label: 'Arts & Humanities', icon: '🎭', hint: 'Creativity and ideas' },
  { id: 'education', label: 'Education', icon: '🍎', hint: 'Teaching careers' },
  { id: 'law', label: 'Politics & Pre-Law', icon: '⚖️', hint: 'Debate, policy, law school' },
];

export const DEGREE_LABEL: Record<string, string> = {
  med: 'a medical degree',
  law: 'a law degree',
  mba: 'an MBA',
  phd: 'a doctorate',
};
