import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Player } from '../api/picks';
import { Badge } from './Badge';
import { colours, spacing, borderRadius } from '../theme';

interface Props {
  player: Player;
  onPress: () => void;
  disabled?: boolean;
  isCurrentPick?: boolean;
  previousRoundLabel?: string;
}

export function PlayerRow({ player, onPress, disabled, isCurrentPick, previousRoundLabel = 'R64' }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        isCurrentPick && styles.rowSelected,
        disabled && styles.rowDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, isCurrentPick && styles.nameSelected]}>
            {player.name}
          </Text>
          {player.seed && (
            <Text style={styles.seed}>[{player.seed}]</Text>
          )}
        </View>
        {player.pendingPrevRound && (
          <Badge label={`\u26A0\uFE0F ${previousRoundLabel} result pending`} variant="warning" />
        )}
      </View>
      <View style={styles.right}>
        {isCurrentPick ? (
          <View style={styles.pickedBadge}>
            <Text style={styles.pickedText}>Your pick</Text>
          </View>
        ) : (
          <View style={styles.pickButton}>
            <Text style={styles.pickButtonText}>Pick</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colours.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowSelected: {
    borderColor: colours.primary,
    backgroundColor: colours.successBg,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  left: {
    flex: 1,
    marginRight: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colours.text,
  },
  nameSelected: {
    color: colours.success,
  },
  seed: {
    fontSize: 13,
    color: colours.textMuted,
    fontWeight: '500',
  },
  right: {},
  pickButton: {
    backgroundColor: colours.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  pickButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pickedBadge: {
    backgroundColor: colours.successBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  pickedText: {
    color: colours.success,
    fontWeight: '600',
    fontSize: 14,
  },
});
