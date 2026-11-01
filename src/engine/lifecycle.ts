// The heart of the game: creating a life, aging up, resolving choices, dying, and
// handing the bloodline to an heir. All functions are pure: state in -> new state out.
import type {
  BackgroundId,
  ChoiceDef,
  EventDef,
  FeedEntry,
  GameState,
  LifeSummary,
  NewGameOptions,
  PendingEvent,
  Relationship,
} from './types.ts';
import { EDU_RANK, SAVE_VERSION, SLOTS_PER_YEAR } from './types.ts';
import { chance, freshName, int, next, pick, uid, weightedPick } from './rng.ts';
import { check, checkAll, livingRels } from './conditions.ts';
import { applyEffects } from './effects.ts';
import { fill } from './text.ts';
import { FIRST_NAMES } from './names.ts';
import { getEvent, eventsForPacks } from '../content/index.ts';
import { FIELD_BY_ID } from '../content/jobs.ts';
import { DEGREE_LABEL } from '../content/education.ts';
import { loansBalance, netWorth } from './finance.ts';
import { legalYear, newLegal, queueArrest } from './legal.ts';
import { heirWardrobe, newWardrobe } from './looks.ts';

export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
export const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const BACKGROUNDS: Record<
  BackgroundId,
  { label: string; blurb: string; teenCash: number; support: number }
> = {
  working: { label: 'Working class', blurb: 'Money is tight. You learn to hustle early.', teenCash: 200, support: 0 },
  middle: { label: 'Middle class', blurb: 'Comfortable but careful. College is a stretch.', teenCash: 600, support: 3000 },
  comfortable: { label: 'Comfortable', blurb: 'Stable home, good schools, a little safety net.', teenCash: 1500, support: 8000 },
  wealthy: { label: 'Wealthy', blurb: 'Doors open easily. The name carries weight.', teenCash: 5000, support: 15000 },
};

// ---------- helpers ----------

export function addFeed(s: GameState, text: string, kind: FeedEntry['kind'] = 'event', cat?: FeedEntry['cat']): void {
  s.feed.push({ id: uid(s, 'f'), age: s.character.age, year: s.year, text, kind, cat });
  if (s.feed.length > 600) s.feed.splice(0, s.feed.length - 600);
}

function makeRel(s: GameState, kind: Relationship['kind'], age: number, closeness: number, lastName?: string): Relationship {
  return {
    id: uid(s, 'r'),
    kind,
    name: `${freshName(s, FIRST_NAMES)}${lastName ? ' ' + lastName : ''}`,
    age,
    closeness,
    alive: true,
    tags: [],
  };
}

function mortality(age: number, health: number): number {
  const base = 0.00008 * Math.exp(0.085 * age);
  const mult = Math.max(0.4, Math.min(3, 1 + (50 - health) / 60));
  return Math.min(0.9, base * mult);
}

// ---------- new game ----------

export function newGame(input: NewGameOptions): GameState {
  // "Start at 16" should land on today's calendar year, so the birth year is 16 years back.
  const opts: NewGameOptions = { ...input, startYear: (input.startYear ?? new Date().getFullYear()) - input.startAge };
  let seed = opts.seed ?? (Date.now() ^ 0x5bd1e995) | 0;
  for (let attempt = 0; attempt < 8; attempt++) {
    const s = buildNewGame({ ...opts, seed: seed + attempt * 7919 });
    if (opts.startAge === 0) return s;
    const played = autoplayTo(s, opts.startAge - 1);
    if (played.phase === 'alive') {
      const out = ageUp(played); // final step so the age-16 opening choice is presented to the player
      if (out.phase === 'alive') return out;
    }
  }
  return buildNewGame({ ...opts, startAge: 0 });
}

