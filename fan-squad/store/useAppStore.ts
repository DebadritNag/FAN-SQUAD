import { create } from 'zustand';
import { parseDFLLineup, ParsedLineup } from '../services/dflLineupParser';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Player {
  personId: string;
  shirtNumber: string;
  firstName: string;
  lastName: string;
  shortname: string;
  starting: boolean;
  position?: string;
  teamLeader: boolean;
}

export interface Team {
  teamId: string;
  teamName: string;
  shortName: string;
  role: 'home' | 'guest';
  primaryColor: string;
  secondaryColor: string;
  lineup: string;
  players: Player[];
}

export interface MatchEvent {
  eventId: string;
  eventTime: string;
  type: string;
  xPosition: number;
  yPosition: number;
  team?: string;
  player?: string;
  xG?: number;
  pressure?: number;
  xPass?: number;
  chanceEvaluation?: string;
  goal?: boolean;
  woodwork?: boolean;
  blocked?: boolean;
  fairPlay?: boolean;
  currentResult?: string;
  momentumScore?: number;
}

// ── Timeline event (enriched with relative match minute) ─────────────────────

export interface TimelineEvent extends MatchEvent {
  /** Relative football minute, e.g. "34'" or "90+2'" */
  matchMinute: string;
}

/**
 * Events that are meaningful enough to show on the visual timeline.
 * 'Unknown' and 'Play' are intentionally excluded:
 *   - 'Unknown'  → noise, ignored entirely
 *   - 'Play'     → used only for momentum calculation, never shown
 */
export const IMPORTANT_EVENTS = [
  'KickOff',
  'ShotAtGoal',
  'Foul',
  'Caution',       // yellow card from DFL XML
  'RedCard',
  'Corner',
  'Substitution',
  'Penalty',
  'TacklingGame',  // notable duels
] as const;

type ImportantEventType = typeof IMPORTANT_EVENTS[number];

/**
 * Convert an absolute ISO timestamp to a relative football minute string.
 * Returns null if matchStartTime is not yet set.
 *
 * Rules:
 *   0–90 min  → "34'"
 *   > 90 min  → "90+2'"
 *   > 120 min → capped at "120'" (extra time ceiling)
 */
export function calculateMatchMinute(
  eventTimestamp: string,
  matchStartTime: string | null,
): string | null {
  if (!matchStartTime) return null;

  try {
    const startMs = new Date(matchStartTime).getTime();
    const eventMs = new Date(eventTimestamp).getTime();
    const diffMin = (eventMs - startMs) / 60_000;

    if (diffMin < 0) return '0\'';

    const floored = Math.floor(diffMin);

    if (floored <= 90) {
      return `${floored}'`;
    }

    if (floored <= 120) {
      const stoppage = floored - 90;
      return `90+${stoppage}'`;
    }

    // Cap at full-time + extra time
    return '120\'';
  } catch {
    return null;
  }
}

// ── Matchday Tasks ────────────────────────────────────────────────────────────

export interface MatchdayTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

const INITIAL_TASKS: MatchdayTask[] = [
  {
    id: 't1',
    title: 'Join a Squad Lobby',
    description: 'Connect with your squad before kickoff',
    reward: 100,
    completed: true,
    claimed: false,
    icon: '👥',
  },
  {
    id: 't2',
    title: 'Lock in 10 Match Props',
    description: 'Swipe on 10 prediction cards in Prop Locker',
    reward: 250,
    completed: false,
    claimed: false,
    icon: '🎯',
  },
  {
    id: 't3',
    title: 'Complete the Blind Draft',
    description: 'Build your squad before the match starts',
    reward: 150,
    completed: false,
    claimed: false,
    icon: '📋',
  },
  {
    id: 't4',
    title: 'Send a Banter Emote',
    description: 'React to a live moment with your squad',
    reward: 50,
    completed: false,
    claimed: false,
    icon: '🔥',
  },
];

// ── Store interface ───────────────────────────────────────────────────────────

interface AppState {
  // Match data
  matchId: string | null;
  matchTitle: string | null;
  teams: Team[];
  events: MatchEvent[];
  currentEvent: MatchEvent | null;

  /**
   * Filtered, enriched timeline — only IMPORTANT_EVENTS, newest first.
   * Each entry has a `matchMinute` string computed from matchStartTime.
   */
  timelineEvents: TimelineEvent[];

  /**
   * Timestamp of the very first event received. Used as the clock origin
   * for calculateMatchMinute(). Null until the first event arrives.
   */
  matchStartTime: string | null;

  /** Momentum 0–1 derived from Play event xPositions (home pressure = low, away = high) */
  homeMomentum: number;
  awayMomentum: number;

  /**
   * Persistent match score — only ever updated by a confirmed Goal event.
   * NEVER reset by KickOff, Play, Duel, or any other event type.
   * Source of truth for the scoreboard UI.
   */
  homeScore: number;
  awayScore: number;

