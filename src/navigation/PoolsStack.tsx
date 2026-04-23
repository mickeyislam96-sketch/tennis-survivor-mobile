import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PoolsScreen from '../screens/PoolsScreen';
import GroupScreen from '../screens/GroupScreen';
import PickScreen from '../screens/PickScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import DrawScreen from '../screens/DrawScreen';
import PickHistoryScreen from '../screens/PickHistoryScreen';
import JoinScreen from '../screens/JoinScreen';
import TermsScreen from '../screens/TermsScreen';
import { colours } from '../theme';

export type PoolsStackParamList = {
  PoolsList: undefined;
  Group: { groupId: string; drawAvailable?: boolean; tournamentStatus?: string };
  Pick: { groupId: string };
  Leaderboard: { groupId: string };
  Draw: { groupId: string; drawAvailable?: boolean };
  PickHistory: { groupId: string };
  Join: { code: string };
  Terms: undefined;
};

const Stack = createNativeStackNavigator<PoolsStackParamList>();

export function PoolsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colours.canvas },
        headerTintColor: colours.ink,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colours.canvas },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="PoolsList"
        component={PoolsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Group"
        component={GroupScreen}
        options={{ title: 'Pool' }}
      />
      <Stack.Screen
        name="Pick"
        component={PickScreen}
        options={{ title: 'Make Your Pick' }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Stack.Screen
        name="Draw"
        component={DrawScreen}
        options={{ title: 'Draw' }}
      />
      <Stack.Screen
        name="PickHistory"
        component={PickHistoryScreen}
        options={{ title: 'Pick History' }}
      />
      <Stack.Screen
        name="Join"
        component={JoinScreen}
        options={{ title: 'Join Pool' }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: 'Terms & Conditions' }}
      />
    </Stack.Navigator>
  );
}
