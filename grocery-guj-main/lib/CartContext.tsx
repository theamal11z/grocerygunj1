import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { CartItem, Product } from '@/lib/supabase';

export type CartItemWithProduct = CartItem & {
  product: Product;
};

interface CartContextType {
  cartItems: CartItemWithProduct[];
  loading: boolean;
  error: Error | null;
  fetchCartItems: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<any>;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  getCartTotals: () => { subtotal: number; itemCount: number };
}

// Export the context so it can be imported directly if needed
export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Fetch cart items with product details
  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // First check if the cart_items table exists
      const { error: tableCheckError } = await supabase
        .from('cart_items')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        throw new Error(`Cart functionality is unavailable: ${tableCheckError.message}`);
      }

      // Fetch cart items with product details
      const { data, error: fetchError } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Check for missing product data which might indicate a relationship issue
      const hasInvalidItems = data.some(item => !item.product);
      if (hasInvalidItems) {
        // Skip console warning
      }

      // Transform the data to match CartItemWithProduct type
      const transformedData = data.map((item: any) => ({
        ...item,
        product: item.product
      }));

      setCartItems(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch cart items'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add item to cart
  const addToCart = useCallback(async (productId: string, quantity: number = 1) => {
    if (!user) return null;

    try {
      setError(null);

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        // Update quantity if item already exists
        const { data, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)
          .select(`
            *,
            product:products(*)
          `)
          .single();

        if (updateError) throw updateError;
        
        // Update local state
        setCartItems(prev => 
          prev.map(item => 
            item.id === existingItem.id 
              ? { ...data, product: data.product } 
              : item
          )
        );
        
        return data;
      } else {
        // Insert new item if it doesn't exist
        const { data, error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity
          })
          .select(`
            *,
            product:products(*)
          `)
          .single();

        if (insertError) throw insertError;
        
        // Update local state
        setCartItems(prev => [{ ...data, product: data.product }, ...prev]);
        
        return data;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add item to cart'));
      return null;
    }
  }, [user]);

  // Update cart item quantity
  const updateCartItemQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    if (!user || quantity < 1) return false;

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setCartItems(prev => 
        prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity } 
            : item
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update cart item quantity'));
      return false;
    }
  }, [user]);

  // Remove item from cart
  const removeFromCart = useCallback(async (cartItemId: string) => {
    if (!user) return false;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove item from cart'));
      return false;
    }
  }, [user]);

  // Clear cart
  const clearCart = useCallback(async () => {
    if (!user) return false;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      setCartItems([]);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to clear cart'));
      return false;
    }
  }, [user]);

  // Calculate cart totals
  const getCartTotals = useCallback(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity, 
      0
    );
    
    const itemCount = cartItems.reduce(
      (sum, item) => sum + item.quantity, 
      0
    );
    
    return {
      subtotal,
      itemCount
    };
  }, [cartItems]);

  // Set up real-time subscription to cart changes
  useEffect(() => {
    if (!user) return;

    // Fetch initial cart items
    fetchCartItems();

    // Set up subscription to cart_items table for real-time updates
    const cartSubscription = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh cart items when changes are detected
          fetchCartItems();
        }
      )
      .subscribe();

    setSubscription(cartSubscription);

    // Clean up subscription on unmount
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user, fetchCartItems]);

  // Export the necessary values
  const value = {
    cartItems,
    loading,
    error,
    fetchCartItems,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotals,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Export the useCart hook
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 