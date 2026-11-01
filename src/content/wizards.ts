// "Pick what you want" flows. Each wizard is a few screens (steps) and then a result. Add a wizard to WIZARDS and it
// appears in the Do tab under its group. Steps never touch the game's RNG; only run() does.
import type { Effect, GameState, Relationship, SportEntry, WizardDef, WizOption, WizResult, WizStep } from '../engine/types.ts';
import { chance, int, next, pick, uid } from '../engine/rng.ts';
import { startCase } from '../engine/legal.ts';
import { candidates, chemistry, toRelationship, type Cand } from './people.ts';
import { SPORTS, SPORT_BY_ID, levelName } from './sports.ts';
import { styleBonus } from './wardrobe.ts';
import { CRIME_WIZARDS } from './crimes.ts';

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const st = (k: 'health' | 'happiness' | 'smarts' | 'looks' | 'reputation', d: number): Effect => ({ t: 'stat', k, d });
const sk = (k: 'athletics' | 'creativity' | 'tech' | 'charisma', d: number): Effect => ({ t: 'skill', k, d });
const money = (d: number): Effect => ({ t: 'money', d });
const mem = (text: string, tags: string[] = [], weight = 1): Effect => ({ t: 'mem', text, tags, weight });
const clampN = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
const inSchoolNow = (s: GameState) => !!s.character.school || s.character.age < 19;

// ═════════════════════ MEETING PEOPLE ═════════════════════
interface Venue {
  id: string; icon: string; label: string; sub: string; min: number; max: number; cost?: number; teenOnly?: boolean; adultOnly?: boolean;
  ok?: (s: GameState) => string | undefined;
  bandF?: (s: GameState) => [number, number];
}
const adultBand = (s: GameState): [number, number] => [Math.max(18, s.character.age - 7), Math.min(90, s.character.age + 9)];
const teenBand = (s: GameState): [number, number] => [Math.max(13, s.character.age - 1), Math.min(17, s.character.age + 1)];
const bandFor = (s: GameState, v: Venue) => (v.bandF ? v.bandF(s) : s.character.age < 18 ? teenBand(s) : adultBand(s));

const ROMANCE_VENUES: Venue[] = [
  { id: 'dance', icon: '🎶', label: 'School dance', sub: 'Lights low, music loud', min: 13, max: 17 },
  { id: 'hall', icon: '🏫', label: 'Hallways & lunch table', sub: 'Everyone is somebody', min: 13, max: 17 },
  { id: 'teamfun', icon: '🎒', label: 'Club or team hangout', sub: 'Shared interests', min: 13, max: 17 },
  { id: 'app', icon: '📱', label: 'Dating app', sub: 'Swipe, chat, meet', min: 18, max: 99 },
  { id: 'bar', icon: '🍸', label: 'Bar or club', sub: 'Costs $80', min: 21, max: 99, cost: 80 },
  { id: 'campus', icon: '🎓', label: 'On campus', sub: 'Classmates and study groups', min: 18, max: 40, ok: (s) => (s.character.school ? undefined : 'Only while in college'), bandF: (s) => [Math.max(18, s.character.age - 3), s.character.age + 6] },
  { id: 'work', icon: '💼', label: 'Through work', sub: 'Colleagues and clients', min: 18, max: 80, ok: (s) => (s.character.job && !s.character.retired ? undefined : 'You need a job') },
  { id: 'gym', icon: '🏋️', label: 'At the gym', sub: 'Costs $20', min: 18, max: 80, cost: 20 },
  { id: 'friends', icon: '🫶', label: 'Friends set you up', sub: 'Trusted matchmakers', min: 18, max: 99, ok: (s) => (s.relationships.some((r) => r.alive && r.kind === 'friend') ? undefined : 'You need friends first') },
  { id: 'class', icon: '🎨', label: 'Take a class', sub: 'Cooking, art or dance · $60', min: 18, max: 99, cost: 60 },
  { id: 'volunteer', icon: '🤲', label: 'Volunteer day', sub: 'Meet people who care', min: 18, max: 99 },
  { id: 'speed', icon: '⏱️', label: 'Speed dating', sub: 'Costs $40', min: 21, max: 70, cost: 40 },
  { id: 'travel', icon: '🛫', label: 'Travel & hostels', sub: 'Costs $300', min: 18, max: 60, cost: 300, bandF: (s) => [18, Math.min(60, s.character.age + 8)] },
];
const FRIEND_VENUES: Venue[] = [
  { id: 'f_class', icon: '🏫', label: 'Your class', sub: 'People you see every day', min: 5, max: 18, bandF: (s) => [Math.max(4, s.character.age - 1), s.character.age + 1] },
  { id: 'f_team', icon: '🏟️', label: 'Team or club', sub: 'People who share your thing', min: 6, max: 99, bandF: (s) => (s.character.age < 18 ? [Math.max(5, s.character.age - 2), s.character.age + 2] : adultBand(s)) },
  { id: 'f_hood', icon: '🏘️', label: 'The neighborhood', sub: 'The people next door', min: 5, max: 99, bandF: (s) => (s.character.age < 18 ? [Math.max(4, s.character.age - 2), s.character.age + 2] : adultBand(s)) },
  { id: 'f_work', icon: '💼', label: 'At work', sub: 'Coworkers', min: 16, max: 80, ok: (s) => (s.character.job && !s.character.retired ? undefined : 'You need a job'), bandF: (s) => [Math.max(16, s.character.age - 10), s.character.age + 14] },
  { id: 'f_online', icon: '🌐', label: 'Online communities', sub: 'Games, forums, fandoms', min: 13, max: 99, bandF: (s) => (s.character.age < 18 ? [13, 17] : adultBand(s)) },
  { id: 'f_volunteer', icon: '🤲', label: 'Volunteer', sub: 'Good people, good causes', min: 12, max: 99, bandF: (s) => (s.character.age < 18 ? [12, 17] : adultBand(s)) },
  { id: 'f_party', icon: '🎉', label: 'A party', sub: 'Costs $30', min: 16, max: 80, cost: 30, bandF: (s) => (s.character.age < 18 ? [14, 18] : adultBand(s)) },
];

const romanceVenues = (s: GameState) => ROMANCE_VENUES.filter((v) => s.character.age >= v.min && s.character.age <= v.max);
const friendVenues = (s: GameState) => FRIEND_VENUES.filter((v) => s.character.age >= v.min && s.character.age <= v.max);
const candOption = (s: GameState, c: Cand, romance: boolean): WizOption => ({
  id: c.id, label: `${c.name}, ${c.age}`, sub: `${c.job} · ${c.traits.join(', ')}`, portrait: { name: c.name, age: c.age, gender: c.gender, looks: c.looks },
  meter: romance ? { label: 'Chemistry', value: chemistry(s, c) } : undefined, tags: [c.bio],
});

