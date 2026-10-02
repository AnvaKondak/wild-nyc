import type { ComponentType } from 'react';
import { Text, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { HeartIcon, HouseIcon, PeopleIcon, SunIcon } from '@/components/Icons';
import { border, colors, fonts } from '@/theme/tokens';

type IconComponent = ComponentType<{ color?: ColorValue; size?: number }>;

function tab(title: string, Icon: IconComponent) {
  return {
    title,
    tabBarIcon: ({ color }: { color: ColorValue }) => <Icon color={color} size={22} />,
    tabBarLabel: ({ focused, color }: { focused: boolean; color: ColorValue }) => (
      <Text style={{ fontFamily: focused ? fonts.bodySemi : fonts.body, fontSize: 11, color }}>{title}</Text>
    ),
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: border.width,
          borderTopColor: colors.ink,
        },
      }}
    >
      <Tabs.Screen name="index" options={tab('Right now', SunIcon)} />
      <Tabs.Screen name="places" options={tab('Places', HouseIcon)} />
      <Tabs.Screen name="neighbors" options={tab('Neighbors', PeopleIcon)} />
      <Tabs.Screen name="kindness" options={tab('Kindness', HeartIcon)} />
    </Tabs>
  );
}
