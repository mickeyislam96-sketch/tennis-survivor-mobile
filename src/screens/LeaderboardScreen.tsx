import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { usePollData } from '../hooks/usePollData';
import { getLeaderboard, LeaderboardData, LeaderboardMember } from '../api/leaderboard';
import { getGroup, Group } from '../api/groups';
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
  const [selectedMember, setSelectedMember] = useState<LeaderboardMember | null>(null);

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

  const { data: group } = usePollData(
    () => getGroup(groupId),
    60000,
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

  const totalMembers = leaderboardData.leaderboard.length;
  const aliveCount = leaderboardData.aliveCount;
  const eliminatedCount = totalMembers - aliveCount;
  const prizePool = group?.prizePoolCents ? (group.prizePoolCents / 100) : 0;

  // Find winner (exactly 1 alive)
  const winner = aliveCount === 1 ? leaderboardData.leaderboard.find(m => m.isAlive) : null;

  // Sort: alive first, then by survived rounds descending
  const sortedMembers = [...leaderboardData.leaderboard].sort((a, b) => {
    if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
    return b.survivedRounds - a.survivedRounds;
  });

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Winner Banner */}
            {winner && (
              <View style={styles.winnerBanner}>
                <Text style={styles.winnerEmoji}>{'\uD83C\uDFC6'}</Text>
                <Text style={styles.winnerEyebrow}>TOURNAMENT WINNER</Text>
                <Text style={styles.winnerName}>{winner.displayName}</Text>
                <Text style={styles.winnerSubtitle}>
                  Last one standing {'\u00B7'} {totalMembers} entrants
                </Text>
                {prizePool > 0 && (
                  <Text style={styles.winnerPrize}>
                    {'\u00A3'}{prizePool.toFixed(0)} prize pool
                  </Text>
                )}
              </View>
            )}

            {/* Group name */}
            <Text style={styles.groupName}>
              {leaderboardData.group?.name || group?.name || 'Leaderboard'}
            </Text>

            {/* Stats Bar */}
            <View style={[styles.statsCard, shadows.sm]}>
              <View style={styles.statsGrid}>
                <View style={[styles.statCell, styles.statCellTopLeft]}>
                  <Text style={styles.statValue}>
                    {prizePool > 0 ? `\u00A3${prizePool.toFixed(0)}` : 'Free'}
                  </Text>
                  <Text style={styles.statLabel}>Prize Pool</Text>
                </View>
                <View style={[styles.statCell, styles.statCellTopRight]}>
                  <Text style={[styles.statValue, { color: colours.success }]}>
                    {aliveCount}
                  </Text>
                  <Text style={styles.statLabel}>Still In</Text>
                </View>
                <View style={[styles.statCell, styles.statCellBottomLeft]}>
                  <Text style={[styles.statValue, { color: colours.danger }]}>
                    {eliminatedCount}
                  </Text>
                  <Text style={styles.statLabel}>Eliminated</Text>
                </View>
                <View style={[styles.statCell, styles.statCellBottomRight]}>
                  <Text style={styles.statValue}>{totalMembers}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* Hint */}
            <Text style={styles.tapHint}>Tap any player to see details</Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: 28 }]}>#</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Player</Text>
              <Text style={[styles.headerCell, { width: 60, textAlign: 'center' }]}>Status</Text>
              <Text style={[styles.headerCell, { width: 55, textAlign: 'center' }]}>Rounds</Text>
              <Text style={[styles.headerCell, { width: 75, textAlign: 'center' }]}>
                {ROUND_LABELS[leaderboardData.currentRound] || leaderboardData.currentRound} Pick
              </Text>
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
            onPress={() => setSelectedMember(item)}
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

      {/* Pick detail modal */}
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          roundIsLocked={leaderboardData.roundIsLocked}
          currentRound={leaderboardData.currentRound}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ---------- Leaderboard Row ----------

interface LeaderboardRowProps {
  member: LeaderboardMember;
  rank: number;
  isCurrentUser: boolean;
  roundIsLocked: boolean;
  currentRound: string;
  onPress: () => void;
}

