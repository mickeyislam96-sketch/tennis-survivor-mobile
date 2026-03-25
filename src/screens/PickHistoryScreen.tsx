import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, RefreshControl, SafeAreaView, StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getPickHistory, Pick } from '../api/picks';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { colours, spacing, borderRadius, shadows } from '../theme';
import { ROUND_LABELS, ROUND_ORDER } from '../utils/constants';

export function PickHistoryScreen() {
  const route = useRoute<any>();
  const { groupId } = route.params;

  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getPickHistory(groupId);
      // Sort by round order
      const sorted = [...data].sort((a, b) => {
        return ROUND_ORDER.indexOf(a.round as any) - ROUND_ORDER.indexOf(b.round as any);
      });
      setPicks(sorted);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner message="Loading history..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const getResultVariant = (survived: boolean | null) => {
    if (survived === true) return 'success';
    if (survived === false) return 'danger';
    return 'muted';
  };

  const getResultLabel = (survived: boolean | null) => {
    if (survived === true) return 'Survived';
    if (survived === false) return 'Eliminated';
    return 'Pending';
  };

  const renderPick = ({ item }: { item: Pick }) => (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.cardHeader}>
        <Text style={styles.round}>{ROUND_LABELS[item.round] || item.round}</Text>
        <Badge
          label={getResultLabel(item.survived)}
          variant={getResultVariant(item.survived)}
        />
      </View>
      <Text style={[
        styles.playerName,
        item.survived === true && { color: colours.success },
        item.survived === false && { color: colours.danger },
      ]}>
        {item.playerName}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={picks}
        keyExtractor={(item) => item.id}
        renderItem={renderPick}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.primary} />
        }
        ListEmptyComponent={
          <EmptyState title="No picks yet" message="You haven't made any picks in this pool yet." />
        }
        contentContainerStyle={picks.length === 0 ? { flex: 1 } : { padding: spacing.md, paddingBottom: spacing.xxl }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  card: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  round: {
    fontSize: 13,
    fontWeight: '600',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colours.text,
  },
});
