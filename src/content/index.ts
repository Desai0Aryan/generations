// Content registry. To add a new pack: write its events file, import it here, add a PackInfo.
import type { EventDef } from '../engine/types.ts';
import { CORE_EVENTS } from './core.ts';
import { ENTREPRENEUR_EVENTS } from './entrepreneur.ts';

export interface PackInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  premium: boolean;
  /** App Store product id (create the same id in App Store Connect). */
  productId?: string;
  priceLabel?: string;
  events: EventDef[];
}

export const PACKS: PackInfo[] = [
  {
    id: 'core',
    name: 'Core Life',
    tagline: 'The full life, from first steps to final years.',
    description: 'School, work, love, family, money, health and the family legacy system.',
    premium: false,
    events: CORE_EVENTS,
  },
  {
    id: 'entrepreneur',
    name: 'Hustle & Ambition',
    tagline: 'Build something of your own.',
    description: 'Side hustles, big clients, viral moments and buyout offers that ripple through your bloodline.',
    premium: true,
    productId: 'com.yourstudio.generations.pack.entrepreneur',
    priceLabel: '$2.99',
    events: ENTREPRENEUR_EVENTS,
  },
];

const BY_ID = new Map<string, EventDef>();
for (const p of PACKS) for (const e of p.events) BY_ID.set(e.id, e);

export function getEvent(id: string): EventDef | undefined {
  return BY_ID.get(id);
}

export function eventsForPacks(enabled: string[]): EventDef[] {
  const on = new Set(['core', ...enabled]);
  return PACKS.filter((p) => on.has(p.id)).flatMap((p) => p.events);
}

export const FREE_PACK_IDS = PACKS.filter((p) => !p.premium).map((p) => p.id);
