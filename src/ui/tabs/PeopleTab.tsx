import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, SectionTitle, TimeDots } from '../components.tsx';
import { Portrait } from '../art.tsx';
import { colors } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { labelFor } from '../../engine/lifecycle.ts';
import { SLOTS_PER_YEAR, type Relationship } from '../../engine/types.ts';
import { useSheets } from '../sheets.tsx';

const GROUPS: { title: string; kinds: Relationship['kind'][] }[] = [
  { title: 'Love life', kinds: ['partner', 'fling'] },
  { title: 'Family', kinds: ['parent', 'sibling', 'child'] },
  { title: 'Friends & allies', kinds: ['friend', 'mentor', 'coworker'] },
  { title: 'Past & rivals', kinds: ['ex', 'rival'] },
];

export function PeopleTab() {
  const { game, interact } = useGame();
  const { open } = useSheets();
  if (!game) return null;
  const left = game.actionsLeft;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.muted, flex: 1, marginRight: 10 }}>Bonds fade if you neglect them. Tap “Do more” to date, ask for help, propose, and more.</Text>
        <TimeDots left={left} total={SLOTS_PER_YEAR} />
      </View>
      {game.relationships.length === 0 ? <Text style={{ color: colors.muted, marginTop: 20 }}>No one yet. Try making friends from the Do tab.</Text> : null}
      {GROUPS.map((grp) => {
        const people = game.relationships.filter((r) => grp.kinds.includes(r.kind));
        if (people.length === 0) return null;
        return (
          <View key={grp.title}>
            <SectionTitle>{grp.title}</SectionTitle>
            {people.map((r) => (
              <Card key={r.id} style={{ marginBottom: 10, opacity: r.alive ? 1 : 0.5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Portrait name={r.name} age={r.age} size={52} ring={r.kind === 'rival' ? colors.danger : r.kind === 'partner' ? '#F08BB5' : undefined} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{r.name}{r.alive ? '' : ' †'}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {r.kind === 'partner' && game.character.flags.married ? 'spouse' : labelFor(r.kind)} · age {r.age}{r.alive ? '' : ' · passed away'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>{r.closeness}</Text>
                </View>
                <View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.max(2, r.closeness)}%`, height: 6, backgroundColor: r.kind === 'rival' ? colors.danger : '#F08BB5', borderRadius: 3 }} />
                </View>
                {r.alive ? (
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <Button small variant="ghost" label="Spend time" disabled={left <= 0} onPress={() => interact(r.id, 'time')} style={{ flex: 1, marginRight: 6 }} />
                    <Button small label="Do more" onPress={() => open({ t: 'person', relId: r.id })} style={{ flex: 1 }} />
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
