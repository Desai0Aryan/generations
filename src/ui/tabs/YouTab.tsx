import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, SectionTitle, StatBar } from '../components.tsx';
import { colors, fmtMoney, statColors } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { EDU_LABELS, STAT_KEYS, STAT_LABELS } from '../../engine/types.ts';
import { checkAll } from '../../engine/conditions.ts';
import { GOALS } from '../../content/goals.ts';

export function YouTab() {
  const { game } = useGame();
  if (!game) return null;
  const ch = game.character;
  const goals = GOALS.filter((g) => g.minAge <= ch.age + 3).map((g) => ({ g, done: checkAll(game, g.done, true) }));
  const open = goals.filter((x) => !x.done).slice(0, 4);
  const doneCount = goals.filter((x) => x.done).length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Card style={{ marginBottom: 16 }}>
        {STAT_KEYS.map((k) => <StatBar key={k} label={STAT_LABELS[k]} value={ch.stats[k]} color={statColors[k]} />)}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Line k="Money" v={fmtMoney(ch.money)} color={ch.money < 0 ? colors.danger : colors.text} />
        <Line k="Career" v={ch.job ? `${ch.job.title}${ch.retired ? ' (retired)' : ''}` : ch.flags.inCollege ? 'Student' : 'Not working'} />
        {ch.job ? <Line k="Salary" v={`${fmtMoney(ch.job.salary)} / yr`} /> : null}
        <Line k="Education" v={ch.flags.inCollege ? 'In college' : EDU_LABELS[ch.education]} />
        <Line k="Home" v={ch.flags.owns_home ? 'Homeowner' : 'Renting'} last />
      </Card>

      <SectionTitle>Current goals</SectionTitle>
      <Card>
        {open.length === 0 ? <Text style={{ color: colors.muted }}>You have achieved what life has asked of you so far. Keep living.</Text> : null}
        {open.map(({ g }) => (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.muted, marginRight: 12 }} />
            <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{g.label}</Text>
          </View>
        ))}
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{doneCount} goal{doneCount === 1 ? '' : 's'} achieved</Text>
      </Card>
    </ScrollView>
  );
}

function Line({ k, v, color, last }: { k: string; v: string; color?: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.muted }}>{k}</Text>
      <Text style={{ color: color ?? colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 12 }}>{v}</Text>
    </View>
  );
}
