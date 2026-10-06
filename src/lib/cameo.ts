// Which drawn neighbor appears in the scene for a slide, and whether they fly across
// the sky or watch from the edge of the ground.

import type { ArtSpec } from '@/components/art/CritterArt';
import type { Species } from '@/content/types';

const GROUNDED = new Set(['pond-slider', 'large-milkweed-bug', 'orb-weavers', 'groundhog']);

export function cameoFor(s: Species | undefined): { art: ArtSpec; flies: boolean } | undefined {
  if (!s) return undefined;
  return { art: s.art, flies: (s.group === 'birds' || s.group === 'bugs') && !GROUNDED.has(s.id) };
}
