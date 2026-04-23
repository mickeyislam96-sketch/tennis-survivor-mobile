import React, { useState, useRef } from 'react';
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
  Linking,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colours, spacing, borderRadius, fonts } from '../theme';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { register } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const isValidEmail = (e: string): boolean => {
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
  };

  const validateForm = (): string | null => {
    if (!displayName.trim()) {
      return 'Please enter a display name';
    }
    if (!email.trim()) {
      return 'Please enter an email';
    }
    if (!isValidEmail(email.trim())) {
      return 'Please enter a valid email address';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    if (!termsAccepted) {
      return 'You must accept the Terms & Conditions to create an account';
    }
    return null;
  };

  const handleRegister = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    try {
      setLoading(true);
      await register(email, displayName, password);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Sign Up Error', errorMsg);
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the game</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colours.textMuted}
                autoCapitalize="words"
                editable={!loading}
                value={displayName}
                onChangeText={setDisplayName}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colours.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Min 8 characters"
                placeholderTextColor={colours.textMuted}
                secureTextEntry
                editable={!loading}
                value={password}
                onChangeText={setPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                blurOnSubmit={false}
              />
              {password.length > 0 && password.length < 8 && (
                <Text style={styles.hint}>Min 8 characters</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                ref={confirmRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colours.textMuted}
                secureTextEntry
                editable={!loading}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                returnKeyType="go"
                onSubmitEditing={handleRegister}
              />
              {confirmPassword.length > 0 && password === confirmPassword && (
                <Text style={styles.hintSuccess}>Passwords match</Text>
              )}
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.hint}>Passwords do not match</Text>
              )}
            </View>

            {/* Terms acceptance */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Text style={styles.checkmark}>{'\u2713'}</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => Linking.openURL('https://finalserveivor.com/terms')}
                >
                  Terms & Conditions
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colours.white} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
              >
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
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
  hint: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.warning,
    marginTop: spacing.xs,
  },
  hintSuccess: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.success,
    marginTop: spacing.xs,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: colours.surface,
  },
  checkboxChecked: {
    backgroundColor: colours.primary,
    borderColor: colours.primary,
  },
  checkmark: {
    color: colours.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sansBold,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colours.inkMuted,
    lineHeight: 18,
  },
  termsLink: {
    color: colours.primary,
    fontWeight: '600',
    fontFamily: fonts.sansSemiBold,
    textDecorationLine: 'underline',
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
  footer: {
    marginBottom: spacing.lg,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: fonts.sansRegular,
  },
  loginLink: {
    color: colours.white,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
  },
});
