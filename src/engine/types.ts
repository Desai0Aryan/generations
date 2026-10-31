// Core data types for the Generations engine.
// Everything the game does is described by plain data so content packs can be
// added (or even downloaded later) without touching engine code.

export type StatKey = 'health' | 'happiness' | 'smarts' | 'looks' | 'reputation';
export const STAT_KEYS: StatKey[] = ['health', 'happiness', 'smarts', 'looks', 'reputation'];
export const STAT_LABELS: Record<StatKey, string> = {
  health: 'Health',
  happiness: 'Happiness',
  smarts: 'Smarts',
  looks: 'Looks',
  reputation: 'Reputation',
};

export type Stats = Record<StatKey, number>;

export type Education = 'none' | 'highschool' | 'trade' | 'college';
export const EDU_RANK: Record<Education, number> = { none: 0, highschool: 1, trade: 2, college: 3 };
export const EDU_LABELS: Record<Education, string> = {
  none: 'No diploma yet',
  highschool: 'High school diploma',
  trade: 'Trade certification',
  college: "Bachelor's degree",
};

export type RelKind =
  | 'parent'
  | 'sibling'
  | 'friend'
  | 'partner'
  | 'ex'
  | 'child'
  | 'rival'
  | 'mentor'
  | 'coworker';

export type Cmp = '>=' | '<=' | '>' | '<' | '==' | '!=';

export type Condition =
  | { t: 'stat'; k: StatKey; op: Cmp; v: number }
  | { t: 'money'; op: Cmp; v: number }
  | { t: 'flag'; k: string; v?: boolean }
  | { t: 'hasRel'; kind: RelKind; has?: boolean }
  | { t: 'job'; has: boolean }
  | { t: 'edu'; atLeast: Education }
  | { t: 'mem'; tag: string; withinYears?: number; has?: boolean }
  | { t: 'gen'; op: Cmp; v: number }
  | { t: 'age'; op: Cmp; v: number }
  | { t: 'chance'; p: number }
  | { t: 'not'; c: Condition }
  | { t: 'any'; cs: Condition[] };

export type Effect =
  | { t: 'stat'; k: StatKey; d: number }
  | { t: 'money'; d: number }
  | { t: 'flag'; k: string; v?: boolean }
  | { t: 'mem'; text: string; tags?: string[]; weight?: number }
  | { t: 'rel'; d: number; who?: 'target' | RelKind }
  | { t: 'rtag'; tag: string }
  | { t: 'addRel'; kind: RelKind; name?: string; closeness?: number; age?: number; bind?: boolean }
  | { t: 'endRel' }
  | { t: 'job'; title: string; salary: number }
  | { t: 'raise'; pct: number }
  | { t: 'quit' }
  | { t: 'retire' }
  | { t: 'edu'; level: Education }
  | { t: 'die'; cause: string };

export interface TargetFilter {
  kind: RelKind | RelKind[];
  minCloseness?: number;
  maxCloseness?: number;
  tag?: string;
  notTag?: string;
}

export interface OutcomeDef {
  weight?: number; // default 1
  /** weight += amt * (stat - 50) / 50 — lets stats tilt luck without making it certain */
  bias?: { k: StatKey; amt: number };
  text: string;
  effects: Effect[];
}

export interface ChoiceDef {
  label: string;
  hint?: string;
  cost?: number; // cash required and deducted
  requires?: Condition[];
  outcomes: OutcomeDef[];
}

export type EventCategory =
  | 'school'
  | 'work'
  | 'love'
  | 'family'
  | 'friends'
  | 'health'
  | 'money'
  | 'legacy'
  | 'life';

export interface EventDef {
  id: string;
  pack: string;
  category: EventCategory;
  title: string;
  text: string; // supports tokens: {first} {last} {age} {target} {partner} {parent} {friend}
  minAge: number;
  maxAge: number;
  weight: number;
  once?: boolean;
  cooldown?: number; // years before it can show again
  milestone?: boolean; // always fires at its age window start if eligible
  conditions?: Condition[];
  target?: TargetFilter;
  choices?: ChoiceDef[]; // present => player decision. absent => automatic story beat
  effects?: Effect[]; // used by automatic events
}

export interface Relationship {
  id: string;
  kind: RelKind;
  name: string;
  age: number;
  closeness: number; // 0-100
  alive: boolean;
  tags: string[];
}

export interface Memory {
  id: string;
  year: number;
  age: number;
  text: string;
  tags: string[];
  weight: number;
}

export interface Job {
  title: string;
  salary: number;
  years: number;
}

export interface Character {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthYear: number;
  age: number;
  background: BackgroundId;
  stats: Stats;
  money: number;
  peakMoney: number;
  education: Education;
  job: Job | null;
  lastJob?: string;
  retired: boolean;
  flags: Record<string, boolean>;
  alive: boolean;
  causeOfDeath?: string;
}

export type BackgroundId = 'working' | 'middle' | 'comfortable' | 'wealthy';

export interface FeedEntry {
  id: string;
  age: number;
  year: number;
  text: string;
  kind: 'event' | 'system' | 'milestone' | 'death' | 'choice';
}

export interface PendingEvent {
  eventId: string;
  targetId?: string;
  stage: 'choose' | 'result';
  choiceIndex?: number;
  resultText?: string;
  deltas?: { label: string; amount: number }[];
}

export interface LifeSummary {
  name: string;
  gender: string;
  birthYear: number;
  deathYear: number;
  ageAtDeath: number;
  cause: string;
  peakMoney: number;
  finalJob: string;
  education: Education;
  reputation: number;
  childrenCount: number;
  legacyScore: number;
  highlights: string[];
}

export interface Family {
  surname: string;
  generation: number;
  lineage: LifeSummary[];
  /** 0-100 — how well-regarded the family name is; inherited and drifts toward each heir's reputation */
  familyReputation: number;
}

export type Phase = 'alive' | 'dead';

export interface GameState {
  version: number;
  rngState: number;
  year: number;
  phase: Phase;
  character: Character;
  relationships: Relationship[];
  memories: Memory[];
  feed: FeedEntry[];
  queue: PendingEvent[];
  eventHistory: Record<string, { count: number; lastYear: number }>;
  family: Family;
  packs: string[]; // enabled content pack ids
  actionsLeft: number; // interactions with people this year
  nextId: number;
}

export interface NewGameOptions {
  firstName: string;
  lastName: string;
  gender: string;
  background: BackgroundId;
  startAge: 0 | 16;
  seed?: number;
  packs: string[];
  startYear?: number;
}

export const SAVE_VERSION = 1;
