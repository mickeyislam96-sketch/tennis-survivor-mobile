// API base URL — points to your live Railway backend
export const API_BASE_URL = 'https://tennis-survivor-production.up.railway.app';

// App metadata
export const APP_NAME = 'Final Serve-ivor';
export const APP_SCHEME = 'finalserveivor';
export const WEB_URL = 'https://finalserveivor.com';

// Round display order
export const ROUND_ORDER = ['R1', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'] as const;

// Round labels for display
export const ROUND_LABELS: Record<string, string> = {
  R1: 'Round 1',
  R64: 'Round of 64',
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-Finals',
  SF: 'Semi-Finals',
  F: 'Final',
};

// Status colours (matches web CSS)
export const PICK_RESULT_COLOURS = {
  survived: '#16a34a',  // --success / --accent
  eliminated: '#dc2626', // --danger
  pending: '#64748b',    // --text-muted
} as const;
