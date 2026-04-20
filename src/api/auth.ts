import { apiCall } from './client';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse extends User {
  isNew?: boolean;
  token?: string;
  csrf?: string;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiCall<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
}

export function register(email: string, displayName: string, password: string): Promise<AuthResponse> {
  return apiCall<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: { email, displayName, password },
    skipAuth: true,
  });
}

export function getMe(): Promise<User> {
  return apiCall<User>('/api/auth/me');
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiCall<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
    skipAuth: true,
  });
}

export function verifyResetToken(token: string): Promise<{ valid: boolean; error?: string }> {
  return apiCall<{ valid: boolean; error?: string }>('/api/auth/verify-reset-token', {
    params: { token },
    skipAuth: true,
  });
}

export function resetPassword(token: string, password: string): Promise<User> {
  return apiCall<User>('/api/auth/reset-password', {
    method: 'POST',
    body: { token, password },
    skipAuth: true,
  });
}

export function updateProfile(updates: {
  displayName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<User> {
  return apiCall<User>('/api/auth/me', {
    method: 'PATCH',
    body: updates as Record<string, unknown>,
  });
}

export function getMyPools(): Promise<any[]> {
  return apiCall<any[]>('/api/auth/me/pools');
}
