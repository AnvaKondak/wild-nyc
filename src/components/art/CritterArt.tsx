// PLACEHOLDER ART. Simple riso-style characters drawn in code, so the app shows
// something animal-shaped until real illustrations exist. Each species picks a body
// type and its colors in species.json ("art"). Drawn on a 100×100 grid, facing right.

import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { inks, type Ink } from './inks';

export type ArtBody =
  | 'songbird' | 'pigeon' | 'crow' | 'raptor' | 'woodpecker' | 'swift' | 'gull' | 'tern'
  | 'duck' | 'goose' | 'swan' | 'heron' | 'night-heron' | 'cormorant'
  | 'squirrel' | 'raccoon' | 'opossum' | 'groundhog' | 'turtle'
  | 'bee' | 'butterfly' | 'moth' | 'firefly' | 'dragonfly' | 'bug' | 'spider';

export type ArtFeature =
  | 'crest' | 'mask' | 'eyestripe' | 'cap' | 'bib' | 'spots' | 'stripes' | 'wingbars'
  | 'mustache' | 'collar' | 'patch' | 'epaulet' | 'forked' | 'redeye' | 'spread';

export type ArtSpec = {
  body: ArtBody;
  /** Main body color. */
  main: Ink;
  /** Wings / back / second color. */
  second?: Ink;
  /** Beak, feet, small details. */
  accent?: Ink;
  /** Belly / chest. */
  belly?: Ink;
  features?: ArtFeature[];
};

const INK = inks.ink;
const S = 2.6; // outline width

type P = { c: Required<Pick<ArtSpec, 'main' | 'second' | 'accent' | 'belly'>>; f: Set<ArtFeature> };
const ink = (name: Ink) => inks[name];

function Eye({ x, y, r = 3.2, red = false, ring = false }: { x: number; y: number; r?: number; red?: boolean; ring?: boolean }) {
  return (
    <G>
      {ring && <Circle cx={x} cy={y} r={r + 1.6} fill={inks.lightGray} />}
      <Circle cx={x} cy={y} r={r} fill={red ? inks.red : INK} />
      <Circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill={inks.white} />
    </G>
  );
}

/** A soft off-register print of the main shape, behind it. */
function Misprint({ children }: { children: ReactNode }) {
  return <G transform="translate(3 3)" opacity={0.35}>{children}</G>;
}

// ---------- birds ----------

