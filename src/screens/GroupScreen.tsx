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
  Group: { groupId: string; drawAvailable?: boolean; tournamentStatus?: string };
  Pick: { groupId: string };
  Leaderboard: { groupId: string };
  Draw: { groupId: string; drawAvailable?: boolean };
  PickHistory: { groupId: string };
};

type GroupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: GroupScreenNavigationProp;
  route: { params: { groupId: string; drawAvailable?: boolean; tournamentStatus?: string } };
}

export function GroupScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { groupId, drawAvailable, tournamentStatus } = route.params;
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

  // Elimination percentage: 0% = nobody eliminated, 100% = everyone eliminated
  const eliminationPercentage = useMemo(() => {
    if (totalMembers === 0) return 0;
    return (eliminatedCount / totalMembers) * 100;
  }, [eliminatedCount, totalMembers]);

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
    return pickHistory.find((p) => p.round === currentRound) || null;
  }, [pickHistory, currentRound]);

  // Is deadline within 24 hours?
  const isUrgent = useMemo(() => {
    if (!nextDeadline?.lockAt) return false;
    const lockTime = new Date(nextDeadline.lockAt).getTime();
    const now = Date.now();
    const hoursLeft = (lockTime - now) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  }, [nextDeadline]);

  const prizePool = group?.prizePoolCents ? group.prizePoolCents / 100 : 0;
  const entryFee = group?.entryFeeCents ? group.entryFeeCents / 100 : 0;
  const isUpcoming = tournamentStatus === 'upcoming';

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
      if (screen === 'Draw') {
        navigation.navigate('Draw', { groupId, drawAvailable });
      } else if (screen === 'Pick' || screen === 'Leaderboard' || screen === 'PickHistory') {
        navigation.navigate(screen, { groupId });
      }
    },
    [navigation, groupId, drawAvailable],
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
              <Text style={styles.statValue}>{currentRound || '\u2014'}</Text>
              <Text style={styles.statLabel}>Round</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {prizePool > 0 ? `\u00A3${prizePool.toFixed(0)}` : 'Free'}
              </Text>
              <Text style={styles.statLabel}>{prizePool > 0 ? 'Prize' : 'Entry'}</Text>
            </View>
          </View>
        </View>

        {/* Urgency banner - deadline within 24hrs */}
        {isUrgent && isMember && !currentPick && nextDeadline?.isOpen && (
          <TouchableOpacity
            style={styles.urgencyBanner}
            onPress={() => handleNavigate('Pick')}
            activeOpacity={0.8}
          >
            <Text style={styles.urgencyIcon}>{'\u26A0\uFE0F'}</Text>
            <View style={styles.urgencyContent}>
              <Text style={styles.urgencyTitle}>Pick deadline approaching</Text>
              <Text style={styles.urgencySubtitle}>
                Make your {currentRound} pick before time runs out
              </Text>
            </View>
            <Text style={styles.urgencyArrow}>{'\u2192'}</Text>
          </TouchableOpacity>
        )}

        {/* Pre-launch timeline for upcoming tournaments */}
        {isUpcoming && isMember && (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Tournament Timeline</Text>

            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotDone]} />
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitle}>Registration open</Text>
                <Text style={styles.timelineStepDesc}>{'\u2713'} You{'\u2019'}re registered</Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, drawAvailable ? styles.timelineDotDone : styles.timelineDotPending]} />
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitle}>Draw released</Text>
                <Text style={styles.timelineStepDesc}>
                  {drawAvailable ? '\u2713 Draw available' : 'Pending tournament draw'}
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotPending]} />
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitle}>Tournament begins</Text>
                <Text style={styles.timelineStepDesc}>Pick window opens when the draw is released</Text>
              </View>
            </View>
          </View>
        )}

        {/* Survivor Meter */}
        {group.members && group.members.length > 0 && !isUpcoming && (
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
                    width: `${eliminationPercentage}%`,
                    backgroundColor: getEliminationColor(eliminationPercentage),
                  },
                ]}
              />
            </View>
            <View style={styles.trackLabels}>
              <Text style={styles.trackLabelText}>0% eliminated</Text>
              <Text style={styles.trackLabelText}>100%</Text>
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
            <NavCard
              emoji="📄"
              title="T&Cs"
              description="Terms & conditions"
              onPress={() => navigation.navigate('Terms' as any)}
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
 * Determine fill colour based on elimination percentage.
 * Low elimination = green, medium = amber, high = red.
 */
function getEliminationColor(percentage: number): string {
  if (percentage <= 0) return colours.success;
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
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  trackLabelText: {
    fontSize: 11,
    color: colours.textMuted,
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

  /* Urgency Banner */
  urgencyBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  urgencyIcon: {
    fontSize: 20,
  },
  urgencyContent: {
    flex: 1,
  },
  urgencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  urgencySubtitle: {
    fontSize: 12,
    color: '#92400e',
    opacity: 0.8,
  },
  urgencyArrow: {
    fontSize: 18,
    color: '#92400e',
    fontWeight: '700',
  },

  /* Pre-launch Timeline */
  timelineCard: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colours.border,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.text,
    marginBottom: spacing.lg,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  timelineDotDone: {
    backgroundColor: colours.primary,
  },
  timelineDotPending: {
    backgroundColor: colours.gray300,
  },
  timelineStepContent: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colours.text,
    marginBottom: 2,
  },
  timelineStepDesc: {
    fontSize: 12,
    color: colours.textMuted,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: colours.gray200,
    marginLeft: 5,
    marginVertical: 4,
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
