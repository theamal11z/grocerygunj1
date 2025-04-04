import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface UseOrderStatusProps {
  onSuccess?: (newStatus: OrderStatus) => void;
  onError?: (error: Error) => void;
}

export function useOrderStatus({ onSuccess, onError }: UseOrderStatusProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setLoading(true);
      setError(null);

      // First check if the order exists and get its current status
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (orderError) {
        throw new Error('Failed to fetch order status');
      }

      if (!orderData) {
        throw new Error('Order not found');
      }

      // Direct table update instead of using RPC
      const { data, error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (!data) {
        throw new Error('Failed to update order status');
      }

      onSuccess?.(newStatus);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'clock';
      case 'processing':
        return 'refresh-cw';
      case 'shipped':
        return 'truck';
      case 'delivered':
        return 'check-circle';
      case 'cancelled':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusOptions = () => [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return {
    updateStatus,
    getStatusColor,
    getStatusIcon,
    getStatusOptions,
    loading,
    error,
  };
} 