import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, serif } from './theme.ts';
import { useGame } from '../store/GameContext.tsx';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14 }, style]}>
      {children}
    </View>
  );
}

export function Button({
  label, sub, onPress, disabled, variant = 'primary', style, icon,
}: {
  label: string; sub?: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'gold'; style?: StyleProp<ViewStyle>; icon?: string;
}) {
  const { accent } = useGame();
  const bg = variant === 'primary' ? accent : variant === 'gold' ? colors.gold : colors.surface2;
  const fg = variant === 'ghost' ? colors.text : '#07101C';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1, borderWidth: variant === 'ghost' ? 1 : 0, borderColor: colors.border,
          flexDirection: 'row', alignItems: 'center',
        },
        style,
      ]}
    >
      {icon ? <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: fg, fontSize: 16, fontWeight: '700' }}>{label}</Text>
        {sub ? <Text style={{ color: variant === 'ghost' ? colors.muted : 'rgba(7,16,28,0.7)', fontSize: 12, marginTop: 2 }}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function StatBar({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ color: colors.text, fontSize: 14 }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{suffix ?? value}</Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.surface2, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(2, Math.min(100, value))}%`, height: 8, backgroundColor: color, borderRadius: 4 }} />
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

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: colors.gold, fontFamily: serif, fontSize: 20, marginTop: 6, marginBottom: 10 }}>{children}</Text>;
}

export function Avatar({ name, size = 40, tint }: { name: string; size?: number; tint?: string }) {
  const { accent } = useGame();
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface2, borderWidth: 2, borderColor: tint ?? accent, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { accent } = useGame();
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: selected ? accent : colors.border, backgroundColor: selected ? accent : colors.surface, marginRight: 8, marginBottom: 8 }}>
      <Text style={{ color: selected ? '#07101C' : colors.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
