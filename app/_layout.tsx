// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import * as DevClient from 'expo-dev-client';
import { HeroUINativeProvider } from 'heroui-native';
import { View } from 'react-native';
import { Uniwind } from 'uniwind';
import {
  ErrorBoundary as ExpoErrorBoundary,
  type ErrorBoundaryProps,
  SplashScreen,
  Stack,
} from 'expo-router';

import { initPostHog } from '@/lib/posthog';
import { registerServiceWorker } from '@/lib/registerServiceWorker';
import { reportErrorToParent } from '@/lib/reportPreviewError';
import { HeaderBack } from '@/components/HeaderBack';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useT } from '@/lib/i18n';
import { useCloudSync } from '@/lib/sync';
import { ui } from '@/lib/theme';

/**
 * Custom ErrorBoundary that reports React render errors to the parent window (Bilt preview iframe)
 * and then renders the default Expo error UI.
 */
function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (Platform.OS === 'web' && error) {
      const message = [error.message, error.stack].filter(Boolean).join('\n');
      reportErrorToParent(message);
    }
  }, [error]);
  return <ExpoErrorBoundary error={error} retry={retry} />;
}

export { ErrorBoundary };

// MeetBeat is dark-only: one near-black canvas with an electric blue accent.
Uniwind.setTheme('dark');

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Report uncaught JS errors and unhandled promise rejections to parent (Bilt preview iframe)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const handleError = (event: ErrorEvent) => {
      const message = event.error?.stack ?? event.message ?? 'Unknown error';
      reportErrorToParent(message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      const message =
        err instanceof Error ? [err.message, err.stack].filter(Boolean).join('\n') : String(err);
      reportErrorToParent(message);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Inject Google Fonts link tag for web to ensure fonts load through proxy
  // Also register font family names as fallback if expo-font fails
  useEffect(() => {
    if (Platform.OS === 'web') {
      const existingLink = document.querySelector(
        'link[href*="fonts.googleapis.com/css2?family=Plus+Jakarta+Sans"]',
      );

      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    }
  }, []);

  useEffect(() => {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (__DEV__ && Platform.OS !== 'web' && !isExpoGo) {
      const timer = setTimeout(() => {
        DevClient.closeMenu();
        DevClient.hideMenu();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      initPostHog();
    }
  }, []);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <AppStack />
        <InstallPrompt />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}

function AppStack() {
  const t = useT();

  // Mounted here so the event directory and account data load once for the app.
  useCloudSync();

  return (
    <View className="bg-canvas flex-1">
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: ui.canvas },
          headerTintColor: ui.text,
          headerTitleStyle: { color: ui.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: ui.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="match/[id]"
          options={{ title: t('match.why'), headerLeft: () => <HeaderBack /> }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{ title: t('chat.title'), headerLeft: () => <HeaderBack /> }}
        />
        <Stack.Screen
          name="events/new"
          options={{ title: t('events.createTitle'), headerLeft: () => <HeaderBack /> }}
        />
        <Stack.Screen
          name="events/[id]"
          options={{ title: t('lobby.title'), headerLeft: () => <HeaderBack fallback="/events" /> }}
        />
        <Stack.Screen
          name="dna"
          options={{ title: t('dna.title'), headerLeft: () => <HeaderBack fallback="/profile" /> }}
        />
        <Stack.Screen
          name="connections"
          options={{
            title: t('connections.title'),
            headerLeft: () => <HeaderBack fallback="/recap" />,
          }}
        />
        <Stack.Screen
          name="connection/[id]"
          options={{
            title: t('connection.title'),
            presentation: 'modal',
            headerLeft: () => <HeaderBack />,
            contentStyle: { backgroundColor: ui.canvas, borderTopColor: ui.border },
          }}
        />
      </Stack>
    </View>
  );
}
