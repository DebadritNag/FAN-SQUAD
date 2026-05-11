import React, { useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore, MatchdayTask } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';

const { width: SW } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:           '#121212',
  surface:      '#1A1A1A',
  surfaceHigh:  '#222222',
  surfaceHighest:'#2A2A2A',
  onSurface:    '#FFFFFF',
  onVariant:    '#9AA3AD',
  onMuted:      '#4E5A66',
  outline:      'rgba(255,255,255,0.07)',
  gold:         '#FFD166',
  goldDim:      'rgba(255,209,102,0.12)',
  goldBorder:   'rgba(255,209,102,0.30)',
  green:        '#4ADE80',
  greenDim:     'rgba(74,222,128,0.10)',
  greenBorder:  'rgba(74,222,128,0.35)',
};

// ── Claim button with pulse animation ─────────────────────────────────────────
function ClaimButton({
  task, accent, onClaim,
}: {
  task: MatchdayTask;
  accent: string;
  onClaim: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  // Start pulse loop when button is claimable
  React.useEffect(() => {
    if (task.completed && !task.claimed) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [task.completed, task.claimed]);

  // ── CLAIMED ──
  if (task.claimed) {
    return (
      <View style={[btn.base, btn.claimed]}>
        <Text style={btn.claimedText}>CLAIMED ✓</Text>
      </View>
    );
  }

  // ── INCOMPLETE ──
  if (!task.completed) {
    return (
      <View style={[btn.base, btn.incomplete]}>
        <Text style={btn.incompleteText}>INCOMPLETE</Text>
      </View>
    );
  }

  // ── CLAIMABLE ──
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <TouchableOpacity
        style={[btn.base, btn.claimable, {
          backgroundColor: accent + '18',
          borderColor: accent,
          shadowColor: accent,
        }]}
        onPress={onClaim}
        activeOpacity={0.75}
      >
        <Text style={[btn.claimableText, { color: accent }]}>CLAIM</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const btn = StyleSheet.create({
  base: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 90,
  },
  incomplete: {
    backgroundColor: 'transparent',
    borderColor: D.surfaceHighest,
  },
  incompleteText: {
    fontSize: 10, fontWeight: '700', color: D.onMuted, letterSpacing: 1,
  },
  claimable: {
    shadowOpacity: 0.45, shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  claimableText: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
  },
  claimed: {
    backgroundColor: D.greenDim,
    borderColor: D.greenBorder,
  },
  claimedText: {
    fontSize: 10, fontWeight: '700', color: D.green, letterSpacing: 0.8,
  },
});

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({
  task, accent, onClaim,
}: {
  task: MatchdayTask;
  accent: string;
  onClaim: (id: string) => void;
}) {
  const handleClaim = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClaim(task.id);
  };

  return (
    <View style={[
      card.root,
      task.claimed && card.rootClaimed,
      task.completed && !task.claimed && { borderColor: accent + '35' },
    ]}>
      {/* Left: icon + text */}
      <View style={card.left}>
        <View style={[card.iconWrap, {
          backgroundColor: task.claimed
            ? D.greenDim
            : task.completed
              ? accent + '18'
              : D.surfaceHighest,
        }]}>
          <Text style={card.icon}>{task.icon}</Text>
        </View>

        <View style={card.textWrap}>
          <Text style={[card.title, task.claimed && { color: D.onVariant }]}>
            {task.title}
          </Text>
          <Text style={card.desc} numberOfLines={1}>{task.description}</Text>

          {/* Reward pill */}
          <View style={[card.rewardPill, {
            backgroundColor: task.claimed ? D.greenDim : D.goldDim,
            borderColor:     task.claimed ? D.greenBorder : D.goldBorder,
          }]}>
            <Text style={[card.rewardText, { color: task.claimed ? D.green : D.gold }]}>
              🏆 +{task.reward} pts
            </Text>
          </View>
        </View>
      </View>

      {/* Right: action button */}
      <ClaimButton task={task} accent={accent} onClaim={handleClaim} />
    </View>
  );
}

const card = StyleSheet.create({
  root: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: D.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: D.outline,
    marginBottom: 12, gap: 12,
  },
  rootClaimed: {
    borderColor: D.greenBorder,
    backgroundColor: '#1A1E1A',
  },
  left:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  icon:     { fontSize: 22 },
  textWrap: { flex: 1, gap: 3 },
  title: {
    fontSize: 14, fontWeight: '700', color: D.onSurface,
    lineHeight: 18,
  },
  desc: {
    fontSize: 11, color: D.onMuted, lineHeight: 15,
  },
  rewardPill: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
    marginTop: 4,
  },
  rewardText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  gold:  D.gold,
  green: D.green,
});

