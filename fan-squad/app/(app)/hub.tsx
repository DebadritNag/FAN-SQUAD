import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  ImageBackground,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Link } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Colors, Shadows } from '../../constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 20;
const COL_GAP = 12;
const GRID_CARD_SIZE = (SCREEN_WIDTH - CARD_PADDING * 2 - COL_GAP) / 2;

const IMG_MATCH_CENTER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA5oBqO4HSWgOnYylO9qR0Ak_Tr_C3mA4HdbedrLARvngD33SASpsgFt9NsA5TnNo8PSU-KVutNgE1B6clBiaTGMeL-MnC1IW82TK7pIuRlLFTALcXodGK43vlBtrmlG7pArqNHjGJgEZbQYTKL9xr_bAnMHpM1P--4xqM0WAd6VKnfBGaG5hQDuEgUcnS_nPryHErCwz6fj4wA0cuEncYiCuUaw4LCQ3LhTEibpBozjv2-pRFKAMMFKoY6WWCOj-aiKUTFnF9cgw';
const IMG_DRAFT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAYneXakZ6SyUvDnzcg-DZifQMZpeReCSTN8ZK6YOD3mz086ycbH1PWBnpf_TBAiPjc9LKkfMKIxHhBScymkzAohMHiK2VGpk49ztxHDyk8dKbI3wgNSHQwVgEtmfmVt-EOwBIPRjUDmGk-1-5fk782Brq7CRII-3FdeBS9imFHE2t_r2wivdo5pLTSGm0ZkJU-ebXD28IKIgmBpl4SbxD5nlrFPLPTOKJmxAE8D1Dgo2nH9YVKsHeuTVupzpY-Y1gFmAwQwxHp_A';
const IMG_PROP_LOCKER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC2uT4pajFTkSKEndqQghQy1k6JCQLxvzhCuBPeqWJKXw8JTz7-d61O6eD74Ka8LmBGLSdv8b0nFFb4QIbh2jyF-fFbyeQoxudQ0TnUys_zsQGP0DYFSTG6sHCqjNjMwntcuiHPIlYJxaSFTjed5cQzgi_Yp94H3QjhZtQS9HffNqzhs5p-GRVYzIRufpze7mOnr-OD08htWh0rBGlajH_r6Uy2wupZJDO7Jce2XBDr2UgDHZn3VUGV64F9YozVtAvXtq_jDPN6hQ';
const IMG_CLUB_PULSE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCjWiw32UfmAi0NUwZlu9jw8Bsps4TGHOmy20uvyw81CUlhHMN0pz_L103oNWEHwIOEZoh9HzcKS03pdyjGVIhv5-EunWUdCNW-PMLEz-7-NZImN-KUuHIUGVLP3zfR36CE2fyvCE_dtG8KJ78ObYdcja8jzbhiixOz1bwtavJ6_0vEgJVEDXY3uUmFuMpnBpeEFYlgNlJyxEWIxz02q2WBWUw-Ncs-RxAoJ_hYkFlcb8qf1UKlmt1Mis7iytMWL19Rkz50EW_6Bw';
const IMG_USER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAU1Cn4lalWwXeoO5ijprawvM4UPABDJCIWc04jej_mhWk_3OY1LcUUadKJoX__TNobLd7Ne1w8PsdwmjdEmcOVkqXjfHGtexxdzjiZSZOlSV02oFuEHKvwti6u50W6ITVekbPZXqsQ2ABTGh3H7p7jRQh6sOCYYFoTxPP3pPvqvZfM-a7Y-qDWaELPpDL2aI5S46ki-t0J-dx2OgeFqTHaL6LtvhvddyXGoRkhse5RedRilYfLdBxaD9BCzX1uU-FjnnCkfKLC8Q';

// ── Club logo assets (local PNGs — explicit require for bundler) ──────────────
const CLUB_LOGO_ASSETS: Record<string, any> = {
  fcb: require('../../assets/images/bayern.png'),
  bvb: require('../../assets/images/dortmund.png'),
  svw: require('../../assets/images/bremen.png'),
};

// ── Pulsing live dot ──────────────────────────────────────────────────────────
function LiveDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.liveDotWrap}>
      <Animated.View style={[styles.liveDotPing, { backgroundColor: color, opacity: pulse }]} />
      <View style={[styles.liveDotCore, { backgroundColor: color }]} />
    </View>
  );
}

