import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider, useGame } from './src/store/GameContext.tsx';
import { TitleScreen } from './src/ui/screens/TitleScreen.tsx';
import { NewLifeScreen } from './src/ui/screens/NewLifeScreen.tsx';
import { GameScreen } from './src/ui/screens/GameScreen.tsx';
import { colors } from './src/ui/theme.ts';

function Root() {
  const { ready, game } = useGame();
  const [creating, setCreating] = useState(false);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </View>
    );
  }
  if (game) return <GameScreen />;
  if (creating) return <NewLifeScreen onBack={() => setCreating(false)} />;
  return <TitleScreen onNew={() => setCreating(true)} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <StatusBar style="light" />
        <Root />
      </GameProvider>
    </SafeAreaProvider>
  );
}
