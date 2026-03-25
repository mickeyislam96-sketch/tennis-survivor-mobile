import { apiCall } from './client';

export interface LeaderboardMember {
  id: string;
  userId: string;
  displayName: string;
  isAlive: boolean;
  eliminatedRound: string | null;
  joinedAt: string;
  picksCount: number;
  survivedRounds: number;
  currentRoundPick: string | null;
}

export interface LeaderboardData {
  group: {
    id: string;
    name: string;
  };
  leaderboard: LeaderboardMember[];
  aliveCount: number;
  currentRound: string;
  roundIsLocked: boolean;
}

export function getLeaderboard(groupId: string): Promise<LeaderboardData> {
  return apiCall<LeaderboardData>(`/api/leaderboard/${groupId}`);
}
