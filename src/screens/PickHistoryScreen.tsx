import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { colours, spacing, borderRadius, shadows, fonts } from '../theme';
import { getPickHistory } from '../api/picks';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { ROUND_ORDER, ROUND_LABELS } from '../utils/constants';

interface PickHistoryScreenProps {
  route: {
    params: {
      groupId: string;
    };
  };
}

interface Pick {
  id: string;
  round: string;
  playerName: string;
  survived: boolean | null;
}

export default function PickHistoryScreen({ route }: PickHistoryScreenProps) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPickHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const history = await getPickHistory(groupId);
      const sorted = (history || []).sort((a: any, b: any) => {
        const indexA = ROUND_ORDER.indexOf(a.round as any);
        const indexB = ROUND_ORDER.indexOf(b.round as any);
        return indexA - indexB;
      });
      setPicks(sorted);
    } catch (error) {
      console.error('Failed to load pick history:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, groupId]);

  useEffect(() => {
    loadPickHistory();
  }, [loadPickHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPickHistory();
    setRefreshing(false);
  }, [loadPickHistory]);

  const renderPick = ({ item }: { item: Pick }) => {
    const statusColors = {
      survived: { bg: colours.successBg, text: colours.successDark },
      eliminated: { bg: colours.dangerBg, text: colours.dangerDark },
      pending: { bg: colours.gray100, text: colours.gray500 },
    };

    const statusLabel = {
      survived: 'Survived',
      eliminated: 'Eliminated',
      pending: 'Pending',
    };

    let status: keyof typeof statusColors;
    let label: string;

    if (item.survived === true) {
      status = 'survived';
      label = 'Survived';
    } else if (item.survived === false) {
      status = 'eliminated';
      label = 'Eliminated';
    } else {
      status = 'pending';
      label = 'Pending';
    }

    const color = statusColors[status];

    return (
      <View style={styles.pickCard}>
        <View style={styles.pickHeader}>
          <Text style={styles.roundLabel}>{ROUND_LABELS[item.round]}</Text>
          <View style={[styles.statusPill, { backgroundColor: color.bg }]}>
            <Text style={[styles.statusText, { color: color.text }]}>{label}</Text>
          </View>
        </View>
        <Text style={styles.playerName}>{item.playerName}</Text>
      </View>
    );
  };

  const keyExtractor = (item: Pick) => item.id;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (picks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="📋"
          title="No picks yet"
          message="Join a pool and make your first pick"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={picks}
        renderItem={renderPick}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.canvas,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  pickCard: {
    backgroundColor: colours.surface,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  roundLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.monoMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colours.inkMuted,
  },
  statusPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.sansSemiBold,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sansBold,
    color: colours.ink,
  },
});
