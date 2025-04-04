import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck as CheckCircle2, Package, MapPin, Clock, CreditCard } from 'lucide-react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useOrders, OrderWithItems } from '@/hooks/useOrders';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { format, parseISO } from 'date-fns';
import { useAddresses } from '@/hooks/useAddresses';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';

export default function OrderConfirmationScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, loading: ordersLoading, error: ordersError, getOrderById } = useOrders();
  const { addresses, loading: addressesLoading } = useAddresses();
  const { paymentMethods, loading: paymentsLoading } = usePaymentMethods();
  
  const [order, setOrder] = useState<OrderWithItems | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        
        if (!orderId) {
          setError('Order ID is missing');
          return;
        }
        
        // Try to get the order from the orders state first
        let foundOrder = orders.find(o => o.id === orderId);
        
        // If not found, fetch it directly
        if (!foundOrder) {
          foundOrder = await getOrderById(orderId as string);
        }
        
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    
    loadOrderDetails();
  }, [orderId, orders, getOrderById]);

  if (loading || ordersLoading || addressesLoading || paymentsLoading) {
    return <LoadingSpinner />;
  }

  if (error || ordersError) {
    return <ErrorMessage message={error || 'Failed to load order details'} />;
  }

  if (!order) {
    return <ErrorMessage message="Order not found" />;
  }

  // Get address and payment method details
  const address = order?.delivery_address_id 
    ? addresses.find(a => a.id === order.delivery_address_id) 
    : undefined;
    
  const paymentMethod = order?.payment_method_id 
    ? paymentMethods.find(p => p.id === order.payment_method_id) 
    : undefined;

  // Format delivery time
  const formatDeliveryTime = (timestamp: string | null) => {
    if (!timestamp) return 'Not specified';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Not specified';
      }
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (err) {
      
      return 'Not specified';
    }
  };

  // Calculate order summary
  const orderSummary = {
    subtotal: order ? order.total_amount - order.delivery_fee : 0,
    deliveryFee: order?.delivery_fee || 0,
    total: order?.total_amount || 0,
    itemCount: order?.items.length || 0
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={styles.header}>
          <View style={styles.iconContainer}>
            <CheckCircle2 size={48} color="#2ECC71" />
          </View>
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.subtitle}>Your order has been placed successfully</Text>
        </Animated.View>

        <Animated.View
          entering={SlideInUp.delay(200)}
          style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{order.id}</Text>
          <Text style={styles.orderDate}>
            {format(new Date(order.created_at), 'MMMM d, yyyy')} at{' '}
            {format(new Date(order.created_at), 'h:mm a')}
          </Text>
        </Animated.View>

        <Animated.View
          entering={SlideInUp.delay(300)}
          style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.detailsSection}>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Subtotal</Text>
              <Text style={styles.detailsValue}>₹{order.sub_total.toFixed(2)}</Text>
            </View>
            
            {order.discount_amount > 0 && (
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Discount</Text>
                <Text style={[styles.detailsValue, styles.discountText]}>-₹{order.discount_amount.toFixed(2)}</Text>
              </View>
            )}
            
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Delivery Fee</Text>
              <Text style={styles.detailsValue}>₹{order.delivery_fee.toFixed(2)}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{order.total_amount.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.itemsList}>
            {order.items.map((item: any, index: number) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  ₹{(item.quantity * (item.unit_price || item.product.price || 0)).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          entering={SlideInUp.delay(400)}
          style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.deliveryCard}>
            <View style={styles.deliveryRow}>
              <MapPin size={20} color="#666" />
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryLabel}>Delivery Address</Text>
                {address ? (
                  <Text style={styles.deliveryValue}>
                    {address.address}, {address.area}, {address.city}
                  </Text>
                ) : (
                  <Text style={styles.deliveryValue}>Address not found</Text>
                )}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.deliveryRow}>
              <Clock size={20} color="#666" />
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryLabel}>Estimated Delivery Time</Text>
                <Text style={styles.deliveryValue}>
                  {order.estimated_delivery ? 
                    formatDeliveryTime(order.estimated_delivery) : 
                    '30-45 minutes'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.deliveryRow}>
              <CreditCard size={20} color="#666" />
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryLabel}>Payment Method</Text>
                {order.is_cash_on_delivery ? (
                  <Text style={styles.deliveryValue}>Cash on Delivery</Text>
                ) : paymentMethod ? (
                  <Text style={styles.deliveryValue}>
                    {paymentMethod.type}
                    {paymentMethod.last_four ? ` (**** ${paymentMethod.last_four})` : ''}
                  </Text>
                ) : (
                  <Text style={styles.deliveryValue}>Payment method not found</Text>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => router.push({
            pathname: '/order-tracking',
            params: { orderId: order.id }
          })}>
          <Package size={20} color="#fff" />
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#E8F5E9',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
  },
  orderInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  orderNumber: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  itemsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
  },
  itemQuantity: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginVertical: 12,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  detailsValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#2ECC71',
  },
  discountText: {
    color: '#2ECC71',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  totalValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#2ECC71',
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  deliveryLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deliveryValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    gap: 12,
  },
  trackButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  homeButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
  },
});