function meetWizard(romance: boolean): WizardDef {
  const venues = romance ? romanceVenues : friendVenues;
  const all = romance ? ROMANCE_VENUES : FRIEND_VENUES;
  return {
    id: romance ? 'meet_love' : 'meet_friend', group: romance ? 'love' : 'social', icon: romance ? '💘' : '🙋',
    label: romance ? 'Meet someone' : 'Make friends', hint: romance ? 'Pick where to go, who to talk to, and how' : 'Pick where to go and who to approach',
    minAge: romance ? 13 : 5,
    steps(s, picks) {
      if (picks.length === 0) {
        return { title: 'Where to?', sub: romance ? 'Different places, different people.' : 'You meet different people in different places.',
          options: venues(s).map((v) => ({ id: v.id, icon: v.icon, label: v.label, sub: v.ok?.(s) ?? v.sub, disabled: v.ok?.(s), cost: v.cost })) };
      }
      const v = all.find((x) => x.id === picks[0])!;
      if (picks.length === 1) {
        const list = candidates(s, v.id, bandFor(s, v), { romance });
        return { title: romance ? 'Who catches your eye?' : 'Who do you approach?', sub: romance ? 'Chemistry shows how well you might click.' : 'Tap a person to see more.',
          options: list.map((c) => candOption(s, c, romance)), refresh: v.id };
      }
      if (picks.length === 2) {
        const teen = s.character.age < 18;
        const opts: WizOption[] = romance
          ? [
              { id: 'chat', icon: '💬', label: teen ? 'Say hi' : 'Strike up a conversation', sub: 'Low pressure' },
              { id: 'date', icon: '🌹', label: teen ? 'Ask to hang out' : 'Ask them out', sub: 'Direct' },
              ...(teen ? [{ id: 'flirt', icon: '✍️', label: 'Pass a note', sub: 'Sweet and nervous' }] : [
                { id: 'flirt', icon: '😏', label: 'Flirt boldly', sub: 'High risk, high reward' },
                { id: 'gift', icon: '🎁', label: 'Buy them something', sub: 'Costs $40', cost: 40 },
              ]),
              { id: 'friends', icon: '🤝', label: 'Just be friends', sub: 'No pressure' },
            ]
          : [
              { id: 'chat', icon: '💬', label: 'Chat them up', sub: 'Free' },
              { id: 'invite', icon: '🍕', label: 'Invite them to do something', sub: 'Costs $20', cost: 20 },
              { id: 'bold', icon: '🎤', label: 'Introduce yourself loudly', sub: 'Risky but memorable' },
            ];
        return { title: 'How do you approach?', options: opts };
      }
      return null;
    },
    run(s, picks) {
      const v = all.find((x) => x.id === picks[0])!;
      const c = candidates(s, v.id, bandFor(s, v), { romance }).find((x) => x.id === picks[1])!;
      const how = picks[2];
      const fx: Effect[] = [];
      const cost = (v.cost ?? 0) + (how === 'gift' ? 40 : how === 'invite' ? 20 : 0);
      if (cost) fx.push(money(-cost));
      const first = c.first;
      const make = (kind: Relationship['kind'], closeness: number, secret = false) => {
        const rel = toRelationship(uid(s, 'r'), c, kind, closeness);
        if (secret) rel.tags.push('secret');
        s.relationships.push(rel);
        return rel;
      };
      const chem = chemistry(s, c) / 100;
      const hasPartner = s.relationships.some((r) => r.alive && r.kind === 'partner');
      const r = next(s);
      let title = romance ? `Meeting ${first}` : `Meeting ${first}`;
      if (!romance) {
        const p = clampN(0.5 + (s.character.skills.charisma - 30) / 200 + (how === 'invite' ? 0.2 : how === 'bold' ? -0.05 : 0), 0.15, 0.93);
        if (r < p) {
          const rel = make('friend', int(s, 38, 62));
          fx.push(st('happiness', 4));
          return { title, cat: 'friends', text: `You and ${first} hit it off. ${how === 'invite' ? 'The invitation works wonders.' : 'The conversation just flows.'} You swap numbers.`, effects: fx, targetId: rel.id };
        }
        fx.push(st('happiness', -1));
        return { title, cat: 'friends', text: pick(s, [`${first} is polite but busy. Maybe another time.`, `The conversation fizzles. Not every connection takes.`, `${first} seems like they already have plans. You head home a little deflated.`]), effects: fx };
      }
      if (how === 'friends') {
        if (r < 0.85) {
          const rel = make('friend', int(s, 40, 60));
          fx.push(st('happiness', 3));
          return { title, cat: 'friends', text: `You keep it easy with ${first}. A solid friendship starts.`, effects: fx, targetId: rel.id };
        }
        return { title, cat: 'friends', text: `${first} is friendly, but the moment passes.`, effects: fx };
      }
      const pRomance = clampN(how === 'chat' ? chem * 0.6 + 0.08 : how === 'date' ? chem * 0.85 - 0.02 : how === 'flirt' ? chem * 0.85 + (c.traits.includes('adventurous') || c.traits.includes('spontaneous') ? 0.1 : 0) - 0.02 : chem * 0.7 + 0.14, 0.04, 0.92);
      const style = styleBonus(s);
      void style;
      if (r < pRomance) {
        const teen = s.character.age < 18;
        const fling = !teen && (how === 'flirt' || hasPartner || c.traits.includes('spontaneous')) && next(s) < (how === 'flirt' ? 0.55 : 0.3);
        if (hasPartner) {
          const rel = make('fling', int(s, 45, 60), true);
          fx.push(st('happiness', 3), st('reputation', -1));
          let t = `${first} is into you. You are already taken, and you both know it. A secret sits between you and your partner now.`;
          if (next(s) < 0.28) {
            fx.push({ t: 'rel', d: -35, who: 'partner' }, st('reputation', -5), st('happiness', -7), mem('I was unfaithful, and it cost me.', ['shame'], 2));
            t += ' Your partner finds out almost immediately. It is ugly.';
          }
          return { title, cat: 'love', text: t, effects: fx, targetId: rel.id };
        }
        if (fling) {
          const rel = make('fling', int(s, 48, 62));
          fx.push(st('happiness', 5));
          return { title, cat: 'love', text: `Sparks. You and ${first} spend the night talking, and the morning after is quietly wonderful. Nothing serious, for now.`, effects: fx, targetId: rel.id };
        }
        const rel = make('partner', int(s, 48, 62));
        fx.push(st('happiness', 8), mem(`Met ${first}, and it clicked.`, ['love'], 2));
        return { title, cat: 'love', text: pick(s, teen ? [`${first} says yes! You spend the whole year grinning like an idiot.`, `${first} blushes, then nods. Your first real crush is mutual.`] : [`${first} laughs at your joke, touches your arm, and says yes. You are officially seeing each other.`, `A real connection with ${first}. You can feel it from the first coffee.`, `You and ${first} close the place down. By the end of the night, you both know.`]), effects: fx, targetId: rel.id };
      }
      if (how !== 'friends' && next(s) < 0.45 && how !== 'flirt') {
        const rel = make('friend', int(s, 38, 55));
        fx.push(st('happiness', 1));
        return { title, cat: 'friends', text: `${first} is not feeling it romantically, but you part as friends.`, effects: fx, targetId: rel.id };
      }
      fx.push(st('happiness', -2));
      return { title, cat: 'love', text: how === 'flirt' ? pick(s, [`${first} laughs, a little too politely. That did not land.`, `You swing for the fences and miss. ${first} turns away.`]) : pick(s, [`${first} smiles kindly and says no thanks. It stings, but you survive.`, `${first} is not interested. At least you were brave.`, 'You chicken out halfway through and pretend you were just looking for the bathroom.']), effects: fx };
    },
  };
}

