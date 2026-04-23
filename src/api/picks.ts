import { apiCall } from './client';

export interface Player {
  id: string;
  name: string;
  seed?: number;
  roundEliminated: string | null;
  pendingPrevRound?: boolean;
  opponentName?: string | null;
  opponentPossible?: string[] | null;
  status?: string;
  matchStartTime?: string;
}

export interface Pick {
  id: string;
  groupId: string;
  userId: string;
  round: string;
  playerId: string;
  playerName: string;
  survived: boolean | null;
  createdAt: string;
}

export function getAvailablePlayers(groupId: string, round: string): Promise<Player[]> {
  return apiCall<Player[]>('/api/picks/available', {
    params: { groupId, round },
  });
}

export function submitPick(data: {
  groupId: string;
  round: string;
  playerId: string;
  playerName: string;
}): Promise<Pick> {
  return apiCall<Pick>('/api/picks', {
    method: 'POST',
    body: data as Record<string, unknown>,
  });
}

export function getPickHistory(groupId: string): Promise<Pick[]> {
  return apiCall<Pick[]>('/api/picks/history', {
    params: { groupId },
  });
}

/** Fetch another user's pick history (for leaderboard modal) */
export function getUserPickHistory(userId: string, groupId: string): Promise<Pick[]> {
  return apiCall<Pick[]>('/api/picks/history', {
    params: { userId, groupId },
    skipAuth: true,
  });
}
