// Sports you can actually choose. Add one here and it shows up in "Join a team".
export interface Sport {
  id: string; label: string; icon: string; team: boolean; positions: string[]; minAge: number; maxAge: number;
  cost: number; injury: number; // yearly risk when pushing hard (0-1)
  body: number; // 0..1 how much it builds health vs skill
  blurb: string;
}
export const SPORTS: Sport[] = [
  { id: 'soccer', label: 'Soccer', icon: '⚽', team: true, positions: ['Striker', 'Midfielder', 'Defender', 'Goalkeeper'], minAge: 5, maxAge: 40, cost: 80, injury: 0.12, body: 0.7, blurb: 'The world game' },
  { id: 'basketball', label: 'Basketball', icon: '🏀', team: true, positions: ['Point guard', 'Shooting guard', 'Forward', 'Center'], minAge: 7, maxAge: 40, cost: 60, injury: 0.12, body: 0.6, blurb: 'Speed, hops and teamwork' },
  { id: 'football', label: 'Football', icon: '🏈', team: true, positions: ['Quarterback', 'Running back', 'Receiver', 'Lineman', 'Linebacker'], minAge: 10, maxAge: 36, cost: 250, injury: 0.25, body: 0.5, blurb: 'Big hits, big crowds' },
  { id: 'baseball', label: 'Baseball', icon: '⚾', team: true, positions: ['Pitcher', 'Catcher', 'Infield', 'Outfield'], minAge: 6, maxAge: 40, cost: 120, injury: 0.08, body: 0.4, blurb: 'Patient, precise, dramatic' },
  { id: 'volleyball', label: 'Volleyball', icon: '🏐', team: true, positions: ['Setter', 'Spiker', 'Libero'], minAge: 10, maxAge: 40, cost: 60, injury: 0.07, body: 0.6, blurb: 'Quick reflexes' },
  { id: 'hockey', label: 'Hockey', icon: '🏒', team: true, positions: ['Center', 'Winger', 'Defenseman', 'Goalie'], minAge: 7, maxAge: 38, cost: 400, injury: 0.2, body: 0.6, blurb: 'Fast, physical, fearless' },
  { id: 'swimming', label: 'Swimming', icon: '🏊', team: false, positions: ['Freestyle', 'Butterfly', 'Backstroke', 'Distance'], minAge: 5, maxAge: 45, cost: 100, injury: 0.04, body: 0.9, blurb: 'You against the clock' },
  { id: 'track', label: 'Track & field', icon: '🏃', team: false, positions: ['Sprints', 'Middle distance', 'Hurdles', 'Long jump', 'Throwing'], minAge: 8, maxAge: 40, cost: 40, injury: 0.1, body: 0.8, blurb: 'Faster, higher, further' },
  { id: 'tennis', label: 'Tennis', icon: '🎾', team: false, positions: ['Singles', 'Doubles'], minAge: 6, maxAge: 55, cost: 220, injury: 0.06, body: 0.6, blurb: 'A duel with a racquet' },
  { id: 'wrestling', label: 'Wrestling', icon: '🤼', team: false, positions: ['Lightweight', 'Middleweight', 'Heavyweight'], minAge: 8, maxAge: 40, cost: 60, injury: 0.15, body: 0.7, blurb: 'Grit and leverage' },
  { id: 'boxing', label: 'Boxing', icon: '🥊', team: false, positions: ['Boxer-puncher', 'Out-boxer', 'Brawler'], minAge: 12, maxAge: 40, cost: 150, injury: 0.22, body: 0.7, blurb: 'Sweet science' },
  { id: 'gymnastics', label: 'Gymnastics', icon: '🤸', team: false, positions: ['Floor', 'Beam / bars', 'All-around'], minAge: 4, maxAge: 28, cost: 300, injury: 0.14, body: 0.8, blurb: 'Grace under gravity' },
  { id: 'golf', label: 'Golf', icon: '⛳', team: false, positions: ['Amateur'], minAge: 8, maxAge: 80, cost: 500, injury: 0.02, body: 0.2, blurb: 'Slow, social and surprisingly intense' },
  { id: 'skate', label: 'Skateboarding', icon: '🛹', team: false, positions: ['Street', 'Park', 'Vert'], minAge: 7, maxAge: 40, cost: 120, injury: 0.18, body: 0.5, blurb: 'Land the trick' },
  { id: 'climb', label: 'Climbing', icon: '🧗', team: false, positions: ['Bouldering', 'Sport climbing'], minAge: 8, maxAge: 55, cost: 200, injury: 0.1, body: 0.8, blurb: 'Problem solving with your whole body' },
  { id: 'esports', label: 'Esports', icon: '🎮', team: true, positions: ['Support', 'Carry', 'Strategist', 'Shotcaller'], minAge: 10, maxAge: 34, cost: 100, injury: 0.01, body: 0, blurb: 'Reflexes, strategy, sponsors' },
];
export const SPORT_BY_ID: Record<string, Sport> = Object.fromEntries(SPORTS.map((s) => [s.id, s]));

export const LEVEL_NAMES = ['Rec league', 'School / youth team', 'Varsity / elite club', 'College / semi-pro', 'Minor league', 'Professional', 'Superstar'];
export const levelName = (n: number, sportId?: string) => (sportId === 'esports' ? ['Casual ranked', 'School club', 'Amateur circuit', 'Collegiate', 'Challenger', 'Pro league', 'World champion'][n] : LEVEL_NAMES[n]) ?? LEVEL_NAMES[0];
