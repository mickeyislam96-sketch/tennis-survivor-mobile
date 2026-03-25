import React, { useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { usePollData } from '../hooks/usePollData';
import { getGroup, Group, joinGroup } from '../api/groups';
import { getDeadlines, Deadline } from '../api/draw';
import { Countdown } from '../components/Countdown';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { colours, spacing, typography, borderRadius } from '../theme';

type RootStackParamList = {
  Group: { groupId: string };
  Pick: { groupId: string };
  Leaderboard: { groupId: string };
  Draw: { groupId: string };
  PickHistory: { groupId: string };
};

type GroupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: GroupScreenNavigationProp;
  route: { params: { groupId: string } };
}

export function GroupScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { groupId } = route.params;

  const { data: group, loading: groupLoading, error: groupError, refresh: refreshGroup } = usePollData(
    () => getGroup(groupId),
    30000,
    [groupId],
  );

  const { data: deadlines, loading: deadlinesLoading, error: deadlinesError, refresh: refreshDeadlines } = usePollData(
    () => getDeadlines(),
    30000,
    [groupId],
  );

  const isMember = useMemo(() => {
    if (!group || !user) return false;
    return group.members?.some((m) => m.userId === user.id) ?? false;
  }, [group, user]);

  const aliveCount = useMemo(() => {
    if (!group) return 0;
    return group.members?.filter((m) => m.isAlive).length ?? 0;
  }, [group]);

  const nextDeadline = useMemo(() => {
    if (!deadlines) return null;
    const openDeadline = deadlines.find((d) => !d.isLocked);
    return openDeadline || null;
  }, [deadlines]);

  const handleJoinGroup = useCallback(async () => {
    if (!user) return;
    try {
      const displayName = user.displayName || user.email;
      await joinGroup(groupId, displayName);
      await refreshGroup();
      Alert.alert('Success', 'You have joined the pool.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to join pool');
    }
  }, [user, groupId, refreshGroup]);

  const handleShare = useCallback(async () => {
    if (!group) return;
    try {
      const message = `Join my Final Serve-ivor pool: ${group.name}\n\nInvite code: ${group.inviteCode}\n\nfinalserveivor.com`;
      await Share.share({
        message,
        title: 'Join my Final Serve-ivor pool',
        url: 'https://finalserveivor.com',
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to share');
    }
  }, [group]);

  const handleNavigate = useCallback(
    (screen: keyof RootStackParamList) => {
      if (screen === 'Pick' || screen === 'Leaderboard' || screen === 'Draw' || screen === 'PickHistory') {
        navigation.navigate(screen, { groupId });
      }
    },
    [navigation, groupId],
  );

  if (groupLoading || deadlinesLoading) {
    return <LoadingSpinner message="Loading pool..." />;
  }

  if (groupError || deadlinesError) {
    const error = groupError || deadlinesError;
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error || 'An error occurred'} onRetry={() => {
          refreshGroup();
          refreshDeadlines();
        }} />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Pool not found" onRetry={refreshGroup} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={groupLoading || deadlinesLoading}
            onRefresh={() => {
              refreshGroup();
              refreshDeadlines();
            }}
            tintColor={colours.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{group.name}</Text>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Players"
            value={group.members?.length ?? 0}
          />
          <StatCard
            label="Alive"
            value={aliveCount}
            colour={colours.success}
          />
        </View>

        {/* Countdown */}
        {nextDeadline && (
          <Countdown
            targetDate={nextDeadline.lockAt}
            label={`${nextDeadline.round} picks lock in`}
          />
        )}

        {/* CTA Buttons */}
        {isMember ? (
          <View style={styles.buttonsGrid}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleNavigate('Pick')}
            >
              <Text style={styles.buttonText}>Make Pick</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleNavigate('Leaderboard')}
            >
              <Text style={styles.buttonText}>Leaderboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleNavigate('Draw')}
            >
              <Text style={styles.buttonText}>Draw</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleNavigate('PickHistory')}
            >
              <Text style={styles.buttonText}>History</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.joinButton]}
            onPress={handleJoinGroup}
          >
            <Text style={styles.buttonText}>Join Pool</Text>
          </TouchableOpacity>
        )}

        {/* Invite Section */}
        {isMember && (
          <View style={styles.inviteSection}>
            <Text style={styles.sectionTitle}>Invite Friends</Text>
            <View style={styles.inviteBox}>
              <Text style={styles.inviteCode}>{group.inviteCode}</Text>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  title: {
    ...typography.h2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  button: {
    backgroundColor: colours.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  joinButton: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  inviteSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  inviteBox: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCode: {
    ...typography.bodySmall,
    flex: 1,
    color: colours.primary,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: colours.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
