import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useCart } from './useCart';
import type { Order, OrderItem, Product } from '@/lib/supabase';

export type OrderWithItems = Order & { 
  items: (OrderItem & { product: Product })[] 
};

export type CreateOrderData = {
  delivery_address_id: string | null;
  payment_method_id: string | null;
  estimated_delivery?: string | null;
  delivery_fee?: number;
  is_cash_on_delivery?: boolean;
  applied_coupon_id?: string | null;
  discount_amount?: number;
};

export function useOrders() {
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [orderStats, setOrderStats] = useState({
    completedOrders: 0,
    pendingOrders: 0,
    totalSavings: 0
  });

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setOrderStats({
        completedOrders: 0,
        pendingOrders: 0,
        totalSavings: 0
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(data || []);
      
      // Calculate stats after fetching orders
      if (data) {
        const completedOrders = data.filter(order => 
          order.status.toLowerCase() === 'delivered').length;
        
        const pendingOrders = data.filter(order => 
          ['pending', 'processing', 'in_progress'].includes(order.status.toLowerCase())).length;
        
        const totalSavings = data.reduce((sum, order) => {
          const orderTotal = order.items.reduce((total: number, item: OrderItem & { product: Product }) => 
            total + (item.quantity * (item.unit_price || 0)), 0
          );
          // Calculate savings based on a 10% discount assumption
          return sum + (orderTotal * 0.1);
        }, 0);

        setOrderStats({
          completedOrders,
          pendingOrders,
          totalSavings
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createOrderItems = useCallback(async (orderId: string, items: typeof cartItems) => {
    if (!items.length) return [];

    const orderItems = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.product.price || 0
    }));

    try {
      const { data, error } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (error) throw error;
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  // Function to fetch delivery fee from settings
  const getDeliveryFee = async () => {
    try {
      console.log('Fetching delivery fee from settings...');
      const { data, error } = await supabase
        .from('settings')
        .select('settings_data')
        .limit(1)
        .single();
        
      if (error) {
        return 40; // Default fallback value
      }

      console.log('Settings data received:', data?.settings_data);
      
      // Explicitly check for deliverySettings path
      if (data?.settings_data?.deliverySettings?.deliveryFee !== undefined) {
        const fee = data.settings_data.deliverySettings.deliveryFee;
        console.log('Found delivery fee in settings:', fee);
        return fee;
      } else {
        console.log('No delivery fee found in settings, using default');
        return 40; // Default fallback value
      }
    } catch (err) {
      return 40; // Default fallback value
    }
  };

  // Function to check if order qualifies for free delivery
  const checkFreeDeliveryEligibility = async (subtotal: number) => {
    try {
      console.log('Checking free delivery eligibility, subtotal:', subtotal);
      const { data, error } = await supabase
        .from('settings')
        .select('settings_data')
        .limit(1)
        .single();
        
      if (error) {
        return false;
      }
      
      console.log('Settings for free delivery check:', data?.settings_data);
      
      const enableFreeDelivery = data?.settings_data?.deliverySettings?.enableFreeDelivery || false;
      const threshold = data?.settings_data?.deliverySettings?.freeDeliveryThreshold || null;
      
      console.log('Free delivery enabled:', enableFreeDelivery);
      console.log('Free delivery threshold:', threshold);
      
      if (enableFreeDelivery && threshold !== null && subtotal >= threshold) {
        console.log('Order qualifies for free delivery');
        return true;
      }
      
      console.log('Order does not qualify for free delivery');
      return false;
    } catch (err) {
      return false;
    }
  };

  const createOrder = useCallback(async (orderData: CreateOrderData) => {
    if (!user || !cartItems.length) return null;
    
    // Validate required fields
    if (!orderData.delivery_address_id) {
      setError(new Error('Delivery address is required'));
      return null;
    }
    
    // If not cash on delivery, payment method is required
    if (!orderData.is_cash_on_delivery && !orderData.payment_method_id) {
      setError(new Error('Payment method is required'));
      return null;
    }

    try {
      setError(null);
      
      // Calculate subtotal
      const subtotal = cartItems.reduce((total, item) => {
        const price = item.product?.price || 0;
        return total + price * item.quantity;
      }, 0);
      
      // Determine delivery fee
      let deliveryFee = orderData.delivery_fee ?? 0; // Default to 0 if undefined
      if (deliveryFee === 0 && orderData.delivery_fee === undefined) {
        const isFreeDelivery = await checkFreeDeliveryEligibility(subtotal);
        deliveryFee = isFreeDelivery ? 0 : await getDeliveryFee();
      }
      
      // Prepare the order data
      const orderInsertData = {
        user_id: user.id,
        delivery_address_id: orderData.delivery_address_id,
        payment_method_id: orderData.payment_method_id,
        status: 'pending',
        delivery_fee: deliveryFee,
        sub_total: subtotal,
        discount_amount: orderData.discount_amount || 0,
        total_amount: subtotal - (orderData.discount_amount || 0) + deliveryFee,
        estimated_delivery: orderData.estimated_delivery || null,
        is_cash_on_delivery: orderData.is_cash_on_delivery || false,
        applied_coupon_id: orderData.applied_coupon_id || null
      };
      
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Then create the order items
      await createOrderItems(order.id, cartItems);
      
      // Clear the cart after successful order creation
      await clearCart();
      
      // Refresh orders list
      await fetchOrders();
      
      return order;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create order'));
      return null;
    }
  }, [user, cartItems, createOrderItems, clearCart, fetchOrders]);

  const getOrderById = useCallback(async (orderId: string): Promise<OrderWithItems | undefined> => {
    if (!user) return undefined;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      return data as OrderWithItems;
    } catch (err) {
      return undefined;
    }
  }, [user]);

  // Calculate order statistics
  const calculateOrderStats = useCallback(() => {
    if (!orders.length) {
      setOrderStats({
        completedOrders: 0,
        pendingOrders: 0,
        totalSavings: 0
      });
      return;
    }

    const completedOrders = orders.filter(order => 
      order.status.toLowerCase() === 'delivered').length;
    
    const pendingOrders = orders.filter(order => 
      ['pending', 'processing', 'in_progress'].includes(order.status.toLowerCase())).length;
    
    const totalSavings = orders.reduce((sum, order) => {
      const orderTotal = order.items.reduce((total: number, item: OrderItem & { product: Product }) => 
        total + (item.quantity * (item.unit_price || 0)), 0
      );
      // Calculate savings based on a 10% discount assumption
      // In a real app, this would be based on actual discount data
      return sum + (orderTotal * 0.1);
    }, 0);

    setOrderStats({
      completedOrders,
      pendingOrders,
      totalSavings
    });
  }, [orders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, user]);

  useEffect(() => {
    calculateOrderStats();
  }, [calculateOrderStats, orders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    getOrderById,
    orderStats
  };
}