// ═════════════════════ SPORTS ═════════════════════
const sportList = (s: GameState): SportEntry[] => s.character.sports ?? [];
const LEVEL_REQ = [0, 25, 42, 58, 72, 82, 92]; // athletics needed to hold each level

const sportJoin: WizardDef = {
  id: 'sport_join', group: 'sports', icon: '🏟️', label: 'Join a team or sport', hint: 'Choose your sport, position and level', minAge: 5, maxAge: 70,
  steps(s, picks) {
    const age = s.character.age;
    if (picks.length === 0) {
      return { title: 'Pick a sport', options: SPORTS.filter((x) => age >= x.minAge && age <= x.maxAge + 25).map((x) => ({ id: x.id, icon: x.icon, label: x.label, sub: x.blurb, badge: x.team ? 'TEAM' : 'SOLO', disabled: sportList(s).some((e) => e.id === x.id) ? 'Already playing' : sportList(s).length >= 3 ? 'Max 3 sports at once' : undefined })) };
    }
    const sp = SPORT_BY_ID[picks[0]];
    if (picks.length === 1) return { title: sp.team ? 'Your position' : 'Your event', options: sp.positions.map((p) => ({ id: p, label: p, icon: sp.icon })) };
    if (picks.length === 2) {
      const ath = s.character.skills.athletics;
      const studentAge = age >= 11 && age <= 22;
      const adult = age >= 18;
      const opts: WizOption[] = [
        { id: '0', icon: '🙂', label: 'Rec league', sub: 'Just for fun · ' + fmt(sp.cost * 0.5), cost: Math.round(sp.cost * 0.5) },
        { id: '1', icon: '🏫', label: 'School team tryout', sub: 'Free · tryouts are real', disabled: studentAge ? undefined : 'Ages 11 to 22' },
        { id: '2', icon: '⭐', label: 'Elite club / varsity', sub: `Costs ${fmt(sp.cost * 6)} · Athletics 42+`, cost: sp.cost * 6, disabled: age < 12 ? 'Age 12+' : ath < 42 ? 'Athletics 42+' : undefined },
        { id: '3', icon: '🎓', label: age <= 24 ? 'College / semi-pro team' : 'Semi-pro tryout', sub: 'Athletics 58+', disabled: !adult ? 'Age 18+' : ath < 58 ? 'Athletics 58+' : undefined },
      ];
      return { title: 'What level?', sub: `Your athletics: ${ath}`, options: opts };
    }
    return null;
  },
  run(s, picks) {
    const sp = SPORT_BY_ID[picks[0]];
    const level = Number(picks[2]);
    const ath = s.character.skills.athletics;
    const fx: Effect[] = [];
    const cost = level === 0 ? Math.round(sp.cost * 0.5) : level === 2 ? sp.cost * 6 : 0;
    if (cost) fx.push(money(-cost));
    const p = level === 0 ? 1 : clampN(0.2 + ath / 130 + (sp.team ? 0.05 : 0) - level * 0.07, 0.08, 0.95);
    const ok = next(s) < p;
    if (!ok) {
      fx.push(st('happiness', -3), sk('athletics', 1));
      return { title: `${sp.label} tryout`, cat: 'health', text: `The coach thanks you for coming. You do not make the ${levelName(level, sp.id).toLowerCase()} this time. You can always try again.`, effects: fx };
    }
    const list = [...sportList(s)];
    list.push({ id: sp.id, pos: picks[1], level, years: 0, titles: 0 });
    s.character.sports = list;
    s.character.flags.on_team = true;
    fx.push(st('happiness', 5), sk('athletics', 3));
    const mate = sp.team && next(s) < 0.8 ? toRelationship(uid(s, 'r'), { id: 'x', first: pick(s, ['Dani', 'Cole', 'Tess', 'Amir', 'Bea', 'Jax']), last: s.family.surname, name: '', gender: '', age: Math.max(5, s.character.age + int(s, -2, 2)), looks: 50, traits: ['sporty', 'loyal', 'funny'], job: 'Teammate', bio: '', pull: 0.5 }, 'friend', 55) : undefined;
    if (mate) { mate.name = mate.name || `${pick(s, ['Dani', 'Cole', 'Tess', 'Amir', 'Bea', 'Jax', 'Rae', 'Theo'])} ${pick(s, ['Brooks', 'Silva', 'Park', 'Reed', 'Okoye', 'Lund'])}`; s.relationships.push(mate); }
    return { title: `${sp.label}: you are in`, cat: 'health', text: `You make the ${levelName(level, sp.id).toLowerCase()} as a ${picks[1].toLowerCase()}. ${mate ? `Your new teammate ${mate.name.split(' ')[0]} becomes a friend.` : 'You are ready to compete.'}`, effects: fx, targetId: mate?.id };
  },
};

