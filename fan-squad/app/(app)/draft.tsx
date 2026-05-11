import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { getPlayerImage } from '../../constants/PlayerAssets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Draft-specific player data (FCB vs BVB match) ────────────────────────────

interface DraftPlayer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;   // key used for PLAYER_IMAGES lookup
  position: string;
  team: 'FCB' | 'BVB';
  imageUrl: string;   // remote fallback
}

const MATCH_PLAYERS: DraftPlayer[] = [
  // FC Bayern München
  { id: 'd1',  firstName: 'Harry',   lastName: 'Kane',      fullName: 'Harry Kane',      position: 'ST',  team: 'FCB', imageUrl: 'https://picsum.photos/seed/kane/200/200' },
  { id: 'd2',  firstName: 'Jamal',   lastName: 'Musiala',   fullName: 'Jamal Musiala',   position: 'CAM', team: 'FCB', imageUrl: 'https://picsum.photos/seed/musiala/200/200' },
  { id: 'd3',  firstName: 'Leroy',   lastName: 'Sané',      fullName: 'Leroy Sané',      position: 'LW',  team: 'FCB', imageUrl: 'https://picsum.photos/seed/sane/200/200' },
  { id: 'd4',  firstName: 'Serge',   lastName: 'Gnabry',    fullName: 'Serge Gnabry',    position: 'RW',  team: 'FCB', imageUrl: 'https://picsum.photos/seed/gnabry/200/200' },
  { id: 'd5',  firstName: 'Joshua',  lastName: 'Kimmich',   fullName: 'Joshua Kimmich',  position: 'CDM', team: 'FCB', imageUrl: 'https://picsum.photos/seed/kimmich/200/200' },
  { id: 'd6',  firstName: 'Leon',    lastName: 'Goretzka',  fullName: 'Leon Goretzka',   position: 'CM',  team: 'FCB', imageUrl: 'https://picsum.photos/seed/goretzka/200/200' },
  // Borussia Dortmund
  { id: 'd7',  firstName: 'Donyell', lastName: 'Malen',     fullName: 'Donyell Malen',   position: 'ST',  team: 'BVB', imageUrl: 'https://picsum.photos/seed/malen/200/200' },
  { id: 'd8',  firstName: 'Julian',  lastName: 'Brandt',    fullName: 'Julian Brandt',   position: 'CAM', team: 'BVB', imageUrl: 'https://picsum.photos/seed/brandt/200/200' },
  { id: 'd9',  firstName: 'Niclas',  lastName: 'Füllkrug',  fullName: 'Niclas Füllkrug', position: 'ST',  team: 'BVB', imageUrl: 'https://picsum.photos/seed/fullkrug/200/200' },
  { id: 'd10', firstName: 'Marco',   lastName: 'Reus',      fullName: 'Marco Reus',      position: 'CAM', team: 'BVB', imageUrl: 'https://picsum.photos/seed/reus/200/200' },
  { id: 'd11', firstName: 'Marcel',  lastName: 'Sabitzer',  fullName: 'Marcel Sabitzer', position: 'CM',  team: 'BVB', imageUrl: 'https://picsum.photos/seed/sabitzer/200/200' },
  { id: 'd12', firstName: 'Karim',   lastName: 'Adeyemi',   fullName: 'Karim Adeyemi',   position: 'LW',  team: 'BVB', imageUrl: 'https://picsum.photos/seed/adeyemi/200/200' },
];

/** Returns the local asset if available, falls back to remote URI. */
function playerImageSource(player: DraftPlayer) {
  return getPlayerImage(player.fullName) ?? { uri: player.imageUrl };
}

// ── Dynamic Theme Tokens ─────────────────────────────────────────────────────

// Gradient helper (matches Hub)
function getScreenGradient(clubId: string | null) {
  if (clubId === 'fcb') return { colors: ['#DC052D', '#5C0012', '#121212', '#121212'] as [string, string, string, string], locations: [0, 0.4, 0.75, 1] as [number, number, number, number] };
  if (clubId === 'bvb') return { colors: ['#FDE100', '#4A4200', '#000000', '#000000'] as [string, string, string, string], locations: [0, 0.35, 0.7, 1] as [number, number, number, number] };
  if (clubId === 'svw') return { colors: ['#139B48', '#0A4A22', '#000000', '#000000'] as [string, string, string, string], locations: [0, 0.35, 0.7, 1] as [number, number, number, number] };
  return { colors: ['#1A1A1A', '#121212', '#121212', '#121212'] as [string, string, string, string], locations: [0, 0.3, 0.7, 1] as [number, number, number, number] };
}

