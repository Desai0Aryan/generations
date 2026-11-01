// Courtroom, prison and street-level consequences. Events whose id starts with "pr_" only happen inside prison.
import type { EventDef } from '../engine/types.ts';
import { addRel, bond, mem, money, opt, out, stat, flag } from './dsl.ts';

const inPrison = { t: 'legal', is: 'prison' } as const;
const free = { t: 'legal', is: 'free' } as const;

export const LEGAL_EVENTS: EventDef[] = [
  {
    id: 'legal_arrest', pack: 'core', category: 'crime', title: 'Arrested', minAge: 0, maxAge: 200, weight: 0,
    text: 'The cuffs are cold. The charge on the paperwork: {case}. A decision awaits: how will you face this?',
    choices: [
      opt('Public defender', 'Free. Overworked but experienced.', [out('You stand before the judge with a tired public defender at your side.', [{ t: 'verdict', mode: 'pd' }])]),
      opt('Hire a private lawyer', 'Costs $6,000', [out('Your lawyer files motions all week. You stand before the judge better prepared.', [{ t: 'verdict', mode: 'lawyer' }])], { cost: 6000 }),
      opt('Hire a top defense team', 'Costs $40,000', [out('A legal dream team files everything and shreds the evidence.', [{ t: 'verdict', mode: 'elite' }])], { cost: 40000 }),
      opt('Plead guilty', 'A lighter sentence for certain guilt', [out('You take the deal and stand before the judge.', [{ t: 'verdict', mode: 'plea' }])]),
      opt('Try to bribe your way out', 'Costs $15,000 · risky', [out('You make a very quiet phone call.', [money(-15000), { t: 'verdict', mode: 'bribe' }])], { cost: 0, requires: [{ t: 'money', op: '>=', v: 15000 }] }),
      opt('Run for it', 'Become a fugitive', [out('You see your chance and take it.', [{ t: 'verdict', mode: 'run' }])]),
    ],
  },
  // ── on the outside ──
  {
    id: 'cr_snitch', pack: 'core', category: 'crime', title: 'Loose lips', minAge: 14, maxAge: 90, weight: 0.8, cooldown: 4,
    text: 'Someone you know hints that they know what you did. They are not subtle about it.',
    conditions: [free, { t: 'any', cs: [{ t: 'flag', k: 'did_burglary' }, { t: 'flag', k: 'did_storerob' }, { t: 'flag', k: 'did_corner' }, { t: 'flag', k: 'did_card' }, { t: 'flag', k: 'did_gta' }, { t: 'flag', k: 'did_embezzle' }] }],
    target: { kind: ['friend', 'rival', 'coworker'] },
    choices: [
      opt('Pay them to stay quiet', 'Costs $2,500', [out('They take the envelope and swear they never saw anything.', [money(-2500), { t: 'heat', d: -8 }])], { cost: 2500 }),
      opt('Threaten them', undefined, [out('They go pale and promise to shut up.', [{ t: 'heat', d: 8 }, bond(-30), stat('reputation', -3)], 2), out('They go straight to the police. It just got worse.', [{ t: 'heat', d: 28 }, bond(-50), stat('happiness', -5)], 1)]),
      opt('Ignore it', undefined, [out('Nothing happens. Probably.', [{ t: 'heat', d: 2 }], 3), out('The rumour spreads quietly through the neighbourhood.', [{ t: 'heat', d: 12 }], 1)]),
      opt('Turn yourself in', 'Clear your conscience', [out('You walk into a police station and tell the truth. A lawyer later says it was the best thing you could have done.', [stat('happiness', 10), stat('reputation', 2), { t: 'heat', d: -30 }, mem('I turned myself in, and I slept better that night.', ['redemption'], 2)])]),
    ],
  },
  {
    id: 'cr_stopped', pack: 'core', category: 'crime', title: 'Pulled over', minAge: 16, maxAge: 90, weight: 1.2, cooldown: 3,
    text: 'Red and blue lights fill your mirror. The officer asks a few too many questions. Your name is on a list.',
    conditions: [free, { t: 'flag', k: 'licensed' }, { t: 'any', cs: [{ t: 'legal', is: 'record' }, { t: 'flag', k: 'drinks' }] }],
    choices: [
      opt('Cooperate politely', undefined, [out('You answer calmly and are sent on your way.', [stat('reputation', 0)], 4), out('They search the car and find nothing. A long, uncomfortable half hour.', [stat('happiness', -2)], 1)]),
      opt('Talk your way out', undefined, [out('Your charm works. They wave you on with a warning.', [{ t: 'skill', k: 'charisma', d: 1 }], 2, { k: 'reputation', amt: 1 }), out('Your attitude makes things worse. You get a hefty ticket.', [money(-400), stat('happiness', -3)], 1.5)]),
      opt('Floor it', 'Absolutely not advised', [out('You lose them. Your heart pounds for an hour.', [{ t: 'heat', d: 15 }, stat('happiness', 2)], 1), out('A short, humiliating chase ends in handcuffs.', [{ t: 'heat', d: 20 }, money(-1500), stat('reputation', -6)], 3)]),
    ],
  },
  // ── prison events ──
  {
    id: 'pr_cellmate', pack: 'core', category: 'crime', title: 'New cellmate', minAge: 0, maxAge: 200, weight: 1.5, cooldown: 3,
    text: 'A new cellmate drops their bag on the bunk. Over the next few weeks you learn a lot about each other.', conditions: [inPrison],
    choices: [
      opt('Befriend them', undefined, [out('A real friendship forms in the grey. You will keep in touch.', [addRel('friend', { closeness: 62 }), stat('happiness', 4), { t: 'conduct', d: 3 }], 3), out('They turn out to be exhausting company.', [stat('happiness', -2)], 1)]),
      opt('Keep your distance', undefined, [out('A quiet, tense peace holds.', [{ t: 'conduct', d: 2 }])]),
      opt('Establish dominance', undefined, [out('They back down. Nobody bothers you for months.', [{ t: 'conduct', d: -6 }, stat('reputation', 0)], 2), out('It turns into a fight and a night in solitary.', [{ t: 'conduct', d: -14 }, stat('health', -7)], 2)]),
    ],
  },
  {
    id: 'pr_riot', pack: 'core', category: 'crime', title: 'Riot in the block', minAge: 0, maxAge: 200, weight: 0.6, cooldown: 5,
    text: 'An argument over food boils over. Within minutes the whole block is shouting and trays are flying.', conditions: [inPrison],
    choices: [
      opt('Hide in your cell', undefined, [out('You wait it out with your back to the wall.', [{ t: 'conduct', d: 4 }, stat('happiness', -2)])]),
      opt('Join in', undefined, [out('You get a few good swings in and a few bad bruises.', [{ t: 'conduct', d: -20 }, stat('health', -8), { t: 'sentence', d: 1 }])]),
      opt('Help the guards', undefined, [out('The warden remembers who helped. So do the others.', [{ t: 'conduct', d: 14 }, stat('health', -4)], 2), out('The guards are grateful. The inmates are not.', [{ t: 'conduct', d: 12 }, stat('health', -12)], 1)]),
    ],
  },
  {
    id: 'pr_visit', pack: 'core', category: 'family', title: 'A visitor', minAge: 0, maxAge: 200, weight: 1.4, cooldown: 3,
    text: 'The guard calls your name. Someone has come to see you.', conditions: [inPrison, { t: 'any', cs: [{ t: 'hasRel', kind: 'parent' }, { t: 'hasRel', kind: 'partner' }, { t: 'hasRel', kind: 'child' }, { t: 'hasRel', kind: 'friend' }] }],
    target: { kind: ['parent', 'partner', 'child', 'friend', 'sibling'], minCloseness: 15 },
    choices: [
      opt('Talk honestly', undefined, [out('You cry a little. They squeeze your hand through the gap in the glass. You feel less alone.', [bond(10), stat('happiness', 6)])]),
      opt('Put on a brave face', undefined, [out('You smile the whole time. When you get back to the cell, you finally breathe out.', [bond(4), stat('happiness', 2)])]),
      opt('Refuse the visit', 'You cannot face them', [out('You stare at the wall. They leave. The silence is awful.', [bond(-12), stat('happiness', -5)])]),
    ],
  },
  {
    id: 'pr_guard', pack: 'core', category: 'crime', title: 'The guard\'s offer', minAge: 0, maxAge: 200, weight: 0.8, cooldown: 4,
    text: 'A guard leans against the bars. "Maybe we can help each other," they say, very quietly.', conditions: [inPrison],
    choices: [
      opt('Take the deal', undefined, [out('Comfort items, an easier schedule, and a favour you owe.', [{ t: 'conduct', d: -8 }, stat('happiness', 5), money(600)], 2), out('It was a trap. Internal affairs love this one.', [{ t: 'conduct', d: -25 }, { t: 'sentence', d: 2 }], 1)]),
      opt('Decline politely', undefined, [out('The guard shrugs and walks away.', [{ t: 'conduct', d: 3 }])]),
      opt('Report them', undefined, [out('An investigation follows. The warden is grateful. The staff are not.', [{ t: 'conduct', d: 12 }, { t: 'sentence', d: -1 }, stat('health', -3)])]),
    ],
  },
  {
    id: 'pr_news', pack: 'core', category: 'family', title: 'News from outside', minAge: 0, maxAge: 200, weight: 1, cooldown: 4,
    text: 'A letter arrives. The world outside has kept moving without you.', conditions: [inPrison],
    choices: [
      opt('Read it slowly', undefined, [out('Good news and bad news. You hold onto the good.', [stat('happiness', 2)], 2), out('A friend writes that they are expecting a baby. You smile for the first time in weeks.', [stat('happiness', 6)], 1), out('Someone you cared about has moved on. It hurts.', [stat('happiness', -6), bond(-10, 'partner')], 1)]),
      opt('Write back', undefined, [out('The letters become the best part of your week.', [bond(8, 'parent'), bond(8, 'partner'), stat('happiness', 4)])]),
    ],
  },
  {
    id: 'pr_lockdown', pack: 'core', category: 'health', title: 'Lockdown', minAge: 0, maxAge: 200, weight: 0.8, cooldown: 5,
    text: 'An outbreak (or a rumour of one) puts the whole facility on lockdown for weeks.', conditions: [inPrison],
    choices: [
      opt('Exercise in your cell', undefined, [out('You build a routine and come out stronger.', [stat('health', 4), { t: 'skill', k: 'athletics', d: 3 }])]),
      opt('Read everything you can', undefined, [out('Four books, three notebooks. Your mind is somewhere else entirely.', [stat('smarts', 4), stat('happiness', 2)])]),
      opt('Stew in resentment', undefined, [out('The walls close in. You do not sleep well.', [stat('happiness', -6), stat('health', -2)])]),
    ],
  },
  {
    id: 'pr_change', pack: 'core', category: 'life', title: 'A turning point', minAge: 0, maxAge: 200, weight: 0.9, cooldown: 6,
    text: 'A counselor asks: "Who do you want to be when you get out?" You have never been asked that before.', conditions: [inPrison],
    choices: [
      opt('Make a plan', undefined, [out('You write it all down. Work, family, the first month. It feels real.', [stat('smarts', 2), stat('happiness', 4), { t: 'conduct', d: 8 }, flag('prison_plan'), mem('Inside, I decided who I wanted to be.', ['redemption'], 2)])]),
      opt('Shrug it off', undefined, [out('You say nothing. Nothing changes.', [stat('happiness', -1)])]),
    ],
  },
];
