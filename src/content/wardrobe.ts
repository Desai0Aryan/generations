// The family closet. Every garment has a price and a "style" value: dress well and people notice.
// Add items here and they appear in the Closet automatically (the avatar draws them by id).
import type { GameState, Outfit } from '../engine/types.ts';

export type Slot = 'top' | 'outer' | 'hat' | 'glasses' | 'ears' | 'neck' | 'bg' | 'makeup';
export interface Garment {
  id: string; slot: Slot; label: string; price: number; style: number;
  colors: [string, string]; // main, accent (used by the avatar and the previews)
  premium?: string; // cosmetic pack id (unlocked by purchase)
  vibe?: string;
}

const G = (id: string, slot: Slot, label: string, price: number, style: number, c1: string, c2: string, extra: Partial<Garment> = {}): Garment =>
  ({ id, slot, label, price, style, colors: [c1, c2], ...extra });

export const GARMENTS: Garment[] = [
  // tops
  G('tee_white', 'top', 'White tee', 0, 1, '#F2F2F0', '#D9D9D4'),
  G('tee_navy', 'top', 'Navy tee', 0, 1, '#25364F', '#1B2A3F'),
  G('hoodie_grey', 'top', 'Grey hoodie', 0, 1, '#8D929B', '#6F747E'),
  G('tee_red', 'top', 'Red tee', 25, 1, '#C9403C', '#A63330'),
  G('tank_sport', 'top', 'Sport tank', 30, 1, '#2F8F83', '#256F66'),
  G('tee_graphic', 'top', 'Graphic tee', 35, 2, '#2B2B31', '#E8B83C'),
  G('polo', 'top', 'Polo shirt', 60, 3, '#3E6BB0', '#2F5489'),
  G('flannel', 'top', 'Flannel shirt', 70, 2, '#A5412E', '#6E2A1D'),
  G('hoodie_black', 'top', 'Black hoodie', 80, 2, '#1F2024', '#35373D'),
  G('sweater_cream', 'top', 'Cream sweater', 90, 3, '#E9DCC3', '#CDBE9F'),
  G('jersey', 'top', 'Team jersey', 120, 2, '#C23B3B', '#F2F2F0'),
  G('blouse', 'top', 'Silk blouse', 120, 4, '#E7B8C9', '#C98FA6'),
  G('dress_shirt', 'top', 'Dress shirt', 140, 4, '#E9EEF5', '#BFC8D6'),
  G('sundress', 'top', 'Summer sundress', 150, 4, '#F2B94B', '#D99A2E'),
  G('scrubs', 'top', 'Scrubs', 60, 1, '#4AA79C', '#357F77', { vibe: 'work' }),
  G('hivis', 'top', 'Hi-vis vest', 40, 0, '#E9A21F', '#C47F0E', { vibe: 'work' }),
  G('chef', 'top', 'Chef whites', 80, 2, '#F4F4F1', '#D4D4CD', { vibe: 'work' }),
  G('ldress', 'top', 'Little black dress', 380, 7, '#1B1B20', '#35353D'),
  G('suit', 'top', 'Tailored suit', 1400, 8, '#2B3345', '#E9EEF5'),
  G('suit_cream', 'top', 'Cream linen suit', 1700, 8, '#D8C9A8', '#F2EBDD'),
  G('tux', 'top', 'Tuxedo', 2800, 9, '#14141A', '#F2F2F0'),
  G('gown', 'top', 'Evening gown', 3200, 10, '#7A1F3D', '#B5456A'),
  G('gown_gold', 'top', 'Golden gown', 6500, 10, '#C9A24B', '#F0D88A', { premium: 'couture' }),
  G('streetwear', 'top', 'Designer streetwear', 900, 7, '#E9E9EC', '#E24B3F', { premium: 'street' }),
  G('tracksuit', 'top', 'Velour tracksuit', 650, 6, '#5B2E91', '#8B5BC9', { premium: 'street' }),
  G('prison', 'top', 'Prison orange', 0, -2, '#E4731B', '#B85611', { vibe: 'prison' }),
  // outer layers
  G('denim_j', 'outer', 'Denim jacket', 110, 3, '#4B6FA3', '#3A5885'),
  G('varsity', 'outer', 'Varsity jacket', 220, 4, '#7B1E2B', '#E9E2D0'),
  G('puffer', 'outer', 'Puffer coat', 300, 4, '#2D5B8C', '#1F4268'),
  G('blazer', 'outer', 'Blazer', 450, 6, '#33384A', '#232738'),
  G('leather_j', 'outer', 'Leather jacket', 600, 7, '#231E1D', '#3C3433'),
  G('trench', 'outer', 'Trench coat', 700, 7, '#B79B6B', '#8F7648'),
  G('furcoat', 'outer', 'Faux-fur coat', 2400, 9, '#E6DCD0', '#C9BBAA', { premium: 'couture' }),
  G('labcoat', 'outer', 'White coat', 90, 3, '#F5F6F8', '#D5D8DE', { vibe: 'work' }),
  // hats
  G('beanie', 'hat', 'Beanie', 25, 2, '#394B5E', '#2A3948'),
  G('cap', 'hat', 'Baseball cap', 30, 2, '#B83A36', '#8F2B28'),
  G('hardhat', 'hat', 'Hard hat', 40, 0, '#F2C230', '#CF9F14', { vibe: 'work' }),
  G('sunhat', 'hat', 'Sun hat', 60, 4, '#E7CF94', '#C6AC6B'),
  G('fedora', 'hat', 'Fedora', 120, 6, '#4A4036', '#2F2820'),
  G('cowboy', 'hat', 'Cowboy hat', 200, 5, '#8A6A45', '#6B4F2E'),
  G('crown', 'hat', 'Golden crown', 5000, 10, '#F0C54D', '#C99A1F', { premium: 'couture' }),
  // glasses
  G('g_round', 'glasses', 'Round glasses', 90, 4, '#2A2A2E', '#2A2A2E'),
  G('g_square', 'glasses', 'Square glasses', 90, 4, '#1E2B3A', '#1E2B3A'),
  G('g_aviator', 'glasses', 'Aviators', 200, 6, '#C9A24B', '#2A2A2E'),
  G('g_sun', 'glasses', 'Sunglasses', 150, 5, '#15151A', '#15151A'),
  G('g_cat', 'glasses', 'Cat-eye glasses', 180, 6, '#8B2D52', '#8B2D52'),
  // ears / neck
  G('e_stud', 'ears', 'Stud earrings', 80, 3, '#E5E5E8', '#C9C9CE'),
  G('e_hoop', 'ears', 'Gold hoops', 120, 4, '#E0B54A', '#B88F26'),
  G('e_diamond', 'ears', 'Diamond studs', 900, 7, '#F6FBFF', '#B9E0F5'),
  G('n_choker', 'neck', 'Choker', 60, 3, '#232328', '#232328'),
  G('n_scarf', 'neck', 'Wool scarf', 70, 3, '#B5453B', '#8F3028'),
  G('n_chain', 'neck', 'Gold chain', 300, 5, '#E0B54A', '#B88F26'),
  G('n_pearls', 'neck', 'Pearl necklace', 800, 7, '#F5F0E8', '#D9D1C2'),
  G('n_diamond', 'neck', 'Diamond necklace', 4200, 9, '#F6FBFF', '#B9E0F5', { premium: 'couture' }),
  // makeup
  G('mk_red', 'makeup', 'Red lipstick', 40, 3, '#B3202F', '#B3202F'),
  G('mk_berry', 'makeup', 'Berry lipstick', 40, 3, '#7D2144', '#7D2144'),
  G('mk_smoky', 'makeup', 'Smoky eyes', 70, 4, '#3A3140', '#B3202F'),
  G('mk_glam', 'makeup', 'Full glam', 200, 6, '#B64A6B', '#C9A24B'),
  // backgrounds
  G('bg_dawn', 'bg', 'Dawn', 0, 0, '#2E3A5C', '#E59A6F'),
  G('bg_sky', 'bg', 'Clear sky', 0, 0, '#4E86C4', '#BEE0F5'),
  G('bg_sunset', 'bg', 'Sunset', 50, 1, '#6B2E6B', '#F28C4A'),
  G('bg_forest', 'bg', 'Forest', 50, 1, '#1F4A3A', '#8CC59B'),
  G('bg_night', 'bg', 'City night', 100, 2, '#0F1530', '#5D4B9C'),
  G('bg_gold', 'bg', 'Gilded', 800, 4, '#6E5316', '#F0D88A'),
  G('bg_royal', 'bg', 'Royal court', 2500, 6, '#3A1450', '#C98BE0', { premium: 'couture' }),
  G('bg_neon', 'bg', 'Neon', 300, 3, '#16062E', '#F0409B', { premium: 'street' }),
];

