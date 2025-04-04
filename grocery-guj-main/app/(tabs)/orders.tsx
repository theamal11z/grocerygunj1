import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Package, ChevronRight, Clock, Calendar, ShoppingBag, Filter } from 'lucide-react-native';
import { useOrders } from '@/hooks/useOrders';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { router } from 'expo-router';
import { formatDistanceToNow, format, isSameDay, subDays } from 'date-fns';
import Animated, { FadeIn } from 'react-native-reanimated';

type OrderFilter = 'all' | 'active' | 'completed';

export default function OrdersScreen() {
  const { orders, loading, error, fetchOrders } = useOrders();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getOrderStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return { color: '#2ECC71', bgColor: '#E8F5E9', label: 'Delivered', icon: Package };
      case 'out_for_delivery':
        return { color: '#2196F3', bgColor: '#E3F2FD', label: 'Out for Delivery', icon: Package };
      case 'in_progress':
        return { color: '#FFA000', bgColor: '#FFF3E0', label: 'In Progress', icon: Clock };
      case 'confirmed':
        return { color: '#9C27B0', bgColor: '#F3E5F5', label: 'Confirmed', icon: Package };
      case 'pending':
        return { color: '#607D8B', bgColor: '#ECEFF1', label: 'Pending', icon: Clock };
      case 'cancelled':
        return { color: '#F44336', bgColor: '#FFEBEE', label: 'Cancelled', icon: Package };
      default:
        return { color: '#666', bgColor: '#f5f5f5', label: status.replace('_', ' '), icon: Package };
    }
  };

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'active') return orders.filter(order => 
      ['pending', 'confirmed', 'in_progress', 'out_for_delivery'].includes(order.status.toLowerCase())
    );
    if (filter === 'completed') return orders.filter(order => 
      ['delivered', 'cancelled'].includes(order.status.toLowerCase())
    );
    return orders;
  }, [orders, filter]);

  // Group orders by date
  const groupedOrders = useMemo(() => {
    const groups: Record<string, typeof orders> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    const today = new Date();
    const yesterday = subDays(today, 1);
    const thisWeekStart = subDays(today, 7);

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.created_at);
      
      if (isSameDay(orderDate, today)) {
        groups.today.push(order);
      } else if (isSameDay(orderDate, yesterday)) {
        groups.yesterday.push(order);
      } else if (orderDate >= thisWeekStart) {
        groups.thisWeek.push(order);
      } else {
        groups.older.push(order);
      }
    });

    return groups;
  }, [filteredOrders]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load orders" />;
  }

  const getItemsPreview = (items: any[]) => {
    if (items.length === 1) return `${items[0].quantity}x ${items[0].product.name}`;
    return `${items.length} items (${items.reduce((sum, item) => sum + item.quantity, 0)} total)`;
  };

  const renderOrderStatusIcon = (status: string) => {
    const { icon: Icon, color } = getOrderStatus(status);
    return <Icon size={16} color={color} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'all' ? styles.activeFilter : {}]} 
            onPress={() => setFilter('all')}>
            <Text style={[styles.filterText, filter === 'all' ? styles.activeFilterText : {}]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'active' ? styles.activeFilter : {}]} 
            onPress={() => setFilter('active')}>
            <Text style={[styles.filterText, filter === 'active' ? styles.activeFilterText : {}]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'completed' ? styles.activeFilter : {}]} 
            onPress={() => setFilter('completed')}>
            <Text style={[styles.filterText, filter === 'completed' ? styles.activeFilterText : {}]}>Completed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptyText}>You don't have any {filter !== 'all' ? filter : ''} orders yet</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2ECC71']}
              tintColor="#2ECC71"
            />
          }
        >
          {/* Today's Orders */}
          {groupedOrders.today.length > 0 && (
            <View style={styles.dateSection}>
              <View style={styles.dateLabelContainer}>
                <Calendar size={16} color="#666" />
                <Text style={styles.dateLabel}>Today</Text>
              </View>
              
              {groupedOrders.today.map((order, index) => {
                const statusStyle = getOrderStatus(order.status);
                const totalAmount = order.total_amount;
                const deliveryFee = order.delivery_fee;
                const subtotal = totalAmount - deliveryFee;

                return (
                  <Animated.View 
                    key={order.id} 
                    entering={FadeIn.delay(index * 100)}
                  >
                    <TouchableOpacity 
                      style={styles.orderCard}
                      onPress={() => router.push({
                        pathname: '/order-tracking',
                        params: { orderId: order.id }
                      })}
                    >
                      <View style={styles.orderHeader}>
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderTime}>
                            {format(new Date(order.created_at), 'h:mm a')}
                          </Text>
                          <Text style={styles.orderTotal}>₹{totalAmount.toFixed(2)}</Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.bgColor }
                        ]}>
                          {renderOrderStatusIcon(order.status)}
                          <Text style={[
                            styles.statusText,
                            { color: statusStyle.color }
                          ]}>{statusStyle.label}</Text>
                        </View>
                      </View>

                      <View style={styles.orderContent}>
                        {order.items[0]?.product.image_urls?.[0] ? (
                          <Image 
                            source={{ uri: order.items[0].product.image_urls[0] }} 
                            style={styles.orderImage} 
                          />
                        ) : (
                          <View style={styles.placeholderImage}>
                            <Package size={24} color="#ccc" />
                          </View>
                        )}
                        <View style={styles.orderDetails}>
                          <View style={styles.itemsList}>
                            <Text style={styles.itemsPreview}>
                              {getItemsPreview(order.items)}
                            </Text>
                            <View style={styles.orderSummary}>
                              <Text style={styles.orderItemCount}>
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </Text>
                              {order.delivery_fee === 0 && (
                                <View style={styles.freeDeliveryBadge}>
                                  <Text style={styles.freeDeliveryText}>FREE DELIVERY</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.orderAction}>
                            <Text style={styles.trackText}>Track Order</Text>
                            <ChevronRight size={16} color="#666" />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* Yesterday's Orders */}
          {groupedOrders.yesterday.length > 0 && (
            <View style={styles.dateSection}>
              <View style={styles.dateLabelContainer}>
                <Calendar size={16} color="#666" />
                <Text style={styles.dateLabel}>Yesterday</Text>
              </View>
              
              {groupedOrders.yesterday.map((order, index) => {
                const statusStyle = getOrderStatus(order.status);
                const totalAmount = order.total_amount;

                return (
                  <Animated.View 
                    key={order.id} 
                    entering={FadeIn.delay(index * 100)}
                  >
                    <TouchableOpacity 
                      style={styles.orderCard}
                      onPress={() => router.push({
                        pathname: '/order-tracking',
                        params: { orderId: order.id }
                      })}
                    >
                      <View style={styles.orderHeader}>
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderTime}>
                            {format(new Date(order.created_at), 'h:mm a')}
                          </Text>
                          <Text style={styles.orderTotal}>₹{totalAmount.toFixed(2)}</Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.bgColor }
                        ]}>
                          {renderOrderStatusIcon(order.status)}
                          <Text style={[
                            styles.statusText,
                            { color: statusStyle.color }
                          ]}>{statusStyle.label}</Text>
                        </View>
                      </View>

                      <View style={styles.orderContent}>
                        {order.items[0]?.product.image_urls?.[0] ? (
                          <Image 
                            source={{ uri: order.items[0].product.image_urls[0] }} 
                            style={styles.orderImage} 
                          />
                        ) : (
                          <View style={styles.placeholderImage}>
                            <Package size={24} color="#ccc" />
                          </View>
                        )}
                        <View style={styles.orderDetails}>
                          <View style={styles.itemsList}>
                            <Text style={styles.itemsPreview}>
                              {getItemsPreview(order.items)}
                            </Text>
                            <View style={styles.orderSummary}>
                              <Text style={styles.orderItemCount}>
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </Text>
                              {order.delivery_fee === 0 && (
                                <View style={styles.freeDeliveryBadge}>
                                  <Text style={styles.freeDeliveryText}>FREE DELIVERY</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.orderAction}>
                            <Text style={styles.trackText}>Track Order</Text>
                            <ChevronRight size={16} color="#666" />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* This Week's Orders */}
          {groupedOrders.thisWeek.length > 0 && (
            <View style={styles.dateSection}>
              <View style={styles.dateLabelContainer}>
                <Calendar size={16} color="#666" />
                <Text style={styles.dateLabel}>This Week</Text>
              </View>
              
              {groupedOrders.thisWeek.map((order, index) => {
                const statusStyle = getOrderStatus(order.status);
                const totalAmount = order.total_amount;

                return (
                  <Animated.View 
                    key={order.id} 
                    entering={FadeIn.delay(index * 100)}
                  >
                    <TouchableOpacity 
                      style={styles.orderCard}
                      onPress={() => router.push({
                        pathname: '/order-tracking',
                        params: { orderId: order.id }
                      })}
                    >
                      <View style={styles.orderHeader}>
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderTime}>
                            {format(new Date(order.created_at), 'MMM d, h:mm a')}
                          </Text>
                          <Text style={styles.orderTotal}>₹{totalAmount.toFixed(2)}</Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.bgColor }
                        ]}>
                          {renderOrderStatusIcon(order.status)}
                          <Text style={[
                            styles.statusText,
                            { color: statusStyle.color }
                          ]}>{statusStyle.label}</Text>
                        </View>
                      </View>

                      <View style={styles.orderContent}>
                        {order.items[0]?.product.image_urls?.[0] ? (
                          <Image 
                            source={{ uri: order.items[0].product.image_urls[0] }} 
                            style={styles.orderImage} 
                          />
                        ) : (
                          <View style={styles.placeholderImage}>
                            <Package size={24} color="#ccc" />
                          </View>
                        )}
                        <View style={styles.orderDetails}>
                          <View style={styles.itemsList}>
                            <Text style={styles.itemsPreview}>
                              {getItemsPreview(order.items)}
                            </Text>
                            <View style={styles.orderSummary}>
                              <Text style={styles.orderItemCount}>
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </Text>
                              {order.delivery_fee === 0 && (
                                <View style={styles.freeDeliveryBadge}>
                                  <Text style={styles.freeDeliveryText}>FREE DELIVERY</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.orderAction}>
                            <Text style={styles.trackText}>Track Order</Text>
                            <ChevronRight size={16} color="#666" />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* Older Orders */}
          {groupedOrders.older.length > 0 && (
            <View style={styles.dateSection}>
              <View style={styles.dateLabelContainer}>
                <Calendar size={16} color="#666" />
                <Text style={styles.dateLabel}>Earlier</Text>
              </View>
              
              {groupedOrders.older.map((order, index) => {
                const statusStyle = getOrderStatus(order.status);
                const totalAmount = order.total_amount;

                return (
                  <Animated.View 
                    key={order.id} 
                    entering={FadeIn.delay(index * 100)}
                  >
                    <TouchableOpacity 
                      style={styles.orderCard}
                      onPress={() => router.push({
                        pathname: '/order-tracking',
                        params: { orderId: order.id }
                      })}
                    >
                      <View style={styles.orderHeader}>
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderTime}>
                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </Text>
                          <Text style={styles.orderTotal}>₹{totalAmount.toFixed(2)}</Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.bgColor }
                        ]}>
                          {renderOrderStatusIcon(order.status)}
                          <Text style={[
                            styles.statusText,
                            { color: statusStyle.color }
                          ]}>{statusStyle.label}</Text>
                        </View>
                      </View>

                      <View style={styles.orderContent}>
                        {order.items[0]?.product.image_urls?.[0] ? (
                          <Image 
                            source={{ uri: order.items[0].product.image_urls[0] }} 
                            style={styles.orderImage} 
                          />
                        ) : (
                          <View style={styles.placeholderImage}>
                            <Package size={24} color="#ccc" />
                          </View>
                        )}
                        <View style={styles.orderDetails}>
                          <View style={styles.itemsList}>
                            <Text style={styles.itemsPreview}>
                              {getItemsPreview(order.items)}
                            </Text>
                            <View style={styles.orderSummary}>
                              <Text style={styles.orderItemCount}>
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </Text>
                              {order.delivery_fee === 0 && (
                                <View style={styles.freeDeliveryBadge}>
                                  <Text style={styles.freeDeliveryText}>FREE DELIVERY</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.orderAction}>
                            <Text style={styles.trackText}>Track Order</Text>
                            <ChevronRight size={16} color="#666" />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeFilter: {
    backgroundColor: '#2ECC71',
  },
  filterText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  ordersList: {
    flex: 1,
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  shopButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  dateSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dateLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderTime: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderTotal: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    marginLeft: 4,
  },
  orderContent: {
    flexDirection: 'row',
  },
  orderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  itemsList: {
    marginBottom: 12,
  },
  itemsPreview: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  orderSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  freeDeliveryBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  freeDeliveryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#2ECC71',
  },
  orderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
  },
  trackText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});