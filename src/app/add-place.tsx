import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { BackButton } from '@/components/BackButton';
import { Screen } from '@/components/Screen';
import { Title } from '@/components/Title';
import { places, type Place } from '@/content';
import { locateNeighborhood } from '@/lib/locate';
import { neighborhoodFromPlace } from '@/lib/neighborhood';
import { useAppState } from '@/state/AppState';
import { border, colors, fonts, radius } from '@/theme/tokens';
import { type } from '@/theme/type';

const KIND_LABEL = { block: 'Blocks', park: 'Parks', waterfront: 'Waterfront' } as const;

export default function AddPlace() {
  const router = useRouter();
  // `edit=home`: moving Home somewhere else, rather than adding a new place.
  const { from, edit } = useLocalSearchParams<{ from?: string; edit?: string }>();
  const fromWelcome = from === 'welcome';
  const editingHome = edit === 'home';
  const { state, actions } = useAppState();
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const added = new Set(state.neighborhoods.map((n) => n.id));

  const done = () => {
    if (fromWelcome) {
      actions.finishOnboarding();
      router.replace('/');
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

  const useLocation = async () => {
    setLocating(true);
    setMessage(null);
    const result = await locateNeighborhood(editingHome || state.neighborhoods.length === 0 ? 'Home' : 'Here');
    setLocating(false);
    if (result.ok) {
      if (editingHome) actions.replaceHome(result.neighborhood);
      else actions.addNeighborhood(result.neighborhood);
      done();
    } else {
      setMessage(
        result.reason === 'denied'
          ? "No problem. Pick a neighborhood below instead."
          : "Couldn't find your spot just now. Pick a neighborhood below instead.",
      );
    }
  };

  const cities = ['NYC', 'Jersey City'] as const;

  return (
    <Screen contentStyle={{ gap: 18 }}>
      <View style={{ paddingHorizontal: 16, flexDirection: 'row' }}>
        <BackButton />
      </View>

      <View style={{ paddingHorizontal: 22, gap: 8 }}>
        {editingHome ? <Title accent="Home">Move</Title> : <Title accent="neighborhood">Pick a</Title>}
        <Text style={type.body}>
          We only ever use your neighborhood, about ten blocks across. Your exact spot never leaves your phone.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <Button label={locating ? 'Finding your block…' : 'Use where I am'} onPress={useLocation} />
        {message && <Text style={[type.body, { color: colors.inkMuted }]}>{message}</Text>}
      </View>

      {cities.map((city) => (
        <View key={city} style={{ paddingHorizontal: 16, gap: 10 }}>
          <Text style={[type.label, { paddingHorizontal: 6 }]}>{city}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {places
              .filter((p) => p.city === city)
              .map((p) => {
                const isAdded = added.has(`place-${p.id}`);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => pick(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.name}, ${KIND_LABEL[p.kind].toLowerCase()}`}
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
              })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
