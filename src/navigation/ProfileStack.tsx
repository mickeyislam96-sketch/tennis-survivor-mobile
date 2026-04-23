import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import TermsScreen from '../screens/TermsScreen';
import SupportScreen from '../screens/SupportScreen';
import { colours } from '../theme';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Terms: undefined;
  Support: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colours.canvas },
        headerTintColor: colours.ink,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colours.canvas },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: 'Terms & Conditions' }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: 'Contact Support' }}
      />
    </Stack.Navigator>
  );
}
