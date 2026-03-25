import { API_BASE_URL } from '../utils/constants';
import { getStoredUser } from '../utils/storage';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function apiCall<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, skipAuth = false } = options;

  // Build URL
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  // Add userId from storage
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth) {
    const user = await getStoredUser();
    if (user?.id) {
      url.searchParams.set('userId', user.id);
      headers['X-User-Id'] = user.id;
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(`Request failed: ${response.statusText}`, response.status);
    }
    return {} as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || `HTTP ${response.status}`, response.status);
  }

  return data as T;
}