// ── Progress header ───────────────────────────────────────────────────────────
function ProgressHeader({
  tasks, accent,
}: {
  tasks: MatchdayTask[];
  accent: string;
}) {
  const completed = tasks.filter(t => t.completed).length;
  const claimed   = tasks.filter(t => t.claimed).length;
  const total     = tasks.length;
  const pct       = (completed / total) * 100;
  const totalReward = tasks.reduce((sum, t) => sum + t.reward, 0);
  const earnedReward = tasks.filter(t => t.claimed).reduce((sum, t) => sum + t.reward, 0);

  return (
    <View style={ph.root}>
      {/* Title row */}
      <View style={ph.titleRow}>
        <View>
          <Text style={ph.label}>DAILY MISSIONS</Text>
          <Text style={ph.fraction}>
            <Text style={{ color: accent }}>{completed}</Text>
            <Text style={{ color: D.onMuted }}>/{total} Completed</Text>
          </Text>
        </View>
        <View style={ph.rewardSummary}>
          <Text style={ph.rewardLabel}>EARNED</Text>
          <Text style={[ph.rewardValue, { color: D.gold }]}>
            {earnedReward.toLocaleString()} / {totalReward.toLocaleString()} pts
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={ph.track}>
        <View style={[ph.fill, {
          width: `${pct}%` as any,
          backgroundColor: accent,
          shadowColor: accent,
        }]} />
        {/* Segment markers */}
        {tasks.map((_, i) => i > 0 && (
          <View key={i} style={[ph.marker, { left: `${(i / total) * 100}%` as any }]} />
        ))}
      </View>

      {/* Claimed count */}
      {claimed > 0 && (
        <Text style={ph.claimedNote}>
          {claimed} reward{claimed > 1 ? 's' : ''} claimed ✓
        </Text>
      )}
    </View>
  );
}

const ph = StyleSheet.create({
  root: {
    backgroundColor: D.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: D.outline,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  label: {
    fontSize: 10, fontWeight: '700', color: D.onMuted,
    letterSpacing: 2, marginBottom: 4,
  },
  fraction: { fontSize: 22, fontWeight: '800', color: D.onSurface },
  rewardSummary: { alignItems: 'flex-end' },
  rewardLabel: {
    fontSize: 10, fontWeight: '700', color: D.onMuted,
    letterSpacing: 2, marginBottom: 4,
  },
  rewardValue: { fontSize: 14, fontWeight: '700' },
  track: {
    height: 8, backgroundColor: D.surfaceHighest,
    borderRadius: 4, overflow: 'hidden', position: 'relative',
  },
  fill: {
    height: 8, borderRadius: 4,
    shadowOpacity: 0.6, shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 }, elevation: 3,
  },
  marker: {
    position: 'absolute', top: 0, bottom: 0,
    width: 1, backgroundColor: D.bg,
  },
  claimedNote: {
    fontSize: 11, color: D.green, marginTop: 8, fontWeight: '600',
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function TasksScreen() {
  const theme          = useTheme();
  const matchdayTasks  = useAppStore(s => s.matchdayTasks);
  const lobbyPoints    = useAppStore(s => s.lobbyPoints);
  const claimTask      = useAppStore(s => s.claimTask);

  const accent   = theme.club.primary;
  const onAccent = theme.club.onPrimary;

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>MATCHDAY</Text>
          <Text style={[s.headerTitleAccent, { color: accent }]}>OBJECTIVES</Text>
        </View>

        {/* Live points badge */}
        <View style={[s.ptsBadge, { borderColor: accent + '40', backgroundColor: accent + '12' }]}>
          <Text style={s.ptsLabel}>PTS</Text>
          <Text style={[s.ptsValue, { color: accent }]}>{lobbyPoints.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress header */}
        <ProgressHeader tasks={matchdayTasks} accent={accent} />

        {/* Section label */}
        <Text style={s.sectionLabel}>TODAY'S MISSIONS</Text>

        {/* Task cards */}
        {matchdayTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            accent={accent}
            onClaim={claimTask}
          />
        ))}

        {/* All claimed celebration */}
        {matchdayTasks.every(t => t.claimed) && (
          <View style={[s.allDone, { borderColor: accent + '40' }]}>
            <Text style={s.allDoneEmoji}>🏆</Text>
            <Text style={s.allDoneTitle}>All Missions Complete!</Text>
            <Text style={s.allDoneSub}>
              You've earned {matchdayTasks.reduce((sum, t) => sum + t.reward, 0).toLocaleString()} pts today
            </Text>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: D.bg },
  scroll:  { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: D.outline,
    marginBottom: 20,
  },
  backBtn:   { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  backArrow: { fontSize: 24, color: D.onSurface, fontWeight: '300' },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    fontSize: 11, fontWeight: '800', color: D.onVariant,
    letterSpacing: 3,
  },
  headerTitleAccent: {
    fontSize: 20, fontWeight: '900', letterSpacing: 2,
    marginTop: -2,
  },
  ptsBadge: {
    alignItems: 'center', borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
    minWidth: 64,
  },
  ptsLabel: {
    fontSize: 9, fontWeight: '700', color: D.onMuted,
    letterSpacing: 2,
  },
  ptsValue: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },

  // Section
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: D.onMuted,
    letterSpacing: 2.5, marginBottom: 12,
  },

  // All done
  allDone: {
    alignItems: 'center', padding: 28,
    backgroundColor: D.surface, borderRadius: 16,
    borderWidth: 1, marginTop: 8, gap: 8,
  },
  allDoneEmoji: { fontSize: 48 },
  allDoneTitle: {
    fontSize: 20, fontWeight: '800', color: D.onSurface,
  },
  allDoneSub: {
    fontSize: 14, color: D.onVariant, textAlign: 'center',
  },
});
