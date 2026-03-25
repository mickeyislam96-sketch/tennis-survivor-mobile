import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  SafeAreaView, SectionList, StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getRounds, getBracket, DrawMatch } from '../api/draw';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { colours, spacing, borderRadius, shadows } from '../theme';
import { ROUND_LABELS } from '../utils/constants';

interface Section {
  title: string;
  data: DrawMatch[];
}

export function DrawScreen() {
  const route = useRoute<any>();
  const { groupId } = route.params;

  const [rounds, setRounds] = useState<string[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [roundsList, bracket] = await Promise.all([
        getRounds(),
        getBracket(),
      ]);
      setRounds(roundsList);

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
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner message="Loading draw..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const renderMatch = ({ item }: { item: DrawMatch }) => {
    const isCompleted = item.status === 'completed';
    const isLive = item.status === 'live' || item.status === 'in_progress';
    const p1Won = item.winnerId === item.player1Id;
    const p2Won = item.winnerId === item.player2Id;

    return (
      <View style={[styles.matchCard, shadows.card]}>
        {isLive && (
          <View style={styles.liveDot}>
            <View style={styles.liveDotInner} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        <View style={styles.matchRow}>
          <Text style={[
            styles.playerName,
            p1Won && styles.winnerName,
            (isCompleted && !p1Won) && styles.loserName,
          ]}>
            {item.player1Name || 'TBD'}
          </Text>
          {isCompleted && p1Won && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.matchDivider} />
        <View style={styles.matchRow}>
          <Text style={[
            styles.playerName,
            p2Won && styles.winnerName,
            (isCompleted && !p2Won) && styles.loserName,
          ]}>
            {item.player2Name || 'TBD'}
          </Text>
          {isCompleted && p2Won && <Text style={styles.checkmark}>✓</Text>}
        </View>
        {item.score && (
          <Text style={styles.score}>{item.score}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.primary} />
        }
        ListEmptyComponent={<EmptyState title="No draw data" message="The draw hasn't been published yet." />}
        contentContainerStyle={sections.length === 0 ? { flex: 1 } : { paddingBottom: spacing.xxl }}
        stickySectionHeadersEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.text,
    backgroundColor: colours.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: spacing.md,
  },
  matchCard: {
    backgroundColor: colours.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  matchDivider: {
    height: 1,
    backgroundColor: colours.border,
    marginVertical: 4,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: colours.textSecondary,
    flex: 1,
  },
  winnerName: {
    color: colours.success,
    fontWeight: '700',
  },
  loserName: {
    color: colours.textMuted,
    fontWeight: '400',
  },
  checkmark: {
    color: colours.success,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  score: {
    fontSize: 12,
    color: colours.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  liveDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colours.danger,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: colours.danger,
    letterSpacing: 1,
  },
});
