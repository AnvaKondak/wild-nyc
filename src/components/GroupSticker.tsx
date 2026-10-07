import { Image, View } from 'react-native';
import { getSpecies, speciesPhoto, type Period } from '@/content';
import { colors, offsetShadow } from '@/theme/tokens';
import { Character, hasCharacter } from './characters/Character';
import { PeriodIcon } from './PeriodIcon';

type Props = { period?: Period; speciesIds: string[]; size: number; tint: string; ink: string; shadowColor: string };

/**
 * A group sticker. With a `period`: the time of day, with little photos of who's up
 * tucked in front (the story intro). Without: two to four neighbors together (Chapters).
 */
export function GroupSticker({ period, speciesIds, size, tint, ink, shadowColor }: Props) {
  const border = 6;
  const inner = size - border * 2;
  const ids = speciesIds.slice(0, period ? 3 : 4);
  const small = Math.round(inner * (period ? 0.4 : ids.length <= 2 ? 0.5 : 0.44));
  // A loose triangle along the bottom under the icon; or the photos filling the circle.
  const spots = period
    ? [
        { left: inner * 0.08, top: inner * 0.42, rotate: -8 },
        { left: inner * 0.52, top: inner * 0.42, rotate: 6 },
        { left: inner * 0.3, top: inner * 0.56, rotate: -3 },
      ]
    : ids.length <= 2
      ? [
          { left: inner * 0.02, top: inner * 0.26, rotate: -6 },
          { left: inner * 0.48, top: inner * 0.24, rotate: 5 },
        ]
      : [
          { left: inner * 0.06, top: inner * 0.12, rotate: -6 },
          { left: inner * 0.5, top: inner * 0.1, rotate: 5 },
          { left: inner * 0.08, top: inner * 0.52, rotate: 4 },
          { left: inner * 0.5, top: inner * 0.5, rotate: -5 },
        ].slice(0, ids.length === 3 ? 3 : 4)
          .map((p, i, all) => (all.length === 3 && i === 2 ? { ...p, left: inner * 0.28 } : p));
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
      {period && (
        <View style={{ position: 'absolute', top: inner * 0.08, left: 0, right: 0, alignItems: 'center' }}>
          <PeriodIcon period={period} color={ink} size={inner * 0.4} />
        </View>
      )}
      {ids.map((id, i) => {
        const photo = speciesPhoto(id);
        const drawn = hasCharacter(id);
        if (!photo && !drawn) return null;
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
            {drawn ? (
              <Character speciesId={id} size={small - 6} />
            ) : (
              <Image source={photo} accessibilityLabel={getSpecies(id)?.friendlyName} style={{ width: '100%', height: '100%' }} />
            )}
          </View>
        );
      })}
    </View>
  );
}
