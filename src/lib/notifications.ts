// Scheduling the daily note on the phone. Local notifications only: no server, no
// token, nothing leaves the phone. Rescheduled whenever the app opens, so the week
// ahead always matches the current neighborhood.

import * as Notifications from 'expo-notifications';
import type { DailyNote } from './dailyNote';

/** Ask iOS once. Returns whether we may send the daily note. */
export async function askForNotes(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: false, allowBadge: false } });
  return asked.granted;
}

export async function scheduleNotes(notes: DailyNote[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const note of notes) {
    await Notifications.scheduleNotificationAsync({
      content: { title: note.title, body: note.body, data: { speciesId: note.speciesId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: note.date },
    });
  }
}

export async function cancelNotes(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
