import { Image, View } from 'react-native';
import { getSpecies, speciesPhoto, type Period } from '@/content';
import { colors, offsetShadow } from '@/theme/tokens';
import { PeriodIcon } from './PeriodIcon';

type Props = { period: Period; speciesIds: string[]; size: number; tint: string; ink: string; shadowColor: string };

/** The intro's sticker: the time of day, with little photos of who's up tucked in front. */
export function GroupSticker({ period, speciesIds, size, tint, ink, shadowColor }: Props) {
  const border = 6;
  const inner = size - border * 2;
  const small = Math.round(inner * 0.4);
  // A loose triangle along the bottom of the circle.
  const spots = [
    { left: inner * 0.08, top: inner * 0.42, rotate: -8 },
    { left: inner * 0.52, top: inner * 0.42, rotate: 6 },
    { left: inner * 0.3, top: inner * 0.56, rotate: -3 },
  ];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: border,
        borderColor: colors.white,
        backgroundColor: tint,
        boxShadow: offsetShadow(shadowColor, 6),
        transform: [{ rotate: '-5deg' }],
        overflow: 'hidden',
      }}
    >
      <View style={{ position: 'absolute', top: inner * 0.08, left: 0, right: 0, alignItems: 'center' }}>
        <PeriodIcon period={period} color={ink} size={inner * 0.4} />
      </View>
      {speciesIds.slice(0, 3).map((id, i) => {
        const photo = speciesPhoto(id);
        if (!photo) return null;
        return (
          <View
            key={id}
            style={{
              position: 'absolute',
              ...spots[i],
              width: small,
              height: small,
              borderRadius: small / 2,
              borderWidth: 3,
              borderColor: colors.white,
              overflow: 'hidden',
              transform: [{ rotate: `${spots[i].rotate}deg` }],
            }}
          >
            <Image source={photo} accessibilityLabel={getSpecies(id)?.friendlyName} style={{ width: '100%', height: '100%' }} />
          </View>
        );
      })}
    </View>
  );
}