const sportSeason: WizardDef = {
  id: 'sport_season', group: 'sports', icon: '🏆', label: 'Play a season', hint: 'Train, compete and move up', minAge: 5, requires: [{ t: 'sport', level: 0 }],
  steps(s, picks) {
    if (picks.length === 0) return { title: 'Which sport?', options: sportList(s).map((e) => ({ id: e.id, icon: SPORT_BY_ID[e.id].icon, label: SPORT_BY_ID[e.id].label, sub: `${e.pos} · ${levelName(e.level, e.id)}${e.titles ? ` · ${e.titles} title${e.titles > 1 ? 's' : ''}` : ''}` })) };
    if (picks.length === 1) return { title: 'How hard do you go?', options: [
      { id: 'casual', icon: '🙂', label: 'Casual', sub: 'Have fun, low risk' },
      { id: 'dedicated', icon: '💪', label: 'Dedicated', sub: 'Proper training' },
      { id: 'allin', icon: '🔥', label: 'All in', sub: 'Live and breathe it · more injury risk' },
      { id: 'push', icon: '🩹', label: 'Play through the pain', sub: 'Big upside, big risk' },
    ] };
    return null;
  },
  run(s, picks) {
    const e = sportList(s).find((x) => x.id === picks[0])!;
    const sp = SPORT_BY_ID[e.id];
    const load = ({ casual: 0.5, dedicated: 1, allin: 1.6, push: 2 } as Record<string, number>)[picks[1]];
    const ath = s.character.skills.athletics;
    const fx: Effect[] = [sk('athletics', Math.round(2 + load * 2.5)), st('health', Math.round(sp.body * load * 3 - (picks[1] === 'push' ? 4 : 0))), st('happiness', 2)];
    if (load >= 1.6) fx.push(st('happiness', -1));
    let text = `You commit to a ${picks[1] === 'casual' ? 'relaxed' : picks[1] === 'dedicated' ? 'solid' : picks[1] === 'allin' ? 'punishing' : 'brutal'} season of ${sp.label.toLowerCase()}.`;
    const bits: string[] = [];
    if (next(s) < sp.injury * load * 0.75) {
      const sev = int(s, 6, 20);
      fx.push(st('health', -sev), st('happiness', -4));
      bits.push(pick(s, ['A bad landing sends you to the doctor.', 'You pull something badly and sit out for weeks.', 'An injury ruins the second half of your season.']));
    }
    const need = LEVEL_REQ[e.level + 1] ?? 999;
    const canPro = e.level + 1 < 4 || s.character.age >= 18;
    if (e.level < 6 && ath >= need && canPro && next(s) < 0.14 * load) {
      fx.push({ t: 'sportLevel', id: e.id, d: 1 }, st('reputation', 3), st('happiness', 6));
      bits.push(`You are promoted: ${levelName(e.level + 1, e.id)}!`);
      if (e.level + 1 >= 4 && s.character.job?.field !== 'sports') fx.push({ t: 'hire', field: 'sports' });
    }
    const winP = clampN((ath + e.level * 9 - 35) / 190 * load, 0.02, 0.5);
    if (next(s) < winP) {
      e.titles += 1;
      fx.push(st('reputation', 3 + e.level), st('happiness', 5));
      if (e.level >= 1) fx.push(mem(`Won a ${sp.label.toLowerCase()} title as a ${e.pos.toLowerCase()}.`, ['sports'], 2));
      bits.push(pick(s, ['Your team lifts the trophy.', 'You win the whole thing.', 'You take the title and the crowd chants your name.']));
    } else bits.push(pick(s, ['A respectable season with a few great moments.', 'You win some, lose some, learn plenty.', 'The playoffs just slip away.']));
    e.years += 1;
    if (e.level >= 5 && next(s) < 0.2) fx.push({ t: 'raise', pct: 20 });
    return { title: `${sp.label} season`, cat: 'health', text: `${text} ${bits.join(' ')}`, effects: fx };
  },
};

const sportQuit: WizardDef = {
  id: 'sport_quit', group: 'sports', icon: '🧢', label: 'Leave a team', hint: 'Hang up the jersey', minAge: 5, requires: [{ t: 'sport', level: 0 }],
  steps(s, picks) {
    if (picks.length === 0) return { title: 'Leave which sport?', options: sportList(s).map((e) => ({ id: e.id, icon: SPORT_BY_ID[e.id].icon, label: SPORT_BY_ID[e.id].label, sub: `${levelName(e.level, e.id)}` })) };
    return null;
  },
  run(s, picks) {
    s.character.sports = sportList(s).filter((e) => e.id !== picks[0]);
    if (s.character.sports.length === 0) delete s.character.flags.on_team;
    return { title: 'Hung up the jersey', cat: 'health', text: `You walk away from ${SPORT_BY_ID[picks[0]].label.toLowerCase()}. Every ending is a beginning.`, effects: [st('happiness', -1)] };
  },
};

const FIT = [
  { id: 'gym', icon: '🏋️', label: 'Lift weights', cost: 20, ath: 4, hp: 2, extra: [st('looks', 1)] },
  { id: 'run', icon: '🏃', label: 'Go running', cost: 0, ath: 3, hp: 3, extra: [] },
  { id: 'swim', icon: '🏊', label: 'Swim laps', cost: 10, ath: 3, hp: 3, extra: [] },
  { id: 'yoga', icon: '🧘', label: 'Yoga', cost: 15, ath: 2, hp: 3, extra: [st('happiness', 3)] },
  { id: 'martial', icon: '🥋', label: 'Martial arts class', cost: 60, ath: 5, hp: 2, extra: [sk('charisma', 1)] },
  { id: 'climb', icon: '🧗', label: 'Rock climbing', cost: 30, ath: 5, hp: 2, extra: [] },
  { id: 'cycle', icon: '🚴', label: 'Go for a ride', cost: 0, ath: 3, hp: 3, extra: [st('happiness', 2)] },
  { id: 'hike', icon: '🥾', label: 'Hike a trail', cost: 0, ath: 2, hp: 3, extra: [st('happiness', 4)] },
];
const fitness: WizardDef = {
  id: 'fitness', group: 'sports', icon: '💪', label: 'Work out', hint: 'Choose how you train', minAge: 8,
  steps(s, picks) {
    if (picks.length === 0) return { title: 'How do you train?', options: FIT.map((f) => ({ id: f.id, icon: f.icon, label: f.label, sub: f.cost ? fmt(f.cost) : 'Free', cost: f.cost || undefined })) };
    if (picks.length === 1) return { title: 'How hard?', options: [{ id: 'easy', icon: '🙂', label: 'Easy', sub: 'Feel good' }, { id: 'solid', icon: '💪', label: 'Solid', sub: 'A real session' }, { id: 'brutal', icon: '🔥', label: 'Brutal', sub: 'Chase a personal best · injury risk' }] };
    return null;
  },
  run(s, picks) {
    const f = FIT.find((x) => x.id === picks[0])!;
    const m = picks[1] === 'easy' ? 0.6 : picks[1] === 'solid' ? 1 : 1.6;
    const fx: Effect[] = [sk('athletics', Math.max(1, Math.round(f.ath * m))), st('health', Math.max(1, Math.round(f.hp * m))), ...f.extra];
    if (f.cost) fx.push(money(-f.cost));
    let text = `${f.label}: ${picks[1] === 'brutal' ? 'you leave it all on the floor.' : picks[1] === 'solid' ? 'a good, honest session.' : 'a nice easy one.'}`;
    if (picks[1] === 'brutal' && next(s) < 0.12) { fx.push(st('health', -8)); text += ' You tweak something on the last rep.'; }
    return { title: f.label, cat: 'health', text, effects: fx };
  },
};