function LeaderboardRow({
  member, rank, isCurrentUser, roundIsLocked, currentRound, onPress,
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
    <TouchableOpacity
      style={[styles.tableRow, { backgroundColor: rowBg }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.rankCell}>{rank}</Text>

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

      <View style={styles.statusCell}>
        {member.isAlive ? (
          <View style={styles.statusAlive}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Alive</Text>
          </View>
        ) : (
          <Text style={styles.statusEliminated}>
            Out {member.eliminatedRound || ''}
          </Text>
        )}
      </View>

      <View style={styles.survivedCell}>
        <Text style={[
          styles.survivedValue,
          { color: member.isAlive ? colours.primaryDark : colours.text }
        ]}>
          {member.survivedRounds}
        </Text>
      </View>

      <View style={styles.pickCell}>
        {!roundIsLocked ? (
          <Text style={styles.hiddenPickText}>{'\uD83D\uDD12'} Hidden</Text>
        ) : member.currentRoundPick ? (
          <Text
            style={[styles.pickText, { color: member.isAlive ? colours.success : colours.danger }]}
            numberOfLines={1}
          >
            {member.currentRoundPick}
          </Text>
        ) : (
          <Text style={styles.noPickText}>{'\u2014'}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ---------- Member Detail Modal ----------

interface MemberModalProps {
  member: LeaderboardMember;
  roundIsLocked: boolean;
  currentRound: string;
  onClose: () => void;
}

function MemberModal({ member, roundIsLocked, currentRound, onClose }: MemberModalProps) {
  const initials = member.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.modalAvatar, { backgroundColor: member.isAlive ? colours.primary : colours.gray300 }]}>
              <Text style={styles.modalAvatarText}>{initials}</Text>
            </View>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalName}>{member.displayName}</Text>
              <Text style={[styles.modalStatus, { color: member.isAlive ? colours.success : colours.textMuted }]}>
                {member.isAlive
                  ? `Alive \u00B7 ${member.survivedRounds} rounds survived`
                  : `Eliminated in ${member.eliminatedRound || '?'} \u00B7 ${member.survivedRounds} rounds survived`
                }
              </Text>
            </View>
          </View>

          {/* Current round pick */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>
              {ROUND_LABELS[currentRound] || currentRound} Pick
            </Text>
            {!roundIsLocked ? (
              <View style={styles.modalPickHidden}>
                <Text style={styles.modalPickHiddenText}>
                  {'\uD83D\uDD12'} Picks are hidden until the round is locked
                </Text>
              </View>
            ) : member.currentRoundPick ? (
              <View style={[
                styles.modalPickCard,
                { borderLeftColor: member.isAlive ? colours.success : colours.danger },
              ]}>
                <Text style={styles.modalPickName}>{member.currentRoundPick}</Text>
                <Text style={[
                  styles.modalPickResult,
                  { color: member.isAlive ? colours.success : colours.danger },
                ]}>
                  {member.isAlive ? '\u2713 Survived' : '\u2717 Eliminated'}
                </Text>
              </View>
            ) : (
              <Text style={styles.modalNoPick}>No pick submitted</Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.modalStatsRow}>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatNumber}>{member.picksCount}</Text>
              <Text style={styles.modalStatLabel}>Picks made</Text>
            </View>
            <View style={styles.modalStatItem}>
              <Text style={[styles.modalStatNumber, { color: colours.success }]}>
                {member.survivedRounds}
              </Text>
              <Text style={styles.modalStatLabel}>Survived</Text>
            </View>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatNumber}>
                {member.isAlive ? '\u2713' : member.eliminatedRound || '\u2014'}
              </Text>
              <Text style={styles.modalStatLabel}>
                {member.isAlive ? 'Still in' : 'Out in'}
              </Text>
            </View>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  // WINNER BANNER
  winnerBanner: {
    backgroundColor: colours.primarySuperDark,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    marginHorizontal: -spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  winnerEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  winnerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: '800',
    color: colours.white,
    marginBottom: spacing.xs,
  },
  winnerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  winnerPrize: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fbbf24',
    marginTop: spacing.sm,
  },

  // GROUP NAME
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.text,
    marginBottom: spacing.md,
  },

  // STATS CARD
  statsCard: {
    backgroundColor: colours.surface,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
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
  statCellBottomRight: {},
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 26,
    color: colours.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },

  // TAP HINT
  tapHint: {
    fontSize: 12,
    color: colours.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // TABLE HEADER
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: -spacing.md,
    marginBottom: 2,
  },
  headerCell: {
    fontSize: 10,
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
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colours.border,
    marginHorizontal: -spacing.md,
  },
  rankCell: {
    width: 28,
    fontSize: 13,
    fontWeight: '600',
    color: colours.textMuted,
  },
  playerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    gap: 1,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '500',
    color: colours.text,
  },
  youBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colours.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusCell: {
    width: 60,
    alignItems: 'center',
  },
  statusAlive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colours.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colours.success,
  },
  statusEliminated: {
    fontSize: 11,
    fontWeight: '500',
    color: colours.textMuted,
  },
  survivedCell: {
    width: 55,
    alignItems: 'center',
  },
  survivedValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  pickCell: {
    width: 75,
    alignItems: 'center',
  },
  hiddenPickText: {
    fontSize: 11,
    color: colours.textMuted,
  },
  pickText: {
    fontSize: 11,
    fontWeight: '500',
  },
  noPickText: {
    fontSize: 14,
    fontWeight: '500',
    color: colours.textMuted,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colours.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colours.gray200,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.white,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalName: {
    fontSize: 18,
    fontWeight: '700',
    color: colours.text,
    marginBottom: 2,
  },
  modalStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  modalPickHidden: {
    backgroundColor: colours.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  modalPickHiddenText: {
    fontSize: 13,
    color: colours.textMuted,
    textAlign: 'center',
  },
  modalPickCard: {
    backgroundColor: colours.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
  },
  modalPickName: {
    fontSize: 15,
    fontWeight: '600',
    color: colours.text,
    marginBottom: 4,
  },
  modalPickResult: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalNoPick: {
    fontSize: 13,
    color: colours.textMuted,
    fontStyle: 'italic',
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  modalStatItem: {
    flex: 1,
    backgroundColor: colours.gray50,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colours.text,
    marginBottom: 2,
  },
  modalStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colours.textMuted,
  },
  modalClose: {
    backgroundColor: colours.gray100,
    borderRadius: borderRadius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: colours.text,
  },
});

export default LeaderboardScreen;
