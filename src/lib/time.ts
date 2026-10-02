// Season, time of day and moon phase, all computed on the phone.

import * as SunCalc from 'suncalc';
import type { Period, Season } from '@/content/types';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/** Calendar-month seasons: Mar–May spring, Jun–Aug summer, Sep–Nov fall, Dec–Feb winter. */
export function seasonOf(date: Date): Season {
  const m = date.getMonth(); // 0 = Jan
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'fall';
  return 'winter';
}

/**
 * A key that changes once per season, used to reset kindness checks.
 * Winter belongs to the year it starts in: Jan 2027 is "2026-winter".
 */
export function seasonKey(date: Date): string {
  const season = seasonOf(date);
  const year = season === 'winter' && date.getMonth() < 2 ? date.getFullYear() - 1 : date.getFullYear();
  return `${year}-${season}`;
}

/** Local calendar date, "2026-10-01". */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "6:51a", "12:40p", like the mocks. */
export function formatClock(date: Date): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m}${h < 12 ? 'a' : 'p'}`;
}

type SunTimes = { sunrise: Date; sunset: Date };

function sunTimes(date: Date, lat: number, lng: number): SunTimes {
  // Noon avoids picking up the wrong day's times near midnight.
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);
  const t = SunCalc.getTimes(noon, lat, lng);
  // No sunrise/sunset only happens near the poles; fall back to 6a/6p.
  const fallback = (h: number) => {
    const d = new Date(noon);
    d.setHours(h);
    return d;
  };
  return { sunrise: t.sunrise ?? fallback(6), sunset: t.sunset ?? fallback(18) };
}

/**
 * Dawn: 1h before to 2h after sunrise. Midday: until 1h before sunset.
 * Dusk: 1h before to 1h after sunset. Night: the rest.
 */
export function periodOf(date: Date, lat: number, lng: number): Period {
  const { sunrise, sunset } = sunTimes(date, lat, lng);
  const t = date.getTime();
  const rise = sunrise.getTime();
  const set = sunset.getTime();
  if (t >= rise - HOUR && t < rise + 2 * HOUR) return 'dawn';
  if (t >= rise + 2 * HOUR && t < set - HOUR) return 'midday';
  if (t >= set - HOUR && t < set + HOUR) return 'dusk';
  return 'night';
}

/**
 * Moon phase name. SunCalc's phase runs 0 (new) → 0.5 (full) → 1 (new).
 * New, quarter and full are moments, so they only get about a day either side.
 */
export function moonPhaseName(date: Date): string {
  const { phase } = SunCalc.getMoonIllumination(date);
  const near = (target: number) => Math.abs(phase - target) < 0.035;
  if (near(0) || near(1)) return 'New moon';
  if (near(0.25)) return 'First quarter moon';
  if (near(0.5)) return 'Full moon';
  if (near(0.75)) return 'Last quarter moon';
  if (phase < 0.25) return 'Waxing crescent moon';
  if (phase < 0.5) return 'Waxing gibbous moon';
  if (phase < 0.75) return 'Waning gibbous moon';
  return 'Waning crescent moon';
}

function minutesUntil(from: Date, to: Date): number {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / MINUTE));
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export type TimeHeader = {
  period: Period;
  label: string;
  clock: string;
  /** "Sunrise in 12 minutes", "Waning crescent moon"… */
  sub: string;
};

/** Everything the Right now header shows. */
export function timeHeader(date: Date, lat: number, lng: number): TimeHeader {
  const period = periodOf(date, lat, lng);
  const { sunrise, sunset } = sunTimes(date, lat, lng);
  const clock = formatClock(date);
  switch (period) {
    case 'dawn':
      return {
        period,
        label: 'Dawn',
        clock,
        sub: date < sunrise ? `Sunrise in ${plural(minutesUntil(date, sunrise), 'minute')}` : `Sun came up at ${formatClock(sunrise)}`,
      };
    case 'midday':
      return { period, label: 'Midday', clock, sub: `Sunset at ${formatClock(sunset)}` };
    case 'dusk':
      return {
        period,
        label: 'Dusk',
        clock,
        sub: date < sunset ? `Sunset in ${plural(minutesUntil(date, sunset), 'minute')}` : `Sun went down at ${formatClock(sunset)}`,
      };
    case 'night':
      return { period, label: 'Night', clock, sub: moonPhaseName(date) };
  }
}
