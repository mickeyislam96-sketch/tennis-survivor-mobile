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
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit/800ExtraBold';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Fraunces_700Bold_Italic } from '@expo-google-fonts/fraunces/700Bold_Italic';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono/700Bold';

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
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_700Bold,
    Fraunces_700Bold_Italic,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
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
