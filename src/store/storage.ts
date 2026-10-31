import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState } from '../engine/types.ts';
import { SAVE_VERSION } from '../engine/types.ts';
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
