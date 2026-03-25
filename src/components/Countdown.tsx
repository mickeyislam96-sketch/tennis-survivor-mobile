import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCountdown } from '../hooks/useCountdown';
import { colours, spacing, borderRadius } from '../theme';

interface Props {
  targetDate: string | null;
  label?: string;
  compact?: boolean;
}

export function Countdown({ targetDate, label = 'Picks lock in', compact = false }: Props) {
  const { display, isExpired, isUrgent } = useCountdown(targetDate);

  if (isExpired) {
    return compact ? null : (
      <View style={[styles.container, styles.locked]}>
        <Text style={styles.lockedText}>Round Locked</Text>
      </View>
    );
  }

  const bgColor = isUrgent ? colours.warningBg : colours.surfaceLight;
  const textColor = isUrgent ? colours.warning : colours.primary;

  if (compact) {
    return (
      <Text style={[styles.compactText, { color: textColor }]}>{display}</Text>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[styles.label, { color: colours.textMuted }]}>{label}</Text>
      <Text style={[styles.time, { color: textColor }]}>{display}</Text>
      {isUrgent && <Text style={styles.urgentHint}>Make your pick now!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  locked: {
    backgroundColor: colours.surface,
  },
  lockedText: {
    color: colours.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  urgentHint: {
    fontSize: 12,
    color: colours.warning,
    marginTop: 4,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
