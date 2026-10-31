import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '../components.tsx';
import { colors, radius } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import type { FeedEntry } from '../../engine/types.ts';

const KIND_COLOR: Record<FeedEntry['kind'], string> = {
  event: colors.border,
  system: colors.surface2,
  milestone: colors.gold,
  death: colors.danger,
  choice: '#4FD1B5',
};

export function LifeTab() {
  const { game, ageUp } = useGame();
  if (!game) return null;
  const blocked = game.queue.length > 0 || game.phase !== 'alive';
  const rows = [...game.feed].reverse();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {rows.map((f, i) => {
          const header = i === 0 || rows[i - 1].age !== f.age;
          return (
            <View key={f.id}>
              {header ? (
                <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '800', letterSpacing: 1, marginTop: i === 0 ? 0 : 14, marginBottom: 8 }}>
                  AGE {f.age} · {f.year}
                </Text>
              ) : null}
              <View style={{ backgroundColor: colors.surface, borderRadius: radius.sm, borderLeftWidth: 3, borderLeftColor: KIND_COLOR[f.kind], paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 }}>
                <Text style={{ color: f.kind === 'system' ? colors.muted : colors.text, fontSize: 15, lineHeight: 22 }}>{f.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }}>
        <Button
          label={`Age Up  →  ${game.character.age + 1}`}
          sub={blocked ? 'Resolve the current event first' : 'Another year passes'}
          disabled={blocked}
          onPress={ageUp}
        />
      </View>
    </View>
  );
}