function buildNewGame(opts: NewGameOptions): GameState {
  const year = opts.startYear ?? new Date().getFullYear();
  const s: GameState = {
    version: SAVE_VERSION,
    rngState: opts.seed ?? 12345,
    year,
    phase: 'alive',
    character: {
      id: 'c1',
      firstName: opts.firstName.trim() || 'Alex',
      lastName: opts.lastName.trim() || 'Stonefield',
      gender: opts.gender,
      birthYear: year,
      age: 0,
      background: opts.background,
      stats: { health: 80, happiness: 80, smarts: 50, looks: 50, reputation: 50 },
      money: 0,
      peakMoney: 0,
      education: 'none',
      skills: { athletics: 20, creativity: 20, tech: 15, charisma: 25 },
      job: null,
      retired: false,
      flags: {},
      alive: true,
    },
    relationships: [],
    memories: [],
    feed: [],
    queue: [],
    eventHistory: {},
    family: { surname: opts.lastName.trim() || 'Stonefield', generation: 1, lineage: [], familyReputation: 50 },
    packs: opts.packs,
    actionsLeft: SLOTS_PER_YEAR,
    assets: [],
    loans: [],
    actionLog: {},
    yearActs: {},
    pools: {},
    legal: newLegal(),
    wardrobe: newWardrobe(`${opts.firstName.trim() || 'Alex'} ${opts.lastName.trim() || 'Stonefield'}`, opts.gender),
    nextId: 1,
  };
  const ch = s.character;
  ch.stats.health = int(s, 68, 96);
  ch.stats.smarts = int(s, 30, 80);
  ch.stats.looks = int(s, 30, 85);
  ch.stats.happiness = int(s, 70, 90);
  ch.skills = { athletics: int(s, 10, 45), creativity: int(s, 10, 45), tech: int(s, 5, 35), charisma: int(s, 15, 45) };
  const bgBonus: Record<BackgroundId, number> = { working: 0, middle: 3, comfortable: 6, wealthy: 10 };
  ch.stats.reputation = 45 + bgBonus[opts.background];

  s.relationships.push(makeRel(s, 'parent', int(s, 24, 36), int(s, 55, 85), ch.lastName));
  s.relationships.push(makeRel(s, 'parent', int(s, 25, 40), int(s, 50, 85), ch.lastName));
  const sibs = pick(s, [0, 0, 1, 1, 2]);
  for (let i = 0; i < sibs; i++) s.relationships.push(makeRel(s, 'sibling', int(s, 1, 7), int(s, 40, 70), ch.lastName));

  addFeed(
    s,
    `${ch.firstName} ${ch.lastName} is born in ${year}. ${BACKGROUNDS[opts.background].label} family. A new bloodline begins.`,
    'milestone',
  );
  return s;
}

// ---------- aging ----------

export function ageUp(prev: GameState): GameState {
  if (prev.phase !== 'alive' || prev.queue.length > 0) return prev;
  const s = clone(prev);
  const ch = s.character;
  s.year += 1;
  ch.age += 1;
  s.actionsLeft = SLOTS_PER_YEAR;
  s.yearActs = {};

  ageRelationships(s);
  passiveYear(s);
  queueArrest(s);

  const cause = naturalDeath(s);
  if (cause) {
    kill(s, cause);
    return s;
  }

  drawEvents(s);
  return s;
}

function ageRelationships(s: GameState): void {
  for (const r of s.relationships) {
    if (!r.alive) continue;
    r.age += 1;
    const decay =
      r.kind === 'friend' || r.kind === 'coworker' || r.kind === 'mentor' ? 2 : r.kind === 'partner' || r.kind === 'ex' ? 1 : 0;
    r.closeness = clamp(r.closeness - decay);
    if (r.age >= 55 && chance(s, mortality(r.age, 60))) {
      r.alive = false;
      const close = r.kind === 'parent' || r.kind === 'partner' || r.kind === 'child' || r.kind === 'sibling';
      addFeed(s, `${r.name} (${labelFor(r.kind)}) passed away at age ${r.age}.`, 'system');
      if (close) {
        s.character.stats.happiness = clamp(s.character.stats.happiness - int(s, 8, 16));
        applyEffects(s, [
          { t: 'mem', text: `Lost ${r.name}, my ${labelFor(r.kind)}, when I was ${s.character.age}.`, tags: ['loss'], weight: 1 },
        ]);
      }
      if (r.kind === 'partner') {
        s.character.flags.married = false;
        s.character.flags.widowed = true;
      }
    }
  }
}

export function labelFor(kind: Relationship['kind']): string {
  return {
    parent: 'parent',
    sibling: 'sibling',
    friend: 'friend',
    partner: 'partner',
    ex: 'ex',
    child: 'child',
    rival: 'rival',
    mentor: 'mentor',
    coworker: 'coworker',
    fling: 'fling',
  }[kind];
}

function graduate(s: GameState): void {
  const ch = s.character;
  const sc = ch.school;
  if (!sc) return;
  const honors = sc.gpa >= 3.7;
  const edu = sc.kind === 'grad' ? 'grad' : sc.tier === 'community' ? 'trade' : 'college';
  if (EDU_RANK[edu] > EDU_RANK[ch.education]) ch.education = edu;
  if (sc.degree) ch.flags[`degree_${sc.degree}`] = true;
  ch.flags.inCollege = false;
  ch.school = undefined;
  ch.stats.happiness = clamp(ch.stats.happiness + 6);
  ch.stats.reputation = clamp(ch.stats.reputation + (honors ? 4 : 1));
  const what =
    sc.kind === 'grad'
      ? DEGREE_LABEL[sc.degree ?? ''] ?? 'a graduate degree'
      : `${sc.tier === 'community' ? 'an associate degree' : "a bachelor's degree"}${ch.major ? ' in ' + ch.major : ''}`;
  addFeed(s, `You graduate${honors ? ' with honors' : ''}, earning ${what}.`, 'milestone', 'school');
  applyEffects(s, [{ t: 'mem', text: `Graduated with ${what}.`, tags: ['school'], weight: 2 }]);
}

