import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCountdown } from '../hooks/useCountdown';
import { colours, spacing, borderRadius, fonts } from '../theme';

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

  // Future state: info card
  if (isFuture) {
    if (compact) {
      return <Text style={[styles.compactText, { color: colours.info }]}>{display}</Text>;
    }

    return (
      <View style={[styles.container, { backgroundColor: colours.infoSoft, borderColor: '#B3CEE0' }]}>
        <Text style={[styles.label, { color: colours.info }]}>Opens in</Text>
        <Text style={[styles.time, { color: colours.info }]}>{display}</Text>
      </View>
    );
  }

  // Open state: primary countdown card
  if (compact) {
    return <Text style={[styles.compactText, { color: colours.primary }]}>{display}</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colours.primary, borderColor: colours.primary }]}>
      <Text style={[styles.label, { color: 'rgba(255,255,255,0.7)' }]}>{label}</Text>
      <Text style={[styles.time, { color: colours.primaryInk }]}>{display}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  containerLocked: {
    padding: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colours.surfaceMuted,
    marginBottom: spacing.sm,
  },
  lockedText: {
    color: colours.inkMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.monoMedium,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  time: {
    fontSize: 22,
    fontFamily: fonts.monoBold,
    marginTop: spacing.xs,
    letterSpacing: -0.3,
  },
  compactText: {
    fontSize: 14,
    fontFamily: fonts.monoBold,
  },
});

export default Countdown;
