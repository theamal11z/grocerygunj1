import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderDetails {
  order: Database['public']['Tables']['orders']['Row'];
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      image_url: string;
    };
  }>;
}

interface OrderListItem {
  order: Database['public']['Tables']['orders']['Row'];
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  items_count: number;
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (filters?: {
    status?: OrderStatus;
    dateFrom?: Date;
    dateTo?: Date;
    searchQuery?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_orders_list', {
          status_filter: filters?.status,
          date_from: filters?.dateFrom?.toISOString(),
          date_to: filters?.dateTo?.toISOString(),
          search_query: filters?.searchQuery,
        });

      if (fetchError) {
        throw fetchError;
      }

      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_order_details', { order_id: orderId });

      if (fetchError) {
        throw fetchError;
      }

      setSelectedOrder(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .rpc('update_order_status', {
          order_id: orderId,
          new_status: newStatus,
        });

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order.id === orderId
            ? { ...order, order: { ...order.order, status: newStatus } }
            : order
        )
      );

      if (selectedOrder?.order.id === orderId) {
        setSelectedOrder(prev =>
          prev ? { ...prev, order: { ...prev.order, status: newStatus } } : null
        );
      }

      return data;
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    selectedOrder,
    loading,
    error,
    fetchOrders,
    fetchOrderDetails,
    updateOrderStatus,
  };
} 