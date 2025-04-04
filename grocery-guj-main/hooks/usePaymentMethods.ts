import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { PaymentMethod } from '@/lib/supabase';

export function usePaymentMethods() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: paymentMethodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentMethodsError) {
        throw paymentMethodsError;
      }

      setPaymentMethods(data || []);
    } catch (err) {
      
      setError(err instanceof Error ? err : new Error('Failed to fetch payment methods'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addPaymentMethod = useCallback(async (paymentMethod: Omit<PaymentMethod, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      setError(null);

      const { data, error: addError } = await supabase
        .from('payment_methods')
        .insert([
          {
            user_id: user.id,
            ...paymentMethod,
          },
        ])
        .select()
        .single();

      if (addError) {
        throw addError;
      }

      setPaymentMethods(prev => [data, ...prev]);
      return data;
    } catch (err) {
      
      throw err;
    }
  }, [user]);

  const updatePaymentMethod = useCallback(async (id: string, updates: Partial<PaymentMethod>) => {
    if (!user) return;

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setPaymentMethods(prev => prev.map(method => method.id === id ? data : method));
      return data;
    } catch (err) {
      
      throw err;
    }
  }, [user]);

  const deletePaymentMethod = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      setPaymentMethods(prev => prev.filter(method => method.id !== id));
    } catch (err) {
      
      throw err;
    }
  }, [user]);

  const setDefaultPaymentMethod = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);

      // First, remove default from all payment methods
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the new default
      const { data, error: updateError } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        is_default: method.id === id
      })));

      return data;
    } catch (err) {
      
      throw err;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    } else {
      setPaymentMethods([]);
    }
  }, [user, fetchPaymentMethods]);

  return {
    paymentMethods,
    loading,
    error,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    refetch: fetchPaymentMethods,
  };
}