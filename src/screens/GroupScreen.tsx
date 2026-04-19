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
import { useCountdown } from '../hooks/useCountdown';
import { schedulePickReminder, scheduleLastChanceReminder, cancelAllReminders } from '../services/notifications';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { colours, spacing, typography, borderRadius, shadows, fonts } from '../theme';
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

  // When all rounds are locked, find the latest locked round (for showing pick state)
  const latestLockedDeadline = useMemo(() => {
    if (!deadlines || nextDeadline) return null;
    // All rounds locked — pick the last one that has a lockAt
    const locked = deadlines.filter((d) => d.isLocked);
    return locked.length > 0 ? locked[locked.length - 1] : null;
  }, [deadlines, nextDeadline]);

  // activeDeadline = the one we display (open round preferred, else latest locked)
  const activeDeadline = nextDeadline || latestLockedDeadline;

  const currentRound = useMemo(() => {
    return activeDeadline?.round || null;
  }, [activeDeadline]);

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

  // Entry closed detection: entry closes 1h before R1 lock (matches web logic)
  const isEntryClosed = useMemo(() => {
    if (!deadlines) return false;
    const r1Deadline = deadlines.find((d) => d.round === 'R1');
    if (!r1Deadline?.lockAt) {
      return group?.tournament?.entryOpen === false;
    }
    const entryDeadline = new Date(new Date(r1Deadline.lockAt).getTime() - 60 * 60 * 1000);
    return group?.tournament?.entryOpen === false || new Date() >= entryDeadline;
  }, [deadlines, group]);

  // Countdown for urgency banner (only for open rounds, not locked)
  const deadlineCountdown = useCountdown(nextDeadline?.lockAt || '');

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

          <Text style={styles.eyebrow}>
            {'\uD83C\uDFBE'} {group.name || group.tournamentId?.toUpperCase() || 'TOURNAMENT'}
            {group.tournament?.tier ? ` \u00B7 ${group.tournament.tier}` : ''}
          </Text>
          <Text style={styles.heroTitle}>{group.name}</Text>

          {/* Stats row - different for upcoming vs active */}
          {isUpcoming ? (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {entryFee > 0 ? `\u00A3${entryFee.toFixed(0)}` : 'Free'}
                </Text>
                <Text style={styles.statLabel}>Entry</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatShortDate(group.tournament?.startDate)}</Text>
                <Text style={styles.statLabel}>Starts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalMembers}</Text>
                <Text style={styles.statLabel}>Registered</Text>
              </View>
            </View>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{aliveCount} / {totalMembers}</Text>
                <Text style={styles.statLabel}>Still In</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentRound || '\u2014'}</Text>
                <Text style={styles.statLabel}>Round</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {prizePool > 0 ? `\u00A3${prizePool.toFixed(0)}` : 'Free'}
                </Text>
                <Text style={styles.statLabel}>{prizePool > 0 ? 'Prize' : 'Entry'}</Text>
              </View>
            </View>
          )}
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
              <Text style={styles.urgencyTitle}>Deadline closing soon!</Text>
              <Text style={styles.urgencySubtitle}>
                {deadlineCountdown.display} left to pick for {currentRound}.
              </Text>
            </View>
            <Text style={styles.urgencyArrow}>Pick now {'\u2192'}</Text>
          </TouchableOpacity>
        )}

        {/* Pre-launch timeline for upcoming tournaments */}
        {isUpcoming && (
          <View style={styles.timelineCard}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, isMember ? styles.timelineDotDone : styles.timelineDotPending]} />
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitle}>Registration open</Text>
                <Text style={styles.timelineStepDesc}>
                  {isMember ? '\u2713 You\u2019re registered' : 'Join now to secure your spot'}
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, drawAvailable ? styles.timelineDotDone : styles.timelineDotPending]} />
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitle}>Draw released</Text>
                <Text style={styles.timelineStepDesc}>
                  {drawAvailable
                    ? '\u2713 Draw available'
                    : `${formatTimelineDate(group.tournament?.drawDate)} \u00B7 pick window opens`}
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotPending]} />
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitle}>Tournament begins</Text>
                <Text style={styles.timelineStepDesc}>
                  {formatTimelineDate(group.tournament?.startDate)}
                  {group.tournament?.location ? ` \u00B7 ${group.tournament.location}` : ''}
                </Text>
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
            <Text style={styles.meterCaption}>
              {Math.round(eliminationPercentage)}% of the field eliminated
            </Text>
            {aliveCount > 1 && (
              <Text style={styles.meterSubCaption}>
                Last one standing wins the prize pool
              </Text>
            )}
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
                {/* Pick window time display */}
                {nextDeadline && (
                  <Text style={styles.pickWindowHint}>
                    {formatPickWindow(nextDeadline)}
                  </Text>
                )}
              </View>
            ) : !currentPick && nextDeadline?.isOpen ? (
              /* No pick yet - show big green button */
              <>
                <TouchableOpacity
                  style={[styles.makePickButton, shadows.greenLg]}
                  onPress={() => handleNavigate('Pick')}
                >
                  <Text style={styles.makePickButtonText}>Make Your Pick</Text>
                </TouchableOpacity>
                {/* Pick window time display */}
                {nextDeadline && (
                  <Text style={styles.pickWindowHintCentre}>
                    {formatPickWindow(nextDeadline)}
                  </Text>
                )}
              </>
            ) : currentPick ? (
              /* Pick locked (including all-rounds-locked state) */
              <View style={[styles.pickCard, { backgroundColor: colours.successBg, borderColor: colours.successBorder }]}>
                <View style={styles.pickCardContent}>
                  <View style={styles.pickCardLeft}>
                    <Text style={styles.pickEyebrow}>YOUR {currentRound} PICK</Text>
                    <Text style={styles.pickPlayerName}>{currentPick.playerName}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.changePickButton, { backgroundColor: colours.primaryDark }]}
                    onPress={() => handleNavigate('Pick')}
                  >
                    <Text style={styles.changePickButtonText}>View picks</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* No pick + no open window — still show nav to picks */
              <TouchableOpacity
                style={[styles.makePickButton, { backgroundColor: colours.primaryDark }]}
                onPress={() => handleNavigate('Pick')}
              >
                <Text style={styles.makePickButtonText}>View picks {'\u2192'}</Text>
              </TouchableOpacity>
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

        {/* Join Button / Entry Closed */}
        {!isMember && (
          <View style={styles.joinSection}>
            {isEntryClosed ? (
              <>
                <View style={styles.entryClosedCard}>
                  <Text style={styles.entryClosedIcon}>{'\uD83C\uDFBE'}</Text>
                  <Text style={styles.entryClosedTitle}>Entry period is over</Text>
                  <Text style={styles.entryClosedSub}>
                    {group.name} is already underway {'\u2014'} new entries are no longer accepted.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: colours.primaryDark }]}
                  onPress={() => handleNavigate('Leaderboard')}
                >
                  <Text style={styles.joinButtonText}>View leaderboard {'\u2192'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.joinButton, shadows.greenLg]}
                  onPress={handleJoinGroup}
                >
                  <Text style={styles.joinButtonText}>
                    {entryFee > 0 ? `Join \u00B7 \u00A3${entryFee.toFixed(0)} \u2192` : 'Join free \u2192'}
                  </Text>
                </TouchableOpacity>
                {!user && (
                  <Text style={styles.joinHint}>You{'\u2019'}ll create a free account to join</Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerSection}>
          <TouchableOpacity onPress={() => navigation.navigate('Terms' as any)}>
            <Text style={styles.footerLink}>Terms & Conditions</Text>
          </TouchableOpacity>
          <Text style={styles.footerCopy}>
            {'\u00A9'} 2026 Final Serve-ivor {'\u00B7'} Outsmart. Outlast. Win.
          </Text>
        </View>
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
 * Format a pick window date like "7 Apr, 17:00"
 */
function fmtWindowDate(isoStr?: string | null): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      + ', '
      + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Format pick window display: "Window 7 Apr, 17:00 → 9 Apr, 10:00"
 */
function formatPickWindow(deadline: { opensAt?: string | null; lockAt?: string | null }): string {
  const parts: string[] = [];
  if (deadline.opensAt) parts.push(fmtWindowDate(deadline.opensAt));
  if (deadline.lockAt) parts.push(fmtWindowDate(deadline.lockAt));
  if (parts.length === 2) return `Window ${parts[0]} \u2192 ${parts[1]}`;
  if (parts.length === 1) return `Closes ${parts[0]}`;
  return '';
}

/**
 * Format a date to short form like "Sun 5 Apr"
 */
function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return '\u2014';
  }
}

