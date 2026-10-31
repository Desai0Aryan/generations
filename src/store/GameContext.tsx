import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState, NewGameOptions } from '../engine/types.ts';
import { ageUp, continueAs, dismissResult, interact, newGame, resolveChoice, type Interaction } from '../engine/lifecycle.ts';
import { applyForJob, buyAsset, performAction, sellAsset } from '../engine/actions.ts';
import { clearGame, loadEntitlements, loadGame, loadMeta, saveEntitlements, saveGame, saveMeta, type Meta } from './storage.ts';
import { DEFAULT_ENTITLEMENTS, ownedPackIds, purchase, restore, type Entitlements } from '../monetization/entitlements.ts';
import { FREE_PACK_IDS } from '../content/index.ts';
import { THEMES, type Product } from '../monetization/products.ts';
import { ACHIEVEMENTS, type Achievement } from '../content/achievements.ts';
import { setHapticsEnabled, success } from '../ui/fx.ts';

interface Ctx {
  ready: boolean;
  game: GameState | null;
  hasSave: boolean;
  entitlements: Entitlements;
  accent: string;
  meta: Meta;
  toast: Achievement | null;
  dismissToast: () => void;
  start: (opts: Omit<NewGameOptions, 'packs'>) => void;
  resume: () => Promise<void>;
  ageUp: () => void;
  choose: (i: number) => void;
  dismiss: () => void;
  interact: (relId: string, a: Interaction) => void;
  perform: (actionId: string, choiceIndex?: number, targetId?: string) => void;
  applyJob: (fieldId: string) => void;
  buyItem: (itemId: string, mode: 'cash' | 'finance') => void;
  sellItem: (assetId: string) => void;
  continueAs: (childId: string) => void;
  leaveGame: () => void;
  resetSave: () => Promise<void>;
  buy: (p: Product) => Promise<void>;
  restorePurchases: () => Promise<void>;
  setTheme: (id: string) => void;
  setHaptics: (on: boolean) => void;
}

const GameCtx = createContext<Ctx | null>(null);
const DEFAULT_META: Meta = { achievements: [], haptics: true };

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [entitlements, setEntitlements] = useState<Entitlements>(DEFAULT_ENTITLEMENTS);
  const [meta, setMeta] = useState<Meta>(DEFAULT_META);
  const [toasts, setToasts] = useState<Achievement[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metaRef = useRef<Meta>(DEFAULT_META);

  useEffect(() => {
    (async () => {
      const [g, e, m] = await Promise.all([loadGame(), loadEntitlements(), loadMeta()]);
      setEntitlements(e);
      setMeta(m);
      metaRef.current = m;
      setHapticsEnabled(m.haptics);
      setHasSave(!!g);
      setReady(true);
    })();
  }, []);

  // debounced autosave
  useEffect(() => {
    if (!game) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveGame(game);
      setHasSave(true);
    }, 250);
  }, [game]);

  // achievements: unlock anything newly satisfied and show a toast
  useEffect(() => {
    if (!game) return;
    const have = new Set(metaRef.current.achievements);
    const fresh = ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.check(game));
    if (fresh.length === 0) return;
    const next: Meta = { ...metaRef.current, achievements: [...metaRef.current.achievements, ...fresh.map((a) => a.id)] };
    metaRef.current = next;
    setMeta(next);
    saveMeta(next);
    setToasts((t) => [...t, ...fresh]);
    success();
  }, [game]);

  const packs = useMemo(() => [...FREE_PACK_IDS, ...ownedPackIds(entitlements)], [entitlements]);

  // keep the running game in sync with purchases so newly bought packs apply immediately
  useEffect(() => {
    setGame((g) => (g && JSON.stringify(g.packs) !== JSON.stringify(packs) ? { ...g, packs } : g));
  }, [packs]);

  const updateEnt = useCallback((e: Entitlements) => {
    setEntitlements(e);
    saveEntitlements(e);
  }, []);

  const mutate = (fn: (g: GameState) => GameState) => setGame((g) => (g ? fn(g) : g));

  const value: Ctx = {
    ready,
    game,
    hasSave,
    entitlements,
    meta,
    toast: toasts[0] ?? null,
    dismissToast: () => setToasts((t) => t.slice(1)),
    accent: THEMES.find((t) => t.id === entitlements.activeTheme)?.accent ?? THEMES[0].accent,
    start: (opts) => setGame(newGame({ ...opts, packs })),
    resume: async () => {
      const g = await loadGame();
      if (g) setGame({ ...g, packs });
    },
    ageUp: () => mutate(ageUp),
    choose: (i) => mutate((g) => resolveChoice(g, i)),
    dismiss: () => mutate(dismissResult),
    interact: (id, a) => mutate((g) => interact(g, id, a)),
    perform: (id, ci = 0, tid) => mutate((g) => performAction(g, id, ci, tid)),
    applyJob: (f) => mutate((g) => applyForJob(g, f)),
    buyItem: (id, mode) => mutate((g) => buyAsset(g, id, mode)),
    sellItem: (id) => mutate((g) => sellAsset(g, id)),
    continueAs: (id) => mutate((g) => continueAs(g, id)),
    leaveGame: () => {
      if (game) saveGame(game);
      setGame(null);
    },
    resetSave: async () => {
      await clearGame();
      setGame(null);
      setHasSave(false);
    },
    buy: async (p) => updateEnt(await purchase(entitlements, p)),
    restorePurchases: async () => updateEnt(await restore(entitlements)),
    setTheme: (id) => updateEnt({ ...entitlements, activeTheme: id }),
    setHaptics: (on) => {
      setHapticsEnabled(on);
      const next = { ...metaRef.current, haptics: on };
      metaRef.current = next;
      setMeta(next);
      saveMeta(next);
    },
  };

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const c = useContext(GameCtx);
  if (!c) throw new Error('useGame must be used inside <GameProvider>');
  return c;
}
