import React from 'react';
import {
  ScrollView,
  Text,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { colours, spacing, borderRadius, fonts } from '../theme';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Terms & Conditions</Text>

          <Text style={styles.heading}>1. Service Overview</Text>
          <Text style={styles.body}>
            Final Serve-ivor is a tennis survivor fantasy game where players join pools, pick one
            tennis player per round, and are eliminated if their pick loses. The last survivor wins
            the prize pool (if applicable). By using this app, you agree to these terms.
          </Text>

          <Text style={styles.heading}>2. How It Works</Text>
          <Text style={styles.body}>
            Players join groups (pools) and make picks before each round lock time. You may only pick
            each player once per tournament. If your pick loses, you are eliminated. The game continues
            until one player remains.
          </Text>

          <Text style={styles.heading}>3. Picks and Deadlines</Text>
          <Text style={styles.body}>
            Picks must be made before the round lock time. Once locked, picks cannot be changed. If
            you do not make a pick before the deadline, you will be eliminated. If you pick a player
            whose previous-round match is pending, you accept the risk that your pick may be voided if
            that player loses.
          </Text>

          <Text style={styles.heading}>4. User Responsibilities</Text>
          <Text style={styles.body}>
            You are responsible for maintaining the confidentiality of your account credentials. You
            agree not to share your account with others. Each person may only have one account.
            Multiple accounts or coordinated play to gain unfair advantage is prohibited and may
            result in disqualification.
          </Text>

          <Text style={styles.heading}>5. Eligibility</Text>
          <Text style={styles.body}>
            You must be at least 18 years old to participate in paid pools. Free pools are open to all
            ages. You represent that all information provided is accurate and complete.
          </Text>

          <Text style={styles.heading}>6. Privacy and Data</Text>
          <Text style={styles.body}>
            We collect your email address and display name to operate the game. We do not sell your
            personal information to third parties. Your pick data is visible to other pool members
            after each round locks.
          </Text>

          <Text style={styles.heading}>7. Limitation of Liability</Text>
          <Text style={styles.body}>
            Final Serve-ivor is provided as-is. We are not responsible for data loss, service
            interruptions, or incorrect results due to third-party data source errors. Tournament data
            is sourced from external APIs and may be delayed or inaccurate.
          </Text>

          <Text style={styles.heading}>8. Amendments</Text>
          <Text style={styles.body}>
            We may update these terms at any time. Continued use of the app constitutes acceptance of
            updated terms. We encourage you to review these terms periodically.
          </Text>

          <Text style={styles.heading}>9. Contact</Text>
          <Text style={styles.body}>
            Questions? Reach out at finalserveivor@gmail.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.canvas,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colours.surface,
    borderWidth: 1.5,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fonts.serifBold,
    color: colours.ink,
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sansBold,
    color: colours.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.sansRegular,
    color: colours.ink,
    marginBottom: spacing.sm,
  },
});
