import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as authApi from '../api/auth';
import { colours, spacing, borderRadius, typography } from '../theme';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await authApi.forgotPassword(email);
      setSent(true);
      Alert.alert(
        'Check your email',
        'We\'ve sent a password reset link to ' + email + '. Check your inbox.'
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send reset link';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {sent
                ? 'Check your email for a reset link'
                : 'Enter your email to receive a password reset link'}
            </Text>
          </View>

          {!sent ? (
            <View style={styles.form}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colours.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendReset}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colours.text} />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successTitle}>Link sent!</Text>
                <Text style={styles.successMessage}>
                  We've sent a password reset link to your email. Click the link to create a new password.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleBackToLogin}
              disabled={loading}
            >
              <Text style={styles.link}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colours.textSecondary,
  },
  form: {
    marginVertical: spacing.xl,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colours.text,
    fontSize: typography.body.fontSize,
  },
  button: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    color: colours.text,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  successBox: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colours.success,
  },
  successIcon: {
    fontSize: 48,
    color: colours.success,
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  successMessage: {
    ...typography.bodySmall,
    color: colours.textSecondary,
    textAlign: 'center',
  },
  footer: {
    marginBottom: spacing.lg,
  },
  link: {
    ...typography.body,
    color: colours.primaryLight,
    textAlign: 'center',
  },
});
