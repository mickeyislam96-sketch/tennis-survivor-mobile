import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colours, spacing } from '../theme';

interface Props {
  icon?: string;
  title: string;
  message?: string;
}

export function EmptyState({ icon = '🎾', title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
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
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '600', color: colours.text, textAlign: 'center' },
  message: { fontSize: 14, color: colours.textMuted, textAlign: 'center', marginTop: spacing.sm },
});
