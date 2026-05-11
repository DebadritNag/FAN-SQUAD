import { StyleSheet, Text, View, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Club } from '../types/index';
import { Colors, Typography, Radius, Shadows, GlassCard, Spacing } from '../constants/Theme';

interface MatchCenterCardProps {
  homeClub: Club;
  awayClub: Club;
  matchTime: string;
  isLive: boolean;
}

export default function MatchCenterCard({
  homeClub,
  awayClub,
  matchTime,
  isLive,
}: MatchCenterCardProps) {
  return (
    <View style={styles.container}>
      {/* Home player — bottom left, faces right */}
      <Image
        source={{ uri: homeClub.playerImageUrl }}
        style={[styles.playerImage, styles.playerLeft]}
        resizeMode="contain"
        accessibilityLabel={`${homeClub.name} player`}
      />

      {/* Away player — bottom right, mirrored to face left */}
      <Image
        source={{ uri: awayClub.playerImageUrl }}
        style={[styles.playerImage, styles.playerRight]}
        resizeMode="contain"
        accessibilityLabel={`${awayClub.name} player`}
      />

      {/* Subtle top gradient header */}
      <View style={styles.topGradient} />

      {/* Center VS / LIVE badge */}
      <View style={styles.badgeContainer}>
        <Text style={styles.badge}>{isLive ? 'LIVE' : 'VS'}</Text>
      </View>

      {/* BlurView footer */}
      <BlurView tint="dark" intensity={80} style={styles.footer}>
        <Image
          source={{ uri: homeClub.crestUrl }}
          style={styles.crestImage}
          resizeMode="contain"
          accessibilityLabel={`${homeClub.name} crest`}
        />
        <Text style={styles.matchTime}>{matchTime}</Text>
        <Image
          source={{ uri: awayClub.crestUrl }}
          style={styles.crestImage}
          resizeMode="contain"
          accessibilityLabel={`${awayClub.name} crest`}
        />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 240,
    ...GlassCard,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.card,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
    // Fade to transparent via opacity trick — actual gradient would need LinearGradient
    opacity: 0.6,
    zIndex: 1,
  },
  playerImage: {
    position: 'absolute',
    bottom: 0,
    width: 140,
    height: 200,
  },
  playerLeft: {
    left: 0,
    transform: [{ scaleX: 1 }],
  },
  playerRight: {
    right: 0,
    transform: [{ scaleX: -1 }],
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badge: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 32,
    // Glow effect on badge
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
  },
  crestImage: {
    width: 32,
    height: 32,
  },
  matchTime: {
    ...Typography.dataMono,
    color: Colors.onSurface,
    letterSpacing: 1,
  },
});
