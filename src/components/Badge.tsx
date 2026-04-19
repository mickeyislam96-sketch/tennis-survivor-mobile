import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius, fonts } from '../theme';

interface BadgeProps {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'live' | 'primary' | 'gold' | 'accent' | 'neutral';
  size?: 'sm' | 'md';
}

const Badge: React.FC<BadgeProps> = ({ label, variant, size = 'md' }) => {
  const variantStyles: Record<string, { bg: string; text: string; border?: string }> = {
    success: { bg: colours.successSoft, text: colours.success },
    warning: { bg: colours.warningSoft, text: colours.warning },
    danger: { bg: colours.dangerSoft, text: colours.danger },
    info: { bg: colours.infoSoft, text: colours.info },
    muted: { bg: colours.surfaceMuted, text: colours.inkMuted, border: colours.border },
    neutral: { bg: colours.surfaceMuted, text: colours.inkMuted, border: colours.border },
    live: { bg: colours.dangerSoft, text: colours.danger },
    primary: { bg: colours.primarySoft, text: colours.primary },
    gold: { bg: colours.goldSoft, text: colours.goldDeep },
    accent: { bg: colours.accentSoft, text: colours.accent },
  };

  const style = variantStyles[variant] || variantStyles.muted;
  const sizeStyle = size === 'sm' ? styles.badgeSm : styles.badgeMd;
  const textSizeStyle = size === 'sm' ? styles.textSm : styles.textMd;

  return (
    <View style={[
      styles.badge,
      sizeStyle,
      { backgroundColor: style.bg },
      style.border ? { borderWidth: 1, borderColor: style.border } : undefined,
    ]}>
      <Text style={[textSizeStyle, { color: style.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSm: {
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeMd: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  textSm: {
    fontSize: 10,
    fontFamily: fonts.sansSemiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  textMd: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default Badge;
