/**
 * Hex mirrors of the custom `--color-*` utilities declared in global.css.
 *
 * Uniwind resolves oklch tokens for `className`, but native props (SVG strokes,
 * lucide icon `color`, navigation chrome, status bar) need React Native
 * parseable values, so every colour handed to a prop comes from here.
 */
export const brandColor = {
  /** Logo left figure. */
  navy: '#0d2149',
  /** Logo right figure and the heartbeat line, lifted for the dark canvas. */
  electric: '#2f80ff',
} as const;

/**
 * App chrome. Mirrors the semantic tokens in global.css so the tab bar, headers
 * and the mascot backdrop match what `className` resolves to.
 */
export const ui = {
  /** `--background` */
  canvas: '#07080d',
  /** `--panel` — cards. */
  panel: '#14171e',
  /** `--surface` — nested blocks inside cards. */
  surface: '#1a1e26',
  /** `--border` */
  border: '#252a34',
  /** `--foreground` */
  text: '#f2f5fa',
  /** `--muted` */
  textMuted: '#9aa4b5',
  /** `--accent` */
  accent: '#2f80ff',
  /** Slightly deeper than the canvas so the tab bar reads as a shelf. */
  tabBar: '#04050a',
} as const;

export const tierColor = {
  strong: '#4d9bff',
  good: '#26b6e6',
  fair: '#8b95a8',
} as const;

/** Deep tints of the tier colours, for badge and bar backgrounds on dark. */
export const tierSoft = {
  strong: '#0f2551',
  good: '#0c2a38',
  fair: '#1b1f28',
} as const;

/**
 * Traffic-light reading of a match score, used for every score dial, ring and
 * reason block: green for a high match, amber for a middling one, red below 30.
 */
export const matchColor = {
  high: '#2fd39b',
  medium: '#f0b429',
  low: '#f0576a',
} as const;

/** Deep tints of the match colours, for bar tracks and reason blocks on dark. */
export const matchSoft = {
  high: '#0d2b23',
  medium: '#2b2110',
  low: '#2d1419',
} as const;

export type MatchTier = keyof typeof matchColor;

export function matchTier(score: number): MatchTier {
  if (score >= 72) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export const signalColor = '#f0a93a';
export const positiveColor = '#2fd39b';

/** Hero slab gradient: electric blue collapsing into the near-black canvas. */
export const heroGradient = ['#2472f2', '#11317f', '#0a0f22'] as const satisfies readonly [
  string,
  string,
  ...string[],
];

/** Splash backdrop: a single deep blue glow over black. */
export const splashGradient = ['#0d1a3d', '#07080d', '#04050a'] as const satisfies readonly [
  string,
  string,
  ...string[],
];

/** Ink colours for content sitting on the hero gradient. */
export const onHero = {
  primary: '#ffffff',
  muted: 'rgba(226, 236, 255, 0.78)',
  faint: 'rgba(226, 236, 255, 0.55)',
  line: 'rgba(255, 255, 255, 0.18)',
  fill: 'rgba(255, 255, 255, 0.14)',
} as const;

export type ScoreTier = keyof typeof tierColor;

export function scoreTier(score: number): ScoreTier {
  if (score >= 72) return 'strong';
  if (score >= 52) return 'good';
  return 'fair';
}

/** Deterministic decorative avatar colours, keyed off a person id. */
const avatarPalette = [
  '#2f80ff',
  '#4d9bff',
  '#26b6e6',
  '#5b8def',
  '#3f6fd8',
  '#1fa2c9',
  '#6f8fff',
  '#2bd4b4',
] as const;

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }
  return avatarPalette[hash % avatarPalette.length];
}
