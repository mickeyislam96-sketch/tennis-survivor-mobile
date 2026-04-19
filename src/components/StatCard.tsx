import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colours, spacing, fonts } from '../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const valueColor = color || colours.ink;

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
    fontFamily: fonts.monoBold,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.monoMedium,
    color: colours.inkSoft,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default StatCard;
