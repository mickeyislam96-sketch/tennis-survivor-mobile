import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius } from '../theme';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>!</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colours.dangerBg,
    color: colours.danger,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  message: {
    fontSize: 14,
    color: colours.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colours.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: colours.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
