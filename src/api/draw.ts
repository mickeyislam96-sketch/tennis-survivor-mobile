import { apiCall } from './client';

export interface DrawMatch {
  id: string;
  round: string;
  matchOrder: number;
  player1Id: string;
  player1Name: string;
  player1ApiKey?: string;
  player2Id: string;
  player2Name: string;
  player2ApiKey?: string;
  winnerId: string | null;
  winnerName: string | null;
  status: string;
  startTime?: string;
  score?: string;
  bye?: boolean;
}

export interface DrawPlayer {
  id: string;
  name: string;
  seed?: number;
  roundEliminated: string | null;
}

export interface BracketData {
  players: DrawPlayer[];
  matches: DrawMatch[];
  rounds: string[];
  currentRound?: string;
}

export interface Deadline {
  round: string;
  opensAt: string | null;
  lockAt: string | null;
  isLocked: boolean;
  isOpen: boolean;
  perMatchLock?: boolean;
}

export function getRounds(): Promise<string[]> {
  return apiCall<string[]>('/api/draw/rounds');
}

export function getBracket(round?: string): Promise<BracketData> {
  return apiCall<BracketData>('/api/draw/bracket', {
    params: round ? { round } : {},
  });
}

export function getDeadlines(): Promise<Deadline[]> {
  return apiCall<Deadline[]>('/api/draw/deadlines');
}

// ── Matchup H2H data ──────────────────────────────────────────────────────

export interface MatchupRecentResult {
  date: string;
  opponent: string;
  result: string;
  won: boolean;
  tournament: string;
  round: string | null;
  scores: Array<{ score_first: string; score_second: string }>;
}

export interface MatchupPlayerStats {
  key: string;
  name: string | null;
  country: string | null;
  logo: string | null;
  rank: string | null;
  clay: { won: number; lost: number };
  claySeason?: string | null;
  overall: { won: number; lost: number };
  season: string | null;
  recent: MatchupRecentResult[];
}

export interface MatchupH2H {
  player1Wins: number;
  player2Wins: number;
  meetings: Array<{
    date: string;
    tournament: string;
    round: string | null;
    result: string;
    p1Won: boolean;
    scores: Array<{ score_first: string; score_second: string }>;
  }>;
}

export interface MatchupData {
  player1: MatchupPlayerStats;
  player2: MatchupPlayerStats;
  h2h: MatchupH2H;
}

export function getMatchup(player1Key: string, player2Key: string): Promise<MatchupData> {
  return apiCall<MatchupData>(`/api/matchup/${player1Key}/${player2Key}`, { skipAuth: true });
}
