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
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppStateProvider, useAppState } from '@/state/AppState';
import { LiveDataProvider } from '@/state/LiveData';
import { WeatherProvider } from '@/state/Weather';
import { WEB_MAX_WIDTH } from '@/lib/appFrame';
import { border, colors } from '@/theme/tokens';

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
      <WebFrame>
        <Navigator />
      </WebFrame>
    </AppStateProvider>
  );
}

/** On the web: the app as a phone-width column, centered on a soft blue page. */
function WebFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.blueTint }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: WEB_MAX_WIDTH,
          overflow: 'hidden',
          backgroundColor: colors.paper,
          borderLeftWidth: border.width,
          borderRightWidth: border.width,
          borderColor: colors.ink,
        }}
      >
        {children}
      </View>
    </View>
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
          <Stack.Screen name="pick-favorites" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="species/[id]" />
          <Stack.Screen name="hurt-animal" />
          <Stack.Screen name="privacy" />
        </Stack>
      </WeatherProvider>
    </LiveDataProvider>
  );
}
