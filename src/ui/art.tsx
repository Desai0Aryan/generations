// Procedural art made only from <View>s: gradients, portraits, and life-stage scenery.
// No images, no SVG library, so it works everywhere and costs nothing to ship.
import React from 'react';
import { Text, View } from 'react-native';
import { hash, lerpColor, seeded } from './fx.ts';

// ───────── Gradient ─────────
export function Gradient({
  stops, steps = 18, style, children,
}: { stops: string[]; steps?: number; style?: any; children?: React.ReactNode }) {
  const bands = [];
  const segs = stops.length - 1;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const seg = Math.min(segs - 1, Math.floor(t * segs));
    const local = t * segs - seg;
    bands.push(
      <View key={i} style={{ position: 'absolute', zIndex: -1, left: 0, right: 0, top: `${(i * 100) / steps}%`, height: `${100 / steps + 1.5}%`, backgroundColor: lerpColor(stops[seg], stops[seg + 1], Math.max(0, Math.min(1, local))) }} />,
    );
  }
  return (
    <View style={[{ overflow: 'hidden', position: 'relative', zIndex: 0 }, style]}>
      {bands}
      {children}
    </View>
  );
}

// ───────── Portrait ─────────
const SKIN = ['#F6D6BD', '#F1C7A5', '#E3A982', '#C98B64', '#A56A45', '#7B4B2E'];
const HAIR = ['#1B1410', '#3B2416', '#6B4423', '#A0672B', '#D2A24C', '#B5472B'];
const CLOTH = ['#4FD1B5', '#E0B866', '#A58BF5', '#F08BB5', '#5AA9F0', '#F0716B', '#5BD38A', '#E8E4D8'];
const BG: [string, string][] = [
  ['#27406B', '#16213A'], ['#3D2B58', '#1B1530'], ['#1F4B4A', '#10262A'], ['#5A3A2A', '#2A1A14'], ['#2F3E66', '#1A2238'],
];

