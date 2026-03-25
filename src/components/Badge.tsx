import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius } from '../theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface Props {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colours.successBg, text: colours.success },
  warning: { bg: colours.warningBg, text: colours.warning },
  danger: { bg: colours.dangerBg, text: colours.danger },
  info: { bg: colours.infoBg, text: colours.info },
  muted: { bg: colours.surfaceLight, text: colours.textMuted },
};

export function Badge({ label, variant = 'muted' }: Props) {
  const v = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
