import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Player } from '../types/index';
import { Colors, Typography, Radius, Shadows, GlassCard, Spacing } from '../constants/Theme';
import { useTheme } from '../hooks/useTheme';

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onPress: (player: Player) => void;
}

export default function PlayerCard({ player, isSelected, onPress }: PlayerCardProps) {
  const shimmerPosition = useSharedValue(0);
  const { club } = useTheme();

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + shimmerPosition.value * 0.1,
  }));

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderRadius: club.cardRadius },
        { ...club.glassCard },
        isSelected && { borderColor: club.primary, borderWidth: 2 },
        isSelected && club.accentGlow,
      ]}
      onPress={() => onPress(player)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${player.name}`}
      accessibilityState={{ selected: isSelected }}
    >
      {/* Player image */}
      <Image
        source={{ uri: player.imageUrl }}
        style={styles.playerImage}
        resizeMode="cover"
        accessibilityLabel={`${player.name} photo`}
      />

      {/* Holographic shimmer overlay */}
      <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Selected indicator */}
      {isSelected && (
        <View style={[styles.selectedBadge, { backgroundColor: club.primary }]}>
          <Text style={[styles.selectedBadgeText, { color: club.onPrimary }]}>✓</Text>
        </View>
      )}

      {/* Player info */}
      <View style={styles.infoContainer}>
        <Image
          source={{ uri: player.clubCrestUrl }}
          style={styles.crestImage}
          resizeMode="contain"
          accessibilityLabel="Club crest"
        />
        <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 130,
    height: 180,
    overflow: 'hidden',
    marginRight: 12,
  },
  playerImage: {
    width: '100%',
    height: 130,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130,
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
    gap: 6,
  },
  crestImage: {
    width: 20,
    height: 20,
  },
  playerName: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});
