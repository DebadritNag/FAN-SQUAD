import { Platform } from 'react-native';
import type { Club } from '../types/index';

export const Colors = {
  background: '#131314',
  surface: '#131314',
  surfaceLow: '#1c1b1c',
  surfaceContainer: '#201f20',
  surfaceHigh: '#2a2a2b',
  surfaceHighest: '#353436',
  surfaceBright: '#3a393a',

  primary: '#00ffc2',       // Electric Green — main accent
  onPrimary: '#003828',
  primaryContainer: '#00513c',

  secondary: '#ffb4ab',     // Warm red-pink
  onSecondary: '#690005',

  tertiary: '#97efff',      // Cyan — nav/interactive
  onTertiary: '#00363d',

  onSurface: '#e5e2e3',
  onSurfaceVariant: '#b9cbc1',
  onSurfaceMuted: '#83958c',

  outline: '#83958c',
  outlineVariant: '#3a4a43',

  error: '#ffb4ab',
  errorContainer: '#93000a',

  // DFL Red — Bundesliga branding only
  dflRed: '#D20515',
} as const;

export const Typography = {
  displayXL: {
    fontSize: 48,
    fontWeight: '900' as const,
    lineHeight: 53,
    letterSpacing: -1.9,
    color: Colors.onSurface,
  },
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: Colors.onSurface,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 31,
    color: Colors.onSurface,
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 29,
    color: Colors.onSurface,
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: Colors.onSurface,
  },
  dataMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 17,
    letterSpacing: 0.7,
    color: Colors.onSurface,
  },
  labelCaps: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 12,
    letterSpacing: 1.2,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase' as const,
  },
} as const;

export const Spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
  gutter: 20,
} as const;

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const Shadows = {
  primaryGlow: {
    shadowColor: '#00ffc2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  cyanGlow: {
    shadowColor: '#97efff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const GlassCard = {
  backgroundColor: 'rgba(32,31,32,0.85)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  borderRadius: Radius.lg,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Club Theme System
// Each club overrides specific design tokens while keeping the base structure.
// ─────────────────────────────────────────────────────────────────────────────

export interface ClubTheme {
  // Core palette
  primary: string;          // Main accent — buttons, highlights, live indicators
  onPrimary: string;        // Text on primary-colored surfaces
  primaryGlow: string;      // Glow/shadow color (usually same as primary)
  secondary: string;        // Secondary accent — ghost borders, nav
  onSecondary: string;

  // Surface overrides
  surfaceContainer: string;
  outlineVariant: string;

  // Shape — clubs can override corner radius
  cardRadius: number;       // Card border radius
  buttonRadius: number;     // Button border radius

  // Glass card style
  glassCard: {
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
  };

  // Shadow/glow
  accentGlow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

// ── Default / DFL theme (no club selected) ───────────────────────────────────
export const DefaultClubTheme: ClubTheme = {
  primary: Colors.primary,           // #00ffc2 electric green
  onPrimary: Colors.onPrimary,       // #003828
  primaryGlow: Colors.primary,
  secondary: Colors.tertiary,        // #97efff cyan
  onSecondary: Colors.onTertiary,

  surfaceContainer: Colors.surfaceContainer,
  outlineVariant: Colors.outlineVariant,

  cardRadius: Radius.lg,             // 24px — rounded glassmorphic
  buttonRadius: Radius.full,         // 999px — full pill

  glassCard: { ...GlassCard },

  accentGlow: { ...Shadows.primaryGlow },
};

// ── FC Bayern München — "Mia San Mia Esports" ────────────────────────────────
// Sharp & technical: 4px card radius, red neon glow, white secondary
export const BayernTheme: ClubTheme = {
  primary: '#DC052D',                // Mia San Mia Red
  onPrimary: '#FFFFFF',
  primaryGlow: '#DC052D',
  secondary: '#FFFFFF',              // Pure white for ghost borders/text
  onSecondary: '#131314',

  surfaceContainer: '#1f1f20',
  outlineVariant: '#5d3f3e',         // Warm dark red-tinted border

  cardRadius: 4,                     // Sharp — "Soft-Sharp" language
  buttonRadius: 4,                   // Sharp buttons

  glassCard: {
    backgroundColor: 'rgba(31,31,32,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 4,
  },

  accentGlow: {
    shadowColor: '#DC052D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
};

// ── Borussia Dortmund ─────────────────────────────────────────────────────────
export const DortmundTheme: ClubTheme = {
  primary: '#FDE100',                // BVB Yellow
  onPrimary: '#000000',
  primaryGlow: '#FDE100',
  secondary: '#000000',
  onSecondary: '#FDE100',

  surfaceContainer: Colors.surfaceContainer,
  outlineVariant: '#4a4200',

  cardRadius: Radius.lg,
  buttonRadius: Radius.full,

  glassCard: {
    backgroundColor: 'rgba(32,31,20,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(253,225,0,0.12)',
    borderRadius: Radius.lg,
  },

  accentGlow: {
    shadowColor: '#FDE100',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 9,
  },
};

// ── Werder Bremen ─────────────────────────────────────────────────────────────
export const WerderTheme: ClubTheme = {
  primary: '#1D9053',                // Werder Green
  onPrimary: '#FFFFFF',
  primaryGlow: '#1D9053',
  secondary: '#FFFFFF',
  onSecondary: '#1D9053',

  surfaceContainer: Colors.surfaceContainer,
  outlineVariant: '#1a3d2a',

  cardRadius: Radius.lg,
  buttonRadius: Radius.full,

  glassCard: {
    backgroundColor: 'rgba(20,32,25,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(29,144,83,0.15)',
    borderRadius: Radius.lg,
  },

  accentGlow: {
    shadowColor: '#1D9053',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 9,
  },
};

// ── Club ID → Theme map ───────────────────────────────────────────────────────
const CLUB_THEMES: Record<string, ClubTheme> = {
  fcb: BayernTheme,
  bvb: DortmundTheme,
  svw: WerderTheme,
};

/**
 * Returns the ClubTheme for a given club, or the DefaultClubTheme if none matches.
 */
export function getClubTheme(club: Club | null): ClubTheme {
  if (!club) return DefaultClubTheme;
  return CLUB_THEMES[club.id] ?? {
    // Fallback: generate a theme from the club's raw colors
    primary: club.primaryColor,
    onPrimary: '#FFFFFF',
    primaryGlow: club.primaryColor,
    secondary: club.secondaryColor,
    onSecondary: '#131314',
    surfaceContainer: Colors.surfaceContainer,
    outlineVariant: Colors.outlineVariant,
    cardRadius: Radius.lg,
    buttonRadius: Radius.full,
    glassCard: { ...GlassCard, borderRadius: Radius.lg },
    accentGlow: {
      shadowColor: club.primaryColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  };
}
