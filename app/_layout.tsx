// import 'react-native-reanimated';
import { AppStatusBar } from '@/components/AppStatusBar';
import '../global.css';

import { SplashScreenController } from '@/components/SplashScreenController';
import { AuthProvider, useAuthCtx } from '@/contexts/auth';
import { useSettings } from '@/contexts/settings';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

function App() {
  const auth = useAuthCtx();
  const settings = useSettings();

  const isSetupComplete =
    settings.isSuccess &&
    !!settings.data &&
    !!settings.data.sales_channel &&
    !!settings.data.region &&
    !!settings.data.stock_location;

  return (
    <Stack>
      <Stack.Protected guard={auth.state.status === 'authenticated' && isSetupComplete}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="checkout/[draftOrderId]" options={{ title: 'Checkout', headerShown: false }} />

        <Stack.Screen
          name="product-details"
          options={{
            presentation: 'transparentModal',
            title: 'Product Details',
            headerShown: false,
            animation: 'none',
            animationDuration: 0,
            gestureEnabled: false,
            fullScreenGestureShadowEnabled: false,
          }}
        />
        <Stack.Screen
          name="orders/[orderId]"
          options={{
            presentation: 'transparentModal',
            title: 'Order Details',
            headerShown: false,
            animation: 'none',
            animationDuration: 0,
            gestureEnabled: false,
            fullScreenGestureShadowEnabled: false,
          }}
        />
        <Stack.Screen
          name="customer-lookup"
          options={{
            presentation: 'transparentModal',
            title: 'Customer Lookup',
            headerShown: false,
            animation: 'none',
          }}
        />

        <Stack.Screen name="settings/stock-location" options={{ headerShown: false }} />

        <Stack.Screen name="settings/create-stock-location" options={{ headerShown: false }} />

        <Stack.Screen name="settings/region" options={{ headerShown: false }} />

        <Stack.Screen name="settings/create-region" options={{ headerShown: false }} />

        <Stack.Screen name="settings/sales-channel" options={{ headerShown: false }} />

        <Stack.Screen name="settings/create-sales-channel" options={{ headerShown: false }} />

        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={auth.state.status === 'authenticated' && settings.isSuccess && !isSetupComplete}>
        <Stack.Screen name="setup-wizard" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={auth.state.status === 'unauthenticated'}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Screen options={{ headerShown: false }} name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <SplashScreenController />
            <AppStatusBar />
            <App />
          </ThemeProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
