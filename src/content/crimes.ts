// Crime. Every offence has a payoff, a risk of being caught on the spot, and a chance to leave evidence behind that
// surfaces years later. Fictional and non-graphic. Adult-oriented offences are non-explicit, and nothing involves minors.
import type { Effect, GameState, SkillKey, WizardDef, WizOption } from '../engine/types.ts';
import { startCase } from '../engine/legal.ts';
import { int, next, pick } from '../engine/rng.ts';

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
export interface Crime {
  id: string; cat: string; icon: string; label: string; min: number; sev: number; risk: number; pay: [number, number]; heat: number;
  skill?: SkillKey; crew?: boolean; uw?: number; needsJob?: boolean; guilt?: number; hurt?: number; cost?: number;
  win: string; lose: string; blurb: string;
}
const C = (id: string, cat: string, icon: string, label: string, min: number, sev: number, risk: number, pay: [number, number], heat: number, win: string, lose: string, blurb: string, x: Partial<Crime> = {}): Crime =>
  ({ id, cat, icon, label, min, sev, risk, pay, heat, win, lose, blurb, ...x });

export const CRIME_CATS = [
  { id: 'theft', icon: '🧤', label: 'Theft & robbery' }, { id: 'fraud', icon: '🧾', label: 'Fraud & white collar' }, { id: 'cyber', icon: '💻', label: 'Cyber crime' },
  { id: 'drugs', icon: '🌿', label: 'Drugs & contraband' }, { id: 'violence', icon: '👊', label: 'Violence & arson' }, { id: 'public', icon: '🚨', label: 'Public disorder' },
  { id: 'vice', icon: '🌙', label: 'Vice & scandal' }, { id: 'power', icon: '🏛️', label: 'Corruption & organised crime' },
];

