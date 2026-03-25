import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colours, spacing } from '../theme';

interface Props {
  message?: string;
}

export function LoadingSpinner({ message }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colours.primary} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colours.background,
    padding: spacing.xl,
  },
  text: {
    color: colours.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
  },
});
