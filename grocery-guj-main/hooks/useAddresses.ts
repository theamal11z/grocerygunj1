import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Address } from '@/lib/supabase';

export function useAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: addressesError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (addressesError) {
        throw addressesError;
      }

      setAddresses(data || []);
    } catch (err) {
      
      setError(err instanceof Error ? err : new Error('Failed to fetch addresses'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addAddress = useCallback(async (address: Omit<Address, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      setError(null);

      const { data, error: addError } = await supabase
        .from('addresses')
        .insert([
          {
            user_id: user.id,
            ...address,
          },
        ])
        .select()
        .single();

      if (addError) {
        throw addError;
      }

      setAddresses(prev => [data, ...prev]);
      return data;
    } catch (err) {
      
      throw err;
    }
  }, [user]);

  const updateAddress = useCallback(async (id: string, updates: Partial<Address>) => {
    if (!user) return;

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setAddresses(prev => prev.map(addr => addr.id === id ? data : addr));
      return data;
    } catch (err) {
      
      throw err;
    }
  }, [user]);

  const deleteAddress = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      setAddresses(prev => prev.filter(addr => addr.id !== id));
    } catch (err) {
      
      throw err;
    }
  }, [user]);

  const setDefaultAddress = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);

      // First, remove default from all addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the new default
      const { data, error: updateError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_default: addr.id === id
      })));

      return data;
    } catch (err) {
      
      throw err;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setAddresses([]);
    }
  }, [user, fetchAddresses]);

  return {
    addresses,
    loading,
    error,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refetch: fetchAddresses,
  };
}