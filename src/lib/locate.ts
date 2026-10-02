import * as Location from 'expo-location';
import { places } from '@/content';
import { neighborhoodFromPosition, type Neighborhood } from './neighborhood';

export type LocateResult =
  | { ok: true; neighborhood: Neighborhood }
  | { ok: false; reason: 'denied' | 'unavailable' };

/**
 * Asks for location once and turns it into a neighborhood cell on the phone.
 * The coordinates only live inside this function; they're never stored or sent.
 */
export async function locateNeighborhood(label = 'Home'): Promise<LocateResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { ok: false, reason: 'denied' };
    // Low accuracy is plenty for a ~1 km cell and avoids spinning up GPS.
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const neighborhood = neighborhoodFromPosition(position.coords.latitude, position.coords.longitude, places, label);
    return { ok: true, neighborhood };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
