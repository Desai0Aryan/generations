import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '../components.tsx';
import { colors, radius, serif } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import type { FeedEntry, GameState } from '../../engine/types.ts';
import { CAT_STYLE, Portrait, Scene, STAGE_LABEL, stageOf } from '../art.tsx';
import { TIER_INFO } from '../../content/education.ts';
import { tap, useTween } from '../fx.ts';

function stageLine(g: GameState): string {
  const ch = g.character;
  const a = ch.age;
  if (ch.school) return `${TIER_INFO[ch.school.tier].label} · year ${Math.min(ch.school.years + 1, ch.school.length)} of ${ch.school.length}`;
  if (ch.job) return ch.retired ? `Retired ${ch.job.title}` : ch.job.title;
  if (a < 1) return 'Newborn';
  if (a < 5) return 'Toddler';
  if (a < 12) return 'Elementary school';
  if (a < 15) return 'Middle school';
  if (a < 18) return 'High school';
  return 'Finding the next step';
}

const MINI: { k: 'health' | 'happiness' | 'smarts' | 'looks' | 'reputation'; icon: string; color: string }[] = [
  { k: 'health', icon: '❤️', color: '#5BD38A' },
  { k: 'happiness', icon: '😊', color: '#F4C95D' },
  { k: 'smarts', icon: '🧠', color: '#9B7BF0' },
  { k: 'looks', icon: '✨', color: '#F08BB5' },
  { k: 'reputation', icon: '🌟', color: '#5AA9F0' },
];

function Mini({ icon, value, color }: { icon: string; value: number; color: string }) {
  const v = useTween(value, 700);
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginVertical: 2 }}>{Math.round(v)}</Text>
      <View style={{ width: '70%', height: 4, backgroundColor: colors.surface2, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(3, v)}%`, height: 4, backgroundColor: color }} />
      </View>
    </View>
  );
}

export function LifeTab() {
  const { game, ageUp } = useGame();
  if (!game) return null;
  const ch = game.character;
  const blocked = game.queue.length > 0 || game.phase !== 'alive';
  const rows = [...game.feed].reverse();
  const stage = stageOf(ch.age);
  const name = `${ch.firstName} ${ch.lastName}`;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
          <Scene stage={stage} height={140} />
          <View style={{ position: 'absolute', left: 14, bottom: 12, right: 14, flexDirection: 'row', alignItems: 'flex-end' }}>
            <Portrait name={name} age={ch.age} gender={ch.gender} size={88} ring={colors.gold} />
            <View style={{ flex: 1, marginLeft: 12, marginBottom: 4, backgroundColor: 'rgba(8,12,24,0.66)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: serif, fontSize: 19 }}>{name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>{STAGE_LABEL[stage]} · {stageLine(game)}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, marginBottom: 16 }}>
          {MINI.map((m) => <Mini key={m.k} icon={m.icon} value={ch.stats[m.k]} color={m.color} />)}
        </View>

        {rows.map((f, i) => {
          const header = i === 0 || rows[i - 1].age !== f.age;
          const cat = f.cat ? CAT_STYLE[f.cat] : undefined;
          const accent = f.kind === 'death' ? colors.danger : f.kind === 'milestone' ? colors.gold : cat ? cat.stops[1] : colors.border;
          return (
            <View key={f.id}>
              {header ? (
                <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '800', letterSpacing: 1, marginTop: i === 0 ? 0 : 14, marginBottom: 8 }}>AGE {f.age} · {f.year}</Text>
              ) : null}
              <View style={{ flexDirection: 'row', backgroundColor: f.kind === 'milestone' ? 'rgba(224,184,102,0.08)' : colors.surface, borderRadius: radius.sm, borderLeftWidth: 3, borderLeftColor: accent, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 }}>
                {cat ? <Text style={{ fontSize: 16, marginRight: 10, marginTop: 1 }}>{cat.emoji}</Text> : null}
                <Text style={{ flex: 1, color: f.kind === 'system' ? colors.muted : colors.text, fontSize: 15, lineHeight: 22 }}>{f.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }}>
        <Button
          label={`Age Up  →  ${ch.age + 1}`}
          sub={blocked ? 'Resolve the current event first' : game.legal.prison ? `${game.legal.prison.yearsLeft} year(s) left inside` : 'Do as much as you like this year first'}
          disabled={blocked}
          onPress={ageUp}
        />
      </View>
    </View>
  );
}
export type { FeedEntry };
void tap;