function maybePromote(s: GameState): void {
  const ch = s.character;
  const j = ch.job;
  if (!j?.field) return;
  const f = FIELD_BY_ID[j.field];
  if (!f) return;
  const lvl = j.level ?? 0;
  if (lvl >= f.ladder.length - 1 || (j.lvlYears ?? 0) < 2) return;
  const p = 0.12 + (j.perf ?? 50) / 260 + (ch.stats.reputation - 50) / 600;
  if (!chance(s, p)) return;
  const rung = f.ladder[lvl + 1];
  j.level = lvl + 1;
  j.lvlYears = 0;
  j.title = rung.title;
  j.salary = Math.max(Math.round(j.salary * 1.12), rung.salary);
  ch.lastJob = rung.title;
  ch.stats.happiness = clamp(ch.stats.happiness + 4);
  ch.stats.reputation = clamp(ch.stats.reputation + 2);
  addFeed(s, `Promotion! You are now ${rung.title}, earning $${j.salary.toLocaleString('en-US')} a year.`, 'milestone', 'work');
}

function passiveYear(s: GameState): void {
  const ch = s.character;
  const st = ch.stats;
  const bg = BACKGROUNDS[ch.background];
  const jailed = legalYear(s);
  if (jailed && ch.school) { ch.school = undefined; ch.flags.inCollege = false; addFeed(s, 'Your studies end behind bars.', 'system', 'crime'); }

  // body & mind drift
  if (ch.age < 45 && st.health < 88) st.health = clamp(st.health + int(s, 1, 3));
  else if (ch.age < 60 && st.health < 80) st.health = clamp(st.health + int(s, 0, 1));
  if (ch.age > 50) st.health = clamp(st.health - int(s, 0, 2));
  if (ch.age > 70) st.health = clamp(st.health - int(s, 0, 2));
  if (ch.age > 30) st.looks = clamp(st.looks - int(s, 0, 1));
  st.happiness = clamp(st.happiness + int(s, -2, 2) + (st.happiness > 75 ? -1 : st.happiness < 35 ? 2 : 0));
  if (ch.age >= 6 && ch.age < 18) st.smarts = clamp(st.smarts + (chance(s, 0.6) ? 1 : 0));
  // skills slowly fade if you never use them
  for (const k of Object.keys(ch.skills) as (keyof typeof ch.skills)[]) {
    if (ch.age > 25 && ch.skills[k] > 30 && chance(s, 0.25)) ch.skills[k] = clamp(ch.skills[k] - 1);
  }

  // school
  if (ch.school) {
    const sc = ch.school;
    sc.years += 1;
    ch.money -= sc.tuition;
    st.smarts = clamp(st.smarts + int(s, 1, 2));
    sc.gpa = Math.max(1, Math.min(4, Math.round((sc.gpa + (st.smarts - 62) / 300 + (next(s) - 0.5) * 0.25) * 100) / 100));
    if (sc.years >= sc.length) graduate(s);
  }

  // income & career
  if (ch.job && !jailed) {
    const j = ch.job;
    if (ch.retired) {
      ch.money += Math.round(j.salary * 0.55);
    } else {
      j.years += 1;
      j.lvlYears = (j.lvlYears ?? 0) + 1;
      j.salary = Math.round(j.salary * 1.015);
      j.perf = Math.max(0, (j.perf ?? 50) - 2);
      ch.money += Math.round(j.salary * 0.75);
      maybePromote(s);
      if (j.field === 'sports' && ch.age >= 36) {
        addFeed(s, 'Your body says it is time. You retire from professional sports with a full trophy shelf.', 'milestone', 'work');
        ch.job = null;
      } else if (j.field === 'business' && (j.perf ?? 50) < 10 && chance(s, 0.35)) {
        addFeed(s, `Your business closes its doors. It was a brave attempt, and you learned a lot.`, 'event', 'work');
        st.happiness = clamp(st.happiness - 7);
        ch.money -= 6000;
        ch.job = null;
      } else if (j.field !== 'business' && (j.perf ?? 50) < 12 && j.years > 2 && chance(s, 0.3)) {
        addFeed(s, `You were let go from your job as ${j.title}. Performance had slipped for too long.`, 'event', 'work');
        st.happiness = clamp(st.happiness - 6);
        ch.job = null;
      } else if (ch.age >= 70) {
        ch.retired = true;
        addFeed(s, 'You retire from work and settle into a slower rhythm.', 'milestone');
      }
    }
  }

  // assets: upkeep, value changes, pets
  for (const a of [...s.assets]) {
    a.value = Math.max(0, Math.round(a.value * (1 + a.rate)));
    ch.money -= a.upkeep + (a.kind === 'home' ? Math.round(a.value * 0.011) : 0);
    if (a.kind === 'pet') {
      st.happiness = clamp(st.happiness + 1);
      if (s.year - a.boughtYear >= 13) {
        s.assets = s.assets.filter((x) => x.id !== a.id);
        st.happiness = clamp(st.happiness - 8);
        addFeed(s, `Your ${a.name.replace('Rescue ', '').toLowerCase()} passed away after a long, loved life.`, 'event', 'family');
      }
    }
  }
  // loans: interest then the fixed yearly payment
  for (const l of [...s.loans]) {
    l.balance = Math.round(l.balance * (1 + l.rate));
    const pay = Math.min(l.yearly, l.balance);
    ch.money -= pay;
    l.balance -= pay;
    if (l.balance <= 0) {
      s.loans = s.loans.filter((x) => x.id !== l.id);
      const a = s.assets.find((x) => x.loanId === l.id);
      if (a) a.loanId = undefined;
      addFeed(s, `You made the final payment on ${l.label}. It is yours, free and clear.`, 'milestone', 'money');
    }
  }
  ch.flags.owns_home = s.assets.some((a) => a.kind === 'home');

  // expenses & family support
  const parentAlive = livingRels(s, 'parent').length > 0;
  if (ch.age >= 18 && !jailed) {
    const kids = livingRels(s, 'child').filter((c) => c.age < 18).length;
    const inflation = Math.pow(1.018, Math.max(0, ch.age - 18));
    let cost = (ch.flags.owns_home ? 15000 : 23000) * inflation;
    if (ch.age < 30 && parentAlive && !ch.flags.moved_out) cost = 4000;
    if (ch.flags.cohabit && livingRels(s, 'partner').length > 0) cost *= 0.75;
    cost += kids * 6000;
    if (ch.retired) cost *= 0.7;
    ch.money -= Math.round(cost);
    if (ch.age < 23 && parentAlive) ch.money += bg.support;
  }
  if (ch.money < 0) ch.money = Math.round(ch.money * 1.06);
  if (ch.money < -40000) st.happiness = clamp(st.happiness - 3);
  else if (ch.money < 0 && ch.age >= 18) st.happiness = clamp(st.happiness - 1);
  if (ch.money < -120000) bankrupt(s);
  const nw = netWorth(s);
  if (nw > ch.peakMoney) ch.peakMoney = nw;
  void loansBalance;
}