export function Portrait({
  name, age = 25, size = 56, ring, style, gender,
}: { name: string; age?: number; size?: number; ring?: string; style?: any; gender?: string }) {
  const h = hash(name);
  const r = seeded(h);
  const skin = SKIN[Math.floor(r() * SKIN.length)];
  const hairBase = HAIR[Math.floor(r() * HAIR.length)];
  const cloth = CLOTH[Math.floor(r() * CLOTH.length)];
  const bg = BG[Math.floor(r() * BG.length)];
  const g = (gender ?? '').toLowerCase();
  const longBias = g.startsWith('f') ? 0.65 : g.startsWith('m') ? 0.1 : 0.35;
  const long = r() < longBias;
  const bun = !long && r() < 0.18;
  const bald = !long && !bun && age >= 45 && r() < 0.28;
  const hair = age >= 65 ? '#C9CBD3' : age >= 48 ? lerpColor(hairBase, '#B8BAC4', 0.45) : hairBase;
  const baby = age < 4;
  const kid = age < 13;
  const S = size;
  const headW = S * (baby ? 0.5 : kid ? 0.44 : 0.38);
  const headH = S * (baby ? 0.5 : kid ? 0.46 : 0.44);
  const headTop = S * (baby ? 0.28 : kid ? 0.3 : 0.2);
  const cx = (w: number) => (S - w) / 2;
  const eyeY = headTop + headH * 0.5;
  const dark = '#1A1411';

  return (
    <View style={[{ width: S, height: S, borderRadius: S / 2, overflow: 'hidden', borderWidth: ring ? Math.max(2, S * 0.045) : 0, borderColor: ring ?? 'transparent', backgroundColor: bg[1] }, style]}>
      <Gradient stops={bg} steps={8} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {/* long back hair */}
      {long && !baby ? <View style={{ position: 'absolute', top: headTop - S * 0.04, left: cx(headW * 1.28), width: headW * 1.28, height: headH * 1.45, borderRadius: S * 0.2, backgroundColor: hair }} /> : null}
      {/* shoulders */}
      <View style={{ position: 'absolute', bottom: -S * 0.2, left: cx(S * (baby ? 0.62 : 0.8)), width: S * (baby ? 0.62 : 0.8), height: S * 0.52, borderTopLeftRadius: S * 0.4, borderTopRightRadius: S * 0.4, backgroundColor: cloth }} />
      {/* collar */}
      <View style={{ position: 'absolute', top: headTop + headH * 0.92, left: cx(S * 0.2), width: S * 0.2, height: S * 0.14, borderBottomLeftRadius: S * 0.1, borderBottomRightRadius: S * 0.1, backgroundColor: lerpColor(skin.length === 7 ? skin : '#C98B64', '#000000', 0.12) }} />
      {/* head */}
      <View style={{ position: 'absolute', top: headTop, left: cx(headW), width: headW, height: headH, borderRadius: headW / 2, backgroundColor: skin }} />
      {/* ears */}
      {!baby ? (
        <>
          <View style={{ position: 'absolute', top: eyeY - S * 0.02, left: cx(headW) - S * 0.025, width: S * 0.05, height: S * 0.08, borderRadius: S * 0.03, backgroundColor: skin }} />
          <View style={{ position: 'absolute', top: eyeY - S * 0.02, left: cx(headW) + headW - S * 0.025, width: S * 0.05, height: S * 0.08, borderRadius: S * 0.03, backgroundColor: skin }} />
        </>
      ) : null}
      {/* hair cap */}
      {!bald ? (
        <View style={{ position: 'absolute', top: headTop - S * (baby ? 0.0 : 0.045), left: cx(headW * 1.08), width: headW * 1.08, height: headH * (baby ? 0.22 : long ? 0.42 : 0.4), borderTopLeftRadius: headW * 0.55, borderTopRightRadius: headW * 0.55, borderBottomLeftRadius: S * 0.05, borderBottomRightRadius: S * 0.05, backgroundColor: hair }} />
      ) : null}
      {bun ? <View style={{ position: 'absolute', top: headTop - S * 0.13, left: cx(S * 0.16), width: S * 0.16, height: S * 0.16, borderRadius: S * 0.08, backgroundColor: hair }} /> : null}
      {/* eyes */}
      <View style={{ position: 'absolute', top: eyeY, left: S / 2 - headW * 0.24 - S * 0.022, width: S * 0.044, height: S * 0.044, borderRadius: S * 0.022, backgroundColor: dark }} />
      <View style={{ position: 'absolute', top: eyeY, left: S / 2 + headW * 0.24 - S * 0.022, width: S * 0.044, height: S * 0.044, borderRadius: S * 0.022, backgroundColor: dark }} />
      {/* smile */}
      <View style={{ position: 'absolute', top: eyeY + headH * 0.22, left: cx(S * 0.11), width: S * 0.11, height: S * 0.055, borderBottomLeftRadius: S * 0.06, borderBottomRightRadius: S * 0.06, borderBottomWidth: Math.max(1.5, S * 0.02), borderLeftWidth: Math.max(1.5, S * 0.02), borderRightWidth: Math.max(1.5, S * 0.02), borderColor: '#7A3B2E' }} />
      {/* elder glasses */}
      {age >= 60 ? (
        <>
          <View style={{ position: 'absolute', top: eyeY - S * 0.03, left: S / 2 - headW * 0.24 - S * 0.05, width: S * 0.1, height: S * 0.1, borderRadius: S * 0.05, borderWidth: Math.max(1, S * 0.014), borderColor: '#1A1411' }} />
          <View style={{ position: 'absolute', top: eyeY - S * 0.03, left: S / 2 + headW * 0.24 - S * 0.05, width: S * 0.1, height: S * 0.1, borderRadius: S * 0.05, borderWidth: Math.max(1, S * 0.014), borderColor: '#1A1411' }} />
        </>
      ) : null}
    </View>
  );
}

// ───────── Life-stage scenery ─────────
export type Stage = 'child' | 'teen' | 'young' | 'adult' | 'elder';
export const stageOf = (age: number): Stage => (age < 13 ? 'child' : age < 20 ? 'teen' : age < 36 ? 'young' : age < 65 ? 'adult' : 'elder');

const SKY: Record<Stage, string[]> = {
  child: ['#7CC8FF', '#BDE7FF', '#FFE9B8'],
  teen: ['#5A9BE8', '#9CC4F0', '#F6D9A8'],
  young: ['#F6A66A', '#C2678E', '#5B4A9E'],
  adult: ['#2E2B6B', '#8C4D7E', '#E8845F'],
  elder: ['#0B1230', '#1F2552', '#3A2E6B'],
};

export const STAGE_LABEL: Record<Stage, string> = { child: 'Childhood', teen: 'Teen years', young: 'Young adult', adult: 'Prime of life', elder: 'Golden years' };

