import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar
} from 'react-native';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  Trash2,
  ShoppingCart,
  ShoppingBag
} from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { 
  FadeInUp, 
  FadeOutDown, 
  SlideInRight, 
  SlideOutLeft,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { CartItemWithProduct } from '@/lib/CartContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Define a type for the renderItem parameter
type RenderItemParams = {
  item: CartItemWithProduct;
  index: number;
};

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { 
    cartItems, 
    loading: cartLoading, 
    error, 
    updateCartItemQuantity, 
    removeFromCart,
    getCartTotals,
    fetchCartItems: refreshCartItems
  } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { deliverySettings, loading: settingsLoading } = useSettings();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  
  // Get cart totals
  const { subtotal, itemCount, discountedSubtotal } = getCartTotals();
  const isFreeDelivery = deliverySettings.enableFreeDelivery && 
    deliverySettings.freeDeliveryThreshold !== null && 
    subtotal >= deliverySettings.freeDeliveryThreshold;
  const finalDeliveryFee = isFreeDelivery ? 0 : deliverySettings.deliveryFee;
  const total = discountedSubtotal + finalDeliveryFee;

  // Refresh cart data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Re-fetch cart items using the renamed function
      await refreshCartItems();
    } catch (error) {
      console.error("Error refreshing cart:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCartItems]);

  // Update item quantity with loading state
  const updateQuantity = async (id: string, change: number) => {
    setProcessingItemId(id);
    try {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity > 0) {
        await updateCartItemQuantity(id, newQuantity);
      }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity');
    } finally {
      setProcessingItemId(null);
    }
  };

  // Remove item with loading state
  const removeItem = async (id: string) => {
    setProcessingItemId(`remove-${id}`);
    try {
    await removeFromCart(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item');
    } finally {
      setProcessingItemId(null);
    }
  };

  // Render cart item component
  const renderItem = useCallback(({ item, index }: RenderItemParams) => (
    <Animated.View
      key={item.id}
      entering={SlideInRight.delay(index * 100).duration(300)}
      exiting={SlideOutLeft.duration(200)}
      style={styles.cartItem}>
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/product/[id]',
          params: { id: item.product_id }
        })}
        style={styles.itemImageContainer}
      >
        <Image 
          source={{ uri: item.product?.image_urls?.[0] || '' }} 
          style={styles.itemImage} 
          resizeMode="cover"
        />
      </TouchableOpacity>
      
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={2}>{item.product?.name}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(item.id)}
            disabled={processingItemId === `remove-${item.id}`}>
            {processingItemId === `remove-${item.id}` ? (
              <ActivityIndicator size="small" color="#FF4B4B" />
            ) : (
              <Trash2 size={18} color="#FF4B4B" />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.itemUnit}>{item.product?.unit}</Text>
        
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>₹{item.product?.price}</Text>
          
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                item.quantity === 1 && styles.quantityButtonDisabled
              ]}
              onPress={() => updateQuantity(item.id, -1)}
              disabled={item.quantity === 1 || processingItemId === item.id}>
              <Minus size={14} color={item.quantity === 1 ? "#ccc" : "#666"} />
            </TouchableOpacity>
            
            {processingItemId === item.id ? (
              <View style={styles.quantityLoadingContainer}>
                <ActivityIndicator size="small" color="#2ECC71" />
              </View>
            ) : (
              <Text style={styles.quantity}>{item.quantity}</Text>
            )}
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, 1)}
              disabled={processingItemId === item.id}>
              <Plus size={14} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  ), [processingItemId]);

  // Empty cart component
  const EmptyCart = () => (
    <View style={styles.emptyStateContainer}>
      <ShoppingBag size={70} color="#f0f0f0" />
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
  );
  
  // Login prompt component
  const LoginPrompt = () => (
        <View style={styles.emptyStateContainer}>
      <Animated.View entering={FadeIn.duration(400)}>
        <ShoppingCart size={70} color="#f0f0f0" />
      </Animated.View>
      <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <Text style={styles.emptyStateTitle}>Please Sign In</Text>
          <Text style={styles.emptyStateText}>
            You need to be signed in to view your cart
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth')}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
      </Animated.View>
        </View>
  );
  
  // Loading component
  const Loading = () => (
    <View style={styles.emptyStateContainer}>
      <ActivityIndicator size="large" color="#2ECC71" />
      <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );

  // If user is not logged in, show login prompt
  if (!authLoading && !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Shopping Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <LoginPrompt />
      </View>
    );
  }

  // Show loading state
  if (authLoading || (cartLoading && !refreshing) || settingsLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Shopping Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <Loading />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Shopping Cart {itemCount > 0 && `(${itemCount})`}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          cartItems.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyCart}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2ECC71']}
            tintColor="#2ECC71"
          />
        }
      />

      {cartItems.length > 0 && (
        <View style={styles.bottomContainer}>
          {/* Order Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        
          <View style={styles.summaryRow}>
              <View style={styles.deliveryFeeContainer}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            {isFreeDelivery && (
              <View style={styles.freeDeliveryBadge}>
                <Text style={styles.freeDeliveryText}>FREE</Text>
              </View>
            )}
          </View>
              <View style={styles.deliveryFeeValueContainer}>
                {isFreeDelivery ? (
                  <>
                    <Text style={[styles.summaryValue, styles.strikethrough]}>
            ₹{deliverySettings.deliveryFee.toFixed(2)}
          </Text>
                    <Text style={styles.freeValue}>₹0.00</Text>
                  </>
                ) : (
                  <Text style={styles.summaryValue}>₹{deliverySettings.deliveryFee.toFixed(2)}</Text>
                )}
              </View>
        </View>
        
        {deliverySettings.enableFreeDelivery && 
          deliverySettings.freeDeliveryThreshold !== null && 
          !isFreeDelivery && (
              <View style={styles.freeDeliveryInfoContainer}>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(100, (subtotal / deliverySettings.freeDeliveryThreshold) * 100)}%` }
                    ]} 
                  />
                </View>
          <Text style={styles.freeDeliveryInfo}>
            Add ₹{(deliverySettings.freeDeliveryThreshold - subtotal).toFixed(2)} more for free delivery
          </Text>
              </View>
        )}
        
        <View style={styles.divider} />
            
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
              onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
        </View>
      )}
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
    paddingVertical: 16,
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
    fontSize: 18,
    color: '#333',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopNowButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  signInButton: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
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
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  itemUnit: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantity: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  quantityLoadingContainer: {
    paddingHorizontal: 12,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  summary: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  deliveryFeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeDeliveryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  freeDeliveryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#2ECC71',
  },
  deliveryFeeValueContainer: {
    alignItems: 'flex-end',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#999',
    fontSize: 12,
  },
  freeValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
  },
  freeDeliveryInfoContainer: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 2,
  },
  freeDeliveryInfo: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginVertical: 16,
  },
  totalLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  totalValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#2ECC71',
  },
  checkoutButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  checkoutButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});