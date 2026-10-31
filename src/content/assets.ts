// Everything you can buy. Add a row and it shows up in the Stuff tab.
// Homes and cars can be financed; the engine tracks the loan and charges yearly payments.
import type { AssetKind, Condition, Effect } from '../engine/types.ts';
import { flag, hasFlag, mem, skill, stat } from './dsl.ts';

export interface CatalogItem {
  id: string;
  kind: AssetKind;
  name: string;
  emoji: string;
  blurb: string;
  price: number;
  upkeep: number; // per year (homes also pay ~1.1% property tax on top)
  rate: number; // yearly value change
  minAge: number;
  requires?: Condition[];
  requireText?: string;
  finance?: { down: number; rate: number; years: number };
  effects?: Effect[];
}

const car = (id: string, name: string, emoji: string, blurb: string, price: number, upkeep: number, extra: Partial<CatalogItem> = {}): CatalogItem => ({
  id, kind: 'car', name, emoji, blurb, price, upkeep, rate: -0.11, minAge: 16, requires: [hasFlag('licensed')], requireText: 'Needs a driver\'s license',
  finance: { down: 0.1, rate: 0.069, years: 5 }, ...extra,
});
const home = (id: string, name: string, emoji: string, blurb: string, price: number, extra: Partial<CatalogItem> = {}): CatalogItem => ({
  id, kind: 'home', name, emoji, blurb, price, upkeep: Math.round(price * 0.008), rate: 0.035, minAge: 21,
  finance: { down: 0.2, rate: 0.065, years: 30 }, ...extra,
});

export const CATALOG: CatalogItem[] = [
  car('car_beater', 'Used Hatchback', '🚗', 'Dented, dependable, mostly.', 4500, 1500),
  car('car_sedan', 'Reliable Sedan', '🚙', 'The sensible choice.', 19000, 2400, { effects: [stat('reputation', 1)] }),
  car('car_suv', 'Family SUV', '🚐', 'Room for kids, dogs and groceries.', 36000, 3000, { effects: [stat('happiness', 2)] }),
  car('car_sports', 'Sports Coupe', '🏎️', 'Loud, low and very you.', 78000, 4800, { effects: [stat('reputation', 4), stat('looks', 2), stat('happiness', 4)] }),
  car('car_lux', 'Luxury Sedan', '🚘', 'Heated seats and a quiet confidence.', 145000, 6500, { effects: [stat('reputation', 7), stat('happiness', 3)] }),
  car('car_classic', 'Classic Convertible', '🚗', 'A 1967 beauty that gains value if you look after it.', 62000, 2800, { rate: 0.04, effects: [stat('reputation', 4), stat('happiness', 5), mem('Bought a classic car that people stop to admire.', ['luxury'], 2)] }),

  home('home_condo', 'Starter Condo', '🏢', 'Small, central, and yours.', 135000, { effects: [stat('happiness', 4), flag('owns_home')] }),
  home('home_house', 'Suburban House', '🏡', 'Yard, garage and room to grow.', 290000, { effects: [stat('happiness', 6), flag('owns_home')], minAge: 23 }),
  home('home_estate', 'Large Family Home', '🏠', 'Space for everyone, including the in-laws.', 560000, { effects: [stat('happiness', 7), stat('reputation', 3), flag('owns_home')], minAge: 25 }),
  home('home_villa', 'Luxury Villa', '🌴', 'Pool, view, and neighbours who wave politely.', 1400000, { effects: [stat('happiness', 8), stat('reputation', 7), flag('owns_home')], minAge: 25 }),
  home('home_manor', 'Historic Manor', '🏰', 'Centuries of walls that will hold centuries more of your family.', 3200000, { effects: [stat('happiness', 9), stat('reputation', 12), flag('owns_home'), flag('legacy_manor'), mem('Bought the manor that became the family seat.', ['legacy', 'luxury'], 3)], minAge: 28 }),

  { id: 'lux_wardrobe', kind: 'luxury', name: 'Designer Wardrobe', emoji: '👗', blurb: 'Fit changes everything.', price: 4000, upkeep: 0, rate: -0.3, minAge: 14, effects: [stat('looks', 4), stat('reputation', 2)] },
  { id: 'lux_watch', kind: 'luxury', name: 'Heirloom-Quality Watch', emoji: '⌚', blurb: 'Holds its value. Gets handed down.', price: 9500, upkeep: 0, rate: 0.02, minAge: 18, effects: [stat('reputation', 4)] },
  { id: 'lux_jewelry', kind: 'luxury', name: 'Fine Jewelry', emoji: '💎', blurb: 'A gift to give, or to keep.', price: 6000, upkeep: 0, rate: 0.015, minAge: 18, effects: [stat('looks', 2), stat('reputation', 2)] },
  { id: 'lux_art', kind: 'luxury', name: 'Original Artwork', emoji: '🖼️', blurb: 'Appreciates, and looks great on the wall.', price: 18000, upkeep: 0, rate: 0.05, minAge: 21, effects: [stat('reputation', 3), skill('creativity', 3), stat('happiness', 3)] },
  { id: 'lux_instrument', kind: 'luxury', name: 'Professional Instrument', emoji: '🎸', blurb: 'The kind of sound that makes you practice.', price: 2500, upkeep: 0, rate: -0.04, minAge: 10, effects: [skill('creativity', 6), stat('happiness', 3)] },
  { id: 'lux_gym', kind: 'luxury', name: 'Home Gym', emoji: '🏋️', blurb: 'No more excuses.', price: 3000, upkeep: 0, rate: -0.08, minAge: 16, effects: [skill('athletics', 6), stat('health', 4)] },
  { id: 'lux_pc', kind: 'luxury', name: 'Pro Workstation', emoji: '🖥️', blurb: 'Build things, fast.', price: 3500, upkeep: 0, rate: -0.2, minAge: 14, effects: [skill('tech', 6), stat('smarts', 1)] },

  { id: 'pet_dog', kind: 'pet', name: 'Rescue Dog', emoji: '🐕', blurb: 'Unconditional love. Requires walks.', price: 400, upkeep: 900, rate: 0, minAge: 12, effects: [stat('happiness', 8), skill('athletics', 1)] },
  { id: 'pet_cat', kind: 'pet', name: 'Rescue Cat', emoji: '🐈', blurb: 'Judges you quietly.', price: 150, upkeep: 500, rate: 0, minAge: 12, effects: [stat('happiness', 6)] },
];

export const CATALOG_BY_ID: Record<string, CatalogItem> = Object.fromEntries(CATALOG.map((i) => [i.id, i]));
