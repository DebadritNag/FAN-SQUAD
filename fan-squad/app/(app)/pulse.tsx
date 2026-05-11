import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';

const { width: SW } = Dimensions.get('window');

// ── Pulse feed data — 5 items per club, keyed by club ID ──────────────────────
interface PulseItem {
  id: string;
  tag: string;
  tagEmoji: string;
  title: string;
  bullets: [string, string, string];
  timestamp: string;
  likes: number;
  comments: string;
  bgImage: any; // require() asset
}

const PULSE_FEED_DATA: Record<string, PulseItem[]> = {
  fcb: [
    {
      id: 'bay-1', tag: 'INJURY ALERT', tagEmoji: '🚨', title: 'Musiala — Hamstring',
      bullets: ["Pulled up in the 38' minute of training.", 'Scans tomorrow morning at the Säbener facility.', 'Likely 2–3 weeks out — out of the Dortmund derby.'],
      timestamp: '12 MIN AGO', likes: 1300, comments: '124',
      bgImage: require('../../assets/images/Pulse/pulse1.jpg'),
    },
    {
      id: 'bay-2', tag: 'TRANSFER RUMOR', tagEmoji: '🔥', title: 'Bayern Eyes Premier League Star',
      bullets: ["Negotiations reportedly underway with the player's agent.", '€80M price tag discussed in initial meetings.', 'Player open to Bundesliga move this summer.'],
      timestamp: '45 MIN AGO', likes: 2100, comments: '318',
      bgImage: require('../../assets/images/Pulse/pulse2.jpg'),
    },
    {
      id: 'bay-3', tag: 'MATCH REPORT', tagEmoji: '⚽', title: 'Kane Hat-Trick Destroys Leverkusen',
      bullets: ['Harry Kane netted three goals in the first half.', 'Bayern extend their Bundesliga lead to 8 points.', 'Neuer kept a clean sheet with 4 key saves.'],
      timestamp: '2 HRS AGO', likes: 5700, comments: '892',
      bgImage: require('../../assets/images/Pulse/pulse3.jpg'),
    },
    {
      id: 'bay-4', tag: 'TACTICAL INSIGHT', tagEmoji: '🎯', title: 'New 3-4-3 Formation Paying Off',
      bullets: ['3-4-3 system unlocks devastating wing play.', 'Fullbacks creating 40% more chances per game.', 'Opponents struggling to adapt to the new shape.'],
      timestamp: '4 HRS AGO', likes: 987, comments: '76',
      bgImage: require('../../assets/images/Pulse/pulse4.jpg'),
    },
    {
      id: 'bay-5', tag: 'UCL NEWS', tagEmoji: '🏆', title: 'Bayern vs Real Madrid: UCL Draw',
      bullets: ['Bayern drawn against Real Madrid in Round of 16.', "Dortmund face PSG in a repeat of last year's final.", 'Bundesliga clubs praised for European performances.'],
      timestamp: '6 HRS AGO', likes: 8400, comments: '1.2K',
      bgImage: require('../../assets/images/Pulse/pulse5.jpg'),
    },
  ],

  bvb: [
    {
      id: 'bvb-1', tag: 'FAN CULTURE', tagEmoji: '💛', title: 'Yellow Wall Prepares Epic Tifo',
      bullets: ['South Stand ultras reveal massive flag plans.', 'Dedicated to the 1997 UCL win.', 'Expect massive pyrotechnics before kickoff.'],
      timestamp: '1 HR AGO', likes: 8900, comments: '450',
      bgImage: require('../../assets/images/Pulse/pulse6.jpg'),
    },
    {
      id: 'bvb-2', tag: 'PLAYER STATS', tagEmoji: '⚡', title: 'Adeyemi Clocks 36.5 km/h',
      bullets: ['Fastest sprint in the Bundesliga this month.', 'Broke the defensive line 4 times.', 'Man of the Match performance against Leipzig.'],
      timestamp: '3 HRS AGO', likes: 4200, comments: '210',
      bgImage: require('../../assets/images/Pulse/pulse7.jpg'),
    },
    {
      id: 'bvb-3', tag: 'TRANSFER RUMOR', tagEmoji: '🔥', title: 'BVB Scouting Dutch Winger',
      bullets: ['Scouts spotted at Eredivisie top clash.', 'Looking for a long-term replacement on the right flank.', 'Expected fee around €35M.'],
      timestamp: '5 HRS AGO', likes: 3500, comments: '188',
      bgImage: require('../../assets/images/Pulse/pulse8.jpg'),
    },
    {
      id: 'bvb-4', tag: 'CONTRACT NEWS', tagEmoji: '✍️', title: 'Brandt Signs Extension',
      bullets: ['Julian Brandt extends contract until 2028.', 'Ends speculation of a Premier League move.', 'States he wants to win the Meisterschale.'],
      timestamp: '8 HRS AGO', likes: 12100, comments: '1.1K',
      bgImage: require('../../assets/images/Pulse/pulse9.jpg'),
    },
    {
      id: 'bvb-5', tag: 'DERBY PREVIEW', tagEmoji: '⚔️', title: 'Revierderby Tactics Revealed',
      bullets: ['Sahin plans to exploit the high defensive line.', 'Midfield battle will decide the match.', 'Fans warned to arrive 2 hours early.'],
      timestamp: '12 HRS AGO', likes: 6400, comments: '530',
      bgImage: require('../../assets/images/Pulse/pulse10.jpg'),
    },
  ],

  svw: [
    {
      id: 'svw-1', tag: 'MATCH HIGHLIGHT', tagEmoji: '🎯', title: 'Ducksch Free-Kick Magic',
      bullets: ['Top-corner strike from 25 yards out.', 'Secured the 3 points away from home.', 'Nominated for Goal of the Month.'],
      timestamp: '45 MIN AGO', likes: 3100, comments: '180',
      bgImage: require('../../assets/images/Pulse/pulse11.jpg'),
    },
    {
      id: 'svw-2', tag: 'CLUB NEWS', tagEmoji: '🏟️', title: 'Weserstadion Upgrades',
      bullets: ['New LED floodlight system installed.', 'Increased capacity in the East Stand.', 'Ready for the upcoming season.'],
      timestamp: '5 HRS AGO', likes: 1800, comments: '95',
      bgImage: require('../../assets/images/Pulse/pulse12.jpg'),
    },
    {
      id: 'svw-3', tag: 'HISTORIC KIT', tagEmoji: '👕', title: '125th Anniversary Kit Reveal',
      bullets: ['Classic dark green with retro crest.', 'Limited run of 5,000 shirts globally.', 'Players to wear it next matchday.'],
      timestamp: '6 HRS AGO', likes: 4800, comments: '322',
      bgImage: require('../../assets/images/Pulse/pulse13.jpg'),
    },
    {
      id: 'svw-4', tag: 'INTERVIEW', tagEmoji: '🎙️', title: 'Weiser: "Aiming for Europe"',
      bullets: ['Mitchell Weiser confident in squad depth.', 'Believes Conference League is achievable.', "Praises the manager's tactical shift."],
      timestamp: '9 HRS AGO', likes: 2200, comments: '115',
      bgImage: require('../../assets/images/Pulse/pulse14.jpg'),
    },
    {
      id: 'svw-5', tag: 'TACTICAL INSIGHT', tagEmoji: '🧠', title: 'The Midfield Diamond',
      bullets: ["Ole Werner's diamond shape overloading the center.", 'Schmid acting as the primary playmaker.', 'Wingbacks providing 80% of the width.'],
      timestamp: '14 HRS AGO', likes: 1500, comments: '88',
      bgImage: require('../../assets/images/Pulse/pulse15.jpg'),
    },
  ],
};

