// Run:  npx tsx scripts/simulate.ts [lives]
// Plays many lives with a "player" who randomly tries actions, jobs, purchases and people, then prints sanity stats.
import { newGame, getHeirs, continueAs } from '../src/engine/lifecycle.ts';
import { autoPlayer } from '../src/engine/actions.ts';
import { netWorth } from '../src/engine/finance.ts';
import { PACKS } from '../src/content/index.ts';
import { ACTIONS } from '../src/content/actions.ts';

const N = Number(process.argv[2] ?? 500);
const activity = Number(process.argv[3] ?? 0.7);
const ages: number[] = [];
const causes: Record<string, number> = {};
const fired: Record<string, number> = {};
const acted: Record<string, number> = {};
let generations = 0;
let errors = 0;
const worth: number[] = [];
const jobs: Record<string, number> = {};
let assertFails = 0;

for (let i = 0; i < N; i++) {
  try {
    let s = newGame({
      firstName: 'Test', lastName: 'Sim', gender: 'x', background: (['working', 'middle', 'comfortable', 'wealthy'] as const)[i % 4],
      startAge: 0, seed: 1000 + i, packs: ['entrepreneur', 'wanderlust'], startYear: 2026,
    });
    for (let g = 0; g < 4; g++) {
      s = autoPlayer(s, 130, { activity });
      if (s.phase !== 'dead') throw new Error('did not die by 130');
      ages.push(s.character.age);
      worth.push(netWorth(s));
      causes[s.character.causeOfDeath ?? '?'] = (causes[s.character.causeOfDeath ?? '?'] ?? 0) + 1;
      if (s.character.lastJob) jobs[s.character.lastJob] = (jobs[s.character.lastJob] ?? 0) + 1;
      for (const id of Object.keys(s.eventHistory)) fired[id] = (fired[id] ?? 0) + 1;
      for (const k of Object.keys(s.actionLog)) { const id = k.split('@')[0]; acted[id] = (acted[id] ?? 0) + 1; }
      // invariants
      for (const st of Object.values(s.character.stats)) if (st < 0 || st > 100 || Number.isNaN(st)) assertFails++;
      if (Number.isNaN(s.character.money)) assertFails++;
      for (const a of s.assets) if (Number.isNaN(a.value)) assertFails++;
      const heirs = getHeirs(s);
      if (!heirs.length) break;
      generations++;
      s = continueAs(s, heirs[0].id);
    }
  } catch (e) {
    errors++;
    if (errors < 5) console.error('ERROR in life', i, e);
  }
}
ages.sort((a, b) => a - b);
worth.sort((a, b) => a - b);
const q = (arr: number[], p: number) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
console.log(`lives: ${ages.length}  errors: ${errors}  invariant failures: ${assertFails}  heirs continued: ${generations}`);
console.log(`age at death   p10 ${q(ages, 0.1)}  median ${q(ages, 0.5)}  p90 ${q(ages, 0.9)}   under 20: ${ages.filter((a) => a < 20).length}`);
console.log(`net worth      p10 $${q(worth, 0.1)}  median $${q(worth, 0.5)}  p90 $${q(worth, 0.9)}`);
const allEvents = PACKS.flatMap((p) => p.events.map((e) => e.id));
console.log('events never fired:', allEvents.filter((id) => !fired[id]).join(', ') || 'none');
console.log('actions never used:', ACTIONS.filter((a) => !acted[a.id]).map((a) => a.id).join(', ') || 'none');
console.log('top careers:', Object.entries(jobs).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(', '));
