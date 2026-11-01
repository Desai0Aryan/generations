// A layered, hand-drawn-style human avatar made of vector shapes (react-native-svg).
// Face, skin tone, eyes, hair, facial hair, makeup, glasses, hats, jewellery and clothing are all separate layers,
// so the closet can mix and match them. The face ages: hair greys and lines appear.
import React, { useRef } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Look, Outfit } from '../engine/types.ts';
import { GARMENT_BY_ID, HAIR_COLORS, DYE_COLORS } from '../content/wardrobe.ts';
import { lerpColor } from './fx.ts';

export const SKIN_TONES = ['#FBE3CF', '#F5D0B0', '#EBB88F', '#D99B6C', '#BC7D4F', '#9B5E37', '#734226', '#4E2C1B'];
export const EYE_COLORS = ['#4A3220', '#6B4A2A', '#3C6E9E', '#4F7F5A', '#7A8B94', '#2B2B2B'];
export const ALL_HAIR_COLORS = [...HAIR_COLORS, ...DYE_COLORS];
const dark = (c: string, a: number) => lerpColor(c, '#000000', a);
const light = (c: string, a: number) => lerpColor(c, '#FFFFFF', a);

const FACES = [
  'M100 26 C128 26 146 48 146 78 C146 106 128 132 100 136 C72 132 54 106 54 78 C54 48 72 26 100 26Z',
  'M100 28 C132 28 150 50 150 80 C150 110 130 134 100 136 C70 134 50 110 50 80 C50 50 68 28 100 28Z',
  'M100 27 C128 27 146 44 146 72 C146 100 148 118 134 128 C122 136 112 138 100 138 C88 138 78 136 66 128 C52 118 54 100 54 72 C54 44 72 27 100 27Z',
  'M100 22 C126 22 142 44 142 74 C142 108 124 140 100 144 C76 140 58 108 58 74 C58 44 74 22 100 22Z',
];

const CAP = 'M54 74 C50 44 68 22 100 22 C132 22 150 44 146 74 C142 60 134 52 124 50 C110 56 90 56 76 50 C66 52 58 62 54 74Z';
const FRONT_WAVE = 'M52 88 C44 44 66 20 100 20 C134 20 156 44 148 88 C146 66 136 52 122 50 C110 58 86 56 72 48 C60 56 54 70 52 88Z';

interface HairPart { d?: string; circles?: [number, number, number][]; op?: number; shade?: boolean }
const HAIR: Record<string, { back?: HairPart[]; front?: HairPart[] }> = {
  bald: {},
  buzz: { front: [{ d: 'M56 72 C54 46 70 28 100 28 C130 28 146 46 144 72 C140 58 132 50 122 48 C110 52 90 52 78 48 C68 50 60 58 56 72Z', op: 0.78 }] },
  short: { front: [{ d: CAP }] },
  fade: { front: [{ d: 'M62 58 C64 34 80 22 100 22 C120 22 136 34 138 58 C128 46 114 42 100 42 C86 42 72 46 62 58Z' }, { d: 'M54 78 C52 56 58 46 64 48 L63 78Z M146 78 C148 56 142 46 136 48 L137 78Z', op: 0.4 }] },
  crop: { front: [{ d: 'M54 74 C48 42 70 22 100 22 C130 22 152 42 146 74 C142 62 138 56 130 54 L120 60 L108 52 L96 60 L84 52 L72 58 C62 58 58 66 54 74Z' }] },
  quiff: { front: [{ d: 'M56 72 C46 40 66 12 104 14 C140 14 154 40 144 72 C140 58 132 50 120 46 C104 40 88 44 80 50 C68 52 60 60 56 72Z' }] },
  curly: { front: [{ circles: [[62, 52, 15], [78, 34, 17], [100, 28, 18], [122, 34, 17], [138, 52, 15], [54, 72, 11], [146, 72, 11], [72, 48, 13], [128, 48, 13], [100, 44, 13]] }] },
  afro: { back: [{ circles: [[100, 52, 54]] }], front: [] },
  waves: { back: [{ d: 'M50 92 C42 104 46 130 56 142 L80 124 L120 124 L144 142 C154 130 158 104 150 92 C150 60 130 40 100 40 C70 40 50 60 50 92Z' }], front: [{ d: FRONT_WAVE }] },
  long: { back: [{ d: 'M48 80 C44 40 70 16 100 16 C130 16 156 40 152 80 L160 156 C158 176 140 184 126 180 L128 122 L72 122 L74 180 C60 184 42 176 40 156Z' }], front: [{ d: 'M52 92 C42 44 66 18 100 18 C132 18 158 44 148 92 C146 70 136 52 118 46 C100 60 74 54 64 70 C58 74 54 82 52 92Z' }] },
  bob: { back: [{ d: 'M48 86 C44 40 70 16 100 16 C130 16 156 40 152 86 L154 128 C140 136 122 130 122 130 L78 130 C78 130 60 136 46 128Z' }], front: [{ d: FRONT_WAVE }] },
  ponytail: { back: [{ d: 'M138 48 C164 42 182 72 174 104 C170 124 156 130 150 120 C160 100 156 80 138 72Z' }], front: [{ d: CAP }] },
  bun: { back: [{ circles: [[100, 14, 17]] }], front: [{ d: CAP }] },
  braids: { back: [{ circles: [[60, 104, 9], [58, 120, 9], [58, 136, 9], [60, 152, 9], [62, 168, 8], [140, 104, 9], [142, 120, 9], [142, 136, 9], [140, 152, 9], [138, 168, 8]] }], front: [{ d: CAP }] },
  pixie: { front: [{ d: 'M54 76 C46 44 68 20 102 20 C136 20 152 44 146 76 C142 62 134 56 122 52 C112 46 96 50 84 54 C70 54 60 62 54 76Z' }, { d: 'M84 54 C100 44 122 48 134 58 C120 52 100 52 84 54Z', op: 0.5, shade: true }] },
  mohawk: { front: [{ d: 'M86 22 C92 2 108 2 114 22 L116 58 C108 50 92 50 84 58Z' }, { d: 'M56 72 C54 50 62 40 70 42 L66 72Z M144 72 C146 50 138 40 130 42 L134 72Z', op: 0.35 }] },
};

