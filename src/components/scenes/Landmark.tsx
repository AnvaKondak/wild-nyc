// PLACEHOLDER ART. One flat silhouette per bundled neighborhood, drawn in the sky band
// of its scene so two places of the same kind still look like themselves.
// Each is designed standing on y = 100 and is shifted to the scene's horizon.

import type { ReactNode } from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';
import { inks } from '@/components/art/inks';
import { colors } from '@/theme/tokens';

const fill = colors.blueTint;
const line = { stroke: colors.ink, strokeWidth: 1.4, strokeLinejoin: 'round' as const };

const skyline = (xs: [number, number, number][]) =>
  xs.map(([x, w, h]) => <Rect key={`${x}-${h}`} x={x} y={100 - h} width={w} height={h} fill={fill} {...line} />);

const brownstones = (x0: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const x = x0 + i * 34;
    return (
      <G key={x}>
        <Rect x={x} y={52} width={32} height={48} fill={colors.pinkTint} {...line} />
        <Rect x={x - 2} y={48} width={36} height={6} fill={fill} {...line} />
        <Rect x={x + 6} y={62} width={7} height={10} fill={fill} />
        <Rect x={x + 19} y={62} width={7} height={10} fill={fill} />
      </G>
    );
  });

const waterTower = (x: number, y = 100) => (
  <G key={`wt${x}`}>
    <Path d={`M${x} ${y} L${x + 4} ${y - 18} M${x + 22} ${y} L${x + 18} ${y - 18}`} {...line} />
    <Rect x={x + 2} y={y - 40} width={18} height={22} rx={3} fill={colors.yellowTint} {...line} />
    <Path d={`M${x} ${y - 40} L${x + 11} ${y - 50} L${x + 22} ${y - 40} Z`} fill={fill} {...line} />
  </G>
);

