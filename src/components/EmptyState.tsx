import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colours, spacing } from '../theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🎾',
  title,
  message,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
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
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colours.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colours.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default EmptyState;
