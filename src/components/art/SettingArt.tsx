// PLACEHOLDER ART. The little scene behind an animal on a story sticker: a branch,
// a streetlight, the water... Drawn on the same 100×100 grid as CritterArt, kept to
// the edges so the animal stays the focus.

import { Circle, G, Path, Rect } from 'react-native-svg';
import type { Setting } from '@/content/types';
import { inks } from './inks';

const INK = inks.ink;

export function SettingArt({ setting }: { setting: Setting }) {
  switch (setting) {
    case 'branch':
      return (
        <G>
          <Path d="M0 84 Q40 76 100 88" stroke={inks.brown} strokeWidth={8} strokeLinecap="round" fill="none" />
          <Path d="M70 82 Q78 70 88 70" stroke={inks.brown} strokeWidth={4} strokeLinecap="round" fill="none" />
          {[[86, 66], [16, 76], [94, 80]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={6} fill={inks.green} opacity={0.8} />)}
        </G>
      );
    case 'trunk':
      return (
        <G>
          <Rect x={62} y={0} width={30} height={100} fill={inks.brown} />
          <Path d="M70 10 L70 30 M80 40 L80 64 M72 72 L72 92" stroke={INK} strokeWidth={2} opacity={0.4} strokeLinecap="round" />
        </G>
      );
    case 'den':
      return (
        <G>
          <Rect x={0} y={0} width={100} height={100} fill={inks.brown} />
          <Path d="M14 100 Q14 30 50 26 Q86 30 86 100 Z" fill={INK} opacity={0.85} />
        </G>
      );
    case 'wire':
      return (
        <G>
          <Path d="M0 82 Q50 92 100 78" stroke={INK} strokeWidth={2.4} fill="none" />
          <Rect x={86} y={60} width={6} height={40} fill={inks.brown} />
        </G>
      );
    case 'ledge':
      return (
        <G>
          <Rect x={0} y={84} width={100} height={16} fill={inks.lightGray} stroke={INK} strokeWidth={2} />
          <Rect x={14} y={30} width={18} height={26} fill={inks.blue} opacity={0.5} />
          <Rect x={72} y={30} width={18} height={26} fill={inks.blue} opacity={0.5} />
        </G>
      );
    case 'rooftop':
      return (
        <G>
          <Rect x={0} y={86} width={100} height={14} fill={inks.gray} />
          <Rect x={76} y={56} width={14} height={32} fill={inks.red} opacity={0.8} stroke={INK} strokeWidth={2} />
          <Circle cx={20} cy={22} r={10} fill={inks.yellow} opacity={0.7} />
        </G>
      );
    case 'streetlight':
      return (
        <G>
          <Circle cx={22} cy={24} r={22} fill={inks.yellow} opacity={0.35} />
          <Path d="M8 100 L8 22 Q8 14 22 14" stroke={INK} strokeWidth={4} fill="none" />
          <Circle cx={22} cy={18} r={6} fill={inks.yellow} stroke={INK} strokeWidth={2} />
        </G>
      );
    case 'lawn':
      return (
        <G>
          <Rect x={0} y={82} width={100} height={18} fill={inks.green} opacity={0.75} />
          <Path d="M10 82 L12 74 M24 82 L22 75 M80 82 L82 73 M92 82 L90 76" stroke={inks.green} strokeWidth={2.4} strokeLinecap="round" />
        </G>
      );
    case 'sidewalk':
      return (
        <G>
          <Rect x={0} y={84} width={100} height={16} fill={inks.lightGray} />
          <Path d="M30 84 L30 100 M70 84 L70 100" stroke={INK} strokeWidth={1.6} opacity={0.5} />
        </G>
      );
    case 'hedge':
      return (
        <Path d="M0 100 L0 80 Q10 70 20 80 Q30 68 42 80 Q54 70 64 80 Q76 68 88 80 Q96 72 100 80 L100 100 Z" fill={inks.green} opacity={0.85} />
      );
    case 'flowers':
      return (
        <G>
          {[[12, 70], [26, 80], [80, 74], [92, 84]].map(([x, y]) => (
            <G key={`${x}${y}`}>
              <Path d={`M${x} ${y} L${x} 100`} stroke={inks.green} strokeWidth={2.4} />
              <Circle cx={x} cy={y} r={6} fill={inks.pink} />
              <Circle cx={x} cy={y} r={2.4} fill={inks.yellow} />
            </G>
          ))}
        </G>
      );
    case 'water':
      return (
        <G>
          <Rect x={0} y={74} width={100} height={26} fill={inks.blue} opacity={0.45} />
          <Path d="M4 82 Q12 78 20 82 Q28 86 36 82 M60 90 Q68 86 76 90 Q84 94 92 90" stroke={inks.white} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'shore':
      return (
        <G>
          <Rect x={0} y={84} width={100} height={16} fill={inks.tan} opacity={0.8} />
          <Path d="M0 78 Q25 74 50 80 Q75 86 100 78 L100 84 L0 84 Z" fill={inks.blue} opacity={0.45} />
        </G>
      );
    case 'pier':
      return (
        <G>
          <Rect x={0} y={80} width={100} height={8} fill={inks.brown} stroke={INK} strokeWidth={2} />
          <Rect x={12} y={88} width={8} height={12} fill={inks.brown} />
          <Rect x={80} y={88} width={8} height={12} fill={inks.brown} />
          <Rect x={0} y={92} width={100} height={8} fill={inks.blue} opacity={0.45} />
        </G>
      );
    case 'reeds':
      return (
        <G>
          {[10, 20, 82, 92].map((x) => (
            <G key={x}>
              <Path d={`M${x} 100 L${x + 2} 50`} stroke={inks.green} strokeWidth={2.4} />
              <Rect x={x - 1} y={50} width={6} height={14} rx={3} fill={inks.brown} />
            </G>
          ))}
        </G>
      );
    case 'fence':
      return (
        <G>
          {[6, 22, 78, 94].map((x) => <Rect key={x} x={x - 4} y={64} width={8} height={36} fill={inks.white} stroke={INK} strokeWidth={1.6} />)}
          <Rect x={0} y={74} width={100} height={4} fill={inks.white} stroke={INK} strokeWidth={1.2} />
        </G>
      );
    case 'trashcan':
      return (
        <G>
          <Rect x={70} y={62} width={26} height={38} rx={3} fill={inks.gray} stroke={INK} strokeWidth={2} />
          <Rect x={66} y={58} width={34} height={6} rx={2} fill={INK} />
        </G>
      );
    case 'web':
      return (
        <G opacity={0.55}>
          {[0, 45, 90, 135].map((a) => (
            <Path key={a} d="M50 0 L50 100" stroke={INK} strokeWidth={1} transform={`rotate(${a} 50 50)`} />
          ))}
          {[16, 28, 40].map((r) => <Circle key={r} cx={50} cy={50} r={r} stroke={INK} strokeWidth={1} fill="none" />)}
        </G>
      );
    case 'night-sky':
      return (
        <G>
          <Rect x={0} y={0} width={100} height={100} fill={INK} opacity={0.12} />
          <Path d="M84 14 A9 9 0 1 1 76 26 A7 7 0 0 0 84 14 Z" fill={inks.yellow} />
          {[[14, 16], [30, 8], [62, 12], [10, 40]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={1.6} fill={inks.yellow} />)}
        </G>
      );
    case 'sky':
    default:
      return (
        <G>
          <Path d="M8 22 Q8 14 16 14 Q20 6 30 10 Q38 8 38 16 Q44 18 40 24 Z" fill={inks.white} opacity={0.9} />
          <Path d="M66 84 Q66 78 72 78 Q76 72 84 76 Q92 76 90 84 Z" fill={inks.white} opacity={0.9} />
        </G>
      );
  }
}
