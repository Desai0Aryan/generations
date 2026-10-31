import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, Pill, SectionTitle, StatBar } from '../components.tsx';
import { Portrait } from '../art.tsx';
import { colors, fmtMoney, serif } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { ACHIEVEMENTS } from '../../content/achievements.ts';

const CITY: Record<string, string> = { lisbon: 'Lisbon', kyoto: 'Kyoto', marrakech: 'Marrakech', reykjavik: 'Reykjavik' };

function Node({ name, age, sub, ring, size = 54, dim }: { name: string; age: number; sub?: string; ring?: string; size?: number; dim?: boolean }) {
  return (
    <View style={{ alignItems: 'center', width: 92, opacity: dim ? 0.85 : 1 }}>
      <Portrait name={name} age={age} size={size} ring={ring ?? colors.border} />
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 5, textAlign: 'center' }}>{name.split(' ')[0]}</Text>
      {sub ? <Text style={{ color: colors.muted, fontSize: 10, textAlign: 'center' }}>{sub}</Text> : null}
    </View>
  );
}
const Line = ({ h = 18 }: { h?: number }) => <View style={{ width: 2, height: h, backgroundColor: colors.border, alignSelf: 'center' }} />;

export function LegacyTab() {
  const { game, meta, accent } = useGame();
  if (!game) return null;
  const fam = game.family;
  const ch = game.character;
  const you = `${ch.firstName} ${ch.lastName}`;
  const partner = game.relationships.find((r) => r.kind === 'partner' && r.alive);
  const kids = game.relationships.filter((r) => r.kind === 'child');
  const mems = [...game.memories].reverse();
  const trips = Object.keys(ch.flags).filter((k) => k.startsWith('legacy_trip_')).map((k) => k.replace('legacy_trip_', ''));
  const heirlooms = game.assets.filter((a) => a.kind !== 'pet' && a.rate > 0);
  const unlocked = new Set(meta.achievements);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Card style={{ marginBottom: 16, borderColor: colors.gold }}>
        <Text style={{ color: colors.gold, fontFamily: serif, fontSize: 26 }}>House {fam.surname}</Text>
        <Text style={{ color: colors.muted, marginBottom: 14 }}>Generation {fam.generation} · {fam.lineage.length} {fam.lineage.length === 1 ? 'life' : 'lives'} remembered</Text>
        <StatBar label="Family reputation" value={Math.round(fam.familyReputation)} color={colors.gold} />
        <Text style={{ color: colors.muted, fontSize: 12 }}>Your family name's reputation is inherited by every heir. Build it well.</Text>
      </Card>

      <SectionTitle>Family tree</SectionTitle>
      <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 18 }}>
        {fam.lineage.map((l, i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <Node name={l.name} age={l.ageAtDeath} sub={`${l.birthYear}–${l.deathYear}`} ring={colors.gold} dim />
            <Text style={{ color: colors.gold, fontSize: 10, marginTop: 2 }}>score {l.legacyScore}</Text>
            <Line />
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Node name={you} age={ch.age} sub={`You · ${ch.age}`} ring={accent} size={64} />
          {partner ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginHorizontal: 2 }}>{ch.flags.married ? '💍' : '❤️'}</Text>
              <Node name={partner.name} age={partner.age} sub={ch.flags.married ? 'Spouse' : 'Partner'} ring="#F08BB5" />
            </View>
          ) : null}
        </View>
        {kids.length > 0 ? (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Line />
            <View style={{ height: 2, width: Math.min(280, kids.length * 92 - 40), backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {kids.map((k) => (
                <View key={k.id} style={{ alignItems: 'center' }}>
                  <Line h={12} />
                  <Node name={k.name} age={k.age} sub={k.alive ? `Age ${k.age}` : 'Passed'} ring={k.alive ? colors.good : colors.border} dim={!k.alive} />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>No children yet. The line continues only through heirs.</Text>
        )}
      </Card>

      {heirlooms.length > 0 || ch.flags.owns_home ? (
        <View>
          <SectionTitle>Family estate</SectionTitle>
          <Card style={{ marginBottom: 16 }}>
            {game.assets.filter((a) => a.kind === 'home' || a.rate > 0).map((a) => (
              <Text key={a.id} style={{ color: colors.text, marginVertical: 3 }}>{a.emoji} {a.name} <Text style={{ color: colors.muted }}>· {fmtMoney(a.value)}</Text></Text>
            ))}
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>Your chosen heir inherits the best home and any heirlooms that hold their value.</Text>
          </Card>
        </View>
      ) : null}

      {trips.length > 0 ? (
        <View>
          <SectionTitle>Family passport</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
            {trips.map((t) => <View key={t} style={{ marginRight: 8, marginBottom: 8 }}><Pill text={`🛂 ${CITY[t] ?? t}`} color={colors.gold} /></View>)}
          </View>
        </View>
      ) : null}

      <SectionTitle right={<Text style={{ color: colors.muted, fontSize: 12 }}>{unlocked.size}/{ACHIEVEMENTS.length}</Text>}>Trophies</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 6 }}>
        {ACHIEVEMENTS.map((a) => {
          const on = unlocked.has(a.id);
          return (
            <View key={a.id} style={{ width: '31.5%', backgroundColor: on ? 'rgba(224,184,102,0.10)' : colors.surface, borderWidth: 1, borderColor: on ? colors.gold : colors.border, borderRadius: 12, padding: 8, marginBottom: 8, alignItems: 'center', opacity: on ? 1 : 0.55 }}>
              <Text style={{ fontSize: 24, opacity: on ? 1 : 0.35 }}>{on ? a.icon : '🔒'}</Text>
              <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 }}>{a.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 2 }}>{a.desc}</Text>
            </View>
          );
        })}
      </View>

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
