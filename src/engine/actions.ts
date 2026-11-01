// The player-driven side of the game: do things on purpose.
//   - performAction: anything in content/actions.ts (dates, training, investing...)
//   - applyForJob:   the job board
//   - buyAsset / sellAsset: cars, homes, luxury, pets (with financing)
// All pure: state in -> new state out.
import type { ActionDef, ChoiceDef, Condition, Effect, EventDef, GameState, Relationship, WizardDef, WizStep } from './types.ts';
import { EDU_RANK } from './types.ts';
import { checkAll } from './conditions.ts';
import { applyEffects } from './effects.ts';
import { weightedPick, uid, pick } from './rng.ts';
import { fill } from './text.ts';
import { addFeed, ageUp, clone, dismissResult, kill, presentResult, resolveChoice, snapshotFor, currentEvent, choiceViews } from './lifecycle.ts';
import { amortize, creditLimit, loansBalance } from './finance.ts';
import { ACTIONS, getAction } from '../content/actions.ts';
import { CATALOG_BY_ID } from '../content/assets.ts';
import { FIELD_BY_ID, type Field } from '../content/jobs.ts';
import { WIZARDS, getWizard } from '../content/wizards.ts';
import { queueArrest } from './legal.ts';

type Cat = EventDef['category'];
const GROUP_CAT: Record<ActionDef['group'], Cat> = {
  love: 'love', social: 'friends', school: 'school', career: 'work', sports: 'health', money: 'money', health: 'health', family: 'family', life: 'life', crime: 'crime', prison: 'crime',
};

const keyFor = (id: string, targetId?: string) => (targetId ? `${id}@${targetId}` : id);
const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

// ───────── availability ─────────

export interface Status { ok: boolean; reason?: string }

export function actionStatus(s: GameState, a: ActionDef, targetId?: string): Status {
  if (s.phase !== 'alive' || s.queue.length > 0) return { ok: false, reason: 'Finish what is happening first' };
  const jailed = !!s.legal.prison;
  if (jailed && a.group !== 'prison') return { ok: false, reason: 'Not possible in prison' };
  if (!jailed && a.group === 'prison') return { ok: false, reason: 'Not available right now' };
  const age = s.character.age;
  if (age < a.minAge) return { ok: false, reason: `Age ${a.minAge}+` };
  if (age > a.maxAge) return { ok: false, reason: 'Too late for this' };
  if (!checkAll(s, a.requires, true)) return { ok: false, reason: 'Not available right now' };
  if (a.target) {
    const t = s.relationships.find((r) => r.id === targetId);
    if (!t || !t.alive || !targetMatches(t, a)) return { ok: false, reason: 'Not available for them' };
  }
  const last = s.actionLog[keyFor(a.id, targetId)];
  if (a.repeat === 'once' && last !== undefined) return { ok: false, reason: 'Already done' };
  return { ok: true };
}

export function targetMatches(r: Relationship, a: ActionDef): boolean {
  const f = a.target;
  if (!f) return true;
  const kinds = Array.isArray(f.kind) ? f.kind : [f.kind];
  return (
    kinds.includes(r.kind) &&
    (f.minCloseness === undefined || r.closeness >= f.minCloseness) &&
    (f.maxCloseness === undefined || r.closeness <= f.maxCloseness) &&
    (f.tag === undefined || r.tags.includes(f.tag)) &&
    (f.notTag === undefined || !r.tags.includes(f.notTag))
  );
}

/** actions that apply to this person (shown when you tap them in the People tab) */
export function actionsForPerson(s: GameState, r: Relationship): { action: ActionDef; status: Status }[] {
  return ACTIONS.filter((a) => a.target && targetMatches(r, a) && s.character.age >= a.minAge && s.character.age <= a.maxAge)
    .map((action) => ({ action, status: actionStatus(s, action, r.id) }));
}

export function choiceStates(s: GameState, a: ActionDef): { index: number; choice: ChoiceDef; enabled: boolean; reason?: string }[] {
  return a.choices.map((choice, index) => {
    if (choice.cost && s.character.money < choice.cost) return { index, choice, enabled: false, reason: `Need ${fmt(choice.cost)}` };
    if (!checkAll(s, choice.requires, true)) return { index, choice, enabled: false, reason: 'Requirements not met' };
    return { index, choice, enabled: true };
  });
}

