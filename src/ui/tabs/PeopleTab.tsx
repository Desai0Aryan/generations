import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar, Card, SectionTitle } from '../components.tsx';
import { colors, radius } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { labelFor } from '../../engine/lifecycle.ts';
import type { Relationship } from '../../engine/types.ts';

const GROUPS: { title: string; kinds: Relationship['kind'][] }[] = [
  { title: 'Family', kinds: ['parent', 'sibling', 'child'] },
  { title: 'Partner', kinds: ['partner'] },
  { title: 'Friends & allies', kinds: ['friend', 'mentor', 'coworker'] },
  { title: 'Past & rivals', kinds: ['ex', 'rival'] },
];

export function PeopleTab() {
  const { game, interact, accent } = useGame();
  if (!game) return null;
  const left = game.actionsLeft;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Text style={{ color: colors.muted, marginBottom: 6 }}>
        Relationships fade if you neglect them. You can spend time with <Text style={{ color: accent, fontWeight: '700' }}>{left}</Text> {left === 1 ? 'person' : 'people'} this year.
      </Text>
      {GROUPS.map((grp) => {
        const people = game.relationships.filter((r) => grp.kinds.includes(r.kind));
        if (people.length === 0) return null;
        return (
          <View key={grp.title}>
            <SectionTitle>{grp.title}</SectionTitle>
            {people.map((r) => (
              <Card key={r.id} style={{ marginBottom: 10, opacity: r.alive ? 1 : 0.5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar name={r.name} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{r.name}{r.alive ? '' : ' †'}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>{labelFor(r.kind)} · age {r.age}{r.alive ? '' : ' · passed away'}</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>{r.closeness}</Text>
                </View>
                <View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.max(2, r.closeness)}%`, height: 6, backgroundColor: r.kind === 'rival' ? colors.danger : '#F08BB5', borderRadius: 3 }} />
                </View>
                {r.alive ? (
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <Act label="Spend time" on={() => interact(r.id, 'time')} off={left <= 0} />
                    <Act label="Check in" on={() => interact(r.id, 'call')} off={left <= 0} />
                    <Act label="Gift $50" on={() => interact(r.id, 'gift')} off={left <= 0 || game.character.money < 50} />
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function Act({ label, on, off }: { label: string; on: () => void; off: boolean }) {
  return (
    <Pressable
      disabled={off}
      onPress={on}
      style={({ pressed }) => ({ flex: 1, marginRight: 6, paddingVertical: 9, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: pressed ? colors.surface2 : colors.bg, opacity: off ? 0.35 : 1 })}
    >
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