export const CRIMES: Crime[] = [
  // theft
  C('shoplift', 'theft', '🛍️', 'Shoplift', 8, 1, 0.16, [20, 300], 3, 'You slip it into your jacket and stroll out like you own the place.', 'A security guard grabs your sleeve at the door.', 'Five-finger discount', { skill: 'charisma', guilt: 3 }),
  C('bike', 'theft', '🚲', 'Steal a bike', 10, 1, 0.14, [60, 400], 3, 'Bolt cutters, a quick look around, and the bike is yours to flip.', 'The owner comes out just as you snip the lock.', 'Wheels for fun or profit', { guilt: 3 }),
  C('package', 'theft', '📦', 'Take porch packages', 14, 1, 0.12, [40, 400], 3, 'You grab three boxes from three porches and vanish. One has something nice.', 'A doorbell camera caught your face in glorious 4K.', 'Opportunistic and cheap', { guilt: 4 }),
  C('pickpocket', 'theft', '👛', 'Pickpocket tourists', 13, 2, 0.24, [60, 700], 5, 'A bump, a sorry, a wallet. Easiest money of your week.', 'A wallet owner grabs your wrist, and a crowd gathers.', 'Quick hands', { skill: 'charisma', guilt: 3 }),
  C('carbreak', 'theft', '🚗', 'Break into cars', 16, 3, 0.22, [100, 1600], 6, 'A smashed window, a bag on the seat, and you are three blocks away.', 'An alarm shrieks, lights come on, and a patrol car turns the corner.', 'Smash and grab', { guilt: 3 }),
  C('burglary', 'theft', '🏠', 'Burgle a house', 17, 5, 0.3, [1500, 15000], 12, 'You work through the house in ten careful minutes. The haul fits in two bags.', 'A neighbour spots you and calls it in. Officers surround the house.', 'Empty homes, risky nights', { skill: 'athletics', crew: true, guilt: 8 }),
  C('gta', 'theft', '🏎️', 'Steal a car', 16, 5, 0.32, [2000, 12000], 12, 'The engine turns over. By morning it has new plates and a new owner.', 'The car was tracked. A roadblock waits at the end of the street.', 'Joyride or chop shop', { skill: 'tech', crew: true, guilt: 5 }),
  C('storerob', 'theft', '🔫', 'Rob a store', 18, 6, 0.38, [400, 4500], 15, 'Thirty tense seconds. You get the cash and the door.', 'The clerk hits the silent alarm. You are surrounded before you reach the car.', 'Armed robbery. Very risky', { guilt: 14, crew: true }),
  C('cargo', 'theft', '🚚', 'Hijack a cargo truck', 21, 6, 0.35, [15000, 60000], 16, 'The truck is empty by dawn and your buyer is happy.', 'The shipment had a hidden tracker. A task force was waiting.', 'Move the goods', { uw: 20, crew: true, guilt: 6 }),
  C('jewel', 'theft', '💎', 'Rob a jewelry store', 21, 7, 0.42, [20000, 120000], 22, 'Velvet trays, quick hands, and a clean getaway. The fence pays well.', 'A second alarm you did not know about brings the police in two minutes.', 'Sparkly and well guarded', { uw: 15, crew: true, guilt: 8 }),
  C('art', 'theft', '🖼️', 'Steal a famous painting', 24, 8, 0.5, [150000, 800000], 35, 'The frame is empty by morning and the headlines are glorious. The buyer is private and very rich.', 'The museum had a second layer of security. Cuffs click.', 'A real heist', { uw: 35, crew: true, skill: 'tech', guilt: 5 }),
  C('bank', 'theft', '🏦', 'Rob a bank', 21, 9, 0.55, [100000, 1200000], 40, 'You walk out with duffel bags and a plan that actually worked. Somewhere a vault is very quiet.', 'The plan unravels in the lobby. Sirens. A negotiator. Surrender.', 'The big one', { uw: 30, crew: true, guilt: 10 }),
  // fraud
  C('forge', 'fraud', '🖊️', 'Forge cheques', 18, 3, 0.2, [500, 5000], 6, 'The signatures are good enough. The bank pays out.', 'A teller squints at the signature, then at you. Security arrives.', 'Pen and paper', { skill: 'creativity', guilt: 5 }),
  C('card', 'fraud', '💳', 'Credit-card fraud', 18, 4, 0.24, [1000, 9000], 9, 'Cloned cards, quick purchases, and a pile of resale-ready goods.', 'The bank flags a pattern and a task force ties it to you.', 'Cloned plastic', { skill: 'tech', guilt: 5 }),
  C('idtheft', 'fraud', '🪪', 'Identity theft', 18, 5, 0.26, [3000, 20000], 8, 'A stranger\'s name, a stranger\'s credit. You drain it carefully.', 'The victim noticed within days and the paper trail leads to your door.', 'Be somebody else', { skill: 'tech', guilt: 7 }),
  C('insurance', 'fraud', '📑', 'Insurance fraud', 19, 4, 0.22, [4000, 30000], 7, 'The claim goes through. Nobody checks the details that matter.', 'An investigator is not buying the story. They have photos.', 'A very convenient accident', { skill: 'charisma', guilt: 4 }),
  C('tax', 'fraud', '🧮', 'Evade taxes', 22, 4, 0.18, [3000, 60000], 5, 'Offshore receipts and creative accounting save you a fortune.', 'An audit finds the gap. A very polite man asks a lot of questions.', 'Hide the income', { needsJob: true, guilt: 2 }),
  C('counter', 'fraud', '💵', 'Print counterfeit money', 21, 6, 0.33, [5000, 45000], 14, 'The notes pass every pen test at three stores. A great run.', 'A cashier catches a perfect bill with a flawed watermark. It all unravels.', 'Artistic crime', { skill: 'creativity', uw: 5, guilt: 4 }),
  C('embezzle', 'fraud', '💼', 'Embezzle from your employer', 22, 6, 0.26, [10000, 120000], 12, 'Small transfers, buried in the noise. You skim it patiently.', 'An auditor finds a pattern in the books. HR escorts you out. Then the police arrive.', 'Use the access you have', { needsJob: true, guilt: 8 }),
  C('insider', 'fraud', '📈', 'Insider trading', 25, 6, 0.28, [30000, 300000], 12, 'A whispered tip, a perfectly timed trade. The profit is very legal-looking.', 'Regulators flag the timing. An agent knocks on your door.', 'Information is money', { needsJob: true, skill: 'charisma', guilt: 3 }),
  C('ponzi', 'fraud', '🪙', 'Run a Ponzi scheme', 28, 8, 0.35, [200000, 3000000], 25, 'New investors pay old investors and everyone adores you. For now.', 'The money stops coming in. The whole house of cards collapses on live TV.', 'The pyramid', { skill: 'charisma', guilt: 12 }),
  // cyber
  C('hackprank', 'cyber', '📲', 'Hack a rival\'s account', 13, 2, 0.15, [0, 200], 3, 'You post something deeply embarrassing. Your rival is furious. You are delighted.', 'The platform traces the login to your home internet.', 'Petty and risky', { skill: 'tech', guilt: 4 }),
  C('phish', 'cyber', '🎣', 'Phishing campaign', 17, 4, 0.2, [2000, 15000], 6, 'A thousand emails, a handful of clicks, a very nice week.', 'One of the victims is a cybersecurity researcher. You are in their report.', 'Cast the net', { skill: 'tech', guilt: 5 }),
  C('rug', 'cyber', '🪤', 'Crypto rug-pull', 21, 6, 0.3, [50000, 400000], 12, 'You launch, hype, and exit in a single weekend. The wallet fills.', 'The chat logs get leaked. Investors file complaints by the hundreds.', 'Dump and disappear', { skill: 'tech', guilt: 7 }),
  C('breach', 'cyber', '🗄️', 'Corporate data breach', 21, 7, 0.34, [40000, 250000], 18, 'You walk through the firewall and sell what you find. Nobody notices for weeks.', 'The company hired the best incident-response team in the country. They find you.', 'Break in and sell', { skill: 'tech', uw: 10, guilt: 5 }),
  C('extort', 'cyber', '🔐', 'Digital extortion', 22, 8, 0.4, [100000, 800000], 28, 'They pay in untraceable coins before the deadline. You are very, very rich.', 'The payment is traced. A multinational task force knows your name.', 'Lock the servers, name your price', { skill: 'tech', uw: 25, guilt: 8 }),
  // drugs & contraband
  C('grow', 'drugs', '🪴', 'Grow illegal plants', 19, 4, 0.2, [3000, 15000], 8, 'A closet of grow lights and a very profitable harvest.', 'The smell, the power bill, a neighbour. Officers carry out a lot of plants.', 'Green thumb, grey area', { guilt: 3 }),
  C('corner', 'drugs', '💊', 'Deal on the corner', 18, 5, 0.3, [2000, 15000], 14, 'You move product all night and leave with a thick roll.', 'The buyer was an undercover officer. Of course they were.', 'Street-level dealing', { uw: 0, guilt: 8, hurt: 4 }),
  C('ring', 'drugs', '🧪', 'Run a distribution ring', 23, 7, 0.36, [30000, 200000], 22, 'You manage runners, stash houses and cash. Everyone is paid. Everyone is scared of you.', 'A runner flips. The ring collapses in a single dawn raid.', 'Climb the pyramid', { uw: 20, guilt: 8, crew: true }),
  C('lab', 'drugs', '⚗️', 'Run a hidden lab', 25, 8, 0.42, [60000, 400000], 25, 'A rented warehouse, a pipeline, a river of cash.', 'A fire alarm brings the fire department in. They find everything.', 'High output, high stakes', { uw: 25, guilt: 8 }),
  C('smuggle', 'drugs', '🛳️', 'Smuggle across borders', 24, 8, 0.44, [80000, 500000], 28, 'Containers, false manifests, a customs officer who looks the other way.', 'A dog sniffs out your container. The border agents are not amused.', 'International logistics', { uw: 30, guilt: 6, crew: true }),
  C('fakeid', 'drugs', '🪪', 'Buy a fake ID', 16, 1, 0.13, [0, 0], 2, 'It is a pretty good fake. Doors open.', 'A bouncer scans it, frowns, and calls the police.', 'Age is just a number', { guilt: 2, cost: 150 }),
  // violence
  C('vandal', 'violence', '🖍️', 'Vandalism / graffiti', 12, 2, 0.17, [0, 0], 4, 'A massive tag on a very high wall. You feel like a legend.', 'A patrol car rolls up as you finish the last letter.', 'Leave your mark', { skill: 'creativity', guilt: 2 }),
  C('brawl', 'violence', '👊', 'Start a fight', 14, 2, 0.25, [0, 0], 6, 'Fists fly. You come out on top and your name carries weight.', 'Someone calls the cops, and you are the one still swinging.', 'Settle it', { skill: 'athletics', hurt: 8, guilt: 6 }),
  C('assault', 'violence', '🥊', 'Seriously assault someone', 18, 5, 0.32, [0, 0], 12, 'It is over in seconds. They will remember.', 'A witness films everything. The video is clear.', 'Dangerous', { skill: 'athletics', hurt: 10, guilt: 14 }),
  C('shakedown', 'violence', '🧱', 'Shake down a business', 21, 5, 0.3, [2000, 12000], 12, 'Protection money in a brown envelope. They will pay again next month.', 'The owner records the conversation and gives it to the police.', 'Protection racket', { uw: 8, guilt: 8, crew: true }),
  C('arson', 'violence', '🔥', 'Commit arson', 18, 7, 0.38, [0, 0], 25, 'The building burns and the smoke is visible for miles. The matter is settled.', 'Fire investigators trace the accelerant straight back to you.', 'Burn it down', { guilt: 14 }),
  C('murder', 'violence', '⚰️', 'Take a life', 18, 10, 0.5, [0, 0], 45, 'It is done. The silence afterwards is the loudest thing you have ever heard.', 'Detectives piece it together. The case is airtight.', 'The worst crime. Heavy consequences', { guilt: 40, hurt: 5, uw: 0 }),
  // public
  C('trespass', 'public', '🚧', 'Trespass for thrills', 12, 1, 0.12, [0, 0], 2, 'You get in, take a few photos, and sneak out unnoticed. Legendary.', 'A flashlight beam catches you mid-climb.', 'Rooftops and abandoned places', { skill: 'athletics', guilt: 1 }),
  C('race', 'public', '🏁', 'Street race', 17, 3, 0.22, [500, 6000], 7, 'Two cars, one empty road, a roll of cash. You win by a bumper.', 'Someone filmed the whole thing. Lights wash the road.', 'Fast and illegal', { skill: 'athletics', guilt: 1, hurt: 5 }),
  C('dump', 'public', '🛢️', 'Illegally dump waste', 21, 4, 0.15, [2000, 20000], 5, 'The waste goes in the river and the invoice goes in your pocket.', 'An environmental inspector finds the barrels, and the barrels have your name on them.', 'Cheap disposal', { guilt: 9, needsJob: true }),
  C('bribe', 'public', '🤝', 'Bribe an official', 21, 4, 0.2, [5000, 40000], 6, 'A permit stamped overnight. The contract is yours.', 'The official was already under investigation. Your envelope is Exhibit A.', 'Grease the wheels', { skill: 'charisma', guilt: 4 }),
  C('poach', 'public', '🦌', 'Poach wildlife', 18, 3, 0.18, [800, 8000], 6, 'A clean shot and a quiet buyer.', 'A ranger finds the carcass, then you.', 'Out of season', { skill: 'athletics', guilt: 6 }),
  // vice (non-explicit)
  C('streak', 'vice', '🏃', 'Streak at a game', 16, 1, 0.38, [0, 0], 3, 'The crowd goes wild and the video trends. You are briefly famous.', 'Security tackles you at midfield. The whole stadium cheers.', 'A dare and a very bad idea', { guilt: 0 }),
  C('pubintim', 'vice', '🫣', 'Get cosy in public', 18, 2, 0.28, [0, 0], 4, 'A spicy moment and nobody noticed. You are still blushing.', 'A passing patrol finds you both. The officer is not amused. Indecency citation.', 'Thrilling and illegal', { guilt: 1 }),
  C('sting', 'vice', '🌃', 'Hire company for the night', 21, 3, 0.3, [0, 0], 6, 'A discreet evening. Nobody needs to know.', 'It was a police sting. Your photo is in the paper.', 'A paid arrangement. Fade to black', { guilt: 5, cost: 350 }),
  C('bigamy', 'vice', '💍', 'Marry a second partner', 21, 4, 0.18, [0, 0], 6, 'Two weddings, two spouses, and a lot of juggling.', 'Both spouses meet at a mutual friend\'s party. The truth explodes.', 'Not recommended', { guilt: 14, needsJob: false }),
  C('afterhours', 'vice', '🥂', 'Run an unlicensed after-hours club', 21, 3, 0.2, [1500, 12000], 8, 'The place is packed until dawn and the till is full.', 'A noise complaint brings the police straight to the door.', 'Party for profit', { skill: 'charisma', guilt: 1 }),
  C('den', 'vice', '🎲', 'Run an illegal gambling den', 23, 5, 0.28, [5000, 60000], 12, 'High-stakes nights, house edge, and a lot of cash.', 'A raid. Every table is flipped, every player is a witness.', 'The house wins', { uw: 10, guilt: 3, crew: true }),
  // power
  C('launder', 'power', '🧼', 'Launder money', 24, 6, 0.3, [20000, 150000], 14, 'A web of shell companies. The dirty money comes out squeaky clean.', 'An accountant flags the pattern. The financial crimes unit is already waiting.', 'Clean cash', { skill: 'charisma', uw: 15, guilt: 4 }),
  C('blackmail', 'power', '📸', 'Blackmail a rich target', 22, 6, 0.34, [10000, 120000], 14, 'The photo is all it takes. They pay quietly and on time.', 'They went to the police first. The "blackmail" call was recorded.', 'Leverage', { skill: 'charisma', guilt: 10 }),
  C('crime_boss', 'power', '🕴️', 'Take over a crew', 25, 7, 0.28, [30000, 250000], 18, 'You become the name everyone whispers. The tribute rolls in.', 'A rival crew tipped off the police. You are the first one they come for.', 'Run the streets', { uw: 40, guilt: 8, crew: true }),
];
export const CRIME_BY_ID = Object.fromEntries(CRIMES.map((c) => [c.id, c]));

