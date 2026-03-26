import React, { useCallback } from 'react';
import {
  SafeAreaView,
  FlatList,
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
import { colours, spacing, borderRadius, typography } from '../theme';

type RootStackParamList = {
  Group: { groupId: string };
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
      {/* Green gradient hero banner */}
      <View style={styles.heroBanner}>
        {/* Overlay texture effect */}
        <View style={styles.heroOverlay} />

        <Text style={styles.eyebrow}>TENNIS SURVIVOR</Text>
        <Text style={styles.heroTitle}>Final Serve-ivor</Text>
        <Text style={styles.heroSubtitle}>
          Pick one player per round. If they lose, you're out. Last one standing wins.
        </Text>
      </View>

      {/* Section header */}
      <Text style={styles.sectionHeader}>Your Pools</Text>

      {/* Pools list */}
      {pools && pools.length === 0 ? (
        <EmptyState
          icon="🎾"
          title="No Pools Available"
          message="Check back soon for new tournaments."
        />
      ) : (
        <FlatList
          data={pools}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PoolCard
              pool={item}
              onPress={() => handlePoolPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colours.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}
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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
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
    fontSize: 20,
    fontWeight: '700',
    color: colours.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
});

export default PoolsScreen;
