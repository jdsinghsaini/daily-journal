import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';
import { todayKey } from '../../lib/dates';
import { useTheme } from '../../lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.acc,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Calendar', tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen
        name="today"
        options={{ title: 'Today', tabBarIcon: icon('create-outline') }}
        listeners={{
          tabPress: (e) => {
            // Tapping the tab always jumps back to today's page.
            e.preventDefault();
            router.navigate({ pathname: '/today', params: { date: todayKey(), t: String(Date.now()) } });
          },
        }}
      />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('bar-chart-outline') }} />
      <Tabs.Screen name="capsule" options={{ title: 'Capsule', tabBarIcon: icon('mail-outline') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings-outline') }} />
    </Tabs>
  );
}
