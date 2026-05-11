import React from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';

const { width: SW } = Dimensions.get('window');

// ── Static design tokens (always dark) ───────────────────────────────────────
const CARD_BG     = '#111613';
const GLASS_BG    = 'rgba(17,21,18,0.85)';
const GLASS_BORDER = 'rgba(255,255,255,0.07)';
const ON_SURFACE  = '#FFFFFF';
const ON_MUTED    = '#83958C';
const ON_VARIANT  = '#B9CBC1';

// ── Gradient helper ───────────────────────────────────────────────────────────
function getScreenGradient(clubId: string | null) {
  if (clubId === 'fcb') return {
    colors: ['#DC052D', '#5C0012', '#121212', '#121212'] as const,
    locations: [0, 0.35, 0.7, 1] as const,
  };
  if (clubId === 'svw') return {
    colors: ['#139B48', '#0A4A22', '#000000', '#000000'] as const,
    locations: [0, 0.35, 0.7, 1] as const,
  };
  if (clubId === 'bvb') return {
    colors: ['#FDE100', '#4A4200', '#000000', '#000000'] as const,
    locations: [0, 0.35, 0.7, 1] as const,
  };
  return {
    colors: ['#1A1A1A', '#121212', '#121212', '#121212'] as const,
    locations: [0, 0.3, 0.7, 1] as const,
  };
}

// ── Club-specific mock names for the podium ───────────────────────────────────
function getPodiumData(clubId: string | null) {
  if (clubId === 'fcb') {
    return [
      { rank: 2, name: 'Munich_Pro',    pts: 2980, medal: 'SILVER', medalColor: '#94A3B8', textColor: '#000000' },
      { rank: 1, name: 'King_Kane9',    pts: 3500, medal: 'GOLD',   medalColor: '#FFD700', textColor: '#000000' },
      { rank: 3, name: 'SoccerStar',    pts: 2750, medal: 'BRONZE', medalColor: '#C2773A', textColor: '#FFFFFF' },
    ];
  }
  if (clubId === 'svw') {
    return [
      { rank: 2, name: 'Werder_Fan',    pts: 2980, medal: 'SILVER', medalColor: '#94A3B8', textColor: '#000000' },
      { rank: 1, name: 'Ducksch_Star',  pts: 3500, medal: 'GOLD',   medalColor: '#FFD700', textColor: '#000000' },
      { rank: 3, name: 'SoccerStar',    pts: 2750, medal: 'BRONZE', medalColor: '#C2773A', textColor: '#FFFFFF' },
    ];
  }
  // BVB default
  return [
    { rank: 2, name: 'BVB_Fan_99',    pts: 2980, medal: 'SILVER', medalColor: '#94A3B8', textColor: '#000000' },
    { rank: 1, name: 'Marco_Reus11',  pts: 3500, medal: 'GOLD',   medalColor: '#FFD700', textColor: '#000000' },
    { rank: 3, name: 'YellowWall_4',  pts: 2750, medal: 'BRONZE', medalColor: '#C2773A', textColor: '#FFFFFF' },
  ];
}

// ── Full leaderboard data (ranks 4–20) ───────────────────────────────────────
// isCurrentUser flags rank 14 as the logged-in user — drives conditional theming.
interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  jersey: number;
  isCurrentUser: boolean;
  delta: string;
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 4,  name: 'Bavarian_Beast',  points: 2600, jersey: 9,  isCurrentUser: false, delta: '+45' },
  { rank: 5,  name: 'SVW_Legend',      points: 2450, jersey: 11, isCurrentUser: false, delta: '+38' },
  { rank: 6,  name: 'BundesligaPro',   points: 2310, jersey: 7,  isCurrentUser: false, delta: '+31' },
  { rank: 7,  name: 'KaiserFranz99',   points: 2180, jersey: 5,  isCurrentUser: false, delta: '+27' },
  { rank: 8,  name: 'TorjägerKing',    points: 2050, jersey: 10, isCurrentUser: false, delta: '+22' },
  { rank: 9,  name: 'GreenWhiteArmy',  points: 1920, jersey: 8,  isCurrentUser: false, delta: '+19' },
  { rank: 10, name: 'Ultras_BVB',      points: 1800, jersey: 23, isCurrentUser: false, delta: '+15' },
  { rank: 11, name: 'MiaSanMia_Fan',   points: 1680, jersey: 25, isCurrentUser: false, delta: '+14' },
  { rank: 12, name: 'WerderWatcher',   points: 1560, jersey: 17, isCurrentUser: false, delta: '+11' },
  { rank: 13, name: 'FootballFreak',   points: 1400, jersey: 3,  isCurrentUser: false, delta: '+8'  },
  { rank: 14, name: 'My_SQUAD_User',   points: 1240, jersey: 14, isCurrentUser: true,  delta: '+12' },
  { rank: 15, name: 'Dortmund_King',   points: 1120, jersey: 22, isCurrentUser: false, delta: '+6'  },
  { rank: 16, name: 'SoccerStar_PRO',  points: 1050, jersey: 7,  isCurrentUser: false, delta: '+4'  },
  { rank: 17, name: 'GoalMachine',     points: 980,  jersey: 19, isCurrentUser: false, delta: '+3'  },
  { rank: 18, name: 'OffsideTrap',     points: 870,  jersey: 4,  isCurrentUser: false, delta: '+2'  },
  { rank: 19, name: 'PressureMerkel',  points: 760,  jersey: 6,  isCurrentUser: false, delta: '+1'  },
  { rank: 20, name: 'SubstituteStar',  points: 640,  jersey: 13, isCurrentUser: false, delta: '—'   },
];

