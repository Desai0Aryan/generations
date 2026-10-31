// Life goals shown on the "You" tab. Pure data: add or reorder freely.
import type { Condition } from '../engine/types.ts';
import { cash, eduAtLeast, employed, hasFlag, hasRel, statIs } from './dsl.ts';

export interface Goal {
  id: string;
  label: string;
  minAge: number;
  done: Condition[];
}

export const GOALS: Goal[] = [
  { id: 'grad_hs', label: 'Finish high school', minAge: 0, done: [eduAtLeast('highschool')] },
  { id: 'friend', label: 'Build a close circle of friends', minAge: 5, done: [hasRel('friend')] },
  { id: 'first_job', label: 'Get your first job', minAge: 14, done: [{ t: 'any', cs: [employed(), hasFlag('first_job')] }] },
  { id: 'degree', label: 'Earn a degree or trade certification', minAge: 17, done: [eduAtLeast('trade')] },
  { id: 'partner', label: 'Find a partner', minAge: 18, done: [hasRel('partner')] },
  { id: 'save10k', label: 'Save $10,000', minAge: 18, done: [cash('>=', 10000)] },
  { id: 'married', label: 'Get married', minAge: 21, done: [hasFlag('married')] },
  { id: 'family', label: 'Start a family', minAge: 22, done: [hasRel('child')] },
  { id: 'home', label: 'Own a home', minAge: 25, done: [hasFlag('owns_home')] },
  { id: 'rep70', label: 'Become well respected (70 reputation)', minAge: 25, done: [statIs('reputation', '>=', 70)] },
  { id: 'save100k', label: 'Save $100,000', minAge: 28, done: [cash('>=', 100000)] },
  { id: 'legacy', label: 'Leave a legacy for your family', minAge: 40, done: [{ t: 'any', cs: [hasFlag('legacy_scholarship'), hasFlag('legacy_business'), hasFlag('legacy_memoir')] }] },
];