interface DraftTheme {
  bg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  ctaBg: string;
  ctaText: string;
  text: string;
  textMuted: string;
  slotBorder: string;
  disabledBg: string;
}

function getDraftTheme(clubId: string | null): DraftTheme {
  if (clubId === 'bvb') {
    return {
      bg: '#000000',
      cardBg: '#111111',
      cardBorder: '#1A1A1A',
      cardShadow: '#000000',
      ctaBg: '#FDE100',
      ctaText: '#000000',
      text: '#FFFFFF',
      textMuted: '#888888',
      slotBorder: '#FDE100',
      disabledBg: '#1A1A1A',
    };
  }
  if (clubId === 'svw') {
    return {
      bg: '#000000',
      cardBg: '#0D1F14',
      cardBorder: '#1A3A24',
      cardShadow: '#000000',
      ctaBg: '#139B48',
      ctaText: '#FFFFFF',
      text: '#FFFFFF',
      textMuted: '#7AAF8A',
      slotBorder: '#139B48',
      disabledBg: '#111A14',
    };
  }
  // Default: Bayern (light-first)
  return {
    bg: '#F5F5F5',
    cardBg: '#FFFFFF',
    cardBorder: '#E0E0E0',
    cardShadow: '#00000015',
    ctaBg: '#DC052D',
    ctaText: '#FFFFFF',
    text: '#111111',
    textMuted: '#666666',
    slotBorder: '#DC052D',
    disabledBg: '#EEEEEE',
  };
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function DraftScreen() {
  const selectedClub = useAppStore((s) => s.selectedClub);
  const isBayern = selectedClub === 'fcb';
  const isBVB = selectedClub === 'bvb';
  const theme = getDraftTheme(selectedClub);
  const gradient = getScreenGradient(selectedClub);
  const headerTextColor = isBVB ? '#000000' : '#FFFFFF';

  const [selectedPlayers, setSelectedPlayers] = useState<DraftPlayer[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  // ── Actions ──
  const addPlayer = useCallback((player: DraftPlayer) => {
    setSelectedPlayers((prev) => {
      if (prev.length >= 5) return prev;
      if (prev.some((p) => p.id === player.id)) return prev;
      return [...prev, player];
    });
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setSelectedPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }, []);

  const lockSquad = useCallback(() => {
    if (selectedPlayers.length !== 5) return;
    setIsLocked(true);
    router.replace('/(app)/leaderboard');
  }, [selectedPlayers.length]);

  // ── VIEW B: Locked State ───────────────────────────────────────────────────
  if (isLocked) {
    return (
      <LinearGradient colors={gradient.colors} locations={gradient.locations} style={{ flex: 1 }}>
      <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]} edges={['top', 'bottom']}>
        {/* Success Header */}
        <View style={styles.lockedHeader}>
          <Text style={[styles.lockedEmoji]}>🔒</Text>
          <Text style={[styles.lockedTitle, { color: headerTextColor }]}>SQUAD LOCKED</Text>
          <Text style={[styles.lockedSubtitle, { color: theme.textMuted }]}>
            Your 5-player tournament squad is set
          </Text>
        </View>

        {/* Locked Player Grid */}
        <View style={styles.lockedGrid}>
          {selectedPlayers.map((player) => (
            <View
              key={player.id}
              style={[
                styles.lockedCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                  shadowColor: theme.cardShadow,
                },
              ]}
            >
              <Image
                source={playerImageSource(player)}
                style={styles.lockedCardImage}
              />
              <Text style={[styles.lockedCardName, { color: theme.text }]} numberOfLines={1}>
                {player.lastName}
              </Text>
              <Text style={[styles.lockedCardPos, { color: theme.textMuted }]}>
                {player.position}
              </Text>
              <View style={[styles.lockedTeamBadge, { backgroundColor: player.team === 'FCB' ? '#DC052D' : '#FDE100' }]}>
                <Text style={[styles.lockedTeamText, { color: player.team === 'FCB' ? '#FFF' : '#000' }]}>
                  {player.team}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.lockedFooter}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: theme.ctaBg }]}
            onPress={() => router.push('/(app)/live')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="View live leaderboard"
          >
            <Text style={[styles.ctaButtonText, { color: theme.ctaText }]}>
              VIEW LIVE LEADERBOARD
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── VIEW A: Draft Builder ──────────────────────────────────────────────────
  return (
    <LinearGradient colors={gradient.colors} locations={gradient.locations} style={{ flex: 1 }}>
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]} edges={['top', 'bottom']}>
      {/* Header: Match Context Banner */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: headerTextColor }]}>
          FCB vs BVB
        </Text>
        <View style={[styles.liveBadge, { backgroundColor: theme.ctaBg }]}>
          <Text style={[styles.liveBadgeText, { color: theme.ctaText }]}>LIVE TOURNAMENT</Text>
        </View>
      </View>

      {/* Squad Slots (Top Half) */}
      <View style={styles.slotsSection}>
        <Text style={[styles.slotsLabel, { color: theme.textMuted }]}>YOUR SQUAD</Text>
        <View style={styles.slotsRow}>
          {Array.from({ length: 5 }).map((_, i) => {
            const player = selectedPlayers[i];
            if (player) {
              return (
                <TouchableOpacity
                  key={player.id}
                  style={[styles.slot, styles.slotFilled, { borderColor: theme.slotBorder }]}
                  onPress={() => removePlayer(player.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${player.lastName}`}
                >
                  <Image source={playerImageSource(player)} style={styles.slotImage} />
                  <Text style={styles.slotName} numberOfLines={1}>{player.lastName}</Text>
                </TouchableOpacity>
              );
            }
            return (
              <View
                key={`empty-${i}`}
                style={[
                  styles.slot,
                  styles.slotEmpty,
                  { borderColor: theme.textMuted },
                ]}
              >
                <Text style={[styles.slotPlus, { color: theme.textMuted }]}>+</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Player Pool (Bottom Half) */}
      <View style={styles.poolSection}>
        <Text style={[styles.poolLabel, { color: theme.textMuted }]}>AVAILABLE PLAYERS</Text>
        <FlatList
          data={MATCH_PLAYERS}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.poolList}
          renderItem={({ item }) => {
            const isDrafted = selectedPlayers.some((p) => p.id === item.id);
            return (
              <View
                style={[
                  styles.poolRow,
                  {
                    backgroundColor: isDrafted ? theme.disabledBg : theme.cardBg,
                    borderColor: theme.cardBorder,
                    shadowColor: theme.cardShadow,
                    opacity: isDrafted ? 0.6 : 1,
                  },
                ]}
              >
                <Image
                  source={playerImageSource(item)}
                  style={[styles.poolAvatar, { borderWidth: 1, borderColor: '#333333' }]}
                />
                <View style={styles.poolInfo}>
                  <Text style={[styles.poolName, { color: theme.text }]}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={[styles.poolMeta, { color: theme.textMuted }]}>
                    {item.position} · {item.team}
                  </Text>
                </View>
                {isDrafted ? (
                  <View style={[styles.draftedBadge, { backgroundColor: theme.disabledBg }]}>
                    <Text style={[styles.draftedText, { color: theme.textMuted }]}>DRAFTED</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.ctaBg }]}
                    onPress={() => addPlayer(item)}
                    activeOpacity={0.8}
                    disabled={selectedPlayers.length >= 5}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.lastName}`}
                  >
                    <Text style={[styles.addButtonText, { color: theme.ctaText }]}>ADD</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      </View>

      {/* Sticky Footer: Lock In Button */}
      <View style={[styles.footer, { backgroundColor: 'transparent', borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.lockButton,
            {
              backgroundColor: theme.ctaBg,
              opacity: selectedPlayers.length === 5 ? 1 : 0.4,
            },
          ]}
          onPress={lockSquad}
          disabled={selectedPlayers.length !== 5}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Lock in squad ${selectedPlayers.length} of 5`}
        >
          <Text style={[styles.lockButtonText, { color: theme.ctaText }]}>
            LOCK IN SQUAD ({selectedPlayers.length}/5)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </LinearGradient>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const SLOT_SIZE = (SCREEN_WIDTH - 48 - 32) / 5; // 5 slots with gaps

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Squad Slots ──
  slotsSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  slotsLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE + 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  slotFilled: {
    borderWidth: 2,
  },
  slotImage: {
    width: SLOT_SIZE - 8,
    height: SLOT_SIZE - 8,
    borderRadius: (SLOT_SIZE - 8) / 2,
    marginBottom: 4,
  },
  slotName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    position: 'absolute',
    bottom: 4,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  slotPlus: {
    fontSize: 24,
    fontWeight: '300',
  },

  // ── Player Pool ──
  poolSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  poolLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  poolList: {
    paddingBottom: 16,
  },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  poolAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  poolInfo: {
    flex: 1,
  },
  poolName: {
    fontSize: 15,
    fontWeight: '700',
  },
  poolMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  draftedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  draftedText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  lockButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // ── CTA (shared) ──
  ctaButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // ── Locked State ──
  lockedHeader: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  lockedEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  lockedSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  lockedGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  lockedCard: {
    width: (SCREEN_WIDTH - 64) / 3,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lockedCardImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    backgroundColor: '#E0E0E0',
  },
  lockedCardName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedCardPos: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  lockedTeamBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedTeamText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lockedFooter: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