// ── Format like count ─────────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

// ── Single full-screen card ───────────────────────────────────────────────────
function PulseCard({
  item,
  accent,
  onAccent,
  bottomPadding,
  screenHeight,
  onComment,
}: {
  item: PulseItem;
  accent: string;
  onAccent: string;
  bottomPadding: number;
  screenHeight: number;
  onComment: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [isBoosted, setIsBoosted] = useState(false);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked(prev => {
      setLikeCount(c => prev ? c - 1 : c + 1);
      return !prev;
    });
  };

  const handleBoost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBoosted(prev => !prev);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Share triggered:', item.id);
  };

  return (
    <View style={[s.slide, { height: screenHeight, width: SW, backgroundColor: '#000' }]}>
      {/* ── Background image — pinned to all edges ── */}
      <ImageBackground
        source={item.bgImage}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      {/* Dark cinematic overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Foreground content — fills screen, respects safe areas ── */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>

        {/* ── News Card — constrained to left 78% so it never overlaps the action bar ── */}
        <View style={[s.cardWrap, { paddingBottom: bottomPadding + 20 }]}>
          <View style={s.card}>
            <View style={s.cardGlowBlob} pointerEvents="none" />

            {/* Header: tag + timestamp */}
            <View style={s.cardHeader}>
              <View style={[s.tagPill, { backgroundColor: accent + '30' }]}>
                <Text style={s.tagEmoji}>{item.tagEmoji}</Text>
                <Text style={[s.tagText, { color: accent }]}>{item.tag}</Text>
              </View>
              <Text style={s.timestamp}>{item.timestamp}</Text>
            </View>

            {/* Headline */}
            <Text style={s.headline}>{item.title}</Text>

            {/* Bullets — limited to 2 */}
            <View style={s.bullets}>
              {item.bullets.slice(0, 2).map((b, i) => (
                <View key={i} style={s.bulletRow}>
                  <View style={[s.bulletDot, { backgroundColor: accent }]} />
                  <Text style={s.bulletText}>{b}</Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={s.cardFooter}>
              <View style={s.footerLeft}>
                <View style={[s.aiBadge, { borderColor: accent + '40', backgroundColor: accent + '18' }]}>
                  <Text style={[s.aiBadgeText, { color: accent }]}>AI</Text>
                </View>
                <Text style={s.footerMeta}>SQUAD INTEL • VERIFIED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Right side action bar — absolutely pinned to right edge ── */}
        <View style={[s.sideActions, { bottom: bottomPadding + 40 }]}>

          {/* Like */}
          <TouchableOpacity
            style={s.sideActionWrap}
            onPress={handleLike}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
          >
            <View style={[
              s.sideActionBtn,
              isLiked && { backgroundColor: accent, borderColor: accent },
            ]}>
              <Text style={[s.sideIcon, { color: isLiked ? onAccent : '#FFFFFF' }]}>♥</Text>
            </View>
            <Text style={s.sideActionLabel}>{formatCount(likeCount)}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            style={s.sideActionWrap}
            onPress={handleShare}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <View style={s.sideActionBtn}>
              <Text style={[s.sideIcon, { color: '#25D366' }]}>⤴</Text>
            </View>
            <Text style={s.sideActionLabel}>Share</Text>
          </TouchableOpacity>

          {/* Boost */}
          <TouchableOpacity
            style={s.sideActionWrap}
            onPress={handleBoost}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isBoosted ? 'Unboosted' : 'Boost'}
          >
            <View style={[
              s.sideActionBtn,
              isBoosted
                ? { backgroundColor: '#FDE100', borderColor: '#FDE100' }
                : s.sideActionBtnAccent,
            ]}>
              <Text style={[s.sideIcon, { color: isBoosted ? '#000000' : '#FFD700' }]}>⚡</Text>
            </View>
            <Text style={[s.sideActionLabel, isBoosted && { color: '#FDE100' }]}>
              {isBoosted ? 'BOOSTED' : 'BOOST'}
            </Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity
            style={s.sideActionWrap}
            onPress={onComment}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Comment"
          >
            <View style={s.sideActionBtn}>
              <Text style={s.sideIcon}>💬</Text>
            </View>
            <Text style={s.sideActionLabel}>{item.comments}</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ClubPulseScreen() {
  const theme = useTheme();
  const accent = theme.club.primary;
  const onAccent = theme.club.onPrimary;
  const selectedClub = useAppStore(s => s.selectedClub);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const [tab, setTab] = useState<'foryou' | 'trending'>('foryou');
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Dynamic feed based on user's selected club — fallback to Bayern
  const feedData = PULSE_FEED_DATA[selectedClub ?? 'fcb'] ?? PULSE_FEED_DATA['fcb'];

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    // Could track current index for analytics
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const bottomPadding = insets.bottom + 20;

  const handleOpenComments = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCommentVisible(true);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: PulseItem }) => (
      <PulseCard
        item={item}
        accent={accent}
        onAccent={onAccent}
        bottomPadding={bottomPadding}
        screenHeight={screenHeight}
        onComment={handleOpenComments}
      />
    ),
    [accent, onAccent, bottomPadding, screenHeight, handleOpenComments]
  );

  return (
    <View style={s.root}>

      {/* ── Full-screen vertical snapping feed ── */}
      <FlatList
        ref={flatListRef}
        data={feedData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
      />

      {/* ── Floating top navigation ── */}
      <View style={[s.headerContainer, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={s.header}>
          {/* Back button */}
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>

          {/* FOR YOU / TRENDING toggle */}
          <View style={s.toggle}>
            <TouchableOpacity
              style={[s.toggleBtn, tab === 'foryou' && [s.toggleBtnActive, { backgroundColor: accent }]]}
              onPress={() => setTab('foryou')}
              activeOpacity={0.85}
            >
              <Text style={[s.toggleText, tab === 'foryou' && { color: onAccent }]}>
                FOR YOU
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, tab === 'trending' && [s.toggleBtnActive, { backgroundColor: accent }]]}
              onPress={() => setTab('trending')}
              activeOpacity={0.85}
            >
              <Text style={[s.toggleText, tab === 'trending' && { color: onAccent }]}>
                TRENDING
              </Text>
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* ── COMMENT BOTTOM SHEET ─────────────────────────────────────────── */}
      <Modal
        visible={isCommentVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCommentVisible(false)}
      >
        <View style={cs.backdrop}>
          {/* Tap backdrop to close */}
          <TouchableOpacity
            style={cs.backdropTouch}
            activeOpacity={1}
            onPress={() => setIsCommentVisible(false)}
          />
          <KeyboardAvoidingView
            style={cs.sheet}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={cs.sheetHeader}>
              <Text style={cs.sheetTitle}>Comments</Text>
              <TouchableOpacity
                style={cs.closeBtn}
                onPress={() => setIsCommentVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={cs.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Placeholder comments */}
            <View style={cs.commentList}>
              <View style={cs.commentRow}>
                <View style={cs.commentAvatar}>
                  <Text style={cs.commentAvatarText}>BF</Text>
                </View>
                <View style={cs.commentContent}>
                  <Text style={cs.commentName}>BayernFan_99</Text>
                  <Text style={cs.commentBody}>This is huge news for the squad depth!</Text>
                </View>
              </View>
              <View style={cs.commentRow}>
                <View style={cs.commentAvatar}>
                  <Text style={cs.commentAvatarText}>KK</Text>
                </View>
                <View style={cs.commentContent}>
                  <Text style={cs.commentName}>KingKane9</Text>
                  <Text style={cs.commentBody}>Hope he recovers quickly 🙏</Text>
                </View>
              </View>
              <View style={cs.commentRow}>
                <View style={cs.commentAvatar}>
                  <Text style={cs.commentAvatarText}>WW</Text>
                </View>
                <View style={cs.commentContent}>
                  <Text style={cs.commentName}>WerderWatcher</Text>
                  <Text style={cs.commentBody}>Bundesliga is better when everyone is fit.</Text>
                </View>
              </View>
            </View>

            {/* Input */}
            <View style={cs.inputRow}>
              <TextInput
                style={cs.input}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                returnKeyType="send"
                onSubmitEditing={() => {
                  if (commentText.trim()) {
                    setCommentText('');
                  }
                }}
              />
              <TouchableOpacity
                style={[cs.sendBtn, { backgroundColor: accent }]}
                onPress={() => {
                  if (commentText.trim()) setCommentText('');
                }}
                activeOpacity={0.8}
              >
                <Text style={[cs.sendBtnText, { color: onAccent }]}>→</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD_RADIUS = 20;
const SIDE_BTN_SIZE = 48;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // ── Floating header ──────────────────────────────────────────────────────
  headerContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20, color: '#FFFFFF', fontWeight: '300', lineHeight: 24,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.50)',
    borderRadius: 999, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  toggleBtn: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999,
  },
  toggleBtnActive: {},
  toggleText: {
    fontSize: 11, fontWeight: '800', letterSpacing: 2,
    color: 'rgba(255,255,255,0.6)',
  },

  // ── Full-screen slide ────────────────────────────────────────────────────
  slide: {
    width: SW,
  },

  // ── Card wrapper — positions card at bottom-left with right margin for action bar ──
  cardWrap: {
    paddingLeft: 16,
    paddingRight: 80, // leaves room for the absolutely positioned action bar
  },

  // ── Glass intel card ─────────────────────────────────────────────────────
  card: {
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderRadius: CARD_RADIUS,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 30, elevation: 12,
  },
  cardGlowBlob: {
    position: 'absolute', top: -80, left: -80,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(220,5,45,0.08)',
  },

  // Card header
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  tagPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5,
  },
  tagEmoji: { fontSize: 11, lineHeight: 14 },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  timestamp: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Headline
  headline: {
    fontSize: 22, fontWeight: '800', color: '#FFFFFF',
    lineHeight: 28, letterSpacing: -0.5, marginBottom: 8,
  },

  // Bullets
  bullets: { gap: 6, marginBottom: 12, flexShrink: 1 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { flex: 1, flexShrink: 1, fontSize: 14, lineHeight: 20, color: '#E0E0E0', flexWrap: 'wrap' },

  // Card footer
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  aiBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  footerMeta: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // ── Right side actions — absolutely pinned to right edge ───────────────
  sideActions: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 24,
    zIndex: 10,
  },
  sideActionWrap: { alignItems: 'center', gap: 4 },
  sideActionBtn: {
    width: SIDE_BTN_SIZE, height: SIDE_BTN_SIZE,
    borderRadius: SIDE_BTN_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  sideActionBtnAccent: {
    backgroundColor: '#E61E32', borderColor: 'transparent',
    shadowColor: '#E61E32', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55, shadowRadius: 12, elevation: 8,
  },
  sideIcon: { fontSize: 20, color: '#FFFFFF', lineHeight: 24 },
  sideActionLabel: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
});


// ── Comment sheet styles ──────────────────────────────────────────────────────
const cs = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: '60%',
    backgroundColor: '#111613',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#222222',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#333333',
  },
  closeBtnText: {
    fontSize: 14, fontWeight: '700', color: '#FFFFFF',
  },
  commentList: {
    flex: 1,
    gap: 16,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  commentAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2A2A2A',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  commentAvatarText: {
    fontSize: 11, fontWeight: '800', color: '#FFFFFF',
  },
  commentContent: {
    flex: 1, gap: 2,
  },
  commentName: {
    fontSize: 13, fontWeight: '700', color: '#FFFFFF',
  },
  commentBody: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#222222',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: {
    fontSize: 18, fontWeight: '700',
  },
});