function bankrupt(s: GameState): void {
  const ch = s.character;
  addFeed(s, 'The debts finally win. You file for bankruptcy: the bank takes your assets and the slate is wiped, but the stain on your name lingers.', 'event', 'money');
  s.assets = [];
  s.loans = [];
  ch.money = 0;
  ch.flags.owns_home = false;
  ch.flags.bankrupt = true;
  ch.stats.reputation = clamp(ch.stats.reputation - 14);
  ch.stats.happiness = clamp(ch.stats.happiness - 14);
  applyEffects(s, [{ t: 'mem', text: 'Went bankrupt and started over from nothing.', tags: ['shame', 'money'], weight: 2 }]);
}

function naturalDeath(s: GameState): string | null {
  const ch = s.character;
  if (ch.stats.health <= 0) return 'failing health';
  if (!chance(s, mortality(ch.age, ch.stats.health))) return null;
  if (ch.age < 30) return pick(s, ['a tragic accident', 'a sudden illness']);
  if (ch.age < 60) return pick(s, ['a sudden illness', 'a heart condition', 'an accident']);
  return pick(s, ['natural causes', 'old age', 'a long illness', 'a peaceful sleep']);
}

// ---------- death & legacy ----------

export function kill(s: GameState, cause: string): void {
  const ch = s.character;
  ch.alive = false;
  ch.causeOfDeath = cause;
  s.phase = 'dead';
  s.queue = s.queue.slice(0, 1); // keep only a result the player is currently reading
  addFeed(s, `${ch.firstName} ${ch.lastName} died at age ${ch.age} from ${cause}.`, 'death');

  const kids = s.relationships.filter((r) => r.kind === 'child').length;
  const highlights = [...s.memories]
    .filter((m) => !m.tags.includes('loss'))
    .sort((a, b) => b.weight - a.weight || b.year - a.year)
    .slice(0, 3)
    .map((m) => m.text);
  const wealthPts = Math.min(30, Math.max(0, Math.log10(Math.max(ch.peakMoney, 1)) - 3) * 10);
  const summary: LifeSummary = {
    name: `${ch.firstName} ${ch.lastName}`,
    gender: ch.gender,
    birthYear: ch.birthYear,
    deathYear: s.year,
    ageAtDeath: ch.age,
    cause,
    peakMoney: ch.peakMoney,
    netWorth: netWorth(s),
    finalJob: ch.job?.title ?? ch.lastJob ?? 'No career',
    education: ch.education,
    reputation: ch.stats.reputation,
    childrenCount: kids,
    legacyScore: Math.round(ch.age * 0.4 + ch.stats.reputation * 0.5 + wealthPts + kids * 4 + EDU_RANK[ch.education] * 3),
    highlights,
  };
  s.family.lineage.push(summary);
  s.family.familyReputation = clamp(s.family.familyReputation * 0.5 + ch.stats.reputation * 0.5);
}

