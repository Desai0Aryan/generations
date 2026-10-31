import React from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { Pill } from '../components.tsx';
import { colors, fmtMoney, radius, serif, statColors } from '../theme.ts';
import { choiceViews, currentEvent } from '../../engine/lifecycle.ts';
import { fill } from '../../engine/text.ts';
import { useGame } from '../../store/GameContext.tsx';
import type { StatKey } from '../../engine/types.ts';

export function EventModal() {
  const { game, choose, dismiss, accent } = useGame();
  if (!game) return null;
  const cur = currentEvent(game);
  if (!cur) return null;
  const { pending, ev, target } = cur;
  const title = fill(game, ev.title, target);
  const text = fill(game, pending.stage === 'result' ? pending.resultText ?? '' : ev.text, target);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.border, maxHeight: '88%', paddingTop: 18 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Pill text={`${ev.category} · age ${game.character.age}`} color={accent} />
          </View>
          <Text style={{ color: colors.text, fontFamily: serif, fontSize: 24, marginBottom: 10 }}>{title}</Text>
          <View style={{ backgroundColor: colors.bg, borderRadius: radius.md, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>{text}</Text>
          </View>

          {pending.stage === 'choose' ? (
            choiceViews(game, ev).map((v) => (
              <Pressable
                key={v.index}
                disabled={!v.enabled}
                onPress={() => choose(v.index)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.surface2 : '#172238', borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 16,
                  marginBottom: 10, borderWidth: 1, borderColor: colors.border, opacity: v.enabled ? 1 : 0.4,
                })}
              >
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{fill(game, v.choice.label, target)}</Text>
                {v.choice.hint || v.reason ? (
                  <Text style={{ color: v.enabled ? colors.muted : colors.danger, fontSize: 12, marginTop: 3 }}>{v.reason ?? v.choice.hint}</Text>
                ) : null}
              </Pressable>
            ))
          ) : (
            <View>
              {pending.deltas && pending.deltas.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                  {pending.deltas.map((d, i) => {
                    const key = d.label.toLowerCase() as StatKey;
                    const good = d.amount > 0;
                    return (
                      <View key={i} style={{ marginRight: 8, marginBottom: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: good ? colors.good : colors.danger, backgroundColor: colors.bg }}>
                        <Text style={{ color: statColors[key] ?? colors.text, fontSize: 12, fontWeight: '700' }}>
                          {d.label} <Text style={{ color: good ? colors.good : colors.danger }}>{d.label === 'Money' ? (good ? '+' : '') + fmtMoney(d.amount) : (good ? '+' : '') + d.amount}</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}
              <Pressable onPress={dismiss} style={{ backgroundColor: accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#07101C', fontWeight: '800', fontSize: 16 }}>Continue</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