const riskLabel = (r: number) => (r < 0.15 ? 'Low risk' : r < 0.27 ? 'Moderate risk' : r < 0.4 ? 'High risk' : 'Extreme risk');
const sevLabel = (v: number) => (v <= 2 ? 'Misdemeanor' : v <= 4 ? 'Serious' : v <= 7 ? 'Felony' : 'Major felony');

export function riskOf(s: GameState, c: Crime, howMult = 1): number {
  const ch = s.character;
  const skillAdj = c.skill ? 1 - (ch.skills[c.skill] - 40) / 250 : 1;
  const smartAdj = 1 - (ch.stats.smarts - 50) / 400;
  const priors = 1 + Math.min(s.legal.record.length, 6) * 0.04;
  return Math.max(0.03, Math.min(0.92, c.risk * howMult * (1 + s.legal.heat / 120) * skillAdj * smartAdj * priors));
}

const HOW = {
  careful: { risk: 0.65, pay: 0.6, label: 'Plan it carefully', icon: '🧠', sub: 'Slower, safer, smaller payout' },
  standard: { risk: 1, pay: 1, label: 'Just do it', icon: '🎯', sub: 'The standard way' },
  bold: { risk: 1.35, pay: 1.7, label: 'Go big', icon: '🔥', sub: 'Bigger score, bigger risk' },
  pros: { risk: 0.6, pay: 1.5, label: 'Hire professionals', icon: '🕶️', sub: 'Costs $3,000' },
} as const;

