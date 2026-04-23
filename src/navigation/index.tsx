import React from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import LoadingSpinner from '../components/LoadingSpinner';
import { colours, fonts } from '../theme';
import * as Linking from 'expo-linking';
import { useNotifications } from '../hooks/useNotifications';
import { useFonts } from 'expo-font';

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

  // Set up push notifications when user is logged in
  useNotifications();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <NavigationContainer
      linking={linking}
      theme={{
        dark: false,
        colors: {
          primary: colours.primary,
          background: colours.canvas,
          card: colours.surface,
          text: colours.ink,
          border: colours.border,
          notification: colours.danger,
        },
        fonts: {
          regular: { fontFamily: fonts.sansRegular, fontWeight: '400' },
          medium: { fontFamily: fonts.sansMedium, fontWeight: '500' },
          bold: { fontFamily: fonts.sansBold, fontWeight: '700' },
          heavy: { fontFamily: fonts.sansExtraBold, fontWeight: '800' },
        },
      }}
    >
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Outfit_400Regular': require('../../assets/fonts/Outfit_400Regular.ttf'),
    'Outfit_500Medium': require('../../assets/fonts/Outfit_500Medium.ttf'),
    'Outfit_600SemiBold': require('../../assets/fonts/Outfit_600SemiBold.ttf'),
    'Outfit_700Bold': require('../../assets/fonts/Outfit_700Bold.ttf'),
    'Outfit_800ExtraBold': require('../../assets/fonts/Outfit_800ExtraBold.ttf'),
    'Fraunces_400Regular': require('../../assets/fonts/Fraunces_400Regular.ttf'),
    'Fraunces_400Regular_Italic': require('../../assets/fonts/Fraunces_400Regular_Italic.ttf'),
    'Fraunces_700Bold': require('../../assets/fonts/Fraunces_700Bold.ttf'),
    'Fraunces_700Bold_Italic': require('../../assets/fonts/Fraunces_700Bold_Italic.ttf'),
    'JetBrainsMono_400Regular': require('../../assets/fonts/JetBrainsMono_400Regular.ttf'),
    'JetBrainsMono_500Medium': require('../../assets/fonts/JetBrainsMono_500Medium.ttf'),
    'JetBrainsMono_700Bold': require('../../assets/fonts/JetBrainsMono_700Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colours.canvas }}>
        <ActivityIndicator size="large" color={colours.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colours.canvas }}>
      <StatusBar barStyle="dark-content" backgroundColor={colours.canvas} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
