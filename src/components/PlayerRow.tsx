import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius, fonts } from '../theme';
import Badge from './Badge';
import PlayerAvatar from './PlayerAvatar';

/** Format match start time for display */
function formatMatchTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    + ', ' + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Get urgency hint for match start time */
function getMatchStartHint(iso: string | undefined): 'urgent' | 'today' | null {
  if (!iso) return null;
  const matchTime = new Date(iso);
  const now = new Date();
  const hoursUntil = (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntil < 0) return null;
  if (hoursUntil <= 2) return 'urgent';
  if (hoursUntil <= 6) return 'today';
  return null;
}

interface PlayerRowProps {
  player: any;
  isSelected: boolean;
  isCurrentPick: boolean;
  isUsed: boolean;
  isPending: boolean;
  pendingRound?: string;
  showMatchTime?: boolean;
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
  showMatchTime = false,
  onPress,
  disabled = false,
}) => {
  const matchTimeText = showMatchTime ? formatMatchTime(player.matchStartTime) : null;
  const matchHint = showMatchTime ? getMatchStartHint(player.matchStartTime) : null;
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
      {/* Avatar */}
      <PlayerAvatar
        playerId={player.id}
        playerName={player.name}
        size={32}
      />

      {/* Seed rank */}
      {player.seed != null && (
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
        {matchTimeText && (
          <View style={styles.matchTimeRow}>
            <Text style={styles.matchTimeText}>{matchTimeText}</Text>
            {matchHint === 'urgent' && (
              <View style={[styles.matchHintBadge, styles.matchHintUrgent]}>
                <Text style={[styles.matchHintText, styles.matchHintTextUrgent]}>Starts soon</Text>
              </View>
            )}
            {matchHint === 'today' && (
              <View style={[styles.matchHintBadge, styles.matchHintToday]}>
                <Text style={[styles.matchHintText, styles.matchHintTextToday]}>Today</Text>
              </View>
            )}
          </View>
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
  matchTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  matchTimeText: {
    fontSize: 11,
    fontFamily: fonts.monoRegular,
    color: colours.inkSoft,
  },
  matchHintBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  matchHintUrgent: {
    backgroundColor: colours.dangerSoft,
  },
  matchHintToday: {
    backgroundColor: colours.warningSoft,
  },
  matchHintText: {
    fontSize: 10,
    fontFamily: fonts.sansSemiBold,
  },
  matchHintTextUrgent: {
    color: colours.danger,
  },
  matchHintTextToday: {
    color: colours.warning,
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
