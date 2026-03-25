import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pool } from '../api/groups';
import { Badge } from './Badge';
import { colours, spacing, borderRadius, shadows } from '../theme';

interface Props {
  pool: Pool;
  onPress: () => void;
}

export function PoolCard({ pool, onPress }: Props) {
  const isUpcoming = pool.tournament?.status === 'upcoming';
  const isActive = pool.tournament?.status === 'active';

  return (
    <TouchableOpacity style={[styles.card, shadows.card]} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{pool.tournament?.name || pool.name}</Text>
        {isUpcoming && <Badge label="Upcoming" variant="info" />}
        {isActive && <Badge label="Live" variant="success" />}
      </View>

      {/* Location */}
      {pool.tournament?.location && (
        <Text style={styles.location}>{pool.tournament.location}</Text>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pool.memberCount}</Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>
        {isActive && (
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colours.success }]}>{pool.aliveCount}</Text>
            <Text style={styles.statLabel}>Alive</Text>
          </View>
        )}
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {pool.entryFeeCents === 0 ? 'Free' : `\u00A3${(pool.entryFeeCents / 100).toFixed(0)}`}
          </Text>
          <Text style={styles.statLabel}>Entry</Text>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        {pool.isMember ? (
          <Text style={styles.ctaTextJoined}>View Pool</Text>
        ) : isUpcoming ? (
          <View style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Enter Free</Text>
          </View>
        ) : (
          <Text style={styles.ctaTextJoined}>Join</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colours.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  location: {
    fontSize: 13,
    color: colours.textMuted,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colours.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colours.text,
  },
  statLabel: {
    fontSize: 11,
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cta: {
    alignItems: 'center',
  },
  ctaTextJoined: {
    color: colours.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  ctaButton: {
    backgroundColor: colours.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
