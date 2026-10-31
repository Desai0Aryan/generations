// Small seeded RNG (mulberry32). The state lives inside GameState so saves are deterministic.
import type { GameState } from './types.ts';

export function next(s: GameState): number {
  let t = (s.rngState = (s.rngState + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function chance(s: GameState, p: number): boolean {
  return next(s) < p;
}

export function int(s: GameState, min: number, max: number): number {
  return Math.floor(next(s) * (max - min + 1)) + min;
}

export function pick<T>(s: GameState, arr: readonly T[]): T {
  return arr[Math.floor(next(s) * arr.length)];
}

export function weightedPick<T>(s: GameState, items: readonly T[], weightOf: (t: T) => number): T | undefined {
  const total = items.reduce((a, it) => a + Math.max(0, weightOf(it)), 0);
  if (total <= 0) return undefined;
  let r = next(s) * total;
  for (const it of items) {
    r -= Math.max(0, weightOf(it));
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export function uid(s: GameState, prefix: string): string {
  s.nextId += 1;
  return `${prefix}${s.nextId}`;
}

/** A first name that nobody in this life already has (the player, family, friends...). */
export function freshName(s: GameState, pool: readonly string[]): string {
  const taken = new Set<string>([s.character.firstName, ...s.relationships.map((r) => r.name.split(' ')[0])]);
  const free = pool.filter((n) => !taken.has(n));
  return pick(s, free.length ? free : pool);
}
