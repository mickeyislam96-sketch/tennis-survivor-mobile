import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { updateProfile, getMyPools } from '../api/auth';
import { colours, spacing, borderRadius, fonts } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileStack';

function isValidEmail(e: string): boolean {
  const parts = e.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (!domain.includes('.')) return false;
  if (/\s/.test(e)) return false;
  if (/\.\./.test(e)) return false;
  if (/^[.\-]/.test(local) || /[.\-]$/.test(local)) return false;
  if (/^[.\-]/.test(domain) || /[.\-]$/.test(domain)) return false;
  return true;
}

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [pools, setPools] = useState<any[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getMyPools();
        if (mounted) setPools(data);
      } catch {
        // silent
      } finally {
        if (mounted) setPoolsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const hasChanges =
    displayName !== user?.displayName ||
    email !== user?.email ||
    newPassword.length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;

    if (email !== user?.email && !isValidEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    if (newPassword && !currentPassword) {
      Alert.alert('Error', 'Enter your current password to set a new one.');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (displayName !== user?.displayName) updates.displayName = displayName;
      if (email !== user?.email) updates.email = email;
      if (newPassword) {
        updates.currentPassword = currentPassword;
        updates.newPassword = newPassword;
      }

      await updateProfile(updates as any);
      await refreshUser();
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Your profile has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userName}>{user?.displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          {/* My Pools section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Pools</Text>
            {poolsLoading ? (
              <ActivityIndicator size="small" color={colours.primary} />
            ) : pools.length === 0 ? (
              <Text style={styles.poolsEmpty}>You haven't joined any pools yet.</Text>
            ) : (
              pools.map((pool: any) => {
                const id = pool.groupId || pool.id;
                const name = pool.groupName || pool.name || 'Pool';
                const isAlive = pool.isAlive !== false;
                const status = isAlive
                  ? 'Alive'
                  : `Eliminated${pool.eliminatedRound ? ' (' + pool.eliminatedRound + ')' : ''}`;
                const statusColour = isAlive ? colours.success : colours.danger;
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.poolRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      // Navigate to the pool's group screen via root navigator
                      navigation.getParent()?.navigate('Pools', {
                        screen: 'Group',
                        params: { groupId: id },
                      });
                    }}
                  >
                    <View style={styles.poolInfo}>
                      <Text style={styles.poolName}>{name}</Text>
                      <Text style={[styles.poolStatus, { color: statusColour }]}>{status}</Text>
                    </View>
                    <Text style={styles.poolArrow}>{'\u203A'}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Profile section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>

            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colours.textMuted}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colours.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>

            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colours.textMuted}
              secureTextEntry
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min 8 characters"
              placeholderTextColor={colours.textMuted}
              secureTextEntry
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <Text style={styles.hint}>Min 8 characters</Text>
            )}
          </View>

          {/* Save button */}
          {hasChanges && (
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colours.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Terms')}
            style={styles.termsLink}
          >
            <Text style={styles.termsLinkText}>Terms & Conditions</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Final Serve-ivor v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.canvas,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colours.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: fonts.sansBold,
    color: colours.white,
  },
  userName: {
    fontSize: 20,
    fontFamily: fonts.sansBold,
    color: colours.text,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colours.surface,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.sansBold,
    color: colours.text,
    marginBottom: spacing.md,
  },
  poolsEmpty: {
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    fontStyle: 'italic',
  },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  poolInfo: {
    flex: 1,
  },
  poolName: {
    fontSize: 14,
    fontFamily: fonts.serifBold,
    color: colours.text,
  },
  poolStatus: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    marginTop: 2,
  },
  poolArrow: {
    fontSize: 20,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    marginLeft: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.monoMedium,
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.sansRegular,
    color: colours.text,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.warning,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.pill,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fonts.sansBold,
    color: colours.white,
    fontSize: 16,
  },
  logoutButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  logoutText: {
    fontFamily: fonts.sansBold,
    color: colours.danger,
    fontSize: 14,
  },
  termsLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  termsLinkText: {
    fontFamily: fonts.sansBold,
    color: colours.primary,
    fontSize: 14,
  },
  version: {
    textAlign: 'center',
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
});
