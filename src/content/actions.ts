// Player actions: the things you can choose to do. Pure data, same as events.
// To add one: copy a line, change the id/text/effects. It shows up in the Do tab (or on a person's card if it has a `target`).
//
// A(id, group, icon, label, hint, { min, max, time, repeat, req, target }, [choices])
//   time   free-time slots used (default 1, 0 = free)         repeat  'year' (default) | 'once' | 'any'
//   one([...outcomes])  = a single choice that just happens;  opt(label, hint, outcomes, { cost, requires }) = a menu choice
import type { ActionDef, ActionGroup, ChoiceDef, Condition, OutcomeDef, TargetFilter } from '../engine/types.ts';
import {
  addRel, anyOf, bond, cash, debt, dropout, edu, eduAtLeast, employed, enroll, flag, gpa, hasFlag, hasRel, hire, inField, inSchool, loan,
  major, mem, money, noFlag, noRel, opt, out, payDebt, perf, quit, relkind, retire, rtag, skill, skillIs, stat, statIs, endRel,
} from './dsl.ts';

interface Opts { min?: number; max?: number; time?: number; repeat?: ActionDef['repeat']; req?: Condition[]; target?: TargetFilter; pack?: string }
const A = (id: string, group: ActionGroup, icon: string, label: string, hint: string, o: Opts, choices: ChoiceDef[]): ActionDef => ({
  id, group, icon, label, hint, minAge: o.min ?? 0, maxAge: o.max ?? 120, time: o.time ?? 1, repeat: o.repeat ?? 'year', requires: o.req, target: o.target, pack: o.pack, choices,
});
const one = (outcomes: OutcomeDef[], extra: Parameters<typeof opt>[3] = {}): ChoiceDef[] => [opt('Do it', undefined, outcomes, extra)];
const notInSchool = inSchool(false);
const youngOrStudent = anyOf(inSchool(), { t: 'age', op: '<', v: 19 });
const noGrad: Condition = { t: 'not', c: eduAtLeast('grad') };

export const GROUP_INFO: Record<ActionGroup, { label: string; icon: string; blurb: string }> = {
  love: { label: 'Love & Dating', icon: '💞', blurb: 'Meet someone, take a chance, build something' },
  social: { label: 'Friends & Social', icon: '🤝', blurb: 'The people who make life worth living' },
  school: { label: 'School & Learning', icon: '🎓', blurb: 'Grades, majors, degrees and second chances' },
  career: { label: 'Career & Work', icon: '💼', blurb: 'Climb the ladder, switch lanes, or go solo' },
  sports: { label: 'Sports & Fitness', icon: '⚽', blurb: 'Train, compete, push your limits' },
  money: { label: 'Money', icon: '💰', blurb: 'Invest, borrow, give, gamble' },
  health: { label: 'Health & Looks', icon: '🌿', blurb: 'Mind, body and the mirror' },
  family: { label: 'Home & Family', icon: '🏡', blurb: 'Where you live and who you live for' },
  life: { label: 'Skills & Lifestyle', icon: '✨', blurb: 'Hobbies, lessons and licenses' },
};

