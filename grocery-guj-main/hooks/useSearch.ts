import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/lib/supabase';

export function useSearch() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchProducts = useCallback(async (query: string, categoryId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let searchQuery = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .ilike('name', `%${query}%`);

      if (categoryId) {
        searchQuery = searchQuery.eq('category_id', categoryId);
      }

      const { data, error: searchError } = await searchQuery;

      if (searchError) {
        throw searchError;
      }

      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search products'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        throw categoriesError;
      }

      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPopularProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .order('rating', { ascending: false })
        .limit(10);

      if (productsError) {
        throw productsError;
      }

      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch popular products'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    categories,
    loading,
    error,
    searchProducts,
    fetchCategories,
    fetchPopularProducts,
  };
} 