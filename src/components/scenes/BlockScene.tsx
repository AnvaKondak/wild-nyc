import { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '@/theme/tokens';

// The street from mocks/3-places.html, moved down 70 units to make room for the sky
// band (where the neighborhood's landmark goes). 358×470 grid.
export function BlockDrawing() {
  return (
    <G transform="translate(0 70)">
      <G stroke={colors.ink} strokeWidth={1.5}>
        <Rect x={8} y={22} width={82} height={150} fill={colors.pinkTint} />
        <Rect x={96} y={40} width={80} height={132} fill={colors.blueTint} />
        <Rect x={182} y={30} width={82} height={142} fill={colors.yellowTint} />
        <Rect x={270} y={18} width={80} height={154} fill={colors.pinkTint} />
      </G>
      <G fill={colors.blue} fillOpacity={0.85}>
        <Rect x={20} y={38} width={16} height={22} /><Rect x={56} y={38} width={16} height={22} />
        <Rect x={20} y={78} width={16} height={22} /><Rect x={56} y={78} width={16} height={22} />
        <Rect x={108} y={56} width={16} height={22} /><Rect x={146} y={56} width={16} height={22} />
        <Rect x={108} y={96} width={16} height={22} /><Rect x={146} y={96} width={16} height={22} />
        <Rect x={196} y={46} width={54} height={20} />
        <Rect x={282} y={34} width={16} height={22} /><Rect x={320} y={34} width={16} height={22} />
        <Rect x={282} y={74} width={16} height={22} /><Rect x={320} y={74} width={16} height={22} />
      </G>
      <Path d="M14 66h68M14 106h68M20 66l62 40" stroke={colors.ink} strokeWidth={1.2} />
      <Path d="M182 112h82v20h-82z" fill={colors.pink} stroke={colors.ink} strokeWidth={1.5} />
      <G fill={colors.white}>
        <Rect x={192} y={113} width={10} height={18} /><Rect x={212} y={113} width={10} height={18} />
        <Rect x={232} y={113} width={10} height={18} /><Rect x={252} y={113} width={10} height={18} />
      </G>
      <SvgText x={223} y={104} textAnchor="middle" fontFamily="InstrumentSans_600SemiBold" fontSize={11} fill={colors.ink}>
        BODEGA
      </SvgText>
      <Rect x={210} y={140} width={26} height={32} fill={colors.ink} />
      <Rect x={0} y={172} width={358} height={46} fill="#F1EBDD" />
      <Rect x={0} y={218} width={358} height={98} fill="#E6E2D8" />
      <Path d="M10 267h40M70 267h40M130 267h40M190 267h40M250 267h40M310 267h40" stroke={colors.yellow} strokeWidth={4} strokeLinecap="round" />
      <G fill={colors.white}>
        <Rect x={318} y={224} width={34} height={8} /><Rect x={318} y={240} width={34} height={8} />
        <Rect x={318} y={256} width={34} height={8} /><Rect x={318} y={272} width={34} height={8} />
        <Rect x={318} y={288} width={34} height={8} /><Rect x={318} y={304} width={34} height={8} />
      </G>
      <SvgText x={150} y={300} textAnchor="middle" fontFamily="InstrumentSans_600SemiBold" fontSize={11} letterSpacing={2} fill={colors.inkMuted}>
        YOUR STREET
      </SvgText>
      <Rect x={0} y={316} width={358} height={84} fill="#F1EBDD" />
      {/* Trees: a pink off-register print under each blue canopy. */}
      <Circle cx={63} cy={196} r={40} fill={colors.pink} fillOpacity={0.55} />
      <Circle cx={58} cy={192} r={40} fill={colors.blue} />
      <Circle cx={303} cy={198} r={26} fill={colors.pink} fillOpacity={0.55} />
      <Circle cx={299} cy={195} r={26} fill={colors.blue} />
      {/* Lamp post */}
      <Path d="M120 216V168M120 168h12" stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={134} cy={170} r={5} fill={colors.yellow} stroke={colors.ink} strokeWidth={1.5} />
      {/* Hedge */}
      <Rect x={154} y={330} width={112} height={28} rx={14} fill={colors.pink} fillOpacity={0.55} />
      <Rect x={150} y={327} width={112} height={28} rx={14} fill={colors.blue} />
      {/* Bench */}
      <Path d="M30 356h52M34 356v10M78 356v10M30 348h52" stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" />
    </G>
  );
}
