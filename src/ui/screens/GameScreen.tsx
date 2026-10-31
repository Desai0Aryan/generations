import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portrait } from '../art.tsx';
import { colors, fmtMoney, serif } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { LifeTab } from '../tabs/LifeTab.tsx';
import { DoTab } from '../tabs/DoTab.tsx';
import { YouTab } from '../tabs/YouTab.tsx';
import { PeopleTab } from '../tabs/PeopleTab.tsx';
import { StuffTab } from '../tabs/StuffTab.tsx';
import { LegacyTab } from '../tabs/LegacyTab.tsx';
import { ShopTab } from '../tabs/ShopTab.tsx';
import { EventModal } from './EventModal.tsx';
import { LegacyScreen } from './LegacyScreen.tsx';
import { SheetHost } from '../sheets.tsx';
import { tap, useEntrance, useTween } from '../fx.ts';
import { currentEvent } from '../../engine/lifecycle.ts';

const TABS = [
  { id: 'life', icon: '🌿', label: 'Life' },
  { id: 'do', icon: '⚡', label: 'Do' },
  { id: 'people', icon: '👥', label: 'People' },
  { id: 'stuff', icon: '🏠', label: 'Stuff' },
  { id: 'you', icon: '📊', label: 'You' },
  { id: 'legacy', icon: '📜', label: 'Legacy' },
] as const;
type TabId = (typeof TABS)[number]['id'] | 'shop';

function Toast() {
  const { toast, dismissToast } = useGame();
  const p = useEntrance(380, 0, true);
  useEffect(() => {
    const t = setTimeout(dismissToast, 3400);
    return () => clearTimeout(t);
  }, []);
  if (!toast) return null;
  return (
    <Pressable onPress={dismissToast} style={{ position: 'absolute', top: 70, left: 16, right: 16, backgroundColor: '#1D2B49', borderRadius: 16, borderWidth: 1, borderColor: colors.gold, padding: 12, flexDirection: 'row', alignItems: 'center', opacity: Math.min(1, p), transform: [{ translateY: (1 - p) * -30 }] }}>
      <Text style={{ fontSize: 30, marginRight: 12 }}>{toast.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>TROPHY UNLOCKED</Text>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{toast.name}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{toast.desc}</Text>
      </View>
    </Pressable>
  );
}

export function GameScreen() {
  const { game, accent, leaveGame, toast } = useGame();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>('life');
  const money = useTween(game?.character.money ?? 0, 700);
  if (!game) return null;
  const ch = game.character;
  const cur = currentEvent(game);
  const showLegacy = game.phase === 'dead' && game.queue.length === 0;

  return (
    <SheetHost>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center' }}>
          <Portrait name={`${ch.firstName} ${ch.lastName}`} age={ch.age} gender={ch.gender} size={42} ring={accent} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{ch.firstName} {ch.lastName}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Age {ch.age} · {game.year} · Gen {game.family.generation}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
            <Text style={{ color: money < 0 ? colors.danger : colors.gold, fontWeight: '800', fontSize: 16 }}>{fmtMoney(money)}</Text>
            <Text onPress={() => { tap(); leaveGame(); }} style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>Menu</Text>
          </View>
          <Pressable onPress={() => { tap(); setTab(tab === 'shop' ? 'life' : 'shop'); }} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: tab === 'shop' ? accent : colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 17 }}>🛍️</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          {tab === 'life' ? <LifeTab /> : null}
          {tab === 'do' ? <DoTab /> : null}
          {tab === 'people' ? <PeopleTab /> : null}
          {tab === 'stuff' ? <StuffTab /> : null}
          {tab === 'you' ? <YouTab /> : null}
          {tab === 'legacy' ? <LegacyTab /> : null}
          {tab === 'shop' ? <ShopTab /> : null}
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: insets.bottom }}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => { tap(); setTab(t.id); }} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 18, opacity: tab === t.id ? 1 : 0.5 }}>{t.icon}</Text>
              <Text style={{ fontSize: 10, marginTop: 2, color: tab === t.id ? accent : colors.muted, fontWeight: tab === t.id ? '800' : '500' }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {showLegacy ? <LegacyScreen /> : cur ? <EventModal key={`${cur.pending.eventId}:${game.year}`} /> : null}
        {toast && !cur && !showLegacy ? <Toast key={toast.id} /> : null}
      </View>
    </SheetHost>
  );
}