// ── Circular rank gauge ───────────────────────────────────────────────────────
// Approximates a conic-gradient arc using two clipped half-circles.
function RankGauge({ accent, pct = 0.85 }: { accent: string; pct?: number }) {
  const SIZE   = 120;
  const STROKE = 10;
  const INNER  = SIZE - STROKE * 2;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderWidth: STROKE, borderColor: 'rgba(255,255,255,0.08)',
      }} />

      {/* Filled arc — left half */}
      <View style={{ position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, width: SIZE / 2, height: SIZE, overflow: 'hidden' }}>
          <View style={{
            position: 'absolute', left: 0, top: 0,
            width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            borderWidth: STROKE, borderColor: accent,
            transform: [{ rotate: '-90deg' }],
          }} />
        </View>
        <View style={{ position: 'absolute', right: 0, top: 0, width: SIZE / 2, height: SIZE, overflow: 'hidden' }}>
          <View style={{
            position: 'absolute', right: 0, top: 0,
            width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            borderWidth: STROKE, borderColor: pct > 0.5 ? accent : 'transparent',
            transform: [{ rotate: `${(pct - 0.5) * 360}deg` }],
          }} />
        </View>
      </View>

      {/* Inner mask with rank text */}
      <View style={{
        width: INNER, height: INNER, borderRadius: INNER / 2,
        backgroundColor: CARD_BG,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 9, fontWeight: '700', color: ON_MUTED, letterSpacing: 1.5 }}>RANK</Text>
        <Text style={{ fontSize: 30, fontWeight: '900', color: ON_SURFACE, lineHeight: 34 }}>#14</Text>
      </View>

      {/* Accent dot at top of arc */}
      <View style={{
        position: 'absolute', top: 2, left: SIZE / 2 - 5,
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: accent,
        shadowColor: accent, shadowOpacity: 0.9, shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 }, elevation: 4,
      }} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const theme        = useTheme();
  const selectedClub = useAppStore(s => s.selectedClub);
  const insets       = useSafeAreaInsets();

  // Dynamic accent from club theme
  const accent   = theme.club.primary;    // #DC052D FCB | #FDE100 BVB | #1D9053 SVW
  const onAccent = theme.club.onPrimary;  // #FFF FCB/SVW | #000 BVB

  const gradient = getScreenGradient(selectedClub);
  const podium   = getPodiumData(selectedClub);

  // Podium order: 2nd (left), 1st (center), 3rd (right)
  const [second, first, third] = podium;

  // Header icon color: BVB has a yellow gradient top so icons need to be dark
  const headerIconColor = selectedClub === 'bvb' ? '#000000' : '#FFFFFF';

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <LinearGradient colors={gradient.colors} locations={gradient.locations} style={{ flex: 1 }}>
      <SafeAreaView style={s.root} edges={['top']}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.headerBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            {/* Back arrow SVG-style via unicode */}
            <Text style={[s.headerBtnText, { color: '#FFFFFF' }]}>{'←'}</Text>
          </TouchableOpacity>

          <Text style={[s.headerTitle, { color: '#FFFFFF' }]}>
            {'LIVE LEADERBOARD'}
          </Text>

          <TouchableOpacity
            style={s.headerBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Share leaderboard"
          >
            {/* Share icon */}
            <Text style={[s.headerBtnText, { color: '#FFFFFF' }]}>{'↗'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        >

          {/* ── HERO CARD ─────────────────────────────────────────────────── */}
          <View style={s.heroCard}>
            {/* Radial glow tint */}
            <View
              style={[s.heroGlow, { backgroundColor: accent + '18' }]}
              pointerEvents="none"
            />
            <View style={s.heroInner}>
              <RankGauge accent={accent} pct={0.85} />

              <View style={s.heroStats}>
                {/* Season badge */}
                <View style={[s.seasonBadge, {
                  borderColor: accent + '50',
                  backgroundColor: accent + '18',
                }]}>
                  <Text style={[s.seasonBadgeText, { color: accent }]}>Season Pro</Text>
                </View>

                <Text style={s.heroName}>My_SQUAD_User</Text>

                <View style={s.heroPointsRow}>
                  <Text style={s.heroPointsLabel}>Total Points</Text>
                  <Text style={[s.heroPointsValue, { color: ON_SURFACE }]}>1,240</Text>
                </View>

                {/* Progress bar */}
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, {
                    width: '65%',
                    backgroundColor: accent,
                    shadowColor: accent,
                  }]} />
                </View>
              </View>
            </View>
          </View>

          {/* ── PODIUM ────────────────────────────────────────────────────── */}
          <View style={s.podiumRow}>

            {/* 2nd Place — left */}
            <View style={s.podiumCol}>
              <View style={s.podiumAvatarWrap}>
                <View style={[s.medalBadge, { backgroundColor: second.medalColor }]}>
                  <Text style={[s.medalText, { color: second.textColor }]}>{second.medal}</Text>
                </View>
                <View style={[s.avatarRing, {
                  borderColor: second.medalColor,
                  width: 64, height: 64, borderRadius: 32, borderWidth: 2,
                }]}>
                  <View style={[s.avatarPlaceholder, { width: 56, height: 56, borderRadius: 28 }]}>
                    <Text style={s.avatarInitial}>{second.name[0]}</Text>
                  </View>
                </View>
              </View>
              <View style={[s.podiumCard, s.podiumCardSm, {
                backgroundColor: GLASS_BG, borderColor: GLASS_BORDER,
              }]}>
                <Text style={s.podiumRankNum}>2</Text>
                <Text style={s.podiumName} numberOfLines={1}>{second.name}</Text>
                <Text style={[s.podiumPts, { color: accent }]}>
                  {second.pts.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* 1st Place — center, tallest */}
            <View style={[s.podiumCol, s.podiumColFirst]}>
              <View style={s.podiumAvatarWrap}>
                <View style={[s.medalBadge, s.medalBadgeFirst, {
                  backgroundColor: accent,
                  shadowColor: accent,
                }]}>
                  <Text style={[s.medalText, { color: onAccent, fontSize: 11 }]}>GOLD</Text>
                </View>
                <View style={[s.avatarRing, {
                  borderColor: accent,
                  width: 80, height: 80, borderRadius: 40, borderWidth: 4,
                  shadowColor: accent, shadowOpacity: 0.6, shadowRadius: 16,
                  shadowOffset: { width: 0, height: 0 }, elevation: 10,
                }]}>
                  <View style={[s.avatarPlaceholder, { width: 68, height: 68, borderRadius: 34 }]}>
                    <Text style={[s.avatarInitial, { fontSize: 26 }]}>{first.name[0]}</Text>
                  </View>
                </View>
                {/* Crown star */}
                <Text style={[s.trophyIcon, { color: accent }]}>★</Text>
              </View>
              <View style={[s.podiumCard, s.podiumCardLg, {
                borderColor: accent + '50',
                backgroundColor: accent + '12',
              }]}>
                <Text style={[s.podiumRankNum, { color: accent }]}>1</Text>
                <Text style={[s.podiumName, { fontWeight: '900' }]} numberOfLines={1}>
                  {first.name}
                </Text>
                <Text style={[s.podiumPts, { color: accent, fontSize: 16, fontWeight: '900' }]}>
                  {first.pts.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* 3rd Place — right */}
            <View style={s.podiumCol}>
              <View style={s.podiumAvatarWrap}>
                <View style={[s.medalBadge, { backgroundColor: third.medalColor }]}>
                  <Text style={[s.medalText, { color: third.textColor }]}>{third.medal}</Text>
                </View>
                <View style={[s.avatarRing, {
                  borderColor: third.medalColor,
                  width: 64, height: 64, borderRadius: 32, borderWidth: 2,
                }]}>
                  <View style={[s.avatarPlaceholder, {
                    width: 56, height: 56, borderRadius: 28, opacity: 0.85,
                  }]}>
                    <Text style={s.avatarInitial}>{third.name[0]}</Text>
                  </View>
                </View>
              </View>
              <View style={[s.podiumCard, s.podiumCardSm, {
                backgroundColor: GLASS_BG, borderColor: GLASS_BORDER,
              }]}>
                <Text style={s.podiumRankNum}>3</Text>
                <Text style={s.podiumName} numberOfLines={1}>{third.name}</Text>
                <Text style={[s.podiumPts, { color: accent }]}>
                  {third.pts.toLocaleString()}
                </Text>
              </View>
            </View>

          </View>

          {/* ── FULL LEADERBOARD ──────────────────────────────────────────── */}
          <View style={s.listHeader}>
            <Text style={s.listTitle}>FULL LEADERBOARD</Text>
            <Text style={s.listUpdated}>Updated 2m ago</Text>
          </View>

          {/* Dynamic list — ranks 4 through 20.
               isCurrentUser rows get solid accent background + onAccent text.
               All other rows get the dark glassmorphic treatment. */}
          {LEADERBOARD_DATA.map((item, i) => {
            const isLast = i === LEADERBOARD_DATA.length - 1;

            if (item.isCurrentUser) {
              // ── Highlighted "YOU" row ──────────────────────────────────
              return (
                <View
                  key={item.rank}
                  style={[s.userRow, {
                    backgroundColor: accent,
                    shadowColor: accent,
                  }]}
                >
                  <Text style={[s.userRank, { color: onAccent }]}>{item.rank}</Text>

                  <View style={[s.userAvatar, {
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    borderColor: 'rgba(0,0,0,0.3)',
                  }]}>
                    <Text style={[s.userAvatarIcon, { color: onAccent }]}>👤</Text>
                  </View>

                  <View style={s.userInfo}>
                    <Text style={[s.userName, { color: onAccent }]}>{item.name}</Text>
                    <View style={s.userJerseyRow}>
                      <Text style={[s.userJersey, { color: onAccent + 'CC' }]}>
                        Jersey #{item.jersey}
                      </Text>
                      <View style={[s.youBadge, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
                        <Text style={[s.youBadgeText, { color: onAccent }]}>YOU</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.userPtsWrap}>
                    <Text style={[s.userPts, { color: onAccent }]}>
                      {item.points.toLocaleString()}
                    </Text>
                    <Text style={[s.userPtsDelta, { color: onAccent + 'AA' }]}>
                      +{item.delta} PTS
                    </Text>
                  </View>
                </View>
              );
            }

            // ── Standard glassmorphic row ────────────────────────────────
            return (
              <View
                key={item.rank}
                style={[s.otherRow, { opacity: isLast ? 0.5 : 1 }]}
              >
                <Text style={s.otherRank}>{item.rank}</Text>
                <View style={s.otherAvatar} />
                <View style={s.otherInfo}>
                  <Text style={s.otherName}>{item.name}</Text>
                  <Text style={s.otherJersey}>Jersey #{item.jersey}</Text>
                </View>
                <View style={s.otherPtsWrap}>
                  <Text style={s.otherPts}>{item.points.toLocaleString()}</Text>
                  <Text style={s.otherDelta}>{item.delta} PTS</Text>
                </View>
              </View>
            );
          })}

        </ScrollView>

        {/* ── STICKY REFRESH BUTTON ────────────────────────────────────────── */}
        <View style={[s.stickyFooter, { paddingBottom: insets.bottom + 8 }]}>
          {/* Fade scrim above button */}
          <LinearGradient
            colors={['rgba(12,21,17,0)', 'rgba(12,21,17,0.92)', 'rgba(12,21,17,1)']}
            style={s.footerFade}
            pointerEvents="none"
          />
          <TouchableOpacity
            style={[s.refreshBtn, {
              backgroundColor: accent,
              shadowColor: accent,
            }]}
            onPress={handleRefresh}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Refresh standings"
          >
            <Text style={[s.refreshIcon, { color: onAccent }]}>↻</Text>
            <Text style={[s.refreshText, { color: onAccent }]}>REFRESH STANDINGS</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 22, fontWeight: '300' },
  headerTitle:   {
    flex: 1, textAlign: 'center',
    fontSize: 15, fontWeight: '900', letterSpacing: 3, lineHeight: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  // ── Hero card ────────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden', marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  heroGlow: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
  },
  heroInner: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, gap: 16,
  },
  heroStats:       { flex: 1, gap: 6 },
  seasonBadge:     {
    alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  seasonBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  heroName:        { fontSize: 20, fontWeight: '900', color: ON_SURFACE, letterSpacing: 0.3 },
  heroPointsRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroPointsLabel: { fontSize: 13, color: ON_VARIANT },
  heroPointsValue: { fontSize: 18, fontWeight: '800' },
  progressTrack:   {
    height: 6, backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill:    {
    height: 6, borderRadius: 3,
    shadowOpacity: 0.8, shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },

  // ── Podium ───────────────────────────────────────────────────────────────────
  podiumRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    marginBottom: 28, paddingHorizontal: 4,
  },
  podiumCol:      { flex: 1, alignItems: 'center' },
  podiumColFirst: { zIndex: 2 },

  podiumAvatarWrap: { alignItems: 'center', marginBottom: 8, position: 'relative' },

  medalBadge: {
    position: 'absolute', top: -14, zIndex: 3,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  },
  medalBadgeFirst: {
    shadowOpacity: 0.7, shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  medalText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  avatarRing: {
    padding: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#2A3530',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20, fontWeight: '900', color: ON_SURFACE,
  },

  trophyIcon: {
    position: 'absolute', bottom: -4, right: -4,
    fontSize: 18,
  },

  podiumCard: {
    width: '100%', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderBottomWidth: 0,
    paddingVertical: 10, paddingHorizontal: 4,
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  podiumCardSm: { minHeight: 72 },
  podiumCardLg: { minHeight: 96 },

  podiumRankNum: {
    fontSize: 11, fontWeight: '900', color: ON_MUTED,
    letterSpacing: 0.5, marginBottom: 2,
  },
  podiumName: {
    fontSize: 10, fontWeight: '700', color: ON_SURFACE,
    textAlign: 'center', marginBottom: 2,
  },
  podiumPts: { fontSize: 13, fontWeight: '800', textAlign: 'center' },

  // ── List header ──────────────────────────────────────────────────────────────
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle:   { fontSize: 14, fontWeight: '900', color: ON_SURFACE, letterSpacing: 2 },
  listUpdated: { fontSize: 11, color: ON_MUTED },

  // ── Current user row (highlighted) ───────────────────────────────────────────
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 14, marginBottom: 8,
    shadowOpacity: 0.35, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  userRank:       { fontSize: 22, fontWeight: '900', width: 36, fontStyle: 'italic' },
  userAvatar:     {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarIcon: { fontSize: 20 },
  userInfo:       { flex: 1 },
  userName:       { fontSize: 15, fontWeight: '900' },
  userJerseyRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  userJersey:     { fontSize: 10, fontWeight: '600' },
  youBadge:       {
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
  youBadgeText:   { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  userPtsWrap:    { alignItems: 'flex-end' },
  userPts:        { fontSize: 18, fontWeight: '900' },
  userPtsDelta:   { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  // ── Other rows ───────────────────────────────────────────────────────────────
  otherRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: GLASS_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    borderRadius: 16, padding: 14, marginBottom: 8,
  },
  otherRank:   { fontSize: 14, fontWeight: '700', color: ON_MUTED, width: 36 },
  otherAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#232C28', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 12,
  },
  otherInfo:   { flex: 1 },
  otherName:   { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  otherJersey: { fontSize: 10, color: ON_MUTED, marginTop: 1 },
  otherPts:    { fontSize: 15, fontWeight: '700', color: ON_SURFACE },
  otherPtsWrap: { alignItems: 'flex-end' },
  otherDelta:  { fontSize: 9, fontWeight: '600', color: ON_MUTED, marginTop: 1 },

  // ── Sticky footer ─────────────────────────────────────────────────────────────
  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 8,
  },
  footerFade: {
    position: 'absolute', top: -40, left: 0, right: 0, height: 48,
  },
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 60, borderRadius: 16, gap: 10,
    shadowOpacity: 0.4, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 12,
    borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.25)',
  },
  refreshIcon: { fontSize: 20, fontWeight: '900' },
  refreshText: { fontSize: 14, fontWeight: '900', letterSpacing: 3 },
});
