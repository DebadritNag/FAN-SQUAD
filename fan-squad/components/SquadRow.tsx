import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Player } from '../types/index';
import { Colors, Radius, Shadows, Spacing } from '../constants/Theme';
import { useTheme } from '../hooks/useTheme';

interface SquadRowProps {
  selectedPlayers: Player[];
  onRemovePlayer: (player: Player) => void;
}

export default function SquadRow({ selectedPlayers, onRemovePlayer }: SquadRowProps) {
  const slots = [0, 1, 2];
  const { club } = useTheme();

  return (
    <View style={styles.container}>
      {slots.map((slotIndex) => {
        const player = selectedPlayers[slotIndex];
        return (
          <View key={slotIndex} style={styles.slot}>
            {player ? (
              <TouchableOpacity
                style={[
                  styles.filledSlot,
                  { borderColor: club.primary },
                  club.accentGlow,
                ]}
                onPress={() => onRemovePlayer(player)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${player.name} from squad`}
              >
                <Image
                  source={{ uri: player.imageUrl }}
                  style={styles.playerImage}
                  resizeMode="cover"
                  accessibilityLabel={`${player.name}`}
                />
                <View style={styles.removeIndicator}>
                  <Text style={styles.removeText}>✕</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View
                style={styles.emptySlot}
                accessibilityLabel={`Empty squad slot ${slotIndex + 1}`}
              >
                <Text style={styles.emptySlotIcon}>+</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  slot: {
    alignItems: 'center',
  },
  emptySlot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainer,
  },
  emptySlotIcon: {
    fontSize: 24,
    color: Colors.onSurfaceMuted,
    fontWeight: '300',
  },
  filledSlot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
  },
  playerImage: {
    width: '100%',
    height: '100%',
  },
  removeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  removeText: {
    color: Colors.onSurface,
    fontSize: 20,
    fontWeight: '700',
  },
});
