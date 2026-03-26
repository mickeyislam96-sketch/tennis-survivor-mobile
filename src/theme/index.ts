// Final Serve-ivor — Design Tokens
// Pixel-matched to web app CSS variables

export const colours = {
  // Core
  primary: '#16a34a',        // --accent
  primaryDark: '#15803d',    // --accent-dark
  primaryLight: '#dcfce7',   // --accent-light
  primarySuperDark: '#14532d', // gradient start

  // Backgrounds
  background: '#f1f5f9',     // --bg
  surface: '#ffffff',         // --surface
  surfaceAlt: '#f8fafc',     // --surface-alt
  surfaceLight: '#f8fafc',

  // Text
  text: '#0f172a',           // --text
  textSecondary: '#475569',
  textMuted: '#64748b',      // --text-muted

  // Status
  success: '#16a34a',        // --success
  successBg: '#dcfce7',      // --accent-light
  successBorder: '#bbf7d0',
  successDark: '#15803d',
  warning: '#d97706',        // --warning
  warningBg: '#fef3c7',
  warningLight: '#fffbeb',
  warningBorder: '#fde68a',
  warningDark: '#92400e',
  danger: '#dc2626',         // --danger
  dangerBg: '#fee2e2',       // --danger-light
  dangerBorder: '#fca5a5',
  dangerDark: '#b91c1c',
  info: '#2563eb',
  infoBg: '#dbeafe',
  infoDark: '#1d4ed8',
  infoLight: '#eff6ff',

  // Misc
  border: '#e2e8f0',         // --border
  overlay: 'rgba(0, 0, 0, 0.45)',
  white: '#FFFFFF',
  black: '#000000',

  // Amber (for pending states)
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber400: '#fbbf24',
  amber700: '#92400e',
  amber800: '#78350f',

  // Blue (for future/info states)
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue200: '#bfdbfe',
  blue700: '#1d4ed8',
  blue800: '#1e40af',

  // Red extras
  red50: '#fef2f2',
  red100: '#fee2e2',
  red400: '#f87171',
  red500: '#ef4444',

  // Green extras
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green300: '#86efac',
  green400: '#4ade80',
  green700: '#15803d',
  green900: '#14532d',

  // Gray extras
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
};

// Avatar colour cycle (matches web leaderboard)
export const AVATAR_COLOURS = [
  '#16a34a', '#0891b2', '#7c3aed', '#db2777',
  '#d97706', '#65a30d', '#0369a1', '#9333ea',
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 5,
  sm: 8,                     // --radius-sm
  md: 12,                    // --radius
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colours.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colours.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colours.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colours.text, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: colours.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colours.textMuted },
  label: { fontSize: 14, fontWeight: '600' as const, color: colours.textSecondary },
  eyebrow: { fontSize: 11, fontWeight: '700' as const, color: colours.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' as const },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  green: {
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  greenLg: {
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
};
