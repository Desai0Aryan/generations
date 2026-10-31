// Everything you can sell. Add a row here + create the same product id in App Store Connect.
// Content packs live in src/content/index.ts; this file lists cosmetics and the catalog shape the shop reads.
import { PACKS } from '../content/index.ts';

export type ProductKind = 'pack' | 'theme';

export interface Product {
  id: string; // App Store product id
  kind: ProductKind;
  refId: string; // pack id or theme id
  name: string;
  blurb: string;
  priceLabel: string;
}

export const THEMES = [
  { id: 'teal', name: 'Lumen Teal', accent: '#4FD1B5', free: true },
  { id: 'gold', name: 'Heirloom Gold', accent: '#E0B866', free: false },
  { id: 'violet', name: 'Twilight Violet', accent: '#A58BF5', free: false },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const PRODUCTS: Product[] = [
  ...PACKS.filter((p) => p.premium && p.productId).map(
    (p): Product => ({
      id: p.productId!,
      kind: 'pack',
      refId: p.id,
      name: p.name,
      blurb: p.tagline,
      priceLabel: p.priceLabel ?? '$2.99',
    }),
  ),
  {
    id: 'com.yourstudio.generations.theme.gold',
    kind: 'theme',
    refId: 'gold',
    name: 'Heirloom Gold theme',
    blurb: 'A warm golden accent for your family crest.',
    priceLabel: '$0.99',
  },
  {
    id: 'com.yourstudio.generations.theme.violet',
    kind: 'theme',
    refId: 'violet',
    name: 'Twilight Violet theme',
    blurb: 'A deep violet accent for night owls.',
    priceLabel: '$0.99',
  },
];
