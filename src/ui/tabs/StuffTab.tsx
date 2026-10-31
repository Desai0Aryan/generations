import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Pill, SectionTitle } from '../components.tsx';
import { colors, fmtMoney, serif } from '../theme.ts';
import { useGame } from '../../store/GameContext.tsx';
import { buyCheck } from '../../engine/actions.ts';
import { assetsValue, loansBalance, netWorth } from '../../engine/finance.ts';
import { CATALOG } from '../../content/assets.ts';
import type { AssetKind } from '../../engine/types.ts';
import { useTween } from '../fx.ts';

const SECTIONS: { kind: AssetKind; title: string }[] = [
  { kind: 'home', title: '🏠 Homes' },
  { kind: 'car', title: '🚗 Cars' },
  { kind: 'luxury', title: '💎 Luxury & gear' },
  { kind: 'pet', title: '🐾 Pets' },
];

export function StuffTab() {
  const { game, buyItem, sellItem } = useGame();
  const [confirm, setConfirm] = useState<string | null>(null);
  const nw = useTween(game ? netWorth(game) : 0, 700);
  if (!game) return null;
  const ch = game.character;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Card style={{ marginBottom: 14, borderColor: colors.gold }}>
        <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 1 }}>NET WORTH</Text>
        <Text style={{ color: nw < 0 ? colors.danger : colors.gold, fontFamily: serif, fontSize: 32, marginVertical: 2 }}>{fmtMoney(nw)}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Stat k="Cash" v={fmtMoney(ch.money)} bad={ch.money < 0} />
          <Stat k="Assets" v={fmtMoney(assetsValue(game))} />
          <Stat k="Loans" v={fmtMoney(loansBalance(game))} bad={loansBalance(game) > 0} />
        </View>
      </Card>

      {game.loans.length > 0 ? (
        <View>
          <SectionTitle>Loans</SectionTitle>
          {game.loans.map((l) => (
            <Card key={l.id} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{l.label}</Text>
                <Text style={{ color: colors.danger, fontWeight: '800' }}>{fmtMoney(l.balance)}</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>{(l.rate * 100).toFixed(1)}% interest · pays {fmtMoney(l.yearly)} a year automatically</Text>
            </Card>
          ))}
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>Pay loans down faster from Do → Money.</Text>
        </View>
      ) : null}

      <SectionTitle>What you own</SectionTitle>
      {game.assets.length === 0 ? <Text style={{ color: colors.muted, marginBottom: 8 }}>Nothing yet. Browse below.</Text> : null}
      {game.assets.map((a) => {
        const loan = game.loans.find((l) => l.id === a.loanId);
        const net = a.value - (loan?.balance ?? 0);
        return (
          <Card key={a.id} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 30, marginRight: 12 }}>{a.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{a.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Worth {fmtMoney(a.value)}{loan ? ` · owe ${fmtMoney(loan.balance)}` : ''} · bought {a.boughtYear}</Text>
              </View>
              {a.kind === 'pet' ? <Pill text="Family" color={colors.good} /> : null}
            </View>
            {confirm === a.id ? (
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <Button small variant="danger" label={`Confirm sale · net ${fmtMoney(net)}`} onPress={() => { sellItem(a.id); setConfirm(null); }} style={{ flex: 2, marginRight: 6 }} />
                <Button small variant="ghost" label="Cancel" onPress={() => setConfirm(null)} style={{ flex: 1 }} />
              </View>
            ) : (
              <Button small variant="ghost" label={a.kind === 'pet' ? 'Rehome' : 'Sell'} onPress={() => setConfirm(a.id)} style={{ marginTop: 10 }} />
            )}
          </Card>
        );
      })}

      {SECTIONS.map((sec) => {
        const items = CATALOG.filter((i) => i.kind === sec.kind && ch.age >= i.minAge - 2);
        if (items.length === 0) return null;
        return (
          <View key={sec.kind}>
            <SectionTitle>{sec.title}</SectionTitle>
            {items.map((it) => {
              const cash = buyCheck(game, it.id, 'cash');
              const fin = buyCheck(game, it.id, 'finance');
              return (
                <Card key={it.id} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 30, marginRight: 12 }}>{it.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{it.name}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{it.blurb}</Text>
                    </View>
                    <Text style={{ color: colors.gold, fontWeight: '800' }}>{fmtMoney(it.price)}</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                    {it.upkeep ? `Upkeep ${fmtMoney(it.upkeep)}/yr${it.kind === 'home' ? ' + property tax' : ''}` : 'No upkeep'}
                    {it.rate > 0 ? ' · gains value' : it.rate < -0.05 ? ' · loses value' : ''}
                  </Text>
                  {!cash.ok && !fin.ok ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{cash.reason === fin.reason || !it.finance ? cash.reason : `${cash.reason} · ${fin.reason}`}</Text> : null}
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <Button small label="Buy" disabled={!cash.ok} onPress={() => buyItem(it.id, 'cash')} style={{ flex: 1, marginRight: it.finance ? 6 : 0 }} />
                    {it.finance ? <Button small variant="gold" label={`Finance · ${fmtMoney(fin.downPayment)} down`} sub={`${fmtMoney(fin.yearly)}/yr`} disabled={!fin.ok} onPress={() => buyItem(it.id, 'finance')} style={{ flex: 2 }} /> : null}
                  </View>
                </Card>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

function Stat({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return (
    <View>
      <Text style={{ color: colors.muted, fontSize: 11 }}>{k}</Text>
      <Text style={{ color: bad ? colors.danger : colors.text, fontWeight: '800', fontSize: 15 }}>{v}</Text>
    </View>
  );
}
