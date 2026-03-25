import React from 'react';
import { ScrollView, Text, SafeAreaView, StyleSheet } from 'react-native';
import { colours, spacing } from '../theme';

export function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.updated}>Last updated: March 2026</Text>

        <Text style={styles.heading}>1. Overview</Text>
        <Text style={styles.body}>
          Final Serve-ivor is a tennis survivor fantasy game. By using this app, you agree to these terms.
        </Text>

        <Text style={styles.heading}>2. How It Works</Text>
        <Text style={styles.body}>
          Players join pools, pick one tennis player per round, and are eliminated if their pick loses.
          The last survivor wins the prize pool (if applicable). You may only pick each player once
          per tournament.
        </Text>

        <Text style={styles.heading}>3. Picks</Text>
        <Text style={styles.body}>
          Picks must be made before the round locks. Once the round is locked, picks cannot be changed.
          If you do not make a pick before the deadline, you will be eliminated. If you pick a player
          whose previous-round match is still pending, you accept the risk that the pick may be voided
          if that player loses their pending match.
        </Text>

        <Text style={styles.heading}>4. Eligibility</Text>
        <Text style={styles.body}>
          You must be at least 18 years old to participate in paid pools. Free pools are open to all ages.
        </Text>

        <Text style={styles.heading}>5. Fair Play</Text>
        <Text style={styles.body}>
          Each person may only have one account. Multiple accounts or coordinated play to gain an
          unfair advantage is prohibited and may result in disqualification.
        </Text>

        <Text style={styles.heading}>6. Privacy</Text>
        <Text style={styles.body}>
          We collect your email address and display name to operate the game. We do not sell your
          personal information to third parties. Pick data is visible to other members of your pool
          after the round locks.
        </Text>

        <Text style={styles.heading}>7. Liability</Text>
        <Text style={styles.body}>
          Final Serve-ivor is provided as-is. We are not responsible for data loss, service
          interruptions, or incorrect results due to third-party data source errors. Tournament data
          is sourced from external APIs and may occasionally be delayed or inaccurate.
        </Text>

        <Text style={styles.heading}>8. Changes</Text>
        <Text style={styles.body}>
          We may update these terms from time to time. Continued use of the app constitutes
          acceptance of the updated terms.
        </Text>

        <Text style={styles.heading}>9. Contact</Text>
        <Text style={styles.body}>
          Questions? Reach out at finalserveivor@gmail.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colours.text,
    marginBottom: spacing.xs,
  },
  updated: {
    fontSize: 13,
    color: colours.textMuted,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    color: colours.textSecondary,
    lineHeight: 22,
  },
});
