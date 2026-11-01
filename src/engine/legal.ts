// Crime and punishment. Pure rules: crimes leave "heat" and sometimes a hidden case that can resurface years later;
// arrests lead to a verdict, and a verdict can lead to prison, where life plays out differently.
import type { Case, GameState, Legal } from './types.ts';
import { chance, int, next } from './rng.ts';

export const newLegal = (): Legal => ({ heat: 0, record: [], uncaught: [], underworld: 0 });
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

function feed(s: GameState, text: string, kind: 'event' | 'milestone' | 'system' = 'event') {
  s.nextId += 1;
  s.feed.push({ id: `f${s.nextId}`, age: s.character.age, year: s.year, text, kind, cat: 'crime' });
}

export const felonies = (s: GameState) => s.legal.record.filter((r) => r.sev >= 4).length;

export function sentenceFor(sev: number, priors: number): { kind: 'fine' | 'probation' | 'prison'; years: number; fine: number } {
  const bump = 1 + Math.min(priors, 4) * 0.2;
  const table: Record<number, [number, number]> = { 4: [1, 2], 5: [2, 4], 6: [4, 7], 7: [7, 12], 8: [12, 20], 9: [20, 30], 10: [35, 45] };
  if (sev <= 1) return { kind: 'fine', years: 0, fine: 400 + sev * 300 };
  if (sev === 2) return { kind: priors >= 2 ? 'probation' : 'fine', years: 1, fine: 1500 };
  if (sev === 3) return priors >= 2 ? { kind: 'prison', years: 1, fine: 2500 } : { kind: 'probation', years: 2, fine: 2500 };
  const [lo, hi] = table[Math.min(10, sev)];
  return { kind: 'prison', years: Math.round(((lo + hi) / 2) * bump), fine: sev * 1500 };
}

export function startCase(s: GameState, c: Case): void {
  s.legal.case = c;
  s.legal.heat = clamp(s.legal.heat + 12);
}

/** Queue the arrest popup (once) when a case is waiting. */
export function queueArrest(s: GameState): void {
  if (!s.legal.case || s.legal.prison || s.queue.some((q) => q.eventId === 'legal_arrest')) return;
  s.queue.push({ eventId: 'legal_arrest', stage: 'choose' });
}

export function applyVerdict(s: GameState, mode: 'pd' | 'lawyer' | 'elite' | 'plea' | 'bribe' | 'run' | 'innocent', notes: string[]): void {
  const c = s.legal.case;
  const L = s.legal;
  const ch = s.character;
  if (!c) return;
  let evidence = c.evidence;
  let mult = 1;
  let forced = false;
  let extra = '';
  if (mode === 'lawyer') evidence -= 14;
  if (mode === 'elite') evidence -= 30;
  if (mode === 'plea') { forced = true; mult = 0.55; }
  if (mode === 'bribe') {
    if (chance(s, 0.3 + L.underworld / 250)) {
      L.case = undefined;
      L.underworld = clamp(L.underworld + 4);
      notes.push('The right envelope reaches the right hands. The file simply... disappears.');
      return;
    }
    forced = true; mult = 1.3; extra = ' The bribe attempt is added to the charges.';
  }
  if (mode === 'run') {
    if (chance(s, 0.32 + ch.skills.athletics / 250)) {
      L.fugitive = true;
      L.uncaught.push({ ...c, evidence: Math.max(c.evidence, 75) });
      L.case = undefined;
      L.heat = clamp(L.heat + 25);
      ch.job = null;
      notes.push('You bolt. Behind you: sirens, shouting, then silence. You are now a fugitive, and every year you stay free is a gamble.');
      return;
    }
    forced = true; mult = 1.2; extra = ' Running only made it worse.';
  }
  const convictP = Math.max(0.03, Math.min(0.97, evidence / 100 - (ch.stats.reputation - 50) / 400));
  const convicted = forced || chance(s, convictP);
  L.case = undefined;
  if (!convicted) {
    L.heat = clamp(L.heat - 8);
    if (c.innocent) {
      const pay = int(s, 6000, 24000);
      ch.money += pay;
      ch.stats.reputation = clamp(ch.stats.reputation + 3);
      notes.push(`Not guilty. The jury needed under an hour. You receive ${money(pay)} for the wrongful arrest and a story for life.`);
    } else {
      notes.push('Not guilty! The evidence falls apart. You walk out with your record clean.');
    }
    return;
  }
  const priors = felonies(s);
  const sen = sentenceFor(c.sev, priors);
  const years = Math.max(sen.kind === 'prison' ? 1 : 0, Math.round(sen.years * mult));
  ch.stats.reputation = clamp(ch.stats.reputation - c.sev * 2 - 2);
  ch.stats.happiness = clamp(ch.stats.happiness - 3 - c.sev);
  if (sen.kind === 'fine') {
    ch.money -= sen.fine;
    notes.push(`Guilty. A ${money(sen.fine)} fine and a stern look from the judge.${extra}`);
    L.record.push({ crimeId: c.crimeId, label: c.label, year: s.year, outcome: `Fined ${money(sen.fine)}`, sev: c.sev });
  } else if (sen.kind === 'probation') {
    ch.money -= sen.fine;
    L.probation = Math.max(L.probation ?? 0, years || 1);
    notes.push(`Guilty. ${years || 1} year${(years || 1) > 1 ? 's' : ''} of probation and a ${money(sen.fine)} fine. Step out of line and you go inside.${extra}`);
    L.record.push({ crimeId: c.crimeId, label: c.label, year: s.year, outcome: `Probation ${years || 1}y`, sev: c.sev });
  } else {
    const facility = c.sev <= 4 ? 'County jail' : c.sev <= 6 ? 'State prison' : 'Maximum security prison';
    L.prison = { yearsLeft: years, total: years, facility, conduct: 50, crew: false, reason: c.label };
    L.probation = undefined;
    if (ch.job) { ch.lastJob = ch.job.title; ch.job = null; }
    ch.money -= Math.round(sen.fine * 0.5);
    notes.push(`Guilty. ${years} year${years > 1 ? 's' : ''} at ${facility}.${extra} The door closes behind you.`);
    L.record.push({ crimeId: c.crimeId, label: c.label, year: s.year, outcome: `${years}y at ${facility}`, sev: c.sev });
    feed(s, `You are sentenced to ${years} years at ${facility} for ${c.label.toLowerCase()}.`, 'milestone');
  }
  for (const r of s.relationships) {
    if (r.alive && (r.kind === 'partner' || r.kind === 'parent' || r.kind === 'child')) r.closeness = clamp(r.closeness - (c.sev >= 4 ? 8 : 3));
  }
}