let counter = 0;

interface Props {
  look: Look; outfit?: Outfit; age?: number; size?: number; gender?: string; hat?: boolean; bare?: boolean;
}

/** Renders the person. `bare` hides clothes and accessories (used by closet previews of single items). */
export function Avatar({ look, outfit, age = 25, size = 120, hat = true, bare = false }: Props) {
  const ref = useRef(0);
  if (!ref.current) ref.current = ++counter;
  const id = `av${ref.current}`;
  const skin = SKIN_TONES[look.skin % SKIN_TONES.length];
  const skinD = dark(skin, 0.18);
  const skinDD = dark(skin, 0.34);
  const skinL = light(skin, 0.22);
  const baby = age < 3;
  const kid = age < 13;
  // hair: grey with age
  let hairC = ALL_HAIR_COLORS[look.hairColor % ALL_HAIR_COLORS.length];
  if (look.hairColor < 10) {
    if (age >= 70) hairC = lerpColor(hairC, '#D8D8DC', 0.9);
    else if (age >= 45) hairC = lerpColor(hairC, '#B8B8C0', (age - 45) / 38);
  }
  const hairD = dark(hairC, 0.3);
  const hairL = light(hairC, 0.25);
  const eyeC = EYE_COLORS[look.eyes % EYE_COLORS.length];
  const lipBase = lerpColor(skin, '#B04B5A', look.skin >= 6 ? 0.35 : 0.45);
  const mk = outfit?.makeup ? GARMENT_BY_ID[outfit.makeup] : undefined;
  const lipC = mk && (mk.id === 'mk_red' || mk.id === 'mk_berry' || mk.id === 'mk_glam') ? mk.colors[0] : lipBase;
  const top = !bare && outfit ? GARMENT_BY_ID[outfit.top] : undefined;
  const outer = !bare && outfit?.outer ? GARMENT_BY_ID[outfit.outer] : undefined;
  const bg = outfit ? GARMENT_BY_ID[outfit.bg] : undefined;
  const hairStyle = baby ? 'bald' : look.hair;
  const hairDef = HAIR[hairStyle] ?? HAIR.short;
  const hatG = !bare && hat && outfit?.hat ? GARMENT_BY_ID[outfit.hat] : undefined;
  const sb = look.build === 0 ? 0.92 : look.build === 2 ? 1.1 : 1;
  const wrinkle = Math.max(0, Math.min(0.5, (age - 38) / 70));
  const faceD = FACES[look.face % FACES.length];
  const headScale = baby ? 1.14 : kid ? 1.07 : 1;
  const bodyScale = baby ? 0.7 : kid ? 0.84 : 1;

  const rim = (c: string) => dark(c, 0.22);

  const part = (h: HairPart, i: number, key: string) => {
    const fill = h.shade ? hairD : `url(#${id}h)`;
    return (
      <G key={key + i} opacity={h.op ?? 1}>
        {h.d ? <Path d={h.d} fill={fill} /> : null}
        {h.circles?.map(([cx, cy, r], j) => <Circle key={j} cx={cx} cy={cy} r={r} fill={fill} />)}
      </G>
    );
  };

  // ───────── clothing ─────────
  const torso = `M${100 - 86 * sb} 212 C${100 - 84 * sb} 168 ${100 - 56 * sb} 152 ${100 - 20 * sb} 146 L${100 + 20 * sb} 146 C${100 + 56 * sb} 152 ${100 + 84 * sb} 168 ${100 + 86 * sb} 212Z`;
  const dressNames = ['sundress', 'ldress', 'gown', 'gown_gold'];
  const isDress = !!top && dressNames.includes(top.id);
  const strapless = !!top && (top.id === 'gown' || top.id === 'gown_gold' || top.id === 'ldress');
  const collarKind = top && ['polo', 'dress_shirt', 'blouse', 'chef', 'flannel', 'labcoat'].includes(top.id);
  const hoodie = top && (top.id === 'hoodie_grey' || top.id === 'hoodie_black');
  const suit = top && ['suit', 'suit_cream', 'tux'].includes(top.id);

  const clothes = () => {
    if (!top) return null;
    const [c1, c2] = top.colors;
    const els: React.ReactNode[] = [];
    if (hoodie) els.push(<Path key="hood" d="M62 142 C62 120 84 112 100 118 C116 112 138 120 138 142Z" fill={dark(c1, 0.25)} />);
    // base body
    if (strapless) {
      els.push(<Path key="sk" d={torso} fill={`url(#${id}s)`} />);
      els.push(<Path key="b" d={`M${100 - 86 * sb} 212 L${100 - 82 * sb} 176 Q${100 - 46} 164 100 180 Q${100 + 46} 164 ${100 + 82 * sb} 176 L${100 + 86 * sb} 212Z`} fill={`url(#${id}c)`} />);
      els.push(<Path key="r" d={`M${100 - 82 * sb} 176 Q${100 - 46} 164 100 180 Q${100 + 46} 164 ${100 + 82 * sb} 176`} fill="none" stroke={rim(c1)} strokeWidth={1.5} />);
    } else if (top.id === 'sundress') {
      els.push(<Path key="sk" d={torso} fill={`url(#${id}s)`} />);
      els.push(<Path key="b" d={`M${100 - 86 * sb} 212 L${100 - 80 * sb} 172 Q100 196 ${100 + 80 * sb} 172 L${100 + 86 * sb} 212Z`} fill={`url(#${id}c)`} />);
      els.push(<Path key="s1" d={`M${100 - 52 * sb} 156 L${100 - 62 * sb} 178 L${100 - 46 * sb} 180 L${100 - 38 * sb} 152Z`} fill={c1} />);
      els.push(<Path key="s2" d={`M${100 + 52 * sb} 156 L${100 + 62 * sb} 178 L${100 + 46 * sb} 180 L${100 + 38 * sb} 152Z`} fill={c1} />);
    } else {
      els.push(<Path key="b" d={torso} fill={`url(#${id}c)`} />);
      // fold shadows
      els.push(<Path key="f1" d={`M${100 - 70 * sb} 212 C${100 - 66 * sb} 186 ${100 - 52 * sb} 168 ${100 - 36 * sb} 158`} stroke={dark(c1, 0.22)} strokeWidth={2} fill="none" opacity={0.5} />);
      els.push(<Path key="f2" d={`M${100 + 70 * sb} 212 C${100 + 66 * sb} 186 ${100 + 52 * sb} 168 ${100 + 36 * sb} 158`} stroke={dark(c1, 0.22)} strokeWidth={2} fill="none" opacity={0.5} />);
    }
    // necklines
    if (isDress && !strapless) {
      // scoop hole already shown by the dress shape
    } else if (suit || collarKind) {
      const inner = suit ? (top.id === 'tux' ? '#F2F2F0' : '#EEF1F6') : c1;
      if (suit) {
        els.push(<Path key="v" d="M82 146 L100 196 L118 146Z" fill={inner} />);
        els.push(<Path key="cl" d="M84 142 L98 168 L100 150 L92 138Z M116 142 L102 168 L100 150 L108 138Z" fill="#FFFFFF" stroke={rim('#FFFFFF')} strokeWidth={0.8} />);
        els.push(<Path key="la" d="M64 154 L90 150 L100 200 L82 186Z" fill={dark(c1, 0.12)} />);
        els.push(<Path key="lb" d="M136 154 L110 150 L100 200 L118 186Z" fill={dark(c1, 0.12)} />);
        if (top.id === 'tux') els.push(<Path key="bt" d="M90 150 L110 150 L106 158 L94 158Z M96 150 L104 150 L104 158 L96 158Z" fill="#101014" />);
        else els.push(<Path key="tie" d="M97 152 L103 152 L106 192 L100 200 L94 192Z" fill={c2 === '#E9EEF5' ? '#8B2332' : '#8B2332'} />);
      } else {
        els.push(<Path key="v" d="M86 144 L100 172 L114 144 L114 138 L86 138Z" fill={skin} />);
        els.push(<Path key="cl" d="M80 140 L98 176 L102 154 L90 136Z M120 140 L102 176 L98 154 L110 136Z" fill={light(c1, 0.15)} stroke={rim(c1)} strokeWidth={1} />);
        [182, 194, 206].forEach((y, i) => els.push(<Circle key={'bt' + i} cx={100} cy={y} r={2} fill={rim(c1)} />));
      }
    } else if (!strapless && top.id !== 'sundress') {
      const v = ['tee_red', 'blouse'].includes(top.id);
      els.push(<Path key="nh" d={v ? 'M82 146 L100 170 L118 146 L118 138 L82 138Z' : 'M82 146 Q100 164 118 146 L118 138 L82 138Z'} fill={skin} />);
      els.push(<Path key="nr" d={v ? 'M82 146 L100 170 L118 146' : 'M82 146 Q100 164 118 146'} fill="none" stroke={rim(c1)} strokeWidth={2.4} />);
      if (hoodie) {
        els.push(<Path key="ds1" d="M92 160 L90 190" stroke="#EDEDED" strokeWidth={2} />);
        els.push(<Path key="ds2" d="M108 160 L110 190" stroke="#EDEDED" strokeWidth={2} />);
      }
      if (top.id === 'jersey') els.push(<Path key="n" d="M66 170 L134 170" stroke={c2} strokeWidth={4} opacity={0.9} />);
      if (top.id === 'tee_graphic') els.push(<Circle key="g" cx={100} cy={190} r={11} fill={c2} opacity={0.9} />);
      if (top.id === 'hivis') els.push(<Path key="h" d="M70 176 L130 176 M70 192 L130 192" stroke="#E9E9E9" strokeWidth={4} />);
      if (top.id === 'scrubs') els.push(<Path key="sc" d="M82 146 L100 176 L118 146" fill="none" stroke={dark(c1, 0.3)} strokeWidth={2.4} />);
    }
    // outer layer
    if (outer) {
      const [o1, o2] = outer.colors;
      els.push(<Path key="o1" d={`M${100 - 86 * sb} 212 C${100 - 84 * sb} 168 ${100 - 56 * sb} 152 ${100 - 20 * sb} 146 L${100 - 8} 148 L${100 - 18} 212Z`} fill={o1} />);
      els.push(<Path key="o2" d={`M${100 + 86 * sb} 212 C${100 + 84 * sb} 168 ${100 + 56 * sb} 152 ${100 + 20 * sb} 146 L${100 + 8} 148 L${100 + 18} 212Z`} fill={o1} />);
      els.push(<Path key="ol" d={`M${100 - 22 * sb} 146 L${100 - 8} 150 L${100 - 14} 178 L${100 - 32 * sb} 160Z`} fill={light(o1, 0.12)} stroke={dark(o1, 0.3)} strokeWidth={0.8} />);
      els.push(<Path key="or" d={`M${100 + 22 * sb} 146 L${100 + 8} 150 L${100 + 14} 178 L${100 + 32 * sb} 160Z`} fill={light(o1, 0.12)} stroke={dark(o1, 0.3)} strokeWidth={0.8} />);
      if (outer.id === 'varsity') els.push(<Path key="ov" d={`M${100 - 84 * sb} 190 L${100 - 22} 190 M${100 + 22} 190 L${100 + 84 * sb} 190`} stroke={o2} strokeWidth={5} />);
      if (outer.id === 'puffer') [168, 184, 200].forEach((y) => els.push(<Path key={'p' + y} d={`M${100 - 80 * sb} ${y} L${100 - 14} ${y} M${100 + 14} ${y} L${100 + 80 * sb} ${y}`} stroke={dark(o1, 0.35)} strokeWidth={2} />));
      if (outer.id === 'leather_j') els.push(<Path key="zi" d="M100 150 L100 212" stroke="#B9B9BE" strokeWidth={1.6} />);
      if (outer.id === 'trench') els.push(<Path key="tb" d={`M${100 - 84 * sb} 194 L${100 + 84 * sb} 194`} stroke={dark(o1, 0.3)} strokeWidth={6} />);
    }
    return els;
  };

  // ───────── accessories ─────────
  const g = outfit?.glasses ? GARMENT_BY_ID[outfit.glasses] : undefined;
  const glasses = () => {
    if (bare || !g) return null;
    const c = g.colors[0];
    const sun = g.id === 'g_sun';
    const lens = sun ? '#111116' : 'rgba(190,220,255,0.18)';
    if (g.id === 'g_square') return (
      <G>
        <Rect x={64} y={68} width={32} height={22} rx={5} fill={lens} stroke={c} strokeWidth={3} />
        <Rect x={104} y={68} width={32} height={22} rx={5} fill={lens} stroke={c} strokeWidth={3} />
        <Path d="M96 76 L104 76 M64 74 L54 72 M136 74 L146 72" stroke={c} strokeWidth={3} fill="none" />
      </G>
    );
    if (g.id === 'g_cat') return (
      <G>
        <Path d="M62 80 C62 70 72 66 82 68 L96 74 C98 86 90 92 80 92 C70 92 62 88 62 80Z" fill={lens} stroke={c} strokeWidth={3} />
        <Path d="M138 80 C138 70 128 66 118 68 L104 74 C102 86 110 92 120 92 C130 92 138 88 138 80Z" fill={lens} stroke={c} strokeWidth={3} />
        <Path d="M96 76 L104 76" stroke={c} strokeWidth={3} />
      </G>
    );
    if (g.id === 'g_aviator') return (
      <G>
        <Path d="M64 70 L96 70 C96 86 88 94 80 94 C70 94 64 84 64 70Z" fill={sun ? '#111116' : 'rgba(120,140,150,0.45)'} stroke={g.colors[0]} strokeWidth={2.6} />
        <Path d="M136 70 L104 70 C104 86 112 94 120 94 C130 94 136 84 136 70Z" fill={sun ? '#111116' : 'rgba(120,140,150,0.45)'} stroke={g.colors[0]} strokeWidth={2.6} />
        <Path d="M96 72 L104 72" stroke={g.colors[0]} strokeWidth={2.6} />
      </G>
    );
    return (
      <G>
        <Circle cx={80} cy={80} r={14} fill={lens} stroke={c} strokeWidth={3} />
        <Circle cx={120} cy={80} r={14} fill={lens} stroke={c} strokeWidth={3} />
        <Path d="M94 79 Q100 74 106 79 M66 78 L54 74 M134 78 L146 74" stroke={c} strokeWidth={3} fill="none" />
      </G>
    );
  };

  const hatEl = () => {
    if (!hatG) return null;
    const [h1, h2] = hatG.colors;
    switch (hatG.id) {
      case 'beanie': return (<G><Path d="M52 68 C50 30 76 12 100 12 C124 12 150 30 148 68 C130 58 70 58 52 68Z" fill={h1} /><Path d="M51 62 C70 52 130 52 149 62 L150 74 C130 64 70 64 50 74Z" fill={h2} /></G>);
      case 'cap': return (<G><Path d="M54 64 C52 28 76 14 100 14 C124 14 148 28 146 64 C128 54 72 54 54 64Z" fill={h1} /><Path d="M60 62 C90 54 140 56 168 66 C164 74 130 70 100 68 C80 66 64 68 60 62Z" fill={h2} /></G>);
      case 'hardhat': return (<G><Path d="M54 64 C52 26 76 12 100 12 C124 12 148 26 146 64 Z" fill={h1} /><Path d="M46 62 L154 62 L154 70 L46 70Z" fill={h2} /><Path d="M96 14 L104 14 L104 60 L96 60Z" fill={h2} opacity={0.5} /></G>);
      case 'sunhat': return (<G><Ellipse cx={100} cy={58} rx={82} ry={14} fill={h2} /><Path d="M62 58 C62 20 138 20 138 58Z" fill={h1} /><Path d="M62 54 L138 54 L138 60 L62 60Z" fill="#B5453B" /></G>);
      case 'fedora': return (<G><Ellipse cx={100} cy={56} rx={66} ry={12} fill={h2} /><Path d="M66 56 C64 24 80 14 100 20 C120 14 136 24 134 56Z" fill={h1} /><Path d="M66 50 L134 50 L134 58 L66 58Z" fill="#14141A" /></G>);
      case 'cowboy': return (<G><Path d="M30 52 C50 66 150 66 170 52 C160 70 130 66 100 66 C70 66 40 70 30 52Z" fill={h2} /><Path d="M62 56 C60 24 76 14 100 18 C124 14 140 24 138 56Z" fill={h1} /><Path d="M62 50 L138 50 L138 56 L62 56Z" fill="#3A2A1C" /></G>);
      case 'crown': return (<G><Path d="M60 52 L68 16 L86 36 L100 8 L114 36 L132 16 L140 52Z" fill={h1} stroke={h2} strokeWidth={2} /><Circle cx={100} cy={30} r={4} fill="#D42B4A" /><Circle cx={74} cy={34} r={3} fill="#2B7BD4" /><Circle cx={126} cy={34} r={3} fill="#2B7BD4" /></G>);
    }
    return null;
  };

  const ear = outfit?.ears ? GARMENT_BY_ID[outfit.ears] : undefined;
  const neck = !bare && outfit?.neck ? GARMENT_BY_ID[outfit.neck] : undefined;

  return (
    <Svg width={size} height={size} viewBox="0 6 200 194">
      <Defs>
        <LinearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={bg?.colors[0] ?? '#2E3A5C'} />
          <Stop offset="1" stopColor={bg?.colors[1] ?? '#E59A6F'} />
        </LinearGradient>
        <RadialGradient id={`${id}f`} cx="0.45" cy="0.38" r="0.75">
          <Stop offset="0" stopColor={skinL} />
          <Stop offset="0.55" stopColor={skin} />
          <Stop offset="1" stopColor={skinD} />
        </RadialGradient>
        <LinearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={skin} />
          <Stop offset="1" stopColor={skinD} />
        </LinearGradient>
        <LinearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={skinDD} />
          <Stop offset="0.4" stopColor={skinD} />
          <Stop offset="1" stopColor={skin} />
        </LinearGradient>
        <LinearGradient id={`${id}h`} x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor={hairL} />
          <Stop offset="0.5" stopColor={hairC} />
          <Stop offset="1" stopColor={hairD} />
        </LinearGradient>
        <LinearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={top ? light(top.colors[0], 0.1) : '#888'} />
          <Stop offset="1" stopColor={top ? dark(top.colors[0], 0.18) : '#555'} />
        </LinearGradient>
        <ClipPath id={`${id}clip`}><Path d={faceD} /></ClipPath>
      </Defs>
      <Rect x={0} y={0} width={200} height={206} fill={`url(#${id}bg)`} />
      <Ellipse cx={100} cy={206} rx={120} ry={40} fill="#000000" opacity={0.14} />

      <G transform={`translate(${100 - 100 * bodyScale} ${(1 - bodyScale) * 150}) scale(${bodyScale})`}>
        {hairDef.back?.map((h, i) => part(h, i, 'b'))}
        {/* neck */}
        <Path d="M84 104 L84 146 C92 160 108 160 116 146 L116 104Z" fill={`url(#${id}n)`} />
        {/* body & clothes (skin first so bare shoulders look right) */}
        {top ? null : <Path d={torso} fill={`url(#${id}s)`} />}
        {clothes()}
        {neck && neck.id !== 'n_scarf' && <NeckAcc g={neck} />}
      </G>

      <G transform={`translate(${100 - 100 * headScale} ${(1 - headScale) * 90}) scale(${headScale})`}>
        {/* ears */}
        <Ellipse cx={55} cy={86} rx={6} ry={11} fill={skinD} />
        <Ellipse cx={145} cy={86} rx={6} ry={11} fill={skinD} />
        <Ellipse cx={55} cy={86} rx={3} ry={7} fill={skinDD} opacity={0.35} />
        <Ellipse cx={145} cy={86} rx={3} ry={7} fill={skinDD} opacity={0.35} />
        {ear && !bare ? <EarAcc g={ear} /> : null}
        {/* head */}
        <Path d={faceD} fill={`url(#${id}f)`} />
        <G clipPath={`url(#${id}clip)`}>
          {/* jaw & under-chin shadow */}
          <Ellipse cx={100} cy={162} rx={50} ry={20} fill={skinDD} opacity={0.22} />
          {/* cheeks */}
          <Ellipse cx={70} cy={104} rx={13} ry={8} fill={mk?.id === 'mk_glam' ? '#E08AA0' : '#E08A8A'} opacity={mk?.id === 'mk_glam' ? 0.35 : 0.14} />
          <Ellipse cx={130} cy={104} rx={13} ry={8} fill={mk?.id === 'mk_glam' ? '#E08AA0' : '#E08A8A'} opacity={mk?.id === 'mk_glam' ? 0.35 : 0.14} />
        </G>
        {look.freckles ? [[78, 98], [84, 102], [72, 102], [90, 99], [122, 98], [116, 102], [128, 102], [110, 99]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={1.3} fill={skinDD} opacity={0.55} />) : null}
        {/* wrinkles */}
        {wrinkle > 0 ? (
          <G opacity={wrinkle} stroke={skinDD} strokeWidth={1.2} fill="none">
            <Path d="M74 56 Q100 50 126 56" />
            <Path d="M76 62 Q100 57 124 62" />
            <Path d="M62 80 L55 76 M62 85 L54 86" />
            <Path d="M138 80 L145 76 M138 85 L146 86" />
            <Path d="M82 108 Q76 118 82 126 M118 108 Q124 118 118 126" />
            {age > 60 ? <Path d="M72 92 Q80 98 90 92 M110 92 Q120 98 128 92" /> : null}
          </G>
        ) : null}
        {/* brows */}
        <Brows look={look} hairD={hairD} baby={baby} />
        {/* eyes */}
        <Eye cx={80} cy={80} iris={eyeC} skinDD={skinDD} lash={mk?.id === 'mk_smoky' || mk?.id === 'mk_glam' || false} shadow={mk?.id === 'mk_smoky' || mk?.id === 'mk_glam' ? mk.colors[0] : undefined} big={kid} />
        <Eye cx={120} cy={80} iris={eyeC} skinDD={skinDD} lash={mk?.id === 'mk_smoky' || mk?.id === 'mk_glam' || false} shadow={mk?.id === 'mk_smoky' || mk?.id === 'mk_glam' ? mk.colors[0] : undefined} big={kid} />
        {/* nose */}
        <Nose n={look.nose} skinD={skinD} skinDD={skinDD} skinL={skinL} />
        {/* mouth */}
        <Mouth l={look.lips} lipC={lipC} skinDD={skinDD} />
        {/* facial hair */}
        {look.facial !== 'none' && age >= 15 ? <Facial kind={look.facial} c={hairC} d={hairD} /> : null}
        {/* hair front */}
        {hairDef.front?.map((h, i) => part(h, i, 'f'))}
        {baby ? <Path d="M96 28 C100 18 108 22 106 30" stroke={hairD} strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
        {glasses()}
        {hatEl()}
      </G>
      {neck && neck.id === 'n_scarf' ? <NeckAcc g={neck} /> : null}
    </Svg>
  );
}

function NeckAcc({ g }: { g: { id: string; colors: [string, string] } }) {
  const [a, b] = g.colors;
  switch (g.id) {
    case 'n_choker': return <Path d="M84 130 Q100 142 116 130" stroke={a} strokeWidth={4} fill="none" />;
    case 'n_scarf': return (<G><Path d="M74 128 Q100 148 126 128 L128 144 Q100 164 72 144Z" fill={a} /><Path d="M108 150 L124 152 L120 190 L104 186Z" fill={b} /></G>);
    case 'n_chain': return <Path d="M82 140 Q100 168 118 140" stroke={a} strokeWidth={2.4} fill="none" />;
    case 'n_pearls': return (<G>{Array.from({ length: 11 }, (_, i) => { const t = i / 10; const x = 82 + t * 36; const y = 140 + Math.sin(t * Math.PI) * 24; return <Circle key={i} cx={x} cy={y} r={3} fill={a} stroke={b} strokeWidth={0.6} />; })}</G>);
    case 'n_diamond': return (<G><Path d="M82 140 Q100 166 118 140" stroke="#CFCFD4" strokeWidth={1.6} fill="none" /><Path d="M100 164 L95 170 L100 178 L105 170Z" fill={a} stroke={b} strokeWidth={1} /></G>);
  }
  return null;
}
function EarAcc({ g }: { g: { id: string; colors: [string, string] } }) {
  const [a, b] = g.colors;
  if (g.id === 'e_hoop') return (<G><Circle cx={54} cy={100} r={7} fill="none" stroke={a} strokeWidth={2} /><Circle cx={146} cy={100} r={7} fill="none" stroke={a} strokeWidth={2} /></G>);
  return (<G><Circle cx={55} cy={97} r={3} fill={a} stroke={b} strokeWidth={0.8} /><Circle cx={145} cy={97} r={3} fill={a} stroke={b} strokeWidth={0.8} /></G>);
}

function Eye({ cx, cy, iris, skinDD, lash, shadow, big }: { cx: number; cy: number; iris: string; skinDD: string; lash: boolean; shadow?: string; big: boolean }) {
  const rx = big ? 10.5 : 9.5;
  const ry = big ? 7 : 5.6;
  const ir = big ? 5.2 : 4.6;
  const dir = cx < 100 ? -1 : 1;
  return (
    <G>
      {shadow ? <Ellipse cx={cx} cy={cy - 4} rx={rx + 3} ry={ry + 2} fill={shadow} opacity={0.4} /> : null}
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#F7F5F2" />
      <Circle cx={cx} cy={cy + 0.4} r={ir} fill={iris} />
      <Circle cx={cx} cy={cy + 0.4} r={ir * 0.5} fill="#0C0A0A" />
      <Circle cx={cx - 1.6} cy={cy - 1.6} r={1.5} fill="#FFFFFF" opacity={0.9} />
      <Path d={`M${cx - rx - 0.5} ${cy + 0.5} Q${cx} ${cy - ry * 1.9} ${cx + rx + 0.5} ${cy + 0.5}`} stroke={lash ? '#1A1214' : skinDD} strokeWidth={lash ? 2.6 : 1.9} fill="none" strokeLinecap="round" />
      <Path d={`M${cx - rx + 1} ${cy + ry * 0.8} Q${cx} ${cy + ry * 1.4} ${cx + rx - 1} ${cy + ry * 0.8}`} stroke={skinDD} strokeWidth={0.8} fill="none" opacity={0.5} />
      {lash ? <Path d={`M${cx + dir * (rx + 0.5)} ${cy - 0.5} L${cx + dir * (rx + 4)} ${cy - 3}`} stroke="#1A1214" strokeWidth={1.8} strokeLinecap="round" /> : null}
    </G>
  );
}

function Brows({ look, hairD, baby }: { look: Look; hairD: string; baby: boolean }) {
  const c = dark(hairD, 0.1);
  const w = look.brow === 1 ? 4.2 : look.brow === 2 ? 2.2 : 3;
  const arch = look.brow === 2 ? 10 : 6;
  if (baby) return null;
  return (
    <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" opacity={0.9}>
      <Path d={`M66 ${68} Q80 ${68 - arch} 94 68`} />
      <Path d={`M106 68 Q120 ${68 - arch} 134 68`} />
    </G>
  );
}

function Nose({ n, skinD, skinDD, skinL }: { n: number; skinD: string; skinDD: string; skinL: string }) {
  const w = n === 0 ? 7 : n === 1 ? 9 : 11;
  return (
    <G>
      <Path d={`M98 82 C97 94 96 100 ${100 - w} 106`} stroke={skinD} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d={`M${100 - w} 106 Q100 114 ${100 + w} 106`} stroke={skinDD} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
      <Ellipse cx={100 - w + 1} cy={106} rx={2.2} ry={1.6} fill={skinDD} opacity={0.55} />
      <Ellipse cx={100 + w - 1} cy={106} rx={2.2} ry={1.6} fill={skinDD} opacity={0.55} />
      <Ellipse cx={102} cy={95} rx={2.4} ry={8} fill={skinL} opacity={0.4} />
    </G>
  );
}

function Mouth({ l, lipC, skinDD }: { l: number; lipC: string; skinDD: string }) {
  const th = l === 0 ? 3.2 : l === 1 ? 4.4 : 5.6;
  return (
    <G>
      <Path d={`M84 120 Q92 ${120 - th} 100 ${118 - th * 0.4} Q108 ${120 - th} 116 120 Q108 ${126 + th} 100 ${126 + th} Q92 ${126 + th} 84 120Z`} fill={lipC} />
      <Path d="M84 120 Q100 124 116 120" stroke={dark(lipC, 0.45)} strokeWidth={1.3} fill="none" />
      <Path d={`M92 ${124 + th * 0.5} Q100 ${126 + th} 108 ${124 + th * 0.5}`} stroke="#FFFFFF" strokeWidth={1.4} fill="none" opacity={0.28} />
      <Path d="M83 119 Q80 121 82 124 M117 119 Q120 121 118 124" stroke={skinDD} strokeWidth={1} fill="none" opacity={0.4} />
    </G>
  );
}

function Facial({ kind, c, d }: { kind: string; c: string; d: string }) {
  const beard = 'M56 96 C58 126 76 142 100 144 C124 142 142 126 144 96 C140 112 128 118 100 118 C72 118 60 112 56 96Z';
  switch (kind) {
    case 'stubble': return <Path d={beard} fill={d} opacity={0.35} />;
    case 'mustache': return <Path d="M82 114 Q92 108 100 112 Q108 108 118 114 Q108 118 100 116 Q92 118 82 114Z" fill={c} />;
    case 'goatee': return (<G><Path d="M82 114 Q92 108 100 112 Q108 108 118 114 Q108 118 100 116 Q92 118 82 114Z" fill={c} /><Path d="M90 128 Q100 146 110 128 Q100 132 90 128Z" fill={c} /></G>);
    case 'beard': return (<G><Path d={beard} fill={c} opacity={0.94} /><Path d="M82 118 Q100 112 118 118 Q100 126 82 118Z" fill={dark('#B04B5A', 0.1)} opacity={0.5} /></G>);
    case 'fullbeard': return (<G><Path d="M54 88 C54 130 74 152 100 154 C126 152 146 130 146 88 C142 112 128 120 100 120 C72 120 58 112 54 88Z" fill={c} /><Path d="M84 116 Q100 110 116 116 Q100 126 84 116Z" fill="#9B4A58" opacity={0.7} /></G>);
  }
  return null;
}
