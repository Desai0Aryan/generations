import React, { useEffect } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { Banner } from '../art.tsx';
import { colors, fmtMoney, radius, serif, statColors } from '../theme.ts';
import { choiceViews, currentEvent } from '../../engine/lifecycle.ts';
import { fill } from '../../engine/text.ts';
import { useGame } from '../../store/GameContext.tsx';
import type { StatKey } from '../../engine/types.ts';
import { success, tap, useEntrance, warning } from '../fx.ts';

function DeltaPill({ label, amount, delay }: { label: string; amount: number; delay: number }) {
  const p = useEntrance(320, delay, true);
  const key = label.toLowerCase() as StatKey;
  const good = amount > 0;
  const shown = label === 'Money' ? (good ? '+' : '') + fmtMoney(amount) : (good ? '+' : '') + amount;
  return (
    <View style={{ marginRight: 8, marginBottom: 8, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: good ? colors.good : colors.danger, backgroundColor: colors.bg, opacity: Math.min(1, p), transform: [{ scale: 0.6 + 0.4 * p }] }}>
      <Text style={{ color: statColors[key] ?? colors.text, fontSize: 12, fontWeight: '700' }}>
        {label} <Text style={{ color: good ? colors.good : colors.danger }}>{shown}</Text>
      </Text>
    </View>
  );
}

export function EventModal() {
  const { game, choose, dismiss, accent } = useGame();
  const cur = game ? currentEvent(game) : null;
  const stage = cur?.pending.stage;
  const deltas = cur?.pending.deltas;
  useEffect(() => {
    if (stage !== 'result' || !deltas) return;
    const net = deltas.reduce((a, d) => a + (d.label === 'Money' ? Math.sign(d.amount) : d.amount), 0);
    if (net < 0) warning(); else success();
  }, [stage, cur?.pending.resultText]);
  const p = useEntrance(340);
  if (!game || !cur) return null;
  const { pending, ev, target } = cur;
  const title = fill(game, ev.title, target);
  const text = fill(game, pending.stage === 'result' ? pending.resultText ?? '' : ev.text, target);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: `rgba(5,9,18,${0.86 * Math.min(1, p * 1.4)})`, justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.border, maxHeight: '90%', overflow: 'hidden', transform: [{ translateY: (1 - p) * 70 }], opacity: Math.min(1, p * 1.5) }}>
        <Banner cat={ev.category} height={88} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 28 }}>
          <Text style={{ color: accent, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>{ev.category.toUpperCase()} · AGE {game.character.age}</Text>
          <Text style={{ color: colors.text, fontFamily: serif, fontSize: 24, marginBottom: 10 }}>{title}</Text>
          <View style={{ backgroundColor: colors.bg, borderRadius: radius.md, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>{text}</Text>
          </View>

          {pending.stage === 'choose' ? (
            choiceViews(game, ev).map((v) => (
              <Pressable
                key={v.index}
                disabled={!v.enabled}
                onPress={() => { tap(); choose(v.index); }}
                style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : '#172238', borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, opacity: v.enabled ? 1 : 0.4 })}
              >
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{fill(game, v.choice.label, target)}</Text>
                {v.choice.hint || v.reason ? <Text style={{ color: v.enabled ? colors.muted : colors.danger, fontSize: 12, marginTop: 3 }}>{v.reason ?? v.choice.hint}</Text> : null}
              </Pressable>
            ))
          ) : (
            <View>
              {pending.deltas && pending.deltas.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
                  {pending.deltas.map((d, i) => <DeltaPill key={i} label={d.label} amount={d.amount} delay={120 + i * 90} />)}
                </View>
              ) : null}
              <Pressable onPress={() => { tap(); dismiss(); }} style={{ backgroundColor: accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#07101C', fontWeight: '800', fontSize: 16 }}>Continue</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