export const GARMENT_BY_ID: Record<string, Garment> = Object.fromEntries(GARMENTS.map((g) => [g.id, g]));
export const SLOT_LABEL: Record<Slot, string> = { top: 'Tops', outer: 'Jackets', hat: 'Hats', glasses: 'Glasses', ears: 'Earrings', neck: 'Neck', makeup: 'Makeup', bg: 'Backdrops' };

/** how well put-together you look: 0-100. Prison orange hurts. */
export function styleScore(outfit: Outfit): number {
  const pts = ['top', 'outer', 'hat', 'glasses', 'ears', 'neck', 'makeup', 'bg'].reduce((a, k) => a + (GARMENT_BY_ID[(outfit as unknown as Record<string, string | undefined>)[k] ?? '']?.style ?? 0), 0);
  return Math.max(0, Math.min(100, pts * 4));
}
/** small bonus to how attractive you come across, from -4 to +8 */
export function styleBonus(s: GameState): number {
  const st = styleScore(s.wardrobe.outfit);
  const prison = !!s.legal?.prison;
  return prison ? -4 : Math.round((st - 16) / 8);
}

// ───────── hair salon & barber ─────────
export const SALON_PRICE: Record<string, number> = {
  bald: 0, buzz: 15, short: 30, fade: 40, crop: 30, quiff: 60, curly: 70, afro: 70, waves: 60, long: 80, bob: 70, ponytail: 50, bun: 50, braids: 150, pixie: 60, mohawk: 80,
};
export const HAIR_COLORS = ['#1B1512', '#2E2018', '#4A2E1C', '#6B4426', '#9B6A3A', '#C99B5B', '#E3C47D', '#B5442B', '#9A9AA2', '#D8D8DC'];
export const DYE_COLORS = ['#4C7BE0', '#B04CE0', '#E0489B', '#3FC7B3'];