// ═════════════════════ CLUBS & LESSONS ═════════════════════
interface Act { id: string; cat: string; icon: string; label: string; min: number; max: number; cost: number; fx: Effect[]; blurb: string; flag?: string }
const ACTS: Act[] = [
  { id: 'drama', cat: 'arts', icon: '🎭', label: 'Drama club', min: 8, max: 99, cost: 30, fx: [sk('charisma', 4), sk('creativity', 2)], blurb: 'Stage, scripts and stage fright' },
  { id: 'paint', cat: 'arts', icon: '🎨', label: 'Painting', min: 6, max: 99, cost: 60, fx: [sk('creativity', 5)], blurb: 'Canvas, colour and mess' },
  { id: 'photo', cat: 'arts', icon: '📷', label: 'Photography', min: 10, max: 99, cost: 80, fx: [sk('creativity', 4), sk('tech', 1)], blurb: 'Learn to see' },
  { id: 'write', cat: 'arts', icon: '✍️', label: 'Creative writing', min: 9, max: 99, cost: 20, fx: [sk('creativity', 4), st('smarts', 1)], blurb: 'Words as a craft', flag: 'writer' },
  { id: 'dance', cat: 'arts', icon: '💃', label: 'Dance class', min: 5, max: 99, cost: 80, fx: [sk('creativity', 2), sk('athletics', 2), sk('charisma', 2)], blurb: 'Move to the music' },
  { id: 'piano', cat: 'music', icon: '🎹', label: 'Piano lessons', min: 5, max: 99, cost: 150, fx: [sk('creativity', 4), st('smarts', 1)], blurb: 'Eighty-eight keys', flag: 'plays_piano' },
  { id: 'guitar', cat: 'music', icon: '🎸', label: 'Guitar lessons', min: 8, max: 99, cost: 120, fx: [sk('creativity', 4), sk('charisma', 1)], blurb: 'Chords and calluses', flag: 'plays_guitar' },
  { id: 'drums', cat: 'music', icon: '🥁', label: 'Drums', min: 8, max: 99, cost: 120, fx: [sk('creativity', 3), sk('athletics', 2)], blurb: 'Make some noise' },
  { id: 'voice', cat: 'music', icon: '🎤', label: 'Singing lessons', min: 7, max: 99, cost: 140, fx: [sk('creativity', 3), sk('charisma', 3)], blurb: 'Find your voice' },
  { id: 'band', cat: 'music', icon: '🎶', label: 'Start a band', min: 12, max: 60, cost: 100, fx: [sk('creativity', 3), sk('charisma', 3), st('reputation', 2)], blurb: 'Garage, gigs, glory' },
  { id: 'debate', cat: 'mind', icon: '🗣️', label: 'Debate team', min: 11, max: 99, cost: 20, fx: [st('smarts', 3), sk('charisma', 3)], blurb: 'Win arguments for sport' },
  { id: 'chess', cat: 'mind', icon: '♟️', label: 'Chess club', min: 7, max: 99, cost: 10, fx: [st('smarts', 4)], blurb: 'Think five moves ahead' },
  { id: 'robot', cat: 'mind', icon: '🤖', label: 'Robotics club', min: 11, max: 99, cost: 60, fx: [sk('tech', 5), st('smarts', 2)], blurb: 'Build, break, rebuild' },
  { id: 'code', cat: 'mind', icon: '💻', label: 'Learn to code', min: 9, max: 99, cost: 40, fx: [sk('tech', 6), st('smarts', 1)], blurb: 'Make computers obey' },
  { id: 'lang', cat: 'mind', icon: '🌍', label: 'Language class', min: 8, max: 99, cost: 90, fx: [st('smarts', 3), sk('charisma', 1)], blurb: 'Speak another world', flag: 'bilingual' },
  { id: 'news', cat: 'mind', icon: '📰', label: 'School paper / blog', min: 11, max: 99, cost: 0, fx: [sk('creativity', 2), st('smarts', 2), st('reputation', 1)], blurb: 'Tell the story first' },
  { id: 'gov', cat: 'social', icon: '🏛️', label: 'Student government', min: 12, max: 22, cost: 0, fx: [sk('charisma', 4), st('reputation', 4)], blurb: 'Campaign promises!' },
  { id: 'party', cat: 'social', icon: '🎉', label: 'Plan events', min: 14, max: 99, cost: 100, fx: [sk('charisma', 3), st('reputation', 2), st('happiness', 3)], blurb: 'The one who throws the party' },
  { id: 'cook', cat: 'social', icon: '🍳', label: 'Cooking class', min: 8, max: 99, cost: 70, fx: [sk('creativity', 3), st('health', 2), st('happiness', 2)], blurb: 'Taste the improvement', flag: 'cooks' },
  { id: 'vol', cat: 'service', icon: '🤲', label: 'Volunteer', min: 10, max: 99, cost: 0, fx: [st('reputation', 4), st('happiness', 4)], blurb: 'Give a little' },
  { id: 'mentor', cat: 'service', icon: '🧑‍🏫', label: 'Mentor kids', min: 16, max: 99, cost: 0, fx: [st('reputation', 3), sk('charisma', 2), st('happiness', 3)], blurb: 'Pay it forward' },
  { id: 'garden', cat: 'outdoors', icon: '🌱', label: 'Gardening', min: 6, max: 99, cost: 30, fx: [st('happiness', 4), st('health', 2)], blurb: 'Dirty hands, calm mind' },
  { id: 'camp', cat: 'outdoors', icon: '⛺', label: 'Camping trips', min: 6, max: 99, cost: 80, fx: [st('happiness', 5), sk('athletics', 2)], blurb: 'Stars, fires, mosquitoes' },
  { id: 'fish', cat: 'outdoors', icon: '🎣', label: 'Fishing', min: 6, max: 99, cost: 40, fx: [st('happiness', 4), st('health', 1)], blurb: 'Patience pays' },
];
const ACT_CATS = [
  { id: 'arts', icon: '🎨', label: 'Arts' }, { id: 'music', icon: '🎵', label: 'Music' }, { id: 'mind', icon: '🧠', label: 'Mind & tech' },
  { id: 'social', icon: '🎉', label: 'Social' }, { id: 'service', icon: '🤲', label: 'Service' }, { id: 'outdoors', icon: '🌲', label: 'Outdoors' },
];
const activity: WizardDef = {
  id: 'activity', group: 'life', icon: '🎯', label: 'Clubs, lessons & hobbies', hint: 'Choose what you want to get good at', minAge: 5,
  steps(s, picks) {
    const age = s.character.age;
    if (picks.length === 0) return { title: 'What kind of thing?', options: ACT_CATS.map((c) => ({ id: c.id, icon: c.icon, label: c.label })) };
    if (picks.length === 1) return { title: 'Choose one', options: ACTS.filter((a) => a.cat === picks[0] && age >= a.min && age <= a.max).map((a) => ({ id: a.id, icon: a.icon, label: a.label, sub: `${a.blurb} · ${a.cost ? fmt(a.cost) : 'Free'}` })) };
    if (picks.length === 2) {
      const a = ACTS.find((x) => x.id === picks[1])!;
      return { title: 'How seriously?', options: [
        { id: 'casual', icon: '🙂', label: 'Casually', sub: fmt(a.cost), cost: a.cost || undefined },
        { id: 'serious', icon: '📚', label: 'Seriously', sub: fmt(a.cost * 2), cost: a.cost * 2 || undefined },
        { id: 'compete', icon: '🏅', label: 'Go for the top', sub: `${fmt(a.cost * 3)} · enter competitions`, cost: a.cost * 3 || undefined },
      ] };
    }
    return null;
  },
  run(s, picks) {
    const a = ACTS.find((x) => x.id === picks[1])!;
    const m = picks[2] === 'casual' ? 0.7 : picks[2] === 'serious' ? 1.3 : 1.8;
    const cost = Math.round(a.cost * (picks[2] === 'casual' ? 1 : picks[2] === 'serious' ? 2 : 3));
    const fx: Effect[] = a.fx.map((e) => ((e.t === 'stat' || e.t === 'skill') ? { ...e, d: Math.max(1, Math.round(e.d * m)) } : e));
    if (cost) fx.push(money(-cost));
    if (a.flag) fx.push({ t: 'flag', k: a.flag, v: true });
    fx.push({ t: 'flag', k: `hobby_${a.id}`, v: true });
    let text = `${a.label}: you ${picks[2] === 'casual' ? 'ease into it and enjoy the ride' : picks[2] === 'serious' ? 'put in real hours and improve fast' : 'train like it matters'}.`;
    let tid: string | undefined;
    if (next(s) < 0.4) {
      const names = ['Ari', 'Bex', 'Cam', 'Dre', 'Eli', 'Fern', 'Gio', 'Hollis'];
      const nm = `${pick(s, names)} ${pick(s, ['Moss', 'Tran', 'Ayala', 'Kerr', 'Pike', 'Nasser'])}`;
      const rel = toRelationship(uid(s, 'r'), { id: 'x', first: nm.split(' ')[0], last: nm.split(' ')[1], name: nm, gender: pick(s, ['Female', 'Male']), age: Math.max(5, s.character.age + int(s, -3, 4)), looks: 55, traits: ['driven', 'funny', 'kind'], job: 'Fellow member', bio: '', pull: 0.5 }, 'friend', 52);
      s.relationships.push(rel);
      tid = rel.id;
      text += ` You also befriend ${nm.split(' ')[0]}.`;
    }
    if (picks[2] === 'compete') {
      if (next(s) < 0.3 + s.character.stats.smarts / 400 + s.character.skills.creativity / 400) { fx.push(st('reputation', 5), st('happiness', 6), mem(`Won recognition for ${a.label.toLowerCase()}.`, ['hobby'], 2)); text += ' You take first place!'; }
      else { fx.push(st('happiness', -1)); text += ' You fall short, but you learn a lot.'; }
    }
    return { title: a.label, cat: 'life', text, effects: fx, targetId: tid };
  },
};

