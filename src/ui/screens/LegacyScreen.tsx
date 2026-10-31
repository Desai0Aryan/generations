import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Pill } from '../components.tsx';
import { colors, fmtMoney, serif } from '../theme.ts';
import { getHeirs } from '../../engine/lifecycle.ts';
import { EDU_LABELS } from '../../engine/types.ts';
import { useGame } from '../../store/GameContext.tsx';

/** Shown when your character dies: a life summary, then the choice to continue the bloodline. */
export function LegacyScreen() {
  const { game, continueAs, leaveGame, accent } = useGame();
  if (!game) return null;
  const life = game.family.lineage[game.family.lineage.length - 1];
  const heirs = getHeirs(game);
  if (!life) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}>
        <Pill text={`Generation ${game.family.generation}`} color={colors.gold} />
        <Text style={{ color: colors.text, fontFamily: serif, fontSize: 32, marginTop: 12 }}>{life.name}</Text>
        <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 18 }}>
          {life.birthYear} – {life.deathYear} · died at {life.ageAtDeath} from {life.cause}
        </Text>

        <Card style={{ marginBottom: 14 }}>
          <Row k="Legacy score" v={String(life.legacyScore)} color={colors.gold} />
          <Row k="Career" v={life.finalJob} />
          <Row k="Education" v={EDU_LABELS[life.education]} />
          <Row k="Peak wealth" v={fmtMoney(life.peakMoney)} />
          <Row k="Reputation" v={String(life.reputation)} />
          <Row k="Children" v={String(life.childrenCount)} last />
        </Card>

        {life.highlights.length > 0 ? (
          <Card style={{ marginBottom: 18 }}>
            <Text style={{ color: colors.gold, fontFamily: serif, fontSize: 18, marginBottom: 8 }}>Remembered for</Text>
            {life.highlights.map((h, i) => (
              <Text key={i} style={{ color: colors.text, marginBottom: 6, lineHeight: 20 }}>• {h}</Text>
            ))}
          </Card>
        ) : null}

        {heirs.length > 0 ? (
          <View>
            <Text style={{ color: colors.text, fontFamily: serif, fontSize: 22, marginBottom: 4 }}>The bloodline continues</Text>
            <Text style={{ color: colors.muted, marginBottom: 12 }}>Choose who carries the family name forward. They inherit part of your estate and your reputation.</Text>
            {heirs.map((h) => (
              <Button key={h.id} label={`Continue as ${h.name.split(' ')[0]}`} sub={`Age ${h.age}`} icon="🌿" onPress={() => continueAs(h.id)} style={{ marginBottom: 10 }} />
            ))}
          </View>
        ) : (
          <View>
            <Text style={{ color: colors.text, fontFamily: serif, fontSize: 22, marginBottom: 4 }}>The line ends here</Text>
            <Text style={{ color: colors.muted, marginBottom: 12 }}>There are no heirs. Your story was complete. Start a new family and try a different path.</Text>
          </View>
        )}
        <Button label="Leave to main menu" variant="ghost" onPress={leaveGame} style={{ marginTop: 8 }} />
        <View style={{ height: 2, backgroundColor: accent, opacity: 0.4, marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}

function Row({ k, v, color, last }: { k: string; v: string; color?: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.muted }}>{k}</Text>
      <Text style={{ color: color ?? colors.text, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: 12 }}>{v}</Text>
    </View>
  );
}
