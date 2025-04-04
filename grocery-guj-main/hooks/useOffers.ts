import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Product } from '@/lib/supabase';

export type Offer = {
  id: string;
  title: string;
  code: string;
  discount: string;
  description: string;
  valid_until: string;
  image_url: string;
  created_at: string;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count?: number;
  coupon_type?: 'percent' | 'fixed';
  applicable_products?: string[];
  applicable_categories?: string[];
};

export type Deal = {
  product: Product;
  discount: string;
};

export function useOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      let offersError;

      // First try to fetch from active_offers view
      try {
        // We use a nested try-catch because the Supabase client doesn't support 
        // fallback mechanisms through promises well when the table/view doesn't exist
        const result = await supabase
          .from('active_offers')
          .select('*')
          .order('created_at', { ascending: false });
        
        data = result.data;
        offersError = result.error;
      } catch (err) {
        // If active_offers view doesn't exist or any other error, fall back to standard offers table
        const result = await supabase
          .from('offers')
          .select('*')
          .gt('valid_until', new Date().toISOString())
          .order('created_at', { ascending: false });
        
        data = result.data;
        offersError = result.error;
      }

      if (offersError) {
        throw offersError;
      }

      setOffers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch offers'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get products with discounts
      const { data, error: dealsError } = await supabase
        .from('products')
        .select('*')  // Select all fields to match Product type
        .not('discount', 'is', null)
        .order('discount', { ascending: false })
        .limit(10);

      if (dealsError) {
        throw dealsError;
      }

      const dealsWithDiscount = (data || [])
        .filter(product => product.discount != null)
        .map(product => ({
          product,
          discount: `${product.discount}% OFF`,
        }));

      setDeals(dealsWithDiscount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch deals'));
    } finally {
      setLoading(false);
    }
  }, []);

  const applyOffer = useCallback(async (code: string, cartTotal = 0) => {
    if (!user) return null;

    try {
      setError(null);

      // Use our new RPC function to check coupon validity including one-time-use restriction
      const { data: validationResult, error: validationError } = await supabase
        .rpc('is_coupon_valid_for_user', {
          p_coupon_code: code,
          p_user_id: user.id
        });

      if (validationError) {
        throw validationError;
      }

      if (!validationResult || !validationResult.valid) {
        throw new Error(validationResult?.message || 'Invalid offer code');
      }

      const offer = validationResult.offer;

      // Check minimum purchase requirement
      if (offer.min_purchase_amount && cartTotal < offer.min_purchase_amount) {
        throw new Error(`Minimum purchase of ₹${offer.min_purchase_amount} required for this offer`);
      }

      // Ensure discount is properly formatted as a string for display
      if (typeof offer.discount === 'number') {
        offer.discount = `${offer.discount}%`;
      }

      return offer;
    } catch (err) {
      throw err;
    }
  }, [user]);

  // Calculate the actual discount amount
  const calculateDiscountAmount = useCallback((offer: Offer, cartTotal: number) => {
    if (!offer) return 0;
    
    let discountAmount = 0;
    
    if (offer.coupon_type === 'fixed') {
      // Fixed amount discount
      const discountMatch = typeof offer.discount === 'string' ? offer.discount.match(/₹(\d+)/) : null;
      if (discountMatch) {
        discountAmount = Number(discountMatch[1]);
      }
    } else {
      // Percentage discount
      const percentMatch = typeof offer.discount === 'string' ? offer.discount.match(/(\d+)%/) : null;
      if (percentMatch) {
        const percent = Number(percentMatch[1]);
        discountAmount = (cartTotal * percent) / 100;
      } else if (typeof offer.discount === 'number') {
        // Handle case where discount is stored as a number
        discountAmount = (cartTotal * offer.discount) / 100;
      }
    }
    
    // Apply maximum discount cap if it exists
    if (offer.max_discount_amount && discountAmount > offer.max_discount_amount) {
      discountAmount = offer.max_discount_amount;
    }
    
    return discountAmount;
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchDeals();
  }, [fetchOffers, fetchDeals]);

  return {
    offers,
    deals,
    loading,
    error,
    applyOffer,
    calculateDiscountAmount,
    refetch: useCallback(() => {
      fetchOffers();
      fetchDeals();
    }, [fetchOffers, fetchDeals]),
  };
} 