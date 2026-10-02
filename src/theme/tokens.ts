// Design tokens from CLAUDE.md. Riso-print zine: flat colors, ink outlines,
// solid offset shadows with no blur.

export const colors = {
  paper: '#FAF7F2',
  ink: '#1A1A2E',
  inkSoft: '#3B3A50',
  inkMuted: '#55546A',
  pink: '#FF6B9A',
  pinkTint: '#FFE3EC',
  blue: '#2F5BEA',
  blueDeep: '#1F3FB0',
  blueTint: '#DDE6FF',
  yellow: '#FFD23F',
  yellowTint: '#FFF4C7',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;

// Font family names must match the keys loaded in src/app/_layout.tsx.
// With custom fonts each weight is its own family, so never set fontWeight.
export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_400Regular',
  displayItalic: 'Fraunces_400Regular_Italic',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemi: 'InstrumentSans_600SemiBold',
} as const;

export const radius = {
  card: 22,
  tile: 18,
  pill: 20,
} as const;

export const border = {
  width: 1.5,
} as const;

export const touch = {
  min: 44,
} as const;

/** Solid offset shadow, like a print that's a little off-register. */
export function offsetShadow(color: string = colors.ink, offset = 4): string {
  return `${offset}px ${offset}px 0px ${color}`;
}
