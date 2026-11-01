// Buying and wearing clothes, and visiting the salon. Pure functions like everything else.
import type { GameState, Look, Outfit } from './types.ts';
import { GARMENT_BY_ID, SALON_PRICE, type Slot } from '../content/wardrobe.ts';
import { addFeed, clone } from './lifecycle.ts';

const SLOTS: Slot[] = ['top', 'outer', 'hat', 'glasses', 'ears', 'neck', 'bg', 'makeup'];

export function buyGarment(prev: GameState, id: string, unlockedPacks: string[]): GameState {
  const g = GARMENT_BY_ID[id];
  if (!g || prev.wardrobe.owned.includes(id) || prev.phase !== 'alive' || prev.legal.prison) return prev;
  if (g.premium && !unlockedPacks.includes(g.premium)) return prev;
  if (prev.character.money < g.price) return prev;
  const s = clone(prev);
  s.character.money -= g.price;
  s.wardrobe.owned.push(id);
  s.wardrobe.outfit[g.slot] = id as never;
  if (g.price >= 1000) addFeed(s, `You treat yourself to the ${g.label.toLowerCase()} (${'$' + g.price.toLocaleString('en-US')}).`, 'system', 'money');
  return s;
}

export function wear(prev: GameState, slot: Slot, id: string | null): GameState {
  if (id && !prev.wardrobe.owned.includes(id)) return prev;
  if (slot === 'top' && !id) return prev;
  if (slot === 'bg' && !id) return prev;
  const s = clone(prev);
  const o = s.wardrobe.outfit as unknown as Record<string, string | undefined>;
  if (id) o[slot] = id; else delete o[slot];
  return s;
}

export function salonCost(prev: GameState, patch: Partial<Look>): number {
  const l = prev.wardrobe.look;
  let c = 0;
  if (patch.hair !== undefined && patch.hair !== l.hair) c += SALON_PRICE[patch.hair] ?? 40;
  if (patch.hairColor !== undefined && patch.hairColor !== l.hairColor) c += 45;
  if (patch.facial !== undefined && patch.facial !== l.facial) c += 20;
  return c;
}

export function setLook(prev: GameState, patch: Partial<Look>): GameState {
  const cost = salonCost(prev, patch);
  if (prev.character.money < cost || prev.legal.prison) return prev;
  const s = clone(prev);
  s.character.money -= cost;
  s.wardrobe.look = { ...s.wardrobe.look, ...patch };
  return s;
}
export type { Outfit };
export { SLOTS };
