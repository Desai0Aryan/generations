// Achievements persist across every family you play (stored separately from saves).
// To add one: append a row. `check` can read anything in GameState.
import type { GameState } from '../engine/types.ts';
import { EDU_RANK } from '../engine/types.ts';

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
  check: (s: GameState) => boolean;
}

const hasKids = (s: GameState) => s.relationships.some((r) => r.kind === 'child');
const trips = (s: GameState) => Object.keys(s.character.flags).filter((k) => k.startsWith('legacy_trip_')).length;
const legacyFlags = (s: GameState) => ['legacy_scholarship', 'legacy_business', 'legacy_memoir', 'legacy_heirloom'].filter((k) => s.character.flags[k]).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'hs', icon: '🎓', name: 'Cap and Gown', desc: 'Graduate high school', check: (s) => EDU_RANK[s.character.education] >= 1 },
  { id: 'degree', icon: '📚', name: 'Scholar', desc: "Earn a bachelor's degree", check: (s) => s.character.education === 'college' },
  { id: 'paycheck', icon: '💼', name: 'Clocked In', desc: 'Earn your first paycheck', check: (s) => !!s.character.lastJob },
  { id: 'love', icon: '💞', name: 'Head Over Heels', desc: 'Start a relationship', check: (s) => s.relationships.some((r) => r.kind === 'partner' || r.kind === 'ex') },
  { id: 'married', icon: '💍', name: 'Till Death', desc: 'Get married', check: (s) => !!s.character.flags.married || !!s.character.flags.widowed },
  { id: 'parent', icon: '🍼', name: 'Mini Me', desc: 'Welcome a child', check: hasKids },
  { id: 'home', icon: '🏡', name: 'Keys in Hand', desc: 'Buy a home', check: (s) => !!s.character.flags.owns_home },
  { id: 'rep80', icon: '🌟', name: 'Pillar of the Community', desc: 'Reach 80 reputation', check: (s) => s.character.stats.reputation >= 80 },
  { id: 'rich', icon: '💰', name: 'Comfortable', desc: 'Hold $100,000', check: (s) => s.character.peakMoney >= 100000 },
  { id: 'mil', icon: '🏦', name: 'Seven Figures', desc: 'Hold $1,000,000', check: (s) => s.character.peakMoney >= 1000000 },
  { id: 'elder', icon: '🕰️', name: 'Long Life', desc: 'Live to 90', check: (s) => s.character.age >= 90 },
  { id: 'gen2', icon: '🌿', name: 'The Torch Is Passed', desc: 'Play as an heir', check: (s) => s.family.generation >= 2 },
  { id: 'gen3', icon: '🌳', name: 'Dynasty', desc: 'Reach the third generation', check: (s) => s.family.generation >= 3 },
  { id: 'gen5', icon: '👑', name: 'A Name in History', desc: 'Reach the fifth generation', check: (s) => s.family.generation >= 5 },
  { id: 'legacy', icon: '📜', name: 'Built to Last', desc: 'Start a family legacy project', check: (s) => legacyFlags(s) >= 1 },
  { id: 'biz', icon: '🚀', name: 'Founder', desc: 'Grow a business', check: (s) => !!s.character.flags.hustle_scaled },
  { id: 'globe', icon: '🧭', name: 'Globetrotter', desc: 'Visit 3 places around the world', check: (s) => trips(s) >= 3 },
  { id: 'friends', icon: '🤝', name: 'Good Company', desc: 'Have 4 friends at once', check: (s) => s.relationships.filter((r) => r.alive && r.kind === 'friend').length >= 4 },
];
