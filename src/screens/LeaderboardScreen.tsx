import React, { useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { usePollData } from '../hooks/usePollData';
import { getLeaderboard, LeaderboardData, LeaderboardMember } from '../api/leaderboard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { colours, spacing, borderRadius, shadows, AVATAR_COLOURS } from '../theme';
import { ROUND_LABELS } from '../utils/constants';

type RootStackParamList = {
  Leaderboard: { groupId: string };
};

type LeaderboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: LeaderboardScreenNavigationProp;
  route: { params: { groupId: string } };
}

export function LeaderboardScreen({ route }: Props) {
  const { user } = useAuth();
  const { groupId } = route.params;

  const {
    data: leaderboardData,
    loading,
    error,
    refresh,
  } = usePollData(
    () => getLeaderboard(groupId),
    5000,
    [groupId],
  );

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (loading && !leaderboardData) {
    return <LoadingSpinner message="Loading leaderboard..." />;
  }

  if (error && !leaderboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error} onRetry={handleRefresh} />
      </SafeAreaView>
    );
  }

  if (!leaderboardData || !leaderboardData.leaderboard || leaderboardData.leaderboard.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState title="No members yet" message="Invite friends to join the group." />
      </SafeAreaView>
    );
  }

  // Sort: alive first, then by survived rounds descending
  const sortedMembers = [...leaderboardData.leaderboard].sort((a, b) => {
    if (a.isAlive !== b.isAlive) {
      return a.isAlive ? -1 : 1;
    }
    return b.survivedRounds - a.survivedRounds;
  });

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Stats Bar */}
            <View style={[styles.statsCard, shadows.sm]}>
              <View style={styles.statsGrid}>
                {/* Top Row */}
                <View style={[styles.statCell, styles.statCellTopLeft]}>
                  <Text style={styles.statValue}>{leaderboardData.leaderboard.length}</Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </View>
                <View style={[styles.statCell, styles.statCellTopRight]}>
                  <Text style={[styles.statValue, { color: colours.success }]}>
                    {leaderboardData.aliveCount}
                  </Text>
                  <Text style={styles.statLabel}>Alive</Text>
                </View>

                {/* Bottom Row */}
                <View style={[styles.statCell, styles.statCellBottomLeft]}>
                  <Text style={[styles.statValue, { color: colours.danger }]}>
                    {leaderboardData.leaderboard.length - leaderboardData.aliveCount}
                  </Text>
                  <Text style={styles.statLabel}>Eliminated</Text>
                </View>
                <View style={[styles.statCell, styles.statCellBottomRight]}>
                  <Text style={styles.statValue}>
                    {ROUND_LABELS[leaderboardData.currentRound] || leaderboardData.currentRound}
                  </Text>
                  <Text style={styles.statLabel}>Current Round</Text>
                </View>
              </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: 32 }]}>#</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Player</Text>
              <Text style={[styles.headerCell, { width: 70 }]}>Status</Text>
              <Text style={[styles.headerCell, { width: 60 }]}>Survived</Text>
              <Text style={[styles.headerCell, { width: 80 }]}>Pick</Text>
            </View>
          </>
        }
        data={sortedMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <LeaderboardRow
            member={item}
            rank={index + 1}
            isCurrentUser={user?.id === item.userId}
            roundIsLocked={leaderboardData.roundIsLocked}
            currentRound={leaderboardData.currentRound}
          />
        )}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={colours.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

interface LeaderboardRowProps {
  member: LeaderboardMember;
  rank: number;
  isCurrentUser: boolean;
  roundIsLocked: boolean;
  currentRound: string;
}

function LeaderboardRow({
  member,
  rank,
  isCurrentUser,
  roundIsLocked,
  currentRound,
}: LeaderboardRowProps) {
  const avatarColour = AVATAR_COLOURS[rank % AVATAR_COLOURS.length];
  const initials = member.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const rowBg = isCurrentUser ? colours.green50 : colours.white;

  return (
    <View style={[styles.tableRow, { backgroundColor: rowBg }]}>
      {/* Rank */}
      <Text style={[styles.rankCell]}>
        {rank}
      </Text>

      {/* Player Cell */}
      <View style={styles.playerCell}>
        <View style={[styles.avatar, { backgroundColor: avatarColour }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName} numberOfLines={1}>
            {member.displayName}
          </Text>
          {isCurrentUser && <Text style={styles.youBadge}>You</Text>}
        </View>
      </View>

      {/* Status Cell */}
      <View style={styles.statusCell}>
        {member.isAlive ? (
          <View style={styles.statusAlive}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Alive</Text>
          </View>
        ) : (
          <Text style={styles.statusEliminated}>
            Out {member.eliminatedRound || 'R1'}
          </Text>
        )}
      </View>

      {/* Survived Cell */}
      <View style={styles.survivedCell}>
        <Text style={[
          styles.survivedValue,
          { color: member.isAlive ? colours.primaryDark : colours.text }
        ]}>
          {member.survivedRounds}/{member.picksCount}
        </Text>
        <Text style={styles.survivedLabel}>rounds</Text>
      </View>

      {/* Pick Cell */}
      <View style={styles.pickCell}>
        {!roundIsLocked ? (
          <Text style={styles.hiddenPickText}>🔒 Hidden</Text>
        ) : member.currentRoundPick ? (
          <Text style={[
            styles.pickText,
            { color: member.isAlive ? colours.success : colours.danger }
          ]}>
            {member.currentRoundPick}
          </Text>
        ) : (
          <Text style={styles.noPickText}>—</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  // STATS CARD
  statsCard: {
    backgroundColor: colours.surface,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statCellTopLeft: {
    borderRightWidth: 1,
    borderRightColor: colours.border,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  statCellTopRight: {
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  statCellBottomLeft: {
    borderRightWidth: 1,
    borderRightColor: colours.border,
  },
  statCellBottomRight: {
    // No borders
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 22,
    color: colours.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xs,
  },

  // TABLE HEADER
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: -spacing.md,
    marginBottom: spacing.sm,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // TABLE ROW
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
    marginHorizontal: -spacing.md,
  },

  // Rank Column
  rankCell: {
    width: 32,
    fontSize: 13,
    fontWeight: '600',
    color: colours.textMuted,
  },

  // Player Column
  playerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: colours.white,
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: colours.text,
    maxWidth: '100%',
  },
  youBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: colours.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Status Column
  statusCell: {
    width: 70,
  },
  statusAlive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colours.success,
  },
  statusText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colours.success,
  },
  statusEliminated: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colours.textMuted,
  },

  // Survived Column
  survivedCell: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  survivedValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  survivedLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: colours.textMuted,
  },

  // Pick Column
  pickCell: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenPickText: {
    fontSize: 11,
    color: colours.textMuted,
  },
  pickText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noPickText: {
    fontSize: 14,
    fontWeight: '500',
    color: colours.textMuted,
  },
});

export default LeaderboardScreen;
