import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../constants/Theme';

interface EmoteButtonProps {
  emoji: string;
  onPress: () => void;
}

export default function EmoteButton({ emoji, onPress }: EmoteButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Send ${emoji} emote`}
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    // Glow on press (handled by activeOpacity, but we can add subtle shadow)
    ...Shadows.primaryGlow,
    shadowOpacity: 0.15, // Subtle glow
  },
  emoji: {
    fontSize: 24,
  },
});
