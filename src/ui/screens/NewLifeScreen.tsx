import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, SectionTitle } from '../components.tsx';
import { colors, serif } from '../theme.ts';
import { Portrait } from '../art.tsx';
import { BACKGROUNDS } from '../../engine/lifecycle.ts';
import type { BackgroundId } from '../../engine/types.ts';
import { FIRST_NAMES, LAST_NAMES } from '../../engine/names.ts';
import { useGame } from '../../store/GameContext.tsx';

const rand = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

export function NewLifeScreen({ onBack }: { onBack: () => void }) {
  const { start } = useGame();
  const [first, setFirst] = useState(rand(FIRST_NAMES));
  const [last, setLast] = useState(rand(LAST_NAMES));
  const [gender, setGender] = useState('Female');
  const [bg, setBg] = useState<BackgroundId>('middle');
  const [startAge, setStartAge] = useState<0 | 16>(0);

  const input = { backgroundColor: colors.surface, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 12 } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}>
        <Text onPress={onBack} style={{ color: colors.muted, marginBottom: 12 }}>‹ Back</Text>
        <Text style={{ color: colors.text, fontFamily: serif, fontSize: 30, marginBottom: 4 }}>A new bloodline</Text>
        <Text style={{ color: colors.muted, marginBottom: 14 }}>Choose who starts the story. Your descendants carry it on.</Text>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Portrait name={`${first} ${last}`} age={startAge === 0 ? 1 : 16} gender={gender} size={104} ring={colors.gold} />
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>Your face changes with your name. Try a few.</Text>
        </View>

        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>FIRST NAME</Text>
        <TextInput value={first} onChangeText={setFirst} style={input} placeholder="First name" />
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>FAMILY NAME</Text>
        <TextInput value={last} onChangeText={setLast} style={input} placeholder="Family name" />
        <Button label="🎲 Randomize name" variant="ghost" onPress={() => { setFirst(rand(FIRST_NAMES)); setLast(rand(LAST_NAMES)); }} style={{ marginBottom: 18 }} />

        <SectionTitle>Identity</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['Female', 'Male', 'Non-binary'].map((g) => <Chip key={g} label={g} selected={gender === g} onPress={() => setGender(g)} />)}
        </View>

        <SectionTitle>Where you come from</SectionTitle>
        {(Object.keys(BACKGROUNDS) as BackgroundId[]).map((id) => (
          <Card key={id} style={{ marginBottom: 10, borderColor: bg === id ? colors.gold : colors.border }}>
            <Text onPress={() => setBg(id)} style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{bg === id ? '● ' : '○ '}{BACKGROUNDS[id].label}</Text>
            <Text onPress={() => setBg(id)} style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>{BACKGROUNDS[id].blurb}</Text>
          </Card>
        ))}

        <SectionTitle>Starting point</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip label="Birth (full life)" selected={startAge === 0} onPress={() => setStartAge(0)} />
          <Chip label="Age 16 (junior year)" selected={startAge === 16} onPress={() => setStartAge(16)} />
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 20 }}>
          {startAge === 0 ? 'Live every year from the first step.' : 'Skip ahead. Your childhood is simulated, then the choices are yours.'}
        </Text>

        <Button label="Begin" sub={`${first} ${last}`} onPress={() => start({ firstName: first, lastName: last, gender, background: bg, startAge })} />
      </ScrollView>
    </View>
  );
}
