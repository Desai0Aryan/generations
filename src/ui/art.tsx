// Procedural art made only from <View>s: gradients, portraits, and life-stage scenery.
// People are drawn by avatar.tsx (react-native-svg); scenes and gradients stay plain Views.
import React from 'react';
import { Text, View } from 'react-native';
import { hash, lerpColor, seeded } from './fx.ts';
import type { Outfit } from '../engine/types.ts';
import { lookFromSeed } from '../engine/looks.ts';
import { Avatar } from './avatar.tsx';
import { useGame } from '../store/GameContext.tsx';

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
// Everyone is drawn by the same Avatar. You wear what you bought; everyone else gets a stable look from their name.
const TOPS = ['tee_white', 'tee_navy', 'hoodie_grey', 'tee_red', 'polo', 'flannel', 'sweater_cream', 'dress_shirt', 'blouse', 'hoodie_black', 'sundress', 'tee_graphic'];
const BGS = ['bg_dawn', 'bg_sky', 'bg_forest', 'bg_sunset', 'bg_night'];

export function otherOutfit(name: string, age: number, gender?: string): Outfit {
  const h = hash(name + 'outfit');
  const fem = (gender ?? '').toLowerCase().startsWith('f');
  const pool = fem ? TOPS : TOPS.filter((x) => x !== 'sundress' && x !== 'blouse');
  const o: Outfit = { top: pool[h % pool.length], bg: BGS[(h >> 3) % BGS.length] };
  if (age >= 45 && h % 3 === 0) o.glasses = 'g_round';
  else if (age >= 14 && h % 7 === 0) o.glasses = 'g_square';
  if (fem && age >= 18 && h % 5 === 0) o.ears = 'e_stud';
  return o;
}

export function Portrait({
  name, age = 25, size = 56, ring, style, gender,
}: { name: string; age?: number; size?: number; ring?: string; style?: any; gender?: string; looks?: number }) {
  const { game } = useGame();
  const me = game && name === `${game.character.firstName} ${game.character.lastName}`;
  const look = me ? game.wardrobe.look : lookFromSeed(name, gender ?? genderFromName(name));
  let outfit = me ? game.wardrobe.outfit : otherOutfit(name, age, gender);
  if (me && game.legal.prison) outfit = { ...outfit, top: 'prison', outer: undefined, hat: undefined, neck: undefined };
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: ring ? Math.max(2, size * 0.045) : 0, borderColor: ring ?? 'transparent', backgroundColor: '#1B2338' }, style]}>
      <Avatar look={look} outfit={outfit} age={age} size={size} />
    </View>
  );
}
const genderFromName = (n: string) => (hash(n) % 2 ? 'Female' : 'Male');

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
  crime: { stops: ['#3A0F14', '#B3202F'], emoji: '🚨' },
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
