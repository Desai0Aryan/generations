// The Closet: change your look, buy clothes, visit the salon. Dress well and people notice.
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Sheet } from './components.tsx';
import { Avatar, ALL_HAIR_COLORS, EYE_COLORS, SKIN_TONES } from './avatar.tsx';
import { colors, fmtMoney } from './theme.ts';
import { useGame } from '../store/GameContext.tsx';
import { GARMENTS, GARMENT_BY_ID, SALON_PRICE, SLOT_LABEL, styleScore, type Slot } from '../content/wardrobe.ts';
import { FACIAL, HAIR_STYLES } from '../engine/looks.ts';
import { salonCost } from '../engine/closet.ts';
import type { Look, Outfit } from '../engine/types.ts';
import { tap } from './fx.ts';

type Tab = Slot | 'hair' | 'face';
const TABS: { id: Tab; label: string }[] = [
  { id: 'top', label: 'Tops' }, { id: 'outer', label: 'Jackets' }, { id: 'hat', label: 'Hats' }, { id: 'glasses', label: 'Glasses' },
  { id: 'ears', label: 'Earrings' }, { id: 'neck', label: 'Neck' }, { id: 'makeup', label: 'Makeup' }, { id: 'bg', label: 'Backdrops' },
  { id: 'hair', label: 'Hair' }, { id: 'face', label: 'Face' },
];
const OPTIONAL: Slot[] = ['outer', 'hat', 'glasses', 'ears', 'neck', 'makeup'];

function Cell({ onPress, children, selected, dim }: { onPress: () => void; children: React.ReactNode; selected?: boolean; dim?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ width: '31%', marginRight: '2.3%', marginBottom: 10, alignItems: 'center', padding: 6, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 2, borderColor: selected ? colors.gold : colors.border, opacity: dim ? 0.55 : 1 }}>
      {children}
    </Pressable>
  );
}
const Label = ({ t, sub, color }: { t: string; sub?: string; color?: string }) => (
  <View style={{ alignItems: 'center', marginTop: 4 }}>
    <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{t}</Text>
    {sub ? <Text style={{ color: color ?? colors.muted, fontSize: 10, textAlign: 'center' }}>{sub}</Text> : null}
  </View>
);

