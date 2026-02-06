import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { queryClient } from '@/lib/queryClient';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../components/AuthContext';
import { useProtectedRoute } from '../components/useProtectedRoute';
import { registerForPushNotificationsAsync, sendLocalNotification } from '../lib/notifications';
import { supabaseWebsite } from '../lib/supabaseWebsite';

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    registerForPushNotificationsAsync().then(_token => {
      // Token registered for push notifications
    });

    const subscription = supabaseWebsite
      .channel('global_leads_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'devis_auto' }, (payload) => {
        const lead = payload.new;
        if (lead.statut === 'nouveau') {
          sendLocalNotification(
            "Nouvelle Demande ! 🔔",
            `Projet: ${lead.vehicle_model || lead.projet || 'Contact'}\nClient: ${lead.prenom} ${lead.nom}`
          );
        }
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthProvider>
            <ProtectedLayout />
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

function ProtectedLayout() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="portal" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="public/search" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="interventions/new" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