export const ACTIONS: ActionDef[] = [
  // ═════════ LOVE & DATING ═════════
  A('love_teen_ask', 'love', '💌', 'Ask someone out', 'Teen romance, nerves included', { min: 13, max: 17, req: [noRel('partner')] }, one([
    out('They say yes! You spend the whole year grinning like an idiot.', [addRel('partner', { closeness: 55, bind: true }), stat('happiness', 8), mem('My first crush said yes.', ['love'], 2)], 1, { k: 'looks', amt: 1 }),
    out('They smile kindly and say they would rather stay friends. It stings, but you keep a good friend.', [addRel('friend', { closeness: 55 }), stat('happiness', -2)], 1),
    out('You chicken out at the last second and pretend you just wanted to borrow a pencil.', [stat('happiness', -3)], 1),
  ])),
  A('love_app', 'love', '📱', 'Try a dating app', 'Swipe, chat, hope', { min: 18, req: [noRel('partner')] }, one([
    out('A real connection. You message for a week, meet for coffee, and it just clicks.', [addRel('partner', { closeness: 52, bind: true }), stat('happiness', 7), mem('Met someone through a dating app and it actually worked.', ['love'], 2)], 1, { k: 'looks', amt: 1.2 }),
    out('A fun, no-strings kind of thing starts with someone new.', [addRel('fling', { closeness: 48, bind: true }), stat('happiness', 4)], 1.2),
    out('Three terrible dates and one great story. No spark yet.', [stat('happiness', -1)], 2),
    out('They look nothing like their photos. You leave early.', [stat('happiness', -2), money(-40)], 1),
  ])),
  A('love_out', 'love', '🍸', 'Go out for the night', 'Bars, clubs, strangers · $80', { min: 21, req: [noRel('partner')] }, [
    opt('Go out', 'Cost $80', [
      out('Someone across the room keeps catching your eye. By closing time you are exchanging numbers.', [addRel('fling', { closeness: 50, bind: true }), stat('happiness', 5)], 2, { k: 'looks', amt: 1 }),
      out('You meet someone you could really see yourself with.', [addRel('partner', { closeness: 50, bind: true }), stat('happiness', 6)], 0.7, { k: 'looks', amt: 0.8 }),
      out('Great night, no romance, one new friend.', [addRel('friend', { closeness: 45 }), stat('happiness', 3)], 1.5),
      out('You wake up with a headache and no memory of the second half of the night.', [stat('health', -3), stat('happiness', -1)], 1.2),
      out('A tense night ends with a scuffle outside. Your reputation takes a hit.', [stat('reputation', -4), stat('health', -3)], 0.4),
    ], { cost: 80 }),
  ]),
  A('love_setup', 'love', '🫶', 'Ask friends to set you up', 'Trusted matchmakers', { min: 18, req: [noRel('partner'), hasRel('friend')] }, one([
    out('A friend of a friend turns out to be perfect for you.', [addRel('partner', { closeness: 58, bind: true }), stat('happiness', 7), mem('A friend set me up with someone wonderful.', ['love'], 2)], 2),
    out('It is awkward, but you both laugh about it afterwards.', [addRel('friend', { closeness: 50 }), stat('happiness', 2)], 2),
    out('Your friends all think of different people and none of them fit.', [stat('happiness', -1)], 1),
  ])),
  A('love_flirt', 'love', '😏', 'Flirt with someone new', 'You are already in a relationship...', { min: 18, req: [hasRel('partner')] }, one([
    out('A harmless exchange that makes your day. Nothing happens, and you both know it.', [stat('happiness', 2)], 2),
    out('It goes further than it should. A secret now sits between you and your partner.', [addRel('fling', { closeness: 52, bind: true }), rtag('secret'), stat('happiness', 3), stat('reputation', -1)], 1.5),
    out('Your partner finds out. The fallout is loud and painful.', [bond(-35, 'partner'), stat('reputation', -5), stat('happiness', -7), mem('I was unfaithful, and it cost me.', ['shame'], 2)], 1.3),
  ])),

  // person actions: partners, flings, exes
  A('love_date', 'love', '🌹', 'Go on a date', 'Spend focused time together', { min: 14, target: { kind: ['partner', 'fling'] } }, [
    opt('A walk and a talk', 'Free', [out('You talk about nothing and everything for hours.', [bond(6), stat('happiness', 3)])]),
    opt('Dinner out', 'Cost $120', [out('Candlelight, good food, and no one checking their phone.', [bond(11), stat('happiness', 5)], 3), out('The restaurant is terrible, but you laugh about it all the way home.', [bond(7), stat('happiness', 3)], 1)], { cost: 120 }),
    opt('A fancy night out', 'Cost $450', [out('A night worth remembering: dressed up, dancing, and thoroughly spoiled.', [bond(16), stat('happiness', 7), stat('reputation', 1)])], { cost: 450 }),
  ]),
  A('love_night', 'love', '🌙', 'Spend the night together', 'Adults only · fade to black', { min: 18, target: { kind: ['partner', 'fling'], minCloseness: 35 } }, [
    opt('Be careful', 'Protection, no surprises', [
      out('A warm, easy night. You feel a lot closer in the morning.', [bond(9), stat('happiness', 6)], 6),
      out('Sweet, a little clumsy, and honest. Somehow that makes it better.', [bond(5), stat('happiness', 3)], 2),
    ]),
    opt('Be spontaneous', 'Live in the moment', [
      out('One of those nights you do not plan and do not forget.', [bond(10), stat('happiness', 7)], 8),
      out('Weeks later a positive test turns your world upside down. Months after that you welcome a baby: {target}.', [addRel('child', { bind: true, closeness: 70, age: 0 }), stat('happiness', 3), money(-2500), mem('An unplanned pregnancy changed everything, and I would not undo it.', ['family'], 3)], 1.3),
    ]),
  ]),
  A('love_gift', 'love', '🎁', 'Give a gift', 'Show you care', { min: 14, target: { kind: ['partner', 'fling', 'ex'] } }, [
    opt('Flowers', 'Cost $40', [out('The smile on their face is worth every cent.', [bond(6), stat('happiness', 2)])], { cost: 40 }),
    opt('Jewelry', 'Cost $600', [out('They did not expect it, and they will not stop wearing it.', [bond(12), stat('happiness', 3)])], { cost: 600, requires: [{ t: 'age', op: '>=', v: 18 }] }),
    opt('A surprise getaway', 'Cost $2,000', [out('Two days somewhere beautiful with nothing to do but each other.', [bond(17), stat('happiness', 7)])], { cost: 2000, requires: [{ t: 'age', op: '>=', v: 18 }] }),
  ]),
  A('love_official', 'love', '💑', 'Make it official', 'Turn a fling into a relationship', { min: 16, time: 0, req: [noRel('partner')], target: { kind: 'fling', minCloseness: 40 } }, one([
    out('They smile and say yes. You are a couple now.', [bond(10), relkind('partner'), stat('happiness', 7)], 3),
    out('They like what you have, but not enough to put a label on it. A little distance follows.', [bond(-8), stat('happiness', -3)], 1),
  ])),
  A('love_movein', 'love', '📦', 'Move in together', 'Share the rent, share the sofa', { min: 19, repeat: 'once', req: [noFlag('cohabit')], target: { kind: 'partner', minCloseness: 60 } }, one([
    out('Two toothbrushes, one cramped bathroom, and a sense that this is real. Living costs drop.', [flag('cohabit'), bond(8), stat('happiness', 5), mem('We moved in together.', ['love'], 2)], 4),
    out('You are not quite ready, and you both feel it. Plans pause.', [bond(-2)], 1),
  ])),
  A('love_propose', 'love', '💍', 'Propose', 'Ask the big question', { min: 18, req: [noFlag('married')], target: { kind: 'partner', minCloseness: 55 } }, [
    opt('A ring, a plan, a knee on the ground', 'Cost $4,000', [
      out('"Yes!" Friends and family cry. You are engaged and married within the year.', [flag('married'), bond(10), stat('happiness', 13), mem('{target} said yes. We got married.', ['love'], 3)], 5),
      out('{target} needs more time. It hurts, but you talk it through.', [bond(-6), stat('happiness', -4)], 1),
    ], { cost: 4000 }),
    opt('Keep it simple', 'Cost $300', [
      out('Quiet, private, perfect. They say yes before you finish the sentence.', [flag('married'), bond(10), stat('happiness', 12), mem('{target} said yes. We got married.', ['love'], 3)], 5),
      out('{target} is not ready. You both pretend it did not happen.', [bond(-5), stat('happiness', -3)], 1),
    ], { cost: 300 }),
  ]),
  A('love_baby', 'love', '🍼', 'Try for a baby', 'A new life, a new chapter', { min: 20, max: 46, req: [noFlag('childfree')], target: { kind: 'partner', minCloseness: 50 } }, one([
    out('Nine months later: a baby, {target}. Sleepless nights and endless love.', [addRel('child', { bind: true, closeness: 75, age: 0 }), stat('happiness', 10), money(-3000), mem('Welcomed a child.', ['family'], 3)], 3),
    out('No luck this time. You stay hopeful and a little closer.', [bond(4), stat('happiness', -1)], 2),
  ])),
  A('love_breakup', 'love', '💔', 'End the relationship', 'Walk away', { min: 13, time: 0, target: { kind: ['partner', 'fling'] } }, [
    opt('Break up kindly', undefined, [out('It is gentle, honest and still sad. You both needed it.', [endRel(), stat('happiness', -5)])]),
    opt('Cut things off for good', undefined, [out('A short, hard conversation. You block the number and breathe.', [endRel(), stat('happiness', -3), stat('reputation', -1)])]),
  ]),
  A('love_exback', 'love', '🔁', 'Get back together', 'Second chances', { min: 18, req: [noRel('partner')], target: { kind: 'ex', minCloseness: 10 } }, one([
    out('Older, wiser, and willing to try again. You are together once more.', [bond(35), relkind('partner'), stat('happiness', 6)], 1),
    out('The old problems come back within a week. Closing the door again hurts, but it is clean.', [bond(-5), stat('happiness', -3)], 1.4),
  ])),

  // ═════════ FRIENDS & SOCIAL ═════════
  A('soc_friends', 'social', '🙋', 'Make new friends', 'Put yourself out there', { min: 6 }, [
    opt('Join a local club or team', undefined, [
      out('You show up every week and soon you have people to sit with.', [addRel('friend', { closeness: 55 }), stat('happiness', 4)], 3),
      out('Nobody really clicks. You try again next season.', [stat('happiness', -1)], 1),
    ], { requires: [{ t: 'age', op: '>=', v: 8 }] }),
    opt('Volunteer in your community', 'Reputation too', [
      out('Hands-on work leads to a lasting friendship and a stronger name.', [addRel('friend', { closeness: 55 }), stat('reputation', 4), stat('happiness', 3)], 3),
      out('A good cause and tired feet. You feel proud.', [stat('reputation', 3), stat('happiness', 2)], 1),
    ], { requires: [{ t: 'age', op: '>=', v: 13 }] }),
    opt('Talk to the neighbors', undefined, [
      out('A quick chat over the fence turns into dinner invitations.', [addRel('friend', { closeness: 50 }), stat('happiness', 3)], 2),
      out('Polite waves and little else.', [], 1),
    ], { requires: [{ t: 'age', op: '>=', v: 10 }] }),
    opt('Join an online community', undefined, [
      out('You find your people in a late-night group chat.', [addRel('friend', { closeness: 50 }), stat('happiness', 3), skill('tech', 1)], 2),
      out('The internet being the internet, you leave frustrated.', [stat('happiness', -2)], 1),
    ], { requires: [{ t: 'age', op: '>=', v: 13 }] }),
  ]),
  A('soc_party', 'social', '🎉', 'Throw a party', 'Bring everyone together', { min: 16, req: [hasRel('friend')] }, [
    opt('Backyard barbecue', 'Cost $200', [
      out('Burgers, music, and a lot of laughter. Everyone leaves happy.', [bond(6, 'friend'), stat('happiness', 5), stat('reputation', 2)], 4),
      out('It rains. You squeeze 20 people into the kitchen and it is somehow better.', [bond(7, 'friend'), stat('happiness', 4)], 1),
    ], { cost: 200 }),
    opt('Go all out', 'Cost $900', [
      out('The party people will talk about for years.', [bond(10, 'friend'), stat('happiness', 7), stat('reputation', 4)], 3),
      out('Things get out of hand. The neighbors call the cops and a vase will never recover.', [bond(5, 'friend'), stat('reputation', -3), money(-400)], 1),
    ], { cost: 900, requires: [{ t: 'age', op: '>=', v: 18 }] }),
  ]),
  A('soc_post', 'social', '📸', 'Post something online', 'Your corner of the internet', { min: 13, time: 0 }, one([
    out('It blows up. Strangers love it and your inbox is full of kind messages.', [stat('reputation', 5), stat('happiness', 4), skill('charisma', 1)], 0.6, { k: 'looks', amt: 0.5 }),
    out('A few likes and a lot of silence.', [], 3),
    out('Your joke lands wrong and the comments get ugly.', [stat('reputation', -3), stat('happiness', -3)], 0.8),
  ])),
  A('soc_reconnect', 'social', '📞', 'Look up an old friend', 'Pick up where you left off', { min: 22 }, one([
    out('You send a message. They write back within minutes. It is like no time has passed.', [addRel('friend', { closeness: 52 }), stat('happiness', 5), mem('Reconnected with an old friend after years apart.', ['friends'], 2)], 3),
    out('They are friendly but busy. A nice message, then nothing.', [stat('happiness', -1)], 1),
  ])),

  // person actions: friends, coworkers, siblings
  A('fr_hangout', 'social', '🍕', 'Hang out', 'Quality time', { min: 5, target: { kind: ['friend', 'coworker', 'sibling'] } }, [
    opt('Just hang out', 'Free', [out('Nothing planned, plenty to talk about.', [bond(8), stat('happiness', 3)])]),
    opt('Go out together', 'Cost $60', [out('Food, a movie, and a lot of inside jokes.', [bond(11), stat('happiness', 5)])], { cost: 60 }),
  ]),
  A('fr_talk', 'social', '🗣️', 'Have a real conversation', 'Go deeper', { min: 8, target: { kind: ['friend', 'sibling', 'parent', 'coworker'] } }, one([
    out('You say the things you usually do not. They do the same. Something shifts for the better.', [bond(10), stat('happiness', 3)], 3),
    out('It gets awkward, then funny, then fine.', [bond(4)], 1),
  ])),
  A('fr_borrow', 'social', '💸', 'Ask to borrow money', 'Strain a friendship', { min: 17, target: { kind: 'friend', minCloseness: 50 } }, [
    opt('Ask for $1,000', undefined, [out('They hand it over without hesitation. You owe them more than money.', [money(1000), bond(-3)], 3), out('They cannot help right now, and it gets a little awkward.', [bond(-6)], 1)]),
    opt('Ask for $4,000', undefined, [out('A long pause, then yes. You promise to pay back every cent.', [money(4000), bond(-8)], 1.4), out('That is too much to ask. The friendship cools.', [bond(-12)], 2)]),
  ]),
  A('fr_party', 'social', '🎂', 'Throw them a surprise', 'Make their day', { min: 14, target: { kind: ['friend', 'partner', 'sibling'] } }, one([
    out('They walk in, see everyone yelling "surprise," and tear up.', [bond(13), stat('happiness', 4), stat('reputation', 1)], 4),
    out('They saw it coming. Still lovely.', [bond(8), stat('happiness', 2)], 1),
  ], { cost: 150 })),
  A('fr_cut', 'social', '✂️', 'Cut ties', 'Some people are not worth it', { min: 12, time: 0, target: { kind: ['friend', 'rival', 'coworker'] } }, one([
    out('You say what needed saying and walk away. It feels heavy, then light.', [endRel(), stat('happiness', -1)]),
  ])),

  // person actions: family
  A('par_visit', 'family', '🏠', 'Visit', 'Make time for them', { min: 6, target: { kind: 'parent' } }, one([
    out('Dinner, old stories, and a very full fridge on your way out.', [bond(8), stat('happiness', 3)], 3),
    out('A calm afternoon of tea and quiet.', [bond(5), stat('happiness', 2)], 1),
  ])),
  A('par_money', 'family', '🪙', 'Ask for money', 'Swallow your pride', { min: 16, target: { kind: 'parent', minCloseness: 35 } }, [
    opt('A little help ($1,500)', undefined, [out('They send it with a hug and a reminder to eat vegetables.', [money(1500), bond(-2)], 3), out('Not this time. They are stretched too.', [bond(-4)], 1)]),
    opt('A big favor ($6,000)', undefined, [out('A serious talk first, and then they do it.', [money(6000), bond(-6)], 1.2, { k: 'reputation', amt: 1 }), out('They say no, kindly, and ask what is really going on.', [bond(-8), stat('happiness', -2)], 2)]),
  ]),
  A('par_care', 'family', '🩹', 'Help with their bills', 'Give back', { min: 28, target: { kind: 'parent' } }, one([
    out('You quietly take care of what they could not. Their eyes say everything.', [bond(11), stat('reputation', 1), stat('happiness', 2)]),
  ], { cost: 1500 })),
  A('kid_time', 'family', '🧸', 'Spend time with your child', 'They grow up fast', { min: 18, target: { kind: 'child' } }, one([
    out('You build something, you read something, you laugh a lot. They will remember today.', [bond(11), stat('happiness', 5), mem('A perfect day with {target}.', ['family'], 2)], 3),
    out('Mostly chaos, snacks, and sticky hands, in the best way.', [bond(8), stat('happiness', 3)], 2),
  ])),
  A('kid_help', 'family', '📖', 'Help them learn', 'Homework, hobbies, life lessons', { min: 22, target: { kind: 'child' } }, one([
    out('Patience, a lot of patience, and a breakthrough. They beam.', [bond(8), stat('smarts', 1), stat('happiness', 2)]),
  ])),
  A('kid_gift', 'family', '🎈', 'Spoil them a little', 'Because you can', { min: 20, target: { kind: 'child' } }, one([
    out('Their face when they open it is the best part of your year.', [bond(8), stat('happiness', 3)]),
  ], { cost: 250 })),
  A('men_advice', 'career', '🧭', 'Ask for advice', 'Learn from experience', { min: 14, target: { kind: 'mentor' } }, [
    opt('Career advice', undefined, [out('They tell you what they wish they had known at your age. You take notes.', [perf(9), stat('smarts', 1), bond(4)])]),
    opt('Life advice', undefined, [out('A long walk, a good talk, a clearer head.', [stat('happiness', 4), stat('smarts', 2), bond(5)])]),
    opt('Ask for a reference', 'Helps on the job board', [out('They agree to vouch for you anywhere you apply.', [flag('reference'), bond(3)])]),
  ]),
  A('rv_peace', 'social', '🕊️', 'Make peace', 'End the feud', { min: 12, target: { kind: 'rival' } }, one([
    out('You swallow your pride first. They respond in kind. An uneasy peace turns into respect.', [bond(25), stat('reputation', 2), stat('happiness', 3)], 2, { k: 'reputation', amt: 1 }),
    out('They are not ready. At least you tried.', [bond(3)], 1),
  ])),

  // ═════════ SCHOOL ═════════
  A('sch_study', 'school', '📚', 'Study hard', 'Grades matter', { min: 6, max: 45, req: [youngOrStudent] }, one([
    out('Late nights and flashcards pay off. You feel sharper.', [stat('smarts', 3), gpa(0.12), stat('happiness', -1)], 3, { k: 'smarts', amt: 1 }),
    out('A breakthrough year. Things finally click.', [stat('smarts', 5), gpa(0.2), stat('happiness', -1)], 1),
    out('You push too hard and burn out a bit.', [stat('smarts', 1), stat('happiness', -4)], 1),
  ])),
  A('sch_skip', 'school', '🛹', 'Skip class', 'Live a little', { min: 12, max: 30, req: [youngOrStudent] }, one([
    out('A beautiful day off with zero consequences.', [stat('happiness', 4), stat('smarts', -1)], 3),
    out('You get caught. Detention, a call home, and a stain on your record.', [stat('reputation', -5), stat('happiness', -3), gpa(-0.15)], 1.2),
  ])),
  A('sch_scholar', 'school', '🏅', 'Apply for scholarships', 'Free money, if you earn it', { min: 16, max: 30, req: [youngOrStudent] }, one([
    out('You win a scholarship. All those essays were worth it.', [money(6000), stat('reputation', 3), stat('happiness', 5)], 1, { k: 'smarts', amt: 1.5 }),
    out('A smaller award arrives in the mail.', [money(2000), stat('happiness', 2)], 1.5),
    out('Nothing this round.', [stat('happiness', -1)], 1.5),
  ])),
  A('sch_tutor', 'school', '✏️', 'Tutor other students', 'Teach to learn', { min: 15, req: [statIs('smarts', '>=', 60)] }, one([
    out('A few students and a lot of patience. You earn a bit and learn plenty.', [money(1400), stat('smarts', 1), stat('reputation', 1)], 3),
    out('A student cancels. Another does not pay. Meh.', [money(300)], 1),
  ])),
  A('sch_major', 'school', '🧪', 'Choose a major', 'Shapes your career options', { min: 17, req: [inSchool()] }, [
    opt('Science & Engineering', 'Tech and research', [out('Equations and late-night labs. Your brain feels like it is growing.', [major('stem'), skill('tech', 5), stat('smarts', 1)])]),
    opt('Business & Economics', 'Finance, management', [out('Case studies and networking. You learn how money moves.', [major('business'), skill('charisma', 3), stat('smarts', 1)])]),
    opt('Health Sciences', 'Nursing, medicine', [out('Anatomy, chemistry, and caring for others.', [major('health'), stat('smarts', 2), stat('health', 1)])]),
    opt('Arts & Humanities', 'Creativity and ideas', [out('Books, studios and long debates over coffee.', [major('arts'), skill('creativity', 6)])]),
    opt('Education', 'Teaching careers', [out('You discover how much you love helping others learn.', [major('education'), skill('charisma', 3), stat('reputation', 1)])]),
    opt('Politics & Pre-Law', 'Law school path', [out('Debates, mock trials and a growing appreciation for good arguments.', [major('law'), skill('charisma', 4), stat('smarts', 1)])]),
  ]),
  A('sch_dropout', 'school', '🚪', 'Drop out', 'Leave school behind', { min: 16, time: 0, req: [inSchool()] }, one([
    out('You pack up and walk out. It is terrifying, freeing, and maybe a mistake.', [dropout(), stat('happiness', -2), stat('reputation', -3), mem('Dropped out of school to find my own path.', ['school'], 2)]),
  ])),
  A('sch_return', 'school', '🏫', 'Go to college', 'Pick a school, any age', { min: 17, max: 62, req: [notInSchool, { t: 'not', c: eduAtLeast('college') }] }, [
    opt('Community college', '2 years · $4k/yr', [out('Evening classes and a fresh start. You are on your way to an associate degree.', [enroll('community'), stat('happiness', 3), stat('smarts', 1)])]),
    opt('State university', '4 years · $10k/yr', [out('You enroll at the state university. Four years of classes, friends and finals.', [enroll('state'), stat('happiness', 4), flag('moved_out')])], { requires: [statIs('smarts', '>=', 40)] }),
    opt('Private college', '4 years · $22k/yr', [out('A smaller campus, bigger bills, and a network that opens doors.', [enroll('private'), stat('happiness', 4), flag('moved_out')])], { requires: [statIs('smarts', '>=', 52)] }),
    opt('Elite university', '4 years · $38k/yr', [
      out('The letter says yes. You are going to one of the hardest schools in the country.', [enroll('elite'), stat('happiness', 8), stat('reputation', 4), flag('moved_out')], 1, { k: 'smarts', amt: 2 }),
      out('The letter says no. You will regroup and aim a little lower.', [stat('happiness', -4)], 1),
    ], { requires: [statIs('smarts', '>=', 70)] }),
  ]),
  A('sch_grad', 'school', '🎓', 'Apply to grad school', 'Medicine, law, business, research', { min: 21, max: 55, req: [eduAtLeast('college'), noGrad, notInSchool] }, [
    opt('Medical school', '4 years · $40k/yr · smarts 70+', [
      out('Accepted. Years of study ahead, a white coat at the end.', [enroll('private', { kind: 'grad', degree: 'med', length: 4, tuition: 40000 }), stat('happiness', 6), stat('reputation', 4)], 1, { k: 'smarts', amt: 2 }),
      out('Rejected this cycle. Strengthen your application and try again.', [stat('happiness', -5)], 1.4),
    ], { requires: [statIs('smarts', '>=', 70)] }),
    opt('Law school', '3 years · $32k/yr · smarts 62+', [
      out('Accepted. Three years of reading, arguing and caffeine.', [enroll('private', { kind: 'grad', degree: 'law', length: 3, tuition: 32000 }), stat('happiness', 5), stat('reputation', 3)], 1, { k: 'smarts', amt: 1.8 }),
      out('Waitlisted, then rejected. Ouch.', [stat('happiness', -4)], 1.2),
    ], { requires: [statIs('smarts', '>=', 62)] }),
    opt('MBA', '2 years · $36k/yr · smarts 50+', [
      out('Accepted. Two years of case studies and very expensive networking.', [enroll('private', { kind: 'grad', degree: 'mba', length: 2, tuition: 36000 }), stat('happiness', 4), skill('charisma', 3)], 2, { k: 'smarts', amt: 1 }),
      out('Not this time.', [stat('happiness', -3)], 1),
    ], { requires: [statIs('smarts', '>=', 50)] }),
    opt('PhD / research', '4 years · small stipend · smarts 68+', [
      out('Accepted with funding. You will be a researcher.', [enroll('state', { kind: 'grad', degree: 'phd', length: 4, tuition: 3000 }), stat('happiness', 4), stat('smarts', 2)], 1, { k: 'smarts', amt: 2 }),
      out('The committee passes. Maybe next year.', [stat('happiness', -3)], 1.2),
    ], { requires: [statIs('smarts', '>=', 68)] }),
  ]),

  // ═════════ CAREER ═════════
  A('car_work', 'career', '🛠️', 'Work extra hard', 'Impress the boss', { min: 16, req: [employed()] }, one([
    out('Early mornings and late nights. Your boss definitely noticed.', [perf(14), stat('health', -2), stat('happiness', -1)], 3),
    out('A big win lands on your desk and you nail it.', [perf(10), stat('reputation', 2)], 1),
  ])),
  A('car_raise', 'career', '💵', 'Ask for a raise', 'Know your worth', { min: 18, req: [employed()] }, one([
    out('Your manager agrees. A solid raise.', [{ t: 'raise', pct: 10 }, stat('happiness', 4)], 3, { k: 'reputation', amt: 1.2 }),
    out('A big win: you negotiate hard and walk away with a much better salary.', [{ t: 'raise', pct: 20 }, stat('happiness', 7), stat('reputation', 2)], 0.8, { k: 'smarts', amt: 1 }),
    out('"Not in the budget this year." You smile, nod, and update your resume in your head.', [stat('happiness', -4)], 2),
  ], { requires: [{ t: 'perf', op: '>=', v: 40 }] })),
  A('car_network', 'career', '🤝', 'Network', 'Know the right people', { min: 18, req: [employed()] }, one([
    out('A colleague turns into a mentor.', [addRel('mentor', { closeness: 55 }), perf(4), stat('reputation', 3)], 2, { k: 'reputation', amt: 1 }),
    out('You collect cards and make a genuine friend.', [addRel('coworker', { closeness: 50 }), stat('reputation', 2)], 2),
    out('Awkward small talk and cold coffee.', [stat('reputation', 1)], 1),
  ])),
  A('car_gig', 'career', '🚕', 'Pick up gig work', 'Quick cash', { min: 16 }, one([
    out('A few busy weekends and a thicker wallet.', [money(1400), stat('health', -1)], 3),
    out('A big gig lands. Great pay for a few good days.', [money(3200), stat('reputation', 1)], 1, { k: 'reputation', amt: 1 }),
    out('Slow season. You barely cover gas.', [money(150)], 1),
  ])),
  A('car_quit', 'career', '🫡', 'Quit your job', 'Walk away', { min: 16, time: 0, req: [employed()] }, one([
    out('You hand in your notice and breathe out for the first time in months.', [quit(), stat('happiness', 4)]),
  ])),
  A('car_biz', 'career', '🏪', 'Start a business', 'Be your own boss', { min: 21, req: [inField('business', false)] }, [
    opt('Coffee shop', 'Cost $25,000', [
      out('The doors open. Regulars appear by the second week.', [hire('business'), perf(20), stat('happiness', 7), mem('Opened my own coffee shop.', ['business'], 3)], 1, { k: 'reputation', amt: 1 }),
      out('Rent is brutal and margins are thin. You are surviving, barely.', [hire('business'), perf(-20), stat('happiness', 2)], 1),
    ], { cost: 25000 }),
    opt('Online store', 'Cost $8,000', [
      out('Your products find an audience. Orders trickle, then pour in.', [hire('business'), perf(15), stat('happiness', 6), skill('tech', 2), mem('Built an online store from scratch.', ['business'], 3)], 1, { k: 'smarts', amt: 1.2 }),
      out('Marketing is harder than it looks. Sales are slow.', [hire('business'), perf(-18), stat('happiness', 1)], 1),
    ], { cost: 8000 }),
    opt('Consulting firm', 'Cost $5,000 · college degree', [
      out('Your first clients refer you to their friends. Business is steady.', [hire('business'), perf(22), stat('reputation', 4), mem('Started my own consulting firm.', ['business'], 3)], 1.4, { k: 'reputation', amt: 1 }),
      out('Slow start, long lunches, no clients.', [hire('business'), perf(-16)], 1),
    ], { cost: 5000, requires: [eduAtLeast('college')] }),
    opt('Food truck', 'Cost $18,000', [
      out('Lines form down the block. People post about your tacos.', [hire('business'), perf(18), stat('happiness', 8), stat('reputation', 3)], 1, { k: 'looks', amt: 0.6 }),
      out('Permits, repairs and rainy weekends. You are not sure it will last.', [hire('business'), perf(-20), stat('happiness', -1)], 1),
    ], { cost: 18000 }),
  ]),
  A('car_retire', 'career', '🏖️', 'Retire early', 'Enjoy your time', { min: 55, time: 0, req: [employed()] }, one([
    out('Your last day: a cake, a card, and a very long weekend ahead of you.', [retire(), stat('happiness', 6), stat('health', 2)]),
  ])),

  // ═════════ SPORTS & FITNESS ═════════
  A('sp_join', 'sports', '🏟️', 'Join a team', 'School or local league', { min: 8, max: 45, req: [noFlag('on_team')] }, one([
    out('You make the team and gain a locker, a jersey and a bunch of teammates.', [flag('on_team'), skill('athletics', 4), addRel('friend', { closeness: 58 }), stat('happiness', 5)], 3, { k: 'health', amt: 1 }),
    out('You get cut. It hurts, but you will be back next season.', [skill('athletics', 1), stat('happiness', -3)], 1),
  ])),
  A('sp_leave', 'sports', '🧢', 'Leave your team', 'Hang up the jersey', { min: 8, time: 0, req: [hasFlag('on_team')] }, one([
    out('You turn in your jersey. Every ending is a beginning.', [flag('on_team', false), stat('happiness', -1)]),
  ])),
  A('sp_game', 'sports', '🏆', 'Play the big game', 'Compete', { min: 8, req: [hasFlag('on_team')] }, one([
    out('You play the game of your life and the crowd roars.', [stat('reputation', 4), stat('happiness', 6), skill('athletics', 2)], 2, { k: 'health', amt: 1 }),
    out('A narrow loss, but you left it all on the field.', [stat('happiness', -1), skill('athletics', 1)], 2),
    out('A rough tackle ends your season early.', [stat('health', -9), skill('athletics', -1), stat('happiness', -4)], 0.6),
    out('MVP. They call your name over the loudspeaker.', [stat('reputation', 8), stat('happiness', 9), skill('athletics', 3), mem('Won MVP in front of a roaring crowd.', ['sports'], 3)], 0.4, { k: 'health', amt: 1 }),
  ])),
  A('sp_train', 'sports', '🏋️', 'Work out', 'Build your body', { min: 10 }, [
    opt('Light workout', 'Free', [out('A steady jog and some stretching. You feel good.', [stat('health', 3), skill('athletics', 2)])]),
    opt('Intense training', undefined, [out('Sweat, shaking legs, a personal best.', [skill('athletics', 7), stat('health', -1), stat('happiness', 2)], 5), out('You push a bit too far and tweak something.', [skill('athletics', 3), stat('health', -9)], 1)]),
    opt('Hire a coach', 'Cost $900', [out('Expert guidance makes every session count.', [skill('athletics', 9), stat('health', 2), stat('looks', 1)])], { cost: 900 }),
  ]),
  A('sp_scout', 'sports', '🎽', 'Impress college scouts', 'Win an athletic scholarship', { min: 16, max: 19, repeat: 'once', req: [notInSchool, skillIs('athletics', '>=', 62)] }, one([
    out('A coach waves you over. A scholarship offer is in your hands.', [money(16000), stat('reputation', 5), stat('happiness', 8), mem('Earned an athletic scholarship offer.', ['sports', 'school'], 2)], 1, { k: 'health', amt: 1 }),
    out('Plenty of interest but no offers.', [stat('happiness', -1)], 1),
  ])),
  A('sp_marathon', 'sports', '🏃', 'Run a marathon', 'Twenty-six miles', { min: 16, max: 62, req: [statIs('health', '>=', 45)] }, one([
    out('You cross the finish line in tears and triumph.', [stat('reputation', 3), stat('health', 3), stat('happiness', 7), skill('athletics', 4), mem('Ran my first marathon.', ['sports'], 2)], 3, { k: 'health', amt: 1.2 }),
    out('You hit the wall at mile 20 and limp to the finish.', [skill('athletics', 2), stat('health', -5), stat('happiness', 2)], 1),
  ])),

  // ═════════ MONEY ═════════
  A('mon_invest', 'money', '📈', 'Invest', 'Make your money work', { min: 18 }, [
    opt('Index fund · $2,000', 'Slow and steady', [out('Boring and reliable. It grows quietly.', [money(2400), stat('smarts', 1)], 3), out('A flat year. You hold on.', [money(1900)], 1)], { cost: 2000 }),
    opt('Individual stocks · $6,000', 'Pick winners', [out('A hot pick takes off. You feel like a genius.', [money(9800), stat('happiness', 3)], 2, { k: 'smarts', amt: 1 }), out('Mixed results and a few regrets.', [money(5400)], 2), out('One company crashes, and so does your return.', [money(3200), stat('happiness', -2)], 1)], { cost: 6000 }),
    opt('Crypto · $2,000', 'Wild ride', [out('To the moon. You cash out before the drop.', [money(7200), stat('happiness', 5)], 0.8), out('Mostly sideways, then down.', [money(900), stat('happiness', -2)], 3), out('It collapses entirely.', [stat('happiness', -4)], 1.2)], { cost: 2000 }),
    opt('Rental property · $30,000', 'Long-term income', [out('Reliable tenants, steady rent, rising value.', [money(38500), stat('reputation', 1)], 2), out('Repairs eat the profit.', [money(29500), stat('happiness', -1)], 1)], { cost: 30000 }),
  ]),
  A('mon_gamble', 'money', '🎰', 'Take a gamble', 'Fortune favors the bold', { min: 21 }, [
    opt('Lottery ticket', 'Cost $20', [out('Not this time.', [], 190), out('A small prize: enough for dinner.', [money(100)], 8), out('JACKPOT. You scream in a convenience store.', [money(50000), stat('happiness', 12), mem('Won the lottery jackpot.', ['luck'], 3)], 0.3)], { cost: 20 }),
    opt('Casino night', 'Cost $500', [out('A hot streak. You walk out ahead.', [money(1200), stat('happiness', 4)], 4), out('You break even and call it a good night.', [money(500)], 1), out('The house always wins. Ouch.', [stat('happiness', -3)], 5)], { cost: 500 }),
  ]),
  A('mon_donate', 'money', '❤️', 'Give to charity', 'Do some good', { min: 14, time: 0 }, [
    opt('$100', undefined, [out('A small gift that means something to somebody.', [stat('happiness', 2), stat('reputation', 1)])], { cost: 100 }),
    opt('$1,000', undefined, [out('A real donation, and a handwritten thank-you.', [stat('happiness', 4), stat('reputation', 4)])], { cost: 1000 }),
    opt('$10,000', undefined, [out('Your name goes on a plaque. The good it does matters more.', [stat('happiness', 6), stat('reputation', 9), mem('Made a major charitable gift.', ['kindness', 'legacy'], 2)])], { cost: 10000 }),
  ]),
  A('mon_pay_debt', 'money', '🧾', 'Pay down debt', 'Interest is the enemy', { min: 18, time: 0, req: [debt('>', 0)] }, [
    opt('Pay $1,000', undefined, [out('A little lighter.', [payDebt(1000), stat('happiness', 1)])], { requires: [cash('>=', 1000)] }),
    opt('Pay $5,000', undefined, [out('A big chunk of balance disappears.', [payDebt(5000), stat('happiness', 3)])], { requires: [cash('>=', 5000)] }),
    opt('Pay $25,000', undefined, [out('A weight lifts off your shoulders.', [payDebt(25000), stat('happiness', 6)])], { requires: [cash('>=', 25000)] }),
  ]),
  A('mon_loan', 'money', '🏦', 'Take out a loan', 'Cash now, interest later', { min: 21, time: 0, req: [debt('<', 60000)] }, [
    opt('$5,000 personal loan', '9% · 5 years', [out('The money arrives fast. The payments arrive faster.', [loan('Personal loan', 5000, 0.09, 5)])]),
    opt('$20,000 personal loan', '9% · 5 years', [out('A big cushion, and a long commitment.', [loan('Personal loan', 20000, 0.09, 5)])], { requires: [statIs('reputation', '>=', 35)] }),
  ]),
  A('mon_budget', 'money', '🧮', 'Make a budget', 'Cut the waste', { min: 18 }, one([
    out('Subscriptions canceled, coffee runs trimmed. You pocket a surprising amount.', [money(1800), stat('smarts', 1)], 3),
    out('Spreadsheets are not your thing. You stick with it for a month.', [money(400)], 1),
  ])),

  // ═════════ HEALTH & LOOKS ═════════
  A('hl_checkup', 'health', '🩺', 'Get a check-up', 'Catch things early', { min: 3 }, one([
    out('Clean bill of health. A good doctor and a clear head.', [stat('health', 3)], 3),
    out('They catch something small before it turns big. Smart call.', [stat('health', 7)], 1),
  ], { cost: 150 })),
  A('hl_mind', 'health', '🧠', 'Look after your mind', 'Therapy, meditation, rest', { min: 10 }, [
    opt('Meditate', 'Free', [out('Ten quiet minutes a day. Surprisingly powerful.', [stat('happiness', 4), stat('health', 1)])]),
    opt('Take a mental health day', 'Free', [out('You switch off notifications and do absolutely nothing. It is wonderful.', [stat('happiness', 5), stat('health', 2)])]),
    opt('See a therapist', 'Cost $1,200', [out('Weekly conversations unpack things you did not know you carried.', [stat('happiness', 11), stat('health', 1), stat('smarts', 1)])], { cost: 1200, requires: [{ t: 'age', op: '>=', v: 12 }] }),
  ]),
  A('hl_style', 'health', '💇', 'Change your look', 'Hair, skin, ink', { min: 12 }, [
    opt('New haircut and style', 'Cost $120', [out('You look in the mirror and smile.', [stat('looks', 3), stat('happiness', 2)])], { cost: 120 }),
    opt('Skincare routine', 'Cost $300', [out('A consistent routine shows up on your face.', [stat('looks', 3), stat('health', 1)])], { cost: 300 }),
    opt('Get a tattoo', 'Cost $200 · 18+', [out('A permanent piece of you. Some people love it, some do not.', [stat('looks', 1), stat('happiness', 3), stat('reputation', -1)])], { cost: 200, requires: [{ t: 'age', op: '>=', v: 18 }] }),
  ]),
  A('hl_surgery', 'health', '💉', 'Cosmetic procedure', 'Risky and expensive', { min: 18 }, [
    opt('Subtle work', 'Cost $6,000', [out('Natural-looking, quietly confident.', [stat('looks', 8), stat('happiness', 4)], 4), out('There are complications. The result is okay but recovery was rough.', [stat('looks', 2), stat('health', -6)], 1)], { cost: 6000 }),
    opt('Major transformation', 'Cost $18,000', [out('A dramatic change. Heads turn.', [stat('looks', 16), stat('happiness', 6), stat('reputation', 2)], 3), out('A surgical mishap leaves you worse than before.', [stat('looks', -5), stat('health', -12), stat('happiness', -8)], 1)], { cost: 18000 }),
  ]),
  A('hl_diet', 'health', '🥗', 'Clean up your diet', 'You are what you eat', { min: 12 }, one([
    out('Whole foods and water. You feel better in weeks.', [stat('health', 4), stat('looks', 1)], 3),
    out('You quit by Wednesday and the pizza wins.', [stat('happiness', 1)], 1),
  ])),

  // ═════════ HOME & FAMILY ═════════
  A('fam_adopt', 'family', '🧒', 'Adopt a child', 'Open your home', { min: 25, max: 55, req: [noFlag('childfree')] }, one([
    out('After months of paperwork and visits, a child joins your family: {target}.', [addRel('child', { bind: true, closeness: 65, age: 3 }), stat('happiness', 12), mem('Adopted a child and gained a family.', ['family'], 3)]),
  ], { cost: 14000 })),
  A('fam_dinner', 'family', '🍽️', 'Family dinner', 'Gather everyone', { min: 6, req: [anyOf(hasRel('parent'), hasRel('child'))] }, one([
    out('Everyone around one table, talking over each other. Pure noise and warmth.', [bond(5, 'parent'), bond(5, 'child'), bond(4, 'sibling'), stat('happiness', 3), money(-60)]),
  ])),
  A('fam_moveout', 'family', '🧳', 'Move out', 'Your own place', { min: 17, max: 40, req: [noFlag('moved_out')] }, one([
    out('Boxes, a borrowed truck, and a tiny apartment that is entirely yours.', [flag('moved_out'), stat('happiness', 5), mem('Moved into my own place.', ['milestone'], 2)]),
  ], { cost: 1500 })),
  A('fam_movehome', 'family', '🛋️', 'Move back home', 'Save some money', { min: 19, max: 45, req: [hasFlag('moved_out'), hasRel('parent'), noFlag('owns_home')] }, one([
    out('Your old room still has the poster. It is not glamorous, but your bank account will thank you.', [flag('moved_out', false), bond(8, 'parent'), stat('happiness', -3)]),
  ])),
  A('fam_relocate', 'family', '🗺️', 'Move to a new city', 'Fresh start', { min: 18, max: 62 }, one([
    out('You start over somewhere new. It is lonely, exciting and a little scary.', [stat('happiness', 4), bond(-18, 'friend'), stat('smarts', 1), mem('Moved to a new city and started again.', ['milestone'], 2)]),
  ], { cost: 3000 })),
  A('fam_vacation', 'family', '🏝️', 'Take a vacation', 'Go somewhere', { min: 6, time: 2 }, [
    opt('Road trip', 'Cost $500', [out('Good music, bad snacks, wrong turns, great memories.', [stat('happiness', 6), bond(5, 'partner'), bond(5, 'child'), stat('health', 1)])], { cost: 500 }),
    opt('Beach weekend', 'Cost $900', [out('Sun, sand and absolutely no email.', [stat('happiness', 7), stat('health', 2), bond(5, 'partner'), bond(5, 'child')])], { cost: 900 }),
    opt('International trip', 'Cost $4,500', [out('New food, new streets, a new sense of how big everything is.', [stat('happiness', 11), stat('smarts', 2), stat('reputation', 1), mem('A trip abroad I will never forget.', ['travel'], 2)])], { cost: 4500, requires: [{ t: 'age', op: '>=', v: 16 }] }),
  ]),

  // ═════════ SKILLS & LIFESTYLE ═════════
  A('life_lessons', 'life', '🎸', 'Take lessons', 'Learn something new', { min: 6 }, [
    opt('Music lessons', 'Cost $400', [out('Scales, songs, and a growing love of the sound.', [skill('creativity', 6), stat('happiness', 3)])], { cost: 400 }),
    opt('Art class', 'Cost $300', [out('Charcoal on your hands and a sketchbook full of attempts.', [skill('creativity', 6), stat('happiness', 3)])], { cost: 300 }),
    opt('Coding bootcamp', 'Cost $2,500', [out('Twelve intense weeks. You finish with real projects.', [skill('tech', 10), stat('smarts', 2)])], { cost: 2500, requires: [{ t: 'age', op: '>=', v: 14 }] }),
    opt('Public speaking club', 'Cost $150', [out('Sweaty palms become steady ones. You can hold a room.', [skill('charisma', 7), stat('reputation', 2)])], { cost: 150, requires: [{ t: 'age', op: '>=', v: 12 }] }),
    opt('Debate team', 'Free', [out('You learn to think on your feet and to enjoy winning an argument.', [skill('charisma', 4), stat('smarts', 1)])], { requires: [{ t: 'age', op: '>=', v: 12 }] }),
  ]),
  A('life_read', 'life', '📖', 'Read a good book', 'Time well spent', { min: 7 }, one([
    out('You disappear into someone else\'s world and come back a little wiser.', [stat('smarts', 2), stat('happiness', 1)]),
  ])),
  A('life_license', 'life', '🚗', "Get your driver's license", 'Freedom on four wheels', { min: 16, max: 60, req: [noFlag('licensed')] }, one([
    out('You pass. The keys feel like a tiny piece of freedom.', [flag('licensed'), stat('happiness', 6)], 3, { k: 'smarts', amt: 1 }),
    out('You fail by two points. Try again next year.', [stat('happiness', -2)], 1),
  ], { cost: 100 })),
];

export const ACTION_BY_ID: Record<string, ActionDef> = Object.fromEntries(ACTIONS.map((a) => [a.id, a]));
export const getAction = (id: string): ActionDef | undefined => ACTION_BY_ID[id];
