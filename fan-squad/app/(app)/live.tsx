import React, {
  useEffect, useState, useRef, useCallback,
} from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  TextInput, FlatList, ScrollView, Platform,
  KeyboardAvoidingView, Dimensions, ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Reanimated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSequence, runOnJS, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore, MatchEvent, TimelineEvent } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { sendBanterEmoteToApiGateway } from '../../services/awsStubs';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Dynamic design tokens — driven by selected club ───────────────────────────
// Call buildTokens(isBVB) once per render in the main screen and pass `C` down.
// Sub-components that need tokens receive them as props or read from module scope
// via the mutable `C` reference updated before each render tree.
function buildTokens(isBVB: boolean) {
  return {
    // Backgrounds
    bg:            isBVB ? '#000000' : '#131314',
    surface:       isBVB ? '#111111' : '#201f20',
    surfaceLow:    isBVB ? '#0A0A0A' : '#1c1b1c',
    surfaceHigh:   isBVB ? '#1A1A1A' : '#2a2a2b',
    surfaceHighest:isBVB ? '#222222' : '#353436',
    // Club accent
    accent:        isBVB ? '#FDE100' : '#DC052D',
    accentDim:     isBVB ? 'rgba(253,225,0,0.12)'  : 'rgba(220,5,45,0.12)',
    accentBorder:  isBVB ? 'rgba(253,225,0,0.35)'  : 'rgba(220,5,45,0.35)',
    onAccent:      isBVB ? '#000000' : '#FFFFFF',
    // Secondary accent (scoreboard away score, sub events)
    secondary:     isBVB ? '#FFFFFF' : '#0066B2',
    // Live / alert (same as accent for both clubs)
    pink:          isBVB ? '#FDE100' : '#DC052D',
    pinkDim:       isBVB ? 'rgba(253,225,0,0.15)'  : 'rgba(220,5,45,0.15)',
    pinkBorder:    isBVB ? 'rgba(253,225,0,0.40)'  : 'rgba(220,5,45,0.40)',
    // Typography
    onSurface:     '#FFFFFF',
    onVariant:     isBVB ? '#B3B3B3' : '#b9cbc1',
    onMuted:       isBVB ? '#666666' : '#83958c',
    outline:       isBVB ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.07)',
    // Scoreboard gradient
    scoreGrad:     isBVB
      ? ['#1A1A1A', '#111111'] as [string, string]
      : ['#DC052D', '#A5001E'] as [string, string],
    scoreGradBorder: isBVB ? '#FDE100' : 'transparent',
    // Timeline spine
    spineColor:    isBVB ? '#333333' : '#2a2a2b',
    // Event card
    cardBg:        isBVB ? '#111111' : '#201f20',
    // Goal event team colours
    homeGoalColor: isBVB ? '#FDE100' : '#DC052D',
    awayGoalColor: isBVB ? '#FFFFFF' : '#0066B2',
  };
}

// Module-level mutable reference — updated once per render in LiveMatchCenterScreen
// before any sub-component reads it. This avoids prop-drilling through every helper.
let C = buildTokens(false);

type Tab = 'SQUAD' | 'TIMELINE' | 'LINEUP';

// ── Event badge config ────────────────────────────────────────────────────────
interface BadgeConfig {
  icon: string;
  label: string;
  bg: string;
  fg: string;
  dot: string;
}