const crimeWizard: WizardDef = {
  id: 'crime', group: 'crime', icon: '🕶️', label: 'Do something illegal', hint: 'Every crime has a price if you get caught', minAge: 8,
  steps(s, picks) {
    const age = s.character.age;
    if (picks.length === 0) return { title: 'What kind of trouble?', sub: `Heat: ${s.legal.heat}. The more attention you draw, the likelier you get caught.`, options: CRIME_CATS.map((c) => ({ id: c.id, icon: c.icon, label: c.label, sub: `${CRIMES.filter((x) => x.cat === c.id && age >= x.min).length} available` })) };
    if (picks.length === 1) {
      return { title: 'Choose your crime', sub: `Heat ${s.legal.heat} · Street rep ${s.legal.underworld}`, options: CRIMES.filter((c) => c.cat === picks[0] && age >= c.min - 2).map((c) => {
        const why = age < c.min ? `Age ${c.min}+` : c.uw && s.legal.underworld < c.uw ? `Street rep ${c.uw}+ needed` : c.needsJob && !s.character.job ? 'You need a job' : c.cost && s.character.money < c.cost ? `Need ${fmt(c.cost)}` : undefined;
        return { id: c.id, icon: c.icon, label: c.label, sub: `${c.blurb} · ${sevLabel(c.sev)} · ${riskLabel(riskOf(s, c))}`, badge: c.pay[1] > 0 ? `${fmt(c.pay[0])}–${fmt(c.pay[1])}` : undefined, disabled: why };
      }) };
    }
    if (picks.length === 2) {
      const c = CRIME_BY_ID[picks[1]];
      const opts: WizOption[] = (['careful', 'standard', 'bold'] as const).map((k) => ({ id: k, icon: HOW[k].icon, label: HOW[k].label, sub: `${HOW[k].sub} · ${Math.round(riskOf(s, c, HOW[k].risk) * 100)}% chance of getting caught`, meter: { label: 'Risk', value: Math.round(riskOf(s, c, HOW[k].risk) * 100) } }));
      if (c.crew) {
        for (const r of s.relationships.filter((x) => x.alive && (x.kind === 'friend' || x.kind === 'sibling') && x.closeness >= 35 && x.age >= 16).slice(0, 3)) {
          opts.push({ id: `friend:${r.id}`, icon: '🤝', label: `Bring ${r.name.split(' ')[0]}`, sub: `Safer together, bigger take, but they might talk if caught · ${Math.round(riskOf(s, c, 0.85) * 100)}%`, portrait: { name: r.name, age: r.age, gender: r.gender } });
        }
        if (c.sev >= 5) opts.push({ id: 'pros', icon: HOW.pros.icon, label: HOW.pros.label, sub: `${HOW.pros.sub} · ${Math.round(riskOf(s, c, 0.6) * 100)}%`, cost: 3000, disabled: s.character.money < 3000 ? 'Need $3,000' : undefined });
      }
      return { title: 'How do you do it?', options: opts };
    }
    return null;
  },
  run(s, picks) {
    const c = CRIME_BY_ID[picks[1]];
    const L = s.legal;
    const how = picks[2];
    const friend = how.startsWith('friend:') ? s.relationships.find((r) => r.id === how.slice(7)) : undefined;
    const mode = friend ? { risk: 0.85, pay: 1.4 } : how === 'pros' ? HOW.pros : HOW[how as 'careful' | 'standard' | 'bold'];
    const fx: Effect[] = [];
    if (how === 'pros') fx.push({ t: 'money', d: -3000 });
    if (c.cost) fx.push({ t: 'money', d: -c.cost });
    const p = riskOf(s, c, mode.risk);
    const caught = next(s) < p;
    const guilt = c.guilt ?? 0;
    const text: string[] = [];
    fx.push({ t: 'heat', d: Math.round(c.heat * (how === 'bold' ? 1.3 : how === 'careful' ? 0.6 : 1)) });
    fx.push({ t: 'flag', k: `did_${c.id}`, v: true });
    if (c.hurt && next(s) < 0.4) fx.push({ t: 'stat', k: 'health', d: -int(s, 2, c.hurt + 4) });
    if (caught) {
      const ev = Math.min(97, Math.round(int(s, 62, 94) - (c.skill ? s.character.skills[c.skill] / 12 : 0) + (friend ? 8 : 0)));
      startCase(s, { crimeId: c.id, label: c.label, sev: c.sev, evidence: ev, year: s.year, partner: friend?.id });
      text.push(c.lose);
      if (friend) { fx.push({ t: 'rel', d: -20, who: 'target' }); text.push(`${friend.name.split(' ')[0]} is picked up too, and they are not happy with you.`); }
      fx.push({ t: 'stat', k: 'happiness', d: -4 });
      return { title: `Caught: ${c.label}`, cat: 'crime', text: text.join(' '), effects: fx, targetId: friend?.id };
    }
    // got away with it, for now
    const loot = c.pay[1] > 0 ? Math.round((c.pay[0] + next(s) * (c.pay[1] - c.pay[0])) * mode.pay * (how === 'pros' ? 0.8 : 1)) : 0;
    const gain = friend ? Math.round(loot * 0.6) : loot;
    if (gain) fx.push({ t: 'money', d: gain });
    text.push(c.win);
    if (gain) text.push(`Take-home: ${fmt(gain)}.`);
    if (guilt) { fx.push({ t: 'stat', k: 'happiness', d: -Math.round(guilt / 3) }); if (guilt >= 14) text.push('It stays with you.'); }
    else fx.push({ t: 'stat', k: 'happiness', d: 2 });
    if (c.sev >= 5) L.underworld = Math.min(100, L.underworld + Math.round(c.sev * 1.5));
    else if (c.sev >= 3) L.underworld = Math.min(100, L.underworld + 2);
    if (friend) fx.push({ t: 'rel', d: 8, who: 'target' });
    // evidence may be left behind
    if (next(s) < 0.26 + c.sev * 0.03) {
      L.uncaught.push({ crimeId: c.id, label: c.label, sev: c.sev, evidence: int(s, 35, 70), year: s.year, partner: friend?.id });
      text.push('(You have a nagging feeling you left something behind.)');
    }
    if (c.id === 'fakeid') fx.push({ t: 'flag', k: 'fake_id', v: true });
    if (c.id === 'bigamy') fx.push({ t: 'flag', k: 'married_twice', v: true });
    if (c.id === 'streak') fx.push({ t: 'stat', k: 'reputation', d: 1 }, { t: 'stat', k: 'happiness', d: 4 });
    return { title: `Pulled off: ${c.label}`, cat: 'crime', text: text.join(' '), effects: fx, targetId: friend?.id };
  },
};

