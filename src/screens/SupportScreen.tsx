import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../api/client';
import { colours, spacing, borderRadius, fonts } from '../theme';

const CATEGORIES = [
  { value: 'picks', label: 'Picks & selections' },
  { value: 'account', label: 'Account & login' },
  { value: 'results', label: 'Results & scoring' },
  { value: 'payments', label: 'Payments' },
  { value: 'bug', label: 'Bug report' },
  { value: 'other', label: 'Something else' },
];

export default function SupportScreen() {
  const { user } = useAuth();
  const [category, setCategory] = useState('other');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0 && status !== 'sending';

  async function handleSubmit() {
    if (!canSubmit) return;

    setStatus('sending');
    setErrorMsg('');

    try {
      await apiCall('/api/support', {
        method: 'POST',
        body: {
          category: CATEGORIES.find((c) => c.value === category)?.label || 'General',
          subject: subject.trim(),
          message: message.trim(),
          userId: user?.id || null,
        },
      });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (status === 'sent') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>{'\u2713'}</Text>
          </View>
          <Text style={styles.successTitle}>Message sent</Text>
          <Text style={styles.successText}>
            We've received your support request and will get back to you as soon as possible.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.title}>Contact support</Text>
          <Text style={styles.subtitle}>
            Having an issue or got a question? Send us a message and we'll get back to you.
          </Text>

          {/* Category picker */}
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.categoryChip,
                  category === c.value && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(c.value)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === c.value && styles.categoryChipTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subject */}
          <Text style={styles.label}>
            Subject <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of your issue"
            placeholderTextColor={colours.inkSoft}
            maxLength={200}
          />

          {/* Message */}
          <Text style={styles.label}>
            Message <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe what happened, what you expected, and any other details."
            placeholderTextColor={colours.inkSoft}
            maxLength={5000}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{message.length}/5,000</Text>

          {/* Sending as */}
          {user && (
            <View style={styles.contextBox}>
              <Text style={styles.contextLabel}>Sending as</Text>
              <Text style={styles.contextValue}>
                {user.displayName} ({user.email})
              </Text>
            </View>
          )}

          {/* Error */}
          {status === 'error' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {errorMsg || 'Something went wrong. Please try again or email finalservivor@gmail.com directly.'}
              </Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            {status === 'sending' ? (
              <ActivityIndicator color={colours.goldInk} size="small" />
            ) : (
              <Text style={styles.submitText}>Send message</Text>
            )}
          </TouchableOpacity>

          {/* Alt contact */}
          <Text style={styles.altText}>
            You can also email us directly at finalservivor@gmail.com
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colours.canvas,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.serifBold,
    color: colours.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colours.inkMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.sansSemiBold,
    color: colours.ink,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  required: {
    color: colours.danger,
  },
  categoryScroll: {
    marginBottom: spacing.sm,
  },
  categoryContent: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.surface,
  },
  categoryChipActive: {
    backgroundColor: colours.primary,
    borderColor: colours.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: colours.inkMuted,
  },
  categoryChipTextActive: {
    color: colours.primaryInk,
  },
  input: {
    backgroundColor: colours.surface,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: fonts.sansRegular,
    color: colours.ink,
  },
  textarea: {
    minHeight: 120,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 11,
    fontFamily: fonts.monoRegular,
    color: colours.inkSoft,
    textAlign: 'right',
    marginTop: 4,
  },
  contextBox: {
    backgroundColor: colours.surfaceMuted,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  contextLabel: {
    fontSize: 11,
    fontFamily: fonts.monoMedium,
    color: colours.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  contextValue: {
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colours.ink,
  },
  errorBox: {
    backgroundColor: colours.dangerSoft,
    borderWidth: 1,
    borderColor: colours.danger,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colours.danger,
  },
  submitButton: {
    backgroundColor: colours.gold,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontFamily: fonts.sansSemiBold,
    color: colours.goldInk,
  },
  altText: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.inkSoft,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colours.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successIconText: {
    fontSize: 28,
    color: colours.primary,
    fontFamily: fonts.sansBold,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: fonts.serifBold,
    color: colours.ink,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colours.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