function getBadgeConfig(ev: TimelineEvent): BadgeConfig {
  if (ev.goal)      return { icon:'⚽', label:'GOAL',      bg: C.accentDim,                   fg: C.accent,    dot: C.accent    };
  if (ev.woodwork)  return { icon:'😱', label:'WOODWORK',  bg: C.accentDim,                   fg: C.onVariant, dot: C.onVariant };
  switch (ev.type) {
    case 'KickOff':     return { icon:'▶️', label:'KICK OFF',  bg:C.surfaceHigh,                  fg:C.onVariant,  dot:C.onMuted };
    case 'ShotAtGoal':  return { icon:'🎯', label:'SHOT',      bg:'rgba(0,102,178,0.10)',          fg:C.secondary,  dot:C.secondary };
    case 'Foul':        return { icon:'⚠️', label:'FOUL',      bg:'rgba(255,180,80,0.12)',         fg:'#B45309',    dot:'#B45309' };
    case 'Caution':     return { icon:'🟨', label:'YELLOW',    bg:'rgba(253,225,0,0.15)',          fg:'#92400E',    dot:'#92400E' };
    case 'RedCard':     return { icon:'🟥', label:'RED CARD',  bg:'rgba(220,5,45,0.12)',           fg:'#DC052D',    dot:'#DC052D' };
    case 'Corner':      return { icon:'🚩', label:'CORNER',    bg:C.surfaceHigh,                  fg:C.onVariant,  dot:C.onMuted };
    case 'Substitution':return { icon:'🔄', label:'SUB',       bg:'rgba(0,102,178,0.08)',          fg:C.secondary,  dot:C.secondary };
    case 'Penalty':     return { icon:'🥅', label:'PENALTY',   bg: C.accentDim,                   fg: C.accent,    dot: C.accent };
    case 'TacklingGame':return { icon:'⚡', label:'DUEL',      bg:C.surfaceHigh,                  fg:C.onVariant,  dot:C.onMuted };
    default:            return { icon:'•',  label:ev.type,     bg:C.surfaceHigh,                  fg:C.onVariant,  dot:C.onMuted };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── MATCH TIMELINE ────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────
type EventSide = 'left' | 'right' | 'center';
type EventType = 'Goal' | 'Shot' | 'Card' | 'Sub' | 'Whistle';

interface DemoEvent {
  id: string;
  tick: number;      // numerical minute used for clock filtering
  minute: string;    // display string e.g. "90+3'"
  team: string;
  type: EventType;
  subType?: string;
  player: string;
  details: string;
  side: EventSide;
}

// ── Full 19-event curated dataset with tick values ────────────────────────────
const DEMO_TIMELINE: DemoEvent[] = [
  { id:'1',  tick:1,  minute:"1'",    team:'Club',    type:'Card',    subType:'Yellow',   player:'S. Sieben',   details:'Foul on S. Acht',                                              side:'right'  },
  { id:'2',  tick:2,  minute:"2'",    team:'FC Team', type:'Shot',    subType:'Blocked',  player:'S. Acht',     details:'Direct Free Kick. Distance: 23.06m',                           side:'left'   },
  { id:'3',  tick:3,  minute:"3'",    team:'FC Team', type:'Goal',                        player:'S. Fünf',     details:'Right-footed shot. Assist: S. Neun. xG: 0.03',                 side:'left'   },
  { id:'4',  tick:9,  minute:"9'",    team:'FC Team', type:'Goal',                        player:'S. Elf',      details:'Right-footed shot. Assist: S. Sechs. xG: 0.22',                side:'left'   },
  { id:'5',  tick:12, minute:"12'",   team:'FC Team', type:'Shot',    subType:'Saved',    player:'S. Acht',     details:'Left-footed shot. Distance: 17.1m',                            side:'left'   },
  { id:'6',  tick:17, minute:"17'",   team:'Club',    type:'Shot',    subType:'Saved',    player:'S. Zwei',     details:'Left-footed shot. Distance: 12.3m',                            side:'right'  },
  { id:'7',  tick:25, minute:"25'",   team:'FC Team', type:'Goal',    subType:'Penalty',  player:'S. Sechs',    details:'Penalty Kick. xG: 0.76. Hand-ball by S. Sieben.',              side:'left'   },
  { id:'8',  tick:27, minute:"27'",   team:'FC Team', type:'Card',    subType:'Yellow',   player:'S. Zwei',     details:'Foul',                                                         side:'left'   },
  { id:'9',  tick:28, minute:"28'",   team:'FC Team', type:'Goal',                        player:'S. Sieben',   details:'Right-footed shot. Assist: S. Vier. Distance: 24.6m',          side:'left'   },
  { id:'10', tick:45, minute:"45'",   team:'Neutral', type:'Whistle',                     player:'HALF TIME',   details:'FC Team 4 - 0 Club',                                           side:'center' },
  { id:'11', tick:46, minute:"46'",   team:'Club',    type:'Sub',                         player:'S. Dreizehn', details:'In for S. Sieben (Tactical sub to protect from 2nd Yellow).',  side:'right'  },
  { id:'12', tick:54, minute:"54'",   team:'Club',    type:'Card',    subType:'Yellow',   player:'S. Vier',     details:'Receives a booking for a late tackle on S. Neun.',             side:'right'  },
  { id:'13', tick:62, minute:"62'",   team:'FC Team', type:'Goal',                        player:'S. Neun',     details:'Header. Assist: S. Zehn. xG: 0.15',                            side:'left'   },
  { id:'14', tick:68, minute:"68'",   team:'FC Team', type:'Sub',                         player:'S. Fünfzehn', details:'In for S. Elf (Resting the goalscorer).',                      side:'left'   },
  { id:'15', tick:74, minute:"74'",   team:'Club',    type:'Sub',                         player:'S. Sechzehn', details:'In for S. Zwei',                                               side:'right'  },
  { id:'16', tick:77, minute:"77'",   team:'Club',    type:'Shot',    subType:'Woodwork', player:'S. Dreizehn', details:'Shot hit the crossbar. Distance: 20m',                         side:'right'  },
  { id:'17', tick:83, minute:"83'",   team:'Club',    type:'Card',    subType:'Red',      player:'S. Vier',     details:'Second Yellow Card. Reckless challenge.',                      side:'right'  },
  { id:'18', tick:88, minute:"88'",   team:'Club',    type:'Goal',                        player:'S. Dreizehn', details:'Right-footed shot. Fast break. xG: 0.42',                      side:'right'  },
  { id:'19', tick:93, minute:"90+3'", team:'Neutral', type:'Whistle',                     player:'FULL TIME',   details:'FC Team 5 - 1 Club',                                           side:'center' },
];

// ── Event icon + accent colour lookup ────────────────────────────────────────
// TEAM_GLOW is rebuilt each render via getTeamGlow() since C is mutable
function getTeamGlow(): Record<string, string> {
  return {
    'FC Team': C.homeGoalColor,
    'Club':    C.awayGoalColor,
  };
}

function getIcon(ev: DemoEvent): string {
  if (ev.type === 'Goal')    return '⚽';
  if (ev.type === 'Sub')     return '🔄';
  if (ev.type === 'Whistle') return '📣';
  if (ev.type === 'Shot' && ev.subType === 'Woodwork') return '😱';
  if (ev.type === 'Shot')    return '🎯';
  if (ev.type === 'Card' && ev.subType === 'Red')    return '🟥';
  if (ev.type === 'Card' && ev.subType === 'Yellow') return '🟨';
  return '•';
}

function getAccent(ev: DemoEvent): string {
  const tg = getTeamGlow();
  if (ev.type === 'Goal')    return tg[ev.team] ?? C.accent;
  if (ev.type === 'Card' && ev.subType === 'Red')    return '#DC052D';
  if (ev.type === 'Card' && ev.subType === 'Yellow') return '#92400E';
  if (ev.type === 'Sub')     return C.secondary;
  if (ev.type === 'Whistle') return C.onVariant;
  if (ev.type === 'Shot' && ev.subType === 'Woodwork') return C.onVariant;
  return C.secondary;
}

// ── Event card ────────────────────────────────────────────────────────────────
function DemoCard({ ev }: { ev: DemoEvent }) {
  const accent  = getAccent(ev);
  const icon    = getIcon(ev);
  const isGoal  = ev.type === 'Goal';
  const isCenter = ev.side === 'center';

  return (
    <View style={[
      tm.card,
      { backgroundColor: C.cardBg, borderColor: C.outline },
      isCenter && tm.cardCenter,
      isGoal && {
        borderColor:   accent + '80',
        shadowColor:   accent,
        shadowOpacity: 0.45,
        shadowRadius:  14,
        shadowOffset:  { width: 0, height: 0 },
        elevation:     10,
      },
    ]}>
      {/* Top row: minute (accent) + icon */}
      <View style={tm.cardHeader}>
        <Text style={[tm.cardMinute, { color: accent }]}>{ev.minute}</Text>
        <Text style={tm.cardIcon}>{icon}</Text>
      </View>

      {/* Player name */}
      <Text style={tm.cardPlayer}>{ev.player}</Text>

      {/* Details — wraps freely */}
      {ev.details ? (
        <Text style={tm.cardDetails}>{ev.details}</Text>
      ) : null}
    </View>
  );
}

// ── Single timeline row ───────────────────────────────────────────────────────
// Three-column layout: [left flex:1] [spine 2px absolute] [right flex:1]
// The spine is drawn as a position:absolute line behind all rows.
function DemoRow({ ev }: { ev: DemoEvent }) {
  const accent = getAccent(ev);
  const { side } = ev;
  const isCenter = side === 'center';

  // For center events (HALF TIME / FULL TIME), we hide the spine node
  // and give the card a solid background + high z-index so it cleanly
  // "breaks" the vertical spine line.
  if (isCenter) {
    return (
      <View style={[tm.row, { zIndex: 10 }]}>
        <View style={tm.halfLeft} />
        {/* No spine node for center events */}
        <View style={[tm.nodeWrap, { opacity: 0 }]}>
          <View style={tm.node} />
        </View>
        <View style={tm.halfRight}>
          <View style={[tm.centerCardWrap, { backgroundColor: C.bg, zIndex: 10, paddingHorizontal: 16, borderRadius: 12 }]}>
            <DemoCard ev={ev} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={tm.row}>
      {/* ── Left half ── */}
      <View style={tm.halfLeft}>
        {side === 'left' && <DemoCard ev={ev} />}
      </View>

      {/* ── Spine node ── */}
      <View style={tm.nodeWrap}>
        <View style={[tm.node, {
          backgroundColor: accent,
          borderColor:     accent,
          shadowColor:     accent,
        }]} />
      </View>

      {/* ── Right half ── */}
      <View style={tm.halfRight}>
        {side === 'right' && <DemoCard ev={ev} />}
      </View>
    </View>
  );
}

// ── Tab: TIMELINE ─────────────────────────────────────────────────────────────
// Simulates a live match by revealing events as the demo clock advances.
// Raw Zustand WS events are intentionally ignored — they contain untranslated
// player IDs and noisy DUEL/Play events that degrade the demo experience.
function TimelineTab({
  events: _events,
  onMinuteChange,
  onScoreChange,
}: {
  events: TimelineEvent[];
  onMinuteChange: (m: number) => void;
  onScoreChange: (home: number, away: number) => void;
}) {
  // ── Demo match clock ───────────────────────────────────────────────────────
  const [currentMinute, setCurrentMinute] = useState(0);
  const flatListRef = useRef<FlatList<DemoEvent>>(null);

  useEffect(() => {
    // Notify parent so the scoreboard badge can mirror the clock
    onMinuteChange(currentMinute);
  }, [currentMinute]);

  useEffect(() => {
    if (currentMinute >= 95) return; // match over — stop ticking

    const id = setInterval(() => {
      setCurrentMinute(prev => {
        if (prev >= 95) {
          clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, 800); // 800 ms ≈ 1 match minute in demo speed

    return () => clearInterval(id);
  }, []); // run once on mount

  // Only show events whose tick ≤ current clock minute
  const visibleEvents = DEMO_TIMELINE.filter(ev => ev.tick <= currentMinute);

  // ── Derive score from visible goal events and report to parent ─────────────
  useEffect(() => {
    const homeGoals = visibleEvents.filter(ev => ev.type === 'Goal' && ev.team === 'FC Team').length;
    const awayGoals = visibleEvents.filter(ev => ev.type === 'Goal' && ev.team === 'Club').length;
    onScoreChange(homeGoals, awayGoals);
  }, [visibleEvents.length]);

  // Format the clock for the in-tab header
  const clockLabel =
    currentMinute >= 95
      ? 'FT'
      : currentMinute > 90
      ? `90+${currentMinute - 90}'`
      : `${currentMinute}'`;

  return (
    <View style={[tm.container, { backgroundColor: C.bg }]}>
      {/* Continuous spine line behind all rows */}
      <View style={[tm.spineLine, { backgroundColor: C.spineColor }]} pointerEvents="none" />

      <FlatList
        ref={flatListRef}
        data={visibleEvents}
        keyExtractor={ev => ev.id}
        renderItem={({ item }) => <DemoRow ev={item} />}
        contentContainerStyle={tm.scrollContent}
        showsVerticalScrollIndicator={false}
        // Auto-scroll to bottom whenever a new event appears
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={tm.header}>
              <Text style={tm.headerLabel}>MATCH TIMELINE</Text>
              <View style={[tm.headerPill, { borderColor: C.accentBorder, backgroundColor: C.accentDim }]}>
                <Text style={[tm.headerPillText, { color: C.accent }]}>
                  {clockLabel}
                </Text>
              </View>
            </View>

            {/* Team labels */}
            <View style={tm.teamLabels}>
              <Text style={[tm.teamLabel, { color: C.homeGoalColor }]}>FC TEAM</Text>
              <Text style={[tm.teamLabel, { color: C.awayGoalColor }]}>CLUB</Text>
            </View>
          </View>
        }
        ListFooterComponent={<View style={{ height: 160 }} />}
        ListEmptyComponent={
          <View style={tm.waiting}>
            <Text style={tm.waitingText}>Waiting for kick-off…</Text>
          </View>
        }
      />
    </View>
  );
}

// ── Timeline stylesheet ───────────────────────────────────────────────────────
const NODE_SIZE = 12;

const tm = StyleSheet.create({
  // Outer container — needed so the absolute spine line is clipped correctly
  container: {
    flex: 1,
    position: 'relative',
  },

  // Spine line — colour set inline from C.spineColor
  spineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    marginLeft: -1,
    zIndex: 0,
  },

  scrollContent: {
    paddingTop: 8,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, paddingHorizontal: 16,
  },
  headerLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2.5,
    color: C.onMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerPill: {
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  headerPillText: {
    fontSize: 8, fontWeight: '800', letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // ── Team labels ───────────────────────────────────────────────────────────
  teamLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  teamLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // ── Row ───────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 6,
    zIndex: 1,
  },

  halfLeft: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 20,
  },

  halfRight: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 20,
  },

  centerCardWrap: {
    marginLeft: -(SW * 0.5) + 20,
    width: SW * 0.9,
  },

  // ── Spine node ────────────────────────────────────────────────────────────
  nodeWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // ── Event card — bg and goal border set inline from C ────────────────────
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    width: '90%',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardCenter: {
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'center',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardMinute: {
    fontSize: 12, fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  cardIcon: { fontSize: 16 },

  cardPlayer: {
    fontSize: 16, fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 12,
    color: '#B3B3B3',
    lineHeight: 17,
    marginTop: 4,
    flexShrink: 1,
  },

  // ── Waiting / empty state ─────────────────────────────────────────────────
  waiting: {
    paddingTop: 48, alignItems: 'center',
  },
  waitingText: {
    fontSize: 13, color: C.onMuted, letterSpacing: 0.5,
  },
});

const SQUAD_USERS = [
  { id:'u1', initials:'JK', pts:'+150', active:true  },
  { id:'u2', initials:'AL', pts:'+80',  active:false },
  { id:'u3', initials:'NI', pts:'+210', active:true  },
  { id:'u4', initials:'JO', pts:'+55',  active:false },
];

interface ChatMsg {
  id: string; mine: boolean; avatar: string;
  text: string; time: string;
}
const SEED_CHAT: ChatMsg[] = [
  { id:'c1', mine:false, avatar:'AL', text:'Ref is absolutely blind today. That was a clear pen 😤', time:'16:32' },
  { id:'c2', mine:true,  avatar:'JK', text:"Doesn't matter, we're holding the midfield anyway 🔥",  time:'16:33' },
  { id:'c3', mine:false, avatar:'NI', text:'Musiala is on another level rn 🍳',                      time:'16:34' },
];

const EMOTES = ['🔥','💀','😱','⚽','🟨','🎯'];

// ── Floating emote ────────────────────────────────────────────────────────────
interface FloatEmote { id: number; emote: string; x: number; }

function FloatingEmote({ item, onDone }: { item: FloatEmote; onDone: (id: number) => void }) {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(1);
  const scale      = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(-220, { duration: 1800, easing: Easing.out(Easing.quad) });
    opacity.value    = withSequence(
      withTiming(1,   { duration: 200 }),
      withTiming(0,   { duration: 1400, easing: Easing.in(Easing.quad) }),
    );
    scale.value = withSequence(
      withTiming(1.5, { duration: 300 }),
      withTiming(1.2, { duration: 1500 }),
    );
    const timer = setTimeout(() => runOnJS(onDone)(item.id), 1900);
    return () => clearTimeout(timer);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View style={[styles.floatEmote, { left: item.x }, style]}>
      <Text style={styles.floatEmoteText}>{item.emote}</Text>
    </Reanimated.View>
  );
}

// ── Pulsing dot ───────────────────────────────────────────────────────────────
function PulsingDot({ color }: { color: string }) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const loop = () => {
      scale.value   = withSequence(withTiming(1.6,{duration:700}), withTiming(1,{duration:700}));
      opacity.value = withSequence(withTiming(0.1,{duration:700}), withTiming(0.6,{duration:700}));
      const t = setTimeout(loop, 1400);
      return t;
    };
    const t = loop();
    return () => clearTimeout(t);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulsingWrap}>
      <Reanimated.View style={[styles.pulsingRing, { backgroundColor: color }, ringStyle]} />
      <View style={[styles.pulsingCore, { backgroundColor: color }]} />
    </View>
  );
}

// ── Tab: SQUAD ────────────────────────────────────────────────────────────────

/** Pre-lobby CTA — Create or Join a watch party */
function JoinLobbyGate({
  accent, onJoin,
}: {
  accent: string;
  onJoin: (code: string) => void;
}) {
  const [joinInput, setJoinInput]     = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // Generate a random 5-char alphanumeric code and show it — don't enter yet
  const handleCreate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setCreatedCode(code);
  };

  const handleEnterCreated = () => {
    if (!createdCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin(createdCode);
  };

  const handleJoin = () => {
    if (!joinInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin(joinInput.trim().toUpperCase());
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={sq.root}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── CREATE LOBBY ── */}
      <View style={[sq.card, { backgroundColor: C.surface, borderColor: C.outline }]}>
        <View style={[sq.iconWrap, { backgroundColor: C.accentDim, borderColor: C.accentBorder }]}>
          <Text style={sq.icon}>🏟️</Text>
        </View>
        <Text style={sq.cardTitle}>START A WATCH PARTY</Text>
        <Text style={sq.cardSub}>
          Generate a lobby code and invite your squad to watch together.
        </Text>

        {createdCode ? (
          <>
            <View style={[sq.codeDisplay, { backgroundColor: C.surfaceLow, borderColor: C.accentBorder }]}>
              <Text style={[sq.codeDisplayLabel, { color: C.onMuted }]}>YOUR LOBBY CODE</Text>
              <Text style={[sq.codeDisplayValue, { color: C.accent }]}>{createdCode}</Text>
              <Text style={[sq.codeDisplayHint, { color: C.onMuted }]}>Share this code with your friends so they can join</Text>
            </View>
            <TouchableOpacity
              style={[sq.createBtn, { backgroundColor: C.accent, shadowColor: C.accent }]}
              onPress={handleEnterCreated}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Enter lobby"
            >
              <Text style={[sq.createBtnText, { color: C.onAccent }]}>ENTER LOBBY →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[sq.createBtn, { backgroundColor: C.accent, shadowColor: C.accent }]}
            onPress={handleCreate}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Create lobby"
          >
            <Text style={[sq.createBtnText, { color: C.onAccent }]}>CREATE LOBBY</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── DIVIDER ── */}
      <View style={sq.divider}>
        <View style={[sq.dividerLine, { backgroundColor: C.outline }]} />
        <Text style={[sq.dividerText, { color: C.onMuted }]}>OR</Text>
        <View style={[sq.dividerLine, { backgroundColor: C.outline }]} />
      </View>

      {/* ── JOIN LOBBY ── */}
      <View style={[sq.card, { backgroundColor: C.surface, borderColor: C.outline }]}>
        <View style={[sq.iconWrap, { backgroundColor: C.surfaceHigh, borderColor: C.outline }]}>
          <Text style={sq.icon}>🔑</Text>
        </View>
        <Text style={sq.cardTitle}>JOIN A SQUAD</Text>
        <Text style={sq.cardSub}>
          Enter the 5-digit code shared by your friend.
        </Text>
        <TextInput
          style={[sq.codeInput, { backgroundColor: C.surfaceLow, borderColor: C.outline, color: C.onSurface }]}
          value={joinInput}
          onChangeText={v => setJoinInput(v.toUpperCase())}
          placeholder="ENTER CODE"
          placeholderTextColor={C.onMuted}
          autoCapitalize="characters"
          maxLength={5}
          returnKeyType="done"
          onSubmitEditing={handleJoin}
          accessibilityLabel="Lobby code input"
        />
        <TouchableOpacity
          style={[
            sq.joinBtn,
            { borderColor: C.accent },
            !joinInput.trim() && { opacity: 0.4 },
          ]}
          onPress={handleJoin}
          disabled={!joinInput.trim()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Join squad"
        >
          <Text style={[sq.joinBtnText, { color: C.accent }]}>JOIN SQUAD</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const sq = StyleSheet.create({
  root: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  icon: { fontSize: 26 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 13,
    color: '#B3B3B3',
    textAlign: 'center',
    lineHeight: 18,
  },
  createBtn: {
    marginTop: 4,
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOpacity: 0.30,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  codeInput: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
  },
  joinBtn: {
    marginTop: 4,
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // ── Lobby code display (after creation) ─────────────────────────────────
  codeDisplay: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  codeDisplayLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  codeDisplayValue: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 10,
  },
  codeDisplayHint: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
  },
});

/** Active lobby — shown after user joins */
function ActiveSquadLobby({
  lobbyCode, chat, input, setInput, onSend, onEmote,
}: {
  lobbyCode: string;
  chat: ChatMsg[]; input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onEmote: (e: string) => void;
}) {
  const flatRef = useRef<FlatList>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    if (chat.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [chat]);

  const renderMsg = ({ item: msg }: { item: ChatMsg }) => (
    <View style={[sq2.msgRow, msg.mine && sq2.msgRowMine]}>
      {/* Avatar */}
      <View style={[sq2.msgAvatar,
        { backgroundColor: C.surfaceHigh, borderColor: C.outline },
        msg.mine && { borderColor: C.accentBorder, backgroundColor: C.accentDim }]}>
        <Text style={[sq2.msgAvatarText, { color: msg.mine ? C.accent : C.onVariant }]}>
          {msg.avatar}
        </Text>
      </View>
      {/* Bubble */}
      <View style={[
        sq2.msgBubble,
        msg.mine
          ? { backgroundColor: C.accent,       borderBottomRightRadius: 4 }
          : { backgroundColor: '#333333',       borderBottomLeftRadius: 4,
              borderWidth: 1, borderColor: C.outline },
      ]}>
        <Text style={[sq2.msgText, { color: msg.mine ? C.onAccent : '#FFFFFF' }]}>
          {msg.text}
        </Text>
        <Text style={[sq2.msgTime, { color: msg.mine ? C.onAccent : '#B3B3B3',
          opacity: msg.mine ? 0.6 : 1, textAlign: msg.mine ? 'right' : 'left' }]}>
          {msg.time}
        </Text>
      </View>
    </View>
  );

  return (
    // KeyboardAvoidingView owns the full flex space for this tab.
    // 'padding' on iOS adds bottom padding equal to keyboard height.
    // 'height' on Android shrinks the view so the input stays visible.
    <KeyboardAvoidingView
      style={sq2.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
    >
      {/* ── COMPACT ROSTER HEADER ─────────────────────────────────────── */}
      {/* Lobby code + avatar strip in one tight block — never grows */}
      <View style={[sq2.rosterHeader, { backgroundColor: '#1A1A1A', borderBottomColor: '#333333' }]}>
        {/* Lobby code row */}
        <View style={sq2.lobbyCodeRow}>
          <Text style={[sq2.lobbyCodeLabel, { color: C.onMuted }]}>LOBBY</Text>
          <Text style={[sq2.lobbyCodeValue, { color: C.accent }]}>#{lobbyCode}</Text>
          <Text style={[sq2.lobbyCodeHint, { color: C.onMuted }]}>· Share to invite</Text>
        </View>

        {/* Horizontal avatar strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={sq2.avatarStrip}
        >
          {SQUAD_USERS.map(u => (
            <View key={u.id} style={sq2.avatarItem}>
              <View style={[sq2.avatar,
                { backgroundColor: C.surfaceHigh,
                  borderColor: u.active ? C.accent : C.surfaceHighest }]}>
                <Text style={[sq2.avatarInitials, { color: u.active ? C.accent : C.onSurface }]}>
                  {u.initials}
                </Text>
              </View>
              <Text style={[sq2.avatarPts, { color: u.active ? C.accent : C.onMuted }]}>
                {u.pts}
              </Text>
            </View>
          ))}
          {/* Add member button */}
          <View style={[sq2.avatarAdd, { borderColor: C.surfaceHighest }]}>
            <Text style={[sq2.avatarAddText, { color: C.surfaceHighest }]}>+</Text>
          </View>
        </ScrollView>
      </View>

      {/* ── CHAT FEED — flex: 1 fills all remaining space ─────────────── */}
      <FlatList
        ref={flatRef}
        data={chat}
        keyExtractor={m => m.id}
        renderItem={renderMsg}
        style={sq2.chatFeed}
        contentContainerStyle={sq2.chatContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          flatRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* ── INPUT FOOTER — always at bottom ───────────────────────────── */}
      <View style={[sq2.inputFooter, { backgroundColor: C.surfaceLow, borderTopColor: C.outline }]}>
        {/* Quick-reaction emotes above the text input */}
        <View style={[sq2.emoteStrip, { borderBottomColor: C.outline }]}>
          {EMOTES.map(e => (
            <TouchableOpacity
              key={e}
              style={[sq2.emoteBtn, { backgroundColor: C.surfaceHigh, borderColor: C.outline }]}
              onPress={() => onEmote(e)}
              activeOpacity={0.7}
            >
              <Text style={sq2.emoteText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Text input row */}
        <View style={sq2.inputRow}>
          <TextInput
            style={[sq2.textInput, { backgroundColor: C.bg, color: C.onSurface, borderColor: C.outline }]}
            value={input}
            onChangeText={setInput}
            placeholder="Send it..."
            placeholderTextColor={C.onMuted}
            returnKeyType="send"
            onSubmitEditing={onSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[sq2.sendBtn,
              { backgroundColor: C.surfaceHigh, borderColor: C.outline },
              input.trim() && { backgroundColor: C.accent, borderColor: C.accent }]}
            onPress={onSend}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text style={[sq2.sendIcon, { color: input.trim() ? C.onAccent : C.onMuted }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── ActiveSquadLobby stylesheet ───────────────────────────────────────────────
const sq2 = StyleSheet.create({
  // Root: fills the tab content area completely
  root: {
    flex: 1,
    width: '100%',
  },

  // ── Compact roster header ─────────────────────────────────────────────────
  rosterHeader: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  lobbyCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  lobbyCodeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  lobbyCodeValue: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  lobbyCodeHint: {
    fontSize: 10,
  },
  avatarStrip: {
    paddingHorizontal: 16,
    gap: 14,
    alignItems: 'center',
  },
  avatarItem: {
    alignItems: 'center',
    gap: 4,
  },
  // Compact 44px avatars
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
  },
  avatarPts: {
    fontSize: 10,
    fontWeight: '700',
  },
  avatarAdd: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAddText: {
    fontSize: 20,
    lineHeight: 22,
  },

  // ── Chat feed ─────────────────────────────────────────────────────────────
  chatFeed: {
    flex: 1,   // ← critical: expands to fill all space between header and footer
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },

  // ── Message rows ──────────────────────────────────────────────────────────
  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgRowMine: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  msgAvatarText: { fontSize: 10, fontWeight: '800' },
  msgBubble: {
    maxWidth: SW * 0.68,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTime: { fontSize: 10 },

  // ── Input footer ──────────────────────────────────────────────────────────
  inputFooter: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  emoteStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  emoteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emoteText: { fontSize: 18 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 18, fontWeight: '700' },
});

// ── Tab: LINEUP ───────────────────────────────────────────────────────────────

import type { LineupPlayer, StaffMember, ParsedLineup } from '../../services/dflLineupParser';

// ── Player dot on the pitch ───────────────────────────────────────────────────
function PitchPlayerDot({
  player, color,
}: {
  player: LineupPlayer;
  color: string;
}) {
  return (
    <View style={lp.playerWrap}>
      <View style={[lp.circle, { borderColor: color, backgroundColor: color + '22' }]}>
        <Text style={[lp.num, { color }]}>{player.shirtNumber}</Text>
      </View>
      <Text style={lp.name} numberOfLines={1}>
        {player.shortname || player.lastName}
      </Text>
    </View>
  );
}

// ── One tactical row on the pitch ─────────────────────────────────────────────
function PitchRow({ players, color }: { players: LineupPlayer[]; color: string }) {
  if (players.length === 0) return null;
  return (
    <View style={lp.pitchRow}>
      {players.map(p => (
        <PitchPlayerDot key={p.personId} player={p} color={color} />
      ))}
    </View>
  );
}

// ── Substitute card ───────────────────────────────────────────────────────────
function SubCard({ player, color }: { player: LineupPlayer; color: string }) {
  return (
    <View style={lp.subCard}>
      <View style={[lp.subNumBox, { backgroundColor: color + '22', borderColor: color + '55' }]}>
        <Text style={[lp.subNum, { color }]}>{player.shirtNumber}</Text>
      </View>
      <View style={lp.subInfo}>
        <Text style={lp.subName} numberOfLines={1}>
          {player.shortname || player.lastName}
        </Text>
        {player.position ? (
          <Text style={lp.subPos}>{player.position}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Staff row ─────────────────────────────────────────────────────────────────
function AssistantRow({ member }: { member: StaffMember }) {
  const roleLabel = member.role
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();

  return (
    <View style={lp.assistantRow}>
      <View style={lp.assistantAvatar}>
        <Text style={lp.assistantInitial}>
          {member.firstName[0]}{member.lastName[0]}
        </Text>
      </View>
      <View style={lp.assistantInfo}>
        <Text style={lp.assistantName}>
          {member.firstName} {member.lastName}
        </Text>
        <Text style={lp.assistantRole}>{roleLabel}</Text>
      </View>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={lp.sectionHeader}>
      <View style={lp.sectionLine} />
      <Text style={lp.sectionTitle}>{title}</Text>
      <View style={lp.sectionLine} />
    </View>
  );
}

// ── Loading / empty state ─────────────────────────────────────────────────────
function LineupEmpty({ onLoad }: { onLoad: () => void }) {
  return (
    <View style={lp.emptyWrap}>
      <Text style={lp.emptyIcon}>📋</Text>
      <Text style={lp.emptyTitle}>Lineup Not Loaded</Text>
      <Text style={lp.emptySub}>Tap below to parse the DFL match data</Text>
      <TouchableOpacity style={[lp.loadBtn, { borderColor: C.accentBorder, backgroundColor: C.accentDim }]} onPress={onLoad} activeOpacity={0.8}>
        <Text style={[lp.loadBtnText, { color: C.accent }]}>LOAD LINEUP</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main LINEUP tab ───────────────────────────────────────────────────────────
function LineupTab() {
  const { parsedLineup, loadLineup } = useAppStore();
  const theme = useTheme();
  const accent = theme.club.primary;

  // Load exactly once on mount — safe to call multiple times (store guards it)
  useEffect(() => {
    loadLineup();
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!parsedLineup) {
    return (
      <View style={lp.loadingWrap}>
        <ActivityIndicator size="large" color={C.red} />
        <Text style={lp.loadingText}>Loading lineup…</Text>
      </View>
    );
  }

  const { startingXI, substitutes, staff, teamName, formation, primaryColor } = parsedLineup;

  // primaryColor from the parser is already validated as a 6-digit hex.
  // Use it directly; fall back to the club theme accent only if it's missing.
  const pitchColor = primaryColor || accent;

  // Build pitch rows top-to-bottom: ATT → MID → DEF → GK
  // Filter out empty rows so space-around distributes evenly
  const pitchRows: { players: LineupPlayer[]; label: string }[] = [
    { players: startingXI.attackers,   label: 'ATT' },
    { players: startingXI.midfielders, label: 'MID' },
    { players: startingXI.defenders,   label: 'DEF' },
    { players: startingXI.goalkeeper,  label: 'GK'  },
  ].filter(r => r.players.length > 0);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={lp.scroll}
    >
      {/* ── Section A: Tactical Pitch ── */}
      <View style={lp.pitchHeader}>
        <View style={[lp.formationPill, { borderColor: pitchColor + '55', backgroundColor: C.accentDim }]}>
          <Text style={[lp.formationText, { color: pitchColor }]}>
            {teamName}  ·  {formation}
          </Text>
        </View>
      </View>

      <View style={lp.pitch}>
        {/* Pitch markings */}
        <View style={lp.penAreaTop} />
        <View style={lp.goalTop} />
        <View style={lp.centreLine} />
        <View style={lp.centreCircle} />
        <View style={lp.centreDot} />
        <View style={lp.penAreaBottom} />
        <View style={lp.goalBottom} />

        {/* Player rows — ATT at top, GK at bottom */}
        <View style={lp.pitchPlayers}>
          {pitchRows.map((row, i) => (
            <PitchRow key={i} players={row.players} color={pitchColor} />
          ))}
        </View>
      </View>

      <Text style={lp.pitchNote}>Starting XI  ·  {formation}</Text>

      {/* ── Section B: Substitutes ── */}
      {substitutes.length > 0 && (
        <View style={lp.section}>
          <SectionHeader title="SUBSTITUTES" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={lp.subList}
          >
            {substitutes.map(p => (
              <SubCard key={p.personId} player={p} color={pitchColor} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Section C: Coaching Staff ── */}
      <View style={lp.section}>
        <SectionHeader title="COACHING STAFF" />

        {/* Head coach — prominent full-width card */}
        {staff.headcoach && (
          <View style={[lp.headCoachCard, { borderColor: C.accentBorder }]}>
            <View style={lp.headCoachLeft}>
              <View style={[lp.headCoachAvatar, { borderColor: C.accentBorder, backgroundColor: C.accentDim }]}>
                <Text style={[lp.headCoachInitial, { color: C.accent }]}>
                  {staff.headcoach.firstName[0]}{staff.headcoach.lastName[0]}
                </Text>
              </View>
              <View>
                <Text style={[lp.headCoachLabel, { color: C.accent }]}>HEAD COACH</Text>
                <Text style={lp.headCoachName}>
                  {staff.headcoach.firstName} {staff.headcoach.lastName}
                </Text>
              </View>
            </View>
            <View style={[lp.headCoachBadge, { backgroundColor: C.accentDim, borderColor: C.accentBorder }]}>
              <Text style={[lp.headCoachBadgeText, { color: C.accent }]}>HC</Text>
            </View>
          </View>
        )}

        {/* Assistant coaches */}
        {staff.assistants.length > 0 && (
          <View style={lp.assistantList}>
            {staff.assistants.map(m => (
              <AssistantRow key={m.personId} member={m} />
            ))}
          </View>
        )}
      </View>

      {/* Extra bottom padding so the banter engine doesn't cover coaching staff */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const PITCH_H = SH * 0.46;

const lp = StyleSheet.create({
  scroll: { paddingBottom: 160 },

  // ── Pitch header ────────────────────────────────────────────────────────
  pitchHeader: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    alignItems: 'center',
  },
  formationPill: {
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  formationText: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
  },

  // ── Pitch — keep the green field, it's a pitch ───────────────────────────
  pitch: {
    marginHorizontal: 12,
    height: PITCH_H,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0a2015',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    position: 'relative',
  },

  // Pitch markings (white lines on green — unchanged)
  penAreaTop: {
    position: 'absolute', top: 0, left: '22%', right: '22%',
    height: '18%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderTopWidth: 0,
  },
  goalTop: {
    position: 'absolute', top: 0, left: '38%', right: '38%',
    height: '5%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
    borderTopWidth: 0,
  },
  centreLine: {
    position: 'absolute', top: '50%', left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  centreCircle: {
    position: 'absolute', top: '50%', left: '50%',
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    marginLeft: -34, marginTop: -34,
  },
  centreDot: {
    position: 'absolute', top: '50%', left: '50%',
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.30)',
    marginLeft: -3, marginTop: -3,
  },
  penAreaBottom: {
    position: 'absolute', bottom: 0, left: '22%', right: '22%',
    height: '18%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderBottomWidth: 0,
  },
  goalBottom: {
    position: 'absolute', bottom: 0, left: '38%', right: '38%',
    height: '5%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
    borderBottomWidth: 0,
  },

  pitchPlayers: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  pitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  // Player node
  playerWrap: { alignItems: 'center', gap: 2, minWidth: 36 },
  circle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  num:  { fontSize: 10, fontWeight: '800' },
  name: {
    fontSize: 7.5, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', maxWidth: 38,
  },

  pitchNote: {
    textAlign: 'center', fontSize: 10,
    color: C.onMuted, marginTop: 8, marginBottom: 4,
    letterSpacing: 0.5,
  },

  // ── Section wrapper ──────────────────────────────────────────────────────
  section: { marginTop: 20, paddingHorizontal: 12 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 12,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2.5,
    color: '#83958c',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // ── Substitute cards ─────────────────────────────────────────────────────
  subList: { paddingHorizontal: 4, gap: 10, paddingBottom: 4 },
  subCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#201f20',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    minWidth: 130,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  subNumBox: {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  subNum:  { fontSize: 13, fontWeight: '800' },
  subInfo: { gap: 2 },
  subName: { fontSize: 12, fontWeight: '700', color: '#e5e2e3', maxWidth: 90 },
  subPos:  { fontSize: 9, color: '#83958c', letterSpacing: 0.5 },

  // ── Head coach card ──────────────────────────────────────────────────────
  headCoachCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2a2a2b',
    borderRadius: 14, borderWidth: 1,
    padding: 16, marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  headCoachLeft:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headCoachAvatar: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  headCoachInitial: { fontSize: 18, fontWeight: '800' },
  headCoachLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 2,
    marginBottom: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headCoachName: {
    fontSize: 18, fontWeight: '800', color: '#e5e2e3', letterSpacing: -0.3,
  },
  headCoachBadge: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headCoachBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // ── Assistant list ───────────────────────────────────────────────────────
  assistantList: { gap: 2 },
  assistantRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  assistantAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2a2a2b',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  assistantInitial: { fontSize: 11, fontWeight: '700', color: '#b9cbc1' },
  assistantInfo:    { gap: 2 },
  assistantName:    { fontSize: 13, fontWeight: '600', color: '#e5e2e3' },
  assistantRole:    { fontSize: 10, color: '#83958c', letterSpacing: 0.3 },

  // ── Empty / loading state ────────────────────────────────────────────────
  loadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 60, gap: 14,
  },
  loadingText: {
    fontSize: 13, color: '#83958c', letterSpacing: 0.5,
  },
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 60, gap: 10,
  },
  emptyIcon:  { fontSize: 44, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#e5e2e3' },
  emptySub:   { fontSize: 13, color: '#83958c', textAlign: 'center', lineHeight: 20 },
  loadBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderRadius: 999, paddingHorizontal: 28, paddingVertical: 12,
  },
  loadBtnText: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LiveMatchCenterScreen() {
  const { teams, currentEvent, events: storeEvents, timelineEvents, matchId, connectWebSocket,
          hasJoinedLobby, joinLobby, selectedClub,
          homeScore, awayScore } = useAppStore();
  const theme = useTheme();
  const accent = theme.club.primary;
  const isBVB  = selectedClub === 'bvb';

  // ── Rebuild the mutable token object before this render tree executes ──────
  // All sub-components (DemoCard, JoinLobbyGate, etc.) read from the module-level
  // `C` reference, which is now up-to-date for this render pass.
  C = buildTokens(isBVB);

  const [tab, setTab]         = useState<Tab>('TIMELINE');
  const [chat, setChat]       = useState<ChatMsg[]>(SEED_CHAT);
  const [input, setInput]     = useState('');
  const [floaters, setFloaters] = useState<FloatEmote[]>([]);
  const [momentum, setMomentum] = useState(0.5); // 0–1
  const [activeLobbyCode, setActiveLobbyCode] = useState('');
  // Mirrors the demo clock inside TimelineTab so the scoreboard badge stays in sync
  const [demoMinute, setDemoMinute] = useState(0);
  // Derived demo scores — updated by TimelineTab as goals appear
  const [demoHomeScore, setDemoHomeScore] = useState(0);
  const [demoAwayScore, setDemoAwayScore] = useState(0);

  // ── Sidebar state & animation ─────────────────────────────────────────────
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  const handleDemoScoreChange = useCallback((home: number, away: number) => {
    setDemoHomeScore(home);
    setDemoAwayScore(away);
  }, []);

  // Connect shared WS once
  useEffect(() => { connectWebSocket(); }, []);

  // Sync momentum from live events
  useEffect(() => {
    if (currentEvent?.momentumScore !== undefined) {
      setMomentum(Math.max(0, Math.min(1, (currentEvent.momentumScore + 1) / 2)));
    }
  }, [currentEvent]);

  const homeTeam  = teams.find(t => t.role === 'home');
  const awayTeam  = teams.find(t => t.role === 'guest');
  // Display score: prefer demo-derived scores (from the timeline tab) when the
  // demo clock is running; fall back to store scores for live WS data.
  const displayHomeScore = demoMinute > 0 ? demoHomeScore : homeScore;
  const displayAwayScore = demoMinute > 0 ? demoAwayScore : awayScore;

  // Match minute for the live badge.
  // Priority: live WS timeline → demo clock → fallback dash.
  const matchMinute = (() => {
    if (timelineEvents.length > 0) return timelineEvents[0].matchMinute;
    if (demoMinute > 0) {
      if (demoMinute >= 95) return 'FT';
      if (demoMinute > 90) return `90+${demoMinute - 90}'`;
      return `${demoMinute}'`;
    }
    if (!currentEvent?.eventTime || storeEvents.length === 0) return '—';
    try {
      const diff = (new Date(currentEvent.eventTime).getTime() - new Date(storeEvents[0].eventTime).getTime()) / 60000;
      return `${Math.floor(diff)}'`;
    } catch { return '—'; }
  })();

  // ── Emote fire ──────────────────────────────────────────────────────────────
  const fireEmote = useCallback((emote: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const id = Date.now() + Math.random();
    const x  = 24 + Math.random() * (SW - 80);
    setFloaters(prev => [...prev, { id, emote, x }]);

    // Also push to chat
    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    setChat(prev => [...prev, { id: `e${id}`, mine: true, avatar: 'JK', text: emote, time }]);

    sendBanterEmoteToApiGateway({
      userId: 'user_123', matchId: matchId ?? 'match_1',
      emote, timestamp: new Date().toISOString(),
    });
  }, [matchId]);

  const removeFloater = useCallback((id: number) => {
    setFloaters(prev => prev.filter(f => f.id !== id));
  }, []);

  // ── Send chat ───────────────────────────────────────────────────────────────
  const sendChat = useCallback(() => {
    if (!input.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    setChat(prev => [...prev, { id: `m${Date.now()}`, mine: true, avatar: 'JK', text: input.trim(), time }]);
    setInput('');
  }, [input]);

  const TABS: Tab[] = ['SQUAD', 'TIMELINE', 'LINEUP'];

  // Dynamic gradient (matches Hub)
  const gradientColors: [string, string, string, string] = isBVB
    ? ['#FDE100', '#4A4200', '#000000', '#000000']
    : selectedClub === 'fcb'
    ? ['#DC052D', '#5C0012', '#121212', '#121212']
    : selectedClub === 'svw'
    ? ['#139B48', '#0A4A22', '#000000', '#000000']
    : ['#1A1A1A', '#121212', '#121212', '#121212'];
  const gradientLocations: [number, number, number, number] = selectedClub === 'fcb'
    ? [0, 0.4, 0.75, 1]
    : isBVB || selectedClub === 'svw'
    ? [0, 0.35, 0.7, 1]
    : [0, 0.3, 0.7, 1];
  const headerTextColor = isBVB ? '#000000' : '#FFFFFF';

  return (
    <LinearGradient colors={gradientColors} locations={gradientLocations} style={{ flex: 1 }}>
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]} edges={['top']}>
      {/* Floating emotes layer */}
      <View style={styles.floatLayer} pointerEvents="none">
        {floaters.map(f => (
          <FloatingEmote key={f.id} item={f} onDone={removeFloater} />
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <View style={[styles.header, { backgroundColor: 'transparent', borderBottomColor: C.outline }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setIsMenuOpen(true)} activeOpacity={0.7}>
            <Text style={[styles.headerIcon, { color: headerTextColor }]}>☰</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            <Text style={{ color: isBVB ? '#000000' : C.accent }}>FAN </Text>
            <Text style={{ color: headerTextColor }}>SQUAD</Text>
          </Text>

          <View style={styles.headerBtn}>
            <PulsingDot color={C.accent} />
          </View>
        </View>

        {/* ── SCOREBOARD CARD ─────────────────────────────────────────── */}
        {/* BVB: dark #1A1A1A card with yellow border; Bayern: red gradient */}
        <LinearGradient
          colors={C.scoreGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.scoreCard,
            isBVB && { borderWidth: 1.5, borderColor: C.scoreGradBorder, shadowColor: C.accent },
          ]}
        >
          {/* Live minute badge */}
          <View style={[styles.liveBadge, isBVB && { backgroundColor: 'rgba(253,225,0,0.12)', borderColor: 'rgba(253,225,0,0.35)' }]}>
            <PulsingDot color={isBVB ? C.accent : '#FFFFFF'} />
            <Text style={[styles.liveBadgeText, { color: isBVB ? C.accent : '#FFFFFF' }]}>{matchMinute}</Text>
          </View>

          {/* Score row */}
          <View style={styles.scoreRow}>
            {/* Home */}
            <View style={styles.teamCol}>
              <View style={[styles.crest, { borderColor: 'rgba(255,255,255,0.40)' }]}>
                <Text style={styles.crestText}>{homeTeam?.shortName?.[0] ?? 'T'}</Text>
              </View>
              <Text style={styles.teamLabel}>{homeTeam?.shortName ?? 'Team'}</Text>
            </View>

            {/* Score */}
            <View style={styles.scoreCenter}>
              <Text style={[styles.scoreDigit, styles.scoreHome]}>{displayHomeScore}</Text>
              <View style={styles.scoreSep} />
              <Text style={[styles.scoreDigit, styles.scoreAway]}>{displayAwayScore}</Text>
            </View>

            {/* Away */}
            <View style={styles.teamCol}>
              <View style={[styles.crest, { borderColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={styles.crestText}>{awayTeam?.shortName?.[0] ?? 'C'}</Text>
              </View>
              <Text style={styles.teamLabel}>{awayTeam?.shortName ?? 'Club'}</Text>
            </View>
          </View>

          {/* Momentum bar */}
          <View style={styles.momentumRow}>
            <Text style={styles.momentumLabel}>{homeTeam?.shortName ?? 'Team'}</Text>
            <View style={styles.momentumTrack}>
              <View style={[styles.momentumFill, {
                width: `${momentum * 100}%` as any,
                backgroundColor: isBVB ? C.accent : 'rgba(255,255,255,0.90)',
              }]} />
              <View style={[styles.momentumDot, {
                left: `${momentum * 100}%` as any,
                backgroundColor: isBVB ? C.accent : '#FFFFFF',
                shadowColor:     isBVB ? C.accent : '#FFFFFF',
              }]} />
            </View>
            <Text style={styles.momentumLabel}>{awayTeam?.shortName ?? 'Club'}</Text>
          </View>
        </LinearGradient>

        {/* ── TAB BAR ─────────────────────────────────────────────────── */}
        <View style={[styles.tabBar, { backgroundColor: C.bg, borderBottomColor: C.outline }]}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && { color: C.accent }]}>{t}</Text>
              {tab === t && <View style={[styles.tabUnderline, { backgroundColor: C.accent }]} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB CONTENT ─────────────────────────────────────────────── */}
        <View style={styles.tabContent}>
          {tab === 'TIMELINE' && (
            <TimelineTab events={timelineEvents} onMinuteChange={setDemoMinute} onScoreChange={handleDemoScoreChange} />
          )}
          {tab === 'SQUAD' && (
            hasJoinedLobby
              ? <ActiveSquadLobby
                  lobbyCode={activeLobbyCode}
                  chat={chat} input={input}
                  setInput={setInput} onSend={sendChat} onEmote={fireEmote}
                />
              : <JoinLobbyGate accent={accent} onJoin={(code: string) => {
                  setActiveLobbyCode(code);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  joinLobby();
                }} />
          )}
          {tab === 'LINEUP' && <LineupTab />}
        </View>

        {/* ── BANTER ENGINE — hidden when SQUAD tab is active ─────────── */}
        {/* The SQUAD tab owns its own compact input footer (sq2.inputFooter). */}
        {/* TIMELINE and LINEUP share this global banter bar. */}
        {tab !== 'SQUAD' && (
          <View style={[styles.banterBar, { backgroundColor: C.surfaceLow, borderTopColor: C.outline }]}>
            {/* Emote row */}
            <View style={[styles.emoteRow, { borderBottomColor: C.outline }]}>
              {EMOTES.map(e => (
                <TouchableOpacity key={e} style={[styles.emoteBtn, { backgroundColor: C.surfaceHigh, borderColor: C.outline }]}
                  onPress={() => fireEmote(e)} activeOpacity={0.7}>
                  <Text style={styles.emoteText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input row */}
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, { backgroundColor: C.bg, color: C.onSurface, borderColor: C.outline }]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Send it..."
                  placeholderTextColor={C.onMuted}
                  onSubmitEditing={sendChat}
                  returnKeyType="send"
                  blurOnSubmit={false}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: C.surfaceHigh, borderColor: C.outline },
                  input.trim() && { backgroundColor: C.accent, borderColor: C.accent }]}
                onPress={sendChat}
                activeOpacity={0.8}
              >
                <Text style={[styles.sendIcon, { color: input.trim() ? C.onAccent : C.onMuted }]}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── SIDEBAR OVERLAY ─────────────────────────────────────────────── */}
      {/* Backdrop — tap anywhere outside to close */}
      {isMenuOpen && (
        <TouchableOpacity
          style={styles.sidebarBackdrop}
          onPress={() => setIsMenuOpen(false)}
          activeOpacity={1}
        />
      )}

      {/* Animated sidebar panel */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        {/* ── Sidebar header ── */}
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarLogo}>
            <Text style={{ color: C.accent }}>FAN </Text>
            <Text style={{ color: '#FFFFFF' }}>SQUAD</Text>
          </Text>
          <TouchableOpacity
            style={styles.sidebarCloseBtn}
            onPress={() => setIsMenuOpen(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.sidebarCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={[styles.sidebarDivider, { backgroundColor: C.accent + '40' }]} />

        {/* ── Nav links ── */}
        {[
          { label: 'Arena Hub',    path: '/(app)/hub'         },
          { label: 'Draft Lobby',  path: '/(app)/draft'       },
          { label: 'Predictions',  path: '/(app)/prop-locker' },
          { label: 'My Squad',     path: '/(app)/squad'       },
          { label: 'Profile',      path: '/(app)/profile'     },
        ].map(item => (
          <TouchableOpacity
            key={item.path}
            style={styles.sidebarLink}
            onPress={() => {
              setIsMenuOpen(false);
              router.push(item.path as any);
            }}
            activeOpacity={0.65}
          >
            <Text style={styles.sidebarLinkText}>{item.label}</Text>
            <Text style={[styles.sidebarLinkArrow, { color: C.accent }]}>{'\u203a'}</Text>
          </TouchableOpacity>
        ))}

        {/* Bottom accent strip */}
        <View style={[styles.sidebarAccentStrip, { backgroundColor: C.accent }]} />
      </Animated.View>

    </SafeAreaView>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Floating emotes
  floatLayer:    { ...StyleSheet.absoluteFillObject, zIndex: 99, pointerEvents: 'none' },
  floatEmote:    { position: 'absolute', bottom: 120 },
  floatEmoteText:{ fontSize: 40 },

  // Pulsing dot
  pulsingWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  pulsingRing: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  pulsingCore: { width: 8, height: 8, borderRadius: 4 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBtn:   { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerIcon:  { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 4 },

  // ── Scoreboard card — LinearGradient, layout only ────────────────────────
  scoreCard: {
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: 16, padding: 16,
    elevation: 4,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 14,
  },
  liveBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  scoreRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  teamCol:    { alignItems: 'center', gap: 6, flex: 1 },
  crest: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  crestText:  { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  teamLabel:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5 },

  scoreCenter: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1.4, justifyContent: 'center' },
  scoreDigit:  { fontSize: 56, fontWeight: '800', lineHeight: 60 },
  scoreHome:   { color: '#FFFFFF' },
  scoreAway:   { color: 'rgba(255,255,255,0.75)' },
  scoreSep:    { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.30)' },

  // ── Momentum bar ──────────────────────────────────────────────────────────
  momentumRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  momentumLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 1, width: 36, textAlign: 'center' },
  momentumTrack: {
    flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3, overflow: 'visible', position: 'relative',
  },
  momentumFill:  { height: 6, borderRadius: 3 },
  momentumDot: {
    position: 'absolute', top: -4, width: 14, height: 14,
    borderRadius: 7, marginLeft: -7,
    shadowOpacity: 0.6, shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 }, elevation: 3,
  },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12,
    borderBottomWidth: 1,
  },
  tabItem:       { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  tabText:       { fontSize: 11, fontWeight: '700', color: '#B3B3B3', letterSpacing: 1.5 },
  tabTextActive: { color: '#FDE100' },   // fallback — overridden inline
  tabUnderline: {
    position: 'absolute', bottom: -1, left: 0, right: 0, height: 3,
    borderRadius: 1,
  },

  tabContent: { flex: 1, overflow: 'hidden' },

  // ── Timeline (unused direct styles — kept for compat) ─────────────────────
  tlList:   { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 160 },
  tlRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tlTime:   { fontSize: 11, color: '#83958c', width: 60, fontVariant: ['tabular-nums'] },
  tlDot: {
    width: 8, height: 8, borderRadius: 4,
    shadowOpacity: 0.4, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  tlBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#2a2a2b', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  tlIcon:   { fontSize: 12 },
  tlType:   { fontSize: 11, fontWeight: '600', color: '#b9cbc1', letterSpacing: 0.5 },
  tlResult: { fontSize: 13, fontWeight: '800', marginLeft: 'auto' },

  // ── Squad / lobby ─────────────────────────────────────────────────────────
  lobbyCodeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  lobbyCodeBannerLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  lobbyCodeBannerCode:  { fontSize: 18, fontWeight: '900', letterSpacing: 4 },
  lobbyCodeBannerHint:  { fontSize: 10, marginLeft: 4 },
  squadRow:        { flexShrink: 0, borderBottomWidth: 1 },
  squadRowContent: { paddingHorizontal: 16, paddingVertical: 14, gap: 16 },
  squadUser:       { alignItems: 'center', gap: 6 },
  squadAvatar: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  squadAvatarText: { fontSize: 16, fontWeight: '800' },
  squadPts: {
    borderRadius: 999, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  squadPtsText: { fontSize: 10, fontWeight: '700' },
  squadAdd: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  squadAddText: { fontSize: 22 },

  // ── Chat ──────────────────────────────────────────────────────────────────
  chatList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgRowMine: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  msgAvatarText: { fontSize: 11, fontWeight: '800' },
  msgBubble: {
    maxWidth: SW * 0.68,
    borderRadius: 16, padding: 12, gap: 4,
  },
  // "me" → club accent bg (BVB Yellow / Bayern Blue) with onAccent text
  msgBubbleMine: {
    borderBottomRightRadius: 4,
  },
  // "other" → dark surface with light text
  msgBubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTime: { fontSize: 10, alignSelf: 'flex-end' },

  // ── Banter bar ────────────────────────────────────────────────────────────
  banterBar: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  emoteRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
    borderBottomWidth: 1,
  },
  emoteBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  emoteText: { fontSize: 20 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  inputWrap: { flex: 1 },
  input: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: 18, fontWeight: '700' },

  // ── Sidebar ───────────────────────────────────────────────────────────────
  sidebarBackdrop: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 40,
  },
  sidebar: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    width: 280,
    backgroundColor: '#111111',
    zIndex: 50,
    borderRightWidth: 1,
    borderRightColor: '#2A2A2A',
    paddingTop: 56,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 0 },
    elevation: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sidebarLogo: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
  },
  sidebarCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#222222',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#333333',
  },
  sidebarCloseText: {
    fontSize: 14, fontWeight: '700', color: '#FFFFFF',
  },
  sidebarDivider: {
    height: 1,
    marginVertical: 24,
  },
  sidebarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sidebarLinkText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sidebarLinkArrow: {
    fontSize: 22,
    fontWeight: '300',
  },
  sidebarAccentStrip: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 4,
  },
});