function Songbird({ c, f }: P, big = false) {
  const body = 'M30 60 Q30 42 50 42 Q66 42 70 56 Q72 74 52 78 Q34 79 30 60 Z';
  return (
    <G>
      <Misprint><Path d={body} fill={ink(c.second)} /></Misprint>
      <Path d={f.has('forked') ? 'M33 62 L8 54 L16 63 L8 72 Z' : 'M33 62 L10 56 L13 71 Z'} fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d={body} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M44 62 Q56 60 64 66 Q60 77 50 77 Q42 75 44 62 Z" fill={ink(c.belly)} />
      {f.has('spots') && [[50, 68], [56, 72], [58, 65], [48, 73], [40, 56], [52, 50]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={1.6} fill={c.belly === 'ink' ? inks.white : INK} />)}
      <Path d="M34 58 Q46 50 58 58 Q50 70 37 67 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {f.has('wingbars') && <Path d="M40 60 L52 58 M42 64 L53 62" stroke={inks.white} strokeWidth={2} strokeLinecap="round" />}
      {f.has('epaulet') && <Path d="M38 57 Q44 53 50 56 Q45 60 40 60 Z" fill={inks.red} stroke={inks.yellow} strokeWidth={1.5} />}
      {f.has('crest') && <Path d="M58 34 L62 18 L70 31 Z" fill={ink(c.main)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />}
      <Circle cx={66} cy={40} r={big ? 15 : 13} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      {f.has('cap') && <Path d="M54 36 Q60 26 72 28 Q78 31 79 37 Q66 33 54 36 Z" fill={ink(c.second)} />}
      {f.has('mask') && <Path d="M62 36 Q72 33 80 40 Q74 46 64 44 Z" fill={INK} />}
      {f.has('eyestripe') && <Path d="M58 34 Q68 30 78 34" stroke={inks.yellowTint} strokeWidth={2.6} strokeLinecap="round" fill="none" />}
      {f.has('bib') && <Path d="M74 46 Q72 55 64 54 Q68 50 70 46 Z" fill={INK} />}
      <Path d={big ? 'M79 36 L95 41 L79 47 Z' : 'M78 38 L89 41 L78 45 Z'} fill={ink(c.accent)} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Eye x={70} y={38} ring={c.main === 'ink'} />
      <Path d="M46 78 L44 88 M56 78 L58 88" stroke={INK} strokeWidth={S} strokeLinecap="round" />
    </G>
  );
}

function Pigeon({ c, f }: P) {
  const body = 'M24 62 Q26 44 50 44 Q68 44 72 58 Q74 76 50 78 Q28 78 24 62 Z';
  return (
    <G>
      <Misprint><Path d={body} fill={ink(c.second)} /></Misprint>
      <Path d="M28 62 L8 60 L12 72 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d={body} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M30 56 Q46 48 60 58 Q50 72 32 68 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {f.has('wingbars') && <Path d="M36 59 L50 57 M38 64 L52 62" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />}
      {f.has('spots') && [[40, 60], [47, 63], [43, 66]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={1.8} fill={INK} />)}
      <Circle cx={68} cy={42} r={11} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      {f.has('patch') && <Path d="M60 48 Q68 56 74 50 Q70 58 62 56 Z" fill={inks.teal} />}
      <Path d="M77 41 L86 43 L77 46 Z" fill={ink(c.accent)} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Eye x={71} y={40} r={2.8} red={f.has('redeye')} />
      <Path d="M44 78 L43 87 M54 78 L56 87" stroke={inks.pink} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

function Raptor({ c, f }: P) {
  const body = 'M34 52 Q34 40 50 40 Q66 40 66 54 L64 76 Q50 84 36 76 Z';
  return (
    <G>
      <Misprint><Path d={body} fill={ink(c.second)} /></Misprint>
      <Path d="M42 76 L46 92 L54 92 L58 76 Z" fill={ink(c.accent)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d={body} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M42 54 Q50 50 58 54 L57 72 Q50 77 43 72 Z" fill={ink(c.belly)} />
      {f.has('stripes') && <Path d="M44 60 L56 60 M44 66 L56 66" stroke={ink(c.second)} strokeWidth={2.2} strokeLinecap="round" />}
      <Path d="M34 50 Q26 64 34 78 Q40 66 40 52 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M66 50 Q74 64 66 78 Q60 66 60 52 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Circle cx={50} cy={32} r={14} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      {f.has('cap') && <Path d="M37 28 Q50 14 63 28 Q50 24 37 28 Z" fill={ink(c.second)} />}
      {f.has('mustache') && <Path d="M47 36 L45 46 M53 36 L55 46" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
      <Path d="M50 36 Q58 36 56 44 L50 41 Z" fill={inks.yellow} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Eye x={44} y={30} r={3} />
      <Eye x={56} y={30} r={3} />
      <Path d="M44 80 L42 86 M56 80 L58 86" stroke={inks.yellow} strokeWidth={3.4} strokeLinecap="round" />
    </G>
  );
}

function Woodpecker({ c, f }: P) {
  return (
    <G>
      <Path d="M44 70 L40 90 L48 86 Z" fill={INK} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Ellipse cx={50} cy={56} rx={14} ry={22} fill={ink(c.second)} stroke={INK} strokeWidth={S} />
      {f.has('stripes') && <Path d="M40 48 L58 48 M39 55 L59 55 M40 62 L58 62 M42 69 L56 69" stroke={inks.white} strokeWidth={2.4} strokeLinecap="round" />}
      <Path d="M56 40 Q64 56 58 76 Q66 60 64 44 Z" fill={ink(c.belly)} stroke={INK} strokeWidth={2} />
      <Circle cx={56} cy={32} r={12} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M46 26 Q54 16 64 24 Q56 24 46 26 Z" fill={inks.red} stroke={INK} strokeWidth={1.6} />
      <Path d="M66 31 L84 31 L66 36 Z" fill={INK} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <Eye x={60} y={30} r={2.6} />
      <Path d="M60 56 L66 54 M60 64 L66 64" stroke={INK} strokeWidth={S} strokeLinecap="round" />
    </G>
  );
}

function Swift({ c }: P) {
  return (
    <G>
      <Path d="M50 48 Q30 26 6 30 Q28 40 46 54 Z" fill={ink(c.main)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M50 48 Q70 26 94 30 Q72 40 54 54 Z" fill={ink(c.main)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Ellipse cx={50} cy={54} rx={8} ry={16} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Eye x={47} y={44} r={2.2} />
      <Eye x={53} y={44} r={2.2} />
    </G>
  );
}

function Gull({ c, f }: P, tern = false) {
  const body = 'M22 58 Q28 44 52 46 Q70 48 72 60 Q66 74 44 74 Q26 72 22 58 Z';
  return (
    <G>
      <Misprint><Path d={body} fill={ink(c.second)} /></Misprint>
      <Path d={tern ? 'M26 58 L4 50 L12 60 L4 68 Z' : 'M26 58 L10 54 L12 66 Z'} fill={inks.white} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d={body} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M28 54 Q46 46 64 54 Q52 64 30 62 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M24 56 L34 55 L30 61 Z" fill={INK} />
      <Circle cx={68} cy={42} r={12} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      {(tern || f.has('cap')) && <Path d="M56 40 Q60 28 72 30 Q80 33 80 40 Q68 36 56 40 Z" fill={INK} />}
      <Path d="M78 42 L94 44 L78 48 Z" fill={ink(c.accent)} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {f.has('spots') && <Circle cx={88} cy={45} r={1.6} fill={inks.red} />}
      {f.has('collar') && <Path d="M80 43 L84 43 L84 47 L80 47 Z" fill={INK} />}
      <Eye x={71} y={40} r={2.6} />
      <Path d="M42 74 L40 84 M50 74 L52 84" stroke={tern ? inks.red : inks.pink} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

function Duck({ c, f }: P) {
  const body = 'M16 62 Q20 78 48 78 Q76 78 80 60 Q66 54 48 56 Q28 56 16 62 Z';
  return (
    <G>
      <Misprint><Path d={body} fill={ink(c.second)} /></Misprint>
      <Path d="M18 62 L8 52 L22 58 Z" fill={INK} stroke={INK} strokeWidth={2} />
      <Path d={body} fill={ink(c.belly)} stroke={INK} strokeWidth={S} />
      <Path d="M24 62 Q44 52 66 60 Q56 72 30 70 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {f.has('patch') && <Path d="M36 64 L48 63 L46 67 L36 67 Z" fill={inks.blue} />}
      <Path d="M62 58 Q60 46 66 40" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <Path d="M62 58 Q60 46 66 40" stroke={ink(c.main)} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={70} cy={38} r={12} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      {f.has('patch') && c.main === 'ink' && <Path d="M62 32 Q70 28 76 36 Q68 40 62 32 Z" fill={inks.white} />}
      {f.has('collar') && <Path d="M58 52 Q64 55 70 52" stroke={inks.white} strokeWidth={3} strokeLinecap="round" fill="none" />}
      <Path d="M80 38 Q90 38 92 42 Q88 46 80 44 Z" fill={ink(c.accent)} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Eye x={73} y={35} r={2.6} />
    </G>
  );
}

function Goose({ c, f }: P, swan = false) {
  const body = 'M14 66 Q18 80 46 80 Q72 80 76 64 Q64 58 46 60 Q26 60 14 66 Z';
  return (
    <G>
      <Misprint><Path d={body} fill={ink(c.second)} /></Misprint>
      <Path d={body} fill={ink(c.belly)} stroke={INK} strokeWidth={S} />
      <Path d="M22 66 Q40 56 62 64 Q52 76 28 74 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d={swan ? 'M64 64 Q76 50 64 38 Q56 28 66 20' : 'M64 64 Q70 46 68 28'} stroke={INK} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Path d={swan ? 'M64 64 Q76 50 64 38 Q56 28 66 20' : 'M64 64 Q70 46 68 28'} stroke={ink(c.main)} strokeWidth={7.5} strokeLinecap="round" fill="none" />
      <Ellipse cx={swan ? 70 : 72} cy={swan ? 18 : 24} rx={10} ry={8} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      {f.has('collar') && <Path d="M65 22 Q70 30 77 26 Q72 32 66 28 Z" fill={inks.white} stroke={INK} strokeWidth={1.2} />}
      {f.has('bib') && <Path d="M63 46 Q68 48 72 46" stroke={inks.white} strokeWidth={3} strokeLinecap="round" fill="none" />}
      <Path d={swan ? 'M79 16 L90 20 L79 23 Z' : 'M81 22 L91 25 L81 28 Z'} fill={ink(c.accent)} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Eye x={swan ? 72 : 75} y={swan ? 16 : 22} r={2.4} />
    </G>
  );
}

function Heron({ c, f }: P, night = false) {
  if (night) {
    return (
      <G>
        <Path d="M44 74 L42 92 M54 74 L56 92" stroke={inks.yellow} strokeWidth={3} strokeLinecap="round" />
        <Ellipse cx={48} cy={60} rx={22} ry={17} fill={ink(c.second)} stroke={INK} strokeWidth={S} />
        <Path d="M38 62 Q50 72 64 64 Q60 76 46 76 Q36 72 38 62 Z" fill={ink(c.belly)} />
        <Circle cx={64} cy={40} r={14} fill={ink(c.belly)} stroke={INK} strokeWidth={S} />
        <Path d="M50 36 Q56 24 70 26 Q78 30 78 38 Q64 32 50 36 Z" fill={INK} />
        <Path d="M76 40 L94 44 L76 47 Z" fill={INK} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
        <Eye x={68} y={38} r={3} red />
      </G>
    );
  }
  return (
    <G>
      <Path d="M42 64 L38 94 M50 64 L52 94" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M24 54 Q30 42 48 44 Q60 46 60 58 Q50 68 32 64 Z" fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M28 52 Q42 46 54 52 Q44 60 30 58 Z" fill={ink(c.second)} />
      <Path d="M56 48 Q66 36 58 26 Q54 18 62 12" stroke={INK} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M56 48 Q66 36 58 26 Q54 18 62 12" stroke={ink(c.belly)} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Ellipse cx={66} cy={12} rx={7} ry={6} fill={ink(c.belly)} stroke={INK} strokeWidth={S} />
      <Path d="M60 9 L74 7" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M72 11 L92 14 L72 16 Z" fill={inks.yellow} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <Eye x={68} y={11} r={1.8} />
    </G>
  );
}

function Cormorant({ c, f }: P) {
  const spread = f.has('spread');
  return (
    <G>
      {spread && <Path d="M40 46 Q22 36 10 48 Q24 52 40 60 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />}
      {spread && <Path d="M58 46 Q76 36 90 48 Q76 52 58 60 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />}
      <Path d="M40 50 Q38 40 50 40 Q60 40 60 52 L58 78 Q50 84 42 78 Z" fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M52 42 Q58 30 56 22" stroke={INK} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M52 42 Q58 30 56 22" stroke={ink(c.main)} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <Circle cx={58} cy={20} r={8} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M58 22 L64 24" stroke={inks.orange} strokeWidth={4} strokeLinecap="round" />
      <Path d="M64 19 L80 21 Q78 25 74 23 L64 23 Z" fill={inks.gray} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <Eye x={60} y={18} r={2} ring={c.main === 'ink'} />
      <Path d="M46 80 L44 88 M54 80 L56 88" stroke={INK} strokeWidth={S} strokeLinecap="round" />
    </G>
  );
}

// ---------- furry ----------

function Squirrel({ c }: P) {
  return (
    <G>
      <Misprint><Path d="M34 68 Q8 60 16 34 Q24 16 40 28 Q30 40 38 58 Z" fill={ink(c.second)} /></Misprint>
      <Path d="M34 68 Q8 60 16 34 Q24 16 40 28 Q30 40 38 58 Z" fill={ink(c.main)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Ellipse cx={50} cy={64} rx={16} ry={18} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Ellipse cx={55} cy={68} rx={8} ry={11} fill={ink(c.belly)} />
      <Circle cx={60} cy={42} r={13} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M52 32 L54 22 L60 30 Z" fill={ink(c.main)} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={70} cy={46} r={2.4} fill={INK} />
      <Circle cx={64} cy={48} r={2.6} fill={inks.pink} opacity={0.7} />
      <Eye x={63} y={40} r={3} />
      <Ellipse cx={66} cy={60} rx={6} ry={5} fill={inks.tan} stroke={INK} strokeWidth={2} />
      <Path d="M60 58 Q64 60 68 58" stroke={INK} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d="M44 82 L42 88 M56 82 L58 88" stroke={INK} strokeWidth={S} strokeLinecap="round" />
    </G>
  );
}

function Raccoon({ c }: P) {
  return (
    <G>
      <Path d="M30 70 Q12 72 8 60" stroke={INK} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Path d="M30 70 Q12 72 8 60" stroke={ink(c.main)} strokeWidth={8} strokeLinecap="round" fill="none" />
      <Path d="M22 72 L22 66 M14 68 L16 62" stroke={INK} strokeWidth={3} />
      <Ellipse cx={46} cy={66} rx={22} ry={16} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M54 30 L52 20 L60 26 Z M74 30 L78 20 L70 26 Z" fill={ink(c.main)} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Ellipse cx={64} cy={42} rx={16} ry={14} fill={inks.white} stroke={INK} strokeWidth={S} />
      <Path d="M50 40 Q64 32 78 40 Q74 48 64 46 Q54 48 50 40 Z" fill={INK} />
      <Eye x={58} y={41} r={2.6} />
      <Eye x={70} y={41} r={2.6} />
      <Circle cx={64} cy={51} r={2.6} fill={INK} />
      <Path d="M36 80 L34 88 M56 80 L58 88" stroke={INK} strokeWidth={S} strokeLinecap="round" />
    </G>
  );
}

function Opossum({ c }: P) {
  return (
    <G>
      <Path d="M26 68 Q10 72 8 60 Q8 52 16 54" stroke={inks.pink} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Ellipse cx={44} cy={64} rx={22} ry={16} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Circle cx={58} cy={36} r={6} fill={INK} />
      <Path d="M56 40 Q66 34 76 42 L92 50 Q78 56 64 54 Q54 50 56 40 Z" fill={inks.white} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Circle cx={92} cy={50} r={3} fill={inks.pink} stroke={INK} strokeWidth={1.4} />
      <Eye x={68} y={44} r={2.6} />
      <Path d="M34 78 L32 86 M54 78 L56 86" stroke={inks.pink} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

function Groundhog({ c }: P) {
  return (
    <G>
      <Misprint><Ellipse cx={50} cy={62} rx={22} ry={24} fill={ink(c.second)} /></Misprint>
      <Ellipse cx={50} cy={62} rx={22} ry={24} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Ellipse cx={50} cy={68} rx={12} ry={14} fill={ink(c.belly)} />
      <Circle cx={50} cy={36} r={15} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Circle cx={39} cy={25} r={4} fill={ink(c.main)} stroke={INK} strokeWidth={2} />
      <Circle cx={61} cy={25} r={4} fill={ink(c.main)} stroke={INK} strokeWidth={2} />
      <Ellipse cx={50} cy={42} rx={8} ry={6} fill={ink(c.belly)} />
      <Path d="M48 46 L48 50 L52 50 L52 46" fill={inks.white} stroke={INK} strokeWidth={1.4} />
      <Circle cx={50} cy={41} r={2.2} fill={INK} />
      <Eye x={44} y={34} r={2.6} />
      <Eye x={56} y={34} r={2.6} />
      <Path d="M40 60 Q44 64 46 60 M54 60 Q56 64 60 60" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    </G>
  );
}

function Turtle({ c }: P) {
  return (
    <G>
      <Path d="M26 70 L22 80 M66 70 L70 80" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <Path d="M26 70 L22 80 M66 70 L70 80" stroke={ink(c.second)} strokeWidth={3} strokeLinecap="round" />
      <Path d="M70 62 Q84 56 88 62 Q86 70 74 70 Z" fill={ink(c.second)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M76 64 L84 62" stroke={inks.red} strokeWidth={3} strokeLinecap="round" />
      <Eye x={82} y={60} r={2} />
      <Path d="M18 70 Q20 40 48 38 Q76 40 78 70 Z" fill={ink(c.main)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M32 56 L40 48 L56 48 L64 56 L56 64 L40 64 Z" fill="none" stroke={ink(c.accent)} strokeWidth={2.2} />
      <Path d="M18 70 L78 70" stroke={inks.yellow} strokeWidth={4} />
    </G>
  );
}

// ---------- bugs ----------

function Bee({ c, f }: P) {
  return (
    <G>
      <Ellipse cx={38} cy={34} rx={14} ry={9} fill={inks.white} stroke={INK} strokeWidth={2} opacity={0.9} transform="rotate(-25 38 34)" />
      <Ellipse cx={56} cy={32} rx={13} ry={8} fill={inks.white} stroke={INK} strokeWidth={2} opacity={0.9} transform="rotate(20 56 32)" />
      <Ellipse cx={46} cy={58} rx={24} ry={18} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      {f.has('stripes') && <Path d="M36 42 Q32 58 36 74 M48 40 Q44 58 48 76" stroke={ink(c.second)} strokeWidth={6} fill="none" />}
      <Circle cx={72} cy={54} r={12} fill={INK} stroke={INK} strokeWidth={S} />
      <Path d="M74 43 Q78 32 84 30 M70 43 Q70 32 74 28" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={76} cy={52} r={2.4} fill={inks.white} />
      <Path d="M22 58 L14 60" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

function Butterfly({ c }: P) {
  const wing = (d: string) => <Path d={d} fill={ink(c.main)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />;
  return (
    <G>
      {wing('M50 50 Q30 18 12 26 Q8 44 48 54 Z')}
      {wing('M50 50 Q70 18 88 26 Q92 44 52 54 Z')}
      {wing('M50 54 Q26 58 22 76 Q38 82 49 60 Z')}
      {wing('M50 54 Q74 58 78 76 Q62 82 51 60 Z')}
      <Path d="M48 52 L24 30 M48 54 L28 70 M52 52 L76 30 M52 54 L72 70" stroke={ink(c.second)} strokeWidth={2.4} />
      {[[16, 30], [84, 30], [26, 74], [74, 74]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={2} fill={inks.white} />)}
      <Ellipse cx={50} cy={55} rx={3.4} ry={14} fill={INK} />
      <Path d="M49 42 Q44 32 40 30 M51 42 Q56 32 60 30" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </G>
  );
}

function Moth({ c }: P) {
  return (
    <G>
      <Path d="M50 40 Q24 34 12 60 Q30 66 50 58 Z" fill={ink(c.main)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M50 40 Q76 34 88 60 Q70 66 50 58 Z" fill={ink(c.main)} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <Circle cx={30} cy={52} r={4} fill={ink(c.second)} />
      <Circle cx={70} cy={52} r={4} fill={ink(c.second)} />
      <Ellipse cx={50} cy={54} rx={6} ry={16} fill={ink(c.belly)} stroke={INK} strokeWidth={S} />
      <Path d="M48 40 Q40 26 32 24 M52 40 Q60 26 68 24" stroke={INK} strokeWidth={2} fill="none" />
      <Path d="M36 26 L38 30 M40 28 L42 32 M64 26 L62 30 M60 28 L58 32" stroke={INK} strokeWidth={1.6} />
      <Eye x={47} y={44} r={1.8} />
      <Eye x={53} y={44} r={1.8} />
    </G>
  );
}

function Firefly({ c }: P) {
  return (
    <G>
      <Circle cx={36} cy={66} r={22} fill={inks.yellow} opacity={0.35} />
      <Ellipse cx={52} cy={36} rx={10} ry={8} fill={inks.white} opacity={0.9} stroke={INK} strokeWidth={1.6} transform="rotate(-30 52 36)" />
      <Ellipse cx={48} cy={56} rx={20} ry={10} fill={ink(c.main)} stroke={INK} strokeWidth={S} transform="rotate(-20 48 56)" />
      <Ellipse cx={34} cy={63} rx={9} ry={7} fill={inks.yellow} stroke={INK} strokeWidth={2} />
      <Circle cx={68} cy={48} r={8} fill={inks.red} stroke={INK} strokeWidth={S} />
      <Path d="M72 42 Q78 32 84 32 M70 41 Q72 30 76 26" stroke={INK} strokeWidth={1.8} fill="none" />
      <Eye x={71} y={47} r={2} />
    </G>
  );
}

function Dragonfly({ c }: P) {
  return (
    <G>
      {['M48 46 Q30 30 8 34 Q26 46 48 50 Z', 'M52 46 Q70 30 92 34 Q74 46 52 50 Z', 'M48 52 Q30 62 12 58 Q28 50 48 50 Z', 'M52 52 Q70 62 88 58 Q72 50 52 50 Z'].map((d) => (
        <Path key={d} d={d} fill={inks.white} opacity={0.85} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      ))}
      <Path d="M50 54 L50 92" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <Path d="M50 54 L50 92" stroke={ink(c.main)} strokeWidth={5} strokeLinecap="round" />
      <Ellipse cx={50} cy={48} rx={6} ry={8} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Circle cx={45} cy={38} r={5} fill={ink(c.second)} stroke={INK} strokeWidth={2} />
      <Circle cx={55} cy={38} r={5} fill={ink(c.second)} stroke={INK} strokeWidth={2} />
      <Circle cx={46} cy={37} r={1.6} fill={inks.white} />
      <Circle cx={56} cy={37} r={1.6} fill={inks.white} />
    </G>
  );
}

function Bug({ c }: P) {
  return (
    <G>
      <Path d="M36 46 L22 38 M36 56 L20 58 M38 66 L24 76 M64 46 L78 38 M64 56 L80 58 M62 66 L76 76" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Ellipse cx={50} cy={58} rx={16} ry={24} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M36 48 L64 70 M64 48 L36 70" stroke={ink(c.second)} strokeWidth={6} />
      <Path d="M50 34 L50 82" stroke={INK} strokeWidth={1.6} />
      <Circle cx={50} cy={32} r={8} fill={ink(c.second)} stroke={INK} strokeWidth={S} />
      <Path d="M46 26 Q40 16 34 14 M54 26 Q60 16 66 14" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Eye x={46} y={31} r={1.8} />
      <Eye x={54} y={31} r={1.8} />
    </G>
  );
}

function Spider({ c }: P) {
  const legs = [[-1, 30, 20], [-1, 22, 44], [-1, 24, 66], [-1, 32, 84], [1, 70, 20], [1, 78, 44], [1, 76, 66], [1, 68, 84]];
  return (
    <G>
      {legs.map(([side, x, y]) => (
        <Path key={`${x}${y}`} d={`M${50 + side * 6} 52 Q${50 + side * 20} ${(52 + y) / 2 - 8} ${x} ${y}`} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      ))}
      <Ellipse cx={50} cy={62} rx={14} ry={16} fill={ink(c.main)} stroke={INK} strokeWidth={S} />
      <Path d="M42 56 L58 56 M40 64 L60 64 M43 72 L57 72" stroke={ink(c.second)} strokeWidth={3.4} strokeLinecap="round" />
      <Circle cx={50} cy={42} r={8} fill={ink(c.belly)} stroke={INK} strokeWidth={S} />
      <Eye x={47} y={41} r={1.8} />
      <Eye x={53} y={41} r={1.8} />
    </G>
  );
}

const DRAW: Record<ArtBody, (p: P) => ReactNode> = {
  songbird: (p) => Songbird(p),
  crow: (p) => Songbird(p, true),
  pigeon: Pigeon,
  raptor: Raptor,
  woodpecker: Woodpecker,
  swift: Swift,
  gull: (p) => Gull(p),
  tern: (p) => Gull(p, true),
  duck: Duck,
  goose: (p) => Goose(p),
  swan: (p) => Goose(p, true),
  heron: (p) => Heron(p),
  'night-heron': (p) => Heron(p, true),
  cormorant: Cormorant,
  squirrel: Squirrel,
  raccoon: Raccoon,
  opossum: Opossum,
  groundhog: Groundhog,
  turtle: Turtle,
  bee: Bee,
  butterfly: Butterfly,
  moth: Moth,
  firefly: Firefly,
  dragonfly: Dragonfly,
  bug: Bug,
  spider: Spider,
};

/** The animal, as SVG elements on a 100×100 grid. Put it inside an <Svg viewBox="0 0 100 100">. */
export function CritterArt({ art }: { art: ArtSpec }) {
  const c = {
    main: art.main,
    second: art.second ?? art.main,
    accent: art.accent ?? 'yellow',
    belly: art.belly ?? art.main,
  };
  return <G>{DRAW[art.body]({ c, f: new Set(art.features ?? []) })}</G>;
}
