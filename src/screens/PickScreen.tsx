import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { colours, spacing, borderRadius, shadows } from '../theme';
import { getAvailablePlayers, submitPick, getPickHistory } from '../api/picks';
import type { Player as ApiPlayer, Pick as ApiPick } from '../api/picks';
import { getDeadlines, getRounds } from '../api/draw';
import type { Deadline as ApiDeadline } from '../api/draw';
import { getGroup } from '../api/groups';
import type { GroupMember } from '../api/groups';
import { useAuth } from '../context/AuthContext';
import { useCountdown } from '../hooks/useCountdown';
import { ROUND_ORDER, ROUND_LABELS } from '../utils/constants';
import PlayerRow from '../components/PlayerRow';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

import type { PoolsStackParamList } from '../navigation/PoolsStack';

type Props = NativeStackScreenProps<PoolsStackParamList, 'Pick'>;

export default function PickScreen({ route }: Props) {
  const { groupId } = route.params;
  const { user } = useAuth();

  // State
  const [available, setAvailable] = useState<ApiPlayer[]>([]);
  const [rounds, setRounds] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState('R1');
  const [deadlines, setDeadlines] = useState<ApiDeadline[]>([]);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allPicks, setAllPicks] = useState<ApiPick[]>([]);
  const [member, setMember] = useState<GroupMember | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<ApiPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDeadline = deadlines.find((d) => d.round === currentRound);
  const lockTime = currentDeadline?.lockAt || '';
  const countdown = useCountdown(lockTime);
  const myPickThisRound = allPicks.find((p) => p.round === currentRound) || null;

  // Computed state
  const isLocked = currentDeadline?.isLocked ?? false;
  const isOpen = currentDeadline?.isOpen ?? false;
  const isNotYetOpen = !isLocked && !isOpen;

  const survivedCount = allPicks.filter((p) => p.survived === true).length;

  // Previous round pending banner
  const prevRoundIndex = rounds.indexOf(currentRound) - 1;
  const prevRound = prevRoundIndex >= 0 ? rounds[prevRoundIndex] : null;
  const prevRoundPick = prevRound ? allPicks.find((p) => p.round === prevRound) : null;
  const prevDeadline = prevRound ? deadlines.find((d) => d.round === prevRound) : null;
  const prevRoundIsLocked = prevDeadline?.isLocked ?? false;
  const showPrevPickPending =
    isOpen &&
    prevRoundPick &&
    prevRoundPick.survived === null &&
    prevRoundIsLocked;

  // Used players from other rounds
  const usedIds = new Set(
    allPicks
      .filter((p) => p.round !== currentRound)
      .map((p) => p.playerId)
  );

  const usedLastNames = new Set(
    allPicks
      .filter((p) => p.round !== currentRound)
      .map((p) => {
        const parts = (p.playerName || '').trim().split(' ');
        return parts[parts.length - 1].toLowerCase();
      })
      .filter(Boolean)
  );

  // Filter available players
  const filtered = available.filter((p) => {
    const name = (p.name || '').toLowerCase().trim();
    const alive = !p.roundEliminated;
    const matchesSearch = !search.trim() || name.includes(search.trim().toLowerCase());
    return alive && matchesSearch;
  });

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [roundsData, deadlinesData, groupData, picksData] = await Promise.all([
          getRounds(),
          getDeadlines(),
          groupId ? getGroup(groupId) : Promise.resolve(null),
          groupId ? getPickHistory(groupId) : Promise.resolve([]),
        ]);

        setRounds(roundsData);
        setDeadlines(deadlinesData);
        setAllPicks(picksData);

        if (groupData) {
          const me = groupData.members?.find((m) => m.userId === user?.id) || null;
          setMember(me);
        }

        // Auto-navigate to first open round
        if (deadlinesData.length > 0) {
          for (const d of deadlinesData) {
            if (d.isOpen && !d.isLocked) {
              setCurrentRound(d.round);
              return;
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [groupId, user?.id]);

  // Fetch available players when round changes
  useEffect(() => {
    if (!groupId || !currentRound) return;

    const loadPlayers = async () => {
      try {
        const data = await getAvailablePlayers(groupId, currentRound);
        setAvailable(data);
      } catch {
        setAvailable([]);
      }
    };

    loadPlayers();
  }, [groupId, currentRound]);

  // Refetch picks when returning to screen
  useFocusEffect(
    useCallback(() => {
      if (!groupId) return;

      const refetch = async () => {
        try {
          const picksData = await getPickHistory(groupId);
          setAllPicks(picksData);
        } catch {
          // Silent fail
        }
      };

      refetch();
    }, [groupId])
  );

  const handleRoundChange = (round: string) => {
    setCurrentRound(round);
    setSearch('');
    setSelectedPlayer(null);
  };

  const handlePlayerSelect = (player: ApiPlayer) => {
    setSelectedPlayer(player);
  };

  const handleConfirmPick = async () => {
    if (!selectedPlayer || !groupId || submitting) return;

    Alert.alert(
      'Confirm pick',
      `Pick ${selectedPlayer.name} for ${ROUND_LABELS[currentRound] || currentRound}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSubmitting(true);
            try {
              await submitPick({
                groupId,
                round: currentRound,
                playerId: selectedPlayer.id,
                playerName: selectedPlayer.name,
              });

              const wasChange = !!myPickThisRound;

              // Update local state
              setAllPicks((prev) => [
                ...prev.filter((p) => p.round !== currentRound),
                {
                  id: 'local-' + Date.now(),
                  groupId,
                  userId: user?.id || '',
                  round: currentRound,
                  playerId: selectedPlayer.id,
                  playerName: selectedPlayer.name,
                  survived: null,
                  createdAt: new Date().toISOString(),
                },
              ]);

              setSelectedPlayer(null);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', wasChange ? 'Pick updated!' : 'Pick locked in!');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit pick');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading picks..." />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status strip */}
      {member && (
        <View
          style={[
            styles.statusStrip,
            member.isAlive ? styles.statusAlive : styles.statusOut,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: member.isAlive ? colours.primaryDark : colours.danger },
            ]}
          />
          <Text style={[styles.statusLabel, { color: member.isAlive ? colours.primaryDark : colours.danger }]}>
            {member.isAlive
              ? `You\u2019re alive \u00B7 ${survivedCount} round${survivedCount !== 1 ? 's' : ''} survived`
              : `Eliminated in ${member.eliminatedRound || 'unknown'}`}
          </Text>
        </View>
      )}

      {/* Round tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {rounds.map((round) => (
          <TouchableOpacity
            key={round}
            style={[styles.tab, currentRound === round && styles.tabActive]}
            onPress={() => handleRoundChange(round)}
          >
            <Text style={[styles.tabText, currentRound === round && styles.tabTextActive]}>
              {ROUND_LABELS[round] || round}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Countdown card (open) */}
      {isOpen && lockTime && (
        <View
          style={[
            styles.countdownCard,
            countdown.isExpired ? styles.countdownExpired : styles.countdownOpen,
          ]}
        >
          <Text style={styles.countdownLabel}>
            {countdown.isExpired ? 'Closed' : 'Closes in'}
          </Text>
          <Text style={styles.countdownValue}>
            {countdown.isExpired ? '\u2014' : countdown.display}
          </Text>
        </View>
      )}

      {/* Future window card (not open) */}
      {isNotYetOpen && currentDeadline?.opensAt && (
        <View style={styles.futureCard}>
          <Text style={styles.futureLabel}>This round hasn\u2019t opened yet</Text>
          <Text style={styles.futureValue}>
            Opens: {new Date(currentDeadline.opensAt).toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true
            })}
          </Text>
        </View>
      )}

      {/* Locked banner */}
      {isLocked && !myPickThisRound && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedIcon}>{'\uD83D\uDD12'}</Text>
          <Text style={styles.lockedText}>This round is locked</Text>
        </View>
      )}

      {/* Previous round pending banner */}
      {showPrevPickPending && (
        <View
          style={[styles.pendingBanner, !myPickThisRound && styles.pendingBannerUrgent]}
        >
          <Text style={styles.pendingIcon}>
            {myPickThisRound ? '\u23F3' : '\u26A0\uFE0F'}
          </Text>
          <View style={styles.pendingBody}>
            <Text style={styles.pendingTitle}>
              {myPickThisRound
                ? `${ROUND_LABELS[currentRound] || currentRound} pick submitted`
                : `Make your ${ROUND_LABELS[currentRound] || currentRound} pick now`}
            </Text>
            <Text style={styles.pendingSubtitle}>
              {myPickThisRound
                ? `Your ${prevRound} pick (${prevRoundPick?.playerName}) hasn\u2019t finished yet, but your ${currentRound} pick is saved.`
                : `Your ${prevRound} pick (${prevRoundPick?.playerName}) hasn\u2019t finished yet. The ${currentRound} window is open.`}
            </Text>
          </View>
        </View>
      )}

      {/* Current pick card (changeable) */}
      {myPickThisRound && isOpen && (
        <View style={[styles.pickCard, styles.pickCardChangeable]}>
          <Text style={styles.pickIcon}>{'\u2705'}</Text>
          <View style={styles.pickContent}>
            <Text style={styles.pickLabel}>YOUR {currentRound} PICK</Text>
            <Text style={styles.pickPlayer}>{myPickThisRound.playerName}</Text>
            <Text style={styles.pickHint}>Change before window closes</Text>
          </View>
        </View>
      )}

      {/* Current pick card (locked) */}
      {isLocked && myPickThisRound && (
        <View
          style={[
            styles.pickCard,
            myPickThisRound.survived === true && styles.pickCardSurvived,
            myPickThisRound.survived === false && styles.pickCardEliminated,
            myPickThisRound.survived === null && styles.pickCardLocked,
          ]}
        >
          <Text style={styles.pickIcon}>
            {myPickThisRound.survived === true ? '\u2713' : myPickThisRound.survived === false ? '\u2717' : '\uD83D\uDD12'}
          </Text>
          <View style={styles.pickContent}>
            <Text style={styles.pickLabel}>YOUR {currentRound} PICK \u2014 LOCKED</Text>
            <Text style={styles.pickPlayer}>{myPickThisRound.playerName}</Text>
            {myPickThisRound.survived === true && (
              <Badge label="Advanced \u2713" variant="success" />
            )}
            {myPickThisRound.survived === false && (
              <Badge label="Eliminated \u2717" variant="danger" />
            )}
            {myPickThisRound.survived === null && (
              <Badge label="Match pending" variant="muted" />
            )}
          </View>
        </View>
      )}

      {/* Missed pick */}
      {isLocked && !myPickThisRound && (
        <View style={[styles.pickCard, styles.pickCardMissed]}>
          <Text style={styles.pickIcon}>{'\u26A0\uFE0F'}</Text>
          <View style={styles.pickContent}>
            <Text style={styles.pickLabel}>No pick made for {ROUND_LABELS[currentRound] || currentRound}</Text>
          </View>
        </View>
      )}

      {/* Selected player confirmation */}
      {selectedPlayer && isOpen && (
        <View style={[styles.pickCard, styles.pickCardSelection]}>
          <Text style={styles.pickIcon}>{'\uD83D\uDC64'}</Text>
          <View style={styles.pickContent}>
            <Text style={styles.pickLabel}>CONFIRM PICK</Text>
            <Text style={styles.pickPlayer}>{selectedPlayer.name}</Text>
            {selectedPlayer.seed != null && (
              <Text style={styles.pickSeed}>#{selectedPlayer.seed} seed</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
            onPress={handleConfirmPick}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colours.white} size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Search and player list (only when open) */}
      {isOpen && (
        <>
          <TextInput
            style={styles.searchInput}
            placeholder="Search players\u2026"
            placeholderTextColor={colours.textMuted}
            value={search}
            onChangeText={setSearch}
          />

          <Text style={styles.playerCount}>
            {filtered.length} player{filtered.length !== 1 ? 's' : ''} available
          </Text>

          <FlatList
            data={filtered}
            renderItem={({ item: player }) => {
              const isUsed = usedIds.has(player.id) || usedLastNames.has(
                (player.name || '').split(' ').pop()?.toLowerCase() || ''
              );
              const isCurrentPick = player.id === myPickThisRound?.playerId;
              const isPending = !!player.pendingPrevRound && !isUsed;

              return (
                <PlayerRow
                  player={player}
                  isSelected={selectedPlayer?.id === player.id}
                  isCurrentPick={isCurrentPick}
                  isUsed={isUsed}
                  isPending={isPending}
                  pendingRound={prevRound || undefined}
                  onPress={() => handlePlayerSelect(player)}
                  disabled={isUsed || isCurrentPick || submitting}
                />
              );
            }}
            keyExtractor={(p) => p.id}
            scrollEnabled={false}
          />
        </>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  // Status strip
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  statusAlive: {
    backgroundColor: colours.primaryLight,
    borderColor: colours.successBorder,
  },
  statusOut: {
    backgroundColor: colours.dangerBg,
    borderColor: colours.dangerBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },

  // Round tabs
  tabsScroll: {
    marginBottom: spacing.md,
  },
  tabsContent: {
    flexDirection: 'row',
    gap: 6,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colours.border,
    backgroundColor: colours.surface,
  },
  tabActive: {
    backgroundColor: colours.primary,
    borderColor: colours.primary,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colours.textMuted,
  },
  tabTextActive: {
    color: colours.white,
    fontWeight: '600',
  },

  // Countdown
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  countdownOpen: {
    backgroundColor: colours.amber50,
    borderColor: colours.amber200,
  },
  countdownExpired: {
    backgroundColor: colours.surfaceAlt,
    borderColor: colours.border,
  },
  countdownLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colours.amber700,
    marginRight: spacing.sm,
  },
  countdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colours.amber800,
    fontFamily: 'monospace',
  },

  // Future card
  futureCard: {
    backgroundColor: colours.blue50,
    borderWidth: 1.5,
    borderColor: colours.blue200,
    borderRadius: borderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  futureLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colours.blue800,
    marginBottom: 4,
  },
  futureValue: {
    fontSize: 13,
    color: colours.blue700,
    fontWeight: '500',
  },

  // Locked banner
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.surfaceAlt,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colours.border,
  },
  lockedIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  lockedText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colours.textMuted,
  },

  // Pending banner
  pendingBanner: {
    flexDirection: 'row',
    backgroundColor: colours.amber50,
    borderWidth: 1,
    borderColor: colours.amber400,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  pendingBannerUrgent: {
    backgroundColor: colours.red50,
    borderColor: colours.red400,
  },
  pendingIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  pendingBody: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colours.gray700,
    marginBottom: 4,
  },
  pendingSubtitle: {
    fontSize: 13,
    color: colours.gray500,
    lineHeight: 18,
  },

  // Pick cards
  pickCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  pickCardChangeable: {
    backgroundColor: colours.amber50,
    borderColor: '#fcd34d',
  },
  pickCardSurvived: {
    backgroundColor: colours.green50,
    borderColor: colours.green300,
  },
  pickCardEliminated: {
    backgroundColor: colours.red50,
    borderColor: colours.dangerBorder,
  },
  pickCardLocked: {
    backgroundColor: colours.surfaceAlt,
    borderColor: colours.border,
  },
  pickCardMissed: {
    backgroundColor: colours.red50,
    borderColor: colours.dangerBorder,
  },
  pickCardSelection: {
    backgroundColor: colours.surface,
    borderColor: colours.primary,
  },
  pickIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  pickContent: {
    flex: 1,
  },
  pickLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pickPlayer: {
    fontSize: 17,
    fontWeight: '700',
    color: colours.text,
    marginBottom: 4,
  },
  pickHint: {
    fontSize: 12,
    color: colours.textMuted,
  },
  pickSeed: {
    fontSize: 12,
    color: colours.textMuted,
    marginTop: 4,
  },

  // Confirm button
  confirmButton: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginLeft: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colours.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Search
  searchInput: {
    backgroundColor: colours.surface,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colours.text,
    marginBottom: spacing.md,
  },

  // Player count
  playerCount: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colours.textMuted,
    marginBottom: spacing.sm,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.text,
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: 13,
    color: colours.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },

  // Error banner
  errorBanner: {
    backgroundColor: colours.dangerBg,
    borderWidth: 1,
    borderColor: colours.dangerBorder,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: colours.danger,
    fontWeight: '500',
  },

  spacer: {
    height: spacing.xl,
  },
});
