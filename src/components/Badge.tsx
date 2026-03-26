import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius } from '../theme';

interface BadgeProps {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'live';
  size?: 'sm' | 'md';
}

const Badge: React.FC<BadgeProps> = ({ label, variant, size = 'md' }) => {
  const variantStyles = {
    success: {
      bg: '#dcfce7',
      text: '#15803d',
    },
    warning: {
      bg: '#fef3c7',
      text: '#d97706',
    },
    danger: {
      bg: '#fee2e2',
      text: '#dc2626',
    },
    info: {
      bg: '#dbeafe',
      text: '#2563eb',
    },
    muted: {
      bg: '#f1f5f9',
      text: '#64748b',
    },
    live: {
      bg: '#fee2e2',
      text: '#ef4444',
    },
  };

  const style = variantStyles[variant];
  const sizeStyle = size === 'sm' ? styles.badgeSm : styles.badgeMd;
  const textSizeStyle = size === 'sm' ? styles.textSm : styles.textMd;

  return (
    <View style={[styles.badge, sizeStyle, { backgroundColor: style.bg }]}>
      <Text style={[textSizeStyle, { color: style.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  badgeMd: {
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  textSm: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  textMd: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
});

export default Badge;
