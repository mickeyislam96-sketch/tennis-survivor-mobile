import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { colours } from '../theme';
import * as Linking from 'expo-linking';

// Deep linking configuration
const linking = {
  prefixes: [
    Linking.createURL('/'),
    'https://finalserveivor.com',
    'https://tennis-survivor.vercel.app',
    'finalserveivor://',
  ],
  config: {
    screens: {
      Pools: {
        screens: {
          Join: 'join/:code',
          Group: 'group/:groupId',
        },
      },
    },
  },
} as any;

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <NavigationContainer
      linking={linking}
      theme={{
        dark: true,
        colors: {
          primary: colours.primary,
          background: colours.background,
          card: colours.surface,
          text: colours.text,
          border: colours.border,
          notification: colours.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colours.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colours.background} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
