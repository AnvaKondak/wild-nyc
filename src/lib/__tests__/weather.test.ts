import { describeWeather, fetchWeather, makeWeather, skyFromCode, weatherTags } from '../weather';

describe('skyFromCode', () => {
  it('reads WMO codes', () => {
    expect(skyFromCode(0)).toBe('clear');
    expect(skyFromCode(3)).toBe('cloudy');
    expect(skyFromCode(45)).toBe('fog');
    expect(skyFromCode(53)).toBe('drizzle');
    expect(skyFromCode(81)).toBe('rain');
    expect(skyFromCode(75)).toBe('snow');
    expect(skyFromCode(95)).toBe('storm');
  });
});

describe('weatherTags', () => {
  it('names what animals would feel', () => {
    expect(weatherTags('rain', 50, 5, 10)).toEqual(['rain']);
    expect(weatherTags('drizzle', 50, 5, 10)).toEqual(['rain']);
    expect(weatherTags('storm', 70, 10, 20)).toEqual(['rain', 'wind']);
    expect(weatherTags('snow', 25, 5, 10)).toEqual(['snow']); // snow says cold already
    expect(weatherTags('clear', 95, 3, 5)).toEqual(['heat']);
    expect(weatherTags('clear', 20, 3, 5)).toEqual(['cold']);
    expect(weatherTags('cloudy', 50, 20, 30)).toEqual(['wind']);
    expect(weatherTags('clear', 65, 5, 10)).toEqual([]);
  });
});

describe('describeWeather', () => {
  it('reads like a person talking', () => {
    expect(describeWeather(makeWeather(45, 54, 53, 3, 5))).toBe('54°, misty and cool');
    expect(describeWeather(makeWeather(2, 48, 40, 22, 35))).toBe('48°, clear and chilly, and windy');
  });
});

describe('fetchWeather', () => {
  const body = { current: { weather_code: 61, temperature_2m: 51.2, apparent_temperature: 48, wind_speed_10m: 8, wind_gusts_10m: 14 } };

  it('sends only the cell center, rounded, and no credentials', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: true, json: async () => body })) as unknown as typeof fetch;
    const w = await fetchWeather('dr5rke', { fetchImpl });
    expect(w?.tags).toEqual(['rain']);
    const [url, init] = (fetchImpl as unknown as jest.Mock).mock.calls[0];
    const params = new URL(url).searchParams;
    expect(params.get('latitude')).toMatch(/^\d+\.\d{2}$/);
    expect(params.get('longitude')).toMatch(/^-\d+\.\d{2}$/);
    expect(init.credentials).toBe('omit');
  });

  it('refuses anything that is not a cell, and fails quietly', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    expect(await fetchWeather('40.67,-73.98', { fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    const failing = jest.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect(await fetchWeather('dr5rke', { fetchImpl: failing })).toBeNull();
  });
});
