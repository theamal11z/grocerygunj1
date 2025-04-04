import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Linking, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
  Alert,
  FlatList
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { 
  ChevronLeft, 
  MapPin, 
  Package, 
  Truck, 
  Home, 
  CheckCircle, 
  Phone, 
  Clock,
  ExternalLink,
  AlertCircle,
  Sparkles,
  CalendarClock,
  Repeat,
  ArrowUpDown
} from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  SlideInRight, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolate,
  Extrapolate 
} from 'react-native-reanimated';
import { useOrders, OrderWithItems } from '@/hooks/useOrders';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { formatDistanceToNow, parseISO, format, isToday, isYesterday, addDays } from 'date-fns';
import { useAddresses } from '@/hooks/useAddresses';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Order, OrderItem, Product } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

// Type for delivery partner
interface DeliveryPartner {
  id?: string;
  name: string;
  phone: string;
  photo_url?: string;
  status?: string;
  is_available?: boolean;
  vehicle_type?: string;
  rating?: number;
  completed_deliveries?: number;
}

// Type for timeline event
interface TimelineEvent {
  title: string;
  description: string;
  completed: boolean;
  timestamp?: string | null;
  icon: React.ComponentType<any>;
}

// Order status mapping for UI display
type OrderStatusInfo = {
  label: string;
  color: string;
  bgColor: string;
  step: number;
  icon: any; // React Component type
};

const getOrderStatusInfo = (status: string): OrderStatusInfo => {
  const lowerStatus = status.toLowerCase();
  
  switch(lowerStatus) {
    case 'pending':
      return {
        label: 'Pending',
        color: '#FF9800',
        bgColor: '#FFF3E0',
        icon: Clock,
        step: 1
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        color: '#2196F3',
        bgColor: '#E3F2FD',
        icon: CheckCircle,
        step: 2
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        color: '#9C27B0',
        bgColor: '#F3E5F5',
        icon: Package,
        step: 3
      };
    case 'out_for_delivery':
      return {
        label: 'Out for Delivery',
        color: '#00BCD4',
        bgColor: '#E0F7FA',
        icon: Truck,
        step: 4
      };
    case 'delivered':
      return {
        label: 'Delivered',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        icon: Home,
        step: 5
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: '#F44336',
        bgColor: '#FFEBEE',
        icon: AlertCircle,
        step: 0
      };
    default:
      return {
        label: 'Processing',
        color: '#2196F3',
        bgColor: '#E3F2FD',
        icon: Package,
        step: 2
      };
  }
};

// Add a helper function to determine the payment status display
const getPaymentStatusInfo = (order: OrderWithItems) => {
  // For Cash on Delivery orders
  if (order.is_cash_on_delivery) {
    // If order is delivered, payment is confirmed
    if (order.status === 'delivered') {
      return {
        label: 'Confirmed',
        color: '#4CAF50'
      };
    } else {
      return {
        label: 'Pending',
        color: '#FF9800'
      };
    }
  } 
  // For online payments
  else {
    // Check the payment status field or assume paid for online payments
    return {
      label: (order as any).payment_status === 'paid' ? 'Paid' : 'Pending',
      color: (order as any).payment_status === 'paid' ? '#4CAF50' : '#FF9800'
    };
  }
};

