// The three scenes (block, park, waterfront) and where stickers go on each.
//
// A scene is a 358-wide drawing with a sky band on top. The sky holds the
// neighborhood's landmark (Places). Each spot has one or more sticker slots: Places
// uses the first slot of each spot (one "regular" per spot); Neighbors fills them all.

import type { ReactNode } from 'react';
import Svg, { Rect } from 'react-native-svg';
import type { PlaceKind, SceneSpot, Species } from '@/content/types';
import { colors } from '@/theme/tokens';
import { BlockDrawing } from './BlockScene';
import { Landmark } from './Landmark';
import { ParkDrawing } from './ParkScene';
import { WaterfrontDrawing } from './WaterfrontScene';

type Slot = { x: number; y: number };

type SceneDef = {
  height: number;
  /** Where the landmark stands (bottom of the sky band). */
  horizon: number;
  Drawing: () => ReactNode;
  /** Top-left corners for a 48-unit sticker, per spot. */
  slots: Partial<Record<SceneSpot, Slot[]>>;
};

export const SCENE_WIDTH = 358;

export const SCENES: Record<PlaceKind, SceneDef> = {
  block: {
    height: 470,
    horizon: 92,
    Drawing: BlockDrawing,
    slots: {
      sky: [{ x: 150, y: 34 }, { x: 210, y: 40 }],
      rooftop: [{ x: 26, y: 46 }, { x: 196, y: 56 }],
      ledge: [{ x: 286, y: 114 }, { x: 20, y: 126 }],
      lamp: [{ x: 112, y: 182 }],
      tree: [{ x: 34, y: 220 }, { x: 276, y: 226 }],
      sidewalk: [{ x: 262, y: 230 }, { x: 200, y: 236 }],
      hedge: [{ x: 182, y: 356 }, { x: 228, y: 356 }, { x: 140, y: 360 }],
      trashcan: [{ x: 34, y: 370 }],
      fence: [{ x: 300, y: 376 }],
      flowerbox: [{ x: 100, y: 376 }],
      wire: [{ x: 120, y: 90 }, { x: 240, y: 100 }],
    },
  },
  park: {
    height: 440,
    horizon: 120,
    Drawing: ParkDrawing,
    slots: {
      sky: [{ x: 150, y: 14 }, { x: 220, y: 34 }],
      treetop: [{ x: 30, y: 74 }, { x: 278, y: 112 }, { x: 80, y: 96 }],
      trunk: [{ x: 58, y: 178 }, { x: 304, y: 186 }],
      shrubs: [{ x: 160, y: 190 }, { x: 196, y: 196 }],
      lawn: [{ x: 120, y: 214 }, { x: 236, y: 224 }, { x: 100, y: 340 }, { x: 150, y: 250 }],
      path: [{ x: 220, y: 268 }, { x: 140, y: 318 }],
      bench: [{ x: 116, y: 236 }],
      flowers: [{ x: 36, y: 268 }, { x: 70, y: 264 }],
      pond: [{ x: 244, y: 364 }, { x: 296, y: 356 }],
      reeds: [{ x: 196, y: 318 }],
      log: [{ x: 30, y: 352 }],
      lamp: [{ x: 300, y: 214 }],
    },
  },
  waterfront: {
    height: 440,
    horizon: 150,
    Drawing: WaterfrontDrawing,
    slots: {
      sky: [{ x: 60, y: 30 }, { x: 150, y: 60 }],
      lamp: [{ x: 300, y: 116 }],
      railing: [{ x: 190, y: 186 }, { x: 240, y: 186 }],
      pier: [{ x: 290, y: 206 }],
      piling: [{ x: 46, y: 190 }, { x: 92, y: 202 }],
      water: [{ x: 140, y: 236 }, { x: 30, y: 278 }, { x: 150, y: 286 }],
      shore: [{ x: 180, y: 326 }, { x: 240, y: 334 }],
      rocks: [{ x: 50, y: 300 }],
      grass: [{ x: 90, y: 378 }, { x: 180, y: 384 }, { x: 270, y: 380 }],
    },
  },
};

export type Placement = { species: Species; x: number; y: number };

/** Places: the first species for each spot gets its first slot. Pass species best-first. */
export function placeRegulars(kind: PlaceKind, ranked: Species[]): Placement[] {
  const taken = new Set<SceneSpot>();
  const out: Placement[] = [];
  for (const species of ranked) {
    const spot = species.spots[kind];
    const slot = spot && SCENES[kind].slots[spot]?.[0];
    if (!spot || !slot || taken.has(spot)) continue;
    taken.add(spot);
    out.push({ species, ...slot });
  }
  return out;
}

/** Neighbors: every species whose home is this scene, filling slots in order. */
export function placeResidents(kind: PlaceKind, all: Species[]): Placement[] {
  const used: Partial<Record<SceneSpot, number>> = {};
  const out: Placement[] = [];
  for (const species of all) {
    if (species.homeScene !== kind) continue;
    const spot = species.spots[kind]!;
    const n = used[spot] ?? 0;
    const slot = SCENES[kind].slots[spot]?.[n];
    if (!slot) continue;
    used[spot] = n + 1;
    out.push({ species, ...slot });
  }
  return out;
}

/** A scene scaled to `width`, with an optional neighborhood landmark in the sky. */
export function SceneView({ kind, width, placeId, landmark = true }: { kind: PlaceKind; width: number; placeId?: string; landmark?: boolean }) {
  const scene = SCENES[kind];
  const height = (width * scene.height) / SCENE_WIDTH;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${SCENE_WIDTH} ${scene.height}`} fill="none">
      <Rect width={SCENE_WIDTH} height={scene.height} fill={colors.paper} />
      {landmark && <Landmark placeId={placeId} horizon={scene.horizon} />}
      <scene.Drawing />
    </Svg>
  );
}
