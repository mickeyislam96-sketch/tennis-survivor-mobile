import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getMyPools } from '../api/auth';
import { getPickHistory, Pick } from '../api/picks';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { colours, spacing, borderRadius, shadows } from '../theme';
import { ROUND_LABELS, ROUND_ORDER } from '../utils/constants';

interface PoolPicks {
  groupId: string;
  groupName: string;
  picks: Pick[];
}

export function MyPicksScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [poolPicks, setPoolPicks] = useState<PoolPicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const pools = await getMyPools();
      const results: PoolPicks[] = [];

      for (const pool of pools) {
        try {
          const picks = await getPickHistory(pool.id);
          const sorted = [...picks].sort((a, b) =>
            ROUND_ORDER.indexOf(a.round as any) - ROUND_ORDER.indexOf(b.round as any)
          );
          results.push({ groupId: pool.id, groupName: pool.name, picks: sorted });
        } catch {
          // Skip pools where picks fail
        }
      }
      setPoolPicks(results);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner message="Loading your picks..." />;

  const getResultVariant = (survived: boolean | null) => {
    if (survived === true) return 'success' as const;
    if (survived === false) return 'danger' as const;
    return 'muted' as const;
  };

  const getResultLabel = (survived: boolean | null) => {
    if (survived === true) return 'Survived';
    if (survived === false) return 'Eliminated';
    return 'Pending';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Picks</Text>
      <FlatList
        data={poolPicks}
        keyExtractor={(item) => item.groupId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No picks yet"
            message="Join a pool and make your first pick to see your history here."
          />
        }
        contentContainerStyle={poolPicks.length === 0 ? { flex: 1 } : { padding: spacing.md, paddingBottom: spacing.xxl }}
        renderItem={({ item }) => (
          <View style={styles.poolSection}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Pools', { screen: 'Group', params: { groupId: item.groupId } })}
            >
              <Text style={styles.poolName}>{item.groupName}</Text>
            </TouchableOpacity>
            {item.picks.length === 0 ? (
              <Text style={styles.noPicks}>No picks made yet</Text>
            ) : (
              item.picks.map((pick) => (
                <View key={pick.id} style={[styles.pickCard, shadows.card]}>
                  <View style={styles.pickRow}>
                    <View>
                      <Text style={styles.pickRound}>{ROUND_LABELS[pick.round] || pick.round}</Text>
                      <Text style={[
                        styles.pickPlayer,
                        pick.survived === true && { color: colours.success },
                        pick.survived === false && { color: colours.danger },
                      ]}>
                        {pick.playerName}
                      </Text>
                    </View>
                    <Badge
                      label={getResultLabel(pick.survived)}
                      variant={getResultVariant(pick.survived)}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: colours.text,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  poolSection: {
    marginBottom: spacing.lg,
  },
  poolName: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.primary,
    marginBottom: spacing.sm,
  },
  noPicks: {
    color: colours.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  pickCard: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickRound: {
    fontSize: 12,
    fontWeight: '600',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickPlayer: {
    fontSize: 16,
    fontWeight: '600',
    color: colours.text,
    marginTop: 2,
  },
});
