import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Pill, SectionTitle, StatBar } from '../components.tsx';
import { Portrait } from '../art.tsx';
import { useSheets } from '../sheets.tsx';
import { SPORT_BY_ID, levelName } from '../../content/sports.ts';
import { styleScore } from '../../content/wardrobe.ts';
import { colors, fmtMoney, statColors } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { EDU_LABELS, SKILL_KEYS, SKILL_LABELS, STAT_KEYS, STAT_LABELS } from '../../engine/types.ts';
import { checkAll } from '../../engine/conditions.ts';
import { GOALS } from '../../content/goals.ts';
import { TIER_INFO } from '../../content/education.ts';
import { FIELD_BY_ID } from '../../content/jobs.ts';

const SKILL_COLOR = { athletics: '#F0A35E', creativity: '#E86FD0', tech: '#5ED1E8', charisma: '#F4C95D' } as const;

export function YouTab() {
  const { game } = useGame();
  const { open: openSheet } = useSheets();
  if (!game) return null;
  const L = game.legal;
  const ch = game.character;
  const goals = GOALS.filter((g) => g.minAge <= ch.age + 3).map((g) => ({ g, done: checkAll(game, g.done, true) }));
  const open = goals.filter((x) => !x.done).slice(0, 4);
  const doneCount = goals.filter((x) => x.done).length;
  const field = ch.job?.field ? FIELD_BY_ID[ch.job.field] : undefined;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Card style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
        <Portrait name={`${ch.firstName} ${ch.lastName}`} age={ch.age} gender={ch.gender} size={84} ring={colors.gold} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{ch.firstName} {ch.lastName}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>Style {styleScore(game.wardrobe.outfit)}/100 · {game.wardrobe.owned.length} items owned</Text>
          <Button small label="👗 Closet & salon" onPress={() => openSheet({ t: 'closet' })} />
        </View>
      </Card>
      <Card style={{ marginBottom: 14 }}>
        {STAT_KEYS.map((k) => <StatBar key={k} label={STAT_LABELS[k]} value={ch.stats[k]} color={statColors[k]} />)}
      </Card>

      {(ch.sports ?? []).length > 0 ? (
        <View>
          <SectionTitle>Sports</SectionTitle>
          <Card style={{ marginBottom: 14 }}>
            {(ch.sports ?? []).map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 24, marginRight: 10 }}>{SPORT_BY_ID[e.id].icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{SPORT_BY_ID[e.id].label} · {e.pos}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{levelName(e.level, e.id)} · {e.years} season{e.years === 1 ? '' : 's'}{e.titles ? ` · ${e.titles} title${e.titles > 1 ? 's' : ''}` : ''}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {L.heat > 0 || L.record.length > 0 || L.uncaught.length > 0 || L.prison || L.probation ? (
        <View>
          <SectionTitle>Legal</SectionTitle>
          <Card style={{ marginBottom: 14, borderColor: L.prison ? colors.danger : colors.border }}>
            {L.prison ? <Text style={{ color: colors.danger, fontWeight: '800', marginBottom: 6 }}>⛓️ In {L.prison.facility}: {L.prison.yearsLeft} of {L.prison.total} years left</Text> : null}
            {L.fugitive ? <Text style={{ color: colors.danger, fontWeight: '800', marginBottom: 6 }}>🚨 You are a fugitive</Text> : null}
            {L.probation ? <Text style={{ color: '#E0B866', fontWeight: '700', marginBottom: 6 }}>On probation: {L.probation} year{L.probation > 1 ? 's' : ''} left</Text> : null}
            <StatBar label="Heat (police attention)" value={L.heat} color={L.heat > 50 ? colors.danger : '#E0B866'} thin />
            <StatBar label="Street reputation" value={L.underworld} color="#8B7BF0" thin />
            {L.record.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>Criminal record</Text>
                {L.record.slice(-6).map((r, i) => <Text key={i} style={{ color: colors.text, fontSize: 13, marginBottom: 2 }}>• {r.label} ({r.year}): {r.outcome}</Text>)}
              </View>
            ) : <Text style={{ color: colors.good, fontSize: 12, marginTop: 6 }}>Clean record</Text>}
            {L.uncaught.length > 0 ? <Text style={{ color: colors.muted, fontSize: 11, marginTop: 8, fontStyle: 'italic' }}>You carry {L.uncaught.length} secret{L.uncaught.length > 1 ? 's' : ''}. They can resurface at any time.</Text> : null}
          </Card>
        </View>
      ) : null}

      <SectionTitle>Skills</SectionTitle>
      <Card style={{ marginBottom: 14 }}>
        {SKILL_KEYS.map((k) => <StatBar key={k} thin label={SKILL_LABELS[k]} value={ch.skills[k]} color={SKILL_COLOR[k]} />)}
        <Text style={{ color: colors.muted, fontSize: 12 }}>Train skills from the Do tab. They unlock careers and fade if neglected.</Text>
      </Card>

      {ch.school ? (
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ color: colors.gold, fontWeight: '800', marginBottom: 4 }}>{TIER_INFO[ch.school.tier].label}{ch.school.kind === 'grad' ? ' · graduate' : ''}</Text>
          <Line k="Year" v={`${Math.min(ch.school.years + 1, ch.school.length)} of ${ch.school.length}`} />
          <Line k="Major" v={ch.major ?? 'Undeclared'} />
          <Line k="GPA" v={ch.school.gpa.toFixed(2)} />
          <Line k="Tuition" v={`${fmtMoney(ch.school.tuition)} / yr`} last />
        </Card>
      ) : null}

      <Card style={{ marginBottom: 16 }}>
        <Line k="Money" v={fmtMoney(ch.money)} color={ch.money < 0 ? colors.danger : colors.text} />
        <Line k="Career" v={ch.job ? `${ch.job.title}${ch.retired ? ' (retired)' : ''}` : ch.school ? 'Student' : 'Not working'} />
        {ch.job ? <Line k="Salary" v={`${fmtMoney(ch.job.salary)} / yr`} /> : null}
        {ch.job && !ch.retired ? <Line k="Performance" v={`${ch.job.perf ?? 50}${field ? ` · level ${(ch.job.level ?? 0) + 1}/${field.ladder.length}` : ''}`} /> : null}
        <Line k="Education" v={ch.school ? 'In school' : EDU_LABELS[ch.education]} />
        {ch.major && !ch.school ? <Line k="Studied" v={ch.major} /> : null}
        <Line k="Home" v={ch.flags.owns_home ? 'Homeowner' : ch.flags.moved_out || ch.age >= 22 ? 'Renting' : 'With family'} last />
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