// ───────── perform an action ─────────

export function performAction(prev: GameState, id: string, choiceIndex = 0, targetId?: string): GameState {
  const a = getAction(id);
  if (!a || !actionStatus(prev, a, targetId).ok) return prev;
  const cs = choiceStates(prev, a)[choiceIndex];
  if (!cs || !cs.enabled) return prev;

  const s = clone(prev);
  const choice = a.choices[choiceIndex];
  const before = snapshotFor(s, targetId);
  if (choice.cost) s.character.money -= choice.cost;
  s.actionLog[keyFor(a.id, targetId)] = s.year;
  const fk = keyFor(a.id, targetId);
  const nDone = s.yearActs[fk] ?? 0;
  s.yearActs[fk] = nDone + 1;

  const outcome =
    weightedPick(s, choice.outcomes, (o) => (o.weight ?? 1) + (o.bias ? (o.bias.amt * (s.character.stats[o.bias.k] - 50)) / 50 : 0)) ??
    choice.outcomes[0];
  const ctx = { targetId, died: undefined as string | undefined, notes: [] as string[] };
  applyEffects(s, fatigue(outcome.effects, nDone), ctx);
  const target = s.relationships.find((r) => r.id === ctx.targetId);
  const text = fill(s, outcome.text, target) + (ctx.notes.length ? ' ' + ctx.notes.join(' ') : '') + (nDone >= 2 ? ' (You are getting diminishing returns from repeating this.)' : '');

  const title = a.choices.length > 1 ? `${a.label}: ${choice.label}` : a.label;
  presentResult(s, { title, cat: GROUP_CAT[a.group], text, before, targetId: ctx.targetId });
  addFeed(s, `${title}. ${text}`, 'choice', GROUP_CAT[a.group]);
  if (ctx.died) kill(s, ctx.died);
  return s;
}

/** Doing the same thing again and again this year works less well. Never a hard limit, just realism. */
export function fatigueFactor(n: number): number {
  return n <= 0 ? 1 : Math.max(0.25, 1 / (1 + 0.6 * n));
}
function fatigue(effects: Effect[], n: number): Effect[] {
  if (n <= 0) return effects;
  const f = fatigueFactor(n);
  return effects.map((e) => {
    if ((e.t === 'stat' || e.t === 'skill' || e.t === 'rel' || e.t === 'perf' || e.t === 'gpa') && e.d > 0) return { ...e, d: Math.max(1, Math.round(e.d * f)) } as Effect;
    return e;
  });
}

// ───────── wizards (pick-your-option flows) ─────────

export function wizardStatus(s: GameState, w: WizardDef): Status {
  if (s.phase !== 'alive' || s.queue.length > 0) return { ok: false, reason: 'Finish what is happening first' };
  const jailed = !!s.legal.prison;
  if (jailed && w.group !== 'prison') return { ok: false, reason: 'Not possible in prison' };
  if (!jailed && w.group === 'prison') return { ok: false, reason: 'Not available right now' };
  if (s.character.age < w.minAge) return { ok: false, reason: `Age ${w.minAge}+` };
  if (w.maxAge !== undefined && s.character.age > w.maxAge) return { ok: false, reason: 'Too late for this' };
  if (!checkAll(s, w.requires, true)) return { ok: false, reason: 'Not available right now' };
  return { ok: true };
}

/** The next screen of a wizard, or null if the picks are complete. Safe to call while rendering (never uses the game's RNG). */
export function wizardStep(s: GameState, wizId: string, picks: string[]): WizStep | null {
  const w = getWizard(wizId);
  return w ? w.steps(s, picks) : null;
}

