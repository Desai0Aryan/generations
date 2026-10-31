import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Card, Row, TimeDots } from '../components.tsx';
import { colors, fmtMoney, serif } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { actionStatus } from '../../engine/actions.ts';
import { ACTIONS, GROUP_INFO } from '../../content/actions.ts';
import { SLOTS_PER_YEAR, type ActionGroup } from '../../engine/types.ts';
import { useSheets } from '../sheets.tsx';
import { Gradient } from '../art.tsx';
import { tap } from '../fx.ts';

const ORDER: ActionGroup[] = ['love', 'social', 'school', 'career', 'sports', 'money', 'health', 'family', 'life'];
const HIDE = (r?: string) => !r || r === 'Not available right now' || r.startsWith('Age ') || r === 'Too late for this';

export function DoTab() {
  const { game, perform } = useGame();
  const { open } = useSheets();
  const [openGroup, setOpenGroup] = useState<ActionGroup | null>('career');
  if (!game) return null;
  const ch = game.character;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <View>
          <Text style={{ color: colors.text, fontFamily: serif, fontSize: 26 }}>What will you do?</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>Free time this year</Text>
        </View>
        <TimeDots left={game.actionsLeft} total={SLOTS_PER_YEAR} />
      </View>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
        Everything here is your choice. Spend free time on people, skills and ambitions, then age up when you are ready.
      </Text>

      {ch.age >= 14 ? (
        <View style={{ marginBottom: 14, borderRadius: 16, overflow: 'hidden' }}>
          <Gradient stops={['#2B3A55', '#5C7BA6']} style={{ padding: 16 }}>
            <Text style={{ color: '#FFFFFF', fontFamily: serif, fontSize: 20 }}>💼 Job board</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 3, marginBottom: 12 }}>
              {ch.job && !ch.retired ? `${ch.job.title} · ${fmtMoney(ch.job.salary)}/yr` : 'Browse careers, check requirements, and apply.'}
            </Text>
            <Text onPress={() => { tap(); open({ t: 'jobs' }); }} style={{ alignSelf: 'flex-start', backgroundColor: '#FFFFFF', color: '#14213A', fontWeight: '800', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, overflow: 'hidden' }}>
              Open job board
            </Text>
          </Gradient>
        </View>
      ) : null}

      {ORDER.map((g) => {
        const info = GROUP_INFO[g];
        const items = ACTIONS.filter((a) => a.group === g && !a.target)
          .map((a) => ({ a, st: actionStatus(game, a) }))
          .filter(({ st }) => HIDE(st.reason) ? st.ok : true);
        if (items.length === 0) return null;
        const avail = items.filter((x) => x.st.ok).length;
        const isOpen = openGroup === g;
        return (
          <View key={g} style={{ marginBottom: 10 }}>
            <Card style={{ padding: 0, overflow: 'hidden', borderColor: isOpen ? colors.gold : colors.border }}>
              <Pressable onPress={() => { tap(); setOpenGroup(isOpen ? null : g); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                <Text style={{ fontSize: 26, marginRight: 12 }}>{info.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{info.label}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{info.blurb}</Text>
                </View>
                <Text style={{ color: avail ? colors.good : colors.muted, fontSize: 12, fontWeight: '700' }}>{avail} {isOpen ? '▾' : '▸'}</Text>
              </Pressable>
              {isOpen ? (
                <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
                  {items.map(({ a, st }) => (
                    <Row
                      key={a.id}
                      icon={a.icon}
                      title={a.label}
                      sub={st.ok ? a.hint : st.reason}
                      tone={st.ok ? undefined : 'danger'}
                      disabled={!st.ok}
                      right={st.ok && a.time === 0 ? <Text style={{ color: colors.good, fontSize: 11, fontWeight: '700' }}>FREE</Text> : undefined}
                      onPress={() => {
                        if (a.choices.length === 1) perform(a.id, 0);
                        else open({ t: 'action', actionId: a.id });
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </Card>
          </View>
        );
      })}
    </ScrollView>
  );
}
