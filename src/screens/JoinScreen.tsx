import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getGroupByInvite, joinGroup } from '../api/groups';
import { useAuth } from '../context/AuthContext';
import { colours, spacing, borderRadius, shadows } from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';

interface Group {
  id: string;
  name: string;
  tournamentId?: string;
  entryFeeCents: number;
  members?: Array<{ userId: string }>;
}

interface JoinScreenProps {
  route: {
    params: {
      code: string;
    };
  };
}

export default function JoinScreen({ route }: JoinScreenProps) {
  const { code } = route.params;
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      const g = await getGroupByInvite(code);
      setGroup(g);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load pool');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const handleJoin = async () => {
    if (!group || !user) return;

    const isMember = group.members?.some((m) => m.userId === user.id);
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
      Alert.alert('Error', e.message || 'Failed to join pool');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.errorText}>Pool not found</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isMember = group.members?.some((m) => m.userId === user?.id);
  const memberCount = group.members?.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.emoji}>🎾</Text>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.tournamentId && (
            <Text style={styles.tournament}>
              {group.tournamentId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </Text>
          )}

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{memberCount}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {group.entryFeeCents === 0
                  ? 'Free'
                  : `£${(group.entryFeeCents / 100).toFixed(0)}`}
              </Text>
              <Text style={styles.statLabel}>Entry</Text>
            </View>
          </View>

          {isMember ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonGo]}
              onPress={() => navigation.replace('Group', { groupId: group.id })}
            >
              <Text style={styles.buttonText}>Go to Pool</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonJoin, joining && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator size="small" color={colours.white} />
              ) : (
                <Text style={styles.buttonText}>Join Pool</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colours.surface,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  groupName: {
    fontSize: 22,
    fontWeight: '800',
    color: colours.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tournament: {
    fontSize: 14,
    color: colours.textMuted,
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
    width: '100%',
    marginVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colours.text,
  },
  statLabel: {
    fontSize: 11,
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xs,
  },
  button: {
    width: '100%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonJoin: {
    backgroundColor: colours.primary,
  },
  buttonGo: {
    backgroundColor: colours.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colours.white,
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: colours.danger,
    textAlign: 'center',
  },
});
