import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  SectionList,
  StyleSheet,
  RefreshControl,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { usePollData } from '../hooks/usePollData';
import { getPools, Pool, getGroupByInvite } from '../api/groups';
import PoolCard from '../components/PoolCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { colours, spacing, borderRadius, shadows, fonts } from '../theme';
import { useCountdown } from '../hooks/useCountdown';

type RootStackParamList = {
  Group: { groupId: string; drawAvailable?: boolean; tournamentStatus?: string };
  Join: { code: string };
  Terms: undefined;
};

type PoolsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Group'
>;

interface Props {
  navigation: PoolsScreenNavigationProp;
}

export function PoolsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { data: pools, loading, error, refresh } = usePollData(
    () => getPools(),
    30000,
    [user?.id],
  );

  const [inviteCode, setInviteCode] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Find the featured pool for hero CTA — prefer active, then upcoming
  const featuredPool = useMemo(() => {
    if (!pools) return null;
    const active = pools.find((p) => (p.tournament?.status || p.status) === 'active');
    if (active) return active;
    return pools.find((p) => (p.tournament?.status || p.status) === 'upcoming') || null;
  }, [pools]);

  const featuredIsActive = useMemo(() => {
    if (!featuredPool) return false;
    return (featuredPool.tournament?.status || featuredPool.status) === 'active';
  }, [featuredPool]);

  // Check if user is already a member of the featured pool
  const isFeaturedMember = useMemo(() => {
    if (!featuredPool || !user) return false;
    return featuredPool.isMember ?? false;
  }, [featuredPool, user]);

  // Countdown to featured pool start date
  const featuredStartDate = featuredPool?.tournament?.startDate || featuredPool?.startDate || null;
  const { display: countdownDisplay, isExpired: countdownExpired } = useCountdown(featuredStartDate);

  // Social proof: total registered for upcoming pools
  const upcomingRegisteredCount = useMemo(() => {
    if (!pools) return 0;
    return pools
      .filter((p) => (p.tournament?.status || p.status) === 'upcoming')
      .reduce((sum, p) => sum + (p.memberCount || 0), 0);
  }, [pools]);

  const featuredPoolName = useMemo(() => {
    if (!featuredPool) return '';
    const name = featuredPool.name || featuredPool.tournament?.name || '';
    if (name.toLowerCase().includes('monte')) return 'Monte Carlo';
    if (name.toLowerCase().includes('madrid')) return 'Madrid';
    return name.split(' ').slice(0, 2).join(' ');
  }, [featuredPool]);

  const handlePoolPress = useCallback(
    (pool: Pool) => {
      navigation.navigate('Group', {
        groupId: pool.id,
        drawAvailable: pool.tournament?.drawAvailable,
        tournamentStatus: pool.tournament?.status,
      });
    },
    [navigation],
  );

  const handleJoinByCode = useCallback(async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setInviteError(null);
    setInviteLoading(true);
    try {
      const group = await getGroupByInvite(code);
      if (group?.id) {
        setInviteCode('');
        navigation.navigate('Group', { groupId: group.id });
      }
    } catch (e: any) {
      setInviteError('Invalid invite code');
    } finally {
      setInviteLoading(false);
    }
  }, [inviteCode, navigation]);

  // Group pools by status
  const sections = useMemo(() => {
    if (!pools) return [];

    const active: Pool[] = [];
    const upcoming: Pool[] = [];
    const completed: Pool[] = [];

    for (const pool of pools) {
      const status = pool.tournament?.status || 'active';
      const allEliminated = status === 'active' && pool.aliveCount === 0 && pool.memberCount > 0;

      if (status === 'completed' || allEliminated) {
        completed.push(pool);
      } else if (status === 'upcoming') {
        upcoming.push(pool);
      } else {
        active.push(pool);
      }
    }

    const result: { title: string; data: Pool[] }[] = [];
    if (active.length > 0) result.push({ title: 'Open now', data: active });
    if (upcoming.length > 0) result.push({ title: 'Coming soon', data: upcoming });
    if (completed.length > 0) result.push({ title: 'Past Pools', data: completed });

    return result;
  }, [pools]);

  if (loading && !pools) {
    return <LoadingSpinner message="Loading pools..." />;
  }

  if (error && !pools) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Deep emerald hero */}
            <View style={styles.heroBanner}>
              <Text style={styles.eyebrow}>TENNIS SURVIVOR POOL</Text>
              <Text style={styles.heroTitle}>
                Pick a winner.{'\n'}
                <Text style={styles.heroTitleItalic}>Outlast everyone.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Each round, pick one tennis player to win. If they lose, you{'\u2019'}re out.
                Last one standing takes the entire prize pool.
              </Text>

              {/* Hero CTA button — pill shaped */}
              {featuredPool && (
                <TouchableOpacity
                  style={styles.heroCta}
                  onPress={() => handlePoolPress(featuredPool)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroCtaText}>
                    {featuredIsActive || isFeaturedMember
                      ? `Go to ${featuredPoolName} \u2192`
                      : `Enter ${featuredPoolName} free \u2192`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Countdown badge - only for upcoming */}
              {featuredPool && !featuredIsActive && !countdownExpired && (
                <View style={styles.heroCountdownBadge}>
                  <Text style={styles.heroCountdownText}>
                    {'\uD83C\uDFBE'} {featuredPoolName} starts in {countdownDisplay}
                  </Text>
                </View>
              )}

              {/* Hero stats row */}
              <View style={styles.heroStats}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>
                    {upcomingRegisteredCount > 0 ? upcomingRegisteredCount : pools?.length || 0}
                  </Text>
                  <Text style={styles.heroStatLabel}>
                    {upcomingRegisteredCount > 0 ? 'REGISTERED' : 'POOLS'}
                  </Text>
                </View>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>Free</Text>
                  <Text style={styles.heroStatLabel}>ENTRY</Text>
                </View>
                {featuredStartDate && (
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>
                      {new Date(featuredStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                    <Text style={styles.heroStatLabel}>STARTS</Text>
                  </View>
                )}
              </View>
            </View>

            {/* How it works */}
            <View style={styles.howSection}>
              <Text style={styles.howTitle}>How it works</Text>
              <View style={styles.stepsRow}>
                <View style={styles.stepCard}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepLabel}>Enter a pool</Text>
                  <Text style={styles.stepDescription}>
                    Join an open tournament pool, or use a friend{'\u2019'}s invite code.
                  </Text>
                </View>
                <View style={styles.stepCard}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepLabel}>Pick one player</Text>
                  <Text style={styles.stepDescription}>
                    Each round, pick one player to win. Never pick the same player twice.
                  </Text>
                </View>
                <View style={styles.stepCard}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepLabel}>Last one standing</Text>
                  <Text style={styles.stepDescription}>
                    If your player loses, you{'\u2019'}re out. Outlast everyone to win.
                  </Text>
                </View>
              </View>
            </View>
          </>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderAccent} />
            <Text style={styles.sectionHeader}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <PoolCard pool={item} onPress={() => handlePoolPress(item)} />
          </View>
        )}
        renderSectionFooter={({ section }) => {
          if (section.title === 'Coming soon' && upcomingRegisteredCount > 0) {
            return (
              <View style={styles.socialProof}>
                <Text style={styles.socialProofText}>
                  {'\uD83C\uDFBE'} {upcomingRegisteredCount} player{upcomingRegisteredCount !== 1 ? 's' : ''} already registered for {featuredPoolName}
                </Text>
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          <EmptyState
            icon={'\uD83C\uDFBE'}
            title="No Pools Available"
            message="Check back soon for new tournaments."
          />
        }
        ListFooterComponent={
          <>
            {/* Invite code entry */}
            <View style={styles.inviteSection}>
              <Text style={styles.inviteSectionTitle}>Have an invite code?</Text>
              <Text style={styles.inviteSubtitle}>Enter a private group invite code below.</Text>
              <View style={styles.inviteRow}>
                <TextInput
                  style={styles.inviteInput}
                  placeholder="e.g. MADRID-4X7K2P"
                  placeholderTextColor={colours.inkGhost}
                  value={inviteCode}
                  onChangeText={(t) => { setInviteCode(t); setInviteError(null); }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleJoinByCode}
                />
                <TouchableOpacity
                  style={[styles.inviteButton, (!inviteCode.trim() || inviteLoading) && styles.inviteButtonDisabled]}
                  onPress={handleJoinByCode}
                  disabled={!inviteCode.trim() || inviteLoading}
                >
                  {inviteLoading ? (
                    <ActivityIndicator size="small" color={colours.primaryInk} />
                  ) : (
                    <Text style={styles.inviteButtonText}>Join</Text>
                  )}
                </TouchableOpacity>
              </View>
              {inviteError && <Text style={styles.inviteError}>{inviteError}</Text>}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('Terms' as any)}
              >
                Terms & Conditions
              </Text>
              <Text style={styles.footerCopy}>
                {'\u00A9'} 2026 Final Serve-ivor {'\u00B7'} Outsmart. Outlast. Win.
              </Text>
            </View>
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colours.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.canvas,
  },

  // ── Hero (deep emerald) ──
  heroBanner: {
    backgroundColor: colours.primary,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  eyebrow: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 36,
    color: colours.primaryInk,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: spacing.sm,
  },
  heroTitleItalic: {
    fontFamily: fonts.serifBoldItalic,
    color: colours.gold,
  },
  heroSubtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 22,
  },
  heroCta: {
    backgroundColor: colours.primaryInk,
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  heroCtaText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colours.primary,
    letterSpacing: -0.2,
  },
  heroCountdownBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  heroCountdownText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroStatItem: {
    gap: 2,
  },
  heroStatValue: {
    fontFamily: fonts.monoBold,
    fontSize: 18,
    color: colours.primaryInk,
  },
  heroStatLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
  },

  // ── How it works ──
  howSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  howTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colours.ink,
    marginBottom: spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepCard: {
    flex: 1,
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colours.border,
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colours.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stepNumberText: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    color: colours.primary,
  },
  stepLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colours.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  stepDescription: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colours.inkSoft,
    textAlign: 'center',
    lineHeight: 15,
  },

  // ── Sections ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  sectionHeaderAccent: {
    width: 3,
    height: 20,
    backgroundColor: colours.primary,
    borderRadius: 2,
  },
  sectionHeader: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colours.ink,
  },
  socialProof: {
    backgroundColor: colours.primarySoft,
    borderRadius: borderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  socialProofText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colours.primary,
  },
  cardContainer: {
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },

  // ── Invite code ──
  inviteSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colours.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colours.border,
  },
  inviteSectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colours.ink,
    marginBottom: spacing.xs,
  },
  inviteSubtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: colours.inkSoft,
    marginBottom: spacing.md,
  },
  inviteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inviteInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.monoRegular,
    fontSize: 14,
    color: colours.ink,
    backgroundColor: colours.surfaceMuted,
  },
  inviteButton: {
    height: 44,
    paddingHorizontal: spacing.lg,
    backgroundColor: colours.primary,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.5,
  },
  inviteButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colours.primaryInk,
  },
  inviteError: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colours.danger,
    marginTop: spacing.xs,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  footerLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colours.primary,
    marginBottom: spacing.xs,
  },
  footerCopy: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colours.inkSoft,
  },
});

export default PoolsScreen;
