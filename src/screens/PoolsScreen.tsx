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
import { PoolCard } from '../components/PoolCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { colours, spacing, typography } from '../theme';

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
      <View style={styles.header}>
        <Text style={styles.title}>Final Serve-ivor</Text>
      </View>

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
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  title: {
    ...typography.h1,
    color: colours.primary,
  },
  listContent: {
    paddingVertical: spacing.md,
  },
});
