import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius } from '../theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>!</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colours.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colours.danger,
  },
  message: {
    fontSize: 14,
    color: colours.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
  },
  button: {
    backgroundColor: colours.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  buttonText: {
    color: colours.white,
    fontWeight: '600' as const,
    fontSize: 13,
  },
});

export default ErrorMessage;
