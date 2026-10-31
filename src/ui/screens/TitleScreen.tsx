import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card } from '../components.tsx';
import { colors, serif } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';

export function TitleScreen({ onNew }: { onNew: () => void }) {
  const { hasSave, resume, resetSave, accent } = useGame();
  const [settings, setSettings] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 70 }}>
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <Text style={{ fontSize: 54, marginBottom: 6 }}>🌳</Text>
          <Text style={{ color: colors.text, fontFamily: serif, fontSize: 38, letterSpacing: 3 }}>GENERATIONS</Text>
          <Text style={{ color: colors.muted, marginTop: 8, fontSize: 15 }}>Live. Build. Pass it on.</Text>
          <View style={{ height: 2, width: 60, backgroundColor: accent, marginTop: 18, borderRadius: 1 }} />
        </View>

        {hasSave ? <Button label="Continue Legacy" sub="Pick up where your family left off" icon="📜" onPress={resume} style={{ marginBottom: 12 }} /> : null}
        <Button label="New Bloodline" sub="Start a new family" icon="🌱" variant={hasSave ? 'ghost' : 'primary'} onPress={onNew} style={{ marginBottom: 12 }} />
        <Button label="Settings" icon="⚙️" variant="ghost" onPress={() => setSettings((s) => !s)} style={{ marginBottom: 12 }} />

        {settings ? (
          <Card style={{ marginTop: 4 }}>
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>Settings</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>Your progress saves automatically on this device.</Text>
            {confirm ? (
              <View>
                <Text style={{ color: colors.danger, marginBottom: 10 }}>This permanently deletes your saved family. Are you sure?</Text>
                <Button label="Yes, delete everything" variant="ghost" onPress={async () => { await resetSave(); setConfirm(false); setSettings(false); }} style={{ marginBottom: 8 }} />
                <Button label="Cancel" variant="ghost" onPress={() => setConfirm(false)} />
              </View>
            ) : (
              <Button label="Delete saved game" variant="ghost" onPress={() => setConfirm(true)} />
            )}
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}
