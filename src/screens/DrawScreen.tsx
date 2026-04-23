import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  SafeAreaView, StyleSheet, ScrollView, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getRounds, getBracket, getMatchup, DrawMatch, DrawPlayer, BracketData, MatchupData } from '../api/draw';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import PlayerAvatar from '../components/PlayerAvatar';
import { colours, spacing, borderRadius, shadows, fonts } from '../theme';
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
            {item.player1Name && item.player1Name !== 'TBD' && (
              <PlayerAvatar playerId={item.player1Id} playerName={item.player1Name} size={22} />
            )}
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
            {item.player2Name && item.player2Name !== 'TBD' && (
              <PlayerAvatar playerId={item.player2Id} playerName={item.player2Name} size={22} />
            )}
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
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Match Detail Modal ───────────────────────────────────────────────────────

interface MatchDetailModalProps {
  match: DrawMatch;
  onClose: () => void;
}

// ── Helpers for matchup modal ────────────────────────────────────────────────

function isUnknownPlayer(name: string | undefined): boolean {
  if (!name) return true;
  return ['Qualifier', 'TBD', 'BYE'].includes(name);
}

function formatSetScore(s1: string, s2: string): string {
  const format = (v: string) => {
    const str = String(v);
    if (str.includes('.')) {
      const [game, tb] = str.split('.');
      return `${game}(${tb})`;
    }
    return str;
  };
  return `${format(s1)}-${format(s2)}`;
}

function formatMatchScoreFromSets(scores: Array<{ score_first: string; score_second: string }>): string {
  if (!Array.isArray(scores)) return '';
  return scores
    .filter(s => !(s.score_first === '0' && s.score_second === '0'))
    .map(s => formatSetScore(s.score_first, s.score_second))
    .join(' ');
}

function shortRound(roundStr: string | null): string {
  if (!roundStr) return '';
  const r = roundStr.toLowerCase();
  if (r.includes('1/64'))    return 'R128';
  if (r.includes('1/32'))    return 'R64';
  if (r.includes('1/16'))    return 'R32';
  if (r.includes('1/8'))     return 'R16';
  if (r.includes('quarter')) return 'QF';
  if (r.includes('semi'))    return 'SF';
  if (r.includes('final'))   return 'F';
  return roundStr.replace(/^.*?-\s*/, '');
}

function surname(name: string | null): string {
  if (!name) return '';
  return name.split(' ').pop() || '';
}

function winPct(won: number, lost: number): number {
  const total = won + lost;
  if (total === 0) return 0;
  return won / total;
}

