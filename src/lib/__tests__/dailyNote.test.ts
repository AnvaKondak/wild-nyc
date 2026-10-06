import { facts, moments, placeKinds, places, seasonChapters, species } from '@/content';
import { dailyNotes } from '../dailyNote';

const lsp = places.find((p) => p.id === 'liberty-state-park')!;
const place = { cell: 'dr5r7', kind: lsp.kind, placeName: lsp.name, where: placeKinds[lsp.kind].where, local: lsp.local };
const base = { allSpecies: species, moments, facts, chapters: seasonChapters, live: new Map() };

describe('dailyNotes', () => {
  it('writes one morning note a day for the week, at 8:30', () => {
    const notes = dailyNotes([place], 0, base, new Date(2026, 9, 6, 7, 0));
    expect(notes).toHaveLength(7);
    expect(notes[0].date).toEqual(new Date(2026, 9, 6, 8, 30));
    expect(new Set(notes.map((n) => n.date.toDateString())).size).toBe(7);
  });

  it('starts tomorrow once the morning has passed', () => {
    expect(dailyNotes([place], 0, base, new Date(2026, 9, 6, 9, 0))[0].date).toEqual(new Date(2026, 9, 7, 8, 30));
  });

  it('says good morning from the place, names the neighbor, and shares a fact', () => {
    const [note] = dailyNotes([place], 0, base, new Date(2026, 9, 6, 7, 0));
    expect(note.title).toBe('Good morning from Liberty State Park');
    expect(note.body).toMatch(/^Today's neighbor: the [a-z' -]+\. \S/);
    expect(note.body).not.toMatch(/[{}]/);
  });

  it('never guilts: no streaks, no "missed", no numbers of days', () => {
    for (const n of dailyNotes([place], 0, base, new Date(2026, 9, 6, 7, 0))) expect(n.title + n.body).not.toMatch(/\b(streak|missed|don't forget|haven't)\b/i);
  });
});
