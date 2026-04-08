import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colours, spacing, borderRadius, shadows } from '../theme';
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
    if (isUpcoming) return <Badge label="Coming Soon" variant="info" size="sm" />;
    return null;
  };

  const getCta = () => {
    if (isClosed) return 'View Results \u2192';
    if (isActive) return 'View Pool \u2192';
    if (isUpcoming) return isFree ? 'Join pool free \u2192' : 'Register \u2192';
    return 'View \u2192';
  };

  // Build meta line: "ATP Masters 1000 · Monte Carlo, Monaco · Clay (outdoor)"
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

      {/* Tournament name */}
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

      {/* Info lines */}
      <View style={styles.infoLines}>
        {isFree ? (
          <Text style={styles.infoLine}>Free entry</Text>
        ) : (
          <Text style={styles.infoLine}>
            {'\u00A3'}{((pool.entryFeeCents || 0) / 100).toFixed(0)} entry
          </Text>
        )}

        {startDate && (
          <Text style={styles.infoLine}>Starts {formatDate(startDate)}</Text>
        )}

        {(pool.memberCount || 0) > 0 && (
          <Text style={styles.infoLine}>
            {pool.memberCount} already registered
          </Text>
        )}

        {isActive && !allEliminated && (
          <Text style={[styles.infoLine, { color: colours.success }]}>
            {'\u2713'} {pool.aliveCount || 0} alive
          </Text>
        )}

        {allEliminated && (
          <Text style={[styles.infoLine, { color: colours.danger }]}>
            {'\u2717'} All eliminated
          </Text>
        )}

        {isCompleted && (
          <Text style={[styles.infoLine, { color: colours.textMuted }]}>
            Tournament over
          </Text>
        )}

        {isUpcoming && !drawAvailable && (
          <Text style={styles.infoLine}>Draw TBC</Text>
        )}
      </View>

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
    backgroundColor: colours.white,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colours.border,
  },
  cardClosed: {
    opacity: 0.7,
  },
  badgeWrapper: {
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: colours.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  nameClosed: {
    color: colours.textMuted,
  },
  meta: {
    fontSize: 13,
    color: colours.textMuted,
    fontWeight: '500' as const,
    marginBottom: spacing.sm,
  },
  infoLines: {
    gap: 4,
    marginBottom: spacing.md,
  },
  infoLine: {
    fontSize: 13,
    color: colours.textSecondary,
    fontWeight: '500' as const,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colours.primary,
  },
  ctaTextClosed: {
    color: colours.textMuted,
  },
});

export default PoolCard;
