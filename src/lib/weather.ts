// What the weather is doing in the neighborhood right now, so stories can say what
// the animals are feeling: rain on feathers, wind in the reeds, snow on the hedge.
//
// Comes from Open-Meteo (free, no key, CC BY 4.0). The only thing sent is the cell's
// center rounded to two decimals, about a kilometer: the same neighborhood-level
// point we already use for sun times. Never the user's position.

import { decodeGeohash } from './geohash';

/** What the sky is doing, from the WMO weather code. */
export type Sky = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'storm' | 'snow';

/** What a story moment can be about. Clear and cloudy days use the everyday moments. */
export type WeatherTag = 'rain' | 'snow' | 'wind' | 'heat' | 'cold' | 'fog';

export type Weather = {
  sky: Sky;
  tempF: number;
  feelsF: number;
  windMph: number;
  gustMph: number;
  /** Strongest first: snow, rain, fog, then wind, heat, cold. */
  tags: WeatherTag[];
};

const HEAT_F = 85; // feels-like at or above
const COLD_F = 32; // feels-like at or below
const WIND_MPH = 16;
const GUST_MPH = 28;

/** WMO weather interpretation codes (open-meteo.com/en/docs). */
export function skyFromCode(code: number): Sky {
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  if (code === 3) return 'cloudy';
  return 'clear'; // 0–2: clear to partly cloudy
}

export function weatherTags(sky: Sky, feelsF: number, windMph: number, gustMph: number): WeatherTag[] {
  const tags: WeatherTag[] = [];
  if (sky === 'snow') tags.push('snow');
  if (sky === 'rain' || sky === 'drizzle' || sky === 'storm') tags.push('rain');
  if (sky === 'fog') tags.push('fog');
  if (windMph >= WIND_MPH || gustMph >= GUST_MPH || sky === 'storm') tags.push('wind');
  if (feelsF >= HEAT_F) tags.push('heat');
  if (feelsF <= COLD_F && sky !== 'snow') tags.push('cold');
  return tags;
}

export function makeWeather(code: number, tempF: number, feelsF: number, windMph: number, gustMph: number): Weather {
  const sky = skyFromCode(code);
  return { sky, tempF, feelsF, windMph, gustMph, tags: weatherTags(sky, feelsF, windMph, gustMph) };
}

/** "54°, misty and cool" style words for the intro slide. */
export function describeWeather(w: Weather): string {
  const sky: Record<Sky, string> = {
    clear: 'clear',
    cloudy: 'gray and cloudy',
    fog: 'misty',
    drizzle: 'drizzly',
    rain: 'rainy',
    storm: 'stormy',
    snow: 'snowing',
  };
  const t = w.feelsF;
  const temp = t >= 90 ? 'hot' : t >= 78 ? 'warm' : t >= 62 ? 'mild' : t >= 45 ? 'cool' : t >= 32 ? 'chilly' : 'freezing';
  const windy = w.tags.includes('wind') ? ', and windy' : '';
  return `${Math.round(w.tempF)}°, ${sky[w.sky]} and ${temp}${windy}`;
}

const CELL = /^[0-9b-hjkmnp-z]{6}$/;

export async function fetchWeather(
  cell: string,
  { fetchImpl = fetch, timeoutMs = 8000 }: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<Weather | null> {
  if (!CELL.test(cell)) return null;
  const { lat, lng } = decodeGeohash(cell);
  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lng.toFixed(2),
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal,
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const c = (await res.json())?.current;
    if (!c || typeof c.weather_code !== 'number') return null;
    return makeWeather(c.weather_code, c.temperature_2m, c.apparent_temperature, c.wind_speed_10m, c.wind_gusts_10m ?? 0);
  } catch {
    return null; // offline: stories just use the everyday moments
  } finally {
    clearTimeout(timer);
  }
}

/** Dev previews, cycled from the story header. */
export const PREVIEW_WEATHER: Record<WeatherTag, Weather> = {
  rain: makeWeather(63, 52, 49, 9, 18),
  snow: makeWeather(73, 29, 22, 8, 15),
  wind: makeWeather(2, 48, 41, 22, 38),
  heat: makeWeather(0, 92, 98, 4, 9),
  cold: makeWeather(0, 18, 7, 10, 20),
  fog: makeWeather(45, 50, 50, 3, 6),
};