  // User state
  user: { username: string } | null;
  isAuthenticated: boolean;
  selectedClub: string | null;
  followedPlayers: string[];
  lobbyPoints: number;
  communityImpactPoints: number;
  momentumScore: number;

  // Matchday tasks — points only awarded via deliberate claimTask()
  matchdayTasks: MatchdayTask[];

  // WebSocket — single shared connection owned by the store
  wsConnected: boolean;
  _ws: WebSocket | null;

  // ── Actions ──────────────────────────────────────────────────────────────
  setMatchData: (data: { matchId: string; matchTitle: string; teams: Team[] }) => void;
  addEvent: (event: MatchEvent) => void;
  setCurrentEvent: (event: MatchEvent) => void;
  setSelectedClub: (clubId: string) => void;
  setFollowedPlayers: (playerIds: string[]) => void;
  addLobbyPoints: (points: number) => void;
  addCommunityImpactPoints: (points: number) => void;
  setMomentumScore: (score: number) => void;
  setWsConnected: (connected: boolean) => void;
  login: () => void;

  /**
   * Claim a completed task. Awards lobbyPoints only on deliberate user action.
   * No-op if task is not found, not completed, or already claimed.
   */
  claimTask: (taskId: string) => void;

  /**
   * Mark a task as completed (called by game logic, not the user).
   * Does NOT award points — user must still tap CLAIM.
   */
  completeTask: (taskId: string) => void;

  /** Whether the user has joined the squad lobby this session */
  hasJoinedLobby: boolean;
  joinLobby: () => void;

  /** Parsed DFL lineup from the local XML asset */
  parsedLineup: ParsedLineup | null;
  loadLineup: () => void;

  /** Open the shared WebSocket. No-op if already open/connecting. */
  connectWebSocket: (onFairPlay?: () => void) => void;
  disconnectWebSocket: () => void;
  reset: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  matchId: null,
  matchTitle: null,
  teams: [],
  events: [],
  currentEvent: null,
  timelineEvents: [],
  matchStartTime: null,
  homeMomentum: 0.5,
  awayMomentum: 0.5,
  homeScore: 0,
  awayScore: 0,
  user: { username: 'Captain' },
  isAuthenticated: true,
  selectedClub: null,
  followedPlayers: [],
  lobbyPoints: 0,
  communityImpactPoints: 0,
  momentumScore: 0,
  matchdayTasks: INITIAL_TASKS,
  wsConnected: false,
  _ws: null,
  hasJoinedLobby: false,
  parsedLineup: null,

  // ── Actions ────────────────────────────────────────────────────────────────

  setMatchData: (data) => set({
    matchId: data.matchId,
    matchTitle: data.matchTitle,
    teams: data.teams,
  }),

  addEvent: (event) => set((state) => ({
    events: [...state.events, event].slice(-50),
  })),

  setCurrentEvent: (event) => set({
    currentEvent: event,
    momentumScore: event.momentumScore || 0,
  }),

  setSelectedClub: (clubId) => set({ selectedClub: clubId }),

  setFollowedPlayers: (playerIds) => set({ followedPlayers: playerIds }),

  addLobbyPoints: (points) => set((state) => ({
    lobbyPoints: state.lobbyPoints + points,
  })),

  addCommunityImpactPoints: (points) => set((state) => ({
    communityImpactPoints: state.communityImpactPoints + points,
  })),

  setMomentumScore: (score) => set({ momentumScore: score }),

  setWsConnected: (connected) => set({ wsConnected: connected }),

  login: () => set({ isAuthenticated: true, user: { username: 'Captain' } }),

  // ── Deliberate task claim — the ONLY place lobbyPoints are awarded ─────────
  claimTask: (taskId) => {
    const { matchdayTasks } = get();
    const task = matchdayTasks.find(t => t.id === taskId);

    // Guard: must exist, be completed, and not yet claimed
    if (!task || !task.completed || task.claimed) return;

    set((state) => ({
      // Mark claimed
      matchdayTasks: state.matchdayTasks.map(t =>
        t.id === taskId ? { ...t, claimed: true } : t
      ),
      // Award points — deliberate user action only
      lobbyPoints: state.lobbyPoints + task.reward,
    }));
  },

  // ── Mark task complete (game logic) — no points yet ───────────────────────
  completeTask: (taskId) => {
    set((state) => ({
      matchdayTasks: state.matchdayTasks.map(t =>
        t.id === taskId ? { ...t, completed: true } : t
      ),
    }));
  },

  // ── Join squad lobby — marks t1 complete, enables lobby UI ────────────────
  joinLobby: () => {
    set((state) => ({
      hasJoinedLobby: true,
      // Mark "Join a Squad Lobby" task as completed so user can claim on Tasks screen
      matchdayTasks: state.matchdayTasks.map(t =>
        t.id === 't1' ? { ...t, completed: true } : t
      ),
    }));
  },

