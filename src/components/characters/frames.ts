// The drawn neighbors' frames, rebuilt from the patches in xml.ts (each mood is stored
// as a small change to the species' hello drawing) the first time a species is shown.

import { characterXml, cutoutXml, type Drawings, type Patch } from './xml';

export type CharacterFrame = { mood: string; open: string; shut?: string };

/** The moods that take turns when the words don't pick one. The rest only show when called for. */
export const EVERYDAY_MOODS = 4;

const apply = (base: string, [keep, middle, tail]: Patch) => base.slice(0, keep) + middle + base.slice(base.length - tail);

// Each frame gets its own clip-path ids: on the phone, two drawings on screen with the
// same id (the open-eye and blink frames) can grab each other's shapes, so a blink would
// nudge a wing or tail patch. Suffixing keeps every frame self-contained.
const uniqueIds = (svg: string, tag: string) => svg.replace(/id="([^"]+)"/g, `id="$1-${tag}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-${tag})`);

const expand = ({ base, frames }: Drawings, prefix: string): CharacterFrame[] =>
  frames.map((f) => ({
    mood: f.mood,
    open: uniqueIds(apply(base, f.open), `${prefix}${f.mood}-o`),
    ...(f.shut ? { shut: uniqueIds(apply(base, f.shut), `${prefix}${f.mood}-s`) } : {}),
  }));

const stickers = new Map<string, CharacterFrame[]>();
const cutouts = new Map<string, CharacterFrame[]>();

/** Every mood's drawing for this species: the round sticker, or the close-up-scene cutout. */
export function framesFor(speciesId: string, cutout = false): CharacterFrame[] {
  const cache = cutout ? cutouts : stickers;
  let frames = cache.get(speciesId);
  if (!frames) {
    const drawings = cutout ? cutoutXml[speciesId] : characterXml[speciesId];
    frames = drawings ? expand(drawings, cutout ? 'c-' : '') : [];
    cache.set(speciesId, frames);
  }
  return frames;
}
