import { apiCall } from './client';

export interface DrawMatch {
  id: string;
  round: string;
  matchOrder: number;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  winnerId: string | null;
  winnerName: string | null;
  status: string;
  startTime?: string;
  score?: string;
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
