import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/features/auth/store';
import { useSessionRestore } from '../src/features/auth/hooks';
import { LoadingView } from '../src/components/LoadingView';
import { useTheme } from '../src/theme';
import { Alert, View } from 'react-native';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { requestNotificationPermissions, useNotificationListener } from '../src/utils/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,
    },
  },
});

function RootNavigation() {
  const { user, token, isInitialized, sessionExpired, clearSessionExpired } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const { isDark } = useTheme();
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  const sessionRestore = useSessionRestore();

  // Request notification permissions after successful login
  useEffect(() => {
    if (user && token && user.role !== 'admin') {
      requestNotificationPermissions().catch((err) => {
        console.warn('Failed to request notification permissions:', err);
      });
    }
  }, [user, token]);

  // Setup notification listener
  useNotificationListener();

  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      try {
        await useAuthStore.getState().bootstrap();

        const state = useAuthStore.getState();
        if (state.token) {
          if (isMounted) setIsRestoringSession(true);
          try {
            await sessionRestore.mutateAsync();
          } catch (e) {
            console.log('Session restore error (will fallback to login if invalid):', e);
          } finally {
            if (isMounted) setIsRestoringSession(false);
          }
        }
      } catch (err) {
        console.error('App bootstrap error:', err);
      }
    };

    initializeApp();
    return () => {
      isMounted = false;
    };
  }, []);

  // Show session expired alert
  useEffect(() => {
    if (sessionExpired) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please sign in again to continue.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearSessionExpired();
              router.replace('/(auth)/login');
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [sessionExpired, clearSessionExpired, router]);

  useEffect(() => {
    if (!isInitialized || isRestoringSession) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminNotice = segments[0] === 'admin-notice';
    const isEntryRoute = segments.length === 0 || segments[0] === 'index' || !segments[0];

    if (!token || !user) {
      if (!inAuthGroup && !inAdminNotice) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (user.role === 'admin') {
      if (!inAdminNotice) {
        router.replace('/admin-notice');
      }
      return;
    }

    if (inAuthGroup || inAdminNotice || isEntryRoute) {
      if (user.role === 'officer') {
        router.replace('/(officer)');
      } else {
        router.replace('/(citizen)');
      }
    }
  }, [isInitialized, isRestoringSession, token, user, segments, router]);

  if (!isInitialized || isRestoringSession) {
    return <LoadingView message="Initializing Civics..." fullScreen />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(citizen)" />
        <Stack.Screen name="(officer)" />
        <Stack.Screen name="admin-notice" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <RootNavigation />
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