// ═════════════════════ VACATIONS ═════════════════════
const DEST = [
  { id: 'beach', icon: '🏖️', label: 'Beach resort', base: 1400, blurb: 'Sun, sand, nothing to do' },
  { id: 'city', icon: '🌆', label: 'Big city weekend', base: 1800, blurb: 'Museums, food, lights' },
  { id: 'mountain', icon: '🏔️', label: 'Mountain cabin', base: 900, blurb: 'Quiet and crisp air' },
  { id: 'road', icon: '🚐', label: 'Road trip', base: 700, blurb: 'Windows down, no plan' },
  { id: 'europe', icon: '🏰', label: 'European tour', base: 4500, blurb: 'Five countries, twelve days' },
  { id: 'asia', icon: '🏯', label: 'Tokyo & beyond', base: 4200, blurb: 'Neon, temples, noodles' },
  { id: 'safari', icon: '🦁', label: 'Safari', base: 5600, blurb: 'Wild things, wide sky' },
  { id: 'cruise', icon: '🛳️', label: 'Cruise', base: 3000, blurb: 'Buffets and sunsets' },
  { id: 'backpack', icon: '🎒', label: 'Backpacking', base: 1300, blurb: 'Hostels and strangers' },
  { id: 'stay', icon: '🛋️', label: 'Staycation', base: 150, blurb: 'Your own city, on purpose' },
];
const vacation: WizardDef = {
  id: 'vacation', group: 'life', icon: '✈️', label: 'Take a trip', hint: 'Pick where, how, and with whom', minAge: 12,
  steps(s, picks) {
    const rels = s.relationships.filter((r) => r.alive);
    if (picks.length === 0) return { title: 'Where to?', options: DEST.map((d) => ({ id: d.id, icon: d.icon, label: d.label, sub: `${d.blurb} · from ${fmt(d.base * 0.6)}` })) };
    if (picks.length === 1) {
      const d = DEST.find((x) => x.id === picks[0])!;
      return { title: 'What style?', options: [
        { id: 'budget', icon: '🪙', label: 'Budget', sub: fmt(d.base * 0.6), cost: Math.round(d.base * 0.6) },
        { id: 'comfort', icon: '🛏️', label: 'Comfortable', sub: fmt(d.base), cost: d.base },
        { id: 'lux', icon: '🥂', label: 'Luxury', sub: fmt(d.base * 2.6), cost: Math.round(d.base * 2.6) },
      ] };
    }
    if (picks.length === 2) {
      const opts: WizOption[] = [{ id: 'solo', icon: '🧍', label: 'Go solo', sub: 'Meet whoever you meet' }];
      for (const r of rels.filter((x) => x.kind === 'partner').slice(0, 1)) opts.push({ id: r.id, icon: '💞', label: r.name.split(' ')[0], sub: 'Partner', portrait: { name: r.name, age: r.age, gender: r.gender } });
      for (const r of rels.filter((x) => x.kind === 'friend').slice(0, 3)) opts.push({ id: r.id, icon: '🤝', label: r.name.split(' ')[0], sub: 'Friend', portrait: { name: r.name, age: r.age, gender: r.gender } });
      opts.push({ id: 'family', icon: '👨‍👩‍👧', label: 'Bring the family', sub: 'Everyone comes' });
      return { title: 'Who comes along?', options: opts };
    }
    return null;
  },
  run(s, picks) {
    const d = DEST.find((x) => x.id === picks[0])!;
    const mult = picks[1] === 'budget' ? 0.6 : picks[1] === 'comfort' ? 1 : 2.6;
    const cost = Math.round(d.base * mult);
    const fx: Effect[] = [money(-cost), st('happiness', picks[1] === 'lux' ? 9 : 6), st('health', picks[0] === 'mountain' || picks[0] === 'beach' ? 2 : 0)];
    const who = s.relationships.find((r) => r.id === picks[2]);
    let text = `You spend your trip at ${d.label.toLowerCase()}${picks[1] === 'budget' ? ' on a shoestring' : picks[1] === 'lux' ? ' in absurd comfort' : ''}.`;
    let tid: string | undefined;
    if (who) { fx.push({ t: 'rel', d: 10, who: 'target' }); tid = who.id; text += ` ${who.name.split(' ')[0]} makes it better.`; }
    else if (picks[2] === 'family') { fx.push({ t: 'rel', d: 6, who: 'parent' }, { t: 'rel', d: 6, who: 'child' }); text += ' The family makes memories you will retell for years.'; }
    const r = next(s);
    if (r < 0.12) { fx.push(money(-int(s, 100, 500)), st('happiness', -2)); text += ' Your wallet goes missing on day two.'; }
    else if (r < 0.28 && picks[2] === 'solo' && s.character.age >= 18) {
      const c = candidates(s, `trip:${d.id}`, [18, Math.min(60, s.character.age + 8)], { romance: true, n: 1 })[0];
      const rel = toRelationship(uid(s, 'r'), c, 'fling', 52);
      s.relationships.push(rel); tid = rel.id; fx.push(st('happiness', 4));
      text += ` You meet ${c.first}, ${c.traits[0]} and ${c.traits[1]}. A holiday romance blooms.`;
    } else if (r < 0.45) { fx.push(mem(`An unforgettable trip to ${d.label.toLowerCase()}.`, ['travel'], 2), sk('charisma', 1)); text += ' A perfect day you will never forget.'; }
    fx.push({ t: 'flag', k: 'traveled', v: true });
    return { title: d.label, cat: 'life', text, effects: fx, targetId: tid };
  },
};

