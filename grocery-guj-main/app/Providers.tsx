import React, { ReactNode } from 'react';
import { WishlistProvider } from '@/hooks/WishlistContext';
import { CartProvider } from '@/lib/CartContext';
import { AuthProvider } from '@/hooks/AuthContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
} 