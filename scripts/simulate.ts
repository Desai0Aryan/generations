// Run:  npx tsx scripts/simulate.ts   (or: node --experimental-strip-types scripts/simulate.ts)
// Plays many lives with random choices and prints sanity statistics.
import { newGame, autoplayTo, getHeirs, continueAs } from '../src/engine/lifecycle.ts';
import { EVENTS_FOR_TEST } from './util.ts';

const N = Number(process.argv[2] ?? 2000);
const ages: number[] = [];
const causes: Record<string, number> = {};
const fired: Record<string, number> = {};
let generations = 0;
let errors = 0;
const money: number[] = [];

for (let i = 0; i < N; i++) {
  try {
    let s = newGame({
      firstName: 'Test', lastName: 'Sim', gender: 'x', background: (['working', 'middle', 'comfortable', 'wealthy'] as const)[i % 4],
      startAge: 0, seed: 1000 + i, packs: ['entrepreneur'], startYear: 2026,
    });
    for (let g = 0; g < 4; g++) {
      s = autoplayTo(s, 130, { social: true });
      if (s.phase !== 'dead') throw new Error('did not die by 130');
      ages.push(s.character.age);
      money.push(s.character.peakMoney);
      const c = s.character.causeOfDeath ?? '?';
      causes[c] = (causes[c] ?? 0) + 1;
      for (const id of Object.keys(s.eventHistory)) fired[id] = (fired[id] ?? 0) + 1;
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
const med = ages[Math.floor(ages.length / 2)];
const mean = ages.reduce((a, b) => a + b, 0) / ages.length;
money.sort((a, b) => a - b);
console.log(`lives simulated: ${ages.length}, errors: ${errors}, heirs continued: ${generations}`);
console.log(`age at death  mean ${mean.toFixed(1)}  median ${med}  p10 ${ages[Math.floor(ages.length * 0.1)]}  p90 ${ages[Math.floor(ages.length * 0.9)]}  <20: ${ages.filter((a) => a < 20).length}`);
console.log(`peak money    median $${money[Math.floor(money.length / 2)]}  p90 $${money[Math.floor(money.length * 0.9)]}`);
console.log('causes', causes);
const never = EVENTS_FOR_TEST.filter((id) => !fired[id]);
console.log('events never fired:', never.length ? never.join(', ') : 'none');
const top = Object.entries(fired).sort((a, b) => b[1] - a[1]).slice(0, 5);
console.log('most common:', top.map(([k, v]) => `${k}:${v}`).join(', '));