// ═════════════════════ PRISON ═════════════════════
const PRISON_ACTS: { id: string; icon: string; label: string; sub: string; need?: (s: GameState) => string | undefined }[] = [
  { id: 'weights', icon: '🏋️', label: 'Lift in the yard', sub: 'Get strong. Get respect.' },
  { id: 'library', icon: '📚', label: 'Read in the library', sub: 'Mind over bars' },
  { id: 'study', icon: '🎓', label: 'Study for a diploma or degree', sub: 'Use the time', need: (s) => (s.character.education === 'none' ? undefined : s.character.education === 'highschool' ? undefined : 'You have already earned more') },
  { id: 'trade', icon: '🛠️', label: 'Learn a trade', sub: 'Welding, carpentry, cooking' },
  { id: 'job', icon: '🧺', label: 'Work a prison job', sub: 'Small wages, good conduct' },
  { id: 'crew', icon: '🕴️', label: 'Join a crew', sub: 'Protection comes with a price', need: (s) => (s.legal.prison?.crew ? 'Already in a crew' : undefined) },
  { id: 'quiet', icon: '🤫', label: 'Keep your head down', sub: 'Do your time quietly' },
  { id: 'faith', icon: '🕯️', label: 'Counseling & faith group', sub: 'Heal and reflect' },
  { id: 'letters', icon: '✉️', label: 'Write home', sub: 'Strengthen family bonds' },
  { id: 'fight', icon: '👊', label: 'Pick a fight', sub: 'Earn fear. Lose conduct.' },
  { id: 'racket', icon: '📦', label: 'Run a contraband racket', sub: 'Profit and risk' },
  { id: 'snitch', icon: '🗣️', label: 'Inform on others', sub: 'Shorter sentence, dangerous' },
  { id: 'appeal', icon: '⚖️', label: 'Appeal your sentence', sub: 'Costs $8,000 for a lawyer', need: (s) => (s.character.money < 8000 ? 'Need $8,000' : undefined) },
  { id: 'parole', icon: '🪧', label: 'Request a parole hearing', sub: 'Good conduct needed', need: (s) => ((s.legal.prison?.conduct ?? 0) < 50 ? 'Conduct 50+ needed' : (s.legal.prison?.yearsLeft ?? 99) > Math.ceil((s.legal.prison?.total ?? 1) * 0.75) ? 'Too early for a hearing' : undefined) },
];
const prisonLife: WizardDef = {
  id: 'prison_life', group: 'prison', icon: '⛓️', label: 'Life inside', hint: 'Decide how you spend your time', minAge: 0,
  steps(s, picks) {
    const p = s.legal.prison;
    if (picks.length === 0) return { title: p ? `${p.facility} · ${p.yearsLeft} year${p.yearsLeft === 1 ? '' : 's'} left` : 'Prison', sub: p ? `Conduct ${p.conduct}${p.crew ? ' · In a crew' : ''}` : undefined, options: PRISON_ACTS.map((a) => ({ id: a.id, icon: a.icon, label: a.label, sub: a.need?.(s) ?? a.sub, disabled: a.need?.(s) })) };
    return null;
  },
  run(s, picks) {
    const p = s.legal.prison!;
    const fx: Effect[] = [];
    let t = '';
    switch (picks[0]) {
      case 'weights': fx.push({ t: 'skill', k: 'athletics', d: 4 }, { t: 'stat', k: 'health', d: 3 }, { t: 'conduct', d: 1 }); t = 'Hours in the yard. You come out sharper and stronger.'; break;
      case 'library': fx.push({ t: 'stat', k: 'smarts', d: 3 }, { t: 'stat', k: 'happiness', d: 2 }, { t: 'conduct', d: 3 }); t = 'The library becomes your refuge.'; break;
      case 'study': fx.push({ t: 'stat', k: 'smarts', d: 4 }, { t: 'conduct', d: 5 }); if (s.character.education === 'none') fx.push({ t: 'edu', level: 'highschool' }); t = 'Exams in a visitor room. It feels like progress.'; if (s.character.education === 'none') t += ' You earn your high school equivalency.'; break;
      case 'trade': fx.push({ t: 'skill', k: 'tech', d: 3 }, { t: 'conduct', d: 4 }, { t: 'flag', k: 'prison_trade', v: true }); t = 'You learn a real trade. It could matter on the outside.'; break;
      case 'job': fx.push({ t: 'money', d: 900 }, { t: 'conduct', d: 5 }); t = 'A steady shift in the kitchen. The pay is tiny and the routine is a mercy.'; break;
      case 'crew': p.crew = true; s.legal.underworld = Math.min(100, s.legal.underworld + 10); fx.push({ t: 'conduct', d: -6 }, { t: 'stat', k: 'reputation', d: -2 }); t = 'You choose a side. Nobody bothers you now, but they will call in favours.'; break;
      case 'quiet': fx.push({ t: 'conduct', d: 6 }, { t: 'stat', k: 'happiness', d: -1 }); t = 'You say little, see everything, and stay out of trouble.'; break;
      case 'faith': fx.push({ t: 'stat', k: 'happiness', d: 5 }, { t: 'conduct', d: 4 }); t = 'The group is gentle, honest, and surprisingly healing.'; break;
      case 'letters': fx.push({ t: 'rel', d: 8, who: 'parent' }, { t: 'rel', d: 8, who: 'partner' }, { t: 'rel', d: 8, who: 'child' }, { t: 'stat', k: 'happiness', d: 3 }); t = 'The letters back make you cry in the best way.'; break;
      case 'fight': fx.push({ t: 'conduct', d: -12 }, { t: 'stat', k: 'health', d: -int(s, 3, 9) }); s.legal.underworld = Math.min(100, s.legal.underworld + 5); t = 'Fists, shouting, guards. Fear is respect in here.'; if (next(s) < 0.3) { fx.push({ t: 'sentence', d: 1 }); t += ' Solitary, and a year added.'; } break;
      case 'racket': if (next(s) < 0.4) { fx.push({ t: 'conduct', d: -18 }, { t: 'sentence', d: 2 }); t = 'A search turns up your stash. Two more years.'; } else { fx.push({ t: 'money', d: 2500 }, { t: 'conduct', d: -4 }); s.legal.underworld = Math.min(100, s.legal.underworld + 6); t = 'Cigarettes, phones, favours. Your commissary account is very full.'; } break;
      case 'snitch': fx.push({ t: 'sentence', d: -int(s, 1, 2) }, { t: 'conduct', d: 8 }); t = 'The guards listen carefully. Your sentence shrinks.'; if (p.crew || next(s) < 0.5) { fx.push({ t: 'stat', k: 'health', d: -int(s, 5, 18) }); t += ' Word gets out. You are beaten in the showers.'; } break;
      case 'appeal': fx.push({ t: 'money', d: -8000 }); if (next(s) < 0.4) { fx.push({ t: 'sentence', d: -Math.max(1, Math.round(p.yearsLeft * (0.2 + next(s) * 0.25))) }); t = 'A judge agrees there were errors. Your sentence is reduced.'; } else t = 'The appeal is denied.'; break;
      case 'parole': { const pr = Math.min(0.85, p.conduct / 120 + (s.legal.record.length <= 1 ? 0.15 : 0)); if (next(s) < pr) { fx.push({ t: 'release' }); t = 'The board votes yes. You will be out in days.'; } else { fx.push({ t: 'conduct', d: -3 }); t = 'The board denies parole. Try again after more good behaviour.'; } break; }
    }
    return { title: PRISON_ACTS.find((a) => a.id === picks[0])!.label, cat: 'crime', text: t, effects: fx };
  },
};

