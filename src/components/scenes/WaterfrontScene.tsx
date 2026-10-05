import { Circle, G, Path, Rect } from 'react-native-svg';
import { inks } from '@/components/art/inks';
import { colors } from '@/theme/tokens';

// PLACEHOLDER ART. A waterfront: open water, old pilings, a pier with a railing and a
// harbor lamp, a rocky shore and a strip of grass. 358×440 grid; the top band is sky.
export function WaterfrontDrawing() {
  return (
    <G>
      {/* Water */}
      <Rect x={0} y={150} width={358} height={190} fill={colors.blue} opacity={0.5} />
      <Path d="M20 190 Q34 184 48 190 M120 214 Q134 208 148 214 M40 262 Q54 256 68 262 M150 300 Q164 294 178 300 M250 176 Q264 170 278 176" stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      {/* Old pilings standing in the water */}
      {[[62, 236], [108, 248]].map(([x, top]) => (
        <G key={x}>
          <Rect x={x} y={top} width={14} height={340 - top} fill={inks.brown} stroke={colors.ink} strokeWidth={1.5} />
          <Rect x={x} y={top} width={14} height={5} fill={inks.tan} />
        </G>
      ))}
      {/* Pier: deck, railing, pilings under it */}
      {[196, 246, 296, 346].map((x) => <Rect key={x} x={x - 5} y={266} width={10} height={74} fill={inks.brown} />)}
      <Rect x={168} y={252} width={190} height={14} fill={inks.brown} stroke={colors.ink} strokeWidth={1.5} />
      <Path d="M168 232 L358 232" stroke={colors.ink} strokeWidth={3} />
      {[176, 216, 256, 296, 336].map((x) => <Path key={x} d={`M${x} 232 L${x} 252`} stroke={colors.ink} strokeWidth={2.4} />)}
      {/* Harbor lamp */}
      <Path d="M330 252 L330 168 Q330 160 320 160" stroke={colors.ink} strokeWidth={3} fill="none" />
      <Circle cx={318} cy={166} r={6} fill={colors.yellow} stroke={colors.ink} strokeWidth={1.5} />
      {/* Shore and rocks */}
      <Path d="M0 336 Q90 326 180 338 Q270 350 358 336 L358 392 L0 392 Z" fill={inks.tan} opacity={0.85} />
      {[[44, 344, 16], [74, 350, 12], [104, 342, 14], [26, 356, 10]].map(([x, y, r]) => (
        <Circle key={x} cx={x} cy={y} r={r} fill={inks.gray} stroke={colors.ink} strokeWidth={1.5} />
      ))}
      {/* Grass */}
      <Rect x={0} y={388} width={358} height={52} fill={inks.green} opacity={0.45} />
      {[30, 70, 130, 190, 250, 310].map((x) => (
        <Path key={x} d={`M${x} 390 L${x - 4} 376 M${x + 6} 390 L${x + 8} 374`} stroke={inks.green} strokeWidth={2.4} strokeLinecap="round" />
      ))}
    </G>
  );
}
