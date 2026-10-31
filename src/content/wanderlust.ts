// PREMIUM pack #2: "Wanderlust". Travel, living abroad, and family heirlooms that outlive you.
// Flags named legacy_* are inherited by your heirs, so the bloodline remembers where it has been.
import type { EventDef } from '../engine/types.ts';
import { addRel, bond, cash, flag, hasFlag, hasRel, job, mem, money, noFlag, noRel, opt, out, stat, unemployed } from './dsl.ts';

const P = 'wanderlust';

const trip = (id: string, city: string) => [flag(`visited_${id}`), flag(`legacy_trip_${id}`), mem(`Walked the streets of ${city} and felt the world get bigger.`, ['travel'], 2)];

export const WANDERLUST_EVENTS: EventDef[] = [
  {
    id: 'wl_passport_stamp', pack: P, category: 'life', title: 'Where to?', minAge: 19, maxAge: 70, weight: 7, cooldown: 2,
    text: 'You have some savings, a few free weeks, and an itch you cannot scratch at home. The world is waiting.',
    choices: [
      opt('Lisbon', 'Tiles, trams and sunsets · $2,500', [
        out('Lisbon feels like a warm hug. You eat too much, walk too far, and never want to leave.', [money(-2500), stat('happiness', 8), stat('smarts', 1), ...trip('lisbon', 'Lisbon')]),
      ], { requires: [noFlag('visited_lisbon'), cash('>=', 2500)] }),
      opt('Kyoto', 'Temples and quiet gardens · $4,000', [
        out('Kyoto teaches you stillness. You come home calmer than you left.', [money(-4000), stat('happiness', 9), stat('health', 2), ...trip('kyoto', 'Kyoto')]),
      ], { requires: [noFlag('visited_kyoto'), cash('>=', 4000)] }),
      opt('Marrakech', 'Markets, spice and noise · $3,000', [
        out('The markets overwhelm you in the best way. You haggle badly and love every minute.', [money(-3000), stat('happiness', 7), stat('smarts', 2), ...trip('marrakech', 'Marrakech')]),
        out('You get lost, get a little scammed, and get a story worth telling.', [money(-3400), stat('happiness', 4), stat('smarts', 3), ...trip('marrakech', 'Marrakech')]),
      ], { requires: [noFlag('visited_marrakech'), cash('>=', 3000)] }),
      opt('Reykjavik', 'Northern lights · $3,500', [
        out('You stand under green fire in the sky and forget your own name for a minute.', [money(-3500), stat('happiness', 9), ...trip('reykjavik', 'Reykjavik')]),
      ], { requires: [noFlag('visited_reykjavik'), cash('>=', 3500)] }),
      opt('Stay home', 'Save the money', [out('The trip waits. So does the itch.', [stat('happiness', -1)])]),
    ],
  },
  {
    id: 'wl_language', pack: P, category: 'school', title: 'A new language', minAge: 17, maxAge: 60, weight: 4, once: true,
    text: 'You decide to learn a language properly, not just enough to order dinner.',
    choices: [
      opt('Commit to daily practice', 'Discipline', [
        out('A year later you hold a real conversation. It feels like unlocking a secret door.', [stat('smarts', 6), stat('happiness', 4), flag('bilingual'), mem('Became fluent in a second language.', ['travel'], 2)], 2, { k: 'smarts', amt: 1.5 }),
        out('Streaks break, motivation fades. You know a few good phrases.', [stat('smarts', 1)], 1),
      ]),
      opt('Find a conversation partner', 'Fun and social', [
        out('Your partner becomes a friend. Mistakes turn into jokes.', [stat('smarts', 3), addRel('friend', { closeness: 60 }), stat('happiness', 4)]),
      ]),
      opt('Not now', undefined, [out('Maybe when life slows down.', [])]),
    ],
  },
  {
    id: 'wl_travel_romance', pack: P, category: 'love', title: 'Strangers on a train', minAge: 20, maxAge: 45, weight: 5, once: true,
    conditions: [noRel('partner'), { t: 'any', cs: [hasFlag('visited_lisbon'), hasFlag('visited_kyoto'), hasFlag('visited_marrakech'), hasFlag('visited_reykjavik')] }],
    text: 'On the way home from a trip you end up sharing a table with someone whose laugh you notice from across the carriage.',
    choices: [
      opt('Start a conversation', 'Take the chance', [
        out('You talk until the train pulls in. You trade numbers. This might be something.', [addRel('partner', { closeness: 62 }), stat('happiness', 9), mem('Met someone on a train home from a trip.', ['love'], 2)], 2, { k: 'looks', amt: 1 }),
        out('They are friendly but already taken. A good story anyway.', [stat('happiness', 2)], 1),
      ]),
      opt('Smile and look out the window', undefined, [out('The moment passes, as moments do.', [stat('happiness', -1)])]),
    ],
  },
  {
    id: 'wl_lost_passport', pack: P, category: 'money', title: 'No passport, no problem?', minAge: 20, maxAge: 70, weight: 3, cooldown: 6,
    conditions: [{ t: 'any', cs: [hasFlag('visited_lisbon'), hasFlag('visited_kyoto'), hasFlag('visited_marrakech'), hasFlag('visited_reykjavik')] }],
    text: 'At the airport you reach for your passport and find an empty pocket. Boarding closes in forty minutes.',
    choices: [
      opt('Call the embassy', 'The official route', [
        out('A kind official gets you an emergency document. Stressful but sorted.', [money(-350), stat('happiness', -2), stat('smarts', 1)], 3),
        out('Paperwork, queues, a missed flight. You make it home eventually.', [money(-1200), stat('happiness', -4)], 1),
      ]),
      opt('Retrace your steps', 'Gamble on luck', [
        out('It is under the seat of your taxi. The driver is waving it out the window.', [stat('happiness', 4), stat('reputation', 1)], 1),
        out('Gone. A very expensive lesson.', [money(-1800), stat('happiness', -5)], 2),
      ]),
    ],
  },
  {
    id: 'wl_expat_offer', pack: P, category: 'work', title: 'A job on the other side of the world', minAge: 23, maxAge: 50, weight: 5, once: true,
    conditions: [unemployed(), { t: 'any', cs: [hasFlag('bilingual'), hasFlag('visited_lisbon'), hasFlag('visited_kyoto')] }],
    text: 'A contact abroad offers you a role at their studio. It pays well, but it means leaving everything familiar.',
    choices: [
      opt('Pack your bags', 'A whole new life', [
        out('You land with two suitcases and a lot of nerve. Within a year it feels like home.', [job('Remote Product Designer', 58000), stat('happiness', 7), stat('reputation', 3), flag('expat'), flag('legacy_expat'), mem('Moved abroad and built a life from scratch.', ['career', 'travel'], 3)], 2, { k: 'smarts', amt: 1 }),
        out('The move is harder than you expected. You come home after a rough year, a little wiser.', [job('Design Associate', 40000), stat('happiness', -3), stat('smarts', 3)], 1),
      ]),
      opt('Stay put', 'The safe choice', [out('You thank them and stay. Sometimes you wonder.', [stat('happiness', -1)])]),
    ],
  },
  {
    id: 'wl_family_voyage', pack: P, category: 'family', title: 'The big family trip', minAge: 28, maxAge: 70, weight: 4, cooldown: 6,
    target: { kind: 'child' }, conditions: [cash('>=', 3000)],
    text: '{target} asks if the whole family can go somewhere none of you have been. You could make it happen.',
    choices: [
      opt('Book it', 'Memories over money · $3,000', [
        out('Ten days of wrong turns, great food and photos nobody looks good in. {target} will talk about it for years.', [money(-3000), bond(14), stat('happiness', 9), mem('Took {target} on the trip of a lifetime.', ['family', 'travel'], 3)]),
      ]),
      opt('Plan a cheaper weekend away', 'Smaller, still sweet', [
        out('A lake cabin, board games, bad weather. Perfect.', [money(-600), bond(8), stat('happiness', 5)]),
      ]),
      opt('Not this year', undefined, [out('Work gets in the way again.', [bond(-4)])]),
    ],
  },
  {
    id: 'wl_heirloom_bought', pack: P, category: 'legacy', title: 'A thing worth keeping', minAge: 30, maxAge: 75, weight: 4, once: true,
    conditions: [{ t: 'any', cs: [hasFlag('visited_marrakech'), hasFlag('visited_kyoto'), hasFlag('visited_lisbon')] }, hasRel('child')],
    text: 'In a small shop you find an object that feels like it has already lived a hundred lives: a hand-made clock, a lacquered box, a ceramic bowl. Something to pass down.',
    choices: [
      opt('Buy it for the family', 'An heirloom · $1,200', [
        out('You carry it home wrapped in a sweater. It sits on the mantel and starts the family\'s oldest tradition.', [money(-1200), flag('legacy_heirloom'), stat('happiness', 4), mem('Brought home an heirloom the family will keep for generations.', ['legacy', 'travel'], 3)]),
      ], { requires: [cash('>=', 1200)] }),
      opt('Take a photo and move on', undefined, [out('The photo is nice. The object stays in the shop.', [])]),
    ],
  },
  {
    id: 'wl_heirloom_story', pack: P, category: 'legacy', title: 'The thing on the mantel', minAge: 12, maxAge: 40, weight: 10, once: true,
    conditions: [hasFlag('legacy_heirloom')],
    text: 'There is an old object in your family home that everyone treats a little differently from the rest. Today someone finally tells you where it came from.',
    effects: [stat('happiness', 4), stat('reputation', 1), mem('Learned the story of the family heirloom from someone who remembered when it arrived.', ['legacy'], 2)],
  },
  {
    id: 'wl_ancestor_trip', pack: P, category: 'legacy', title: 'Retracing the route', minAge: 20, maxAge: 55, weight: 7, once: true,
    conditions: [{ t: 'gen', op: '>=', v: 2 }, { t: 'any', cs: [hasFlag('legacy_trip_lisbon'), hasFlag('legacy_trip_kyoto'), hasFlag('legacy_trip_marrakech'), hasFlag('legacy_trip_reykjavik')] }],
    text: 'Your family has been out in the world before you. You find an old photograph from a trip an ancestor took, and you decide to stand in the same spot.',
    choices: [
      opt('Go and find the place', 'Follow the family footsteps · $2,500', [
        out('You find the exact corner. A stranger offers to take your picture. Now there are two photographs.', [money(-2500), stat('happiness', 9), stat('reputation', 2), mem('Stood where my ancestor once stood.', ['legacy', 'travel'], 3)]),
      ], { requires: [cash('>=', 2500)] }),
      opt('Frame the photograph', undefined, [out('It hangs in your hallway now. Someday.', [stat('happiness', 2)])]),
    ],
  },
];
