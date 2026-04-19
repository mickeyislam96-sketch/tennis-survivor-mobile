import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getMyPools } from '../api/auth';
import { getPickHistory } from '../api/picks';
import { colours, spacing, borderRadius, fonts } from '../theme';
import { ROUND_LABELS, ROUND_ORDER } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

interface Pick {
  id: string;
  round: string;
  playerName: string;
  survived: boolean | null;
}

interface PoolPicks {
  groupId: string;
  groupName: string;
  picks: Pick[];
}

export default function MyPicksScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [poolPicks, setPoolPicks] = useState<PoolPicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const pools = await getMyPools();
      const settled = await Promise.allSettled(
        pools.map(async (pool: any) => {
          const id = pool.groupId || pool.id;
          const name = pool.groupName || pool.name;
          const picks = await getPickHistory(id);
          const sorted = [...picks].sort((a: any, b: any) =>
            ROUND_ORDER.indexOf(a.round as any) - ROUND_ORDER.indexOf(b.round as any)
          );
          return { groupId: id, groupName: name, picks: sorted };
        })
      );
      const results = settled
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<PoolPicks>).value);
      setPoolPicks(results);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

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
            icon="🎾"
            title="No picks yet"
            message="Join a pool and make your first pick"
          />
        }
        contentContainerStyle={poolPicks.length === 0 ? { flex: 1 } : { padding: spacing.md, paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <View style={styles.poolSection}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Pools', {
                  screen: 'Group',
                  params: { groupId: item.groupId },
                })
              }
            >
              <Text style={styles.poolName}>{item.groupName}</Text>
            </TouchableOpacity>
            {item.picks.length === 0 ? (
              <Text style={styles.noPicks}>No picks made yet</Text>
            ) : (
              item.picks.map((pick) => {
                const statusLabel =
                  pick.survived === true
                    ? 'Survived'
                    : pick.survived === false
                    ? 'Eliminated'
                    : 'Pending';

                const statusBg =
                  pick.survived === true
                    ? colours.successBg
                    : pick.survived === false
                    ? colours.dangerBg
                    : colours.gray100;

                const statusText =
                  pick.survived === true
                    ? colours.successDark
                    : pick.survived === false
                    ? colours.dangerDark
                    : colours.gray500;

                return (
                  <View key={pick.id} style={styles.pickCard}>
                    <View style={styles.pickRow}>
                      <View style={styles.pickInfo}>
                        <Text style={styles.pickRound}>{ROUND_LABELS[pick.round]}</Text>
                        <Text style={styles.pickPlayer}>{pick.playerName}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusLabel, { color: statusText }]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.canvas,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fonts.sansBold,
    color: colours.text,
    padding: spacing.md,
  },
  poolSection: {
    marginBottom: spacing.lg,
  },
  poolName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.serifBold,
    color: colours.text,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  noPicks: {
    color: colours.textMuted,
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    fontStyle: 'italic',
  },
  pickCard: {
    backgroundColor: colours.surface,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickInfo: {
    flex: 1,
  },
  pickRound: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.monoMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colours.textMuted,
    marginBottom: spacing.xs,
  },
  pickPlayer: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sansMedium,
    color: colours.text,
  },
  statusPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.sansSemiBold,
  },
});
