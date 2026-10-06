// The one notification a day (if you turn it on): good morning from your neighborhood,
// who today's neighbor is, and a fun fact about them. At most one a day, never about
// anything you missed or didn't do.

import { listNames } from './intro';
import { pickFact } from './localStory';
import { pickLead, type StoryContext, type StoryPlace } from './neighborStory';
import { seededRandom } from './random';
import { dateKey, seasonOf } from './time';

export const NOTE_HOUR = 8;
export const NOTE_MINUTE = 30;

export type DailyNote = { date: Date; title: string; body: string; speciesId: string };

/**
 * The next `days` morning notes for `places[index]`, starting today if it's not yet
 * 8:30. Each names the morning's lead (the same pick as the story, before weather is
 * known) and one of their fun facts.
 */
export function dailyNotes(
  places: StoryPlace[],
  index: number,
  base: Omit<StoryContext, 'season' | 'period' | 'weather'>,
  now: Date,
  days = 7,
): DailyNote[] {
  const place = places[index];
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate(), NOTE_HOUR, NOTE_MINUTE);
  if (first <= now) first.setDate(first.getDate() + 1);
  const notes: DailyNote[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + d, NOTE_HOUR, NOTE_MINUTE);
    const yesterday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    const season = seasonOf(date);
    const ctx: StoryContext = { ...base, season, period: 'dawn', weather: [] };
    const lead = pickLead(places, index, ctx, dateKey(date), dateKey(yesterday));
    if (!lead) continue;
    const fact = pickFact(base.facts, lead.id, season, 'dawn', seededRandom(`${place.cell}:${dateKey(date)}:note`)) ?? lead.funFact.body;
    notes.push({
      date,
      title: place.placeName ? `Good morning from ${place.placeName}` : 'Good morning, neighbor',
      body: `Today's neighbor: ${listNames([lead])}. ${fact}`,
      speciesId: lead.id,
    });
  }
  return notes;
}