const LANDMARKS: Record<string, () => ReactNode> = {
  'liberty-state-park': () => (
    <G>
      {/* The Statue of Liberty across the water */}
      <Rect x={250} y={78} width={30} height={22} fill={fill} {...line} />
      <Rect x={256} y={66} width={18} height={12} fill={fill} {...line} />
      <Path d="M260 66 L262 40 Q265 30 270 40 L272 66 Z" fill={inks.teal} {...line} />
      <Path d="M270 42 L278 20" {...line} strokeWidth={3} />
      <Circle cx={279} cy={17} r={4} fill={colors.yellow} {...line} />
      <Path d="M261 34 L265 26 L267 33 L270 26 L272 34" {...line} />
    </G>
  ),
  'exchange-place': () => <G>{skyline([[20, 26, 50], [50, 20, 70], [74, 30, 44], [110, 22, 60], [136, 28, 36], [172, 24, 56]])}<Path d="M210 100 L214 30 L222 30 L226 100 Z M218 30 L218 8" fill={fill} {...line} />{skyline([[240, 26, 48], [270, 20, 66], [296, 30, 40]])}</G>,
  'battery-park-city': () => <G>{skyline([[200, 24, 60], [228, 30, 76], [262, 22, 50], [288, 26, 64], [318, 30, 44]])}<Path d="M40 96 L120 96 L112 104 L48 104 Z" fill={colors.yellow} {...line} /><Rect x={70} y={84} width={30} height={12} fill={colors.white} {...line} /></G>,
  'brooklyn-bridge-park': () => (
    <G>
      {[90, 230].map((x) => (
        <G key={x}>
          <Rect x={x} y={34} width={30} height={66} fill={fill} {...line} />
          <Path d={`M${x + 6} 60 Q${x + 9} 46 ${x + 12} 60 Z M${x + 18} 60 Q${x + 21} 46 ${x + 24} 60 Z`} fill={colors.paper} {...line} />
        </G>
      ))}
      <Path d="M0 90 Q50 40 90 38 M120 38 Q175 80 230 38 M260 38 Q300 40 358 90" fill="none" {...line} />
    </G>
  ),
  'central-park': () => <G>{skyline([[40, 16, 64], [62, 14, 88], [86, 20, 54], [240, 14, 80], [260, 20, 60], [286, 12, 92], [304, 18, 50]])}</G>,
  'prospect-park': () => (
    <G>
      {/* Grand Army Plaza arch */}
      <Path d="M130 100 L130 44 L230 44 L230 100 L200 100 L200 76 Q180 52 160 76 L160 100 Z" fill={fill} {...line} />
      <Rect x={124} y={36} width={112} height={10} fill={fill} {...line} />
      <Path d="M170 36 L180 22 L190 36 Z" fill={colors.yellow} {...line} />
    </G>
  ),
  'park-slope': () => <G>{brownstones(40, 9)}</G>,
  'williamsburg': () => <G>{waterTower(60, 62)}{waterTower(260, 70)}<Path d="M120 100 L120 40 L150 40 L150 100 M200 100 L200 40 L230 40 L230 100 M120 56 L230 56 M120 72 L230 72" fill="none" {...line} /></G>,
  'bed-stuy': () => <G>{brownstones(10, 4)}{waterTower(170, 60)}{brownstones(214, 4)}</G>,
  'lower-east-side': () => <G>{skyline([[20, 60, 52], [90, 50, 40], [150, 60, 58], [220, 54, 46], [284, 60, 54]])}{waterTower(110, 60)}{waterTower(240, 54)}</G>,
  'harlem': () => <G>{brownstones(10, 4)}<Path d="M168 100 L168 52 L186 30 L204 52 L204 100 Z M186 30 L186 14" fill={fill} {...line} />{brownstones(218, 4)}</G>,
  'washington-heights': () => (
    <G>
      {/* George Washington Bridge tower */}
      <Path d="M150 100 L156 26 L204 26 L210 100 M162 26 L162 100 M198 26 L198 100 M156 50 L204 50 M154 74 L206 74" fill="none" {...line} strokeWidth={2} />
      <Path d="M0 96 Q80 40 156 28 M204 28 Q280 40 358 96" fill="none" {...line} />
    </G>
  ),
  'astoria': () => (
    <G>
      {/* Hell Gate Bridge arch */}
      <Rect x={40} y={50} width={28} height={50} fill={fill} {...line} />
      <Rect x={290} y={50} width={28} height={50} fill={fill} {...line} />
      <Path d="M68 70 Q179 6 290 70 M68 60 L290 60" fill="none" {...line} strokeWidth={2.4} />
    </G>
  ),
  'jackson-heights': () => (
    <G>
      {/* The 7 train on its elevated track */}
      <Rect x={0} y={70} width={358} height={8} fill={fill} {...line} />
      {[30, 110, 190, 270, 350].map((x) => <Rect key={x} x={x - 4} y={78} width={8} height={22} fill={fill} {...line} />)}
      <Rect x={90} y={50} width={150} height={20} rx={4} fill={colors.white} {...line} />
      <Circle cx={250} cy={60} r={9} fill={colors.pink} {...line} />
    </G>
  ),
  'mott-haven': () => (
    <G>
      {/* Rail lines and a swing bridge over the Harlem River */}
      <Path d="M0 90 L358 90 M0 96 L358 96" {...line} />
      <Path d="M120 90 L140 50 L220 50 L240 90 M140 50 L160 90 L180 50 L200 90 L220 50" fill="none" {...line} strokeWidth={2} />
      {skyline([[270, 30, 46], [304, 40, 60]])}
    </G>
  ),
  'st-george': () => (
    <G>
      {/* Staten Island Ferry */}
      <Path d="M90 92 L270 92 L254 106 L106 106 Z" fill={inks.orange} {...line} />
      <Rect x={120} y={74} width={120} height={18} fill={inks.orange} {...line} />
      <Rect x={160} y={62} width={40} height={12} fill={colors.white} {...line} />
    </G>
  ),
  'downtown-jc': () => (
    <G>
      {skyline([[180, 22, 50], [206, 18, 70], [228, 26, 40], [258, 20, 62], [282, 28, 46]])}
      {/* The Colgate clock */}
      <Circle cx={90} cy={64} r={30} fill={colors.white} {...line} strokeWidth={2} />
      <Path d="M90 64 L90 44 M90 64 L104 70" {...line} strokeWidth={2.4} />
      <Rect x={86} y={94} width={8} height={6} fill={colors.ink} />
    </G>
  ),
  'journal-square': () => <G>{skyline([[40, 30, 40], [80, 22, 80], [110, 26, 54]])}<Rect x={190} y={56} width={110} height={44} fill={colors.pinkTint} {...line} /><Rect x={200} y={44} width={90} height={14} fill={colors.yellow} {...line} /></G>,
  'the-heights': () => <G><Path d="M0 100 L0 60 Q60 50 120 62 Q180 40 240 58 Q300 46 358 56 L358 100 Z" fill={colors.pinkTint} {...line} />{waterTower(160, 60)}</G>,
  'lincoln-park-jc': () => (
    <G>
      {/* The fountain */}
      <Path d="M130 100 L150 84 L210 84 L230 100 Z" fill={fill} {...line} />
      <Rect x={174} y={60} width={12} height={24} fill={fill} {...line} />
      <Path d="M180 60 Q160 36 150 60 M180 60 Q200 36 210 60 M180 60 L180 36" fill="none" stroke={colors.blue} strokeWidth={2.4} strokeLinecap="round" />
    </G>
  ),
};

/** Water towers: for spots that aren't one of the bundled neighborhoods. */
const DEFAULT = () => <G>{waterTower(80, 70)}{waterTower(250, 64)}</G>;

export function Landmark({ placeId, horizon }: { placeId?: string; horizon: number }) {
  const draw = (placeId && LANDMARKS[placeId]) || DEFAULT;
  return <G transform={`translate(0 ${horizon - 100})`}>{draw()}</G>;
}

export const LANDMARK_IDS = Object.keys(LANDMARKS);