// ═════════════════════ NIGHTLIFE ═════════════════════
const NIGHT = [
  { id: 'house', icon: '🏠', label: 'House party', min: 15, cost: 20 },
  { id: 'concert', icon: '🎸', label: 'Concert', min: 12, cost: 90 },
  { id: 'club', icon: '🪩', label: 'Nightclub', min: 18, cost: 60 },
  { id: 'bar', icon: '🍺', label: 'Bar crawl', min: 21, cost: 80 },
  { id: 'karaoke', icon: '🎤', label: 'Karaoke', min: 16, cost: 40 },
  { id: 'bonfire', icon: '🔥', label: 'Beach bonfire', min: 14, cost: 0 },
];
const night: WizardDef = {
  id: 'night', group: 'social', icon: '🌃', label: 'Night out', hint: 'Where, what you get up to, how you get home', minAge: 14,
  steps(s, picks) {
    const age = s.character.age;
    if (picks.length === 0) return { title: 'Where to?', options: NIGHT.filter((n) => age >= n.min - 2).map((n) => ({ id: n.id, icon: n.icon, label: n.label, sub: n.cost ? fmt(n.cost) : 'Free', cost: n.cost || undefined, disabled: age < n.min ? `Age ${n.min}+` : undefined })) };
    if (picks.length === 1) return { title: 'What kind of night?', options: [
      { id: 'dance', icon: '💃', label: 'Dance and meet people', sub: 'Social' },
      { id: 'drink', icon: '🥃', label: 'Drink up', sub: age < 21 ? 'Underage · risky' : 'Wild night', disabled: age < 18 ? 'Not at your age' : undefined },
      { id: 'sober', icon: '🥤', label: 'Stay sober, enjoy it', sub: 'Clear-headed fun' },
      { id: 'trouble', icon: '🔥', label: 'Chase trouble', sub: 'See what happens', disabled: age < 16 ? 'Age 16+' : undefined },
    ] };
    if (picks.length === 2) return { title: 'Getting home', options: [
      { id: 'ride', icon: '🚕', label: 'Rideshare', sub: '$25', cost: 25 },
      { id: 'stay', icon: '🛋️', label: 'Crash on a couch', sub: 'Free' },
      ...(s.character.flags.licensed ? [{ id: 'drive', icon: '🚗', label: 'Drive yourself', sub: picks[1] === 'drink' ? 'You are in no shape to drive' : 'Free' }] : []),
    ] };
    return null;
  },
  run(s, picks) {
    const n = NIGHT.find((x) => x.id === picks[0])!;
    const fx: Effect[] = [];
    if (n.cost) fx.push(money(-n.cost));
    if (picks[2] === 'ride') fx.push(money(-25));
    let text = `${n.label}: `;
    let tid: string | undefined;
    const how = picks[1];
    if (how === 'dance') { fx.push(st('happiness', 5), sk('charisma', 2)); text += 'you dance until your feet give out.'; }
    else if (how === 'sober') { fx.push(st('happiness', 3), st('health', 1)); text += 'you remember everything, which is a gift.'; }
    else if (how === 'drink') { fx.push(st('happiness', 4), st('health', -3), { t: 'flag', k: 'drinks', v: true }); text += pick(s, ['a great night you only half remember.', 'you pay for it the next morning.']); if (s.character.age < 21) fx.push(st('reputation', -1)); }
    else { fx.push(st('happiness', 3)); text += 'the night gets interesting.'; if (next(s) < 0.3) { fx.push(st('reputation', -4), st('health', -4)); text += ' A scuffle breaks out and you are in the middle of it.'; if (next(s) < 0.2 && s.character.age >= 18) { startCase(s, { crimeId: 'brawl', label: 'Bar fight', sev: 2, evidence: 70, year: s.year }); text += ' Police arrive.'; } } }
    if (how !== 'sober' && next(s) < 0.4 && s.character.age >= 16) {
      const c = candidates(s, `night:${picks[0]}`, s.character.age < 18 ? [Math.max(14, s.character.age - 1), 17] : [Math.max(18, s.character.age - 5), s.character.age + 8], { romance: false, n: 1 })[0];
      const rel = toRelationship(uid(s, 'r'), c, 'friend', int(s, 38, 55)); s.relationships.push(rel); tid = rel.id;
      text += ` You also meet ${c.first}, who becomes a friend.`;
    }
    if (picks[2] === 'drive') {
      const drunk = how === 'drink';
      if (next(s) < (drunk ? 0.33 : 0.02)) {
        if (next(s) < 0.2) { fx.push(st('health', -25)); text += ' You wrap the car around a pole. You survive, barely.'; }
        startCase(s, { crimeId: 'dui', label: 'Driving under the influence', sev: 3, evidence: 92, year: s.year });
        text += ' Flashing lights in the mirror. You are arrested.';
      } else if (drunk) text += ' You make it home. You will not always be that lucky.';
    }
    return { title: 'Night out', cat: 'friends', text, effects: fx, targetId: tid };
  },
};

