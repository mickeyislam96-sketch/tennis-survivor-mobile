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
import { forgotPassword } from '../api/auth';
import { colours, spacing, borderRadius, fonts } from '../theme';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
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
      await forgotPassword(email);
      setSent(true);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to send reset link';
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
            <Text style={styles.appName}>🎾 Final Serve-ivor</Text>
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
                  <ActivityIndicator size="small" color={colours.white} />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={[styles.successBox, { backgroundColor: colours.successBg }]}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successTitle}>Check your email</Text>
                <Text style={styles.successMessage}>
                  We've sent a password reset link to {email}. Click the link to create a new
                  password.
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
    backgroundColor: colours.primary,
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
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  appName: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: fonts.sansExtraBold,
    color: colours.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: fonts.serifBold,
    color: colours.white,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.sansRegular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  form: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.monoMedium,
    color: colours.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colours.ink,
    fontSize: 15,
    fontFamily: fonts.sansRegular,
  },
  button: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    fontFamily: fonts.sansSemiBold,
    color: colours.white,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  successBox: {
    borderWidth: 1.5,
    borderColor: colours.successBorder,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: colours.successDark,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sansBold,
    color: colours.successDark,
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colours.successDark,
    textAlign: 'center',
  },
  footer: {
    marginBottom: spacing.lg,
  },
  link: {
    color: colours.white,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sansSemiBold,
  },
});
