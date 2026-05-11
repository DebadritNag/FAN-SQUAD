import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAppStore } from '../store/useAppStore';
import { MOCK_CLUBS, MOCK_PLAYERS } from '../constants/MockData';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/Theme';
import { PLAYER_IMAGES } from '../constants/PlayerAssets';

const { width } = Dimensions.get('window');

// ── Local club crest assets ───────────────────────────────────────────────────
const CLUB_IMAGES: Record<string, any> = {
  fcb: require('../assets/images/bayern.png'),
  bvb: require('../assets/images/dortmund.png'),
  svw: require('../assets/images/bremen.png'),
};

// ── Players per club (already defined in MockData, mapped here) ───────────────
const PLAYERS_BY_CLUB: Record<string, typeof MOCK_PLAYERS> = {
  fcb: MOCK_PLAYERS.filter((_, i) => i < 4),          // Kane, Musiala, Sané, Gnabry
  bvb: MOCK_PLAYERS.filter((_, i) => i >= 4 && i < 8), // Malen, Brandt, Füllkrug, Reus
  svw: MOCK_PLAYERS.filter((_, i) => i >= 8),          // Ducksch, Schmid, Weiser
};

// ── Per-club accent colours for the player step ───────────────────────────────
const CLUB_ACCENT: Record<string, { primary: string; onPrimary: string }> = {
  fcb: { primary: '#DC052D', onPrimary: '#FFFFFF' },
  bvb: { primary: '#FDE100', onPrimary: '#000000' },
  svw: { primary: '#1D9053', onPrimary: '#FFFFFF' },
};