const ESCAPE = [
  { id: 'tunnel', icon: '🕳️', label: 'Dig a tunnel', sub: 'Years of patience', p: 0.14, need: (s: GameState) => (s.legal.prison!.total >= 4 ? undefined : 'Sentence of 4+ years') },
  { id: 'delivery', icon: '🚚', label: 'Hide in a delivery truck', sub: 'Needs a clear timeline', p: 0.2 },
  { id: 'riot', icon: '🔥', label: 'Cause a riot', sub: 'Chaos is cover', p: 0.18, need: (s: GameState) => (s.legal.prison!.crew ? undefined : 'Needs a crew') },
  { id: 'inside', icon: '💰', label: 'Pay a guard ($20,000)', sub: 'Everyone has a price', p: 0.35, need: (s: GameState) => (s.character.money >= 20000 ? undefined : 'Need $20,000') },
];
const escape: WizardDef = {
  id: 'prison_escape', group: 'prison', icon: '🪜', label: 'Plan an escape', hint: 'Very risky', minAge: 12,
  steps(s, picks) { return picks.length === 0 ? { title: 'How?', sub: 'If you fail, years are added and conduct is destroyed.', options: ESCAPE.map((e) => ({ id: e.id, icon: e.icon, label: e.label, sub: e.need?.(s) ?? e.sub, disabled: e.need?.(s) })) } : null; },
  run(s, picks) {
    const e = ESCAPE.find((x) => x.id === picks[0])!;
    const p = s.legal.prison!;
    const fx: Effect[] = [];
    if (e.id === 'inside') fx.push({ t: 'money', d: -20000 });
    const odds = e.p + s.character.skills.athletics / 400 + s.character.stats.smarts / 500;
    if (next(s) < odds) {
      s.legal.prison = undefined;
      s.legal.fugitive = true;
      s.legal.uncaught.push({ crimeId: 'escape', label: 'Prison escape', sev: 7, evidence: 90, year: s.year });
      s.legal.heat = 90;
      fx.push({ t: 'stat', k: 'happiness', d: 8 }, { t: 'flag', k: 'ex_con', v: true });
      return { title: 'Escape!', cat: 'crime', text: `You make it over the wall and into the night. You are free and the whole state is looking for you.`, effects: fx };
    }
    fx.push({ t: 'sentence', d: 3 }, { t: 'conduct', d: -30 }, { t: 'stat', k: 'health', d: -int(s, 4, 14) });
    p.crew = p.crew;
    return { title: 'Escape failed', cat: 'crime', text: pick(s, ['Spotlights, dogs, and a guard with a very big flashlight. Three years are added.', 'It falls apart at the last moment. Solitary, and three more years.']), effects: fx };
  },
};

export const CRIME_WIZARDS: WizardDef[] = [crimeWizard, prisonLife, escape];
