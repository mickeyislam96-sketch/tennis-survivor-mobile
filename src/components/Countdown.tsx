import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCountdown } from '../hooks/useCountdown';
import { colours, spacing, borderRadius } from '../theme';

interface CountdownProps {
  targetDate: string;
  label?: string;
  compact?: boolean;
  isFuture?: boolean;
}

const Countdown: React.FC<CountdownProps> = ({
  targetDate,
  label = 'Closes in',
  compact = false,
  isFuture = false,
}) => {
  const { display, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return compact ? null : (
      <View style={styles.containerLocked}>
        <Text style={styles.lockedText}>Round Locked</Text>
      </View>
    );
  }

  // Future state: blue card
  if (isFuture) {
    if (compact) {
      return <Text style={[styles.compactText, { color: '#1d4ed8' }]}>{display}</Text>;
    }

    return (
      <View
        style={[
          styles.container,
          styles.containerFuture,
          { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
        ]}
      >
        <Text style={[styles.label, { color: '#1e40af' }]}>Opens in</Text>
        <Text style={[styles.time, { color: '#1d4ed8', fontFamily: 'monospace' }]}>
          {display}
        </Text>
      </View>
    );
  }

  // Open state: amber card
  if (compact) {
    return <Text style={[styles.compactText, { color: '#78350f' }]}>{display}</Text>;
  }

  return (
    <View
      style={[
        styles.container,
        styles.containerOpen,
        { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
      ]}
    >
      <Text style={[styles.label, { color: '#92400e' }]}>{label}</Text>
      <Text style={[styles.time, { color: '#78350f', fontFamily: 'monospace' }]}>
        {display}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  containerOpen: {
    borderWidth: 1.5,
  },
  containerFuture: {
    borderWidth: 1.5,
  },
  containerLocked: {
    padding: 16,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    backgroundColor: colours.surface,
    marginBottom: spacing.sm,
  },
  lockedText: {
    color: colours.textMuted,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginTop: spacing.xs,
    letterSpacing: -0.3,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

export default Countdown;
