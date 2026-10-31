import React from 'react';
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, serif } from './theme.ts';
import { useGame } from '../store/GameContext.tsx';
import { tap, useEntrance, useTween } from './fx.ts';
import { Portrait } from './art.tsx';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14 }, style]}>
      {children}
    </View>
  );
}

export function Button({
  label, sub, onPress, disabled, variant = 'primary', style, icon, small,
}: {
  label: string; sub?: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'gold' | 'danger'; style?: StyleProp<ViewStyle>; icon?: string; small?: boolean;
}) {
  const { accent } = useGame();
  const bg = variant === 'primary' ? accent : variant === 'gold' ? colors.gold : variant === 'danger' ? colors.danger : colors.surface2;
  const fg = variant === 'ghost' ? colors.text : '#07101C';
  return (
    <Pressable
      onPress={() => { tap(); onPress(); }}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg, borderRadius: radius.md, paddingVertical: small ? 9 : 14, paddingHorizontal: small ? 12 : 16,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1, borderWidth: variant === 'ghost' ? 1 : 0, borderColor: colors.border,
          flexDirection: 'row', alignItems: 'center',
        },
        style,
      ]}
    >
      {icon ? <Text style={{ fontSize: small ? 16 : 20, marginRight: 10 }}>{icon}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: fg, fontSize: small ? 13 : 16, fontWeight: '700' }}>{label}</Text>
        {sub ? <Text style={{ color: variant === 'ghost' ? colors.muted : 'rgba(7,16,28,0.7)', fontSize: 12, marginTop: 2 }}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function StatBar({ label, value, color, suffix, thin }: { label: string; value: number; color: string; suffix?: string; thin?: boolean }) {
  const v = useTween(value, 700);
  return (
    <View style={{ marginBottom: thin ? 8 : 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ color: colors.text, fontSize: thin ? 13 : 14 }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{suffix ?? Math.round(v)}</Text>
      </View>
      <View style={{ height: thin ? 6 : 8, backgroundColor: colors.surface2, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(2, Math.min(100, v))}%`, height: thin ? 6 : 8, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

export function Pill({ text, color }: { text: string; color?: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.surface2, borderWidth: 1, borderColor: color ?? colors.border }}>
      <Text style={{ color: color ?? colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>{text.toUpperCase()}</Text>
    </View>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 10 }}>
      <Text style={{ color: colors.gold, fontFamily: serif, fontSize: 20 }}>{children}</Text>
      {right}
    </View>
  );
}

export function Avatar({ name, size = 40, tint, age = 25, gender }: { name: string; size?: number; tint?: string; age?: number; gender?: string }) {
  const { accent } = useGame();
  return <Portrait name={name} size={size} age={age} gender={gender} ring={tint ?? accent} />;
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { accent } = useGame();
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: selected ? accent : colors.border, backgroundColor: selected ? accent : colors.surface, marginRight: 8, marginBottom: 8 }}>
      <Text style={{ color: selected ? '#07101C' : colors.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/** Bottom sheet that slides up over the screen. Tap the dim area or ✕ to close. */
export function Sheet({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  const p = useEntrance(260);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: `rgba(5,9,18,${0.82 * p})`, justifyContent: 'flex-end' }}>
      <Pressable onPress={onClose} style={{ flex: 1 }}><View style={{ flex: 1 }} /></Pressable>
      <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.border, maxHeight: '84%', transform: [{ translateY: (1 - p) * 50 }], opacity: p }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontFamily: serif, fontSize: 22 }}>{title}</Text>
            {subtitle ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{subtitle}</Text> : null}
          </View>
          <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 16 }}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 28 }}>{children}</ScrollView>
      </View>
    </View>
  );
}

export function Row({
  icon, title, sub, right, onPress, disabled, tone,
}: { icon?: string; title: string; sub?: string; right?: React.ReactNode; onPress?: () => void; disabled?: boolean; tone?: 'danger' | 'good' }) {
  return (
    <Pressable
      disabled={disabled || !onPress}
      onPress={() => { tap(); onPress?.(); }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: pressed ? colors.surface2 : '#172238', borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: tone === 'good' ? colors.good : colors.border, opacity: disabled ? 0.45 : 1 })}
    >
      {icon ? (
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 19 }}>{icon}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        {sub ? <Text style={{ color: tone === 'danger' ? colors.danger : colors.muted, fontSize: 12, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {right ?? (onPress && !disabled ? <Text style={{ color: colors.muted, fontSize: 20, marginLeft: 8 }}>›</Text> : null)}
    </Pressable>
  );
}

/** Free-time dots: filled = still available this year */
export function TimeDots({ left, total }: { left: number; total: number }) {
  const { accent } = useGame();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ width: 11, height: 11, borderRadius: 6, marginLeft: 5, backgroundColor: i < left ? accent : 'transparent', borderWidth: 2, borderColor: i < left ? accent : colors.border }} />
      ))}
    </View>
  );
}
