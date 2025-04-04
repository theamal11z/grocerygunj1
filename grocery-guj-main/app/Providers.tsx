import React, { ReactNode } from 'react';
import { WishlistProvider } from '@/hooks/WishlistContext';
import { CartProvider } from '@/lib/CartContext';
import { AuthProvider } from '@/hooks/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 