const NAV_ITEMS = [
  { icon: '⌂', label: 'Home',     route: null                         },
  { icon: '📊', label: 'Locker',   route: '/(app)/prop-locker' as const },
  { icon: '👥', label: 'Draft',    route: '/(app)/draft'        as const },
  { icon: '📺', label: 'Watch',    route: '/(app)/live'         as const },
  { icon: '🎯', label: 'Missions', route: '/(app)/tasks'        as const },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function HubScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, lobbyPoints, currentEvent, connectWebSocket, selectedClub } = useAppStore();

  const accent   = theme.club.primary;
  const onAccent = theme.club.onPrimary;
  const isBVB    = selectedClub === 'bvb';
  const isFCB    = selectedClub === 'fcb';
  const isSVW    = selectedClub === 'svw';

  // ── Dynamic background gradient — bleeds edge-to-edge behind the notch ───
  // Bayern: vibrant red crown → deep crimson → charcoal
  // BVB:    electric yellow → warm dark gold → pure black
  // SVW:    Werder green → forest green → pure black
  // Other:  neutral dark
  const backgroundColors: [string, string, string, string] = isFCB
    ? ['#DC052D', '#5C0012', '#121212', '#121212']
    : isBVB
    ? ['#FDE100', '#4A4200', '#000000', '#000000']
    : isSVW
    ? ['#139B48', '#0A4A22', '#000000', '#000000']
    : ['#1A1A1A', '#121212', '#121212', '#121212'];

  const gradientLocations: [number, number, number, number] = isFCB
    ? [0, 0.4, 0.75, 1]
    : isBVB
    ? [0, 0.35, 0.7, 1]
    : isSVW
    ? [0, 0.35, 0.7, 1]
    : [0, 0.3, 0.7, 1];

  // Header text contrast — BVB yellow top needs black text; green & red are fine with white
  const headerTextColor = isBVB ? '#000000' : '#FFFFFF';

  // ── Club-aware surface tokens ─────────────────────────────────────────────
  const cardBg      = isBVB ? '#111111' : Colors.surfaceContainer;
  const cardBorder  = isBVB ? '#1A1A1A' : 'rgba(255,255,255,0.05)';
  const tickerBg    = isBVB ? '#111111' : Colors.surfaceHigh;
  const tickerBorder= isBVB ? '#1A1A1A' : 'rgba(255,255,255,0.08)';
  const navBg       = isBVB ? '#000000' : Colors.background;
  const onSurface   = '#FFFFFF';
  const onMuted     = isBVB ? '#B3B3B3' : Colors.onSurfaceMuted;

  // Gradient overlay colours for image cards
  const gradientEnd = isBVB ? '#000000' : Colors.background;

  useEffect(() => { connectWebSocket(); }, []);

  return (
    // LinearGradient covers the full screen including the status bar area.
    // The inner View applies the safe-area top inset so content clears the notch,
    // while the gradient colour bleeds all the way to the top edge.
    <LinearGradient
      colors={backgroundColors}
      locations={gradientLocations}
      style={styles.root}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={[styles.safeContent, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Link href="/(app)/profile" asChild>
            <TouchableOpacity activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="View profile">
              <View style={[styles.avatarRing, { borderColor: isBVB ? '#1A1A1A' : 'rgba(255,255,255,0.12)' }]}>
                <Image source={{ uri: IMG_USER_AVATAR }} style={styles.avatarImg} accessibilityLabel="User profile" />
              </View>
            </TouchableOpacity>
          </Link>

          <Text style={styles.brandTitle}>
            <Text style={{
              color: accent,
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}>FAN </Text>
            <Text style={{
              color: '#FFFFFF',
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}>SQUAD</Text>
          </Text>

          {/* Spacer — mirrors the 40×40 avatar ring on the left so the title stays centered */}
          <View style={{ width: 40, height: 40 }} />
        </View>

        {/* ── WELCOME ─────────────────────────────────────────────────── */}
        <View style={styles.welcome}>
          <Text style={[styles.welcomeLine, { color: headerTextColor }]}>Welcome back,</Text>
          <Text style={[styles.welcomeAccent, { color: headerTextColor }]}>Captain.</Text>
        </View>

        {/* ── STATS ROW ───────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {[
            { label: 'SQUAD',  value: '8/11',  isAccent: false },
            { label: 'STREAK', value: 'W3',    isAccent: true  },
            { label: 'PTS',    value: lobbyPoints > 0 ? lobbyPoints.toLocaleString() : '4,280', isAccent: false },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.statLabel, { color: onMuted }]}>{s.label}</Text>
              <View style={styles.statValueRow}>
                {s.label === 'STREAK' && (
                  <Text style={[styles.streakFire, { color: accent }]}>🔥 </Text>
                )}
                <Text style={[styles.statValue, { color: s.isAccent ? accent : onSurface }]}>
                  {s.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── MATCH CENTER (featured card) ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.matchCard, { borderColor: isBVB ? '#1A1A1A' : 'rgba(255,255,255,0.08)' }]}
          onPress={() => router.push('/(app)/live')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Enter Match Center"
        >
          <ImageBackground
            source={{ uri: IMG_MATCH_CENTER }}
            style={styles.matchBg}
            imageStyle={styles.matchBgImg}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)', gradientEnd]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0.1 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.matchTop}>
              <View style={[styles.liveChip, { borderColor: accent }]}>
                <LiveDot color={accent} />
                <Text style={[styles.liveText, { color: accent }]}>LIVE NOW</Text>
              </View>
            </View>
            <View style={styles.matchBottom}>
              <View>
                <Text style={[styles.matchTitle, { color: onSurface }]}>Match{'\n'}Center</Text>
                <Text style={[styles.matchSub, { color: onMuted }]}>
                  {currentEvent?.currentResult || 'BVB vs FCB'} • {currentEvent ? 'LIVE' : '2nd Half'}
                </Text>
              </View>
              <View style={[styles.enterPill, { borderColor: accent + '70' }]}>
                <Text style={[styles.enterText, { color: accent }]}>ENTER →</Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* ── 2-COLUMN GRID ────────────────────────────────────────────── */}
        <View style={styles.grid}>
          {/* Draft Lobby */}
          <TouchableOpacity
            style={[styles.gridCard, { borderColor: isBVB ? '#1A1A1A' : 'rgba(255,255,255,0.08)' }]}
            onPress={() => router.push('/(app)/draft')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Draft Lobby"
          >
            <ImageBackground source={{ uri: IMG_DRAFT }} style={styles.gridBg} imageStyle={styles.gridBgImg} resizeMode="cover">
              <LinearGradient
                colors={['transparent', gradientEnd]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={styles.gridContent}>
                <Text style={styles.gridIcon}>👥</Text>
                <Text style={[styles.gridTitle, { color: onSurface }]}>Draft{'\n'}Lobby</Text>
                <Text style={[styles.gridEnter, { color: onMuted }]}>ENTER →</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          {/* Prop Locker */}
          <TouchableOpacity
            style={[styles.gridCard, { borderColor: isBVB ? '#1A1A1A' : 'rgba(255,255,255,0.08)' }]}
            onPress={() => router.push('/(app)/prop-locker')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Prop Locker"
          >
            <ImageBackground source={{ uri: IMG_PROP_LOCKER }} style={styles.gridBg} imageStyle={styles.gridBgImg} resizeMode="cover">
              <LinearGradient
                colors={['transparent', gradientEnd]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={styles.gridContent}>
                <Text style={styles.gridIcon}>📊</Text>
                <Text style={[styles.gridTitle, { color: onSurface }]}>Prop{'\n'}Locker</Text>
                <Text style={[styles.gridEnter, { color: onMuted }]}>ENTER →</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* ── CLUB PULSE (wide) ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.pulseCard, { borderColor: isBVB ? '#1A1A1A' : 'rgba(255,255,255,0.08)' }]}
          onPress={() => router.push('/(app)/pulse')}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Club Pulse"
        >
          <ImageBackground source={{ uri: IMG_CLUB_PULSE }} style={styles.pulseBg} imageStyle={styles.pulseBgImg} resizeMode="cover">
            <LinearGradient
              colors={[gradientEnd, 'rgba(0,0,0,0.75)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <View style={styles.pulseLeft}>
              <Text style={styles.gridIcon}>❤️</Text>
              <Text style={[styles.gridTitle, { color: onSurface }]}>Club Pulse</Text>
            </View>
            <Text style={[styles.gridEnter, { color: onMuted }]}>ENTER →</Text>
          </ImageBackground>
        </TouchableOpacity>

        <View style={{ height: 136 }} />
      </ScrollView>

      {/* ── BOTTOM BAR (fixed) ─────────────────────────────────────────── */}
      <View style={styles.bottomBar}>

        {/* Kickoff ticker */}
        <View style={[styles.ticker, { backgroundColor: tickerBg, borderColor: tickerBorder }]}>
          <View style={styles.tickerLeft}>
            {/* Club logo badge */}
            {CLUB_LOGO_ASSETS[selectedClub ?? ''] && (
              <Image
                source={CLUB_LOGO_ASSETS[selectedClub ?? '']}
                style={styles.tickerClubLogo}
                resizeMode="contain"
                accessibilityLabel="Club logo"
              />
            )}
            <View>
              <Text style={[styles.tickerLabel, { color: onMuted }]}>NEXT KICKOFF</Text>
              <Text style={[styles.tickerMatch, { color: onSurface }]}>BVB vs FCB • Tomorrow 18:30</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.predictBtn, { backgroundColor: accent, shadowColor: accent }]}
            onPress={() => router.push('/(app)/prop-locker')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Predict"
          >
            <Text style={[styles.predictText, { color: onAccent }]}>PREDICT</Text>
          </TouchableOpacity>
        </View>

        {/* Nav bar */}
        <View style={[styles.navBar, { backgroundColor: backgroundColors[3] }]}>
          {NAV_ITEMS.map((item, i) => {
            const active = i === 0;
            return (
              <TouchableOpacity
                key={item.label}
                style={styles.navItem}
                onPress={() => item.route && router.push(item.route)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Text style={[styles.navIcon, { color: active ? accent : onMuted }]}>
                  {item.icon}
                </Text>
                <Text style={[styles.navLabel, { color: active ? accent : onMuted }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      </View>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — layout only; all colours injected inline above
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  // Inner wrapper that applies safe-area insets — gradient bleeds behind notch
  safeContent: { flex: 1 },
  scroll: { paddingHorizontal: CARD_PADDING, paddingTop: 4 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  avatarRing: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40 },

  // ── Welcome ──
  welcome: { marginTop: 4, marginBottom: 16 },
  welcomeLine: { fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.8 },
  welcomeAccent: { fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.8 },

  // ── Stats ──
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, borderWidth: 1, borderRadius: 16,
    padding: 14, minHeight: 80, justifyContent: 'space-between',
  },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  statValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  streakFire: { fontSize: 18 },
  statValue: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },

  // ── Match Center card ──
  matchCard: {
    borderRadius: 28, overflow: 'hidden',
    borderWidth: 1, marginBottom: 12,
    ...Shadows.card,
  },
  matchBg: { minHeight: 300, justifyContent: 'space-between', padding: 20 },
  matchBgImg: { opacity: 0.6 },
  matchTop: { flexDirection: 'row' },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#000000',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1.5,
  },
  liveDotWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  liveDotPing: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  liveDotCore: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  matchBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginTop: 80,
  },
  matchTitle: { fontSize: 32, fontWeight: '800', lineHeight: 36, letterSpacing: -0.5 },
  matchSub: { fontSize: 14, marginTop: 4 },
  enterPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  enterText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },

  // ── 2-col grid ──
  grid: { flexDirection: 'row', gap: COL_GAP, marginBottom: 12 },
  gridCard: {
    width: GRID_CARD_SIZE, height: GRID_CARD_SIZE,
    borderRadius: 28, overflow: 'hidden', borderWidth: 1,
    ...Shadows.card,
  },
  gridBg: { flex: 1, justifyContent: 'flex-end' },
  gridBgImg: { opacity: 0.45 },
  gridContent: { padding: 20, gap: 6 },
  gridIcon: { fontSize: 22, marginBottom: 2 },
  gridTitle: { fontSize: 20, fontWeight: '800', lineHeight: 24, letterSpacing: -0.3 },
  gridEnter: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 4 },

  // ── Club Pulse wide card ──
  pulseCard: {
    borderRadius: 28, overflow: 'hidden',
    borderWidth: 1, marginBottom: 12,
    ...Shadows.card,
  },
  pulseBg: {
    height: 100, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  pulseBgImg: { opacity: 0.4 },
  pulseLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // ── Bottom bar ──
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  ticker: {
    borderTopWidth: 1, borderBottomWidth: 1,
    paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  tickerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1,
  },
  tickerClubLogo: {
    width: 28, height: 28,
  },
  tickerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  tickerMatch: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  predictBtn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  predictText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  navBar: {
    paddingTop: 10, paddingBottom: 24, paddingHorizontal: 8,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 2, flex: 1 },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
