import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Pill } from '../components.tsx';
import { Portrait, Scene } from '../art.tsx';
import { colors, fmtMoney, serif } from '../theme.ts';
import { getHeirs } from '../../engine/lifecycle.ts';
import { EDU_LABELS } from '../../engine/types.ts';
import { useGame } from '../../store/GameContext.tsx';
import { useEntrance } from '../fx.ts';

/** Shown when your character dies: a life summary, then the choice to continue the bloodline. */
export function LegacyScreen() {
  const { game, continueAs, leaveGame, accent } = useGame();
  const p = useEntrance(600);
  if (!game) return null;
  const life = game.family.lineage[game.family.lineage.length - 1];
  const heirs = getHeirs(game);
  if (!life) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, opacity: p }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View>
          <Scene stage="elder" height={190} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: -34, alignItems: 'center' }}>
            <Portrait name={life.name} age={life.ageAtDeath} gender={life.gender} size={96} ring={colors.gold} />
          </View>
        </View>
        <View style={{ padding: 20, paddingTop: 46, alignItems: 'center' }}>
          <Pill text={`Generation ${game.family.generation}`} color={colors.gold} />
          <Text style={{ color: colors.text, fontFamily: serif, fontSize: 30, marginTop: 10, textAlign: 'center' }}>{life.name}</Text>
          <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 18, textAlign: 'center' }}>
            {life.birthYear} – {life.deathYear} · died at {life.ageAtDeath} from {life.cause}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <Card style={{ marginBottom: 14 }}>
            <Row k="Legacy score" v={String(life.legacyScore)} color={colors.gold} />
            <Row k="Career" v={life.finalJob} />
            <Row k="Education" v={EDU_LABELS[life.education]} />
            <Row k="Peak wealth" v={fmtMoney(life.peakMoney)} />
            {life.netWorth !== undefined ? <Row k="Estate at death" v={fmtMoney(life.netWorth)} /> : null}
            <Row k="Reputation" v={String(life.reputation)} />
            <Row k="Children" v={String(life.childrenCount)} last />
          </Card>

          {life.highlights.length > 0 ? (
            <Card style={{ marginBottom: 18 }}>
              <Text style={{ color: colors.gold, fontFamily: serif, fontSize: 18, marginBottom: 8 }}>Remembered for</Text>
              {life.highlights.map((h, i) => <Text key={i} style={{ color: colors.text, marginBottom: 6, lineHeight: 20 }}>• {h}</Text>)}
            </Card>
          ) : null}

          {heirs.length > 0 ? (
            <View>
              <Text style={{ color: colors.text, fontFamily: serif, fontSize: 22, marginBottom: 4 }}>The bloodline continues</Text>
              <Text style={{ color: colors.muted, marginBottom: 12 }}>Choose who carries the family name forward. They inherit the family home, any heirlooms, part of your savings and your reputation.</Text>
              {heirs.map((h) => (
                <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Portrait name={h.name} age={h.age} size={56} ring={accent} />
                  <Button label={`Continue as ${h.name.split(' ')[0]}`} sub={`Age ${h.age}`} onPress={() => continueAs(h.id)} style={{ flex: 1, marginLeft: 12 }} />
                </View>
              ))}
            </View>
          ) : (
            <View>
              <Text style={{ color: colors.text, fontFamily: serif, fontSize: 22, marginBottom: 4 }}>The line ends here</Text>
              <Text style={{ color: colors.muted, marginBottom: 12 }}>There are no heirs. Your story was complete. Start a new family and try a different path.</Text>
            </View>
          )}
          <Button label="Leave to main menu" variant="ghost" onPress={leaveGame} style={{ marginTop: 8 }} />
        </View>
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
