import { apiCall } from './client';

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  displayName: string;
  isAlive: boolean;
  eliminatedRound: string | null;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  entryFeeCents: number;
  prizePoolCents: number;
  tournamentId: string;
  adminUserId: string;
  createdAt: string;
  members?: GroupMember[];
  tournament?: {
    id: string;
    name: string;
    location: string;
    surface?: string;
    tier?: string;
    drawAvailable: boolean;
    drawDate?: string;
    startDate: string;
    status: string;
    entryOpen?: boolean;
  };
}

export interface Pool {
  id: string;
  name: string;
  inviteCode: string;
  entryFeeCents: number;
  prizePoolCents: number;
  tournamentId: string;
  status?: string;
  startDate?: string;
  location?: string;
  tournament?: {
    id: string;
    name: string;
    location: string;
    surface?: string;
    tier?: string;
    drawAvailable: boolean;
    drawDate?: string;
    startDate: string;
    status: string;
  };
  memberCount: number;
  aliveCount: number;
  isMember: boolean;
  isReal: boolean;
}

export function getPools(): Promise<Pool[]> {
  return apiCall<Pool[]>('/api/pools');
}

export function getMyGroups(): Promise<Group[]> {
  return apiCall<Group[]>('/api/groups');
}

export function getGroup(groupId: string): Promise<Group> {
  return apiCall<Group>(`/api/groups/${groupId}`);
}

export function getGroupByInvite(code: string): Promise<Group> {
  return apiCall<Group>(`/api/groups/invite/${code}`);
}

export function joinGroup(groupId: string, displayName: string): Promise<GroupMember> {
  return apiCall<GroupMember>(`/api/groups/${groupId}/join`, {
    method: 'POST',
    body: { displayName } as any,
  });
}
