// Final Serve-ivor — Design Tokens (Direction A)
// Matched to web design system: frontend/src/styles/tokens.css

export const colours = {
  // ── Canvas & surface ──
  canvas: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F2ED',
  surfaceSunken: '#EDEAE2',

  // ── Ink (text) ──
  ink: '#141414',
  inkMuted: '#4A4A46',
  inkSoft: '#8A8780',
  inkGhost: '#BEBAB0',

  // ── Borders ──
  border: '#E3E0D7',
  borderStrong: '#CDC8BA',

  // ── Primary (deep emerald) ──
  primary: '#0F4A23',
  primaryHover: '#0A3A1B',
  primarySoft: '#E0EBE4',
  primaryInk: '#FFFFFF',

  // ── Accent (terracotta) ──
  accent: '#C1572E',
  accentSoft: '#F6E3D9',
  accentInk: '#FFFFFF',

  // ── Gold (winner system) ──
  gold: '#FFC933',
  goldDeep: '#E6A500',
  goldSoft: '#FFF3C4',
  goldSurface: '#FFFBE8',
  goldInk: '#2B1F00',

  // ── Semantic status ──
  success: '#1E7A3E',
  successSoft: '#E1F1E7',
  danger: '#B03B2A',
  dangerSoft: '#F7DFD9',
  warning: '#B67300',
  warningSoft: '#FFF1D6',
  info: '#1F5580',
  infoSoft: '#E0ECF5',

  // ── Utilities ──
  overlay: 'rgba(20, 20, 20, 0.45)',
  white: '#FFFFFF',
  black: '#000000',

  // ── Legacy aliases (backwards compat during migration) ──
  background: '#FAFAF7',
  text: '#141414',
  textSecondary: '#4A4A46',
  textMuted: '#8A8780',
  primaryLight: '#E0EBE4',
  primaryDark: '#0A3A1B',
  primarySuperDark: '#0F4A23',
  surfaceAlt: '#F4F2ED',
  successBg: '#E1F1E7',
  successBorder: '#A3D4B5',
  successDark: '#166534',
  warningBg: '#FFF1D6',
  warningLight: '#FFFBE8',
  warningBorder: '#FCD34D',
  warningDark: '#92400e',
  dangerBg: '#F7DFD9',
  dangerBorder: '#E5A49A',
  dangerDark: '#8B2E1F',
  infoBg: '#E0ECF5',
  infoDark: '#164466',
  infoLight: '#E0ECF5',

  // Amber (pending states — mapped to warning system)
  amber50: '#FFFBE8',
  amber100: '#FFF3C4',
  amber200: '#FCD34D',
  amber400: '#FFC933',
  amber700: '#92400e',
  amber800: '#78350f',

  // Blue (future/info states)
  blue50: '#E0ECF5',
  blue100: '#E0ECF5',
  blue200: '#B3CEE0',
  blue700: '#1F5580',
  blue800: '#164466',

  // Red extras (mapped to danger system)
  red50: '#F7DFD9',
  red100: '#F7DFD9',
  red400: '#D4594A',
  red500: '#B03B2A',

  // Green extras (mapped to primary/success)
  green50: '#E0EBE4',
  green100: '#E0EBE4',
  green200: '#A3D4B5',
  green300: '#6FBD8A',
  green400: '#3AA05E',
  green700: '#0A3A1B',
  green900: '#0F4A23',

  // Gray extras (mapped to stone palette)
  gray50: '#F4F2ED',
  gray100: '#EDEAE2',
  gray200: '#E3E0D7',
  gray300: '#CDC8BA',
  gray400: '#BEBAB0',
  gray500: '#8A8780',
  gray700: '#4A4A46',
  gray900: '#141414',
};

// Avatar colour cycle (updated for new palette)
export const AVATAR_COLOURS = [
  '#0F4A23', '#1F5580', '#7c3aed', '#C1572E',
  '#B67300', '#1E7A3E', '#164466', '#9333ea',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
  full: 9999,
};

// Font family constants — loaded via @expo-google-fonts in App
// Names must match the useFonts() keys from the packages
export const fonts = {
  sans: 'Outfit_400Regular',
  sansRegular: 'Outfit_400Regular',
  sansMedium: 'Outfit_500Medium',
  sansSemiBold: 'Outfit_600SemiBold',
  sansBold: 'Outfit_700Bold',
  sansExtraBold: 'Outfit_800ExtraBold',
  serif: 'Fraunces_400Regular',
  serifRegular: 'Fraunces_400Regular',
  serifItalic: 'Fraunces_400Regular_Italic',
  serifBold: 'Fraunces_700Bold',
  serifBoldItalic: 'Fraunces_700Bold_Italic',
  mono: 'JetBrainsMono_400Regular',
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
};

export const typography = {
  // Display (serif for hero titles)
  display: { fontSize: 36, fontFamily: fonts.serifBold, color: colours.ink, letterSpacing: -0.5, lineHeight: 38 },
  displaySm: { fontSize: 28, fontFamily: fonts.serifBold, color: colours.ink, letterSpacing: -0.3, lineHeight: 30 },

  // Headings (sans)
  h1: { fontSize: 28, fontFamily: fonts.sansExtraBold, color: colours.ink, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontFamily: fonts.sansBold, color: colours.ink, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontFamily: fonts.sansSemiBold, color: colours.ink },

  // Body
  body: { fontSize: 16, fontFamily: fonts.sansRegular, color: colours.ink, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontFamily: fonts.sansRegular, color: colours.inkMuted },

  // Mono
  mono: { fontSize: 14, fontFamily: fonts.monoRegular, color: colours.ink },
  monoSm: { fontSize: 12, fontFamily: fonts.monoRegular, color: colours.inkMuted },

  // Labels
  caption: { fontSize: 12, fontFamily: fonts.sansRegular, color: colours.inkSoft },
  label: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colours.inkMuted },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.monoMedium,
    color: colours.inkSoft,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },

  // Stats
  statValue: { fontSize: 22, fontFamily: fonts.monoBold, color: colours.ink, lineHeight: 26 },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.monoMedium,
    color: colours.inkSoft,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#141414',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  card: {
    shadowColor: '#141414',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#141414',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#141414',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  primary: {
    shadowColor: '#0F4A23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryLg: {
    shadowColor: '#0F4A23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  // Legacy aliases
  green: {
    shadowColor: '#0F4A23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  greenLg: {
    shadowColor: '#0F4A23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
};
