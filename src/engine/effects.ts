import type { Effect, GameState, Relationship } from './types.ts';
import { EDU_RANK } from './types.ts';
import { FIRST_NAMES } from './names.ts';
import { freshName, int, uid } from './rng.ts';
import { fill } from './text.ts';

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
        if (t.kind === 'partner') {
          t.kind = 'ex';
          t.closeness = Math.min(t.closeness, 20);
          ch.flags.married = false;
        } else {
          t.closeness = clamp(t.closeness - 40);
        }
        break;
      }
      case 'job':
        ch.job = { title: e.title, salary: e.salary, years: 0 };
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
      case 'die':
        ctx.died = e.cause;
        break;
    }
  }
}