export function wizardRun(prev: GameState, wizId: string, picks: string[]): GameState {
  const w = getWizard(wizId);
  if (!w || !wizardStatus(prev, w).ok) return prev;
  const s = clone(prev);
  const before = snapshotFor(s);
  const res = w.run(s, picks);
  const ctx = { targetId: res.targetId, died: undefined as string | undefined, notes: [] as string[] };
  applyEffects(s, res.effects, ctx);
  const text = res.text + (ctx.notes.length ? ' ' + ctx.notes.join(' ') : '');
  presentResult(s, { title: res.title, cat: res.cat, text, before, targetId: ctx.targetId });
  addFeed(s, `${res.title}. ${text}`, 'choice', res.cat);
  queueArrest(s);
  if (ctx.died) kill(s, ctx.died);
  return s;
}
export function refreshPool(prev: GameState, key: string): GameState {
  const s = clone(prev);
  s.pools[key] = (s.pools[key] ?? 0) + 1;
  return s;
}
export { WIZARDS };

// ───────── job board ─────────

export interface JobCheck { ok: boolean; reasons: string[]; chance: number }

export function jobCheck(s: GameState, f: Field): JobCheck {
  const ch = s.character;
  const r = f.req;
  const reasons: string[] = [];
  if (ch.age < r.minAge) reasons.push(`Age ${r.minAge}+`);
  if (r.maxAge && ch.age > r.maxAge) reasons.push(`Age ${r.maxAge} or younger`);
  const skillOk = r.orSkill ? ch.skills[r.orSkill[0]] >= r.orSkill[1] : false;
  if (r.edu && EDU_RANK[ch.education] < EDU_RANK[r.edu] && !skillOk) {
    reasons.push(r.orSkill ? `${eduName(r.edu)} or ${r.orSkill[0]} ${r.orSkill[1]}+` : eduName(r.edu));
  }
  if (r.smarts && ch.stats.smarts < r.smarts) reasons.push(`Smarts ${r.smarts}+`);
  if (r.health && ch.stats.health < r.health) reasons.push(`Health ${r.health}+`);
  if (r.skill && ch.skills[r.skill[0]] < r.skill[1]) reasons.push(`${cap(r.skill[0])} ${r.skill[1]}+`);
  (r.flags ?? []).forEach((fl, i) => { if (!ch.flags[fl]) reasons.push(r.flagLabels?.[i] ?? fl); });
  const st = ch.stats;
  const L = s.legal;
  if (L.record.some((x) => x.sev >= 4) && !['trades', 'service', 'retail', 'business', 'creative'].includes(f.id)) reasons.push('Clean record');
  let p = 0.78 - f.difficulty * 0.62 - (L.record.length ? 0.1 : 0) + (st.smarts - 50) / 260 + (st.reputation - 50) / 320 + (ch.skills.charisma - 30) / 320;
  if (ch.flags.reference) p += 0.12;
  if (r.skill) p += (ch.skills[r.skill[0]] - r.skill[1]) / 250;
  p = Math.max(0.06, Math.min(0.93, p));
  return { ok: reasons.length === 0, reasons, chance: p };
}
const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
const eduName = (e: string) => ({ none: 'Anything', highschool: 'High school diploma', trade: 'Trade certificate', college: "Bachelor's degree", grad: 'Graduate degree' } as Record<string, string>)[e] ?? e;

export function applyForJob(prev: GameState, fieldId: string): GameState {
  const f = FIELD_BY_ID[fieldId];
  if (!f || prev.phase !== 'alive' || prev.queue.length > 0 || prev.legal.prison) return prev;
  const chk = jobCheck(prev, f);
  if (!chk.ok) return prev;
  if (prev.character.job?.field === fieldId && !prev.character.retired) return prev;

  const s = clone(prev);
  const before = snapshotFor(s);
  const tries = s.yearActs[`apply:${fieldId}`] ?? 0;
  s.yearActs[`apply:${fieldId}`] = tries + 1;
  const odds = Math.max(0.03, chk.chance * Math.pow(0.8, tries));
  const hired = weightedPick(s, [true, false], (x) => (x ? odds : 1 - odds)) ?? false;
  const old = s.character.job;
  if (hired) {
    applyEffects(s, [{ t: 'hire', field: fieldId }, { t: 'stat', k: 'happiness', d: 4 }]);
    const j = s.character.job!;
    const text = `${old && !s.character.retired ? `You leave your job as ${old.title}. ` : ''}You are now a ${j.title}, earning ${fmt(j.salary)} a year.`;
    presentResult(s, { title: `Hired: ${f.label}`, cat: 'work', text, before });
    addFeed(s, text, 'milestone', 'work');
  } else {
    applyEffects(s, [{ t: 'stat', k: 'happiness', d: -2 }]);
    const text = pick(s, [
      `The ${f.label.toLowerCase()} interviews go nowhere. They went with someone with a stronger fit.`,
      'You get a polite email that begins with "unfortunately". On to the next one.',
      'They liked you, but not enough. Keep building your skills and try again.',
    ]);
    presentResult(s, { title: `Rejected: ${f.label}`, cat: 'work', text, before });
    addFeed(s, text, 'event', 'work');
  }
  return s;
}