export function release(s: GameState, how: 'served' | 'parole'): void {
  const L = s.legal;
  const p = L.prison;
  if (!p) return;
  L.prison = undefined;
  L.probation = how === 'parole' ? Math.max(1, Math.min(4, p.yearsLeft)) : 1;
  L.heat = clamp(L.heat * 0.4);
  s.character.stats.reputation = clamp(s.character.stats.reputation - 4);
  s.character.stats.happiness = clamp(s.character.stats.happiness + 10);
  s.character.flags.ex_con = true;
  feed(s, how === 'parole' ? 'Paroled. You step outside into a different world than the one you left.' : 'Sentence served. You walk out a free person with a record.', 'milestone');
}

/** One year of legal life. Returns true when you spent the year locked up (so normal work and bills pause). */
export function legalYear(s: GameState): boolean {
  const L = s.legal;
  const ch = s.character;
  if (L.prison) {
    const p = L.prison;
    p.yearsLeft -= 1;
    p.conduct = clamp(p.conduct + int(s, -3, 3));
    ch.stats.health = clamp(ch.stats.health - int(s, 0, p.facility.startsWith('Max') ? 4 : 2));
    ch.stats.happiness = clamp(ch.stats.happiness - int(s, 0, 3));
    ch.money += 0;
    if (p.yearsLeft <= 0) release(s, 'served');
    return true;
  }
  L.heat = clamp(L.heat - 8);
  if (L.probation) {
    L.probation -= 1;
    if (L.probation <= 0) L.probation = undefined;
    else if (L.heat > 45 && chance(s, 0.3)) {
      L.prison = { yearsLeft: 1, total: 1, facility: 'County jail', conduct: 45, crew: false, reason: 'Probation violation' };
      if (ch.job) { ch.lastJob = ch.job.title; ch.job = null; }
      L.probation = undefined;
      feed(s, 'Your probation officer finds a violation. You are back inside for a year.', 'milestone');
      return true;
    }
  }
  if (L.case) return false;
  if (L.fugitive && chance(s, 0.22) && L.uncaught.length) {
    const c = L.uncaught.pop()!;
    L.fugitive = false;
    startCase(s, { ...c, evidence: 85 });
    feed(s, 'After years looking over your shoulder, a routine traffic stop ends it. They run your name.', 'milestone');
    return false;
  }
  for (const c of [...L.uncaught]) {
    if (L.fugitive) break;
    const p = 0.025 + c.sev * 0.006 + L.heat / 900;
    if (chance(s, p)) {
      L.uncaught = L.uncaught.filter((x) => x !== c);
      startCase(s, { ...c, evidence: int(s, 35, 72) });
      feed(s, pick3(s, [
        `Years later, new DNA testing ties you to ${c.label.toLowerCase()}.`,
        `Someone you once trusted talks to detectives about ${c.label.toLowerCase()}.`,
        `A cold case team reopens ${c.label.toLowerCase()} and your name comes up.`,
        `Enhanced security footage from the ${c.label.toLowerCase()} turns up. It is unmistakably you.`,
      ]), 'milestone');
      return false;
    }
  }
  if (ch.age >= 16 && L.uncaught.length && chance(s, L.heat / 100 * 0.18)) {
    const c = L.uncaught.shift()!;
    startCase(s, { ...c, evidence: int(s, 45, 70) });
    feed(s, 'You are pulled over for a "routine check". It is not routine. They have been watching you.', 'milestone');
    return false;
  }
  if (ch.age >= 16 && chance(s, 0.0012)) {
    startCase(s, { crimeId: 'mistaken', label: 'Mistaken identity (you did not do it)', sev: 4, evidence: 38, year: s.year, innocent: true });
    feed(s, 'Police arrive with a warrant for someone who looks just like you. They have the wrong person, but try telling them that.', 'milestone');
  }
  return false;
}
const pick3 = <T,>(s: GameState, a: T[]): T => a[Math.floor(next(s) * a.length)];

export function legalOk(s: GameState): boolean {
  return !s.legal.prison;
}
