// CORE pack — free, ships with the app. Ages 0-90+, school, work, love, family, money, health, legacy.
// To add content: copy any event, change the id/text/effects. No engine changes needed.
import type { EventDef } from '../engine/types.ts';
import {
  addRel, anyOf, bond, cash, die, edu, eduAtLeast, employed, endRel, flag, generation, hasFlag, hasRel, job, mem, money,
  noFlag, noRel, odds, opt, out, quit, raise, remembers, retire, rtag, stat, statIs, unemployed,
} from './dsl.ts';

const P = 'core';

export const CORE_EVENTS: EventDef[] = [
  // ───────────── early childhood ─────────────
  {
    id: 'first_steps', pack: P, category: 'family', title: 'First steps', minAge: 1, maxAge: 1, weight: 1, milestone: true,
    text: 'You take your first wobbly steps across the living room. Everyone cheers like you won something.',
    effects: [stat('happiness', 3), mem('Took my first steps while the whole family cheered.', ['childhood'])],
  },
  {
    id: 'first_words', pack: P, category: 'family', title: 'First words', minAge: 2, maxAge: 2, weight: 1, milestone: true,
    text: 'Your first real word comes out loud and clear. Your family argues about what it was.',
    effects: [stat('smarts', 2), stat('happiness', 2)],
  },
  {
    id: 'why_phase', pack: P, category: 'life', title: 'The why phase', minAge: 3, maxAge: 5, weight: 2,
    text: 'You discover the question "why?" and use it on everyone, constantly.',
    effects: [stat('smarts', 2)],
  },
  {
    id: 'kinder_friend', pack: P, category: 'friends', title: 'A first friend', minAge: 5, maxAge: 5, weight: 1, milestone: true,
    text: 'On your first day of kindergarten you share crayons with a kid named {target}. A friendship begins.',
    effects: [addRel('friend', { bind: true, closeness: 55 }), stat('happiness', 3)],
  },
  {
    id: 'first_school_day', pack: P, category: 'school', title: 'Big kid school', minAge: 6, maxAge: 6, weight: 1, milestone: true,
    text: 'Real school begins: backpacks, homework, and a whole new world of rules.',
    effects: [stat('smarts', 1), mem('Started elementary school.', ['school'])],
  },
  {
    id: 'family_trip', pack: P, category: 'family', title: 'Family trip', minAge: 5, maxAge: 16, weight: 2, cooldown: 3,
    text: 'Your family takes a road trip. Snacks run out by hour two, but the memories last.',
    effects: [stat('happiness', 4), bond(4, 'parent'), mem('A long road trip with the family.', ['family'])],
  },
  {
    id: 'seasonal_flu', pack: P, category: 'health', title: 'Under the weather', minAge: 2, maxAge: 85, weight: 0.8, cooldown: 4,
    text: 'You catch a nasty flu and spend a week wrapped in blankets.',
    effects: [stat('health', -4), stat('happiness', -2)],
  },

  {
    id: 'playground', pack: P, category: 'life', title: 'The playground', minAge: 3, maxAge: 9, weight: 2, cooldown: 2,
    text: 'You spend whole afternoons on the swings, inventing games with rules that change every five minutes.',
    effects: [stat('happiness', 3), stat('health', 1)],
  },
  {
    id: 'birthday_party', pack: P, category: 'family', title: 'Birthday party', minAge: 4, maxAge: 14, weight: 2, cooldown: 3,
    text: 'Your birthday party has cake, too many balloons, and one friend who cries because they did not get the first slice.',
    effects: [stat('happiness', 4), bond(3, 'friend')],
  },
  {
    id: 'learn_bike', pack: P, category: 'life', title: 'No more training wheels', minAge: 5, maxAge: 9, weight: 4, once: true,
    text: 'After a few wobbly crashes and one very skinned knee, you ride your bike on your own for the first time.',
    effects: [stat('health', 2), stat('happiness', 4), mem('Learned to ride a bike.', ['childhood'])],
  },
  {
    id: 'bedtime_stories', pack: P, category: 'family', title: 'Bedtime stories', minAge: 2, maxAge: 8, weight: 2, cooldown: 3,
    conditions: [hasRel('parent')],
    text: 'Every night someone reads to you. You pretend to fall asleep just to hear what happens next.',
    effects: [stat('smarts', 1), bond(3, 'parent')],
  },
  {
    id: 'school_trip', pack: P, category: 'school', title: 'Field trip', minAge: 7, maxAge: 16, weight: 2, cooldown: 3,
    text: 'A school trip to a museum turns into the best day of the semester, mostly because of the bus ride.',
    effects: [stat('happiness', 3), stat('smarts', 1)],
  },
  {
    id: 'summer_break', pack: P, category: 'life', title: 'Summer break', minAge: 8, maxAge: 17, weight: 2, cooldown: 2,
    text: 'Summer stretches out forever: sprinklers, late nights, and no plans at all.',
    effects: [stat('happiness', 4)],
  },

  // ───────────── childhood ─────────────
  {
    id: 'hobby_discovery', pack: P, category: 'life', title: 'Something that lights you up', minAge: 7, maxAge: 12, weight: 5, once: true,
    text: 'You get the chance to pick a hobby and really commit to it. What pulls you in?',
    choices: [
      opt('Sports', 'Health and friends', [
        out('Practice every week makes you stronger and gives you a team.', [flag('hobby_sports'), stat('health', 5), stat('happiness', 3), addRel('friend', { closeness: 55 })]),
      ]),
      opt('Music', 'Creativity and discipline', [
        out('Scales are boring, but the first song you play all the way through feels like magic.', [flag('hobby_music'), stat('smarts', 3), stat('happiness', 4)]),
      ]),
      opt('Art', 'Looks and imagination', [
        out('Your sketchbook fills up fast. People start asking to see it.', [flag('hobby_art'), stat('looks', 2), stat('happiness', 5)]),
      ]),
      opt('Reading', 'Smarts', [
        out('You vanish into stories and come back knowing more about everything.', [flag('hobby_reading'), stat('smarts', 6)]),
      ]),
      opt('Video games', 'Fun, and maybe more', [
        out('You get really good, and you learn to think in systems.', [flag('hobby_gaming'), stat('smarts', 3), stat('happiness', 4), stat('health', -2)]),
      ]),
    ],
  },
  {
    id: 'school_bully', pack: P, category: 'school', title: 'The bully', minAge: 8, maxAge: 14, weight: 4, cooldown: 5,
    text: 'An older kid has been picking on you and a few others at school. Today it gets worse.',
    choices: [
      opt('Stand up to them', 'Risky, but it could change things', [
        out('You hold your ground. They back off, and kids notice.', [stat('reputation', 6), stat('happiness', 3), mem('Stood up to a bully and it earned respect.', ['courage'])], 1, { k: 'health', amt: 1 }),
        out('It goes badly. You come out of it bruised and shaken.', [stat('health', -6), stat('happiness', -5)], 1),
      ]),
      opt('Tell a teacher', 'The safe route', [
        out('The school steps in. It is not perfect, but it helps.', [stat('happiness', 2), stat('reputation', -1)]),
      ]),
      opt('Befriend the other targets', 'Strength in numbers', [
        out('You and a few others stick together. Someone becomes a real friend.', [addRel('friend', { closeness: 60 }), stat('happiness', 4), stat('reputation', 3), mem('Banded together with other kids against a bully.', ['kindness'])]),
      ]),
      opt('Ignore it', 'Hope it passes', [
        out('It drags on for months. It wears you down.', [stat('happiness', -6)], 2),
        out('They lose interest eventually.', [stat('happiness', -1)], 1),
      ]),
    ],
  },
  {
    id: 'school_project', pack: P, category: 'school', title: 'Big group project', minAge: 9, maxAge: 17, weight: 4, cooldown: 3,
    text: 'You are assigned a major group project, and your group is... not great.',
    choices: [
      opt('Carry the team', 'More work, more credit', [
        out('You pull it off. The teacher notices.', [stat('smarts', 3), stat('reputation', 3), stat('happiness', -2)], 3, { k: 'smarts', amt: 1.5 }),
        out('You burn out doing everyone else\'s part.', [stat('happiness', -4), stat('smarts', 1)], 1),
      ]),
      opt('Split the work fairly', 'Teamwork', [
        out('Everyone pitches in and it turns out surprisingly good.', [stat('smarts', 2), stat('happiness', 3), addRel('friend', { closeness: 45 })]),
      ]),
      opt('Coast and hope for the best', 'Easy now, risk later', [
        out('You skate by. Barely.', [stat('smarts', -1), stat('happiness', 1)]),
        out('Your group is not impressed with you.', [stat('reputation', -4)]),
      ]),
    ],
  },
  {
    id: 'get_a_pet', pack: P, category: 'family', title: 'Can we get a dog?', minAge: 6, maxAge: 12, weight: 3, once: true,
    text: 'You have been asking for a pet for months. Today, your parents say they will think about it.',
    choices: [
      opt('Make a presentation', 'Persuade them with facts', [
        out('They are impressed enough to say yes. You get a puppy!', [flag('has_pet'), stat('happiness', 8), mem('Got my first dog after campaigning for months.', ['family'])], 2, { k: 'smarts', amt: 2 }),
        out('They say "maybe when you are older." You pout for days.', [stat('happiness', -2)], 1),
      ]),
      opt('Promise to do all the chores', 'A bold deal', [
        out('The dog arrives. The chores... less so.', [flag('has_pet'), stat('happiness', 7), bond(-3, 'parent')]),
      ]),
      opt('Drop it', undefined, [out('You let it go. Maybe someday.', [])]),
    ],
  },
  {
    id: 'sibling_rivalry', pack: P, category: 'family', title: 'Sibling spat', minAge: 6, maxAge: 18, weight: 4, cooldown: 3,
    target: { kind: 'sibling' },
    text: 'You and {target} have a huge fight over something small and silly.',
    choices: [
      opt('Apologize first', 'Be the bigger person', [
        out('{target} softens, and you both laugh about it later.', [bond(10), stat('happiness', 2)]),
      ]),
      opt('Hold your ground', 'You were right!', [
        out('Neither of you talks for a week. It stings.', [bond(-8), stat('happiness', -3)]),
      ]),
      opt('Challenge them to a game to settle it', 'Classic', [
        out('You play until dinner. You make up in the process.', [bond(7), stat('happiness', 3)], 3),
        out('You lose and stay annoyed about it.', [bond(-2)], 1),
      ]),
    ],
  },
  {
    id: 'cheat_on_test', pack: P, category: 'school', title: 'The test you did not study for', minAge: 10, maxAge: 17, weight: 3, cooldown: 4,
    text: 'You forgot about a big test. The kid next to you has a clear view of their answers.',
    choices: [
      opt('Copy a few answers', 'Risky', [
        out('You get away with it. Barely.', [stat('smarts', -1), stat('happiness', 1)], 2),
        out('You get caught. It goes on your record.', [stat('reputation', -8), stat('happiness', -6), mem('Got caught cheating on a test. Never again.', ['shame'], 2)], 1),
      ]),
      opt('Do your honest best', 'Trust yourself', [
        out('You scrape by with what you remember.', [stat('smarts', 1)], 2, { k: 'smarts', amt: 1.5 }),
        out('You bomb it, but you are okay with that.', [stat('happiness', -1), stat('reputation', 1)], 1),
      ]),
      opt('Tell the teacher you were not ready', 'Honesty', [
        out('They let you retake it next week. You study this time.', [stat('smarts', 3), stat('reputation', 2)]),
      ]),
    ],
  },
  {
    id: 'new_friend', pack: P, category: 'friends', title: 'A new face', minAge: 6, maxAge: 45, weight: 3, cooldown: 3,
    text: 'Someone new is looking for a friend: they are funny, a little awkward, and they want to hang out.',
    choices: [
      opt('Say yes', 'Make a new friend', [
        out('You click right away. A new friend!', [addRel('friend', { closeness: 55 }), stat('happiness', 4)]),
      ]),
      opt('Be polite but keep your distance', undefined, [out('They drift away, no hard feelings.', [])]),
    ],
  },

  // ───────────── teens ─────────────
  {
    id: 'friend_in_need', pack: P, category: 'friends', title: 'A friend in need', minAge: 12, maxAge: 40, weight: 4, cooldown: 3,
    target: { kind: 'friend', minCloseness: 25, notTag: 'checkedIn' },
    text: 'Your friend {target} is going through a rough time. They have not been responding to your messages.',
    choices: [
      opt('Check in on them', 'Show up', [
        out('They break down and thank you for coming. It means everything.', [bond(14), rtag('checkedIn'), stat('happiness', 2), stat('reputation', 2), mem('Showed up for {target} when they were struggling.', ['kindness'], 2)]),
      ]),
      opt('Give them space', 'Respect their privacy', [
        out('They come around eventually, but things feel a little distant.', [bond(-3)], 2),
        out('They appreciate it. You can tell it helped.', [bond(3)], 1),
      ]),
    ],
  },
  {
    id: 'friend_remembers', pack: P, category: 'friends', title: 'They remember', minAge: 14, maxAge: 85, weight: 5, once: false, cooldown: 1,
    target: { kind: 'friend', tag: 'checkedIn', notTag: 'repaid' },
    text: '{target} has not forgotten how you showed up when it counted. They drop everything to help you with something big this year.',
    effects: [bond(8), rtag('repaid'), stat('happiness', 4), mem('{target} paid back an old kindness, and then some.', ['loyalty'])],
  },
  {
    id: 'join_club', pack: P, category: 'school', title: 'After school', minAge: 13, maxAge: 17, weight: 4, once: true,
    text: 'Your school is full of clubs and teams. You have time for one this year.',
    choices: [
      opt('Sports team', 'Health, reputation', [
        out('You make the team. Practices are brutal, but the bonds are real.', [stat('health', 4), stat('reputation', 4), addRel('friend', { closeness: 60 })]),
      ]),
      opt('Drama club', 'Looks and confidence', [
        out('You find your voice on stage. It is terrifying and wonderful.', [stat('looks', 2), stat('happiness', 5), stat('reputation', 2), addRel('friend', { closeness: 55 })]),
      ]),
      opt('Coding / robotics club', 'Smarts', [
        out('Late nights building things with people who actually get you.', [stat('smarts', 6), flag('tech_skills'), addRel('friend', { closeness: 55 })]),
      ]),
      opt('None, I need downtime', undefined, [out('You protect your afternoons. Sometimes that is the right call.', [stat('happiness', 3)])]),
    ],
  },
  {
    id: 'first_crush', pack: P, category: 'love', title: 'A crush', minAge: 13, maxAge: 17, weight: 3, once: true,
    conditions: [noRel('partner')],
    text: 'There is someone you cannot stop thinking about. Every time they walk by, your brain short-circuits.',
    choices: [
      opt('Ask them out', 'Brave', [
        out('They say yes! Your first real relationship begins.', [addRel('partner', { closeness: 55 }), stat('happiness', 8), mem('My first love.', ['love'], 2)], 1, { k: 'looks', amt: 1 }),
        out('They gently say no. It stings, but you survive.', [stat('happiness', -4), stat('reputation', 1)], 1),
      ]),
      opt('Write them a note', 'Playful', [
        out('They smile every time they see you after that. You become close friends.', [addRel('friend', { closeness: 60 }), stat('happiness', 4)]),
      ]),
      opt('Admire from afar', 'Safe', [out('The feeling fades with time.', [stat('happiness', -1)])]),
    ],
  },
  {
    id: 'strict_parent', pack: P, category: 'family', title: 'Rules and rebellion', minAge: 13, maxAge: 17, weight: 3, cooldown: 4,
    conditions: [hasRel('parent')],
    text: 'Your parents set a strict curfew, and you really, really want to stay out later with your friends.',
    choices: [
      opt('Follow the rules', 'Peace at home', [
        out('It is annoying, but your parents notice the maturity.', [bond(5, 'parent'), stat('reputation', 1)]),
      ]),
      opt('Sneak out', 'Freedom has a price', [
        out('You have a blast and nobody finds out.', [stat('happiness', 6)], 2, { k: 'smarts', amt: 1 }),
        out('You get caught. Grounded for a month.', [bond(-10, 'parent'), stat('happiness', -5)], 1),
      ]),
      opt('Negotiate a compromise', 'Use your words', [
        out('A later curfew on weekends. Win-win.', [bond(4, 'parent'), stat('smarts', 1), stat('happiness', 3)], 2, { k: 'smarts', amt: 1.5 }),
        out('They do not budge.', [stat('happiness', -1)], 1),
      ]),
    ],
  },
  {
    id: 'party_invite', pack: P, category: 'friends', title: 'The party', minAge: 15, maxAge: 20, weight: 3, cooldown: 3,
    text: 'There is a big party this weekend. Everyone is going, including people you would like to know better.',
    choices: [
      opt('Go and have fun', 'Social', [
        out('A great night. You meet some new people.', [stat('happiness', 5), stat('reputation', 2), addRel('friend', { closeness: 45 })], 3),
        out('Things get out of hand and you wake up with regrets.', [stat('health', -3), stat('reputation', -3), stat('happiness', -2)], 1),
      ]),
      opt('Stay home and study', 'Disciplined', [out('Lonely, but productive.', [stat('smarts', 3), stat('happiness', -1)])]),
      opt('Host a smaller get-together', 'Your terms', [out('A cozy night with close friends. Perfect.', [stat('happiness', 5), bond(5, 'friend')])]),
    ],
  },
  {
    id: 'junior_year', pack: P, category: 'life', title: 'Junior year', minAge: 16, maxAge: 16, weight: 1, milestone: true,
    text: "You're starting your junior year. You've been thinking about what you want to do with your life.",
    choices: [
      opt('Focus on school and get better grades', 'Smarts', [
        out('A year of discipline. Your grades climb and teachers take note.', [stat('smarts', 8), stat('happiness', -2), stat('reputation', 2)]),
      ]),
      opt('Join a club and meet new people', 'Connections', [
        out('You find your people. Friendships form fast.', [addRel('friend', { closeness: 60 }), addRel('friend', { closeness: 50 }), stat('happiness', 5), stat('reputation', 3)]),
      ]),
      opt('Work a part-time job', 'Money and independence', [
        out('You start earning. Long hours, but the paycheck feels great.', [job('Part-time Server', 9000), stat('happiness', 2), stat('smarts', -1)]),
      ]),
      opt('Spend time on your hobbies', 'Happiness', [
        out('You dive into the things you love and feel more like yourself.', [stat('happiness', 8), stat('looks', 1)]),
      ]),
    ],
  },
  {
    id: 'part_time_job', pack: P, category: 'work', title: 'Your first job', minAge: 15, maxAge: 17, weight: 4, once: true,
    conditions: [unemployed()],
    text: 'A local business is hiring teenagers. It is not glamorous, but it pays.',
    choices: [
      opt('Take it', 'Earn your own money', [
        out('Your first paycheck feels unreal.', [job('Part-time Cashier', 8500), stat('happiness', 3), flag('first_job'), mem('Earned my first paycheck.', ['work'])]),
      ]),
      opt('Pass', 'Focus on being a kid', [out('You keep your free time.', [stat('happiness', 2)])]),
    ],
  },
  {
    id: 'graduation', pack: P, category: 'school', title: 'Graduation day', minAge: 18, maxAge: 18, weight: 1, milestone: true,
    text: 'You walk across the stage and get your high school diploma. Everyone cheers.',
    effects: [edu('highschool'), stat('happiness', 6), mem('Graduated high school.', ['school'], 2), quit()],
  },
  {
    id: 'college_decision', pack: P, category: 'life', title: 'What next?', minAge: 18, maxAge: 18, weight: 1, milestone: true,
    text: 'Graduation is behind you. The real question lands: what comes next?',
    choices: [
      opt('Go to college', 'About $9k a year. Debt is possible', [
        out('You pack your life into boxes and head off to campus.', [flag('inCollege'), flag('moved_out'), stat('happiness', 4), mem('Left home for college.', ['school'], 2)]),
      ]),
      opt('Learn a trade', 'Get certified and start working', [
        out('You apprentice with a seasoned pro. The work is hands-on and steady.', [edu('trade'), job('Apprentice Electrician', 32000), flag('moved_out'), stat('smarts', 2), money(-3000)]),
      ]),
      opt('Start working right away', 'Earn now', [
        out('You land a job and start building your own life.', [job('Retail Associate', 26000), flag('moved_out'), stat('happiness', 2)]),
        out('Work is steady, if not thrilling. You start saving.', [job('Warehouse Associate', 29000), flag('moved_out')]),
      ]),
      opt('Take a gap year', 'Travel, find yourself', [
        out('You travel on a shoestring. The world is bigger than you thought.', [stat('happiness', 10), stat('smarts', 2), money(-3000), mem('A gap year that changed how I see the world.', ['travel'], 2)]),
      ]),
    ],
  },
  {
    id: 'campus_life', pack: P, category: 'school', title: 'Campus life', minAge: 18, maxAge: 21, weight: 6, cooldown: 2,
    conditions: [hasFlag('inCollege')],
    text: 'College is a juggling act: classes, friends, and the fear of missing out.',
    choices: [
      opt('Hit the books', 'Smarts', [out('Your GPA climbs and professors learn your name.', [stat('smarts', 5), stat('happiness', -2)])]),
      opt('Throw yourself into campus social life', 'Friends and fun', [
        out('You make lifelong friends and a few memorable mistakes.', [addRel('friend', { closeness: 60 }), stat('happiness', 6), stat('smarts', -1)]),
      ]),
      opt('Land an internship', 'Experience', [
        out('Your internship teaches more than any class.', [stat('smarts', 3), stat('reputation', 3), flag('internship')], 3, { k: 'smarts', amt: 1 }),
        out('Mostly coffee runs, but you meet some people.', [stat('reputation', 1)], 1),
      ]),
    ],
  },
  {
    id: 'college_graduation', pack: P, category: 'school', title: 'Degree in hand', minAge: 22, maxAge: 22, weight: 1, milestone: true,
    conditions: [hasFlag('inCollege')],
    text: "You graduate with a bachelor's degree. It was hard. You did it.",
    effects: [edu('college'), flag('inCollege', false), stat('happiness', 8), stat('smarts', 2), mem("Earned my bachelor's degree.", ['school'], 2)],
  },

  // ───────────── work & money ─────────────
  {
    id: 'dream_interview', pack: P, category: 'work', title: 'The interview', minAge: 21, maxAge: 29, weight: 5, once: true,
    conditions: [unemployed(), noFlag('inCollege')],
    text: "You got an interview at a tech company you've always admired. It's a big step, but it means moving to a new city.",
    choices: [
      opt('Go for it', 'Big risk, big reward', [
        out('You nail it. They offer you a role, and a new city to call home.', [job('Junior Developer', 62000), flag('moved_out'), stat('happiness', 8), stat('reputation', 3), mem('Took the leap and moved for my dream job.', ['career'], 3)], 1, { k: 'smarts', amt: 1.5 }),
        out('They pass, but say you were close. You keep the nerve you found.', [stat('happiness', -3), stat('smarts', 1), mem('Almost got my dream job. The nerve stayed.', ['career'])], 1),
      ]),
      opt('Play it safe', 'Stay where you are', [
        out('You take a steady office job near home. Stability has its own comforts.', [job('Office Coordinator', 38000), stat('happiness', 2)]),
      ]),
    ],
  },
  {
    id: 'job_search', pack: P, category: 'work', title: 'Job hunt', minAge: 19, maxAge: 62, weight: 6, cooldown: 1,
    conditions: [unemployed(), noFlag('inCollege')],
    text: 'Bills do not pay themselves. It is time to find work.',
    choices: [
      opt('Apply everywhere', 'Take what comes', [
        out('An office job comes through. It pays the bills.', [job('Office Assistant', 36000), stat('happiness', 2)], 3, { k: 'smarts', amt: 1 }),
        out('A sales role opens up. High pressure, decent pay.', [job('Sales Associate', 34000)], 2),
        out('You land something in customer support.', [job('Support Specialist', 33000)], 2),
        out('Weeks of rejection. It wears on you.', [stat('happiness', -4)], 1),
      ]),
      opt('Hold out for something great', 'Gamble with savings', [
        out('Patience pays off with a strong offer.', [job('Project Coordinator', 52000), stat('happiness', 5), stat('reputation', 2)], 1, { k: 'smarts', amt: 1.5 }),
        out('Months pass without luck. Savings dwindle.', [money(-6000), stat('happiness', -5)], 2),
      ]),
      opt('Pick up gig work', 'Flexible money', [
        out('Driving and deliveries keep the lights on.', [money(9000), stat('health', -1)], 3),
        out('You find a rhythm and even enjoy the freedom.', [job('Freelancer', 30000), stat('happiness', 2)], 1),
      ]),
    ],
  },
  {
    id: 'promotion_chance', pack: P, category: 'work', title: 'Opportunity at work', minAge: 23, maxAge: 62, weight: 4, cooldown: 3,
    conditions: [employed()],
    text: 'A senior position opens up at work. You have your eye on it.',
    choices: [
      opt('Ask for the promotion', 'Be direct', [
        out('Your boss agrees. A promotion and a nice raise.', [raise(15), stat('reputation', 4), stat('happiness', 5)], 2, { k: 'reputation', amt: 1.5 }),
        out('Not this time. They say next year.', [stat('happiness', -3)], 2),
      ]),
      opt('Work harder and wait', 'Let results speak', [
        out('Your effort gets noticed. A modest raise follows.', [raise(6), stat('reputation', 2), stat('health', -2)], 3),
        out('Nobody notices. You feel invisible.', [stat('happiness', -4)], 1),
      ]),
      opt('Network with leadership', 'Build relationships', [
        out('A senior leader becomes your mentor.', [addRel('mentor', { closeness: 60 }), stat('reputation', 3)], 2, { k: 'looks', amt: 0.5 }),
        out('Lots of coffee, no results... yet.', [stat('reputation', 1)], 1),
      ]),
    ],
  },
  {
    id: 'office_conflict', pack: P, category: 'work', title: 'Trouble at the office', minAge: 22, maxAge: 62, weight: 3, cooldown: 3,
    conditions: [employed()],
    text: 'A coworker keeps taking credit for your work, and it is starting to affect your standing.',
    choices: [
      opt('Confront them privately', 'Direct but fair', [
        out('They apologize and it never happens again.', [stat('reputation', 2), stat('happiness', 3)], 2),
        out('They get defensive. Things get awkward.', [stat('happiness', -3), addRel('rival', { closeness: 25 })], 1),
      ]),
      opt('Document everything and tell your manager', 'By the book', [
        out('Your manager backs you up.', [stat('reputation', 4), stat('happiness', 2)]),
      ]),
      opt('Let it slide', 'Avoid drama', [out('It keeps happening. You swallow your frustration.', [stat('happiness', -4), stat('reputation', -2)])]),
    ],
  },
  {
    id: 'laid_off', pack: P, category: 'work', title: 'Restructuring', minAge: 25, maxAge: 62, weight: 1.5, cooldown: 8,
    conditions: [employed(), odds(0.5)],
    text: 'Your company announces layoffs. Your name is on the list.',
    choices: [
      opt('Negotiate a better severance', 'Push back', [
        out('You get a few extra months of pay.', [quit(), money(9000), stat('happiness', -4)], 2, { k: 'smarts', amt: 1 }),
        out('They hold firm. You walk out with the standard package.', [quit(), money(3000), stat('happiness', -6)], 1),
      ]),
      opt('Take it and move on', 'No drama', [out('A rough day, a quiet exit.', [quit(), money(4000), stat('happiness', -5)])]),
    ],
  },
  {
    id: 'unexpected_bill', pack: P, category: 'money', title: 'Surprise expense', minAge: 20, maxAge: 80, weight: 3, cooldown: 3,
    text: 'Your car breaks down, or the roof leaks, or the dentist finds something. Something expensive happens.',
    choices: [
      opt('Pay for it', 'Ouch', [out('It hurts the wallet, but it is handled.', [money(-2800)])]),
      opt('Put it on credit', 'Pay later', [out('It is handled now and will cost more later.', [money(-4200), stat('happiness', -1)])]),
      opt('Try to fix it yourself', 'Cheap and risky', [
        out('Tutorials and stubbornness actually work. You save a bundle.', [money(-600), stat('smarts', 2), stat('happiness', 3)], 1, { k: 'smarts', amt: 1.5 }),
        out('You make it worse. The pro charges extra.', [money(-4500), stat('happiness', -4)], 1),
      ]),
    ],
  },
  {
    id: 'investment_tip', pack: P, category: 'money', title: 'A hot tip', minAge: 24, maxAge: 70, weight: 3, cooldown: 4,
    conditions: [cash('>=', 5000)],
    text: 'A friend swears by an investment opportunity. "It cannot lose," they say.',
    choices: [
      opt('Invest a chunk', 'Big gamble', [
        out('It pays off. You feel like a genius.', [money(9000), stat('happiness', 4)], 1, { k: 'smarts', amt: 0.8 }),
        out('It tanks. Lesson learned.', [money(-6000), stat('happiness', -4)], 1),
      ]),
      opt('Put a little in a boring index fund', 'Slow and steady', [
        out('It grows quietly. Boring is beautiful.', [money(1800), stat('smarts', 1)]),
      ]),
      opt('Pass', undefined, [out('You keep your money where it is.', [])]),
    ],
  },
  {
    id: 'buy_home', pack: P, category: 'money', title: 'A place of your own', minAge: 25, maxAge: 60, weight: 3, once: true,
    conditions: [cash('>=', 45000), noFlag('owns_home')],
    text: 'You have saved enough for a down payment. A cozy place just hit the market.',
    choices: [
      opt('Buy it', 'About $40k down', [
        out('You get the keys. It is yours.', [money(-40000), flag('owns_home'), stat('happiness', 8), mem('Bought my first home.', ['home'], 2)]),
      ]),
      opt('Keep renting', 'Stay flexible', [out('You keep your options open.', [stat('happiness', 1)])]),
    ],
  },
  {
    id: 'windfall', pack: P, category: 'money', title: 'Lucky break', minAge: 18, maxAge: 85, weight: 1.5, cooldown: 4,
    text: 'An overlooked tax refund, a forgotten bank account, or a generous relative: a bit of money lands in your lap.',
    effects: [money(2200), stat('happiness', 3)],
  },
  {
    id: 'patron_gathering', pack: P, category: 'legacy', title: 'An invitation', minAge: 24, maxAge: 55, weight: 3, once: true,
    conditions: [anyOf(employed(), statIs('smarts', '>=', 65), statIs('reputation', '>=', 60))],
    text: 'You are invited to a private gathering with influential people. A wealthy patron shows interest in your work and offers to fund your next project, but asks for a personal favor in return.',
    choices: [
      opt('Accept the offer', 'Gain wealth and influence', [
        out('Funding arrives and doors open. A favor is now owed.', [money(15000), stat('reputation', 6), flag('patron_favor'), mem('Accepted a patron\'s funding. A favor is owed.', ['patron'], 2)]),
      ]),
      opt('Politely decline', 'Maintain your independence', [
        out('The patron respects your integrity. You keep your freedom.', [stat('reputation', 4), stat('happiness', 3), mem('Turned down a patron to keep my independence.', ['integrity'], 2)]),
      ]),
      opt('Negotiate different terms', 'Try to find a compromise', [
        out('A smaller deal with no strings attached.', [money(6000), stat('reputation', 4), mem('Negotiated a fair deal with a patron.', ['patron'])], 2, { k: 'smarts', amt: 1.5 }),
        out('The patron is not pleased. The offer evaporates.', [stat('reputation', -3)], 1),
      ]),
      opt('Ask for time to decide', 'Learn more before committing', [
        out('You do your homework and make a calm, informed decision.', [stat('smarts', 2), stat('happiness', 1)]),
      ]),
    ],
  },
  {
    id: 'patron_calls_favor', pack: P, category: 'legacy', title: 'The favor', minAge: 25, maxAge: 70, weight: 8, once: true,
    conditions: [hasFlag('patron_favor')],
    text: 'Your patron calls in the favor you owe. It is awkward, and it asks something real of you.',
    choices: [
      opt('Honor it', 'Keep your word', [
        out('It is uncomfortable, but you keep your word. The patron remembers.', [stat('reputation', 3), money(8000), flag('patron_favor', false)]),
      ]),
      opt('Refuse', 'Break the deal', [
        out('The patron is furious. Word spreads.', [stat('reputation', -8), flag('patron_favor', false), mem('Refused to honor a patron\'s favor.', ['shame'], 2)]),
      ]),
      opt('Find another way to repay them', 'Creative', [
        out('You repay them in a way that surprises you both.', [stat('smarts', 2), stat('reputation', 2), flag('patron_favor', false)], 2, { k: 'smarts', amt: 1.5 }),
        out('It falls flat. Things stay tense.', [stat('reputation', -2), flag('patron_favor', false)], 1),
      ]),
    ],
  },
  {
    id: 'kindness_returns', pack: P, category: 'life', title: 'A kindness returns', minAge: 20, maxAge: 85, weight: 4, once: true,
    conditions: [remembers('kindness')],
    text: 'Someone you helped long ago remembers you, and goes out of their way to help you in return.',
    effects: [stat('reputation', 5), stat('happiness', 5), money(3000), mem('An old kindness came back around.', ['kindness'])],
  },

  // ───────────── love & family ─────────────
  {
    id: 'meet_someone', pack: P, category: 'love', title: 'Someone new', minAge: 18, maxAge: 50, weight: 4, cooldown: 2,
    conditions: [noRel('partner'), noFlag('married')],
    text: 'You keep running into someone interesting. There is definitely a spark.',
    choices: [
      opt('Ask them out', 'Take the chance', [
        out('They say yes. The first date is lovely.', [addRel('partner', { closeness: 55 }), stat('happiness', 7)], 3, { k: 'looks', amt: 1 }),
        out('They are flattered but not interested.', [stat('happiness', -3)], 1),
      ]),
      opt('Try a dating app', 'Casting a wide net', [
        out('A few awkward dates, then one that clicks.', [addRel('partner', { closeness: 50 }), stat('happiness', 4)], 2),
        out('Endless swiping and no sparks.', [stat('happiness', -2)], 2),
      ]),
      opt('Focus on yourself for now', undefined, [out('You enjoy your independence.', [stat('happiness', 2)])]),
    ],
  },
  {
    id: 'relationship_strain', pack: P, category: 'love', title: 'Rough patch', minAge: 19, maxAge: 80, weight: 4, cooldown: 3,
    target: { kind: 'partner' },
    text: 'You and {target} have been arguing more lately. The little things feel bigger.',
    choices: [
      opt('Talk it out honestly', 'Vulnerable', [
        out('A long, honest talk clears the air. You feel closer.', [bond(12), stat('happiness', 3)], 3),
        out('The conversation goes in circles.', [bond(-4)], 1),
      ]),
      opt('Plan a getaway together', 'Reconnect', [
        out('Time away reminds you why you chose each other.', [bond(14), money(-1500), stat('happiness', 6)]),
      ]),
      opt('Give it time', 'Hope it settles', [
        out('The tension fades on its own.', [bond(2)], 1),
        out('The distance grows.', [bond(-12), stat('happiness', -4)], 2),
      ]),
      opt('End the relationship', 'Walk away', [
        out('A hard goodbye. You both needed this.', [endRel(), stat('happiness', -6), mem('Ended a relationship that was not working.', ['love'])]),
      ]),
    ],
  },
  {
    id: 'propose', pack: P, category: 'love', title: 'The question', minAge: 21, maxAge: 55, weight: 5, once: true,
    target: { kind: 'partner', minCloseness: 60 }, conditions: [noFlag('married')],
    text: 'You and {target} have built something real. You think about forever.',
    choices: [
      opt('Propose', 'Take the plunge', [
        out('{target} says yes! You celebrate with everyone you love.', [flag('married'), bond(10), stat('happiness', 12), mem('{target} said yes. We got married.', ['love'], 3)], 4),
        out('{target} needs more time. It hurts, but you talk it through.', [bond(-6), stat('happiness', -4)], 1),
      ]),
      opt('Wait a bit longer', undefined, [out('You both enjoy the moment.', [bond(3)])]),
    ],
  },
  {
    id: 'first_baby', pack: P, category: 'family', title: 'Starting a family', minAge: 22, maxAge: 42, weight: 5, once: true,
    conditions: [hasFlag('married'), noRel('child'), noFlag('childfree')],
    text: 'You and {partner} have been talking about children.',
    choices: [
      opt('Try for a baby', 'Life changes forever', [
        out('You welcome a baby, {target}. Sleepless nights, endless love.', [addRel('child', { bind: true, closeness: 75, age: 0 }), stat('happiness', 10), money(-3000), mem('Welcomed my first child.', ['family'], 3)], 3),
        out('It does not happen this year. You keep trying.', [stat('happiness', -1)], 1),
      ]),
      opt('Not yet', 'Wait', [out('You decide to wait a little longer.', [])]),
      opt('Not for us', 'Childfree', [out('You make peace with a life without children.', [flag('childfree'), stat('happiness', 1)])]),
    ],
  },
  {
    id: 'second_baby', pack: P, category: 'family', title: 'Another one?', minAge: 24, maxAge: 43, weight: 3, once: true,
    conditions: [hasFlag('married'), hasRel('child'), noFlag('childfree')],
    text: 'Your family is thriving. You and {partner} wonder if there is room for one more.',
    choices: [
      opt('Welcome another baby', 'More love, more chaos', [
        out('Another child joins the family: {target}.', [addRel('child', { bind: true, closeness: 75, age: 0 }), stat('happiness', 7), money(-2500)], 3),
        out('It does not work out this time.', [stat('happiness', -1)], 1),
      ]),
      opt('We are happy as we are', undefined, [out('Your family is complete.', [stat('happiness', 2)])]),
    ],
  },
  {
    id: 'parenting_moment', pack: P, category: 'family', title: 'Parenting moment', minAge: 20, maxAge: 70, weight: 4, cooldown: 2,
    target: { kind: 'child' },
    text: '{target} wants your attention, while work is demanding yours.',
    choices: [
      opt('Spend the day with them', 'Be present', [
        out('Small moments become big memories.', [bond(10), stat('happiness', 5), mem('A perfect day with {target}.', ['family'], 2)]),
      ]),
      opt('Work overtime', 'Provide', [out('You earn a little extra, and miss something precious.', [money(2500), bond(-5), stat('happiness', -2)])]),
      opt('Find a middle ground', 'Balance', [out('You squeeze in an hour. It counts.', [bond(4), stat('happiness', 1)])]),
    ],
  },
  {
    id: 'parent_illness', pack: P, category: 'family', title: 'A parent falls ill', minAge: 30, maxAge: 65, weight: 3, cooldown: 6,
    target: { kind: 'parent' },
    text: '{target} receives a worrying diagnosis. They need support.',
    choices: [
      opt('Be there in person', 'Drop everything', [
        out('You spend as much time as you can by their side. It matters more than you can say.', [bond(15, 'target'), stat('happiness', -3), money(-2000), mem('Stayed by {target} through a hard year.', ['family', 'kindness'], 2)]),
      ]),
      opt('Pay for the best care', 'Use your resources', [out('Good care is arranged, though it is costly.', [bond(6), money(-9000)])], { requires: [cash('>=', 9000)] }),
      opt('Call when you can', 'Stay busy', [out('The distance grows. You will think about this later.', [bond(-6), stat('happiness', -3)])]),
    ],
  },

  // ───────────── health ─────────────
  {
    id: 'gym', pack: P, category: 'health', title: 'Get moving', minAge: 18, maxAge: 60, weight: 2, cooldown: 5,
    text: 'You decide it is time to take your health seriously.',
    choices: [
      opt('Start a routine', 'Takes discipline', [
        out('You stay consistent. You look and feel better.', [stat('health', 8), stat('looks', 3), stat('happiness', 3)], 2, { k: 'smarts', amt: 0.5 }),
        out('It fizzles out after a few weeks.', [stat('health', 1)], 1),
      ]),
      opt('Walk more', 'Easy changes', [out('Daily walks do more than you expected.', [stat('health', 4), stat('happiness', 2)])]),
      opt('Not now', undefined, [out('Maybe next year.', [])]),
    ],
  },
  {
    id: 'health_scare', pack: P, category: 'health', title: 'Something does not feel right', minAge: 35, maxAge: 85, weight: 3, cooldown: 4,
    text: 'You have been feeling off lately. A nagging symptom will not go away.',
    choices: [
      opt('See a doctor', 'Get checked', [
        out('Caught early. A few changes and you are fine.', [stat('health', 4), money(-900), stat('happiness', 2)], 3),
        out('It is serious, but treatable. A hard year.', [stat('health', -10), money(-6000), stat('happiness', -5)], 1),
      ]),
      opt('Ignore it', 'Probably nothing', [
        out('It goes away on its own.', [], 2),
        out('It gets worse, and by the time you act it is much harder to treat.', [stat('health', -18), money(-9000)], 1),
      ]),
    ],
  },

  // ───────────── legacy ─────────────
  {
    id: 'mentor_appears', pack: P, category: 'life', title: 'Someone believes in you', minAge: 18, maxAge: 40, weight: 2, once: true,
    text: 'An experienced person takes an interest in you and offers guidance.',
    choices: [
      opt('Welcome the guidance', 'Learn from them', [out('They become a mentor and a friend for life.', [addRel('mentor', { closeness: 65 }), stat('smarts', 3), stat('reputation', 3)])]),
      opt('Stay independent', undefined, [out('You prefer to figure it out on your own.', [stat('happiness', 1)])]),
    ],
  },
  {
    id: 'midlife_reflection', pack: P, category: 'life', title: 'Taking stock', minAge: 40, maxAge: 55, weight: 4, once: true,
    text: 'You are in the middle of your life. You wonder if you are on the right path.',
    choices: [
      opt('Make a big change', 'New chapter', [
        out('You take a leap and reinvent yourself.', [stat('happiness', 8), stat('reputation', 2), mem('Reinvented my life in midlife.', ['courage'], 2)], 2),
        out('The leap is rougher than expected.', [stat('happiness', -4), money(-5000)], 1),
      ]),
      opt('Double down on what matters', 'Focus', [out('You trim the noise and invest in the people you love.', [stat('happiness', 6), bond(6, 'partner'), bond(6, 'child')])]),
      opt('Carry on as before', undefined, [out('Routine is its own kind of comfort.', [stat('happiness', 1)])]),
    ],
  },
  {
    id: 'legacy_project', pack: P, category: 'legacy', title: 'What will you leave behind?', minAge: 45, maxAge: 72, weight: 5, once: true,
    conditions: [anyOf(statIs('reputation', '>=', 55), cash('>=', 100000))],
    text: 'You have built a good life. Now you wonder what your family will carry forward after you.',
    choices: [
      opt('Found a scholarship', 'Help future generations ($20k)', [
        out('Your scholarship opens doors for strangers and your own descendants.', [flag('legacy_scholarship'), stat('reputation', 10), stat('happiness', 6), mem('Founded a scholarship in our family name.', ['legacy'], 3)]),
      ], { cost: 20000 }),
      opt('Build a family business', 'Something to inherit ($40k)', [
        out('A small business with your name above the door. It becomes the family anchor.', [flag('legacy_business'), stat('reputation', 6), mem('Started a family business for the generations to come.', ['legacy'], 3)]),
      ], { cost: 40000 }),
      opt('Write the family story', 'Pass down wisdom', [
        out('You write it all down: the failures, the wins, and the lessons.', [flag('legacy_memoir'), stat('reputation', 5), stat('happiness', 5), mem('Wrote down our family\'s story for those to come.', ['legacy'], 3)]),
      ]),
      opt('Not now', undefined, [out('Maybe later.', [])]),
    ],
  },
  {
    id: 'legacy_proud', pack: P, category: 'legacy', title: 'The family name', minAge: 14, maxAge: 40, weight: 6, once: true,
    conditions: [generation('>=', 2), statIs('reputation', '>=', 52)],
    text: 'People in town know your family name and it carries warmth. Doors open for you a little easier than most.',
    effects: [stat('reputation', 3), stat('happiness', 3), mem('Walked into a room and was welcomed as one of the family.', ['legacy'])],
  },
  {
    id: 'legacy_shadow', pack: P, category: 'legacy', title: 'A name to live down', minAge: 14, maxAge: 40, weight: 6, once: true,
    conditions: [generation('>=', 2), statIs('reputation', '<=', 47)],
    text: 'People remember your family differently than you would like. You will have to earn your own name.',
    effects: [stat('happiness', -2), mem('Realized I would have to earn my own name.', ['legacy'])],
  },
  {
    id: 'legacy_scholarship_benefit', pack: P, category: 'legacy', title: 'A gift from the past', minAge: 14, maxAge: 40, weight: 10, once: true,
    conditions: [hasFlag('legacy_scholarship')],
    text: 'The family scholarship your ancestor founded comes through. You are proud to carry the name.',
    effects: [money(9000), stat('reputation', 4), stat('happiness', 4), mem('Received the family scholarship that began a generation before me.', ['legacy'], 2)],
  },
  {
    id: 'legacy_business_offer', pack: P, category: 'legacy', title: 'The family business', minAge: 20, maxAge: 40, weight: 8, once: true,
    conditions: [hasFlag('legacy_business'), noFlag('inCollege')],
    text: 'The family business has a place for you. It is not a handout, but it is a beginning.',
    choices: [
      opt('Join the business', 'Build on what came before', [
        out('You learn the ropes and take pride in the name.', [job('Family Business Manager', 54000), stat('reputation', 4), stat('happiness', 4)]),
      ]),
      opt('Carve your own path', undefined, [out('You thank them and set out on your own.', [stat('happiness', 2), stat('reputation', 1)])]),
    ],
  },

  // ───────────── later life ─────────────
  {
    id: 'retirement', pack: P, category: 'work', title: 'Retirement?', minAge: 65, maxAge: 65, weight: 1, milestone: true,
    conditions: [employed()],
    text: 'You are 65. Colleagues ask if you are thinking about retiring.',
    choices: [
      opt('Retire', 'Enjoy life, live on a pension', [out('A big party, a gold watch, and a lot of free time.', [retire(), stat('happiness', 6), stat('health', 2), mem('Retired after a lifetime of work.', ['work'], 2)])]),
      opt('Keep working', 'Not ready yet', [out('You love what you do. For now, you stay.', [stat('reputation', 1)])]),
    ],
  },
  {
    id: 'grandchild', pack: P, category: 'family', title: 'Grandparent', minAge: 55, maxAge: 85, weight: 5, once: true,
    conditions: [hasRel('child')],
    text: '{child} calls with news: you are going to be a grandparent.',
    effects: [stat('happiness', 8), bond(6, 'child'), mem('Became a grandparent.', ['family'], 2)],
  },
  {
    id: 'old_friends', pack: P, category: 'friends', title: 'Reunion', minAge: 50, maxAge: 90, weight: 2, cooldown: 5,
    text: 'You reconnect with old friends and spend a long, wonderful afternoon laughing about the old days.',
    effects: [stat('happiness', 5), bond(6, 'friend')],
  },
  {
    id: 'slow_morning', pack: P, category: 'life', title: 'Slow mornings', minAge: 60, maxAge: 95, weight: 2, cooldown: 3,
    text: 'You take your time with coffee and the paper. Not every day needs a plan.',
    effects: [stat('happiness', 3)],
  },
  {
    id: 'reflect_on_life', pack: P, category: 'legacy', title: 'Looking back', minAge: 70, maxAge: 100, weight: 3, once: true,
    text: 'You look back over your years. You think about the people who shaped you, and the ones who will carry you forward.',
    choices: [
      opt('Spend more time with family', 'What matters most', [out('You gather everyone you can. Laughter fills the house.', [bond(10, 'child'), bond(10, 'partner'), bond(6, 'sibling'), stat('happiness', 8)])]),
      opt('Write letters to loved ones', 'Leave words behind', [out('You write for hours. It is the best thing you have done in years.', [stat('happiness', 6), stat('reputation', 2), mem('Wrote letters to everyone I loved.', ['legacy'], 2)])]),
      opt('Enjoy the quiet', 'Peace', [out('You are content.', [stat('happiness', 4)])]),
    ],
  },
  {
    id: 'sudden_scare', pack: P, category: 'health', title: 'A close call', minAge: 55, maxAge: 100, weight: 0.6, cooldown: 6,
    conditions: [statIs('health', '<=', 35), odds(0.3)],
    text: 'A sudden collapse ends in an ambulance ride and a long night in the hospital.',
    choices: [
      opt('Follow the doctor\'s plan', 'Take it seriously', [
        out('You recover. It is a warning you plan to heed.', [stat('health', 6), money(-4000), stat('happiness', -2)], 3),
        out('The recovery is not enough. Your heart gives out.', [die('a heart condition')], 1),
      ]),
      opt('Brush it off', 'Carry on', [
        out('You are fine, for now.', [stat('health', -3)], 2),
        out('It happens again. This time there is no second chance.', [die('a heart condition')], 2),
      ]),
    ],
  },
];
