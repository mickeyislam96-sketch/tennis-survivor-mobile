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
    // Outfit (sans)
    'Outfit_400Regular': require('@expo-google-fonts/outfit/400Regular/Outfit_400Regular.ttf'),
    'Outfit_500Medium': require('@expo-google-fonts/outfit/500Medium/Outfit_500Medium.ttf'),
    'Outfit_600SemiBold': require('@expo-google-fonts/outfit/600SemiBold/Outfit_600SemiBold.ttf'),
    'Outfit_700Bold': require('@expo-google-fonts/outfit/700Bold/Outfit_700Bold.ttf'),
    'Outfit_800ExtraBold': require('@expo-google-fonts/outfit/800ExtraBold/Outfit_800ExtraBold.ttf'),
    // Fraunces (serif)
    'Fraunces_400Regular': require('@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf'),
    'Fraunces_400Regular_Italic': require('@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf'),
    'Fraunces_700Bold': require('@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.ttf'),
    'Fraunces_700Bold_Italic': require('@expo-google-fonts/fraunces/700Bold_Italic/Fraunces_700Bold_Italic.ttf'),
    // JetBrains Mono (mono)
    'JetBrainsMono_400Regular': require('@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf'),
    'JetBrainsMono_500Medium': require('@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf'),
    'JetBrainsMono_700Bold': require('@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf'),
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
