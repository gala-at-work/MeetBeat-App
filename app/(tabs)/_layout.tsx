import { Redirect, Tabs } from 'expo-router';
import { Spinner } from 'heroui-native';
import { Activity, CalendarDays, QrCode, Sparkles, User } from 'lucide-react-native';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { LogoTile } from '@/components/Logo';
import { HeaderBack } from '@/components/HeaderBack';
import { useAuthStore } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { splashPending } from '@/lib/splash';
import { useProfileStore, useStoresHydrated } from '@/lib/store';
import { ui } from '@/lib/theme';

export default function TabLayout() {
  const t = useT();

  const hydrated = useStoresHydrated();
  const authStatus = useAuthStore((state) => state.status);
  const profile = useProfileStore((state) => state.profile);

  if (!hydrated) {
    return (
      <View className="bg-canvas flex-1 items-center justify-center gap-6">
        <LogoTile size={140} />
        <Spinner />
      </View>
    );
  }

  if (authStatus === 'signedOut') {
    return <Redirect href={splashPending() ? '/splash' : '/welcome'} />;
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: ui.canvas },
          headerTintColor: ui.text,
          headerTitleStyle: { color: ui.text },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: ui.canvas },
          tabBarStyle: {
            backgroundColor: ui.tabBar,
            borderTopColor: ui.border,
            borderTopWidth: 1,
            elevation: 0,
            shadowColor: 'transparent',
            shadowOpacity: 0,
            shadowRadius: 0,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarActiveTintColor: ui.accent,
          tabBarInactiveTintColor: ui.textMuted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.radar'),
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Activity color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: t('nav.events'),
            headerLeft: () => <HeaderBack fallback="/" />,
            tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: t('nav.scan'),
            headerLeft: () => <HeaderBack fallback="/" />,
            tabBarIcon: ({ color, size }) => <QrCode color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="recap"
          options={{
            title: t('nav.recap'),
            headerLeft: () => <HeaderBack fallback="/" />,
            tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile'),
            headerLeft: () => <HeaderBack fallback="/" />,
            tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 24} />,
          }}
        />
      </Tabs>
    </>
  );
}
