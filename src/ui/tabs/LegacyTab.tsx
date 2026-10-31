import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, Pill, SectionTitle, StatBar } from '../components.tsx';
import { colors, fmtMoney, serif } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';

export function LegacyTab() {
  const { game, accent } = useGame();
  if (!game) return null;
  const fam = game.family;
  const mems = [...game.memories].reverse();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Card style={{ marginBottom: 16, borderColor: colors.gold }}>
        <Text style={{ color: colors.gold, fontFamily: serif, fontSize: 26 }}>House {fam.surname}</Text>
        <Text style={{ color: colors.muted, marginBottom: 14 }}>Generation {fam.generation} · {fam.lineage.length} {fam.lineage.length === 1 ? 'life' : 'lives'} remembered</Text>
        <StatBar label="Family reputation" value={Math.round(fam.familyReputation)} color={colors.gold} />
        <Text style={{ color: colors.muted, fontSize: 12 }}>Your family name's reputation is inherited by every heir. Build it well.</Text>
      </Card>

      {fam.lineage.length > 0 ? (
        <View>
          <SectionTitle>Ancestors</SectionTitle>
          {fam.lineage.map((l, i) => (
            <Card key={i} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{l.name}</Text>
                <Pill text={`Score ${l.legacyScore}`} color={colors.gold} />
              </View>
              <Text style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>{l.birthYear}–{l.deathYear} · {l.ageAtDeath} years · {l.finalJob} · peak {fmtMoney(l.peakMoney)}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <SectionTitle>Memories</SectionTitle>
      {mems.length === 0 ? <Text style={{ color: colors.muted }}>Nothing yet. Live a little.</Text> : null}
      {mems.map((m) => (
        <View key={m.id} style={{ borderLeftWidth: 3, borderLeftColor: m.weight >= 3 ? colors.gold : accent, backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 3 }}>AGE {m.age} · {m.year}</Text>
          <Text style={{ color: colors.text, lineHeight: 21 }}>{m.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
