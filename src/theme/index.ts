// Final Serve-ivor — Design Tokens
// Matches web app's light theme with green accent

export const colours = {
  // Core
  primary: '#16a34a',        // Green accent — exact match from web CSS
  primaryDark: '#15803d',
  primaryLight: '#dcfce7',

  // Backgrounds — light theme matching web
  background: '#f1f5f9',     // --bg from web CSS
  surface: '#ffffff',         // --surface (white cards)
  surfaceAlt: '#f8fafc',     // --surface-alt
  surfaceLight: '#f8fafc',

  // Text
  text: '#0f172a',           // --text from web
  textSecondary: '#475569',
  textMuted: '#64748b',      // --text-muted from web

  // Status
  success: '#16a34a',        // --success
  successBg: '#dcfce7',      // --accent-light
  warning: '#d97706',        // --warning
  warningBg: '#fef3c7',
  danger: '#dc2626',         // --danger
  dangerBg: '#fee2e2',       // --danger-light
  info: '#2563eb',
  infoBg: '#dbeafe',

  // Misc
  border: '#e2e8f0',         // --border from web
  overlay: 'rgba(0, 0, 0, 0.4)',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,                     // --radius-sm from web
  md: 12,                    // --radius from web
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colours.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colours.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colours.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colours.text },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: colours.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colours.textMuted },
  label: { fontSize: 14, fontWeight: '600' as const, color: colours.textSecondary },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
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
};