// ───────── buying & selling ─────────

export interface BuyCheck { ok: boolean; reason?: string; cashPrice: number; downPayment: number; yearly: number; canFinance: boolean }

export function buyCheck(s: GameState, itemId: string, mode: 'cash' | 'finance'): BuyCheck {
  const it = CATALOG_BY_ID[itemId];
  const none = { cashPrice: 0, downPayment: 0, yearly: 0, canFinance: false };
  if (!it) return { ok: false, reason: 'Unknown item', ...none };
  const canFinance = !!it.finance;
  const down = it.finance ? Math.round(it.price * it.finance.down) : 0;
  const yearly = it.finance ? amortize(it.price - down, it.finance.rate, it.finance.years) : 0;
  const base = { cashPrice: it.price, downPayment: down, yearly, canFinance };
  if (s.phase !== 'alive' || s.queue.length > 0) return { ok: false, reason: 'Finish what is happening first', ...base };
  if (s.legal.prison) return { ok: false, reason: 'Not possible in prison', ...base };
  if (s.character.age < it.minAge) return { ok: false, reason: `Age ${it.minAge}+`, ...base };
  if (!checkAll(s, it.requires, true)) return { ok: false, reason: it.requireText ?? 'Requirements not met', ...base };
  if (mode === 'finance') {
    if (!it.finance) return { ok: false, reason: 'Cannot be financed', ...base };
    if (s.character.money < down) return { ok: false, reason: `Need ${fmt(down)} down`, ...base };
    if (loansBalance(s) + it.price - down > creditLimit(s)) return { ok: false, reason: `Over your credit limit (${fmt(creditLimit(s))})`, ...base };
  } else if (s.character.money < it.price) {
    return { ok: false, reason: `Need ${fmt(it.price)}`, ...base };
  }
  return { ok: true, ...base };
}

export function buyAsset(prev: GameState, itemId: string, mode: 'cash' | 'finance'): GameState {
  const chk = buyCheck(prev, itemId, mode);
  const it = CATALOG_BY_ID[itemId];
  if (!chk.ok || !it) return prev;
  const s = clone(prev);
  const before = snapshotFor(s);
  const ch = s.character;
  const assetId = uid(s, 'a');
  let loanId: string | undefined;
  if (mode === 'finance' && it.finance) {
    ch.money -= chk.downPayment;
    loanId = uid(s, 'l');
    s.loans.push({ id: loanId, label: `${it.name} loan`, balance: it.price - chk.downPayment, rate: it.finance.rate, yearly: chk.yearly, assetId });
  } else {
    ch.money -= it.price;
  }
  s.assets.push({ id: assetId, itemId: it.id, kind: it.kind, name: it.name, emoji: it.emoji, value: it.price, price: it.price, boughtYear: s.year, upkeep: it.upkeep, rate: it.rate, loanId });
  applyEffects(s, it.effects ?? []);
  const text =
    mode === 'finance'
      ? `You put ${fmt(chk.downPayment)} down and finance the rest: ${fmt(chk.yearly)} a year. ${it.name}: yours.`
      : `You pay ${fmt(it.price)} and the ${it.name.toLowerCase()} is yours.`;
  presentResult(s, { title: `New: ${it.name}`, cat: it.kind === 'home' ? 'family' : 'money', text, before });
  addFeed(s, text, 'milestone', 'money');
  return s;
}

