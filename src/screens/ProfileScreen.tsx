import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/auth';
import { colours, spacing, borderRadius } from '../theme';

export function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation<any>();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const hasChanges =
    displayName !== user?.displayName ||
    email !== user?.email ||
    newPassword.length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;

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
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Profile section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>

            <Text style={styles.label}>Display name</Text>
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
            <Text style={styles.sectionTitle}>Change password</Text>

            <Text style={styles.label}>Current password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colours.textMuted}
              secureTextEntry
            />

            <Text style={styles.label}>New password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min 8 characters"
              placeholderTextColor={colours.textMuted}
              secureTextEntry
            />
          </View>

          {/* Save button */}
          {hasChanges && (
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save changes'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Terms link */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Terms')}
          >
            <Text style={styles.linkText}>Terms & Conditions</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Final Serve-ivor v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colours.textMuted,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colours.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colours.text,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colours.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoutText: {
    color: colours.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: colours.textMuted,
    fontSize: 12,
    marginTop: spacing.lg,
  },
});
