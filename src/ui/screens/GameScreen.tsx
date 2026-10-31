import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components.tsx';
import { colors, fmtMoney } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { LifeTab } from '../tabs/LifeTab.tsx';
import { YouTab } from '../tabs/YouTab.tsx';
import { PeopleTab } from '../tabs/PeopleTab.tsx';
import { LegacyTab } from '../tabs/LegacyTab.tsx';
import { ShopTab } from '../tabs/ShopTab.tsx';
import { EventModal } from './EventModal.tsx';
import { LegacyScreen } from './LegacyScreen.tsx';

const TABS = [
  { id: 'life', icon: '🌿', label: 'Life' },
  { id: 'you', icon: '📊', label: 'You' },
  { id: 'people', icon: '👥', label: 'People' },
  { id: 'legacy', icon: '📜', label: 'Legacy' },
  { id: 'shop', icon: '🛍️', label: 'Shop' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function GameScreen() {
  const { game, accent, leaveGame } = useGame();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>('life');
  if (!game) return null;
  const ch = game.character;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center' }}>
        <Avatar name={`${ch.firstName} ${ch.lastName}`} size={42} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{ch.firstName} {ch.lastName}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Age {ch.age} · {game.year} · Gen {game.family.generation}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: ch.money < 0 ? colors.danger : colors.gold, fontWeight: '800', fontSize: 16 }}>{fmtMoney(ch.money)}</Text>
          <Text onPress={leaveGame} style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>Menu</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'life' ? <LifeTab /> : null}
        {tab === 'you' ? <YouTab /> : null}
        {tab === 'people' ? <PeopleTab /> : null}
        {tab === 'legacy' ? <LegacyTab /> : null}
        {tab === 'shop' ? <ShopTab /> : null}
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: insets.bottom }}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)} style={{ flex: 1, alignItems: 'center', paddingVertical: 9 }}>
            <Text style={{ fontSize: 19, opacity: tab === t.id ? 1 : 0.5 }}>{t.icon}</Text>
            <Text style={{ fontSize: 11, marginTop: 2, color: tab === t.id ? accent : colors.muted, fontWeight: tab === t.id ? '800' : '500' }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {game.phase === 'dead' && game.queue.length === 0 ? <LegacyScreen /> : <EventModal />}
    </View>
  );
}
