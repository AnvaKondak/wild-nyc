import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { G } from 'react-native-svg';
import type { Setting } from '@/content/types';
import { colors, offsetShadow } from '@/theme/tokens';
import { CritterArt, type ArtSpec } from './art/CritterArt';
import { SettingArt } from './art/SettingArt';

type Props = {
  art: ArtSpec;
  size?: number;
  tint?: string;
  /** Degrees. Stickers sit slightly crooked, ±3–8°. */
  rotate?: number;
  shadowColor?: string;
  /** A backdrop behind the animal (story stickers). */
  setting?: Setting;
  /** A faint dashed outline, for neighbors who haven't moved in yet. */
  ghost?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Round animal "sticker": white border, slight tilt, offset ink shadow. */
export function Sticker({
  art,
  size = 120,
  tint = colors.pinkTint,
  rotate = -5,
  shadowColor = colors.ink,
  setting,
  ghost = false,
  style,
}: Props) {
  const borderWidth = size >= 150 ? 6 : size >= 80 ? 4 : 3;
  const shadowOffset = size >= 150 ? 6 : size >= 80 ? 4 : 2;
  const inner = size - borderWidth * 2;
  // With a setting the animal sits a little smaller so the scene shows around it.
  const scale = setting ? 0.7 : 0.82;
  const offset = (100 - 100 * scale) / 2;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        ghost
          ? {
              backgroundColor: 'rgba(250,247,242,0.88)',
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.inkMuted,
            }
          : {
              backgroundColor: tint,
              borderWidth,
              borderColor: colors.white,
              boxShadow: offsetShadow(shadowColor, shadowOffset),
              transform: [{ rotate: `${rotate}deg` }],
            },
        style,
      ]}
    >
      <Svg width={inner} height={inner} viewBox="0 0 100 100" opacity={ghost ? 0.35 : 1}>
        {setting && !ghost && <SettingArt setting={setting} />}
        <G transform={`translate(${offset} ${offset + (setting ? 4 : 0)}) scale(${scale})`}>
          <CritterArt art={art} />
        </G>
      </Svg>
    </View>
  );
}