export function getHeirs(s: GameState): Relationship[] {
  return s.relationships.filter((r) => r.kind === 'child' && r.alive);
}

export function continueAs(prev: GameState, childId: string): GameState {
  if (prev.phase !== 'dead') return prev;
  const s = clone(prev);
  const old = s.character;
  const heirs = getHeirs(s);
  const heir = heirs.find((h) => h.id === childId);
  if (!heir) return prev;

  // The chosen heir inherits the best home and any heirlooms that keep their value (art, watches, classic cars).
  // Everything else is sold, loans are settled, and 60% of what is left is split between the children. Debts die with you.
  const homes = s.assets.filter((a) => a.kind === 'home').sort((a, b) => b.value - a.value);
  const familyHome = homes[0];
  const kept = s.assets.filter((a) => a === familyHome || (a.kind !== 'home' && a.kind !== 'pet' && a.rate > 0));
  const sold = s.assets.filter((a) => !kept.includes(a));
  const cashEstate = Math.max(0, old.money + sold.reduce((a, x) => a + x.value, 0) - s.loans.reduce((a, x) => a + x.balance, 0));
  const share = Math.floor((cashEstate * 0.6) / heirs.length);
  const firstName = heir.name.split(' ')[0];
  const siblings = heirs.filter((h) => h.id !== heir.id);
  const survivingParent = s.relationships.find((r) => r.kind === 'partner' && r.alive);
  const avg = (k: 'health' | 'smarts' | 'looks') => Math.round((old.stats[k] + 55) / 2);
  const legacyFlags: Record<string, boolean> = {};
  for (const k of Object.keys(old.flags)) if (k.startsWith('legacy_')) legacyFlags[k] = true;
  const richness = old.peakMoney > 400000 ? 'wealthy' : old.peakMoney > 100000 ? 'comfortable' : old.peakMoney > 25000 ? 'middle' : 'working';

  const newRels: Relationship[] = [];
  const keep = (kind: Relationship['kind'], r: Relationship) =>
    newRels.push({ ...r, id: uid(s, 'r'), kind, closeness: clamp(Math.max(r.closeness, 45)), tags: [] });
  if (survivingParent) keep('parent', { ...survivingParent, name: survivingParent.name });
  for (const sib of siblings) keep('sibling', sib);

  s.character = {
    id: uid(s, 'c'),
    firstName,
    lastName: s.family.surname,
    gender: '',
    birthYear: s.year - heir.age,
    age: heir.age,
    background: richness,
    stats: {
      health: clamp(avg('health') + int(s, -8, 8)),
      happiness: 70,
      smarts: clamp(avg('smarts') + int(s, -12, 12)),
      looks: clamp(avg('looks') + int(s, -12, 12)),
      reputation: clamp(40 + (s.family.familyReputation - 50) * 0.5),
    },
    money: share,
    peakMoney: Math.max(0, share),
    education: heir.age >= 18 ? 'highschool' : 'none',
    skills: {
      athletics: clamp(old.skills.athletics * 0.4 + int(s, 8, 24)),
      creativity: clamp(old.skills.creativity * 0.4 + int(s, 8, 24)),
      tech: clamp(old.skills.tech * 0.4 + int(s, 5, 20)),
      charisma: clamp(old.skills.charisma * 0.4 + int(s, 8, 24)),
    },
    job: null,
    retired: false,
    flags: legacyFlags,
    alive: true,
  };
  if (familyHome) s.character.flags.owns_home = true;
  s.assets = kept.map((a) => ({ ...a, id: uid(s, 'a'), loanId: undefined }));
  s.loans = [];
  s.actionLog = {};
  s.yearActs = {};
  s.pools = {};
  s.legal = newLegal();
  s.wardrobe = heirWardrobe(s.wardrobe, `${firstName} ${s.family.surname}`, old.gender);
  s.relationships = newRels;
  if (heir.age >= 6) {
    const f = makeRel(s, 'friend', heir.age + int(s, -1, 1), int(s, 40, 70));
    s.relationships.push(f);
  }
  s.memories = [
    {
      id: uid(s, 'm'),
      year: s.year,
      age: heir.age,
      text: `${old.firstName} ${old.lastName}, my parent, lived ${old.age} years. Their name is part of mine now.`,
      tags: ['ancestor'],
      weight: 3,
    },
  ];
  s.feed = [];
  s.eventHistory = {};
  s.queue = [];
  s.phase = 'alive';
  s.actionsLeft = SLOTS_PER_YEAR;
  s.family.generation += 1;
  addFeed(
    s,
    `Generation ${s.family.generation}: you are now ${firstName} ${s.family.surname}, age ${heir.age}. ${
      share > 0 ? `You inherit $${share.toLocaleString('en-US')}.` : 'You inherit little but the name.'
    }${familyHome ? ` The family home, ${familyHome.name}, is yours now.` : ''}${
      kept.length > (familyHome ? 1 : 0) ? ' So are a few heirlooms worth keeping.' : ''
    }`,
    'milestone',
  );
  return s;
}

