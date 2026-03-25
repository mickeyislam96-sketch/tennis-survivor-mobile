// Final Serve-ivor — Design Tokens
// Matches web app's dark green/white scheme

export const colours = {
  // Core
  primary: '#2E7D32',        // Green — brand colour
  primaryDark: '#1B5E20',
  primaryLight: '#4CAF50',

  // Backgrounds
  background: '#0F1923',     // Dark navy — matches web
  surface: '#1A2A3A',        // Card backgrounds
  surfaceLight: '#243447',   // Elevated surfaces

  // Text
  text: '#FFFFFF',
  textSecondary: '#B0BEC5',
  textMuted: '#607D8B',

  // Status
  success: '#4CAF50',
  successBg: 'rgba(76, 175, 80, 0.15)',
  warning: '#FFA726',
  warningBg: 'rgba(255, 167, 38, 0.15)',
  danger: '#EF5350',
  dangerBg: 'rgba(239, 83, 80, 0.15)',
  info: '#42A5F5',
  infoBg: 'rgba(66, 165, 245, 0.15)',

  // Misc
  border: '#2A3A4A',
  overlay: 'rgba(0, 0, 0, 0.6)',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colours.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colours.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colours.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colours.text },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: colours.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colours.textMuted },
  label: { fontSize: 14, fontWeight: '600' as const, color: colours.textSecondary },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
};
