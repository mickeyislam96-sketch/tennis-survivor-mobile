import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius, shadows, fonts } from '../theme';
import Badge from './Badge';

interface PoolCardProps {
  pool: any;
  onPress: () => void;
}

const PoolCard: React.FC<PoolCardProps> = ({ pool, onPress }) => {
  const status = pool.tournament?.status || pool.status || 'active';
  const isUpcoming = status === 'upcoming';
  const isActive = status === 'active';
  const isCompleted = status === 'completed';
  const isFree = pool.entryFeeCents === 0;

  const location = pool.tournament?.location || pool.location || '';
  const surface = pool.tournament?.surface || '';
  const tier = pool.tournament?.tier || '';
  const startDate = pool.tournament?.startDate || pool.startDate || '';
  const drawAvailable = pool.tournament?.drawAvailable ?? pool.drawAvailable;

  // Determine if tournament is effectively over
  const allEliminated = isActive && pool.aliveCount === 0 && pool.memberCount > 0;
  const isClosed = isCompleted || allEliminated;

  const getBadge = () => {
    if (isCompleted) return <Badge label="Completed" variant="muted" size="sm" />;
    if (allEliminated) return <Badge label="Closed" variant="muted" size="sm" />;
    if (isActive) return <Badge label="Live" variant="success" size="sm" />;
    if (isUpcoming) return <Badge label="Coming Soon" variant="primary" size="sm" />;
    return null;
  };

  const getCta = () => {
    if (isClosed) return 'View Results \u2192';
    if (isActive) return 'View Pool \u2192';
    if (isUpcoming) return isFree ? 'Join pool free \u2192' : 'Register \u2192';
    return 'View \u2192';
  };

  // Build meta line
  const metaParts: string[] = [];
  if (tier) metaParts.push(tier);
  if (location) metaParts.push(location);
  if (surface) metaParts.push(surface);
  const metaLine = metaParts.join(' \u00B7 ');

  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm, isClosed && styles.cardClosed]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Badge */}
      <View style={styles.badgeWrapper}>
        {getBadge()}
      </View>

      {/* Eyebrow */}
      {tier ? (
        <Text style={styles.eyebrow}>{tier.toUpperCase()}</Text>
      ) : null}

      {/* Tournament name — serif display */}
      <Text style={[styles.name, isClosed && styles.nameClosed]}>
        {pool.name || pool.tournament?.name || 'Pool'}
      </Text>

      {/* Meta line */}
      {metaLine ? (
        <Text style={styles.meta}>{metaLine}</Text>
      ) : location ? (
        <Text style={styles.meta}>
          {location}
          {startDate ? ` \u00B7 ${formatDate(startDate)}` : ''}
        </Text>
      ) : null}

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {isFree ? (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Free</Text>
            <Text style={styles.statLabel}>ENTRY</Text>
          </View>
        ) : (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {'\u00A3'}{((pool.entryFeeCents || 0) / 100).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>ENTRY</Text>
          </View>
        )}

        {(pool.memberCount || 0) > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pool.memberCount}</Text>
            <Text style={styles.statLabel}>REGISTERED</Text>
          </View>
        )}

        {isActive && !allEliminated && (
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colours.success }]}>
              {pool.aliveCount || 0}/{pool.memberCount || 0}
            </Text>
            <Text style={styles.statLabel}>STILL IN</Text>
          </View>
        )}

        {startDate && isUpcoming && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDate(startDate)}</Text>
            <Text style={styles.statLabel}>STARTS</Text>
          </View>
        )}
      </View>

      {allEliminated && (
        <Text style={[styles.closedText, { color: colours.danger }]}>
          {'\u2717'} All eliminated
        </Text>
      )}

      {isCompleted && (
        <Text style={[styles.closedText, { color: colours.inkSoft }]}>
          Tournament over
        </Text>
      )}

      {isUpcoming && !drawAvailable && (
        <Text style={styles.closedText}>Draw TBC</Text>
      )}

      {/* CTA */}
      <Text style={[styles.ctaText, isClosed && styles.ctaTextClosed]}>
        {getCta()}
      </Text>
    </TouchableOpacity>
  );
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colours.border,
  },
  cardClosed: {
    opacity: 0.7,
  },
  badgeWrapper: {
    marginBottom: spacing.sm,
  },
  eyebrow: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colours.inkSoft,
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.serifBold,
    color: colours.ink,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  nameClosed: {
    color: colours.inkMuted,
  },
  meta: {
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colours.inkSoft,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontFamily: fonts.monoBold,
    color: colours.ink,
    lineHeight: 20,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: fonts.monoMedium,
    color: colours.inkSoft,
    letterSpacing: 1,
    marginTop: 2,
  },
  closedText: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: colours.inkSoft,
    marginBottom: spacing.sm,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: fonts.sansBold,
    color: colours.primary,
    marginTop: spacing.xs,
  },
  ctaTextClosed: {
    color: colours.inkMuted,
  },
});

export default PoolCard;
