// PREMIUM sample pack: "Hustle & Ambition". Demonstrates how an add-on is just another file of events.
import type { EventDef } from '../engine/types.ts';
import { cash, flag, hasFlag, job, mem, money, noFlag, opt, out, quit, stat, unemployed, employed } from './dsl.ts';

const P = 'entrepreneur';

export const ENTREPRENEUR_EVENTS: EventDef[] = [
  {
    id: 'ent_side_hustle_idea', pack: P, category: 'money', title: 'A business idea', minAge: 18, maxAge: 55, weight: 6, once: true,
    text: 'An idea will not leave you alone: something people would pay for, if you had the nerve to build it.',
    choices: [
      opt('Start it on nights and weekends', 'Keep your day job', [
        out('Late nights and cold coffee, but the first customer says yes.', [flag('side_hustle'), stat('happiness', 4), stat('health', -3), mem('Launched a side hustle from my kitchen table.', ['business'], 3)]),
      ]),
      opt('Quit and go all in', 'Big risk', [
        out('You jump. The first months are lean but electric.', [quit(), flag('side_hustle'), stat('happiness', 6), money(-4000), mem('Quit everything to build my own thing.', ['business'], 3)], 2, { k: 'smarts', amt: 1 }),
        out('Customers are slow to come. You are burning savings.', [quit(), flag('side_hustle'), stat('happiness', -4), money(-9000)], 1),
      ]),
      opt('File the idea away', undefined, [out('Maybe someday.', [])]),
    ],
  },
  {
    id: 'ent_first_big_client', pack: P, category: 'money', title: 'The big client', minAge: 19, maxAge: 65, weight: 7, once: true,
    conditions: [hasFlag('side_hustle'), noFlag('hustle_scaled')],
    text: 'A larger company notices your work and wants a serious contract. It could change everything, or stretch you too thin.',
    choices: [
      opt('Say yes and scale up', 'Hire help, take the risk', [
        out('You deliver. The business grows up overnight.', [flag('hustle_scaled'), money(22000), stat('reputation', 7), stat('happiness', 5), mem('Landed the big client and grew the business.', ['business'], 3)], 2, { k: 'smarts', amt: 1.2 }),
        out('You over-promise and it falls apart. Painful.', [money(-8000), stat('reputation', -4), stat('happiness', -5)], 1),
      ]),
      opt('Take a smaller version of the deal', 'Stay in control', [out('Steady, profitable, and manageable.', [money(7000), flag('hustle_scaled'), stat('reputation', 3)])]),
      opt('Turn it down', undefined, [out('You stay small and sane.', [stat('happiness', 2)])]),
    ],
  },
  {
    id: 'ent_viral_moment', pack: P, category: 'life', title: 'It goes viral', minAge: 19, maxAge: 60, weight: 3, once: true,
    conditions: [hasFlag('side_hustle')],
    text: 'A customer posts about you and the internet picks it up. Orders flood in overnight.',
    effects: [money(9000), stat('reputation', 6), stat('happiness', 6), mem('One post made us briefly famous.', ['business'], 2)],
  },
  {
    id: 'ent_acquisition_offer', pack: P, category: 'legacy', title: 'An offer to buy you out', minAge: 25, maxAge: 65, weight: 8, once: true,
    conditions: [hasFlag('hustle_scaled')],
    text: 'A bigger company offers to buy what you built. The number is eye-watering.',
    choices: [
      opt('Sell', 'Cash out', [out('You sign. Your bank account will never look the same.', [money(120000), quit(), stat('happiness', 7), stat('reputation', 4), flag('legacy_business', false), mem('Sold the company I built.', ['business', 'legacy'], 3)])]),
      opt('Keep building', 'It is your baby', [out('You decline and keep going, richer in purpose.', [stat('happiness', 4), stat('reputation', 5), flag('legacy_business'), mem('Turned down a buyout to keep building something that could last.', ['business', 'legacy'], 3)])]),
    ],
  },
];
