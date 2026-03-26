import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { usePollData } from '../hooks/usePollData';
import { getGroup, Group, joinGroup } from '../api/groups';
import { getDeadlines, Deadline } from '../api/draw';
import { getPickHistory, Pick } from '../api/picks';
import Countdown from '../components/Countdown';
import { schedulePickReminder, scheduleLastChanceReminder, cancelAllReminders } from '../services/notifications';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { colours, spacing, typography, borderRadius, shadows } from '../theme';
import { ROUND_LABELS } from '../utils/constants';

type RootStackParamList = {
  Group: { groupId: string };
  Pick: { groupId: string };
  Leaderboard: { groupId: string };
  Draw: { groupId: string };
  PickHistory: { groupId: string };
};

type GroupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: GroupScreenNavigationProp;
  route: { params: { groupId: string } };
}

export function GroupScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { groupId } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const { data: group, loading: groupLoading, error: groupError, refresh: refreshGroup } = usePollData(
    () => getGroup(groupId),
    30000,
    [groupId],
  );

  const { data: deadlines, loading: deadlinesLoading, error: deadlinesError, refresh: refreshDeadlines } = usePollData(
    () => getDeadlines(),
    30000,
    [groupId],
  );

  const { data: pickHistory } = usePollData(
    () => getPickHistory(groupId),
    60000,
    [groupId],
  );

  const isMember = useMemo(() => {
    if (!group || !user) return false;
    return group.members?.some((m) => m.userId === user.id) ?? false;
  }, [group, user]);

  const aliveCount = useMemo(() => {
    if (!group) return 0;
    return group.members?.filter((m) => m.isAlive).length ?? 0;
  }, [group]);

  const eliminatedCount = useMemo(() => {
    if (!group) return 0;
    return (group.members?.length ?? 0) - aliveCount;
  }, [group, aliveCount]);

  const totalMembers = useMemo(() => {
    return group?.members?.length ?? 0;
  }, [group]);

  const survivalPercentage = useMemo(() => {
    if (totalMembers === 0) return 0;
    return (aliveCount / totalMembers) * 100;
  }, [aliveCount, totalMembers]);

  const nextDeadline = useMemo(() => {
    if (!deadlines) return null;
    const openDeadline = deadlines.find((d) => !d.isLocked);
    return openDeadline || null;
  }, [deadlines]);

  const currentRound = useMemo(() => {
    return nextDeadline?.round || null;
  }, [nextDeadline]);

  // Schedule pick reminders when deadlines update
  React.useEffect(() => {
    if (!deadlines || !isMember) return;
    const scheduleReminders = async () => {
      await cancelAllReminders();
      for (const d of deadlines) {
        if (!d.isLocked && d.lockAt) {
          const label = d.round;
          await schedulePickReminder(label, d.lockAt);
          await scheduleLastChanceReminder(label, d.lockAt);
        }
      }
    };
    scheduleReminders();
  }, [deadlines, isMember]);

  const currentPick = useMemo(() => {
    if (!pickHistory || !currentRound) return null;
    return pickHistory[pickHistory.length - 1] || null;
  }, [pickHistory, currentRound]);

  const handleJoinGroup = useCallback(async () => {
    if (!user) return;
    try {
      const displayName = user.displayName || user.email;
      await joinGroup(groupId, displayName);
      await refreshGroup();
      Alert.alert('Success', 'You have joined the pool.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to join pool');
    }
  }, [user, groupId, refreshGroup]);

  const handleShare = useCallback(async () => {
    if (!group) return;
    try {
      const inviteUrl = `https://finalserveivor.com/join/${group.inviteCode}`;
      const message = `Join my Final Serve-ivor pool: ${group.name}\n\n${inviteUrl}`;
      await Share.share({
        message,
        title: 'Join my Final Serve-ivor pool',
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to share');
    }
  }, [group]);

  const handleNavigate = useCallback(
    (screen: keyof RootStackParamList) => {
      if (screen === 'Pick' || screen === 'Leaderboard' || screen === 'Draw' || screen === 'PickHistory') {
        navigation.navigate(screen, { groupId });
      }
    },
    [navigation, groupId],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshGroup(), refreshDeadlines()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshGroup, refreshDeadlines]);

  if (groupLoading || deadlinesLoading) {
    return <LoadingSpinner message="Loading pool..." />;
  }

  if (groupError || deadlinesError) {
    const error = groupError || deadlinesError;
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error || 'An error occurred'} onRetry={handleRefresh} />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Pool not found" onRetry={refreshGroup} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colours.primary}
          />
        }
      >
        {/* Green gradient hero banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroOverlay} />

          <Text style={styles.eyebrow}>{group.tournamentId?.toUpperCase() || 'TOURNAMENT'}</Text>
          <Text style={styles.heroTitle}>{group.name}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalMembers}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{aliveCount}</Text>
              <Text style={styles.statLabel}>Alive</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentRound || '—'}</Text>
              <Text style={styles.statLabel}>Round</Text>
            </View>
          </View>
        </View>

        {/* Survivor Meter */}
        {group.members && group.members.length > 0 && (
          <View style={styles.survivorCard}>
            <Text style={styles.survivorLabel}>Survivor Meter</Text>
            <View style={styles.survivorCounts}>
              <Text style={styles.aliveBadge}>{aliveCount} alive</Text>
              <View style={styles.countDivider} />
              <Text style={styles.eliminatedBadge}>{eliminatedCount} eliminated</Text>
            </View>
            <View style={styles.trackBg}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: `${survivalPercentage}%`,
                    backgroundColor: getSurvivalColor(survivalPercentage),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Countdown */}
        {nextDeadline && (
          <View style={styles.deadlineSection}>
            <Countdown
              targetDate={nextDeadline.lockAt || ''}
              label={`${currentRound} picks lock in`}
              compact={false}
            />
          </View>
        )}

        {/* Pick CTA Section */}
        {isMember && (
          <View style={styles.pickSection}>
            {currentPick && nextDeadline?.isOpen ? (
              /* Current pick card - pick exists and window open */
              <View style={[styles.pickCard, { backgroundColor: colours.successBg, borderColor: colours.successBorder }]}>
                <View style={styles.pickCardContent}>
                  <View style={styles.pickCardLeft}>
                    <Text style={styles.pickEyebrow}>YOUR {currentRound} PICK</Text>
                    <Text style={styles.pickPlayerName}>{currentPick.playerName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changePickButton}
                    onPress={() => handleNavigate('Pick')}
                  >
                    <Text style={styles.changePickButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : !currentPick && nextDeadline?.isOpen ? (
              /* No pick yet - show big green button */
              <TouchableOpacity
                style={[styles.makePickButton, shadows.greenLg]}
                onPress={() => handleNavigate('Pick')}
              >
                <Text style={styles.makePickButtonText}>Make Your Pick</Text>
              </TouchableOpacity>
            ) : (
              /* Pick locked - show pick locked state */
              nextDeadline && !nextDeadline.isOpen && currentPick && (
                <View style={[styles.pickCard, { backgroundColor: colours.successBg, borderColor: colours.successBorder }]}>
                  <View style={styles.pickCardContent}>
                    <View style={styles.pickCardLeft}>
                      <Text style={styles.pickEyebrow}>YOUR {currentRound} PICK</Text>
                      <Text style={styles.pickPlayerName}>{currentPick.playerName}</Text>
                    </View>
                    <Text style={styles.pickedLocked}>🔒</Text>
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {/* Nav Cards Grid - 2 columns */}
        {isMember && (
          <View style={styles.navGrid}>
            <NavCard
              emoji="📊"
              title="Leaderboard"
              description="View standings"
              onPress={() => handleNavigate('Leaderboard')}
            />
            <NavCard
              emoji="🎾"
              title="Draw"
              description="Tournament bracket"
              onPress={() => handleNavigate('Draw')}
            />
            <NavCard
              emoji="📋"
              title="Pick History"
              description="Your picks"
              onPress={() => handleNavigate('PickHistory')}
            />
            <NavCard
              emoji="📤"
              title="Share"
              description="Invite friends"
              onPress={handleShare}
            />
          </View>
        )}

        {/* Invite Section */}
        {isMember && (
          <View style={styles.inviteSection}>
            <Text style={styles.inviteEyebrow}>SHARE INVITE LINK</Text>
            <View style={styles.inviteBox}>
              <Text style={styles.inviteCode}>{group.inviteCode}</Text>
              <TouchableOpacity style={styles.inviteShareButton} onPress={handleShare}>
                <Text style={styles.inviteShareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Join Button */}
        {!isMember && (
          <TouchableOpacity
            style={[styles.joinButton, shadows.greenLg]}
            onPress={handleJoinGroup}
          >
            <Text style={styles.joinButtonText}>Join This Pool</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * NavCard component for the 2-column grid
 */
function NavCard({
  emoji,
  title,
  description,
  onPress,
}: {
  emoji: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.navCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.navIconContainer}>
        <Text style={styles.navEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.navTitle}>{title}</Text>
      <Text style={styles.navDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

/**
 * Determine fill colour based on survival percentage
 */
function getSurvivalColor(percentage: number): string {
  if (percentage < 50) return colours.success;
  if (percentage < 80) return colours.warning;
  return colours.danger;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },

  /* Hero Banner */
  heroBanner: {
    backgroundColor: colours.primary,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    opacity: 0.08,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    position: 'relative',
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colours.white,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
    position: 'relative',
    zIndex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: spacing.lg,
    position: 'relative',
    zIndex: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colours.white,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  /* Survivor Meter */
  survivorCard: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colours.border,
  },
  survivorLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.text,
    marginBottom: spacing.sm,
  },
  survivorCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  aliveBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: colours.success,
  },
  countDivider: {
    width: 1,
    height: 16,
    backgroundColor: colours.textMuted,
  },
  eliminatedBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: colours.textMuted,
  },
  trackBg: {
    height: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colours.surfaceAlt,
    borderWidth: 1,
    borderColor: colours.border,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },

  /* Deadline Section */
  deadlineSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  /* Pick Section */
  pickSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pickCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  pickCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickCardLeft: {
    flex: 1,
  },
  pickEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colours.successDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  pickPlayerName: {
    fontSize: 17,
    fontWeight: '800',
    color: colours.text,
    letterSpacing: -0.3,
  },
  changePickButton: {
    backgroundColor: colours.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  changePickButtonText: {
    color: colours.white,
    fontWeight: '700',
    fontSize: 12,
  },
  pickedLocked: {
    fontSize: 24,
  },
  makePickButton: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  makePickButtonText: {
    color: colours.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.3,
  },

  /* Nav Grid */
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  navCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colours.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  navIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colours.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  navEmoji: {
    fontSize: 18,
  },
  navTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colours.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  navDescription: {
    fontSize: 12.5,
    color: colours.textMuted,
    textAlign: 'center',
  },

  /* Invite Section */
  inviteSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  inviteEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  inviteBox: {
    backgroundColor: colours.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderStyle: 'dashed',
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: colours.primaryDark,
    backgroundColor: colours.primaryLight,
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  inviteShareButton: {
    backgroundColor: colours.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md,
  },
  inviteShareButtonText: {
    color: colours.white,
    fontWeight: '700',
    fontSize: 12,
  },

  /* Join Button */
  joinButton: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: colours.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.3,
  },
});

export default GroupScreen;