/**
 * Format a date for timeline like "Sat 4 Apr"
 */
function formatTimelineDate(dateStr?: string | null): string {
  if (!dateStr) return 'TBC';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return 'TBC';
  }
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
    backgroundColor: colours.canvas,
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
    fontFamily: fonts.monoMedium,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    position: 'relative',
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.serifBold,
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
    fontFamily: fonts.monoBold,
    color: colours.white,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fonts.monoMedium,
    color: 'rgba(255, 255, 255, 0.65)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
    fontFamily: fonts.sansBold,
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
    fontFamily: fonts.sansSemiBold,
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
    fontFamily: fonts.sansSemiBold,
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
  meterCaption: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  meterSubCaption: {
    fontSize: 11,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
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
    fontFamily: fonts.monoMedium,
    color: colours.successDark,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  pickPlayerName: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: fonts.sansBold,
    color: colours.text,
    letterSpacing: -0.3,
  },
  changePickButton: {
    backgroundColor: colours.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  changePickButtonText: {
    color: colours.white,
    fontWeight: '700',
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  pickedLocked: {
    fontSize: 24,
  },
  makePickButton: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  makePickButtonText: {
    color: colours.white,
    fontWeight: '800',
    fontFamily: fonts.sansBold,
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
    fontFamily: fonts.sansBold,
    color: colours.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  navDescription: {
    fontSize: 12.5,
    fontFamily: fonts.sansRegular,
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
    fontFamily: fonts.monoMedium,
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
    fontFamily: fonts.monoBold,
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
    borderRadius: borderRadius.pill,
    marginLeft: spacing.md,
  },
  inviteShareButtonText: {
    color: colours.white,
    fontWeight: '700',
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },

  /* Urgency Banner */
  urgencyBanner: {
    backgroundColor: colours.warningBg,
    borderWidth: 1,
    borderColor: colours.warningBorder,
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
    fontFamily: fonts.sansMedium,
    color: colours.warningDark,
    marginBottom: 2,
  },
  urgencySubtitle: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.warningDark,
    opacity: 0.8,
  },
  urgencyArrow: {
    fontSize: 13,
    color: colours.warningDark,
    fontWeight: '700',
    fontFamily: fonts.sansMedium,
  },
  pickWindowHint: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    marginTop: spacing.sm,
  },
  pickWindowHintCentre: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
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
    fontFamily: fonts.sansMedium,
    color: colours.text,
    marginBottom: 2,
  },
  timelineStepDesc: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: colours.gray200,
    marginLeft: 5,
    marginVertical: 4,
  },

  /* Join Section */
  joinSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  joinButtonText: {
    color: colours.white,
    fontWeight: '800',
    fontFamily: fonts.sansBold,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  joinHint: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  entryClosedCard: {
    backgroundColor: colours.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colours.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  entryClosedIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  entryClosedTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sansBold,
    color: colours.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  entryClosedSub: {
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Footer */
  footerSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.sansMedium,
    color: colours.primary,
    marginBottom: spacing.xs,
  },
  footerCopy: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
  },
});

export default GroupScreen;
