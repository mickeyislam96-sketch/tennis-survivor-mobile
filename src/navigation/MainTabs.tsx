import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PoolsStack } from './PoolsStack';
import MyPicksScreen from '../screens/MyPicksScreen';
import { ProfileStack } from './ProfileStack';
import { colours } from '../theme';
import { View, Text, StyleSheet } from 'react-native';

export type MainTabsParamList = {
  Pools: undefined;
  MyPicks: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Simple icon components (no external icon library needed)
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Pools: '\u{1F3BE}',
    'My Picks': '\u2705',
    Profile: '\u{1F464}',
  };
  return (
    <View style={iconStyles.container}>
      <Text style={[iconStyles.emoji, focused && iconStyles.emojiActive]}>
        {icons[label] || '\u25CF'}
      </Text>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22, opacity: 0.5 },
  emojiActive: { opacity: 1 },
});

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colours.surface,
          borderTopColor: colours.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 85,
        },
        tabBarActiveTintColor: colours.primary,
        tabBarInactiveTintColor: colours.inkMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Pools"
        component={PoolsStack}
        options={{
          tabBarLabel: 'Pools',
          tabBarIcon: ({ focused }) => <TabIcon label="Pools" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MyPicks"
        component={MyPicksScreen}
        options={{
          tabBarLabel: 'My Picks',
          tabBarIcon: ({ focused }) => <TabIcon label="My Picks" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
