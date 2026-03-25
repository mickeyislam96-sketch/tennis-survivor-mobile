import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PoolsScreen } from '../screens/PoolsScreen';
import { GroupScreen } from '../screens/GroupScreen';
import { PickScreen } from '../screens/PickScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { DrawScreen } from '../screens/DrawScreen';
import { PickHistoryScreen } from '../screens/PickHistoryScreen';
import { JoinScreen } from '../screens/JoinScreen';
import { colours } from '../theme';

export type PoolsStackParamList = {
  PoolsList: undefined;
  Group: { groupId: string };
  Pick: { groupId: string };
  Leaderboard: { groupId: string };
  Draw: { groupId: string };
  PickHistory: { groupId: string };
  Join: { code: string };
};

const Stack = createNativeStackNavigator<PoolsStackParamList>();

export function PoolsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colours.background },
        headerTintColor: colours.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colours.background },
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
    </Stack.Navigator>
  );
}
