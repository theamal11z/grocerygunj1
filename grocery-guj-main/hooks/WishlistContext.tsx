import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Wishlist, Product } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type WishlistContextType = {
  wishlistItems: (Wishlist & { product: Product })[];
  loading: boolean;
  error: Error | null;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<boolean>;
  addAllToCart: () => Promise<any>;
  refreshWishlist: () => Promise<void>;
  lastUpdated: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<(Wishlist & { product: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const { user } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Define fetchWishlist with useCallback to prevent it from changing on every render
  const fetchWishlist = useCallback(async () => {
    // Skip if we're already loading to prevent duplicate requests
    if (loading && !isInitialLoad) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [user?.id, isInitialLoad]); // Only depend on user.id and isInitialLoad

  // Initial fetch when user changes
  useEffect(() => {
    if (user) {
      setIsInitialLoad(true);
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  // Set up real-time subscription to wishlist changes
  useEffect(() => {
    if (!user) return;

    // Create a debounced refresh function to prevent multiple rapid refreshes
    let refreshTimeout: NodeJS.Timeout | null = null;
    const debouncedRefresh = () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      refreshTimeout = setTimeout(() => {
        console.log('Wishlist changed, refreshing...');
        fetchWishlist();
      }, 300); // 300ms debounce
    };

    const wishlistSubscription = supabase
      .channel('wishlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlists',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Only refresh if it's not our own action (to avoid double refreshes)
          if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new) {
            debouncedRefresh();
          }
        }
      )
      .subscribe();

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      supabase.removeChannel(wishlistSubscription);
    };
  }, [user?.id, fetchWishlist]); // Include fetchWishlist in dependencies since it's now stable with useCallback

  const addToWishlist = async (productId: string) => {
    if (!user) {
      throw new Error('You must be logged in to add items to your wishlist');
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .insert({ product_id: productId, user_id: user.id });

      if (error) {
        // If it's a unique constraint violation, the item is already in the wishlist
        if (error.code === '23505') {
          console.log('Item already in wishlist');
          return true; // Return true to indicate success (item is in wishlist)
        }
        throw error;
      }
      
      // We don't need to call fetchWishlist here as the real-time subscription will handle it
      // This prevents double refreshes
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) {
      throw new Error('You must be logged in to remove items from your wishlist');
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state immediately for better UX
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
      setLastUpdated(Date.now());
      
      // We don't need to call fetchWishlist here as the real-time subscription will handle it
      // This prevents double refreshes
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  const clearWishlist = async () => {
    if (!user) {
      throw new Error('You must be logged in to clear your wishlist');
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setWishlistItems([]);
      setLastUpdated(Date.now());
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  };

  const addAllToCart = async () => {
    if (!user) {
      throw new Error('You must be logged in to add items to your cart');
    }

    try {
      // Use the current wishlistItems state instead of fetching again
      if (!wishlistItems || wishlistItems.length === 0) {
        return { success: true, count: 0, total: 0 };
      }

      // Add each item to the cart
      let successCount = 0;
      const errors = [];

      for (const item of wishlistItems) {
        try {
          const { error: cartError } = await supabase
            .from('cart_items')
            .upsert(
              { 
                user_id: user.id, 
                product_id: item.product_id, 
                quantity: 1 
              },
              { 
                onConflict: 'user_id,product_id',
                ignoreDuplicates: false
              }
            );

          if (cartError) {
            errors.push({ productId: item.product_id, error: cartError });
          } else {
            successCount++;
          }
        } catch (err) {
          errors.push({ productId: item.product_id, error: err });
        }
      }

      return { 
        success: successCount > 0, 
        count: successCount, 
        total: wishlistItems.length,
        errors: errors.length > 0 ? errors : null
      };
    } catch (err) {
      setError(err as Error);
      return { success: false, error: err };
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    addAllToCart,
    refreshWishlist: fetchWishlist,
    lastUpdated,
  }), [
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    addAllToCart,
    fetchWishlist,
    lastUpdated,
  ]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlistContext must be used within a WishlistProvider');
  }
  return context;
} 