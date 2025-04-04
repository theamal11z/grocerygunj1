import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { SplashScreen } from 'expo-router';
import Providers from './Providers';
import suppressWarnings from '@/utils/errorSuppression';

// Apply warning suppression
suppressWarnings();

// Suppress text rendering warnings globally
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order-confirmation" />
        <Stack.Screen name="order-tracking" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="offers" />
        <Stack.Screen name="help" />
        <Stack.Screen name="address" />
        <Stack.Screen name="payment-methods" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="products" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style="auto" />
    </Providers>
  );
}