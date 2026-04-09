import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  SafeAreaView, StyleSheet, ScrollView, Modal, Pressable, Linking,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getRounds, getBracket, DrawMatch, DrawPlayer, BracketData } from '../api/draw';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import { colours, spacing, borderRadius, shadows } from '../theme';
import { ROUND_LABELS, ROUND_ORDER } from '../utils/constants';

interface Section {
  title: string;
  data: DrawMatch[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isLiveStatus(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'in_progress' || s === 'live' || s === '1' || s === '2' || s === '3' ||
         s === '4' || s === '5' || s.startsWith('set');
}

function formatMatchDate(startTime?: string): string {
  if (!startTime) return '';
  try {
    const d = new Date(startTime);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function formatMatchTime(startTime?: string): string {
  if (!startTime) return '';
  try {
    const d = new Date(startTime);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Build a map: playerId -> next round opponent/match info.
 * For each match in the next round, both feeders' IDs point to that match.
 */
function buildNextRoundMap(
  allMatches: DrawMatch[],
  currentRoundKey: string,
  roundsList: string[],
): Record<string, { nextRound: string; opponentName: string | null; matchId: string }> {
  const map: Record<string, { nextRound: string; opponentName: string | null; matchId: string }> = {};
  const currentIdx = roundsList.indexOf(currentRoundKey);
  if (currentIdx < 0 || currentIdx >= roundsList.length - 1) return map;

  const nextRoundKey = roundsList[currentIdx + 1];
  const nextMatches = allMatches.filter((m) => m.round === nextRoundKey);

  for (const nm of nextMatches) {
    // Player 1 of next round match: they came from current round
    if (nm.player1Id) {
      map[nm.player1Id] = {
        nextRound: nextRoundKey,
        opponentName: nm.player2Name || null,
        matchId: nm.id,
      };
    }
    if (nm.player2Id) {
      map[nm.player2Id] = {
        nextRound: nextRoundKey,
        opponentName: nm.player1Name || null,
        matchId: nm.id,
      };
    }
  }
  return map;
}

// ── Main Component ───────────────────────────────────────────────────────────

export function DrawScreen() {
  const route = useRoute<any>();
  const { groupId, drawAvailable } = route.params;

  const [rounds, setRounds] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState<string | null>(null);
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<DrawMatch | null>(null);

  const isDrawUnavailable = drawAvailable === false;

  // Player lookup by ID (for seeds)
  const playerMap = useMemo(() => {
    const map: Record<string, DrawPlayer> = {};
    if (bracketData?.players) {
      for (const p of bracketData.players) {
        map[p.id] = p;
      }
    }
    return map;
  }, [bracketData]);

  // Next round opponent map for the current round
  const nextRoundMap = useMemo(() => {
    if (!bracketData?.matches || !currentRound || !rounds.length) return {};
    return buildNextRoundMap(bracketData.matches, currentRound, rounds);
  }, [bracketData, currentRound, rounds]);

  const loadData = useCallback(async () => {
    if (isDrawUnavailable) {
      setLoading(false);
      return;
    }
    try {
      const [roundsList, bracket] = await Promise.all([
        getRounds(),
        getBracket(),
      ]);
      setRounds(roundsList);
      setBracketData(bracket);

      if (currentRound === null && roundsList.length > 0) {
        setCurrentRound(roundsList[0]);
      }

      // Group matches by round
      const matchesByRound: Record<string, DrawMatch[]> = {};
      for (const m of bracket.matches) {
        if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
        matchesByRound[m.round].push(m);
      }

      const secs: Section[] = [];
      for (const r of roundsList) {
        if (matchesByRound[r]?.length) {
          secs.push({
            title: ROUND_LABELS[r] || r,
            data: matchesByRound[r].sort((a, b) => a.matchOrder - b.matchOrder),
          });
        }
      }
      setSections(secs);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isDrawUnavailable]); // removed currentRound dep - data loads once, filtering is client-side

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner message="Loading draw..." />;

  if (isDrawUnavailable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.drawUnavailable}>
          <Text style={styles.drawUnavailableEmoji}>{'\uD83C\uDFBE'}</Text>
          <Text style={styles.drawUnavailableTitle}>Draw Not Yet Released</Text>
          <Text style={styles.drawUnavailableMessage}>
            The official tournament draw hasn't been published yet. Once it's released by the tournament organisers, the full bracket will appear here.
          </Text>
          <View style={styles.drawUnavailableCard}>
            <Text style={styles.drawUnavailableCardIcon}>{'\uD83D\uDCC5'}</Text>
            <Text style={styles.drawUnavailableCardText}>
              Check back closer to the tournament start date.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const filteredSections = currentRound
    ? sections.filter((s) => ROUND_LABELS[currentRound] === s.title)
    : sections;

  const matchCount = filteredSections.length > 0 ? filteredSections[0].data.length : 0;
  const completedCount = filteredSections.length > 0
    ? filteredSections[0].data.filter((m) => m.status === 'completed').length
    : 0;

  const renderMatch = ({ item }: { item: DrawMatch }) => {
    const isCompleted = item.status === 'completed';
    const isLive = isLiveStatus(item.status);
    const p1Won = item.winnerId === item.player1Id;
    const p2Won = item.winnerId === item.player2Id;

    const p1Seed = playerMap[item.player1Id]?.seed;
    const p2Seed = playerMap[item.player2Id]?.seed;

    // Next round context for the winner
    const winnerId = item.winnerId;
    const nextInfo = winnerId ? nextRoundMap[winnerId] : null;

    let statusBg = colours.gray50;
    let statusTextColour = colours.gray500;
    let statusLabel = 'Scheduled';

    if (isCompleted) {
      statusBg = '#dcfce7';
      statusTextColour = '#15803d';
      statusLabel = 'Finished';
    } else if (isLive) {
      statusBg = '#fee2e2';
      statusTextColour = '#ef4444';
      statusLabel = 'Live';
    }

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => setSelectedMatch(item)}
        activeOpacity={0.7}
      >
        {isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveIndicatorText}>LIVE</Text>
          </View>
        )}

        {/* Player 1 */}
        <View style={styles.playerRow}>
          <View style={styles.playerNameRow}>
            {p1Seed != null && (
              <Text style={styles.seedBadge}>{p1Seed}</Text>
            )}
            <Text style={[
              styles.playerName,
              p1Won && styles.playerWinner,
              isCompleted && !p1Won && styles.playerLoser,
            ]} numberOfLines={1}>
              {item.player1Name || 'TBD'}
            </Text>
          </View>
          {p1Won && <Text style={styles.winTick}>{'\u2713'}</Text>}
          {item.score && isCompleted && (
            <Text style={[styles.score, p1Won && styles.scoreWinner]}>
              {item.score}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Player 2 */}
        <View style={styles.playerRow}>
          <View style={styles.playerNameRow}>
            {p2Seed != null && (
              <Text style={styles.seedBadge}>{p2Seed}</Text>
            )}
            <Text style={[
              styles.playerName,
              p2Won && styles.playerWinner,
              isCompleted && !p2Won && styles.playerLoser,
            ]} numberOfLines={1}>
              {item.player2Name || 'TBD'}
            </Text>
          </View>
          {p2Won && <Text style={styles.winTick}>{'\u2713'}</Text>}
        </View>

        {/* Meta Footer */}
        <View style={styles.metaSection}>
          <Text style={styles.dateText}>
            {item.startTime ? formatMatchDate(item.startTime) : ''}
            {item.startTime ? ` ${formatMatchTime(item.startTime)}` : ''}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusTextColour }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Next round context */}
        {nextInfo && isCompleted && (
          <View style={styles.nextRoundHint}>
            <Text style={styles.nextRoundText}>
              Winner plays {nextInfo.opponentName || 'TBD'} in {ROUND_LABELS[nextInfo.nextRound] || nextInfo.nextRound}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Round Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled>
          {rounds.map((round) => (
            <TouchableOpacity
              key={round}
              onPress={() => setCurrentRound(round)}
              style={[
                styles.tab,
                currentRound === round && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  currentRound === round && styles.tabTextActive,
                ]}
              >
                {ROUND_LABELS[round] || round}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Round summary */}
      {currentRound && matchCount > 0 && (
        <View style={styles.roundSummary}>
          <Text style={styles.roundSummaryText}>
            {ROUND_LABELS[currentRound] || currentRound} {'\u00B7'} {completedCount}/{matchCount} completed
          </Text>
        </View>
      )}

      {/* Draw List */}
      <FlatList
        data={filteredSections.length > 0 ? filteredSections[0].data : []}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            title="Draw not published"
            message="The draw hasn't been published yet."
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredSections.length === 0 && { flex: 1 }
        ]}
        scrollEnabled={true}
      />

      {/* Auto-update footer */}
      <View style={styles.autoUpdateFooter}>
        <Text style={styles.autoUpdateText}>
          Results update automatically as matches complete.
        </Text>
      </View>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          playerMap={playerMap}
          nextRoundMap={nextRoundMap}
          currentRound={currentRound}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Match Detail Modal ───────────────────────────────────────────────────────

interface MatchDetailModalProps {
  match: DrawMatch;
  playerMap: Record<string, DrawPlayer>;
  nextRoundMap: Record<string, { nextRound: string; opponentName: string | null; matchId: string }>;
  currentRound: string | null;
  onClose: () => void;
}

function MatchDetailModal({ match, playerMap, nextRoundMap, currentRound, onClose }: MatchDetailModalProps) {
  const isCompleted = match.status === 'completed';
  const isLive = isLiveStatus(match.status);
  const p1Won = match.winnerId === match.player1Id;
  const p2Won = match.winnerId === match.player2Id;

  const p1 = playerMap[match.player1Id];
  const p2 = playerMap[match.player2Id];

  const winnerId = match.winnerId;
  const nextInfo = winnerId ? nextRoundMap[winnerId] : null;

  const roundLabel = ROUND_LABELS[match.round] || match.round;

  // Build Google H2H search URL
  const openH2H = () => {
    const p1Name = match.player1Name || '';
    const p2Name = match.player2Name || '';
    if (!p1Name || !p2Name || p1Name === 'TBD' || p2Name === 'TBD') return;
    const query = encodeURIComponent(`${p1Name} vs ${p2Name} head to head tennis`);
    Linking.openURL(`https://www.google.com/search?q=${query}`);
  };

  // Open ATP player profile search
  const openPlayerProfile = (name: string) => {
    if (!name || name === 'TBD') return;
    const query = encodeURIComponent(`${name} ATP tennis profile`);
    Linking.openURL(`https://www.google.com/search?q=${query}`);
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Round + Status */}
          <View style={styles.modalRoundRow}>
            <Text style={styles.modalRoundLabel}>{roundLabel}</Text>
            {isLive && <Badge label="Live" variant="danger" size="sm" />}
            {isCompleted && <Badge label="Finished" variant="success" size="sm" />}
            {!isLive && !isCompleted && <Badge label="Scheduled" variant="muted" size="sm" />}
          </View>

          {/* Date/time */}
          {match.startTime && (
            <Text style={styles.modalDateTime}>
              {formatMatchDate(match.startTime)} at {formatMatchTime(match.startTime)}
            </Text>
          )}

          {/* Players head to head card */}
          <View style={styles.h2hCard}>
            {/* Player 1 */}
            <TouchableOpacity
              style={[styles.h2hPlayer, p1Won && styles.h2hPlayerWon]}
              onPress={() => openPlayerProfile(match.player1Name || '')}
              activeOpacity={0.7}
            >
              <View style={[styles.h2hAvatar, p1Won && styles.h2hAvatarWon]}>
                <Text style={styles.h2hAvatarText}>
                  {(match.player1Name || 'T')[0].toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.h2hName, p1Won && styles.h2hNameWon]} numberOfLines={2}>
                {match.player1Name || 'TBD'}
              </Text>
              {p1?.seed != null && (
                <Text style={styles.h2hSeed}>#{p1.seed} seed</Text>
              )}
              {p1Won && <Text style={styles.h2hWinLabel}>{'\u2713'} Won</Text>}
              {isCompleted && !p1Won && <Text style={styles.h2hLoseLabel}>Lost</Text>}
            </TouchableOpacity>

            {/* VS divider */}
            <View style={styles.h2hVs}>
              <Text style={styles.h2hVsText}>vs</Text>
            </View>

            {/* Player 2 */}
            <TouchableOpacity
              style={[styles.h2hPlayer, p2Won && styles.h2hPlayerWon]}
              onPress={() => openPlayerProfile(match.player2Name || '')}
              activeOpacity={0.7}
            >
              <View style={[styles.h2hAvatar, p2Won && styles.h2hAvatarWon]}>
                <Text style={styles.h2hAvatarText}>
                  {(match.player2Name || 'T')[0].toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.h2hName, p2Won && styles.h2hNameWon]} numberOfLines={2}>
                {match.player2Name || 'TBD'}
              </Text>
              {p2?.seed != null && (
                <Text style={styles.h2hSeed}>#{p2.seed} seed</Text>
              )}
              {p2Won && <Text style={styles.h2hWinLabel}>{'\u2713'} Won</Text>}
              {isCompleted && !p2Won && <Text style={styles.h2hLoseLabel}>Lost</Text>}
            </TouchableOpacity>
          </View>

          {/* Score */}
          {isCompleted && match.score && (
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>Score</Text>
              <Text style={styles.scoreCardValue}>{match.score}</Text>
            </View>
          )}

          {/* Next round context */}
          {nextInfo && isCompleted && (
            <View style={styles.nextRoundCard}>
              <Text style={styles.nextRoundCardLabel}>Next</Text>
              <Text style={styles.nextRoundCardValue}>
                Winner plays {nextInfo.opponentName || 'TBD'} in {ROUND_LABELS[nextInfo.nextRound] || nextInfo.nextRound}
              </Text>
            </View>
          )}

          {/* H2H lookup button */}
          {match.player1Name && match.player2Name &&
           match.player1Name !== 'TBD' && match.player2Name !== 'TBD' && (
            <TouchableOpacity style={styles.h2hButton} onPress={openH2H} activeOpacity={0.7}>
              <Text style={styles.h2hButtonText}>
                Look up head-to-head {'\u2192'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Tap player hint */}
          <Text style={styles.modalHint}>
            Tap a player name to look up their profile
          </Text>

          {/* Close */}
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },

  // TABS
  tabsContainer: {
    backgroundColor: colours.surface,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: spacing.sm,
  },
  tabActive: {
    borderBottomColor: colours.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '400',
    color: colours.textMuted,
  },
  tabTextActive: {
    color: colours.primary,
    fontWeight: '700',
  },

  // ROUND SUMMARY
  roundSummary: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colours.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  roundSummaryText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colours.textMuted,
  },

  // MATCH CARD
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  matchCard: {
    backgroundColor: colours.white,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },

  // Live indicator
  liveIndicator: {
    backgroundColor: colours.red50,
    borderBottomWidth: 1,
    borderBottomColor: colours.red100,
    paddingVertical: 3,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveIndicatorText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colours.red500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Player rows
  playerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  playerNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colours.primary,
    backgroundColor: colours.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
    minWidth: 20,
    textAlign: 'center',
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    color: colours.gray700,
  },
  playerWinner: {
    fontWeight: '700',
    color: colours.green700,
  },
  playerLoser: {
    color: colours.gray400,
  },
  winTick: {
    fontSize: 14,
    fontWeight: '700',
    color: colours.green700,
    marginRight: 6,
  },
  score: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colours.gray500,
    marginLeft: spacing.sm,
  },
  scoreWinner: {
    color: colours.green700,
  },

  divider: {
    height: 1,
    backgroundColor: colours.gray100,
  },

  // Meta section
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colours.gray50,
    borderTopWidth: 1,
    borderTopColor: colours.gray100,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  dateText: {
    fontSize: 11.5,
    color: colours.gray400,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Next round hint on card
  nextRoundHint: {
    backgroundColor: colours.blue50,
    borderTopWidth: 1,
    borderTopColor: colours.blue100,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
  },
  nextRoundText: {
    fontSize: 11,
    fontWeight: '500',
    color: colours.blue700,
  },

  // Draw unavailable state
  drawUnavailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
  },
  drawUnavailableEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  drawUnavailableTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colours.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  drawUnavailableMessage: {
    fontSize: 15,
    color: colours.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  drawUnavailableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.blue50,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colours.blue100,
    gap: spacing.sm,
  },
  drawUnavailableCardIcon: {
    fontSize: 20,
  },
  drawUnavailableCardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: colours.blue700,
    lineHeight: 18,
  },

  // Auto-update footer
  autoUpdateFooter: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  autoUpdateText: {
    fontSize: 12,
    color: colours.textMuted,
    fontStyle: 'italic',
  },

  // ── MODAL ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colours.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colours.gray200,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalRoundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  modalRoundLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.text,
  },
  modalDateTime: {
    fontSize: 13,
    color: colours.textMuted,
    marginBottom: spacing.lg,
  },

  // H2H card
  h2hCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 0,
    marginBottom: spacing.md,
  },
  h2hPlayer: {
    flex: 1,
    backgroundColor: colours.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colours.border,
  },
  h2hPlayerWon: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  h2hAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colours.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  h2hAvatarWon: {
    backgroundColor: colours.primary,
  },
  h2hAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colours.white,
  },
  h2hName: {
    fontSize: 14,
    fontWeight: '600',
    color: colours.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  h2hNameWon: {
    color: colours.green700,
    fontWeight: '700',
  },
  h2hSeed: {
    fontSize: 11,
    fontWeight: '600',
    color: colours.primary,
    backgroundColor: colours.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  h2hWinLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colours.success,
    marginTop: 4,
  },
  h2hLoseLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colours.textMuted,
    marginTop: 4,
  },
  h2hVs: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
  h2hVsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colours.textMuted,
    textTransform: 'uppercase',
  },

  // Score card
  scoreCard: {
    backgroundColor: colours.gray50,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colours.border,
  },
  scoreCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  scoreCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colours.text,
    letterSpacing: 0.5,
  },

  // Next round card
  nextRoundCard: {
    backgroundColor: colours.blue50,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colours.blue100,
  },
  nextRoundCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colours.blue700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  nextRoundCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colours.blue800,
  },

  // H2H button
  h2hButton: {
    backgroundColor: colours.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  h2hButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colours.white,
  },

  // Modal hint
  modalHint: {
    fontSize: 11.5,
    color: colours.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Close button
  modalClose: {
    backgroundColor: colours.gray100,
    borderRadius: borderRadius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: colours.text,
  },
});

export default DrawScreen;
