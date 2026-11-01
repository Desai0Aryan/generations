// Candidate generator: the people you can meet. Deterministic from a seed string so the screen and the action agree.
import type { GameState, Relationship } from '../engine/types.ts';
import { hash32 } from '../engine/looks.ts';
import { LAST_NAMES } from '../engine/names.ts';
import { styleBonus } from './wardrobe.ts';

export const FEM = ['Ava', 'Mia', 'Zoe', 'Nora', 'Ivy', 'Lena', 'Maya', 'Priya', 'Sofia', 'Amara', 'Chloe', 'Elena', 'Isabel', 'Hana', 'Talia', 'Lucia', 'Jade', 'Anya', 'Camila', 'Naomi', 'Tessa', 'Rosa', 'June', 'Leila', 'Imani', 'Mei', 'Freya', 'Daphne', 'Carmen', 'Alina', 'Noor', 'Sienna'];
export const MASC = ['Noah', 'Liam', 'Elijah', 'Mateo', 'Jonah', 'Caleb', 'Owen', 'Theo', 'Jasper', 'Felix', 'Kai', 'Marco', 'Dev', 'Omar', 'Sam', 'Ravi', 'Diego', 'Ezra', 'Leo', 'Gabe', 'Ian', 'Milo', 'Arlo', 'Andre', 'Kenji', 'Isaac', 'Hugo', 'Tariq', 'Nico', 'Reuben', 'Amir', 'Callum'];
export const NEUT = ['Rowan', 'Wren', 'Jules', 'Robin', 'Quinn', 'Sage', 'Ash', 'River', 'Indigo', 'Emery', 'Remy', 'Avery'];
export const TRAITS = ['funny', 'ambitious', 'kind', 'adventurous', 'artsy', 'bookish', 'sporty', 'spontaneous', 'loyal', 'sarcastic', 'romantic', 'chill', 'driven', 'goofy', 'intense', 'foodie', 'outdoorsy', 'nerdy', 'charming', 'stubborn', 'creative', 'thoughtful', 'confident', 'shy'];
const JOBS = ['Barista', 'Nurse', 'Teacher', 'Software dev', 'Mechanic', 'Photographer', 'Lawyer', 'Chef', 'Musician', 'Personal trainer', 'Designer', 'Electrician', 'Bartender', 'Accountant', 'Vet tech', 'Writer', 'Paramedic', 'Bike courier', 'Researcher', 'Realtor', 'Pilot', 'Carpenter', 'Marketing manager', 'Florist'];
const TEEN_JOBS = ['Student', 'Student', 'Student', 'Part-time cashier', 'Student athlete', 'Student artist'];

export function mk(seed: string) {
  let t = hash32(seed);
  const f = () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  return { f, int: (a: number, b: number) => Math.floor(f() * (b - a + 1)) + a, pick: <T,>(arr: readonly T[]) => arr[Math.floor(f() * arr.length)] };
}

export interface Cand {
  id: string; first: string; last: string; name: string; gender: string; age: number; looks: number; traits: string[]; job: string; bio: string; pull: number;
}

/** who the player is interested in */
export function wantedGenders(s: GameState): string[] {
  const f = s.character.flags;
  const out: string[] = [];
  if (f.pref_f) out.push('Female');
  if (f.pref_m) out.push('Male');
  if (f.pref_nb) out.push('Non-binary');
  return out.length ? out : ['Female', 'Male'];
}

export function candidates(s: GameState, key: string, band: [number, number], opts: { romance: boolean; n?: number }): Cand[] {
  const nonce = s.pools[key] ?? 0;
  const out: Cand[] = [];
  const n = opts.n ?? 5;
  const used = new Set<string>(s.relationships.map((r) => r.name.split(' ')[0]));
  for (let i = 0; i < n; i++) {
    const r = mk(`${s.character.id}|${s.year}|${key}|${nonce}|${i}|${s.family.surname}`);
    const genders = opts.romance ? wantedGenders(s) : ['Female', 'Male', 'Female', 'Male', 'Non-binary'];
    const gender = r.pick(genders);
    const pool = gender === 'Female' ? FEM : gender === 'Male' ? MASC : NEUT;
    let first = r.pick(pool);
    for (let k = 0; k < 6 && used.has(first); k++) first = r.pick(pool);
    used.add(first);
    const age = r.int(band[0], Math.max(band[0], band[1]));
    const traits = [r.pick(TRAITS)];
    while (traits.length < 3) { const t = r.pick(TRAITS); if (!traits.includes(t)) traits.push(t); }
    const last = r.pick(LAST_NAMES);
    out.push({
      id: `${key}:${nonce}:${i}`, first, last, name: `${first} ${last}`, gender, age, looks: Math.round(30 + r.f() * 65),
      traits, job: age < 19 ? r.pick(TEEN_JOBS) : r.pick(JOBS), pull: r.f(),
      bio: r.pick([`${cap(traits[0])}, ${traits[1]}, and a little ${traits[2]}.`, `Describes themselves as ${traits[0]} and ${traits[1]}.`, `Friends say they are ${traits[1]}. Everyone agrees they are ${traits[0]}.`, `Big on being ${traits[2]}. Bad at small talk, great at big talk.`]),
    });
  }
  return out;
}
const cap = (x: string) => x[0].toUpperCase() + x.slice(1);

/** how well you click: 8-92. Looks, charm and how you dress all count. */
export function chemistry(s: GameState, c: Cand): number {
  const ch = s.character;
  const mine = ch.stats.looks + styleBonus(s) * 1.5;
  const v = 38 + (mine - 50) * 0.25 + (ch.skills.charisma - 30) * 0.3 + (ch.stats.reputation - 50) * 0.1 + (c.pull - 0.5) * 42 - (c.looks - 50) * 0.12;
  return Math.max(8, Math.min(92, Math.round(v)));
}

export function toRelationship(id: string, c: Cand, kind: Relationship['kind'], closeness: number): Relationship {
  return { id, kind, name: c.name, age: c.age, closeness, alive: true, tags: [], gender: c.gender, traits: c.traits, job: c.job, looks: c.looks };
}