export function sellAsset(prev: GameState, assetId: string): GameState {
  const a0 = prev.assets.find((a) => a.id === assetId);
  if (!a0 || prev.phase !== 'alive' || prev.queue.length > 0) return prev;
  const s = clone(prev);
  const before = snapshotFor(s);
  const a = s.assets.find((x) => x.id === assetId)!;
  const loan = s.loans.find((l) => l.id === a.loanId);
  const payoff = loan?.balance ?? 0;
  s.character.money += a.value - payoff;
  s.loans = s.loans.filter((l) => l.id !== a.loanId);
  s.assets = s.assets.filter((x) => x.id !== assetId);
  if (a.kind === 'home') s.character.flags.owns_home = s.assets.some((x) => x.kind === 'home');
  if (a.kind === 'pet') s.character.stats.happiness = Math.max(0, s.character.stats.happiness - 4);
  const text = `You sell the ${a.name.toLowerCase()} for ${fmt(a.value)}${payoff ? ` and pay off ${fmt(payoff)} owed` : ''}. Net: ${fmt(a.value - payoff)}.`;
  presentResult(s, { title: `Sold: ${a.name}`, cat: 'money', text, before });
  addFeed(s, text, 'system', 'money');
  return s;
}

// ───────── simulation helper: a player who tries things ─────────

export function autoPlayer(start: GameState, untilAge: number, opts: { activity?: number; crime?: number } = {}): GameState {
  let s = start;
  let guard = 0;
  const activity = opts.activity ?? 0.7;
  const resolveQueue = () => {
    while (s.queue.length > 0 && guard++ < 4000) {
      if (s.queue[0].stage === 'choose') {
        const cur = currentEvent(s);
        const opts2 = cur ? choiceViews(s, cur.ev).filter((v) => v.enabled) : [];
        if (opts2.length === 0) { s = { ...s, queue: s.queue.slice(1) }; continue; }
        s = resolveChoice(s, pick(s, opts2).index);
      }
      s = dismissResult(s);
    }
  };
  while (s.phase === 'alive' && s.character.age < untilAge && guard++ < 4000) {
    s = ageUp(s);
    resolveQueue();
    if (s.phase !== 'alive') break;
    // try a handful of random things this year
    for (let i = 0; i < 6 && s.actionsLeft > 0 && s.phase === 'alive'; i++) {
      if (Math.random() > activity) break;
      const r = Math.random();
      if (r < 0.2) {
        const fields = Object.values(FIELD_BY_ID).filter((f) => f.id !== 'business' && jobCheck(s, f).ok);
        if (fields.length) s = applyForJob(s, fields[Math.floor(Math.random() * fields.length)].id);
      } else if (r < 0.32) {
        const items = Object.values(CATALOG_BY_ID);
        const it = items[Math.floor(Math.random() * items.length)];
        const mode = Math.random() < 0.5 ? 'finance' : 'cash';
        s = buyAsset(s, it.id, mode);
      } else if (r < 0.52) {
        const ws = WIZARDS.filter((w) => wizardStatus(s, w).ok && (w.group !== 'crime' || Math.random() < (opts.crime ?? 0.15)));
        if (ws.length) {
          const w = ws[Math.floor(Math.random() * ws.length)];
          const picks: string[] = [];
          for (let k = 0; k < 6; k++) {
            const step = wizardStep(s, w.id, picks);
            if (!step) break;
            const ok = step.options.filter((o) => !o.disabled);
            if (!ok.length) { picks.length = 0; break; }
            picks.push(ok[Math.floor(Math.random() * ok.length)].id);
          }
          if (picks.length) s = wizardRun(s, w.id, picks);
        }
      } else if (r < 0.57 && s.assets.length) {
        s = sellAsset(s, s.assets[Math.floor(Math.random() * s.assets.length)].id);
      } else {
        // random person action or general action
        const people = s.relationships.filter((x) => x.alive);
        const person = Math.random() < 0.4 && people.length ? people[Math.floor(Math.random() * people.length)] : undefined;
        const pool = ACTIONS.filter((a) => (person ? !!a.target && targetMatches(person, a) : !a.target) && actionStatus(s, a, person?.id).ok);
        if (pool.length) {
          const a = pool[Math.floor(Math.random() * pool.length)];
          const ok = choiceStates(s, a).filter((c) => c.enabled);
          if (ok.length) s = performAction(s, a.id, ok[Math.floor(Math.random() * ok.length)].index, person?.id);
        }
      }
      resolveQueue();
    }
  }
  return s;
}

export type { Condition };
