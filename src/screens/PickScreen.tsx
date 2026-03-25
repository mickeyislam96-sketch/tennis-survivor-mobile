import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { usePollData } from '../hooks/usePollData';
import { getAvailablePlayers, submitPick, getPickHistory, Player, Pick } from '../api/picks';
import { getRounds, getDeadlines, Deadline } from '../api/draw';
import { PlayerRow } from '../components/PlayerRow';
import { Countdown } from '../components/Countdown';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Badge } from '../components/Badge';
import { colours, spacing, typography, borderRadius } from '../theme';
import { ROUND_LABELS } from '../utils/constants';

type RootStackParamList = {
  Pick: { groupId: string };
};

type PickScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: PickScreenNavigationProp;
  route: { params: { groupId: string } };
}

export function PickScreen({ route }: Props) {
  const { user } = useAuth();
  const { groupId } = route.params;

  const [currentRound, setCurrentRound] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { data: rounds, loading: roundsLoading, error: roundsError, refresh: refreshRounds } = usePollData(
    () => getRounds(),
    30000,
    [groupId],
  );

  const { data: deadlines, loading: deadlinesLoading, error: deadlinesError, refresh: refreshDeadlines } = usePollData(
    () => getDeadlines(),
    30000,
    [groupId],
  );

  const { data: availablePlayers, loading: playersLoading, error: playersError, refresh: refreshPlayers } = usePollData(
    () => (currentRound ? getAvailablePlayers(groupId, currentRound) : Promise.resolve([])),
    30000,
    [groupId, currentRound],
  );

  const { data: pickHistory, loading: historyLoading, error: historyError, refresh: refreshHistory } = usePollData(
    () => getPickHistory(groupId),
    30000,
    [groupId],
  );

  // Set initial round to first round if not set
  React.useEffect(() => {
    if (rounds && rounds.length > 0 && !currentRound) {
      setCurrentRound(rounds[0]);
    }
  }, [rounds, currentRound]);

  // Find current round's deadline
  const currentDeadline = useMemo(() => {
    if (!currentRound || !deadlines) return null;
    return deadlines.find((d) => d.round === currentRound) || null;
  }, [currentRound, deadlines]);

  const isRoundLocked = useMemo(() => {
    return currentDeadline?.isLocked ?? false;
  }, [currentDeadline]);

  const isRoundOpen = useMemo(() => {
    return currentDeadline?.isOpen ?? false;
  }, [currentDeadline]);

  // Current pick for this round
  const currentPick = useMemo(() => {
    if (!currentRound || !pickHistory) return null;
    return pickHistory.find((p) => p.round === currentRound) || null;
  }, [currentRound, pickHistory]);

  // Exclude already-picked players from other rounds
  const pickedPlayerIds = useMemo(() => {
    if (!pickHistory) return new Set();
    return new Set(pickHistory.map((p) => p.playerId));
  }, [pickHistory]);

  const filteredPlayers = useMemo(() => {
    if (!availablePlayers) return [];
    return availablePlayers
      .filter((p) => !pickedPlayerIds.has(p.id))
      .filter((p) =>
        p.name.toLowerCase().includes(searchText.toLowerCase()),
      );
  }, [availablePlayers, pickedPlayerIds, searchText]);

  const handlePlayerPress = useCallback((player: Player) => {
    setSelectedPlayer(player);
  }, []);

  const handleSubmitPick = useCallback(async () => {
    if (!selectedPlayer || !currentRound) return;

    const warning = selectedPlayer.pendingPrevRound
      ? "\n\n\u26A0\uFE0F This player\u2019s previous round result is still pending. If they lose, your pick will be voided."
      : '';

    Alert.alert(
      'Confirm Pick',
      `Pick ${selectedPlayer.name} for ${ROUND_LABELS[currentRound]}?${warning}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await submitPick({
                groupId,
                round: currentRound,
                playerId: selectedPlayer.id,
                playerName: selectedPlayer.name,
              });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await refreshHistory();
              await refreshPlayers();
              setSelectedPlayer(null);
              Alert.alert('Success', `${selectedPlayer.name} picked for ${ROUND_LABELS[currentRound]}.`);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to submit pick');
            }
          },
        },
      ],
    );
  }, [selectedPlayer, currentRound, groupId, refreshHistory, refreshPlayers]);

  const loading = roundsLoading || deadlinesLoading || playersLoading || historyLoading;
  const error = roundsError || deadlinesError || playersError || historyError;

  if (loading && !rounds) {
    return <LoadingSpinner message="Loading picks..." />;
  }

  if (error && !rounds) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={() => {
            refreshRounds();
            refreshDeadlines();
            refreshPlayers();
            refreshHistory();
          }}
        />
      </SafeAreaView>
    );
  }

  if (!rounds || rounds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="No rounds available" onRetry={refreshRounds} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Round Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled>
          {rounds.map((round) => (
            <TouchableOpacity
              key={round}
              onPress={() => {
                setCurrentRound(round);
                setSearchText('');
                setSelectedPlayer(null);
              }}
              style={[
                styles.tab,
                currentRound === round && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  currentRound === round && styles.tabTextActive,
                ]}
              >
                {ROUND_LABELS[round]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Countdown */}
      {currentDeadline && <Countdown targetDate={currentDeadline.lockAt} label={`Picks lock in`} />}

      {/* Status Messages */}
      {isRoundLocked && !currentPick && (
        <View style={[styles.statusBanner, { backgroundColor: colours.dangerBg }]}>
          <Text style={{ color: colours.danger, fontWeight: '600', fontSize: 14 }}>
            This round is locked.
          </Text>
        </View>
      )}
      {!isRoundOpen && !isRoundLocked && (
        <View style={[styles.statusBanner, { backgroundColor: colours.infoBg }]}>
          <Text style={{ color: colours.info, fontWeight: '600', fontSize: 14 }}>
            This round is not yet open.
          </Text>
        </View>
      )}

      {/* Pending Previous Round Warning */}
      {availablePlayers &&
        availablePlayers.some((p) => p.pendingPrevRound) && (
        <View style={[styles.warningBanner]}>
          <Text style={styles.warningText}>
            ⚠️ Some players have pending previous-round results. Their picks may be voided if they lose.
          </Text>
        </View>
      )}

      {/* Current Pick Card */}
      {currentPick && (
        <View style={styles.currentPickCard}>
          <Text style={styles.currentPickLabel}>Your pick this round:</Text>
          <Text style={styles.currentPickName}>{currentPick.playerName}</Text>
          {currentPick.survived !== null && (
            <Badge
              label={currentPick.survived ? 'Survived' : 'Eliminated'}
              variant={currentPick.survived ? 'success' : 'danger'}
            />
          )}
          {currentPick.survived === null && (
            <Badge label="Pending" variant="muted" />
          )}
        </View>
      )}

      {/* Search Input */}
      {!isRoundLocked && (
        <TextInput
          style={styles.searchInput}
          placeholder="Search player..."
          placeholderTextColor={colours.textMuted}
          value={searchText}
          onChangeText={setSearchText}
        />
      )}

      {/* Selected Player Card */}
      {selectedPlayer && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedName}>{selectedPlayer.name}</Text>
            {selectedPlayer.seed && (
              <Badge label={`Seed ${selectedPlayer.seed}`} variant="info" />
            )}
          </View>
          {selectedPlayer.pendingPrevRound && (
            <View style={styles.pendingWarning}>
              <Text style={styles.pendingWarningText}>
                ⚠️ Previous round result pending
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitPick}
          >
            <Text style={styles.submitButtonText}>Confirm Pick</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Players List */}
      <FlatList
        data={filteredPlayers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlayerRow
            player={item}
            onPress={() => handlePlayerPress(item)}
            isCurrentPick={item.id === selectedPlayer?.id}
            disabled={isRoundLocked || !isRoundOpen}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              refreshPlayers();
              refreshHistory();
            }}
            tintColor={colours.primary}
          />
        }
        contentContainerStyle={styles.listContent}
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
  tabsContainer: {
    backgroundColor: colours.surface,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colours.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colours.textMuted,
  },
  tabTextActive: {
    color: colours.primary,
    fontWeight: '700',
  },
  statusBanner: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  warningBanner: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colours.warningBg,
  },
  warningText: {
    color: colours.warning,
    fontWeight: '600',
    fontSize: 12,
  },
  currentPickCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colours.successBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colours.success,
  },
  currentPickLabel: {
    ...typography.caption,
    color: colours.textMuted,
    marginBottom: spacing.xs,
  },
  currentPickName: {
    ...typography.h3,
    color: colours.success,
    marginBottom: spacing.sm,
  },
  searchInput: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    color: colours.text,
    borderWidth: 1,
    borderColor: colours.border,
  },
  selectedCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colours.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colours.primary,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  selectedName: {
    ...typography.h3,
    color: colours.primary,
  },
  pendingWarning: {
    backgroundColor: colours.warningBg,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  pendingWarningText: {
    color: colours.warning,
    fontWeight: '600',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
});
