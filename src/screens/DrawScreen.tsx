import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  SafeAreaView, SectionList, StyleSheet, ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getRounds, getBracket, DrawMatch } from '../api/draw';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { colours, spacing, borderRadius } from '../theme';
import { ROUND_LABELS } from '../utils/constants';

interface Section {
  title: string;
  data: DrawMatch[];
}

export function DrawScreen() {
  const route = useRoute<any>();
  const { groupId, drawAvailable } = route.params;

  const [rounds, setRounds] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If draw is explicitly not available, skip API calls entirely
  const isDrawUnavailable = drawAvailable === false;

  const loadData = useCallback(async () => {
    if (isDrawUnavailable) {
      setLoading(false);
      return;
    }
    try {
      const [roundsList, bracket] = await Promise.all([
        getRounds(),
        getBracket(),
      ]);
      setRounds(roundsList);

      // Set initial round to first round if not set
      if (currentRound === null && roundsList.length > 0) {
        setCurrentRound(roundsList[0]);
      }

      // Group matches by round
      const matchesByRound: Record<string, DrawMatch[]> = {};
      for (const m of bracket.matches) {
        if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
        matchesByRound[m.round].push(m);
      }

      // Build sections in round order
      const secs: Section[] = [];
      for (const r of roundsList) {
        if (matchesByRound[r]?.length) {
          secs.push({
            title: ROUND_LABELS[r] || r,
            data: matchesByRound[r].sort((a, b) => a.matchOrder - b.matchOrder),
          });
        }
      }
      setSections(secs);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentRound, isDrawUnavailable]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner message="Loading draw..." />;

  // Draw not yet released — show dedicated empty state
  if (isDrawUnavailable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.drawUnavailable}>
          <Text style={styles.drawUnavailableEmoji}>{'\uD83C\uDFBE'}</Text>
          <Text style={styles.drawUnavailableTitle}>Draw Not Yet Released</Text>
          <Text style={styles.drawUnavailableMessage}>
            The official tournament draw hasn't been published yet. Once it's released by the tournament organisers, the full bracket will appear here.
          </Text>
          <View style={styles.drawUnavailableCard}>
            <Text style={styles.drawUnavailableCardIcon}>{'\uD83D\uDCC5'}</Text>
            <Text style={styles.drawUnavailableCardText}>
              Check back closer to the tournament start date.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  // Filter sections based on current round
  const filteredSections = currentRound
    ? sections.filter((s) => ROUND_LABELS[currentRound] === s.title)
    : sections;

  const renderMatch = ({ item }: { item: DrawMatch }) => {
    const isCompleted = item.status === 'completed';
    const isLive = item.status === 'live' || item.status === 'in_progress';
    const p1Won = item.winnerId === item.player1Id;
    const p2Won = item.winnerId === item.player2Id;

    let statusBg = colours.gray50;
    let statusText = colours.gray500;
    let statusLabel = 'Upcoming';

    if (isCompleted) {
      statusBg = '#dcfce7';
      statusText = '#15803d';
      statusLabel = 'Done';
    } else if (isLive) {
      statusBg = '#fee2e2';
      statusText = '#ef4444';
      statusLabel = 'Live';
    }

    return (
      <View style={styles.matchCard}>
        {isLive && (
          <View style={styles.liveIndicator}>
            <Text style={styles.liveIndicatorText}>LIVE</Text>
          </View>
        )}

        {/* Player 1 */}
        <View style={styles.playerRow}>
          <Text style={[
            styles.playerName,
            p1Won && styles.playerWinner,
            isCompleted && !p1Won && styles.playerLoser,
          ]}>
            {item.player1Name || 'TBD'}
          </Text>
          {item.score && (
            <Text style={styles.score}>{item.score.split(' ')[0]}</Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Player 2 */}
        <View style={styles.playerRow}>
          <Text style={[
            styles.playerName,
            p2Won && styles.playerWinner,
            isCompleted && !p2Won && styles.playerLoser,
          ]}>
            {item.player2Name || 'TBD'}
          </Text>
          {item.score && (
            <Text style={styles.score}>{item.score.split(' ')[item.score.split(' ').length - 1]}</Text>
          )}
        </View>

        {/* Meta Footer */}
        <View style={styles.metaSection}>
          <Text style={styles.dateText}>{item.startTime ? new Date(item.startTime).toLocaleDateString() : '–'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusText }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Round Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled>
          {rounds.map((round) => (
            <TouchableOpacity
              key={round}
              onPress={() => setCurrentRound(round)}
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
                {ROUND_LABELS[round] || round}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Draw List */}
      <FlatList
        data={filteredSections.length > 0 ? filteredSections[0].data : []}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            title="Draw not published"
            message="The draw hasn't been published yet."
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredSections.length === 0 && { flex: 1 }
        ]}
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

  // TABS
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
    marginRight: spacing.sm,
  },
  tabActive: {
    borderBottomColor: colours.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '400',
    color: colours.textMuted,
  },
  tabTextActive: {
    color: colours.primary,
    fontWeight: '700',
  },

  // MATCH CARD
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  matchCard: {
    backgroundColor: colours.white,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },

  // Live indicator
  liveIndicator: {
    backgroundColor: colours.red50,
    borderBottomWidth: 1,
    borderBottomColor: colours.red100,
    paddingVertical: 3,
    paddingHorizontal: spacing.md,
  },
  liveIndicatorText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colours.red500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Player rows
  playerRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    color: colours.gray700,
    alignItems: 'center',
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    color: colours.gray700,
    maxWidth: '85%',
  },
  playerWinner: {
    fontWeight: '700',
    color: colours.green700,
  },
  playerLoser: {
    color: colours.gray400,
  },
  score: {
    fontSize: 13,
    fontWeight: '600',
    color: colours.gray500,
    marginLeft: spacing.sm,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colours.gray100,
  },

  // Meta section
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colours.gray50,
    borderTopWidth: 1,
    borderTopColor: colours.gray100,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  dateText: {
    fontSize: 11.5,
    color: colours.gray400,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Draw unavailable state
  drawUnavailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
  },
  drawUnavailableEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  drawUnavailableTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colours.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  drawUnavailableMessage: {
    fontSize: 15,
    color: colours.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  drawUnavailableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.blue50,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colours.blue100,
    gap: spacing.sm,
  },
  drawUnavailableCardIcon: {
    fontSize: 20,
  },
  drawUnavailableCardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: colours.blue700,
    lineHeight: 18,
  },
});

export default DrawScreen;
