import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colours, spacing, fonts } from '../theme';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colours.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colours.background,
    paddingHorizontal: spacing.md,
  },
  message: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colours.inkMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
