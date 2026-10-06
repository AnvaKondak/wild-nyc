import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppStateProvider, useAppState } from '@/state/AppState';
import { LiveDataProvider } from '@/state/LiveData';
import { WeatherProvider } from '@/state/Weather';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });

  // The splash screen stays up until fonts are ready.
  if (!fontsLoaded) return null;

  return (
    <AppStateProvider>
      <StatusBar style="dark" />
      <Navigator />
    </AppStateProvider>
  );
}

function Navigator() {
  const { hydrated } = useAppState();
  // Wait for saved state so first-timers and returning users land in the right place.
  if (!hydrated) return null;

  return (
    <LiveDataProvider>
      <WeatherProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="add-place" options={{ presentation: 'modal' }} />
          <Stack.Screen name="species/[id]" />
          <Stack.Screen name="hurt-animal" />
          <Stack.Screen name="privacy" />
        </Stack>
      </WeatherProvider>
    </LiveDataProvider>
  );
}