// ── ClubCrest — renders local image with colour-swatch fallback on error ──────
function ClubCrest({ clubId, primaryColor }: { clubId: string; primaryColor: string }) {
  const [errored, setErrored] = useState(false);
  const src = CLUB_IMAGES[clubId];

  if (!src || errored) {
    return (
      <View style={[styles.clubSwatch, { backgroundColor: primaryColor }]}>
        <Text style={styles.clubSwatchText}>
          {clubId.toUpperCase().slice(0, 3)}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={src}
      style={styles.clubCrestImage}
      resizeMode="contain"
      onError={() => setErrored(true)}
      accessibilityLabel={`${clubId} crest`}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [step, setStep] = useState<'club' | 'players'>('club');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const { setSelectedClub, setFollowedPlayers } = useAppStore();
  const selectedClub = useAppStore((state) => state.selectedClub);

  // Derive accent from the currently selected club (live during step 2)
  const accent = selectedClub
    ? (CLUB_ACCENT[selectedClub]?.primary ?? Colors.primary)
    : Colors.primary;
  const onAccent = selectedClub
    ? (CLUB_ACCENT[selectedClub]?.onPrimary ?? Colors.onPrimary)
    : Colors.onPrimary;

  // BVB dark-mode flag — drives background and text overrides on the player step
  const isBVB = selectedClub === 'bvb';

  const handleClubSelect = (clubId: string) => {
    setSelectedClub(clubId);
    setStep('players');
  };

  const handlePlayerToggle = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId));
    } else if (selectedPlayers.length < 1) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleComplete = () => {
    setFollowedPlayers(selectedPlayers);
    router.replace('/(app)/hub');
  };

  const availablePlayers = selectedClub
    ? (PLAYERS_BY_CLUB[selectedClub] ?? MOCK_PLAYERS.slice(0, 4))
    : [];

  // ── Dynamic container background: BVB → pure black, others → default dark ──
  const containerBg = isBVB ? '#000000' : Colors.background;

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: accent }]}>
          {step === 'club' ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
        </Text>
        <Text style={styles.title}>
          {step === 'club' ? 'Choose Your Club' : 'Follow Your Icons'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'club'
            ? 'Select your favorite team to personalize your experience'
            : 'Pick your favourite player to get personalized notifications'}
        </Text>
      </View>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'club' ? (

          /* ── CLUB SELECTION ── */
          <View style={styles.clubGrid}>
            {MOCK_CLUBS.map((club) => {
              const isSelected = selectedClub === club.id;
              return (
                <TouchableOpacity
                  key={club.id}
                  activeOpacity={0.8}
                  onPress={() => handleClubSelect(club.id)}
                  style={[
                    styles.clubCard,
                    isSelected && { borderColor: club.primaryColor, borderWidth: 3 },
                  ]}
                >
                  <BlurView intensity={60} tint="dark" style={styles.clubCardBlur}>
                    <View style={[styles.clubColorBar, { backgroundColor: club.primaryColor }]} />
                    <View style={styles.clubCardContent}>
                      {CLUB_IMAGES[club.id] ? (
                        <ClubCrest clubId={club.id} primaryColor={club.primaryColor} />
                      ) : (
                        <View style={[styles.clubSwatch, { backgroundColor: club.primaryColor }]}>
                          <Text style={styles.clubSwatchText}>
                            {club.name.split(' ').map((w) => w[0]).join('').slice(0, 3)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.clubInfo}>
                        <Text style={styles.clubName}>{club.name}</Text>
                        <Text style={[styles.clubTag, { color: club.primaryColor }]}>
                          Bundesliga
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.checkBadge, { backgroundColor: club.primaryColor }]}>
                          <Text style={[styles.checkText, { color: club.id === 'bvb' ? '#000' : '#fff' }]}>
                            ✓
                          </Text>
                        </View>
                      )}
                    </View>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>

        ) : (

          /* ── PLAYER SELECTION ── */
          <View style={styles.playerGrid}>
            {availablePlayers.map((player) => {
              const isSelected = selectedPlayers.includes(player.id);
              const isDisabled = !isSelected && selectedPlayers.length >= 1;

              // BVB: selected card gets yellow bg + black text instead of glow border
              const bvbSelectedCard = isBVB && isSelected;

              return (
                <TouchableOpacity
                  key={player.id}
                  activeOpacity={0.8}
                  style={[
                    styles.playerCard,
                    // BVB selected: solid yellow fill
                    bvbSelectedCard
                      ? { borderColor: '#FDE100', borderWidth: 3, backgroundColor: '#FDE100' }
                      : isSelected
                      ? [styles.playerCardSelected, { borderColor: accent }]
                      : null,
                    // BVB unselected: dark card
                    isBVB && !isSelected
                      ? { backgroundColor: '#111111', borderColor: 'rgba(253,225,0,0.15)' }
                      : null,
                    isDisabled && styles.playerCardDisabled,
                  ]}
                  onPress={() => handlePlayerToggle(player.id)}
                  disabled={isDisabled}
                >
                  <BlurView
                    intensity={bvbSelectedCard ? 0 : 60}
                    tint="dark"
                    style={styles.playerCardBlur}
                  >
                    {PLAYER_IMAGES[player.name] ? (
                      <Image
                        source={PLAYER_IMAGES[player.name]}
                        style={styles.playerPhoto}
                        resizeMode="cover"
                        accessibilityLabel={player.name}
                      />
                    ) : (
                      <View style={[
                        styles.playerAvatar,
                        isSelected
                          ? { borderColor: accent, backgroundColor: isBVB ? 'rgba(253,225,0,0.15)' : Colors.primaryContainer }
                          : isBVB
                          ? { borderColor: 'rgba(253,225,0,0.25)', backgroundColor: '#1A1A1A' }
                          : null,
                      ]}>
                        <Text style={[
                          styles.playerAvatarText,
                          bvbSelectedCard && { color: '#000000' },
                        ]}>
                          {player.name.split(' ').map((w) => w[0]).join('')}
                        </Text>
                      </View>
                    )}

                    <Text style={[
                      styles.playerName,
                      bvbSelectedCard && { color: '#000000', fontWeight: '800' },
                    ]} numberOfLines={2}>
                      {player.name}
                    </Text>

                    {isSelected && (
                      <View style={[
                        styles.playerCheck,
                        { backgroundColor: accent },
                      ]}>
                        <Text style={[styles.playerCheckText, { color: onAccent }]}>✓</Text>
                      </View>
                    )}
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        {step === 'players' && (
          <>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {selectedPlayers.length} / 1 player selected
              </Text>
              <View style={[
                styles.progressBar,
                isBVB && { backgroundColor: '#1A1A1A' },
              ]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${selectedPlayers.length * 100}%`, backgroundColor: accent },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                isBVB
                  ? { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: 'rgba(253,225,0,0.20)' }
                  : null,
                selectedPlayers.length === 1 && {
                  backgroundColor: accent,
                  borderWidth: 0,
                  ...(isBVB
                    ? { shadowColor: '#FDE100', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 }
                    : Shadows.primaryGlow),
                },
              ]}
              onPress={handleComplete}
              disabled={selectedPlayers.length !== 1}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  selectedPlayers.length === 1 && { color: onAccent, fontWeight: '800' },
                ]}
              >
                Start Watching →
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'club' && (
          <Text style={styles.hintText}>Tap a club to continue</Text>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.md,
  },
  eyebrow: {
    ...Typography.labelCaps,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.xl,
  },

  // ── Club cards ──────────────────────────────────────────────────────────────
  clubGrid: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  clubCard: {
    height: 100,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  clubCardBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubColorBar: {
    width: 5,
    alignSelf: 'stretch',
  },
  clubCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  clubSwatch: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubSwatchText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  clubCrestImage: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    ...Typography.bodyLg,
    fontWeight: '700',
    marginBottom: 4,
  },
  clubTag: {
    ...Typography.labelCaps,
    fontSize: 10,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },

  // ── Player cards ────────────────────────────────────────────────────────────
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  playerCard: {
    width: (width - Spacing.gutter * 2 - Spacing.sm) / 2,
    height: 160,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playerCardSelected: {
    borderWidth: 3,
    ...Shadows.primaryGlow,
  },
  playerCardDisabled: {
    opacity: 0.35,
  },
  playerCardBlur: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  playerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  playerPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  playerName: {
    ...Typography.bodyMd,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  playerCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCheckText: {
    fontWeight: '900',
    fontSize: 12,
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  continueButton: {
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    ...Typography.bodyLg,
    fontWeight: '700',
    color: Colors.onSurfaceMuted,
  },
  hintText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceMuted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
