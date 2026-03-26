import React, { useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  SectionList,
  StyleSheet,
  RefreshControl,
  View,
  Text,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { usePollData } from '../hooks/usePollData';
import { getPools, Pool } from '../api/groups';
import PoolCard from '../components/PoolCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { colours, spacing, borderRadius } from '../theme';

type RootStackParamList = {
  Group: { groupId: string };
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

  const handlePoolPress = useCallback(
    (pool: Pool) => {
      navigation.navigate('Group', { groupId: pool.id });
    },
    [navigation],
  );

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
    if (active.length > 0) result.push({ title: 'Active Pools', data: active });
    if (upcoming.length > 0) result.push({ title: 'Upcoming', data: upcoming });
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
            {/* Green hero banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroOverlay} />
              <Text style={styles.eyebrow}>TENNIS SURVIVOR</Text>
              <Text style={styles.heroTitle}>Final Serve-ivor</Text>
              <Text style={styles.heroSubtitle}>
                Pick one player per round. If they lose, you{'\u2019'}re out. Last one standing wins.
              </Text>
            </View>
          </>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <PoolCard pool={item} onPress={() => handlePoolPress(item)} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={'\uD83C\uDFBE'}
            title="No Pools Available"
            message="Check back soon for new tournaments."
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Terms' as any)}
            >
              Terms & Conditions
            </Text>
            <Text style={styles.footerCopy}>
              {'\u00A9'} 2026 Final Serve-ivor {'\u00B7'} A game of skill
            </Text>
          </View>
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
    backgroundColor: colours.background,
  },
  heroBanner: {
    backgroundColor: colours.primary,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
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
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    position: 'relative',
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colours.white,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    position: 'relative',
    zIndex: 1,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    position: 'relative',
    zIndex: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colours.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  cardContainer: {
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colours.primary,
    marginBottom: spacing.xs,
  },
  footerCopy: {
    fontSize: 12,
    color: colours.textMuted,
  },
});

export default PoolsScreen;
