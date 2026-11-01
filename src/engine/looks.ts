// Faces and outfits. Everyone gets a face derived from their name, so the same person always looks the same.
import type { Look, Outfit, Wardrobe } from './types.ts';

export const HAIR_STYLES = ['bald', 'buzz', 'short', 'fade', 'crop', 'quiff', 'curly', 'afro', 'waves', 'long', 'bob', 'ponytail', 'bun', 'braids', 'pixie', 'mohawk'] as const;
export const FACIAL = ['none', 'stubble', 'mustache', 'goatee', 'beard', 'fullbeard'] as const;

export function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const FEM_HAIR = ['long', 'long', 'waves', 'bob', 'ponytail', 'bun', 'braids', 'pixie', 'curly', 'afro', 'short', 'crop'];
const MASC_HAIR = ['short', 'fade', 'crop', 'quiff', 'buzz', 'curly', 'afro', 'waves', 'mohawk', 'bald', 'braids'];
const NB_HAIR = ['short', 'crop', 'waves', 'curly', 'bob', 'pixie', 'quiff', 'long', 'afro', 'braids'];

export function lookFromSeed(key: string, gender = '', base?: Partial<Look>): Look {
  const r = rng(hash32(key));
  const fem = gender === 'Female';
  const masc = gender === 'Male';
  const pool = fem ? FEM_HAIR : masc ? MASC_HAIR : NB_HAIR;
  const rr = () => r();
  const facialRoll = rr();
  return {
    skin: Math.floor(rr() * 8),
    face: Math.floor(rr() * 4),
    hair: pool[Math.floor(rr() * pool.length)],
    hairColor: [0, 0, 1, 1, 2, 3, 3, 4, 5, 6, 7][Math.floor(rr() * 11)],
    eyes: Math.floor(rr() * 6),
    brow: Math.floor(rr() * 3),
    nose: Math.floor(rr() * 3),
    lips: Math.floor(rr() * 3),
    facial: masc ? (facialRoll < 0.5 ? 'none' : facialRoll < 0.7 ? 'stubble' : facialRoll < 0.8 ? 'mustache' : facialRoll < 0.9 ? 'goatee' : facialRoll < 0.96 ? 'beard' : 'fullbeard') : 'none',
    freckles: rr() < 0.18,
    build: Math.floor(rr() * 3),
    ...base,
  };
}

export const STARTER_ITEMS = ['tee_white', 'tee_navy', 'hoodie_grey', 'bg_dawn', 'bg_sky'];

export function defaultOutfit(gender = ''): Outfit {
  return { top: gender === 'Female' ? 'tee_white' : 'tee_navy', bg: 'bg_dawn' };
}

export function newWardrobe(name: string, gender: string): Wardrobe {
  return { look: lookFromSeed(name, gender), outfit: defaultOutfit(gender), owned: [...STARTER_ITEMS] };
}

/** An heir looks like a blend of their parent: same family closet, similar skin tone, their own face. */
export function heirWardrobe(prev: Wardrobe, name: string, gender: string): Wardrobe {
  const mine = lookFromSeed(name, gender);
  return {
    look: { ...mine, skin: prev.look.skin, hairColor: Math.random() < 0.5 ? prev.look.hairColor : mine.hairColor },
    outfit: defaultOutfit(gender),
    owned: prev.owned,
  };
}
