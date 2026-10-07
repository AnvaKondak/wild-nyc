// Search: every neighbor in the app, by name or kind, or just the ones who live in one
// of your neighborhoods. Tap one for their page.

import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRightIcon, SearchIcon } from '@/components/Icons';
import { PillRow } from '@/components/Pills';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Title } from '@/components/Title';
import { species, speciesPhoto } from '@/content';
import { searchSpecies } from '@/lib/search';
import { useAppState } from '@/state/AppState';
import { border, colors, fonts, offsetShadow } from '@/theme/tokens';
import { type } from '@/theme/type';

const EVERYWHERE = 'everywhere';

export default function Search() {
  const router = useRouter();
  const { state } = useAppState();
  // Dev only: ?q=hawk starts with a search typed in.
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(__DEV__ && params.q ? params.q : '');
  const [where, setWhere] = useState(EVERYWHERE);
  const place = state.neighborhoods.find((n) => n.id === where);
  const results = useMemo(() => searchSpecies(species, query, place ? { kind: place.kind, placeId: place.placeId } : undefined), [query, place]);
  const pills = [{ id: EVERYWHERE, label: 'Everywhere' }, ...state.neighborhoods.map((n) => ({ id: n.id, label: n.label }))];

  return (
    <Screen scroll={false} contentStyle={{ gap: 14 }}>
      <View style={{ paddingHorizontal: 22, gap: 6 }}>
        <Title accent="neighbor" size={38}>Find a</Title>
        <Text style={type.body}>Everyone in the app, A to Z. Or just who lives near you.</Text>
      </View>

      <View
        style={{
          marginHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          minHeight: 50,
          borderRadius: 18,
          borderWidth: border.width,
          borderColor: colors.ink,
          backgroundColor: colors.white,
          boxShadow: offsetShadow(colors.yellow, 4),
        }}
      >
        <SearchIcon color={colors.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search all ${species.length} neighbors`}
          placeholderTextColor={colors.inkMuted}
          accessibilityLabel="Search neighbors by name or kind"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={{ flex: 1, fontFamily: fonts.body, fontSize: 17, color: colors.ink, paddingVertical: 12 }}
        />
      </View>

      {/* Kept at full height; the long list below would otherwise squeeze it. */}
      <View style={{ flexShrink: 0 }}>
        <PillRow items={pills} selectedId={where} onSelect={setWhere} />
      </View>

      <Text style={{ paddingHorizontal: 22, fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkMuted }} accessibilityLiveRegion="polite">
        {results.length} {results.length === 1 ? 'neighbor' : 'neighbors'}
        {place ? ` around ${place.label}` : ''}
      </Text>

      <FlatList
        data={results}
        keyExtractor={(s) => s.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 12 }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/species/[id]', params: { id: item.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${item.friendlyName}, ${item.commonName}. Open their page`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 12,
              borderRadius: 20,
              borderWidth: border.width,
              borderColor: colors.ink,
              backgroundColor: colors.white,
              boxShadow: offsetShadow(colors.ink, 3),
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Sticker art={item.art} photo={speciesPhoto(item.id)} speciesId={item.id} size={60} tint={colors[item.tint]} rotate={index % 2 ? 4 : -4} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.ink }}>{item.friendlyName}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
                {item.commonName} · <Text style={{ fontFamily: fonts.displayItalic }}>{item.scientificName}</Text>
              </Text>
            </View>
            <ChevronRightIcon color={colors.inkMuted} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[type.body, { textAlign: 'center', paddingTop: 24, paddingHorizontal: 12 }]}>
            {query.trim()
              ? `No one called "${query.trim()}"${place ? ` lives around ${place.label}` : ' lives here'}. Try "sparrow" or "bee".`
              : 'No one to show here yet.'}
          </Text>
        }
      />
    </Screen>
  );
}