// ═════════════════════ MONEY: GAMBLING, HUSTLES, GIVING ═════════════════════
const GAMES = [
  { id: 'slots', icon: '🎰', label: 'Slots', p: 0.44, pay: 2, blurb: 'Pure luck' },
  { id: 'bj', icon: '🃏', label: 'Blackjack', p: 0.47, pay: 2, blurb: 'Some skill' },
  { id: 'roulette', icon: '🎡', label: 'Roulette', p: 0.47, pay: 2, blurb: 'Red or black' },
  { id: 'poker', icon: '♠️', label: 'Poker night', p: 0.43, pay: 2, blurb: 'Smarts count' },
  { id: 'sports', icon: '🏈', label: 'Sports betting', p: 0.46, pay: 2, blurb: 'Back your team' },
  { id: 'lotto', icon: '🎟️', label: 'Lottery tickets', p: 0.1, pay: 3, blurb: 'Dream big' },
];
const gamble: WizardDef = {
  id: 'gamble', group: 'money', icon: '🎰', label: 'Gamble', hint: 'Pick a game and a stake', minAge: 18,
  steps(s, picks) {
    if (picks.length === 0) return { title: 'Pick your game', options: GAMES.map((g) => ({ id: g.id, icon: g.icon, label: g.label, sub: g.blurb })) };
    if (picks.length === 1) return { title: 'How much?', options: [20, 200, 2000, 20000].map((v) => ({ id: String(v), icon: '💵', label: fmt(v), disabled: s.character.money < v ? 'Not enough cash' : undefined })) };
    return null;
  },
  run(s, picks) {
    const g = GAMES.find((x) => x.id === picks[0])!;
    const stake = Number(picks[1]);
    let p = g.p + (g.id === 'poker' ? (s.character.stats.smarts - 50) / 300 : g.id === 'bj' ? (s.character.stats.smarts - 50) / 500 : 0);
    const roll = next(s);
    const fx: Effect[] = [{ t: 'flag', k: 'gambler', v: true }];
    if (g.id === 'lotto') {
      if (next(s) < 0.0004) { fx.push(money(250000), st('happiness', 25), mem('Hit the jackpot on a lottery ticket.', ['luck'], 3)); return { title: 'JACKPOT', cat: 'money', text: 'Six numbers line up. You stare at the ticket for a full minute. You are rich.', effects: fx }; }
      p = 0.09;
    }
    if (roll < p) { const win = Math.round(stake * (g.pay - 1)); fx.push(money(win), st('happiness', 4)); return { title: g.label, cat: 'money', text: `You win ${fmt(win)} at ${g.label.toLowerCase()}. The adrenaline is real.`, effects: fx }; }
    fx.push(money(-stake), st('happiness', -(stake >= 2000 ? 6 : 2)));
    if (stake >= 2000 && next(s) < 0.25) fx.push({ t: 'flag', k: 'gambler_trouble', v: true });
    return { title: g.label, cat: 'money', text: `You lose ${fmt(stake)} at ${g.label.toLowerCase()}. The house always smiles first.`, effects: fx };
  },
};

const HUSTLES = [
  { id: 'odd', icon: '🧹', label: 'Odd jobs & yard work', min: 11, base: 120, skill: 'athletics' as const },
  { id: 'dogs', icon: '🐕', label: 'Dog walking', min: 11, base: 150, skill: 'charisma' as const },
  { id: 'tutor', icon: '📚', label: 'Tutoring', min: 15, base: 350, skill: 'charisma' as const },
  { id: 'resell', icon: '📦', label: 'Reselling stuff online', min: 14, base: 300, skill: 'tech' as const },
  { id: 'deliver', icon: '🛵', label: 'Delivery driving', min: 16, base: 650, skill: 'athletics' as const },
  { id: 'stream', icon: '📺', label: 'Streaming', min: 13, base: 150, skill: 'charisma' as const },
  { id: 'design', icon: '🖌️', label: 'Freelance design', min: 15, base: 700, skill: 'creativity' as const },
  { id: 'dev', icon: '💻', label: 'Freelance coding', min: 15, base: 1100, skill: 'tech' as const },
  { id: 'busk', icon: '🎵', label: 'Busking', min: 10, base: 200, skill: 'creativity' as const },
  { id: 'photo', icon: '📷', label: 'Event photography', min: 16, base: 600, skill: 'creativity' as const },
];
const hustle: WizardDef = {
  id: 'hustle', group: 'money', icon: '💸', label: 'Side hustle', hint: 'Make some money your way', minAge: 11,
  steps(s, picks) {
    if (picks.length === 0) return { title: 'Choose your hustle', options: HUSTLES.filter((h) => s.character.age >= h.min).map((h) => ({ id: h.id, icon: h.icon, label: h.label, sub: `Skill: ${h.skill} · ~${fmt(h.base)}` })) };
    return null;
  },
  run(s, picks) {
    const h = HUSTLES.find((x) => x.id === picks[0])!;
    const skill = s.character.skills[h.skill];
    let pay = Math.round(h.base * (0.5 + skill / 70 + next(s) * 0.6));
    const fx: Effect[] = [{ t: 'skill', k: h.skill, d: 2 }];
    let text = `${h.label}: you earn ${fmt(pay)}.`;
    if (next(s) < 0.06 + skill / 900) { const bonus = pay * int(s, 2, 6); pay += bonus; text = `${h.label}: something goes viral and you pull in ${fmt(pay)}!`; fx.push(st('reputation', 3), st('happiness', 4)); }
    fx.push(money(pay));
    return { title: h.label, cat: 'money', text, effects: fx };
  },
};

const CAUSES = [
  { id: 'food', icon: '🍲', label: 'Food bank', rep: 3 }, { id: 'animals', icon: '🐾', label: 'Animal rescue', rep: 3 },
  { id: 'edu', icon: '📖', label: 'Scholarship fund', rep: 4 }, { id: 'health', icon: '🏥', label: "Children's hospital", rep: 4 },
  { id: 'env', icon: '🌳', label: 'Conservation', rep: 3 }, { id: 'arts', icon: '🎭', label: 'Community arts', rep: 3 },
];
const charity: WizardDef = {
  id: 'charity', group: 'money', icon: '🤲', label: 'Give to a cause', hint: 'Choose a cause and an amount', minAge: 12,
  steps(s, picks) {
    if (picks.length === 0) return { title: 'Choose a cause', options: CAUSES.map((c) => ({ id: c.id, icon: c.icon, label: c.label })) };
    if (picks.length === 1) return { title: 'How much?', options: [20, 200, 2000, 20000].map((v) => ({ id: String(v), icon: '💝', label: fmt(v), disabled: s.character.money < v ? 'Not enough cash' : undefined })) };
    return null;
  },
  run(s, picks) {
    const c = CAUSES.find((x) => x.id === picks[0])!;
    const amt = Number(picks[1]);
    const big = amt >= 2000;
    return { title: `Gave to ${c.label.toLowerCase()}`, cat: 'money', text: `You give ${fmt(amt)} to the ${c.label.toLowerCase()}. ${big ? 'Your name is read out at the gala.' : 'It feels good, and it matters.'}`, effects: [money(-amt), st('reputation', c.rep + (big ? 3 : 0)), st('happiness', 3 + (big ? 2 : 0)), ...(big ? [mem(`Made a generous gift to the ${c.label.toLowerCase()}.`, ['giving'], 2)] : [])] };
  },
};

export const WIZARDS: WizardDef[] = [
  meetWizard(true), meetWizard(false), night, sportJoin, sportSeason, sportQuit, fitness, activity, vacation, gamble, hustle, charity,
  ...CRIME_WIZARDS,
];
export const getWizard = (id: string) => WIZARDS.find((w) => w.id === id);
export type { WizResult, WizStep };
