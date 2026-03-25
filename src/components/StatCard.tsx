import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius, shadows } from '../theme';

interface Props {
  label: string;
  value: string | number;
  colour?: string;
}

export function StatCard({ label, value, colour }: Props) {
  return (
    <View style={[styles.card, shadows.card]}>
      <Text style={[styles.value, colour ? { color: colour } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: colours.text,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colours.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
