import type { Period } from '@/content/types';
import { colors } from './tokens';

// Time-of-day themes for Right now, from mocks/2-right-now.html.
export type PeriodTheme = {
  bg: string;
  ink: string;
  body: string;
  muted: string;
  accent: string;
  shadow: string;
  btnBg: string;
  btnInk: string;
  barOn: string;
  barOff: string;
  statusBar: 'dark' | 'light';
};

export const periodThemes: Record<Period, PeriodTheme> = {
  dawn: {
    bg: colors.pinkTint,
    ink: colors.ink,
    body: colors.inkSoft,
    muted: colors.inkMuted,
    accent: '#C2185B',
    shadow: colors.blue,
    btnBg: colors.ink,
    btnInk: colors.white,
    barOn: colors.ink,
    barOff: 'rgba(26,26,46,0.18)',
    statusBar: 'dark',
  },
  midday: {
    bg: colors.yellowTint,
    ink: colors.ink,
    body: colors.inkSoft,
    muted: colors.inkMuted,
    accent: colors.blue,
    shadow: colors.pink,
    btnBg: colors.blue,
    btnInk: colors.white,
    barOn: colors.ink,
    barOff: 'rgba(26,26,46,0.18)',
    statusBar: 'dark',
  },
  dusk: {
    bg: colors.blue,
    ink: colors.white,
    body: '#E4EAFF',
    muted: '#D6E0FF',
    accent: colors.yellow,
    shadow: colors.pink,
    btnBg: colors.yellow,
    btnInk: colors.ink,
    barOn: colors.white,
    barOff: 'rgba(255,255,255,0.3)',
    statusBar: 'light',
  },
  night: {
    bg: colors.ink,
    ink: colors.paper,
    body: '#D9D7E6',
    muted: '#A9A7BF',
    accent: colors.yellow,
    shadow: colors.blue,
    btnBg: colors.yellow,
    btnInk: colors.ink,
    barOn: colors.paper,
    barOff: 'rgba(250,247,242,0.25)',
    statusBar: 'light',
  },
};
