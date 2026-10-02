// Runs with TZ=America/New_York (see package.json), so local times are NYC times.
import { dateKey, formatClock, moonPhaseName, periodOf, seasonKey, seasonOf, timeHeader } from '../time';

const NYC = { lat: 40.7128, lng: -74.006 };
// On 2026-10-01 in NYC, sunrise is about 6:59a and sunset about 6:41p.
const at = (h: number, m = 0) => new Date(2026, 9, 1, h, m);

describe('seasonOf', () => {
  it.each([
    [new Date(2026, 2, 1), 'spring'],
    [new Date(2026, 4, 31), 'spring'],
    [new Date(2026, 5, 1), 'summer'],
    [new Date(2026, 8, 1), 'fall'],
    [new Date(2026, 10, 30), 'fall'],
    [new Date(2026, 11, 1), 'winter'],
    [new Date(2027, 1, 28), 'winter'],
  ])('%s is %s', (date, season) => {
    expect(seasonOf(date)).toBe(season);
  });
});

describe('seasonKey', () => {
  it('keeps December and the following January in the same winter', () => {
    expect(seasonKey(new Date(2026, 11, 15))).toBe('2026-winter');
    expect(seasonKey(new Date(2027, 0, 15))).toBe('2026-winter');
  });

  it('changes when the season changes', () => {
    expect(seasonKey(new Date(2026, 10, 30))).toBe('2026-fall');
    expect(seasonKey(new Date(2026, 11, 1))).toBe('2026-winter');
  });
});

describe('dateKey and formatClock', () => {
  it('formats local dates and mock-style clocks', () => {
    expect(dateKey(new Date(2026, 8, 5))).toBe('2026-09-05');
    expect(formatClock(at(6, 51))).toBe('6:51a');
    expect(formatClock(at(12, 40))).toBe('12:40p');
    expect(formatClock(at(0, 5))).toBe('12:05a');
    expect(formatClock(at(22, 15))).toBe('10:15p');
  });
});

describe('periodOf', () => {
  it.each([
    [at(3, 0), 'night'],
    [at(6, 30), 'dawn'], // before sunrise, within the hour
    [at(8, 30), 'dawn'], // under 2h after sunrise
    [at(9, 30), 'midday'],
    [at(17, 30), 'midday'],
    [at(18, 0), 'dusk'], // within an hour before sunset
    [at(19, 30), 'dusk'], // within an hour after sunset
    [at(20, 0), 'night'],
  ])('%s is %s', (date, period) => {
    expect(periodOf(date, NYC.lat, NYC.lng)).toBe(period);
  });
});

describe('timeHeader', () => {
  it('counts down to sunrise at dawn', () => {
    const h = timeHeader(at(6, 40), NYC.lat, NYC.lng);
    expect(h.label).toBe('Dawn');
    expect(h.clock).toBe('6:40a');
    expect(h.sub).toMatch(/^Sunrise in \d+ minutes$/);
  });

  it('shows the moon phase at night', () => {
    const h = timeHeader(at(22, 15), NYC.lat, NYC.lng);
    expect(h.label).toBe('Night');
    expect(h.sub).toMatch(/moon$/);
  });
});

describe('moonPhaseName', () => {
  it('names a known full moon', () => {
    // Full moon on 2026-09-26.
    expect(moonPhaseName(new Date(2026, 8, 26, 22))).toBe('Full moon');
  });
});
