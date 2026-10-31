import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Pill, SectionTitle } from '../components.tsx';
import { colors } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { PRODUCTS, THEMES } from '../../monetization/products.ts';
import { owns } from '../../monetization/entitlements.ts';

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
      {packs.map((p) => (
        <Card key={p.id} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', flex: 1 }}>{p.name}</Text>
            {owns(entitlements, p) ? <Pill text="Owned" color={colors.good} /> : <Text style={{ color: accent, fontWeight: '800' }}>{p.priceLabel}</Text>}
          </View>
          <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 10 }}>{p.blurb}</Text>
          {!owns(entitlements, p) ? <Button label="Unlock (test)" variant="gold" onPress={() => buy(p)} /> : <Text style={{ color: colors.muted, fontSize: 12 }}>New events appear in your life as you age. Applies to the current game too.</Text>}
        </Card>
      ))}

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
    </ScrollView>
  );
}
