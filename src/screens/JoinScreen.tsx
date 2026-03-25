import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Alert, SafeAreaView, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getGroupByInvite, joinGroup, Group } from '../api/groups';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Badge } from '../components/Badge';
import { colours, spacing, borderRadius, shadows } from '../theme';

export function JoinScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { code } = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    try {
      const g = await getGroupByInvite(code);
      setGroup(g);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  const handleJoin = async () => {
    if (!group || !user) return;

    // Check if already a member
    const isMember = group.members?.some(m => m.userId === user.id);
    if (isMember) {
      navigation.replace('Group', { groupId: group.id });
      return;
    }

    setJoining(true);
    try {
      await joinGroup(group.id, user.displayName);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Group', { groupId: group.id });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading pool..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadGroup} />;
  if (!group) return <ErrorMessage message="Pool not found" />;

  const isMember = group.members?.some(m => m.userId === user?.id);
  const memberCount = group.members?.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.emoji}>🎾</Text>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.tournamentId && (
            <Text style={styles.tournament}>{group.tournamentId}</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{memberCount}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {group.entryFeeCents === 0 ? 'Free' : `\u00A3${(group.entryFeeCents / 100).toFixed(0)}`}
              </Text>
              <Text style={styles.statLabel}>Entry</Text>
            </View>
          </View>

          {isMember ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.replace('Group', { groupId: group.id })}
            >
              <Text style={styles.buttonText}>Go to Pool</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, joining && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={joining}
            >
              <Text style={styles.buttonText}>
                {joining ? 'Joining...' : 'Join Pool'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  groupName: {
    fontSize: 22,
    fontWeight: '700',
    color: colours.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tournament: {
    fontSize: 14,
    color: colours.textMuted,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginBottom: spacing.lg,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: colours.text },
  statLabel: {
    fontSize: 11,
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  button: {
    backgroundColor: colours.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
