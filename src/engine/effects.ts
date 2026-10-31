import type { Effect, GameState, Relationship } from './types.ts';
import { EDU_RANK } from './types.ts';
import { FIRST_NAMES } from './names.ts';
import { freshName, int, uid } from './rng.ts';
import { fill } from './text.ts';
import { amortize } from './finance.ts';
import { FIELD_BY_ID } from '../content/jobs.ts';
import { MAJORS, TIER_INFO } from '../content/education.ts';

export interface EffectContext {
  targetId?: string;
  died?: string;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function applyEffects(s: GameState, effects: Effect[], ctx: EffectContext = {}): void {
  const ch = s.character;
  const target = () => s.relationships.find((r) => r.id === ctx.targetId);

  for (const e of effects) {
    switch (e.t) {
      case 'stat':
        ch.stats[e.k] = clamp(ch.stats[e.k] + e.d);
        break;
      case 'money':
        ch.money = Math.round(ch.money + e.d);
        if (ch.money > ch.peakMoney) ch.peakMoney = ch.money;
        break;
      case 'flag':
        ch.flags[e.k] = e.v ?? true;
        break;
      case 'mem':
        s.memories.push({
          id: uid(s, 'm'),
          year: s.year,
          age: ch.age,
          text: fill(s, e.text, target()),
          tags: e.tags ?? [],
          weight: e.weight ?? 1,
        });
        break;
      case 'rel': {
        const who = e.who ?? 'target';
        const list: Relationship[] =
          who === 'target'
            ? ([target()].filter(Boolean) as Relationship[])
            : s.relationships.filter((r) => r.kind === who && r.alive);
        for (const r of list) r.closeness = clamp(r.closeness + e.d);
        break;
      }
      case 'rtag': {
        const t = target();
        if (t && !t.tags.includes(e.tag)) t.tags.push(e.tag);
        break;
      }
      case 'addRel': {
        const family = e.kind === 'child' || e.kind === 'sibling' || e.kind === 'parent';
        const rel: Relationship = {
          id: uid(s, 'r'),
          kind: e.kind,
          name: `${e.name ?? freshName(s, FIRST_NAMES)}${family ? ' ' + ch.lastName : ''}`,
          age: e.age ?? (e.kind === 'child' ? 0 : Math.max(1, ch.age + int(s, -2, 3))),
          closeness: e.closeness ?? int(s, 40, 65),
          alive: true,
          tags: [],
        };
        s.relationships.push(rel);
        if (e.bind) ctx.targetId = rel.id;
        break;
      }
      case 'endRel': {
        const t = target();
        if (!t) break;
        if (t.kind === 'partner' || t.kind === 'fling') {
          if (t.kind === 'partner') {
            ch.flags.married = false;
            ch.flags.cohabit = false;
          }
          t.kind = 'ex';
          t.closeness = Math.min(t.closeness, 20);
        } else {
          t.closeness = clamp(t.closeness - 40);
        }
        break;
      }
      case 'relkind': {
        const t = target();
        if (t) t.kind = e.kind;
        break;
      }
      case 'job':
        ch.job = { title: e.title, salary: e.salary, years: 0, field: e.field, level: 0, lvlYears: 0, perf: 50 };
        ch.lastJob = e.title;
        ch.retired = false;
        break;
      case 'raise':
        if (ch.job) ch.job.salary = Math.round(ch.job.salary * (1 + e.pct / 100));
        break;
      case 'quit':
        ch.job = null;
        break;
      case 'retire':
        if (ch.job) ch.retired = true;
        break;
      case 'edu':
        if (EDU_RANK[e.level] > EDU_RANK[ch.education]) ch.education = e.level;
        break;
      case 'skill':
        ch.skills[e.k] = clamp(ch.skills[e.k] + e.d);
        break;
      case 'perf':
        if (ch.job) ch.job.perf = clamp((ch.job.perf ?? 50) + e.d);
        break;
      case 'hire': {
        const f = FIELD_BY_ID[e.field];
        if (!f) break;
        const lvl = ch.job?.field === f.id ? ch.job.level ?? 0 : 0;
        const rung = f.ladder[Math.min(lvl, f.ladder.length - 1)];
        ch.job = { title: rung.title, salary: rung.salary, years: 0, field: f.id, level: lvl, lvlYears: 0, perf: 50 };
        ch.lastJob = rung.title;
        ch.retired = false;
        delete ch.flags.reference;
        break;
      }
      case 'enroll': {
        const info = TIER_INFO[e.tier];
        ch.school = { tier: e.tier, kind: e.kind ?? 'college', years: 0, length: e.length ?? info.length, tuition: e.tuition ?? info.tuition, gpa: 3.0, degree: e.degree };
        ch.flags.inCollege = true;
        ch.stats.reputation = clamp(ch.stats.reputation + info.rep);
        break;
      }
      case 'major': {
        const m = MAJORS.find((x) => x.id === e.name);
        for (const k of Object.keys(ch.flags)) if (k.startsWith('major_')) delete ch.flags[k];
        ch.major = m?.label ?? e.name;
        ch.flags[`major_${e.name}`] = true;
        break;
      }
      case 'gpa':
        if (ch.school) ch.school.gpa = Math.max(1, Math.min(4, Math.round((ch.school.gpa + e.d) * 100) / 100));
        break;
      case 'dropout':
        ch.school = undefined;
        ch.flags.inCollege = false;
        break;
      case 'loan': {
        ch.money += e.amount;
        s.loans.push({ id: uid(s, 'l'), label: e.label, balance: e.amount, rate: e.rate, yearly: amortize(e.amount, e.rate, e.years) });
        break;
      }
      case 'payDebt': {
        let pay = Math.max(0, Math.min(e.amount, ch.money));
        for (const l of [...s.loans].sort((a, b) => b.rate - a.rate)) {
          if (pay <= 0) break;
          const p = Math.min(pay, l.balance);
          l.balance -= p;
          pay -= p;
          ch.money -= p;
        }
        for (const l of s.loans.filter((x) => x.balance <= 0)) {
          const a = s.assets.find((x) => x.loanId === l.id);
          if (a) a.loanId = undefined;
        }
        s.loans = s.loans.filter((x) => x.balance > 0);
        break;
      }
      case 'die':
        ctx.died = e.cause;
        break;
    }
  }
}
