import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/supabase';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async (categoryId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error: productsError } = await query;

      if (productsError) {
        throw productsError;
      }

      setProducts(data || []);
    } catch (err) {
      
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductById = useCallback(async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', productId)
        .single();

      if (productError) {
        throw productError;
      }

      return data;
    } catch (err) {
      
      setError(err instanceof Error ? err : new Error('Failed to fetch product'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductById,
  };
}