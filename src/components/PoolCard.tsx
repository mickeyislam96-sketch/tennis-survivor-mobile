import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius, shadows } from '../theme';
import Badge from './Badge';

interface PoolCardProps {
  pool: any;
  onPress: () => void;
  isMember?: boolean;
}

const PoolCard: React.FC<PoolCardProps> = ({ pool, onPress, isMember = false }) => {
  const isUpcoming = pool.status === 'upcoming';
  const isActive = pool.status === 'active';
  const isFree = pool.entry === 0 || pool.entryFeeCents === 0;

  // Extract location and dates
  const location = pool.location || '';
  const dateRange = pool.dateRange || '';

  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top row: name, badge, entry fee */}
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <View style={styles.badgeWrapper}>
            {isUpcoming && <Badge label="Coming Soon" variant="info" size="sm" />}
            {isActive && <Badge label="Live" variant="live" size="sm" />}
          </View>
          <Text style={styles.name}>{pool.name || pool.tournament}</Text>
          {location && (
            <Text style={styles.meta}>
              {location}
              {dateRange && ` • ${dateRange}`}
            </Text>
          )}
        </View>

        <View style={styles.entryBadge}>
          {isFree ? (
            <Text style={styles.entryFree}>Free</Text>
          ) : (
            <Text style={styles.entryPaid}>£{pool.entry}</Text>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom row: stats and CTA */}
      <View style={styles.bottomRow}>
        <View style={styles.statsList}>
          <Text style={styles.stat}>👥 {pool.memberCount || 0} players</Text>
          {isActive && (
            <Text style={styles.stat}>✓ {pool.aliveCount || 0} alive</Text>
          )}
          {!pool.drawAvailable && <Text style={styles.stat}>📅 Draw TBC</Text>}
          {pool.startDate && (
            <Text style={styles.stat}>📅 Starts {pool.startDate}</Text>
          )}
        </View>

        <View style={styles.ctaSection}>
          {isMember ? (
            <Text style={styles.ctaText}>View Pool →</Text>
          ) : isUpcoming ? (
            <Text style={styles.ctaText}>Enter Free →</Text>
          ) : (
            <Text style={styles.ctaText}>View Pool →</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.white,
    borderRadius: borderRadius.md,
    padding: 16,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colours.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  badgeWrapper: {
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: colours.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: colours.textMuted,
    fontWeight: '500' as const,
  },
  entryBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryFree: {
    fontWeight: '700' as const,
    fontSize: 12,
    color: '#15803d',
    backgroundColor: '#f0fdf4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.xs,
  },
  entryPaid: {
    fontWeight: '700' as const,
    fontSize: 12,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
    marginVertical: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  statsList: {
    flex: 1,
    gap: spacing.xs,
  },
  stat: {
    fontSize: 12.5,
    color: colours.textMuted,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  ctaSection: {
    marginLeft: spacing.lg,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colours.primary,
  },
});

export default PoolCard;
