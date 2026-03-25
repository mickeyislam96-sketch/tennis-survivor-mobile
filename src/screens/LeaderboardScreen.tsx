import React, { useMemo } from 'react';
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
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { colours, spacing, typography, borderRadius } from '../theme';
import { ROUND_LABELS } from '../utils/constants';

type RootStackParamList = {
  Leaderboard: { groupId: string };
};

type LeaderboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: LeaderboardScreenNavigationProp;
  route: { params: { groupId: string } };
}

function LeaderboardRow({
  member,
  rank,
  roundIsLocked,
}: {
  member: LeaderboardMember;
  rank: number;
  roundIsLocked: boolean;
}) {
  const statusBg = member.isAlive ? colours.successBg : colours.dangerBg;
  const statusText = member.isAlive ? colours.success : colours.danger;
  const statusLabel = member.isAlive ? 'Alive' : `Eliminated at ${member.eliminatedRound || '?'}`;

  const pickDisplay = !roundIsLocked
    ? '🔒 Hidden'
    : member.currentRoundPick || '—';

  const pickColor = member.isAlive ? colours.text : colours.textMuted;

  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{member.displayName}</Text>
        <View style={styles.badges}>
          <Badge
            label={statusLabel}
            variant={member.isAlive ? 'success' : 'danger'}
          />
        </View>
      </View>
      <View style={styles.statsCol}>
        <Text style={styles.statValue}>{member.survivedRounds}</Text>
        <Text style={styles.statLabel}>Rounds</Text>
      </View>
      <View style={styles.pickCol}>
        <Text
          style={[styles.pickText, { color: pickColor }]}
          numberOfLines={1}
        >
          {pickDisplay}
        </Text>
      </View>
    </View>
  );
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
    30000,
    [groupId, user?.id],
  );

  const sortedMembers = useMemo(() => {
    if (!leaderboardData) return [];
    return [...leaderboardData.leaderboard].sort((a, b) => {
      if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
      return (b.survivedRounds || 0) - (a.survivedRounds || 0);
    });
  }, [leaderboardData]);

  const eliminatedCount = useMemo(() => {
    if (!leaderboardData) return 0;
    return leaderboardData.leaderboard.filter((m) => !m.isAlive).length;
  }, [leaderboardData]);

  const totalPlayers = useMemo(() => {
    if (!leaderboardData) return 0;
    return leaderboardData.leaderboard.length;
  }, [leaderboardData]);

  if (loading && !leaderboardData) {
    return <LoadingSpinner message="Loading leaderboard..." />;
  }

  if (error && !leaderboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  if (!leaderboardData || leaderboardData.leaderboard.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="No leaderboard data available" onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{leaderboardData.group.name}</Text>
        <Text style={styles.subtitle}>
          {ROUND_LABELS[leaderboardData.currentRound] || leaderboardData.currentRound}
        </Text>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total"
          value={totalPlayers}
        />
        <StatCard
          label="Alive"
          value={leaderboardData.aliveCount}
          colour={colours.success}
        />
        <StatCard
          label="Eliminated"
          value={eliminatedCount}
          colour={colours.danger}
        />
        <StatCard
          label="Current"
          value={leaderboardData.currentRound}
        />
      </View>

      {/* Leaderboard Table */}
      <FlatList
        data={sortedMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <LeaderboardRow
            member={item}
            rank={index + 1}
            roundIsLocked={leaderboardData.roundIsLocked}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colours.primary}
          />
        }
        contentContainerStyle={styles.tableContent}
        scrollEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rank: {
    ...typography.h3,
    color: colours.textMuted,
    minWidth: 28,
    textAlign: 'center',
  },
  playerInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  playerName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statsCol: {
    alignItems: 'center',
    minWidth: 50,
  },
  statValue: {
    ...typography.h3,
    color: colours.text,
  },
  statLabel: {
    ...typography.caption,
    color: colours.textMuted,
    marginTop: 2,
  },
  pickCol: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  pickText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
