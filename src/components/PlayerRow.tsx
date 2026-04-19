import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius, fonts } from '../theme';
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
  const borderColor = isSelected ? colours.primary : colours.border;
  const bgColor = isCurrentPick ? colours.primarySoft : colours.surface;

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
      {/* Seed rank */}
      {player.seed && (
        <Text style={styles.seedText}>{player.seed}</Text>
      )}

      <View style={styles.body}>
        <Text style={[styles.name, isCurrentPick && styles.nameCurrentPick]}>
          {player.name}
        </Text>
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
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderColor: colours.border,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  seedText: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    color: colours.inkMuted,
    width: 24,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: fonts.sansMedium,
    color: colours.ink,
  },
  nameCurrentPick: {
    color: colours.primary,
  },
  opponentText: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.inkSoft,
    marginTop: 2,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colours.warning,
    marginTop: 2,
  },
  usedText: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.inkSoft,
    fontStyle: 'italic',
    marginTop: 2,
  },
  right: {
    justifyContent: 'flex-end',
  },
  pickButton: {
    backgroundColor: colours.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: borderRadius.pill,
  },
  pickButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colours.primaryInk,
  },
  currentPickBadge: {
    backgroundColor: colours.primarySoft,
    borderRadius: borderRadius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  currentPickText: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: colours.primary,
  },
});

export default PlayerRow;