export function ClosetSheet({ onClose }: { onClose: () => void }) {
  const { game, buyClothes, wearItem, changeLook, cosmetics } = useGame();
  const [tab, setTab] = useState<Tab>('top');
  if (!game) return null;
  const { look, outfit, owned } = game.wardrobe;
  const age = game.character.age;
  const money = game.character.money;
  const jailed = !!game.legal.prison;
  const preview = (o: Partial<Outfit>, l: Partial<Look> = {}, size = 64) => <Avatar look={{ ...look, ...l }} outfit={{ ...outfit, ...o }} age={age} size={size} />;

  const garmentCell = (g: (typeof GARMENTS)[number]) => {
    const have = owned.includes(g.id);
    const on = (outfit as unknown as Record<string, string | undefined>)[g.slot] === g.id;
    const locked = !!g.premium && !cosmetics.includes(g.premium);
    return (
      <Cell key={g.id} selected={on} dim={locked || (!have && money < g.price)} onPress={() => {
        tap();
        if (have) wearItem(g.slot, on && OPTIONAL.includes(g.slot) ? null : g.id);
        else if (!locked && !jailed) buyClothes(g.id);
      }}>
        {preview({ [g.slot]: g.id } as Partial<Outfit>)}
        <Label t={g.label} sub={on ? 'Wearing' : have ? 'Owned' : locked ? '🔒 Premium pack' : g.price ? fmtMoney(g.price) : 'Free'} color={on ? colors.gold : have ? colors.good : undefined} />
      </Cell>
    );
  };

  const swatch = (c: string, selected: boolean, onPress: () => void, k: string | number) => (
    <Pressable key={k} onPress={onPress} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c, marginRight: 8, marginBottom: 8, borderWidth: 3, borderColor: selected ? colors.gold : colors.border }} />
  );
  const apply = (patch: Partial<Look>) => { tap(); changeLook(patch); };
  const cost = (patch: Partial<Look>) => salonCost(game, patch);
  const Title = ({ t }: { t: string }) => <Text style={{ color: colors.gold, fontWeight: '800', marginTop: 8, marginBottom: 8 }}>{t}</Text>;
  const choiceRow = (label: string, key: keyof Look, n: number) => (
    <View key={key}>
      <Title t={label} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: n }, (_, i) => (
          <Pressable key={i} onPress={() => apply({ [key]: i } as Partial<Look>)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginRight: 8, marginBottom: 8, backgroundColor: look[key] === i ? colors.gold : colors.surface2 }}>
            <Text style={{ color: look[key] === i ? '#10131C' : colors.text, fontWeight: '700' }}>{i + 1}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Sheet title="Closet & salon" subtitle={`Style ${styleScore(outfit)}/100 · ${fmtMoney(money)}`} onClose={onClose}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <View style={{ width: 150, height: 150, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: colors.gold }}>
          <Avatar look={look} outfit={jailed ? { ...outfit, top: 'prison', outer: undefined } : outfit} age={age} size={150} />
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>{jailed ? 'In prison you wear what they give you.' : 'Good style makes a better first impression when you meet people.'}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => { tap(); setTab(t.id); }} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginRight: 8, backgroundColor: tab === t.id ? colors.gold : colors.surface2 }}>
            <Text style={{ color: tab === t.id ? '#10131C' : colors.text, fontWeight: '800', fontSize: 13 }}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab !== 'hair' && tab !== 'face' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {OPTIONAL.includes(tab as Slot) ? (
            <Cell selected={!(outfit as unknown as Record<string, string | undefined>)[tab]} onPress={() => wearItem(tab as Slot, null)}>
              {preview({ [tab]: undefined } as Partial<Outfit>)}
              <Label t="None" sub="Remove" />
            </Cell>
          ) : null}
          {GARMENTS.filter((g) => g.slot === tab).map(garmentCell)}
        </View>
      ) : null}

      {tab === 'hair' ? (
        <View>
          <Title t="Hairstyle (the salon charges per style)" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {HAIR_STYLES.map((h) => (
              <Cell key={h} selected={look.hair === h} dim={cost({ hair: h }) > money} onPress={() => apply({ hair: h })}>
                {preview({}, { hair: h })}
                <Label t={h[0].toUpperCase() + h.slice(1)} sub={look.hair === h ? 'Current' : SALON_PRICE[h] ? fmtMoney(SALON_PRICE[h]) : 'Free'} />
              </Cell>
            ))}
          </View>
          <Title t="Hair colour ($45 for a new colour)" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{ALL_HAIR_COLORS.map((c, i) => swatch(c, look.hairColor === i, () => apply({ hairColor: i }), i))}</View>
          <Title t="Facial hair ($20)" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {FACIAL.map((f) => (
              <Cell key={f} selected={look.facial === f} onPress={() => apply({ facial: f })}>
                {preview({}, { facial: f })}
                <Label t={f === 'none' ? 'Clean' : f[0].toUpperCase() + f.slice(1)} />
              </Cell>
            ))}
          </View>
        </View>
      ) : null}

      {tab === 'face' ? (
        <View>
          <Title t="Skin tone" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{SKIN_TONES.map((c, i) => swatch(c, look.skin === i, () => apply({ skin: i }), i))}</View>
          <Title t="Eye colour" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{EYE_COLORS.map((c, i) => swatch(c, look.eyes === i, () => apply({ eyes: i }), i))}</View>
          {choiceRow('Face shape', 'face', 4)}
          {choiceRow('Brows', 'brow', 3)}
          {choiceRow('Nose', 'nose', 3)}
          {choiceRow('Lips', 'lips', 3)}
          {choiceRow('Build', 'build', 3)}
          <Title t="Freckles" />
          <Pressable onPress={() => apply({ freckles: !look.freckles })} style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: look.freckles ? colors.gold : colors.surface2 }}>
            <Text style={{ color: look.freckles ? '#10131C' : colors.text, fontWeight: '700' }}>{look.freckles ? 'On' : 'Off'}</Text>
          </Pressable>
        </View>
      ) : null}
      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 14 }}>Your family closet is inherited: your heirs keep every item you buy.</Text>
    </Sheet>
  );
}
