import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { BlockSpot, Species } from '@/content/types';
import { colors } from '@/theme/tokens';

// The riso neighborhood scene from mocks/4-neighbors.html, on a 358×560 grid.
export const SCENE_SIZE = { width: 358, height: 560 } as const;

/** Sticker slots (top-left of a 46px sticker) for each spot, filled in order. */
const SLOTS: Record<BlockSpot, { x: number; y: number }[]> = {
  sky: [{ x: 140, y: 34 }, { x: 212, y: 62 }],
  rooftop: [{ x: 50, y: 64 }, { x: 98, y: 60 }],
  ledge: [{ x: 44, y: 154 }, { x: 90, y: 236 }],
  wire: [{ x: 196, y: 166 }, { x: 266, y: 148 }],
  lamp: [{ x: 300, y: 92 }],
  tree: [{ x: 248, y: 230 }, { x: 196, y: 238 }],
  flowerbox: [{ x: 98, y: 376 }],
  trashcan: [{ x: 14, y: 380 }],
  hedge: [{ x: 170, y: 392 }, { x: 222, y: 388 }, { x: 274, y: 392 }],
  fence: [{ x: 236, y: 456 }],
  sidewalk: [{ x: 290, y: 456 }, { x: 130, y: 460 }],
};

const TILTS = [-6, 4, -3, 6, -5, 3, -4];

export type ScenePlacement = { species: Species; x: number; y: number; tilt: number };

/** Puts every species in its natural spot, in list order. Extras past the slots are left out. */
export function placeSpecies(all: Species[]): ScenePlacement[] {
  const used: Partial<Record<BlockSpot, number>> = {};
  const out: ScenePlacement[] = [];
  all.forEach((species, i) => {
    const spot = species.spots.block;
    if (!spot) return;
    const n = used[spot] ?? 0;
    const slot = SLOTS[spot][n];
    if (!slot) return;
    used[spot] = n + 1;
    out.push({ species, ...slot, tilt: TILTS[i % TILTS.length] });
  });
  return out;
}

export function NeighborhoodScene({ width }: { width: number }) {
  const height = (width * SCENE_SIZE.height) / SCENE_SIZE.width;
  return (
    <Svg width={width} height={height} viewBox="0 0 358 560" fill="none">
      <Rect width={358} height={560} fill={colors.pinkTint} />
      {/* Sun, a little off-register */}
      <Circle cx={296} cy={74} r={34} fill={colors.pink} fillOpacity={0.5} />
      <Circle cx={290} cy={70} r={34} fill={colors.yellow} />
      {/* Skyline */}
      <G fill={colors.blueTint}>
        <Rect x={150} y={150} width={40} height={120} /><Rect x={196} y={120} width={34} height={150} />
        <Rect x={236} y={170} width={46} height={100} /><Rect x={288} y={140} width={30} height={130} />
        <Rect x={322} y={180} width={36} height={90} />
      </G>
      {/* Building with ledges */}
      <Rect x={0} y={120} width={150} height={330} fill={colors.paper} stroke={colors.ink} strokeWidth={1.5} />
      <G fill={colors.blue} fillOpacity={0.85}>
        <Rect x={16} y={140} width={22} height={30} /><Rect x={62} y={140} width={22} height={30} /><Rect x={108} y={140} width={22} height={30} />
        <Rect x={16} y={222} width={22} height={30} /><Rect x={62} y={222} width={22} height={30} /><Rect x={108} y={222} width={22} height={30} />
        <Rect x={16} y={304} width={22} height={30} /><Rect x={62} y={304} width={22} height={30} /><Rect x={108} y={304} width={22} height={30} />
      </G>
      <Rect x={0} y={198} width={158} height={7} fill={colors.ink} />
      <Rect x={0} y={280} width={158} height={7} fill={colors.ink} />
      <Rect x={0} y={116} width={154} height={6} fill={colors.ink} />
      {/* Wire and pole */}
      <Path d="M150 172 Q240 210 330 152" stroke={colors.ink} strokeWidth={1.5} />
      <Path d="M330 120 V450" stroke={colors.ink} strokeWidth={5} strokeLinecap="round" />
      <Path d="M318 140 H342" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
      {/* Tree */}
      <Rect x={231} y={300} width={16} height={130} fill={colors.ink} />
      <Circle cx={246} cy={276} r={72} fill={colors.pink} fillOpacity={0.55} />
      <Circle cx={240} cy={270} r={72} fill={colors.blue} />
      {/* Sidewalk, hedge, flower box, trash can */}
      <Rect x={0} y={450} width={358} height={52} fill="#F1EBDD" />
      <Rect x={156} y={400} width={164} height={44} rx={22} fill={colors.pink} fillOpacity={0.55} />
      <Rect x={152} y={396} width={164} height={44} rx={22} fill={colors.blue} />
      <Rect x={84} y={436} width={62} height={18} fill={colors.paper} stroke={colors.ink} strokeWidth={1.5} />
      <G fill={colors.pink}>
        <Circle cx={94} cy={430} r={6} /><Circle cx={108} cy={426} r={7} /><Circle cx={122} cy={430} r={6} /><Circle cx={136} cy={427} r={6} />
      </G>
      <G fill={colors.yellow}>
        <Circle cx={94} cy={430} r={2} /><Circle cx={108} cy={426} r={2.4} /><Circle cx={122} cy={430} r={2} /><Circle cx={136} cy={427} r={2} />
      </G>
      <Rect x={18} y={430} width={40} height={44} rx={4} fill="#C9C6D6" stroke={colors.ink} strokeWidth={1.5} />
      <Rect x={14} y={424} width={48} height={8} rx={3} fill={colors.ink} />
      {/* Street */}
      <Rect x={0} y={502} width={358} height={58} fill="#E6E2D8" />
      <Path d="M14 532h36M74 532h36M134 532h36M194 532h36M254 532h36M314 532h36" stroke={colors.yellow} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}