  // ── Load DFL lineup from bundled XML asset ─────────────────────────────────
  loadLineup: () => {
    try {
      // parseDFLLineup() uses the LINEUP_XML constant from assets/lineupData.ts
      // internally — no require() of a binary asset needed.
      const lineup = parseDFLLineup();
      set({ parsedLineup: lineup });
    } catch (err) {
      console.warn('⚠️  loadLineup: failed to parse XML', err);
    }
  },

  // ── Single shared WebSocket ────────────────────────────────────────────────
  connectWebSocket: (onFairPlay) => {
    const { _ws } = get();

    // Already open or mid-handshake — don't open a second connection
    if (_ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const WS_HOST = '192.168.0.104';
    const WS_PORT = 8765;
    const ws = new WebSocket(`ws://${WS_HOST}:${WS_PORT}`);
    set({ _ws: ws });

    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      set({ wsConnected: true });
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'INIT') {
          set({
            matchId: data.matchId,
            matchTitle: data.matchTitle,
            teams: data.teams,
          });

        } else if (data.type === 'EVENT') {
          const ev: MatchEvent = data.data;

          // ── Step 1: Hard ignore noise ──────────────────────────────────
          if (ev.type === 'Unknown') return;

          // ── Step 2: Record match start time from the very first event ──
          const currentStart = get().matchStartTime;
          const newStart = currentStart ?? ev.eventTime;
          if (!currentStart) {
            set({ matchStartTime: newStart });
          }

          // ── Step 3: Always update current event + raw event buffer ─────
          set((s) => ({
            currentEvent: ev,
            momentumScore: ev.momentumScore || 0,
            events: [...s.events, ev].slice(-50),
          }));

          // ── Step 3b: GOAL — update persistent score ────────────────────
          // This is the ONLY place homeScore/awayScore are ever mutated.
          // No other event type (KickOff, Play, Duel, etc.) touches the score.
          if (ev.goal) {
            if (ev.currentResult) {
              // Preferred path: use the authoritative DFL score string (e.g. "2:0")
              // This guarantees absolute sync with the official data feed.
              const parts = ev.currentResult.split(':');
              const h = parseInt(parts[0]?.trim() ?? '', 10);
              const a = parseInt(parts[1]?.trim() ?? '', 10);
              if (!isNaN(h) && !isNaN(a)) {
                set({ homeScore: h, awayScore: a });
              } else {
                // Fallback: increment by team side if string is malformed
                const homeTeamId = get().teams.find(t => t.role === 'home')?.teamId;
                if (ev.team && ev.team === homeTeamId) {
                  set((s) => ({ homeScore: s.homeScore + 1 }));
                } else {
                  set((s) => ({ awayScore: s.awayScore + 1 }));
                }
              }
            } else {
              // No currentResult string — increment by team side
              const homeTeamId = get().teams.find(t => t.role === 'home')?.teamId;
              if (ev.team && ev.team === homeTeamId) {
                set((s) => ({ homeScore: s.homeScore + 1 }));
              } else {
                set((s) => ({ awayScore: s.awayScore + 1 }));
              }
            }
          }

          // ── Step 4: Play events → momentum only, never timeline ────────
          if (ev.type === 'Play') {
            // xPosition: 0 = home end, 100 = away end (DFL coordinate system)
            // Values < 50 mean home team is pressing forward (high home momentum)
            const x = ev.xPosition ?? 50;
            const homePress = Math.max(0, Math.min(1, 1 - x / 100));
            const awayPress = 1 - homePress;
            set({ homeMomentum: homePress, awayMomentum: awayPress });
            return; // Do NOT add to timeline
          }

          // ── Step 5: Important events → enrich and push to timeline ─────
          const isImportant = (IMPORTANT_EVENTS as readonly string[]).includes(ev.type)
            || ev.goal      // ShotAtGoal with goal flag
            || ev.woodwork; // ShotAtGoal with woodwork flag

          if (isImportant) {
            const minute = calculateMatchMinute(ev.eventTime, newStart) ?? '—';
            const enriched: TimelineEvent = { ...ev, matchMinute: minute };

            set((s) => ({
              // Newest first — prepend so FlatList shows latest at top
              timelineEvents: [enriched, ...s.timelineEvents].slice(0, 100),
            }));
          }

          // ── Step 6: FairPlay visual callback (no points) ───────────────
          if (ev.fairPlay) {
            onFairPlay?.();
          }
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onerror = () => {
      set({ wsConnected: false });
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      set({ wsConnected: false, _ws: null });
    };
  },

  disconnectWebSocket: () => {
    const { _ws } = get();
    _ws?.close();
    set({ _ws: null, wsConnected: false });
  },

  reset: () => set({
    matchId: null,
    matchTitle: null,
    teams: [],
    events: [],
    currentEvent: null,
    timelineEvents: [],
    matchStartTime: null,
    homeMomentum: 0.5,
    awayMomentum: 0.5,
    homeScore: 0,
    awayScore: 0,
    lobbyPoints: 0,
    communityImpactPoints: 0,
    momentumScore: 0,
    matchdayTasks: INITIAL_TASKS,
    hasJoinedLobby: false,
    parsedLineup: null,
  }),
}));
