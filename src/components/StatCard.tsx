import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colours, spacing } from '../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const valueColor = color || colours.text;

  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  value: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colours.textMuted,
    marginTop: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
});

export default StatCard;