// ---------- events ----------

interface Candidate {
  ev: EventDef;
  targetId?: string;
}

function eligible(s: GameState): Candidate[] {
  const out: Candidate[] = [];
  const age = s.character.age;
  const locked = !!s.legal.prison;
  for (const ev of eventsForPacks(s.packs)) {
    if (locked ? !ev.id.startsWith('pr_') : ev.id.startsWith('pr_')) continue;
    if (age < ev.minAge || age > ev.maxAge) continue;
    const h = s.eventHistory[ev.id];
    if (h) {
      if (ev.once || ev.milestone) continue;
      if (s.year - h.lastYear < (ev.cooldown ?? 4)) continue;
    }
    if (!checkAll(s, ev.conditions)) continue;
    let targetId: string | undefined;
    if (ev.target) {
      const kinds = Array.isArray(ev.target.kind) ? ev.target.kind : [ev.target.kind];
      const pool = s.relationships.filter(
        (r) =>
          r.alive &&
          kinds.includes(r.kind) &&
          (ev.target!.minCloseness === undefined || r.closeness >= ev.target!.minCloseness) &&
          (ev.target!.maxCloseness === undefined || r.closeness <= ev.target!.maxCloseness) &&
          (ev.target!.tag === undefined || r.tags.includes(ev.target!.tag)) &&
          (ev.target!.notTag === undefined || !r.tags.includes(ev.target!.notTag)),
      );
      if (pool.length === 0) continue;
      targetId = pick(s, pool).id;
    }
    out.push({ ev, targetId });
  }
  return out;
}

function trigger(s: GameState, c: Candidate): void {
  const h = s.eventHistory[c.ev.id] ?? { count: 0, lastYear: s.year };
  h.count += 1;
  h.lastYear = s.year;
  s.eventHistory[c.ev.id] = h;

  if (c.ev.choices && c.ev.choices.length > 0) {
    s.queue.push({ eventId: c.ev.id, targetId: c.targetId, stage: 'choose' });
    return;
  }
  const ctx = { targetId: c.targetId, died: undefined as string | undefined };
  applyEffects(s, c.ev.effects ?? [], ctx);
  const target = s.relationships.find((r) => r.id === ctx.targetId);
  addFeed(s, fill(s, c.ev.text, target), c.ev.milestone ? 'milestone' : 'event', c.ev.category);
  if (ctx.died) kill(s, ctx.died);
}