function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const [data, setData] = useState<MatchupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const p1Unknown = isUnknownPlayer(match.player1Name);
  const p2Unknown = isUnknownPlayer(match.player2Name);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const p1Key = match.player1ApiKey || match.player1Id;
    const p2Key = match.player2ApiKey || match.player2Id;

    // Both players known: full H2H
    if (p1Key && p2Key && !p1Unknown && !p2Unknown) {
      getMatchup(p1Key, p2Key)
        .then(d => { setData(d); setLoading(false); })
        .catch(e => { setError(e.message); setLoading(false); });
      return;
    }

    // One player known: fetch their profile via self-H2H
    const knownKey = p1Unknown ? p2Key : p1Key;
    if (knownKey) {
      getMatchup(knownKey, knownKey)
        .then(d => {
          const knownData = d.player1;
          const emptyPlayer = { key: '', name: null, country: null, logo: null, rank: null, clay: { won: 0, lost: 0 }, overall: { won: 0, lost: 0 }, season: null, recent: [] };
          setData({
            player1: p1Unknown ? emptyPlayer : knownData,
            player2: p2Unknown ? emptyPlayer : knownData,
            h2h: { player1Wins: 0, player2Wins: 0, meetings: [] },
          });
          setLoading(false);
        })
        .catch(e => { setError(e.message); setLoading(false); });
      return;
    }

    setLoading(false);
    setError('No player data available');
  }, [match.player1ApiKey, match.player1Id, match.player2ApiKey, match.player2Id, p1Unknown, p2Unknown]);

  // ── Render ──

  const renderLoading = () => (
    <View style={styles.muLoadingWrap}>
      <ActivityIndicator size="large" color={colours.primary} />
      <Text style={styles.muLoadingText}>Loading matchup data...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.muLoadingWrap}>
      <Text style={styles.muErrorText}>No head-to-head data available.</Text>
    </View>
  );

  const renderContent = () => {
    if (!data) return renderError();

    const NO_RECORD = { won: 0, lost: 0 };
    const raw1 = data.player1 || {} as any;
    const raw2 = data.player2 || {} as any;
    const p1 = { ...raw1, clay: raw1.clay || NO_RECORD, overall: raw1.overall || NO_RECORD };
    const p2 = { ...raw2, clay: raw2.clay || NO_RECORD, overall: raw2.overall || NO_RECORD };
    const h2h = data.h2h || { player1Wins: 0, player2Wins: 0, meetings: [] };

    const p1Name = p1.name || match.player1Name || 'TBD';
    const p2Name = p2.name || match.player2Name || 'TBD';
    const p1Sur = surname(p1Name);
    const p2Sur = surname(p2Name);

    const hasClay = (p1.clay.won + p1.clay.lost + p2.clay.won + p2.clay.lost) > 0;
    const hasOnlyOnePlayer = p1Unknown !== p2Unknown;

    const p1ClayBetter = winPct(p1.clay.won, p1.clay.lost) > winPct(p2.clay.won, p2.clay.lost);
    const p2ClayBetter = winPct(p2.clay.won, p2.clay.lost) > winPct(p1.clay.won, p1.clay.lost);
    const p1OverallBetter = winPct(p1.overall.won, p1.overall.lost) > winPct(p2.overall.won, p2.overall.lost);
    const p2OverallBetter = winPct(p2.overall.won, p2.overall.lost) > winPct(p1.overall.won, p1.overall.lost);

    const filterRecent = (results: any[], playerName: string) =>
      (results || []).filter((r: any) => r.opponent && r.opponent !== playerName);

    const p1Recent = filterRecent(p1.recent, p1Name);
    const p2Recent = filterRecent(p2.recent, p2Name);

    return (
      <>
        {/* H2H header */}
        <View style={styles.muH2hBar}>
          <View style={styles.muPlayerCol}>
            <Text style={styles.muPlayerName} numberOfLines={2}>{p1Name}</Text>
            <Text style={styles.muPlayerMeta}>
              {p1Unknown ? 'TBC' : `${p1.country || ''}${p1.rank ? ` \u00B7 #${p1.rank}` : ''}`}
            </Text>
          </View>

          {!hasOnlyOnePlayer ? (
            <View style={styles.muVsCol}>
              <Text style={styles.muVsLabel}>Head to Head</Text>
              <View style={styles.muVsScoreRow}>
                <Text style={[styles.muVsNum, h2h.player1Wins > h2h.player2Wins && styles.muVsNumBold]}>
                  {h2h.player1Wins}
                </Text>
                <Text style={styles.muVsDivider}> - </Text>
                <Text style={[styles.muVsNum, h2h.player2Wins > h2h.player1Wins && styles.muVsNumBold]}>
                  {h2h.player2Wins}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.muVsCol}>
              <Text style={styles.muVsLabel}>vs</Text>
            </View>
          )}

          <View style={styles.muPlayerCol}>
            <Text style={styles.muPlayerName} numberOfLines={2}>{p2Name}</Text>
            <Text style={styles.muPlayerMeta}>
              {p2Unknown ? 'TBC' : `${p2.country || ''}${p2.rank ? ` \u00B7 #${p2.rank}` : ''}`}
            </Text>
          </View>
        </View>

        {/* Season stats */}
        <View style={styles.muSection}>
          <Text style={styles.muSectionTitle}>
            {p1.season || p2.season ? `${p1.season || p2.season} Season` : 'Season Stats'}
          </Text>
          <View style={styles.muStatsGrid}>
            {hasClay && (
              <View style={styles.muStatCard}>
                <Text style={styles.muStatLabel}>
                  Clay Record{(p1.claySeason || p2.claySeason) ? ` (${p1.claySeason || p2.claySeason})` : ''}
                </Text>
                <View style={styles.muStatValues}>
                  {!p1Unknown && (
                    <View style={styles.muStatValCol}>
                      <Text style={[styles.muStatNum, styles.muStatGreen, p1ClayBetter && styles.muStatBold]}>
                        {p1.clay.won}-{p1.clay.lost}
                      </Text>
                      <Text style={styles.muStatSub}>{p1Sur}</Text>
                    </View>
                  )}
                  {!p2Unknown && (
                    <View style={styles.muStatValCol}>
                      <Text style={[styles.muStatNum, styles.muStatGreen, p2ClayBetter && styles.muStatBold]}>
                        {p2.clay.won}-{p2.clay.lost}
                      </Text>
                      <Text style={styles.muStatSub}>{p2Sur}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            <View style={styles.muStatCard}>
              <Text style={styles.muStatLabel}>Overall Record</Text>
              <View style={styles.muStatValues}>
                {!p1Unknown && (
                  <View style={styles.muStatValCol}>
                    <Text style={[styles.muStatNum, !hasOnlyOnePlayer && p1OverallBetter && styles.muStatBold]}>
                      {p1.overall.won}-{p1.overall.lost}
                    </Text>
                    <Text style={styles.muStatSub}>{p1Sur}</Text>
                  </View>
                )}
                {!p2Unknown && (
                  <View style={styles.muStatValCol}>
                    <Text style={[styles.muStatNum, !hasOnlyOnePlayer && p2OverallBetter && styles.muStatBold]}>
                      {p2.overall.won}-{p2.overall.lost}
                    </Text>
                    <Text style={styles.muStatSub}>{p2Sur}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Recent form */}
        {(p1Recent.length > 0 || p2Recent.length > 0) && (
          <View style={styles.muSection}>
            <Text style={styles.muSectionTitle}>Recent Form</Text>
            <View style={styles.muFormCols}>
              {!p1Unknown && p1Recent.length > 0 && (
                <View style={styles.muFormCol}>
                  <Text style={styles.muFormHeader}>{p1Sur}</Text>
                  {p1Recent.map((r: any, i: number) => {
                    const rl = shortRound(r.round);
                    return (
                      <View key={i} style={styles.muFormRow}>
                        <View style={[styles.muWlBadge, r.won ? styles.muWlWin : styles.muWlLoss]}>
                          <Text style={[styles.muWlText, r.won ? styles.muWlTextW : styles.muWlTextL]}>
                            {r.won ? 'W' : 'L'}
                          </Text>
                        </View>
                        <View style={styles.muFormDetail}>
                          <Text style={styles.muFormOpp} numberOfLines={1}>{r.opponent}</Text>
                          <Text style={styles.muFormEvent} numberOfLines={1}>
                            {r.tournament}{rl ? ` \u00B7 ${rl}` : ''}
                          </Text>
                        </View>
                        <Text style={styles.muFormScore} numberOfLines={1}>
                          {formatMatchScoreFromSets(r.scores)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
              {!p2Unknown && p2Recent.length > 0 && (
                <View style={styles.muFormCol}>
                  <Text style={styles.muFormHeader}>{p2Sur}</Text>
                  {p2Recent.map((r: any, i: number) => {
                    const rl = shortRound(r.round);
                    return (
                      <View key={i} style={styles.muFormRow}>
                        <View style={[styles.muWlBadge, r.won ? styles.muWlWin : styles.muWlLoss]}>
                          <Text style={[styles.muWlText, r.won ? styles.muWlTextW : styles.muWlTextL]}>
                            {r.won ? 'W' : 'L'}
                          </Text>
                        </View>
                        <View style={styles.muFormDetail}>
                          <Text style={styles.muFormOpp} numberOfLines={1}>{r.opponent}</Text>
                          <Text style={styles.muFormEvent} numberOfLines={1}>
                            {r.tournament}{rl ? ` \u00B7 ${rl}` : ''}
                          </Text>
                        </View>
                        <Text style={styles.muFormScore} numberOfLines={1}>
                          {formatMatchScoreFromSets(r.scores)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        <Text style={styles.muFooter}>Data from API-Tennis {'\u00B7'} Updated every hour</Text>
      </>
    );
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.muHeaderRow}>
              <Text style={styles.muHeaderTitle}>Matchup Info</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.muHeaderClose}>{'\u00D7'}</Text>
              </TouchableOpacity>
            </View>

            {loading ? renderLoading() : (error && !data) ? renderError() : renderContent()}

            {/* Close button */}
            <TouchableOpacity style={styles.modalClose} onPress={onClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.canvas,
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
    fontFamily: fonts.monoMedium,
    fontWeight: '400',
    color: colours.textMuted,
    textTransform: 'uppercase',
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
    fontFamily: fonts.sansRegular,
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
    backgroundColor: colours.red500,
  },
  liveIndicatorText: {
    fontSize: 10.5,
    fontFamily: fonts.monoMedium,
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
    fontFamily: fonts.monoBold,
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
    fontFamily: fonts.sansMedium,
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
    fontFamily: fonts.monoBold,
    fontWeight: '700',
    color: colours.green700,
    marginRight: 6,
  },
  score: {
    fontSize: 12.5,
    fontFamily: fonts.monoRegular,
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
    fontFamily: fonts.sansRegular,
    color: colours.gray400,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: borderRadius.pill,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: fonts.monoMedium,
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
    fontFamily: fonts.sansRegular,
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
    fontFamily: fonts.sansBold,
    fontWeight: '700' as const,
    color: colours.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  drawUnavailableMessage: {
    fontSize: 15,
    fontFamily: fonts.sansRegular,
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
    fontFamily: fonts.sansMedium,
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
    fontFamily: fonts.sansRegular,
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
    backgroundColor: colours.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colours.gray200,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  // Header row
  muHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  muHeaderTitle: {
    fontSize: 18,
    fontFamily: fonts.serifBold,
    fontWeight: '700',
    color: colours.text,
  },
  muHeaderClose: {
    fontSize: 28,
    fontFamily: fonts.sansRegular,
    fontWeight: '300',
    color: colours.textMuted,
    lineHeight: 28,
  },

  // Loading / error
  muLoadingWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muLoadingText: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    marginTop: spacing.md,
  },
  muErrorText: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    textAlign: 'center',
  },

  // H2H bar
  muH2hBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  muPlayerCol: {
    flex: 1,
    alignItems: 'center',
  },
  muPlayerName: {
    fontSize: 15,
    fontFamily: fonts.sansMedium,
    fontWeight: '700',
    color: colours.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  muPlayerMeta: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    textAlign: 'center',
  },
  muVsCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    minWidth: 70,
  },
  muVsLabel: {
    fontSize: 10,
    fontFamily: fonts.monoMedium,
    fontWeight: '600',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  muVsScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muVsNum: {
    fontSize: 24,
    fontFamily: fonts.monoBold,
    fontWeight: '400',
    color: colours.text,
  },
  muVsNumBold: {
    fontWeight: '800',
  },
  muVsDivider: {
    fontSize: 20,
    fontFamily: fonts.monoRegular,
    color: colours.textMuted,
  },

  // Sections
  muSection: {
    marginBottom: spacing.lg,
  },
  muSectionTitle: {
    fontSize: 12,
    fontFamily: fonts.monoMedium,
    fontWeight: '700',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  // Stats grid
  muStatsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  muStatCard: {
    flex: 1,
    backgroundColor: colours.gray50,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colours.border,
  },
  muStatLabel: {
    fontSize: 11,
    fontFamily: fonts.monoMedium,
    fontWeight: '600',
    color: colours.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  muStatValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  muStatValCol: {
    alignItems: 'center',
  },
  muStatNum: {
    fontSize: 18,
    fontFamily: fonts.monoBold,
    fontWeight: '600',
    color: colours.text,
  },
  muStatGreen: {
    color: colours.primary,
  },
  muStatBold: {
    fontWeight: '800',
  },
  muStatSub: {
    fontSize: 11,
    fontFamily: fonts.monoMedium,
    color: colours.textMuted,
    marginTop: 2,
  },

  // Recent form
  muFormCols: {
    gap: spacing.lg,
  },
  muFormCol: {},
  muFormHeader: {
    fontSize: 14,
    fontFamily: fonts.sansMedium,
    fontWeight: '700',
    color: colours.text,
    marginBottom: spacing.sm,
  },
  muFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colours.border,
  },
  muWlBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  muWlWin: {
    backgroundColor: colours.successBg,
  },
  muWlLoss: {
    backgroundColor: colours.dangerBg,
  },
  muWlText: {
    fontSize: 11,
    fontFamily: fonts.monoBold,
    fontWeight: '700',
  },
  muWlTextW: {
    color: colours.success,
  },
  muWlTextL: {
    color: colours.danger,
  },
  muFormDetail: {
    flex: 1,
    marginRight: spacing.sm,
  },
  muFormOpp: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    fontWeight: '600',
    color: colours.text,
  },
  muFormEvent: {
    fontSize: 11,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
  },
  muFormScore: {
    fontSize: 12,
    fontFamily: fonts.monoRegular,
    fontWeight: '500',
    color: colours.textSecondary,
    textAlign: 'right',
  },

  // Footer
  muFooter: {
    fontSize: 11,
    fontFamily: fonts.sansRegular,
    color: colours.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  // Close button
  modalClose: {
    backgroundColor: colours.gray100,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  modalCloseText: {
    fontSize: 15,
    fontFamily: fonts.sansMedium,
    fontWeight: '600',
    color: colours.text,
  },
});

export default DrawScreen;