export default function OrderTrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, loading: ordersLoading, error: ordersError, getOrderById } = useOrders();
  const { addresses, loading: addressesLoading } = useAddresses();
  const insets = useSafeAreaInsets();
  
  // State
  const [order, setOrder] = useState<OrderWithItems | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartner | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Animation values
  const headerOpacity = useSharedValue(0);
  const statusProgress = useSharedValue(0);
  const mapHeight = useSharedValue(0);
  const scrollY = useSharedValue(0);
  
  // References
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Status info based on current order status
  const orderStatusInfo = order 
    ? getOrderStatusInfo(order.status)
    : getOrderStatusInfo('pending');
    
  // Get address details
  const address = order?.delivery_address_id 
    ? addresses.find(a => a.id === order.delivery_address_id) 
    : undefined;

  // Enhanced fetch delivery partner data with real data
  const fetchDeliveryPartner = async (currentOrder: OrderWithItems) => {
    // Temporarily disabled since delivery partner functionality is not yet implemented
    setDeliveryPartner(null);
  };

  // Handle call delivery partner
  const handleCallDeliveryPartner = () => {
    // No-op for now since delivery partner functionality is not implemented
    Alert.alert('Feature Coming Soon', 'Delivery partner calling will be available in future updates.');
  };

  // Fetch order status history
  const fetchOrderStatusHistory = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
        
      if (!error && data && data.length > 0) {
        return data;
      }
      
      return null;
    } catch (err) {
      return null;
    }
  };

  // Get order timeline
  const getOrderTimeline = useCallback((): TimelineEvent[] => {
    const status = order?.status?.toLowerCase() || 'pending';
    const now = new Date().toISOString();
    
    // If no order, return empty timeline
    if (!order) {
      return [];
    }
    
    // Determine dates based on order creation and status
    const orderDate = order.created_at || now;
    const deliveryTime = order.estimated_delivery || now;
    
    try {
      // Calculate intermediate dates based on order creation and delivery time
      const creationDate = new Date(orderDate);
      const estimatedDeliveryDate = new Date(deliveryTime);
      const timeDiff = Math.max(
        estimatedDeliveryDate.getTime() - creationDate.getTime(),
        24 * 60 * 60 * 1000 // At least 24 hours difference if dates are invalid
      );
      
      // Distribute timestamps based on delivery timeline
      const confirmedDate = new Date(creationDate.getTime() + (timeDiff * 0.2));
      const inProgressDate = new Date(creationDate.getTime() + (timeDiff * 0.4));
      const outForDeliveryDate = new Date(creationDate.getTime() + (timeDiff * 0.7));
      
      return [
        {
          title: 'Order Placed',
          description: 'Your order has been received and is awaiting confirmation.',
          icon: Clock,
          completed: true,
          timestamp: orderDate
        },
        {
          title: 'Order Confirmed',
          description: 'We have confirmed your order and started preparing it.',
          icon: CheckCircle,
          completed: ['confirmed', 'in_progress', 'out_for_delivery', 'delivered'].includes(status),
          timestamp: ['confirmed', 'in_progress', 'out_for_delivery', 'delivered'].includes(status) ? 
            confirmedDate.toISOString() : undefined
        },
        {
          title: 'In Progress',
          description: status === 'in_progress' ? "We're carefully packing your items for shipment." : 'Order preparation completed',
          icon: Package,
          completed: ['in_progress', 'out_for_delivery', 'delivered'].includes(status),
          timestamp: ['in_progress', 'out_for_delivery', 'delivered'].includes(status) ? 
            inProgressDate.toISOString() : undefined
        },
        {
          title: 'Out for Delivery',
          description: status === 'out_for_delivery' ? 'Your order is on its way to your delivery address.' : 'Delivery initiated',
          icon: Truck,
          completed: ['out_for_delivery', 'delivered'].includes(status),
          timestamp: ['out_for_delivery', 'delivered'].includes(status) ? 
            outForDeliveryDate.toISOString() : undefined
        },
        {
          title: 'Delivered',
          description: 'Your order has been delivered successfully. Enjoy!',
          icon: Home,
          completed: ['delivered'].includes(status),
          timestamp: ['delivered'].includes(status) ? 
            deliveryTime : undefined
        }
      ];
    } catch (err) {
      // Fallback timeline in case of date parsing errors
      return [
        {
          title: 'Order Placed',
          description: 'Your order has been received and is awaiting confirmation.',
          icon: Clock,
          completed: true,
          timestamp: now
        },
        {
          title: 'Order Confirmed',
          description: 'We have confirmed your order and started preparing it.',
          icon: CheckCircle,
          completed: ['confirmed', 'in_progress', 'out_for_delivery', 'delivered'].includes(status),
          timestamp: undefined
        },
        {
          title: 'In Progress',
          description: status === 'in_progress' ? "We're carefully packing your items for shipment." : 'Order preparation completed',
          icon: Package,
          completed: ['in_progress', 'out_for_delivery', 'delivered'].includes(status),
          timestamp: undefined
        },
        {
          title: 'Out for Delivery',
          description: status === 'out_for_delivery' ? 'Your order is on its way to your delivery address.' : 'Delivery initiated',
          icon: Truck,
          completed: ['out_for_delivery', 'delivered'].includes(status),
          timestamp: undefined
        },
        {
          title: 'Delivered',
          description: 'Your order has been delivered successfully. Enjoy!',
          icon: Home,
          completed: ['delivered'].includes(status),
          timestamp: undefined
        }
      ];
    }
  }, [order]);
  
  // Calculate the timeline once
  const timeline = getOrderTimeline();

  // Fetch the order and subscribe to real-time updates
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
          
          // Fetch and use order status history if available
          await fetchOrderStatusHistory(orderId as string);
          
          // Update progress animation based on order status
          const statusStep = getOrderStatusInfo(foundOrder.status).step;
          const maxSteps = 5; // Total number of steps
          const progress = statusStep / maxSteps;
          
          // Animate the status progress
          statusProgress.value = withTiming(progress, { duration: 1000 });
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

    // Set up real-time subscription to order updates
    const orderSubscription = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          // Refresh order data when an update is detected
          loadOrderDetails();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      orderSubscription.unsubscribe();
    };
  }, [orderId, orders, getOrderById]);

  // Refresh order data manually with animation feedback
  const refreshOrderData = useCallback(async () => {
    try {
      setRefreshing(true);
      const refreshedOrder = await getOrderById(orderId as string);
      
      if (refreshedOrder) {
        setOrder(refreshedOrder);
        await fetchDeliveryPartner(refreshedOrder);
        
        // Update progress animation based on refreshed order status
        const statusStep = getOrderStatusInfo(refreshedOrder.status).step;
        const maxSteps = 5; // Total number of steps
        const progress = statusStep / maxSteps;
        
        // Animate the status progress
        statusProgress.value = withTiming(progress, { duration: 1000 });
      }
    } catch (err) {
      // Handle error silently
    } finally {
      setRefreshing(false);
    }
  }, [orderId, getOrderById, fetchDeliveryPartner]);

  // Handle scroll events to update animations
  const handleScroll = useCallback((event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    scrollY.value = scrollPosition;
    
    // Fade in header based on scroll position
    const headerFade = Math.min(scrollPosition / 100, 1);
    headerOpacity.value = headerFade;
  }, []);

  // Toggle map visibility with animation
  const toggleMap = useCallback(() => {
    const targetHeight = showMap ? 0 : 200;
    
    mapHeight.value = withTiming(targetHeight, { duration: 300 });
    setShowMap(!showMap);
  }, [showMap, mapHeight]);
  
  // Toggle item expansion
  const toggleItemExpansion = useCallback((itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  // Format date for display based on how recent it is
  const formatOrderDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      if (isToday(date)) {
        return `Today, ${format(date, 'h:mm a')}`;
      } else if (isYesterday(date)) {
        return `Yesterday, ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, yyyy h:mm a');
      }
    } catch (err) {
      return 'Date unavailable';
    }
  }, []);

  // Format estimated delivery date
  const formatEstimatedDelivery = useCallback((timestamp: string | null) => {
    if (!timestamp) return 'Not specified';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Not specified';
      }
      
      // Check if the date is today, tomorrow, or later
      if (isToday(date)) {
        return `Today, ${format(date, 'h:mm a')}`;
      } else if (isToday(addDays(new Date(), 1))) {
        return `Tomorrow, ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'EEE, MMM d, h:mm a');
      }
    } catch (err) {
      return 'Not specified';
    }
  }, []);

  // Get time ago in a readable format
  const getTimeAgo = useCallback((dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return 'recently';
    }
  }, []);

  // Define animated styles
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [
        { 
          translateY: interpolate(
            headerOpacity.value,
            [0, 1],
            [-20, 0],
            Extrapolate.CLAMP
          ) 
        }
      ]
    };
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${statusProgress.value * 100}%`,
    };
  });

  const animatedMapStyle = useAnimatedStyle(() => {
    return {
      height: mapHeight.value,
      overflow: mapHeight.value > 0 ? 'visible' : 'hidden',
      opacity: interpolate(
        mapHeight.value,
        [0, 100, 200],
        [0, 0.5, 1],
        Extrapolate.CLAMP
      )
    };
  });

  // Handle support contact
  const handleContactSupport = useCallback(() => {
    router.push('/help');
  }, []);

  // When calculating items total
  const calculateItemsTotal = (items?: Array<OrderItem & { product: Product }>) => {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, item) => {
      return total + (item.quantity * (item.unit_price || 0));
    }, 0);
  };

  // Animate the status progress when order status changes
  useEffect(() => {
    if (order) {
      const statusStep = getOrderStatusInfo(order.status).step;
      const maxSteps = 5; // Total number of steps
      const progress = statusStep / maxSteps;
      
      // Animate the status progress
      statusProgress.value = withTiming(progress, { duration: 1000 });
    }
  }, [order]);

  if (loading || ordersLoading || addressesLoading) {
    return <LoadingSpinner />;
  }

  if (error || ordersError) {
    return <ErrorMessage message={error || 'Failed to load order details'} />;
  }

  if (!order) {
    return <ErrorMessage message="Order not found" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Animated status bar at the top */}
      <Animated.View style={[styles.statusProgressContainer]}>
        <Animated.View style={[styles.statusProgressBar, animatedProgressStyle]} />
      </Animated.View>
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Tracking</Text>
        <TouchableOpacity style={styles.backButton} onPress={refreshOrderData}>
          <Repeat size={20} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Animated sticky header for scrolling */}
      <Animated.View style={[styles.stickyStatusHeader, animatedHeaderStyle]}>
        <View style={styles.stickyStatusContent}>
          <View>
            <Text style={styles.stickyOrderId}>
              Order #{order.id.substring(0, 8)}
            </Text>
            <Text style={styles.stickyStatusText}>
              {orderStatusInfo.label}
            </Text>
        </View>
          <View 
            style={[
              styles.statusBadge, 
              { backgroundColor: orderStatusInfo.bgColor }
            ]}>
            {React.createElement(orderStatusInfo.icon, {
              size: 14, 
              color: orderStatusInfo.color
            })}
            <Text 
              style={[
                styles.statusBadgeText, 
                { color: orderStatusInfo.color }
              ]}>
              {orderStatusInfo.label}
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshOrderData}
            colors={["#4CAF50"]}
            tintColor="#4CAF50"
          />
        }
      >
        {/* Order Status Card */}
        <Animated.View 
          entering={FadeIn} 
          style={styles.statusCard}
        >
          <View style={styles.statusCardHeader}>
            <View>
            <Text style={styles.statusTitle}>Order Status</Text>
              <View style={styles.statusRow}>
                <Text style={[
                  styles.statusValue,
                  { color: orderStatusInfo.color }
                ]}>
                  {orderStatusInfo.label}
              </Text>
                {order.status !== 'delivered' && order.estimated_delivery && (
                  <View style={styles.estimatedTimeContainer}>
                    <CalendarClock size={12} color="#666" />
                    <Text style={styles.estimatedTimeText}>
                      {formatEstimatedDelivery(order.estimated_delivery)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View 
              style={[
                styles.statusIconContainer, 
                { backgroundColor: orderStatusInfo.bgColor }
              ]}>
              {React.createElement(orderStatusInfo.icon, {
                size: 24, 
                color: orderStatusInfo.color
              })}
            </View>
          </View>
          
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderIdLabel}>
              Order ID: <Text style={styles.orderIdValue}>#{order.id.substring(0, 8)}</Text>
              </Text>
            <Text style={styles.orderDate}>
              {formatOrderDate(order.created_at)}
            </Text>
          </View>

          {/* Order progress bar */}
          <View style={styles.orderProgressContainer}>
            <View style={styles.orderProgressTrack}>
              <Animated.View style={[
                styles.orderProgressFill,
                { width: `${(orderStatusInfo.step / 5) * 100}%` }
              ]} />
            </View>
            <View style={styles.orderProgressSteps}>
              {Array.from({ length: 5 }).map((_, index) => (
                <View
                  key={`step-${index}`}
                  style={[
                    styles.orderProgressStep,
                    index < orderStatusInfo.step && styles.orderProgressStepCompleted
                  ]}
                />
              ))}
            </View>
          </View>
          
          {/* Current Status Message */}
          {order.status && (
            <View style={[styles.currentStatusMessage, { backgroundColor: orderStatusInfo.bgColor + '20' }]}>
              {order.status === 'pending' && (
                <Text style={[styles.statusMessageText, { color: orderStatusInfo.color }]}>
                  Your order has been received and is waiting to be confirmed.
                </Text>
              )}
              {order.status === 'confirmed' && (
                <Text style={[styles.statusMessageText, { color: orderStatusInfo.color }]}>
                  Your order has been confirmed and will be processed soon.
                </Text>
              )}
              {order.status === 'in_progress' && (
                <Text style={[styles.statusMessageText, { color: orderStatusInfo.color }]}>
                  We're preparing your items for shipment right now.
                </Text>
              )}
              {order.status === 'out_for_delivery' && (
                <Text style={[styles.statusMessageText, { color: orderStatusInfo.color }]}>
                  Your order is on its way to your delivery address.
                </Text>
              )}
              {order.status === 'delivered' && (
                <Text style={[styles.statusMessageText, { color: orderStatusInfo.color }]}>
                  Your order has been delivered successfully. Enjoy!
                </Text>
              )}
              {order.status === 'cancelled' && (
                <Text style={[styles.statusMessageText, { color: orderStatusInfo.color }]}>
                  This order has been cancelled.
                </Text>
              )}
            </View>
          )}
          </Animated.View>

        {/* Timeline View */}
              <Animated.View
          entering={FadeIn.delay(100)} 
          style={styles.timelineContainer}
        >
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          
          {timeline.map((event, index) => (
            <Animated.View
              key={event.title}
              entering={SlideInRight.delay(100 * (index + 1))}
              style={styles.timelineItem}
            >
                <View
                  style={[
                    styles.timelineIconContainer,
                  event.completed && { backgroundColor: orderStatusInfo.color }
                ]}
              >
                {React.createElement(event.icon, {
                  size: 16,
                  color: event.completed ? '#fff' : '#ccc'
                  })}
                </View>
              
                <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text
                    style={[
                      styles.timelineTitle,
                      event.completed && { color: orderStatusInfo.color }
                    ]}
                  >
                    {event.title}
                  </Text>
                  
                  {event.timestamp && event.completed && (
                    <Text style={styles.timelineTime}>
                      {getTimeAgo(event.timestamp)}
                    </Text>
                  )}
                </View>
                
                <Text style={styles.timelineDescription}>
                  {event.description}
                </Text>
              </View>
              
              {index < timeline.length - 1 && (
                  <View
                    style={[
                      styles.timelineConnector,
                    index < orderStatusInfo.step - 1 && { backgroundColor: orderStatusInfo.color }
                    ]}
                  />
                )}
              </Animated.View>
            ))}
          </Animated.View>

        {/* Delivery Address */}
        <Animated.View 
          entering={FadeIn.delay(400)} 
          style={styles.addressCard}
        >
          <View style={styles.addressHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {address && (
              <TouchableOpacity style={styles.viewMapButton} onPress={toggleMap}>
                <Text style={styles.viewMapText}>
                  {showMap ? 'Hide Map' : 'View Map'}
                    </Text>
                <ExternalLink size={14} color="#4CAF50" />
                  </TouchableOpacity>
            )}
                </View>
          
          {/* Map View */}
          {address && (
            <Animated.View style={[styles.mapContainer, animatedMapStyle]}>
              <View style={styles.mapPlaceholder}>
                <MapPin size={24} color="#4CAF50" />
                <Text style={styles.mapPlaceholderText}>
                  Map View Placeholder
                </Text>
              </View>
            </Animated.View>
          )}

            {address ? (
              <View style={styles.addressContent}>
                <MapPin size={20} color="#666" />
              <View style={styles.addressDetails}>
                <Text style={styles.addressType}>
                  {address.type || 'Delivery Address'}
                </Text>
                <Text style={styles.addressText}>
                  {address.address}
                  {address.area && `, ${address.area}`}
                  {address.city && `, ${address.city}`}
                  {(address as any).pincode && ` - ${(address as any).pincode}`}
                </Text>
              </View>
              </View>
            ) : (
            <View style={styles.noAddressContainer}>
              <AlertCircle size={20} color="#F44336" />
              <Text style={styles.noAddressText}>Address not found</Text>
            </View>
            )}
          </Animated.View>

        {/* Order Items */}
        <Animated.View 
          entering={FadeIn.delay(500)} 
          style={styles.orderItemsContainer}
        >
          <View style={styles.orderItemsHeader}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <TouchableOpacity
              onPress={() => {
                // Toggle all items
                const allExpanded = Object.values(expandedItems).every(v => v);
                const newState = !allExpanded;
                
                const updated: Record<string, boolean> = {};
                if (order?.items && order.items.length > 0) {
                  order.items.forEach(item => {
                    if (item.id) {
                      updated[item.id] = newState;
                    }
                  });
                }
                
                setExpandedItems(updated);
              }}
            >
              <ArrowUpDown size={16} color="#666" />
            </TouchableOpacity>
            </View>
          
          <View style={styles.orderItemsList}>
            {order?.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <Animated.View
                  key={item.id || index}
                  entering={FadeIn.delay(600 + (index * 100))}
                  style={styles.orderItem}
                >
                  <TouchableOpacity
                    style={styles.orderItemHeader}
                    onPress={() => item.id && toggleItemExpansion(item.id)}
                  >
                    <View style={styles.orderItemImageContainer}>
                      {item.product?.image_urls?.[0] ? (
                        <Image
                          source={{ uri: item.product.image_urls[0] }}
                          style={styles.orderItemImage}
                        />
                      ) : (
                        <View style={styles.orderItemPlaceholder}>
                          <Package size={16} color="#ccc" />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName} numberOfLines={2}>
                        {item.product?.name || 'Product'}
                      </Text>
                      <View style={styles.orderItemMeta}>
                        <Text style={styles.orderItemQuantity}>
                          Qty: {item.quantity || 0}
                        </Text>
                        <Text style={styles.orderItemPrice}>
                          ₹{((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  {item.id && expandedItems[item.id] && (
                    <View style={styles.orderItemDetails}>
                      <View style={styles.orderItemPriceBreakdown}>
                        <Text style={styles.orderItemDetailLabel}>Unit Price</Text>
                        <Text style={styles.orderItemDetailValue}>
                          ₹{(item.unit_price || 0).toFixed(2)}
                        </Text>
                      </View>
                      
                      <View style={styles.orderItemPriceBreakdown}>
                        <Text style={styles.orderItemDetailLabel}>Quantity</Text>
                        <Text style={styles.orderItemDetailValue}>
                          {item.quantity || 0}
                        </Text>
                      </View>
                      
                      <View style={styles.orderItemPriceBreakdown}>
                        <Text style={styles.orderItemDetailLabel}>Total</Text>
                        <Text style={styles.orderItemDetailValue}>
                          ₹{((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  )}
                </Animated.View>
              ))
            ) : (
              <View style={styles.noItemsContainer}>
                <Text style={styles.noItemsText}>No items in this order</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Order Summary */}
        <Animated.View 
          entering={FadeIn.delay(600)} 
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Payment Summary</Text>

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{(order.sub_total || 0).toFixed(2)}</Text>
              </View>
              
              {(order.discount_amount || 0) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountText]}>
                  -₹{(order.discount_amount || 0).toFixed(2)}
                </Text>
                </View>
              )}
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {(order.delivery_fee || 0) > 0 
                  ? `₹${(order.delivery_fee || 0).toFixed(2)}` 
                  : <Text style={styles.freeText}>FREE</Text>
                }
              </Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{(order.total_amount || 0).toFixed(2)}</Text>
              </View>
            
            <View style={styles.paymentMethodContainer}>
              <View>
                <Text style={styles.paymentMethodLabel}>
                  {order.is_cash_on_delivery 
                    ? 'Cash on Delivery' 
                    : 'Online Payment'
                  }
                </Text>
                {order.is_cash_on_delivery && order.status !== 'delivered' && (
                  <Text style={styles.paymentNote}>
                    Payment will be confirmed upon delivery
                  </Text>
                )}
              </View>
              <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusInfo(order).color + '20' }]}>
                <Text style={[styles.paymentStatus, { color: getPaymentStatusInfo(order).color }]}>
                  {getPaymentStatusInfo(order).label}
                </Text>
              </View>
            </View>
            </View>
          </Animated.View>
        
        {/* Space for footer */}
        <View style={{ height: 100 }} />
        </ScrollView>

      {/* Footer with support button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity 
            style={styles.supportButton}
          onPress={handleContactSupport}
        >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  statusProgressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#ECEFF1',
    zIndex: 10,
  },
  statusProgressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#111',
  },
  stickyStatusHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 80,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stickyStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyOrderId: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  stickyStatusText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#111',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#111',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    marginRight: 8,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estimatedTimeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  orderIdValue: {
    fontFamily: 'Poppins-Medium',
    color: '#111',
  },
  orderDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  orderProgressContainer: {
    marginTop: 8,
  },
  orderProgressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#ECEFF1',
    borderRadius: 2,
    marginBottom: 8,
  },
  orderProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  orderProgressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderProgressStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ECEFF1',
  },
  orderProgressStepCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#111',
    marginBottom: 16,
  },
  timelineContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  timelineItem: {
    position: 'relative',
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#111',
  },
  timelineTime: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  timelineDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  timelineConnector: {
    position: 'absolute',
    top: 32,
    left: 15,
    width: 2,
    bottom: -8,
    backgroundColor: '#ECEFF1',
    zIndex: 1,
  },
  deliveryPartnerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  partnerCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  partnerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  partnerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  partnerInitials: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#2196F3',
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#111',
    marginBottom: 4,
  },
  partnerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  vehicleTypeContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  vehicleTypeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  deliveryStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deliveryStatusText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2196F3',
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMapText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 4,
  },
  mapContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholderText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  addressType: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#111',
    marginBottom: 4,
  },
  addressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
  },
  noAddressText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
  },
  orderItemsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderItemsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderItem: {
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  orderItemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  orderItemImage: {
    width: 60,
    height: 60,
  },
  orderItemPlaceholder: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#111',
    marginBottom: 4,
  },
  orderItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemQuantity: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
  },
  orderItemPrice: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#111',
  },
  orderItemDetails: {
    padding: 12,
    paddingTop: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderItemPriceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orderItemDetailLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
  },
  orderItemDetailValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#111',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#111',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  totalLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#111',
  },
  totalValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#4CAF50',
  },
  discountText: {
    color: '#4CAF50',
  },
  freeText: {
    color: '#4CAF50',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginTop: 16,
    borderRadius: 12,
  },
  paymentMethodLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#111',
  },
  paymentStatus: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  paymentNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  supportButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  supportButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  currentStatusMessage: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  statusMessageText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  noItemsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  noItemsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
});