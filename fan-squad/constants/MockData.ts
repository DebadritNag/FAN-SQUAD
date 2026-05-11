import { Club, NewsItem, PropQuestion, Player, MatchEvent, User } from '../types/index';

export const MOCK_CLUBS: Club[] = [
  {
    id: 'fcb',
    name: 'FC Bayern München',
    primaryColor: '#DC052D',
    secondaryColor: '#0066B2',
    crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg/200px-FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg.png',
    playerImageUrl: 'https://picsum.photos/seed/fcb-player/300/400',
  },
  {
    id: 'bvb',
    name: 'Borussia Dortmund',
    primaryColor: '#FDE100',
    secondaryColor: '#000000',
    crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/200px-Borussia_Dortmund_logo.svg.png',
    playerImageUrl: 'https://picsum.photos/seed/bvb-player/300/400',
  },
  {
    id: 'svw',
    name: 'Werder Bremen',
    primaryColor: '#1D9053',
    secondaryColor: '#FFFFFF',
    crestUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/SV-Werder-Bremen-Logo.svg/200px-SV-Werder-Bremen-Logo.svg.png',
    playerImageUrl: 'https://picsum.photos/seed/svw-player/300/400',
  },
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Kane Scores Hat-Trick in Dominant Bayern Victory',
    aiTag: '🔥 MATCH REPORT',
    bullets: [
      'Harry Kane netted three goals in the first half',
      'Bayern extend their Bundesliga lead to 8 points',
      'Neuer kept a clean sheet with 4 key saves',
    ],
  },
  {
    id: 'news-2',
    title: 'Dortmund Sign Bundesliga Starlet in Shock Deal',
    aiTag: '🚨 TRANSFER RUMOR',
    bullets: [
      'BVB complete signing for reported €45m fee',
      'Player arrives from rival club on 4-year deal',
      'Squad depth significantly boosted ahead of UCL',
    ],
  },
  {
    id: 'news-3',
    title: 'Werder Bremen Injury Crisis Deepens',
    aiTag: '🚑 INJURY ALERT',
    bullets: [
      'Three first-team players ruled out for 6 weeks',
      'Manager forced to field youth team players',
      'Club in talks to bring in emergency loan signings',
    ],
  },
  {
    id: 'news-4',
    title: 'Bundesliga VAR Controversy Sparks Debate',
    aiTag: '⚖️ CONTROVERSY',
    bullets: [
      'Referee overturns goal after 4-minute VAR check',
      'Both managers furious with officiating decisions',
      'DFL to review VAR protocols after weekend chaos',
    ],
  },
  {
    id: 'news-5',
    title: 'Champions League Draw: German Clubs Face Tough Tests',
    aiTag: '🏆 UCL NEWS',
    bullets: [
      'Bayern drawn against Real Madrid in Round of 16',
      "Dortmund face PSG in a repeat of last year's final",
      'Bundesliga clubs praised for European performances',
    ],
  },
];

export const MOCK_PROP_QUESTIONS: PropQuestion[] = [
  'Exact Final Score?',
  'Who scores first?',
  'Total goals over 2.5?',
  'Any red cards?',
  'First corner kick team?',
  'Clean sheet for home team?',
  'Both teams to score?',
  'First substitution before 60 min?',
  'Hat-trick scored?',
  'Penalty awarded?',
];

export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'Harry Kane', clubCrestUrl: 'https://picsum.photos/seed/fcb-crest/50/50', imageUrl: 'https://picsum.photos/seed/kane/200/300' },
  { id: 'p2', name: 'Jamal Musiala', clubCrestUrl: 'https://picsum.photos/seed/fcb-crest/50/50', imageUrl: 'https://picsum.photos/seed/musiala/200/300' },
  { id: 'p3', name: 'Leroy Sané', clubCrestUrl: 'https://picsum.photos/seed/fcb-crest/50/50', imageUrl: 'https://picsum.photos/seed/sane/200/300' },
  { id: 'p4', name: 'Serge Gnabry', clubCrestUrl: 'https://picsum.photos/seed/fcb-crest/50/50', imageUrl: 'https://picsum.photos/seed/gnabry/200/300' },
  { id: 'p5', name: 'Donyell Malen', clubCrestUrl: 'https://picsum.photos/seed/bvb-crest/50/50', imageUrl: 'https://picsum.photos/seed/malen/200/300' },
  { id: 'p6', name: 'Julian Brandt', clubCrestUrl: 'https://picsum.photos/seed/bvb-crest/50/50', imageUrl: 'https://picsum.photos/seed/brandt/200/300' },
  { id: 'p7', name: 'Niclas Füllkrug', clubCrestUrl: 'https://picsum.photos/seed/bvb-crest/50/50', imageUrl: 'https://picsum.photos/seed/fullkrug/200/300' },
  { id: 'p8', name: 'Marco Reus', clubCrestUrl: 'https://picsum.photos/seed/bvb-crest/50/50', imageUrl: 'https://picsum.photos/seed/reus/200/300' },
  { id: 'p9', name: 'Marvin Ducksch', clubCrestUrl: 'https://picsum.photos/seed/svw-crest/50/50', imageUrl: 'https://picsum.photos/seed/ducksch/200/300' },
  { id: 'p10', name: 'Romano Schmid', clubCrestUrl: 'https://picsum.photos/seed/svw-crest/50/50', imageUrl: 'https://picsum.photos/seed/schmid/200/300' },
  { id: 'p11', name: 'Mitchell Weiser', clubCrestUrl: 'https://picsum.photos/seed/svw-crest/50/50', imageUrl: 'https://picsum.photos/seed/weiser/200/300' },
];

export const MOCK_MATCH_EVENTS: MatchEvent[] = [
  { id: 'e1', minute: 12, type: 'goal', description: "Kane 12'", teamId: 'fcb' },
  { id: 'e2', minute: 23, type: 'card', description: 'Emre Can (Yellow)', teamId: 'bvb' },
  { id: 'e3', minute: 34, type: 'goal', description: "Malen 34'", teamId: 'bvb' },
  { id: 'e4', minute: 45, type: 'substitution', description: 'Gnabry → Sané', teamId: 'fcb' },
  { id: 'e5', minute: 58, type: 'goal', description: "Musiala 58'", teamId: 'fcb' },
  { id: 'e6', minute: 67, type: 'card', description: 'Hummels (Red)', teamId: 'bvb' },
  { id: 'e7', minute: 72, type: 'substitution', description: 'Brandt → Reus', teamId: 'bvb' },
  { id: 'e8', minute: 88, type: 'goal', description: "Kane 88' (Pen)", teamId: 'fcb' },
];

export const MOCK_LOBBY_USERS: User[] = [
  { id: 'u1', username: 'FanSquadUser', avatarUrl: 'https://picsum.photos/seed/user1/100/100' },
  { id: 'u2', username: 'BayernBoss', avatarUrl: 'https://picsum.photos/seed/user2/100/100' },
  { id: 'u3', username: 'BVBFanatic', avatarUrl: 'https://picsum.photos/seed/user3/100/100' },
  { id: 'u4', username: 'WerderWatcher', avatarUrl: 'https://picsum.photos/seed/user4/100/100' },
];

// ── Club logo asset map ───────────────────────────────────────────────────────
// Use this instead of inline require() calls to avoid bundler crashes.
// Keys match the club `id` field in MOCK_CLUBS.
export const CLUB_LOGOS: Record<string, any> = {
  fcb: require('../assets/images/bayern.png'),
  bvb: require('../assets/images/dortmund.png'),
  svw: require('../assets/images/bremen.png'),
};
