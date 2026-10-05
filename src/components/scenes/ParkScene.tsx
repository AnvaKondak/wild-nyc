import { Circle, G, Path, Rect } from 'react-native-svg';
import { inks } from '@/components/art/inks';
import { colors } from '@/theme/tokens';

// PLACEHOLDER ART. A park: big trees, shrubs, a lawn with a path, a pond with reeds,
// a bench, a flower bed, a log and a lamp. 358×440 grid; the top band is sky.
export function ParkDrawing() {
  return (
    <G>
      {/* Far tree line */}
      <Path d="M0 120 Q30 96 60 112 Q90 92 124 110 Q160 90 196 108 Q232 92 266 110 Q300 94 330 108 Q346 100 358 106 L358 140 L0 140 Z" fill={inks.green} opacity={0.35} />
      {/* Lawn */}
      <Rect x={0} y={136} width={358} height={304} fill={inks.green} opacity={0.3} />
      {/* Path */}
      <Path d="M0 430 Q120 330 200 300 Q280 270 358 250 L358 276 Q290 292 214 322 Q140 352 40 440 Z" fill={inks.tan} opacity={0.75} />
      {/* Big tree, left: pink off-register print under the blue canopy */}
      <Rect x={44} y={150} width={18} height={110} fill={colors.ink} />
      <Circle cx={60} cy={128} r={58} fill={colors.pink} fillOpacity={0.55} />
      <Circle cx={54} cy={124} r={58} fill={colors.blue} />
      {/* Smaller tree, right */}
      <Rect x={292} y={170} width={12} height={70} fill={colors.ink} />
      <Circle cx={302} cy={156} r={40} fill={colors.pink} fillOpacity={0.55} />
      <Circle cx={298} cy={152} r={40} fill={colors.blue} />
      {/* Shrubs */}
      <Path d="M136 236 Q146 210 166 222 Q182 204 200 220 Q220 208 232 236 Z" fill={inks.green} stroke={colors.ink} strokeWidth={1.5} />
      {/* Bench */}
      <Path d="M108 284h60M114 284v14M162 284v14M108 274h60" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
      {/* Flower bed */}
      <Rect x={20} y={318} width={84} height={16} rx={8} fill={inks.brown} opacity={0.6} />
      {[[30, 314], [46, 310], [62, 314], [78, 309], [94, 314]].map(([x, y], i) => (
        <G key={x}>
          <Circle cx={x} cy={y} r={7} fill={i % 2 ? colors.yellow : colors.pink} />
          <Circle cx={x} cy={y} r={2.4} fill={i % 2 ? colors.pink : colors.yellow} />
        </G>
      ))}
      {/* Pond and reeds */}
      <Path d="M196 392 Q190 344 262 340 Q352 338 350 386 Q346 428 268 428 Q200 426 196 392 Z" fill={colors.blue} opacity={0.55} stroke={colors.ink} strokeWidth={1.5} />
      <Path d="M228 380 Q240 374 252 380 M290 398 Q302 392 314 398" stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      {[192, 202, 212].map((x) => (
        <G key={x}>
          <Path d={`M${x} 396 L${x + 2} 344`} stroke={inks.green} strokeWidth={3} />
          <Rect x={x - 2} y={340} width={7} height={16} rx={3.5} fill={inks.brown} />
        </G>
      ))}
      {/* Log */}
      <Rect x={20} y={396} width={70} height={18} rx={9} fill={inks.brown} stroke={colors.ink} strokeWidth={1.5} />
      <Circle cx={84} cy={405} r={6} fill={inks.tan} stroke={colors.ink} strokeWidth={1.2} />
      {/* Lamp */}
      <Path d="M336 330 L336 236 M336 236 h-10" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={324} cy={238} r={5} fill={colors.yellow} stroke={colors.ink} strokeWidth={1.5} />
    </G>
  );
}
