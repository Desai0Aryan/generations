import type { Cmp, Condition, GameState, Relationship } from './types.ts';
import { EDU_RANK } from './types.ts';
import { chance } from './rng.ts';

function cmp(a: number, op: Cmp, b: number): boolean {
  switch (op) {
    case '>=': return a >= b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '<': return a < b;
    case '==': return a === b;
    case '!=': return a !== b;
  }
}

export function livingRels(s: GameState, kind: Relationship['kind']): Relationship[] {
  return s.relationships.filter((r) => r.kind === kind && r.alive);
}

/**
 * `deterministic` skips 'chance' conditions (used when merely checking whether a
 * choice is *available* in the UI, so rendering never consumes random numbers).
 */
export function check(s: GameState, c: Condition, deterministic = false): boolean {
  const ch = s.character;
  switch (c.t) {
    case 'stat': return cmp(ch.stats[c.k], c.op, c.v);
    case 'money': return cmp(ch.money, c.op, c.v);
    case 'flag': return (ch.flags[c.k] === true) === (c.v ?? true);
    case 'hasRel': return (livingRels(s, c.kind).length > 0) === (c.has ?? true);
    case 'job': return (ch.job !== null && !ch.retired) === c.has;
    case 'edu': return EDU_RANK[ch.education] >= EDU_RANK[c.atLeast];
    case 'mem': {
      const found = s.memories.some(
        (m) => m.tags.includes(c.tag) && (c.withinYears === undefined || s.year - m.year <= c.withinYears),
      );
      return found === (c.has ?? true);
    }
    case 'gen': return cmp(s.family.generation, c.op, c.v);
    case 'age': return cmp(ch.age, c.op, c.v);
    case 'chance': return deterministic ? true : chance(s, c.p);
    case 'not': return !check(s, c.c, deterministic);
    case 'any': return c.cs.some((x) => check(s, x, deterministic));
  }
}

export function checkAll(s: GameState, cs: Condition[] | undefined, deterministic = false): boolean {
  return !cs || cs.every((c) => check(s, c, deterministic));
}
