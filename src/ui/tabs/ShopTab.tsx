import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Pill, SectionTitle } from '../components.tsx';
import { Gradient } from '../art.tsx';
import { colors, serif } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { PRODUCTS, THEMES } from '../../monetization/products.ts';
import { owns } from '../../monetization/entitlements.ts';
import { PACKS } from '../../content/index.ts';

export function ShopTab() {
  const { entitlements, buy, restorePurchases, setTheme, accent } = useGame();
  const packs = PRODUCTS.filter((p) => p.kind === 'pack');
  const themes = PRODUCTS.filter((p) => p.kind === 'theme');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Card style={{ marginBottom: 14, borderColor: colors.gold }}>
        <Text style={{ color: colors.gold, fontWeight: '800', marginBottom: 4 }}>TEST MODE</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>No real money is charged. "Unlock" only simulates a purchase so you can design and test the store. Real App Store purchases get wired in later.</Text>
      </Card>

      <SectionTitle>Story packs</SectionTitle>
      {packs.map((p) => {
        const pack = PACKS.find((x) => x.id === p.refId);
        const have = owns(entitlements, p);
        return (
          <View key={p.id} style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <Gradient stops={pack?.colors ?? ['#2D3A8C', '#8B7BF0']} style={{ height: 92, justifyContent: 'center', paddingHorizontal: 16 }}>
              <Text style={{ position: 'absolute', right: 14, top: 12, fontSize: 52, opacity: 0.9 }}>{pack?.emoji ?? '📦'}</Text>
              <Text style={{ color: '#FFFFFF', fontFamily: serif, fontSize: 24 }}>{p.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }}>{p.blurb}</Text>
            </Gradient>
            <View style={{ padding: 14 }}>
              <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>{pack?.description} · {pack?.events.length} new story events</Text>
              {have ? <Pill text="Owned" color={colors.good} /> : <Button label={`Unlock (test) · ${p.priceLabel}`} variant="gold" onPress={() => buy(p)} />}
            </View>
          </View>
        );
      })}

      <SectionTitle>Family crest themes</SectionTitle>
      {THEMES.map((t) => {
        const prod = themes.find((p) => p.refId === t.id);
        const unlocked = t.free || (prod ? owns(entitlements, prod) : false);
        const active = entitlements.activeTheme === t.id;
        return (
          <Card key={t.id} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.accent, marginRight: 12 }} />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, flex: 1 }}>{t.name}</Text>
              {active ? <Pill text="Active" color={t.accent} /> : null}
            </View>
            <View style={{ marginTop: 10 }}>
              {unlocked ? (
                !active ? <Button label="Use this theme" variant="ghost" onPress={() => setTheme(t.id)} /> : null
              ) : (
                <Button label={`Unlock (test) ${prod?.priceLabel ?? ''}`} variant="gold" onPress={() => prod && buy(prod).then(() => setTheme(t.id))} />
              )}
            </View>
          </Card>
        );
      })}

      <Button label="Restore purchases" variant="ghost" onPress={restorePurchases} style={{ marginTop: 6 }} />
      <View style={{ height: 2, backgroundColor: accent, opacity: 0.25, marginTop: 20 }} />
    </ScrollView>
  );
}
