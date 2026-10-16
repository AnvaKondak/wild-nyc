import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { SearchIcon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { Title } from '@/components/Title';
import { places, type Place } from '@/content';
import { neighborhoodFromPlace } from '@/lib/neighborhood';
import { boroughOf, searchPlaces, type Borough } from '@/lib/placeSearch';
import { useAppState } from '@/state/AppState';
import { border, colors, fonts, offsetShadow, radius } from '@/theme/tokens';
import { type } from '@/theme/type';

const KIND_LABEL = { block: 'Blocks', park: 'Parks', waterfront: 'Waterfront' } as const;
type City = 'All' | 'NYC' | 'Jersey City';
const CITIES: City[] = ['All', 'NYC', 'Jersey City'];
// The order boroughs are listed in when nothing is typed.
const BOROUGHS: Borough[] = ['Brooklyn', 'Manhattan', 'Queens', 'The Bronx', 'Staten Island', 'Jersey City'];

export default function AddPlace() {
  const router = useRouter();
  // `edit=home`: moving Home somewhere else, rather than adding a new place.
  const { from, edit } = useLocalSearchParams<{ from?: string; edit?: string }>();
  const fromWelcome = from === 'welcome';
  const editingHome = edit === 'home';
  const { state, actions } = useAppState();
  const added = new Set(state.neighborhoods.map((n) => n.id));
  const [query, setQuery] = useState('');
  const [city, setCity] = useState<City>('All');
  const deferred = useDeferredValue(query);

  // Typed search first (best matches on top), then the city chip narrows it down.
  const results = useMemo(() => searchPlaces(places, deferred).filter((p) => city === 'All' || p.city === city), [deferred, city]);
  const searching = deferred.trim().length > 0;

  const done = () => {
    // Joining: next, pick some favorites (that step finishes onboarding).
    if (fromWelcome) {
      router.replace('/pick-favorites');
    } else {
      router.back();
    }
  };

  const pick = (place: Place) => {
    if (editingHome) actions.replaceHome(neighborhoodFromPlace(place, 'Home'));
    // The first neighborhood someone adds is "Home".
    else actions.addNeighborhood(neighborhoodFromPlace(place, state.neighborhoods.length === 0 ? 'Home' : place.name));
    done();
  };

  const pill = (p: Place) => {
    const isAdded = added.has(`place-${p.id}`);
    return (
      <Pressable
        key={p.id}
        onPress={() => pick(p)}
        accessibilityRole="button"
        accessibilityLabel={`${p.name}, ${boroughOf(p)}, ${KIND_LABEL[p.kind].toLowerCase()}${isAdded ? ', already added' : ''}`}
        accessibilityState={{ selected: isAdded }}
        style={({ pressed }) => ({
          minHeight: 44,
          paddingHorizontal: 14,
          borderRadius: radius.pill,
          borderWidth: border.width,
          borderColor: colors.ink,
          backgroundColor: isAdded ? colors.yellow : p.kind === 'park' ? colors.yellowTint : p.kind === 'waterfront' ? colors.blueTint : colors.white,
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>{p.name}</Text>
      </Pressable>
    );
  };

  return (
    <Screen contentStyle={{ gap: 18 }}>
      <View style={{ paddingHorizontal: 16, flexDirection: 'row' }}>
        <BackButton />
      </View>

      <View style={{ paddingHorizontal: 22, gap: 8 }}>
        {editingHome ? <Title accent="Home">Move</Title> : <Title accent="neighborhood">Pick a</Title>}
        <Text style={type.body}>
          We only ever use your neighborhood, about ten blocks across. Type its name, your borough or a street you know.
        </Text>
      </View>

      {/* Search by name, borough, nickname or a spot inside the neighborhood. */}
      <View
        style={{
          marginHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          borderRadius: radius.pill,
          borderWidth: border.width,
          borderColor: colors.ink,
          backgroundColor: colors.white,
          boxShadow: offsetShadow(colors.ink, 3),
        }}
      >
        <SearchIcon color={colors.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Park Slope, Queens, Bedford Ave…"
          placeholderTextColor={colors.inkMuted}
          accessibilityLabel="Search neighborhoods by name, borough or street"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={{ flex: 1, fontFamily: fonts.body, fontSize: 17, color: colors.ink, paddingVertical: 12 }}
        />
      </View>

      {/* Which city. */}
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
        {CITIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCity(c)}
            accessibilityRole="radio"
            accessibilityState={{ checked: city === c }}
            style={({ pressed }) => ({
              minHeight: 44,
              paddingHorizontal: 16,
              borderRadius: radius.pill,
              borderWidth: border.width,
              borderColor: colors.ink,
              backgroundColor: city === c ? colors.ink : colors.white,
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: city === c ? colors.white : colors.ink }}>{c}</Text>
          </Pressable>
        ))}
      </View>

      {results.length === 0 ? (
        <Text style={[type.body, { paddingHorizontal: 22, color: colors.inkMuted }]} accessibilityLiveRegion="polite">
          No neighborhood by that name yet. Try your borough, or a park or street nearby.
        </Text>
      ) : searching ? (
        // Best matches first, as one list.
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Text style={[type.label, { paddingHorizontal: 6 }]} accessibilityLiveRegion="polite">
            {results.length} {results.length === 1 ? 'match' : 'matches'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{results.map(pill)}</View>
        </View>
      ) : (
        // Nothing typed: everything, by borough.
        BOROUGHS.map((b) => {
          const here = results.filter((p) => boroughOf(p) === b);
          if (here.length === 0) return null;
          return (
            <View key={b} style={{ paddingHorizontal: 16, gap: 10 }}>
              <Text style={[type.label, { paddingHorizontal: 6 }]}>{b}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{here.map(pill)}</View>
            </View>
          );
        })
      )}
    </Screen>
  );
}
