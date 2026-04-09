import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius } from '../theme';
import Badge from './Badge';

interface PlayerRowProps {
  player: any;
  isSelected: boolean;
  isCurrentPick: boolean;
  isUsed: boolean;
  isPending: boolean;
  pendingRound?: string;
  onPress: () => void;
  disabled?: boolean;
}

const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  isSelected,
  isCurrentPick,
  isUsed,
  isPending,
  pendingRound = 'R64',
  onPress,
  disabled = false,
}) => {
  const opacity = isUsed ? 0.45 : 1;
  const borderColor = isSelected ? '#86efac' : colours.border;
  const bgColor = isCurrentPick ? '#f0fdf4' : colours.surface;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: bgColor,
          borderColor,
          opacity,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, isCurrentPick && styles.nameCurrentPick]}>
            {player.name}
          </Text>
          {player.seed && (
            <View style={styles.seedBadge}>
              <Text style={styles.seedText}>{player.seed}</Text>
            </View>
          )}
        </View>
        {(player.opponentName || player.opponent) && (
          <Text style={styles.opponentText}>vs {player.opponentName || player.opponent}</Text>
        )}
        {!player.opponentName && !player.opponent && player.opponentPossible?.length > 0 && (
          <Text style={[styles.opponentText, { fontStyle: 'italic' }]}>
            vs {player.opponentPossible.join(' or ')}
          </Text>
        )}
        {isPending && (
          <Text style={styles.pendingText}>
            Still in {pendingRound} {'\u2014'} if they lose, your pick is invalid
          </Text>
        )}
        {isUsed && !isCurrentPick && (
          <Text style={styles.usedText}>Already used</Text>
        )}
      </View>

      <View style={styles.right}>
        {isCurrentPick ? (
          <View style={styles.currentPickBadge}>
            <Text style={styles.currentPickText}>Your pick</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.pickButton}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.pickButtonText}>Pick</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderColor: colours.border,
    borderRadius: borderRadius.sm,
    gap: spacing.md,
  },
  left: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colours.text,
  },
  nameCurrentPick: {
    color: '#15803d',
  },
  seedBadge: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.xs,
    borderLeftWidth: 1,
    borderLeftColor: '#d1fae5',
  },
  seedText: {
    fontWeight: '700' as const,
    color: '#15803d',
    fontSize: 13,
  },
  opponentText: {
    fontSize: 12,
    color: colours.textMuted,
    marginTop: 2,
  },
  pendingText: {
    fontSize: 12,
    color: colours.warning,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  usedText: {
    fontSize: 12,
    color: colours.textMuted,
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
  right: {
    justifyContent: 'flex-end',
  },
  pickButton: {
    backgroundColor: colours.primary,
    color: colours.white,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
  },
  pickButtonText: {
    fontWeight: '600' as const,
    fontSize: 13,
    color: colours.white,
  },
  currentPickBadge: {
    color: '#15803d',
    backgroundColor: '#dcfce7',
    borderRadius: borderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  currentPickText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#15803d',
  },
});

export default PlayerRow;
