import { PACKS } from '../src/content/index.ts';
export const EVENTS_FOR_TEST = PACKS.flatMap((p) => p.events.map((e) => e.id));
