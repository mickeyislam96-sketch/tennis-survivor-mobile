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
  const startDate = pool.tournament?.startDate || pool.startDate || '';
  const drawAvailable = pool.tournament?.drawAvailable ?? pool.drawAvailable;

  // Determine if tournament is effectively over (completed or all eliminated)
  const allEliminated = isActive && pool.aliveCount === 0 && pool.memberCount > 0;
  const isClosed = isCompleted || allEliminated;

  const getBadge = () => {
    if (isCompleted) return <Badge label="Completed" variant="muted" size="sm" />;
    if (allEliminated) return <Badge label="Closed" variant="muted" size="sm" />;
    if (isActive) return <Badge label="Active" variant="success" size="sm" />;
    if (isUpcoming) return <Badge label="Coming Soon" variant="info" size="sm" />;
    return null;
  };

  const getCta = () => {
    if (isClosed) return 'View Results \u2192';
    if (isActive) return 'View Pool \u2192';
    if (isUpcoming) return isFree ? 'Enter Free \u2192' : 'Register \u2192';
    return 'View \u2192';
  };

  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm, isClosed && styles.cardClosed]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top row: name, badge, entry fee */}
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <View style={styles.badgeWrapper}>
            {getBadge()}
          </View>
          <Text style={[styles.name, isClosed && styles.nameClosed]}>
            {pool.name || pool.tournament?.name || 'Pool'}
          </Text>
          {location ? (
            <Text style={styles.meta}>
              {location}
              {startDate ? ` \u00B7 ${formatDate(startDate)}` : ''}
            </Text>
          ) : null}
        </View>

        <View style={styles.entryBadge}>
          {isFree ? (
            <Text style={styles.entryFree}>Free</Text>
          ) : (
            <Text style={styles.entryPaid}>
              \u00A3{((pool.entryFeeCents || 0) / 100).toFixed(0)}
            </Text>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom row: stats and CTA */}
      <View style={styles.bottomRow}>
        <View style={styles.statsList}>
          <Text style={styles.stat}>
            {'\uD83D\uDC65'} {pool.memberCount || 0} players
          </Text>
          {isActive && !allEliminated && (
            <Text style={[styles.stat, { color: colours.success }]}>
              {'\u2713'} {pool.aliveCount || 0} alive
            </Text>
          )}
          {allEliminated && (
            <Text style={[styles.stat, { color: colours.danger }]}>
              {'\u2717'} All eliminated
            </Text>
          )}
          {isCompleted && (
            <Text style={[styles.stat, { color: colours.textMuted }]}>
              Tournament over
            </Text>
          )}
          {isUpcoming && !drawAvailable && (
            <Text style={styles.stat}>{'\uD83D\uDCC5'} Draw TBC</Text>
          )}
          {isUpcoming && startDate && (
            <Text style={styles.stat}>{'\uD83D\uDCC5'} Starts {formatDate(startDate)}</Text>
          )}
        </View>

        <View style={styles.ctaSection}>
          <Text style={[styles.ctaText, isClosed && styles.ctaTextClosed]}>
            {getCta()}
          </Text>
        </View>
      </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
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
  nameClosed: {
    color: colours.textMuted,
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
    overflow: 'hidden',
  },
  entryPaid: {
    fontWeight: '700' as const,
    fontSize: 12,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
    marginVertical: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.xs,
  },
  statsList: {
    flex: 1,
    gap: 4,
  },
  stat: {
    fontSize: 12.5,
    color: colours.textMuted,
    fontWeight: '500' as const,
  },
  ctaSection: {
    marginLeft: spacing.lg,
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colours.primary,
  },
  ctaTextClosed: {
    color: colours.textMuted,
  },
});

export default PoolCard;