function drawEvents(s: GameState): void {
  const cands = eligible(s);
  let produced = 0;

  // milestones always fire
  for (const c of cands.filter((x) => x.ev.milestone)) {
    trigger(s, c);
    produced++;
  }

  const pool = cands.filter((x) => !x.ev.milestone);
  const picks = 1 + (chance(s, 0.55) ? 1 : 0) + (chance(s, 0.15) ? 1 : 0);
  let choiceCount = s.queue.length;
  for (let i = 0; i < picks && pool.length > 0; i++) {
    const c = weightedPick(s, pool, (x) => (x.ev.choices && choiceCount >= 1 ? 0 : x.ev.weight));
    if (!c) break;
    pool.splice(pool.indexOf(c), 1);
    if (c.ev.choices) choiceCount++;
    trigger(s, c);
    produced++;
    if (s.phase !== 'alive') return;
  }
  if (produced === 0) addFeed(s, pick(s, fillerFor(s.character.age)), 'system');
}

function fillerFor(age: number): string[] {
  if (age < 6) return ['A year of small wonders.', 'You grow, you giggle, you get into everything.'];
  if (age < 13) return ['A year of ordinary adventures.', 'School, play, and growing up.'];
  if (age < 20) return ['A quiet year. Nothing dramatic, just life moving along.', 'Days blur into weeks; you feel yourself changing.'];
  if (age < 60) return ['A steady year. Not every year needs a headline.', 'Routine, rent, and small moments that add up.'];
  return ['A calm year. You enjoy the little things.', 'The days are slower, and somehow sweeter.'];
}

// ---------- choices ----------

export interface ChoiceView {
  index: number;
  choice: ChoiceDef;
  enabled: boolean;
  reason?: string;
}

export const RESULT_EVENT = '__result';

/** Queue a result popup. `before` is a snapshot from snapshotFor() so the popup can show what changed. */
export function presentResult(
  s: GameState,
  o: { title: string; cat: EventDef['category']; text: string; before: ReturnType<typeof snapshot>; targetId?: string },
): void {
  const target = s.relationships.find((r) => r.id === o.targetId);
  s.queue.push({
    eventId: RESULT_EVENT, title: o.title, cat: o.cat, stage: 'result', resultText: o.text, targetId: o.targetId,
    deltas: diff(o.before, snapshot(s, o.targetId), target?.name),
  });
}
export const snapshotFor = (s: GameState, targetId?: string) => snapshot(s, targetId);

export function currentEvent(s: GameState): { pending: PendingEvent; ev: EventDef; target?: Relationship } | null {
  const pending = s.queue[0];
  if (!pending) return null;
  const target = s.relationships.find((r) => r.id === pending.targetId);
  if (pending.eventId === RESULT_EVENT) {
    // a result-only popup (an action you took, a purchase...) has no event definition behind it
    const ev: EventDef = { id: RESULT_EVENT, pack: 'core', category: pending.cat ?? 'life', title: pending.title ?? 'Result', text: '', minAge: 0, maxAge: 200, weight: 0 };
    return { pending, ev, target };
  }
  const ev = getEvent(pending.eventId);
  if (!ev) return null;
  return { pending, ev, target };
}

export function choiceViews(s: GameState, ev: EventDef): ChoiceView[] {
  return (ev.choices ?? []).map((choice, index) => {
    if (choice.cost && s.character.money < choice.cost) {
      return { index, choice, enabled: false, reason: `Need $${choice.cost.toLocaleString('en-US')}` };
    }
    if (!checkAll(s, choice.requires, true)) return { index, choice, enabled: false, reason: 'Not available' };
    return { index, choice, enabled: true };
  });
}

export function resolveChoice(prev: GameState, index: number): GameState {
  const cur = currentEvent(prev);
  if (!cur || cur.pending.stage !== 'choose') return prev;
  const view = choiceViews(prev, cur.ev)[index];
  if (!view || !view.enabled) return prev;

  const s = clone(prev);
  const pending = s.queue[0];
  const ev = cur.ev;
  const choice = ev.choices![index];
  const before = snapshot(s, pending.targetId);

  if (choice.cost) s.character.money -= choice.cost;

  const outcome =
    weightedPick(s, choice.outcomes, (o) => {
      const bias = o.bias ? (o.bias.amt * (s.character.stats[o.bias.k] - 50)) / 50 : 0;
      return (o.weight ?? 1) + bias;
    }) ?? choice.outcomes[0];

  const ctx = { targetId: pending.targetId, died: undefined as string | undefined, notes: [] as string[] };
  applyEffects(s, outcome.effects, ctx);
  const target = s.relationships.find((r) => r.id === ctx.targetId);
  const text = fill(s, outcome.text, target) + (ctx.notes?.length ? ' ' + ctx.notes.join(' ') : '');

  pending.stage = 'result';
  pending.choiceIndex = index;
  pending.resultText = text;
  pending.targetId = ctx.targetId;
  pending.deltas = diff(before, snapshot(s, ctx.targetId), target?.name);

  addFeed(s, `${fill(s, ev.title, target)}: ${choice.label}. ${text}`, 'choice', ev.category);
  if (ctx.died) kill(s, ctx.died);
  return s;
}