export function Scene({ stage, height = 150 }: { stage: Stage; height?: number }) {
  const night = stage === 'elder';
  const H = height;
  const r = seeded(hash(stage));
  const stars = night ? Array.from({ length: 26 }, () => ({ x: r() * 100, y: r() * 62, s: 1 + r() * 2, o: 0.4 + r() * 0.6 })) : [];
  const hill = night ? ['#161B3D', '#10142E'] : stage === 'adult' ? ['#3A2A55', '#2A1E40'] : ['#4DA567', '#3A8A53'];
  const buildings = stage === 'young' || stage === 'adult'
    ? Array.from({ length: 9 }, (_, i) => ({ x: i * 12 - 2, w: 9 + r() * 5, h: 22 + r() * 46 }))
    : [];
  return (
    <Gradient stops={SKY[stage]} style={{ height: H, width: '100%' }}>
      {stars.map((s, i) => (
        <View key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, borderRadius: s.s, backgroundColor: '#FFFFFF', opacity: s.o }} />
      ))}
      {/* sun / moon */}
      <View style={{ position: 'absolute', right: '14%', top: night ? H * 0.16 : stage === 'young' || stage === 'adult' ? H * 0.34 : H * 0.12, width: H * 0.24, height: H * 0.24, borderRadius: H * 0.12, backgroundColor: night ? '#F1EEDB' : stage === 'adult' ? '#FFC28A' : '#FFF1B8', opacity: night ? 0.95 : 0.9 }} />
      {night ? <View style={{ position: 'absolute', right: '11.5%', top: H * 0.13, width: H * 0.22, height: H * 0.22, borderRadius: H * 0.11, backgroundColor: '#1A2048' }} /> : null}
      {/* skyline */}
      {buildings.map((b, i) => (
        <View key={i} style={{ position: 'absolute', left: `${b.x}%`, bottom: H * 0.08, width: `${b.w}%`, height: b.h, backgroundColor: stage === 'adult' ? '#2B2150' : '#4A3A78', opacity: 0.9 }}>
          {[0, 1, 2].map((w) => (
            <View key={w} style={{ position: 'absolute', left: '22%', top: 6 + w * 12, width: '18%', height: 4, backgroundColor: '#FFD68A', opacity: 0.55 }} />
          ))}
        </View>
      ))}
      {/* hills */}
      <View style={{ position: 'absolute', left: '-25%', bottom: -H * 0.62, width: '110%', height: H * 0.9, borderRadius: H * 0.45, backgroundColor: hill[0] }} />
      <View style={{ position: 'absolute', right: '-30%', bottom: -H * 0.7, width: '120%', height: H * 0.95, borderRadius: H * 0.5, backgroundColor: hill[1] }} />
    </Gradient>
  );
}

// ───────── Event banner (category art) ─────────
export const CAT_STYLE: Record<string, { stops: string[]; emoji: string }> = {
  school: { stops: ['#1F4E9E', '#5AA9F0'], emoji: '🎓' },
  work: { stops: ['#2B3A55', '#5C7BA6'], emoji: '💼' },
  love: { stops: ['#8C2D5E', '#F08BB5'], emoji: '💞' },
  family: { stops: ['#8A4B1F', '#F0B06A'], emoji: '🏡' },
  friends: { stops: ['#14706A', '#4FD1B5'], emoji: '🤝' },
  health: { stops: ['#1F6B3E', '#5BD38A'], emoji: '🌿' },
  money: { stops: ['#7A5A12', '#E0B866'], emoji: '💰' },
  legacy: { stops: ['#4B2C8C', '#E0B866'], emoji: '📜' },
  life: { stops: ['#2D3A8C', '#8B7BF0'], emoji: '✨' },
};

export function Banner({ cat, height = 96, emojiOverride }: { cat: string; height?: number; emojiOverride?: string }) {
  const c = CAT_STYLE[cat] ?? CAT_STYLE.life;
  return (
    <Gradient stops={c.stops} style={{ height, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: -20, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.10)' }} />
      <View style={{ position: 'absolute', right: -10, bottom: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <View style={{ position: 'absolute', right: 40, top: 14, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.14)' }} />
      <Text style={{ fontSize: height * 0.5 }}>{emojiOverride ?? c.emoji}</Text>
    </Gradient>
  );
}
