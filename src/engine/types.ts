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

export type Education = 'none' | 'highschool' | 'trade' | 'college' | 'grad';
export const EDU_RANK: Record<Education, number> = { none: 0, highschool: 1, trade: 2, college: 3, grad: 4 };
export const EDU_LABELS: Record<Education, string> = {
  none: 'No diploma yet',
  highschool: 'High school diploma',
  trade: 'Associate / trade certification',
  college: "Bachelor's degree",
  grad: 'Graduate degree',
};

export type SkillKey = 'athletics' | 'creativity' | 'tech' | 'charisma';
export const SKILL_KEYS: SkillKey[] = ['athletics', 'creativity', 'tech', 'charisma'];
export const SKILL_LABELS: Record<SkillKey, string> = { athletics: 'Athletics', creativity: 'Creativity', tech: 'Tech', charisma: 'Charisma' };
export type Skills = Record<SkillKey, number>;

export type SchoolTier = 'community' | 'state' | 'private' | 'elite';

export type RelKind =
  | 'fling'
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
  | { t: 'skill'; k: SkillKey; op: Cmp; v: number }
  | { t: 'asset'; kind: AssetKind; has?: boolean }
  | { t: 'school'; has?: boolean }
  | { t: 'field'; is: string; has?: boolean }
  | { t: 'debt'; op: Cmp; v: number }
  | { t: 'perf'; op: Cmp; v: number }
  | { t: 'worth'; op: Cmp; v: number }
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
  | { t: 'job'; title: string; salary: number; field?: string }
  | { t: 'skill'; k: SkillKey; d: number }
  | { t: 'enroll'; tier: SchoolTier; kind?: 'college' | 'grad'; degree?: string; length?: number; tuition?: number }
  | { t: 'major'; name: string }
  | { t: 'gpa'; d: number }
  | { t: 'dropout' }
  | { t: 'hire'; field: string }
  | { t: 'perf'; d: number }
  | { t: 'loan'; label: string; amount: number; rate: number; years: number }
  | { t: 'payDebt'; amount: number }
  | { t: 'relkind'; kind: RelKind }
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
  field?: string;
  level?: number;
  lvlYears?: number;
  perf?: number; // 0-100, how well you are doing
}

export interface School {
  tier: SchoolTier;
  kind: 'college' | 'grad';
  years: number;
  length: number;
  tuition: number;
  gpa: number;
  degree?: string;
}

export type AssetKind = 'car' | 'home' | 'luxury' | 'pet';

export interface Asset {
  id: string;
  itemId: string;
  kind: AssetKind;
  name: string;
  emoji: string;
  value: number;
  price: number;
  boughtYear: number;
  upkeep: number;
  rate: number; // yearly value change (negative = depreciation)
  loanId?: string;
}

export interface Loan {
  id: string;
  label: string;
  balance: number;
  rate: number;
  yearly: number;
  assetId?: string;
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
  skills: Skills;
  major?: string;
  school?: School;
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
  cat?: EventCategory;
}

export interface PendingEvent {
  eventId: string;
  targetId?: string;
  title?: string;
  cat?: EventCategory;
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
  netWorth?: number;
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
  actionsLeft: number; // free-time slots this year (activities + time with people)
  assets: Asset[];
  loans: Loan[];
  actionLog: Record<string, number>; // actionId(+target) -> last year it was done
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

export const SAVE_VERSION = 2;
export const SLOTS_PER_YEAR = 5;

// ───────── Player actions (the 'Do' tab) ─────────
export type ActionGroup = 'love' | 'social' | 'school' | 'career' | 'sports' | 'money' | 'health' | 'family' | 'life';

export interface ActionDef {
  id: string;
  group: ActionGroup;
  icon: string;
  label: string;
  hint: string;
  minAge: number;
  maxAge: number;
  time: number; // free-time slots used (0 = free)
  repeat: 'year' | 'once' | 'any';
  requires?: Condition[];
  target?: TargetFilter; // present => shown when you tap a person
  pack?: string;
  /** one choice => performs immediately; several => the player picks */
  choices: ChoiceDef[];
}
