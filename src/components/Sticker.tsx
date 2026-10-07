import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { G } from 'react-native-svg';
import type { Setting } from '@/content/types';
import { colors, offsetShadow } from '@/theme/tokens';
import { CritterArt, type ArtSpec } from './art/CritterArt';
import { Character, hasCharacter } from './characters/Character';
import { SettingArt } from './art/SettingArt';

type Props = {
  art: ArtSpec;
  /** A bundled photo of the animal. Used instead of the drawn art when present. */
  photo?: number;
  size?: number;
  tint?: string;
  /** Degrees. Stickers sit slightly crooked, ±3–8°. */
  rotate?: number;
  shadowColor?: string;
  /** A drawn backdrop (story stickers). With a photo, the photo sits on it as a smaller sticker. */
  setting?: Setting;
  /** A faint dashed outline, for neighbors who haven't moved in yet. */
  ghost?: boolean;
  /** Whose sticker. When they've been drawn, the drawing is used instead of the photo. */
  speciesId?: string;
  /** Which of their drawings (moods), so each slide of a story shows a different one. */
  mood?: number;
  style?: StyleProp<ViewStyle>;
};

/** Round animal "sticker": white border, slight tilt, offset ink shadow. */
export function Sticker({
  art,
  photo,
  size = 120,
  tint = colors.pinkTint,
  rotate = -5,
  shadowColor = colors.ink,
  setting,
  ghost = false,
  speciesId,
  mood = 0,
  style,
}: Props) {
  const borderWidth = size >= 150 ? 6 : size >= 80 ? 4 : 3;
  const shadowOffset = size >= 150 ? 6 : size >= 80 ? 4 : 2;
  const inner = size - borderWidth * 2;

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
      {hasCharacter(speciesId) && !ghost ? (
        <Character speciesId={speciesId} size={inner} mood={mood} />
      ) : photo && setting && !ghost ? (
        <PhotoOnSetting photo={photo} setting={setting} inner={inner} />
      ) : photo ? (
        <Image
          key={photo} // a new photo gets a new view, so a slow earlier load can't win
          source={photo}
          accessibilityIgnoresInvertColors
          style={{ width: inner, height: inner, borderRadius: inner / 2, opacity: ghost ? 0.3 : 1 }}
        />
      ) : (
        <DrawnArt art={art} setting={ghost ? undefined : setting} inner={inner} ghost={ghost} />
      )}
    </View>
  );
}

/** Story sticker: the drawn setting fills the circle; the photo sits on it like a smaller sticker. */
function PhotoOnSetting({ photo, setting, inner }: { photo: number; setting: Setting; inner: number }) {
  const small = Math.round(inner * 0.62);
  const ring = Math.max(3, Math.round(small * 0.04));
  return (
    <View style={{ width: inner, height: inner, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={inner} height={inner} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <SettingArt setting={setting} />
      </Svg>
      <View
        style={{
          width: small,
          height: small,
          borderRadius: small / 2,
          borderWidth: ring,
          borderColor: colors.white,
          overflow: 'hidden',
          boxShadow: offsetShadow(colors.ink, 3),
          transform: [{ rotate: '4deg' }, { translateY: inner * 0.04 }],
        }}
      >
        <Image key={photo} source={photo} accessibilityIgnoresInvertColors style={{ width: '100%', height: '100%' }} />
      </View>
    </View>
  );
}

function DrawnArt({ art, setting, inner, ghost }: { art: ArtSpec; setting?: Setting; inner: number; ghost: boolean }) {
  // With a setting the animal sits a little smaller so the scene shows around it.
  const scale = setting ? 0.7 : 0.82;
  const offset = (100 - 100 * scale) / 2;
  return (
    <Svg width={inner} height={inner} viewBox="0 0 100 100" opacity={ghost ? 0.35 : 1}>
      {setting && <SettingArt setting={setting} />}
      <G transform={`translate(${offset} ${offset + (setting ? 4 : 0)}) scale(${scale})`}>
        <CritterArt art={art} />
      </G>
    </Svg>
  );
}
