import React, { useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Minus, Plus, ChevronLeft, Trash2, ShoppingCart, Ticket, X } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';

export default function CartScreen() {
  const { 
    cartItems, 
    loading: cartLoading, 
    error, 
    updateCartItemQuantity, 
    removeFromCart,
    getCartTotals,
    appliedCoupon
  } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { deliverySettings, loading: settingsLoading } = useSettings();

  const { subtotal, itemCount, discountAmount, discountedSubtotal } = getCartTotals();
  const isFreeDelivery = deliverySettings.enableFreeDelivery && 
    deliverySettings.freeDeliveryThreshold !== null && 
    subtotal >= deliverySettings.freeDeliveryThreshold;
  const finalDeliveryFee = isFreeDelivery ? 0 : deliverySettings.deliveryFee;
  const total = discountedSubtotal + finalDeliveryFee;

  // Fetch settings on component mount
  useEffect(() => {
    // The useSettings hook handles fetch on mount
  }, []);

  const updateQuantity = async (id: string, change: number) => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity > 0) {
        await updateCartItemQuantity(id, newQuantity);
      }
    }
  };

  const removeItem = async (id: string) => {
    await removeFromCart(id);
  };

  // If user is not logged in, show login prompt
  if (!authLoading && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Shopping Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.emptyStateContainer}>
          <ShoppingCart size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>Please Sign In</Text>
          <Text style={styles.emptyStateText}>
            You need to be signed in to view your cart
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth')}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading state
  if (authLoading || cartLoading || settingsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Shopping Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={styles.loadingText}>Loading your cart...</Text>
        </View>
      </View>
    );
  }

  // Show empty cart state
  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Shopping Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.emptyStateContainer}>
          <ShoppingCart size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyStateText}>
            Add items to your cart to see them here
          </Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => router.push('/(tabs)')}>
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Shopping Cart ({itemCount})</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.itemsList}>
        {cartItems.map((item) => (
          <Animated.View
            key={item.id}
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={styles.cartItem}>
            <Image source={{ uri: item.product?.image_urls?.[0] || '' }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product?.name}</Text>
              <Text style={styles.itemPrice}>₹{item.product?.price}</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, -1)}>
                  <Minus size={16} color="#666" />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, 1)}>
                  <Plus size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(item.id)}>
              <Trash2 size={20} color="#FF4B4B" />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Coupon Information */}
      {appliedCoupon && (
        <View style={styles.appliedCouponContainer}>
          <View style={styles.couponInfo}>
            <Ticket size={18} color="#2ECC71" />
            <View style={styles.couponDetails}>
              <Text style={styles.couponCode}>{appliedCoupon.code}</Text>
              <Text style={styles.couponDiscount}>{appliedCoupon.discount} discount applied</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        
        {appliedCoupon && discountAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount ({appliedCoupon.code})</Text>
            <Text style={[styles.summaryValue, styles.discountText]}>-₹{discountAmount.toFixed(2)}</Text>
          </View>
        )}
        
        <View style={styles.summaryRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            {isFreeDelivery && (
              <View style={styles.freeDeliveryBadge}>
                <Text style={styles.freeDeliveryText}>FREE</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.summaryValue,
            isFreeDelivery ? { textDecorationLine: 'line-through', marginRight: 5 } : {}
          ]}>
            ₹{deliverySettings.deliveryFee.toFixed(2)}
          </Text>
          {isFreeDelivery && (
            <Text style={[styles.summaryValue, { color: '#2ECC71' }]}>₹0.00</Text>
          )}
        </View>
        
        {deliverySettings.enableFreeDelivery && 
          deliverySettings.freeDeliveryThreshold !== null && 
          !isFreeDelivery && (
          <Text style={styles.freeDeliveryInfo}>
            Add ₹{(deliverySettings.freeDeliveryThreshold - subtotal).toFixed(2)} more for free delivery
          </Text>
        )}
        
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => {
            if (user) {
              router.push('/checkout');
            } else {
              router.push('/auth');
            }
          }}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#333',
  },
  itemsList: {
    flex: 1,
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#2ECC71',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  summary: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginVertical: 12,
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
  checkoutButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shopNowButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  signInButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signInButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  freeDeliveryBadge: {
    backgroundColor: '#2ECC71',
    borderRadius: 4,
    padding: 4,
    marginLeft: 8,
  },
  freeDeliveryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#fff',
  },
  freeDeliveryInfo: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1FFF6',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D9F3E3',
  },
  couponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponDetails: {
    marginLeft: 10,
  },
  couponCode: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  couponDiscount: {
    fontSize: 12,
    color: '#2ECC71',
    marginTop: 2,
  },
  discountText: {
    color: '#2ECC71',
  },
});