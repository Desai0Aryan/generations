// Tiny helpers that keep content files short and readable.
import type { Condition, Effect, StatKey, Cmp, RelKind, Education } from '../engine/types.ts';

// effects
export const stat = (k: StatKey, d: number): Effect => ({ t: 'stat', k, d });
export const money = (d: number): Effect => ({ t: 'money', d });
export const flag = (k: string, v = true): Effect => ({ t: 'flag', k, v });
export const mem = (text: string, tags: string[] = [], weight = 1): Effect => ({ t: 'mem', text, tags, weight });
export const bond = (d: number, who?: 'target' | RelKind): Effect => ({ t: 'rel', d, who });
export const rtag = (tag: string): Effect => ({ t: 'rtag', tag });
export const addRel = (kind: RelKind, extra: Partial<Extract<Effect, { t: 'addRel' }>> = {}): Effect => ({
  t: 'addRel',
  kind,
  ...extra,
});
export const endRel = (): Effect => ({ t: 'endRel' });
export const job = (title: string, salary: number): Effect => ({ t: 'job', title, salary });
export const raise = (pct: number): Effect => ({ t: 'raise', pct });
export const quit = (): Effect => ({ t: 'quit' });
export const retire = (): Effect => ({ t: 'retire' });
export const edu = (level: Education): Effect => ({ t: 'edu', level });
export const die = (cause: string): Effect => ({ t: 'die', cause });

// conditions
export const statIs = (k: StatKey, op: Cmp, v: number): Condition => ({ t: 'stat', k, op, v });
export const cash = (op: Cmp, v: number): Condition => ({ t: 'money', op, v });
export const hasFlag = (k: string): Condition => ({ t: 'flag', k, v: true });
export const noFlag = (k: string): Condition => ({ t: 'flag', k, v: false });
export const hasRel = (kind: RelKind): Condition => ({ t: 'hasRel', kind, has: true });
export const noRel = (kind: RelKind): Condition => ({ t: 'hasRel', kind, has: false });
export const employed = (): Condition => ({ t: 'job', has: true });
export const unemployed = (): Condition => ({ t: 'job', has: false });
export const eduAtLeast = (atLeast: Education): Condition => ({ t: 'edu', atLeast });
export const remembers = (tag: string, withinYears?: number): Condition => ({ t: 'mem', tag, withinYears, has: true });
export const generation = (op: Cmp, v: number): Condition => ({ t: 'gen', op, v });
export const odds = (p: number): Condition => ({ t: 'chance', p });

// event building blocks
import type { ChoiceDef, OutcomeDef } from '../engine/types.ts';
export const out = (text: string, effects: Effect[], weight = 1, bias?: { k: StatKey; amt: number }): OutcomeDef => ({
  text,
  effects,
  weight,
  bias,
});
export const opt = (
  label: string,
  hint: string | undefined,
  outcomes: OutcomeDef[],
  extra: Partial<Pick<ChoiceDef, 'cost' | 'requires'>> = {},
): ChoiceDef => ({ label, hint, outcomes, ...extra });
export const anyOf = (...cs: Condition[]): Condition => ({ t: 'any', cs });
