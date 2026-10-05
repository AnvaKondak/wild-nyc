// Dev-only gallery of the PLACEHOLDER art: every species, and every story setting.
// Open with the deep link wildneighbors://art-preview (or /art-preview on web).
import { Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { SceneView } from '@/components/scenes';
import { getSpecies, places, species, speciesPhoto, type Setting } from '@/content';
import { colors, fonts } from '@/theme/tokens';
import { type } from '@/theme/type';

const SETTINGS: Setting[] = ['branch', 'trunk', 'den', 'wire', 'ledge', 'rooftop', 'streetlight', 'lawn', 'sidewalk', 'hedge', 'flowers', 'water', 'shore', 'pier', 'reeds', 'fence', 'trashcan', 'web', 'sky', 'night-sky'];

export default function ArtPreview() {
  const raccoon = getSpecies('raccoon')!;
  const { only } = useLocalSearchParams<{ only?: string }>();
  const { width } = useWindowDimensions();
  const thumb = (width - 32 - 12) / 2;
  if (only === 'scenes') {
    return (
      <Screen contentStyle={{ gap: 12, paddingHorizontal: 16 }}>
        <BackButton />
        <Text style={type.kicker}>Scenes + landmarks</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {places.map((p) => (
            <View key={p.id} style={{ width: thumb, gap: 4 }}>
              <View style={{ borderWidth: 1.5, borderColor: colors.ink, borderRadius: 12, overflow: 'hidden' }}>
                <SceneView kind={p.kind} width={thumb - 3} placeId={p.id} />
              </View>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink }}>{p.name}</Text>
            </View>
          ))}
        </View>
      </Screen>
    );
  }
  return (
    <Screen contentStyle={{ gap: 18, paddingHorizontal: 16 }}>
      <BackButton />
      <Title accent="art" accentColor="blue">Placeholder</Title>
      <Text style={type.body}>Drawn in code until real illustrations exist. {species.length} species.</Text>

      {only !== 'settings' && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {species.map((s, i) => (
          <View key={s.id} style={{ width: 96, alignItems: 'center', gap: 6 }}>
            <Sticker art={s.art} photo={speciesPhoto(s.id)} size={84} tint={colors[s.tint]} rotate={[-5, 4, -3, 6][i % 4]} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink, textAlign: 'center' }}>{s.friendlyName}</Text>
          </View>
        ))}
      </View>}

      <Text style={[type.kicker, { marginTop: 8 }]}>Story settings</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {SETTINGS.map((setting) => (
          <View key={setting} style={{ width: 96, alignItems: 'center', gap: 6 }}>
            <Sticker art={raccoon.art} photo={speciesPhoto('raccoon')} size={84} tint={colors.blueTint} rotate={0} setting={setting} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink }}>{setting}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