export function dismissResult(prev: GameState): GameState {
  if (!prev.queue[0] || prev.queue[0].stage !== 'result') return prev;
  const s = clone(prev);
  s.queue.shift();
  return s;
}

function snapshot(s: GameState, targetId?: string) {
  const t = s.relationships.find((r) => r.id === targetId);
  return { stats: { ...s.character.stats }, skills: { ...s.character.skills }, money: s.character.money, rel: t ? t.closeness : undefined };
}

function diff(a: ReturnType<typeof snapshot>, b: ReturnType<typeof snapshot>, targetName?: string) {
  const out: { label: string; amount: number }[] = [];
  (Object.keys(a.stats) as (keyof typeof a.stats)[]).forEach((k) => {
    const d = b.stats[k] - a.stats[k];
    if (d !== 0) out.push({ label: k[0].toUpperCase() + k.slice(1), amount: d });
  });
  (Object.keys(a.skills) as (keyof typeof a.skills)[]).forEach((k) => {
    const d = b.skills[k] - a.skills[k];
    if (d !== 0) out.push({ label: k[0].toUpperCase() + k.slice(1), amount: d });
  });
  if (b.money !== a.money) out.push({ label: 'Money', amount: b.money - a.money });
  if (a.rel !== undefined && b.rel !== undefined && a.rel !== b.rel && targetName) {
    out.push({ label: `${targetName.split(' ')[0]}'s bond`, amount: b.rel - a.rel });
  }
  return out;
}

// ---------- interacting with people between years ----------

export type Interaction = 'time' | 'call' | 'gift';

export function interact(prev: GameState, relId: string, action: Interaction): GameState {
  const r0 = prev.relationships.find((r) => r.id === relId);
  if (!r0 || !r0.alive || prev.phase !== 'alive' || prev.legal.prison) return prev;
  if (action === 'gift' && prev.character.money < 50) return prev;
  const s = clone(prev);
  const r = s.relationships.find((x) => x.id === relId)!;
  const first = r.name.split(' ')[0];
  s.actionsLeft = Math.max(0, s.actionsLeft - 1);
  const k = `iact:${r.id}`;
  const n = s.yearActs[k] ?? 0;
  s.yearActs[k] = n + 1;
  const f = n === 0 ? 1 : Math.max(0.25, 1 / (1 + 0.6 * n));
  if (action === 'time') {
    r.closeness = clamp(r.closeness + Math.max(1, Math.round(8 * f)));
    s.character.stats.happiness = clamp(s.character.stats.happiness + 2);
    addFeed(s, `You spent quality time with ${first}.`, 'system');
  } else if (action === 'call') {
    r.closeness = clamp(r.closeness + 4);
    addFeed(s, `You checked in with ${first}.`, 'system');
  } else {
    s.character.money -= 50;
    r.closeness = clamp(r.closeness + 6);
    addFeed(s, `You surprised ${first} with a small gift.`, 'system');
  }
  return s;
}

// ---------- autoplay (used for "start at 16" and the simulation script) ----------

/** A simple 'attentive player': spends this year's interactions on the people who need it most. */
export function socialTurn(start: GameState): GameState {
  let s = start;
  while (s.actionsLeft > 0) {
    const people = s.relationships
      .filter((r) => r.alive && (r.kind === 'partner' || r.kind === 'child' || r.kind === 'friend' || r.kind === 'parent'))
      .sort((a, b) => a.closeness - b.closeness);
    if (people.length === 0) break;
    s = interact(s, people[0].id, 'time');
  }
  return s;
}

export function autoChoose(s: GameState): number {
  const cur = currentEvent(s);
  if (!cur) return 0;
  const options = choiceViews(s, cur.ev).filter((v) => v.enabled);
  if (options.length === 0) return -1;
  return pick(s, options).index;
}

export function autoplayTo(start: GameState, untilAge: number, opts: { social?: boolean } = {}): GameState {
  let s = start;
  let guard = 0;
  while (s.phase === 'alive' && s.character.age < untilAge && guard++ < 500) {
    if (opts.social) s = socialTurn(s);
    s = ageUp(s);
    while (s.queue.length > 0 && guard++ < 500) {
      if (s.queue[0].stage === 'choose') {
        const idx = autoChoose(s);
        if (idx < 0) {
          s = { ...s, queue: s.queue.slice(1) };
          continue;
        }
        s = resolveChoice(s, idx);
      }
      s = dismissResult(s);
    }
  }
  return s;
}

