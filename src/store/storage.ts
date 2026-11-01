import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState } from '../engine/types.ts';
import { SAVE_VERSION } from '../engine/types.ts';
import { newLegal } from '../engine/legal.ts';
import { newWardrobe } from '../engine/looks.ts';
import { DEFAULT_ENTITLEMENTS, type Entitlements } from '../monetization/entitlements.ts';

const SAVE_KEY = 'generations.save.v1';
const ENT_KEY = 'generations.entitlements.v1';

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as GameState;
    return migrate(g);
  } catch {
    return null;
  }
}

/** Add upgrade steps here when you change the save format (bump SAVE_VERSION in engine/types.ts). */
function migrate(g: GameState): GameState | null {
  if (!g || typeof g !== 'object' || !g.character) return null;
  if (g.version > SAVE_VERSION) return null;
  // v1 -> v2: skills, assets, loans, action log
  const ch = g.character as GameState['character'];
  if (!ch.skills) ch.skills = { athletics: 25, creativity: 25, tech: 20, charisma: 30 };
  if (!g.assets) g.assets = [];
  if (!g.loans) g.loans = [];
  if (!g.actionLog) g.actionLog = {};
  if (typeof g.actionsLeft !== 'number' || g.actionsLeft > 5) g.actionsLeft = 5;
  // v2 -> v3: unlimited actions, legal record, wardrobe
  if (!g.yearActs) g.yearActs = {};
  if (!g.pools) g.pools = {};
  if (!g.legal) g.legal = newLegal();
  if (!g.wardrobe) g.wardrobe = newWardrobe(`${ch.firstName} ${ch.lastName}`, ch.gender);
  g.version = SAVE_VERSION;
  return g;
}

export async function saveGame(g: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(g));
  } catch {}
}

export async function clearGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
  } catch {}
}

export async function loadEntitlements(): Promise<Entitlements> {
  try {
    const raw = await AsyncStorage.getItem(ENT_KEY);
    return raw ? { ...DEFAULT_ENTITLEMENTS, ...(JSON.parse(raw) as Entitlements) } : DEFAULT_ENTITLEMENTS;
  } catch {
    return DEFAULT_ENTITLEMENTS;
  }
}

export async function saveEntitlements(e: Entitlements): Promise<void> {
  try {
    await AsyncStorage.setItem(ENT_KEY, JSON.stringify(e));
  } catch {}
}

// Settings and achievements live outside any one save: they belong to the player, across every family.
export interface Meta { achievements: string[]; haptics: boolean }
const META_KEY = 'generations.meta.v1';

export async function loadMeta(): Promise<Meta> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    return raw ? { achievements: [], haptics: true, ...(JSON.parse(raw) as Partial<Meta>) } : { achievements: [], haptics: true };
  } catch {
    return { achievements: [], haptics: true };
  }
}

export async function saveMeta(m: Meta): Promise<void> {
  try {
    await AsyncStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {}
}
