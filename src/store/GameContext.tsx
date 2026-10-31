import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState, NewGameOptions } from '../engine/types.ts';
import { ageUp, continueAs, dismissResult, interact, newGame, resolveChoice, type Interaction } from '../engine/lifecycle.ts';
import { clearGame, loadEntitlements, loadGame, saveEntitlements, saveGame } from './storage.ts';
import { DEFAULT_ENTITLEMENTS, ownedPackIds, purchase, restore, type Entitlements } from '../monetization/entitlements.ts';
import { FREE_PACK_IDS } from '../content/index.ts';
import { PRODUCTS, THEMES, type Product } from '../monetization/products.ts';

interface Ctx {
  ready: boolean;
  game: GameState | null;
  hasSave: boolean;
  entitlements: Entitlements;
  accent: string;
  start: (opts: Omit<NewGameOptions, 'packs'>) => void;
  resume: () => Promise<void>;
  ageUp: () => void;
  choose: (i: number) => void;
  dismiss: () => void;
  interact: (relId: string, a: Interaction) => void;
  continueAs: (childId: string) => void;
  leaveGame: () => void;
  resetSave: () => Promise<void>;
  buy: (p: Product) => Promise<void>;
  restorePurchases: () => Promise<void>;
  setTheme: (id: string) => void;
}

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [entitlements, setEntitlements] = useState<Entitlements>(DEFAULT_ENTITLEMENTS);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const [g, e] = await Promise.all([loadGame(), loadEntitlements()]);
      setEntitlements(e);
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

  const packs = useMemo(() => [...FREE_PACK_IDS, ...ownedPackIds(entitlements)], [entitlements]);

  // keep the running game in sync with purchases so newly bought packs apply immediately
  useEffect(() => {
    setGame((g) => (g && JSON.stringify(g.packs) !== JSON.stringify(packs) ? { ...g, packs } : g));
  }, [packs]);

  const updateEnt = useCallback((e: Entitlements) => {
    setEntitlements(e);
    saveEntitlements(e);
  }, []);

  const value: Ctx = {
    ready,
    game,
    hasSave,
    entitlements,
    accent: THEMES.find((t) => t.id === entitlements.activeTheme)?.accent ?? THEMES[0].accent,
    start: (opts) => setGame(newGame({ ...opts, packs })),
    resume: async () => {
      const g = await loadGame();
      if (g) setGame({ ...g, packs });
    },
    ageUp: () => setGame((g) => (g ? ageUp(g) : g)),
    choose: (i) => setGame((g) => (g ? resolveChoice(g, i) : g)),
    dismiss: () => setGame((g) => (g ? dismissResult(g) : g)),
    interact: (id, a) => setGame((g) => (g ? interact(g, id, a) : g)),
    continueAs: (id) => setGame((g) => (g ? continueAs(g, id) : g)),
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
  };

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const c = useContext(GameCtx);
  if (!c) throw new Error('useGame must be used inside <GameProvider>');
  return c;
}

export { PRODUCTS };
