import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, Platform, TextInput, ToastAndroid, Keyboard, StyleSheet, RefreshControl, Modal, LogBox } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ShoppingBag, CheckCircle, Truck, AlertCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Disable specific warnings
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

// Hooks
import { useCart } from '@/hooks/useCart';
import { useAddresses } from '@/hooks/useAddresses';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useOrders, CreateOrderData } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';

// Modular components
import {
  SkeletonPlaceholder,
  SuccessAnimation,
  DeliveryAddressSection,
  PaymentMethodSection,
  DeliveryTimeSection,
  CouponSection,
  OrderSummarySection,
  OrderFooter,
  validateCheckout,
  getScheduledDeliveryTime,
  deliveryTimes,
  timeSlots
} from '@/components/checkout';

export default function CheckoutScreen() {
  const { user, loading: userLoading } = useAuth();
  const { 
    cartItems, 
    getCartTotals, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon,
    loading: cartLoading 
  } = useCart();
  const { addresses, loading: addressesLoading, refetch: refetchAddresses } = useAddresses();
  const { paymentMethods, loading: paymentsLoading, refetch: refetchPaymentMethods } = usePaymentMethods();
  const { createOrder } = useOrders();
  const { deliverySettings, loading: settingsLoading, refreshSettings } = useSettings();
  
  // Enhanced state management with refs
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState(deliveryTimes[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({
    address: null,
    payment: null,
    delivery: null,
    coupon: null,
    order: null
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isCashOnDelivery, setIsCashOnDelivery] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isCouponValid, setIsCouponValid] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Derived state using useMemo for better performance
  const { subtotal, itemCount, discountAmount, discountedSubtotal } = useMemo(() => 
    getCartTotals(), [getCartTotals, cartItems]
  );
  
  const isFreeDelivery = useMemo(() => 
    deliverySettings.enableFreeDelivery && 
    deliverySettings.freeDeliveryThreshold !== null && 
    subtotal >= deliverySettings.freeDeliveryThreshold,
    [deliverySettings, subtotal]
  );
  
  const finalDeliveryFee = useMemo(() => 
    isFreeDelivery ? 0 : deliverySettings.deliveryFee,
    [isFreeDelivery, deliverySettings]
  );
  
  const total = useMemo(() => 
    discountedSubtotal + finalDeliveryFee,
    [discountedSubtotal, finalDeliveryFee]
  );

  // Loading state combining all data fetching operations
  const isLoading = useMemo(() => 
    userLoading || cartLoading || addressesLoading || paymentsLoading || settingsLoading,
    [userLoading, cartLoading, addressesLoading, paymentsLoading, settingsLoading]
  );

  // Set default selections when data is loaded
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      setSelectedAddress(defaultAddress.id);
    }
    
    if (paymentMethods.length > 0) {
      const defaultPayment = paymentMethods.find(pm => pm.is_default) || paymentMethods[0];
      setSelectedPayment(defaultPayment.id);
    }
  }, [addresses, paymentMethods]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/auth');
    }
  }, [user, userLoading]);

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (!userLoading && user && cartItems.length === 0) {
      router.replace('/cart');
    }
  }, [cartItems, user, userLoading]);

  // Clear specific error when corresponding selection is made
  useEffect(() => {
    if (selectedAddress && errors.address) {
      setErrors(prev => ({ ...prev, address: null }));
    }
  }, [selectedAddress, errors.address]);

  useEffect(() => {
    if ((isCashOnDelivery || selectedPayment) && errors.payment) {
      setErrors(prev => ({ ...prev, payment: null }));
    }
  }, [isCashOnDelivery, selectedPayment, errors.payment]);

  useEffect(() => {
    if (selectedDelivery.id === '1' || (selectedDelivery.id === '2' && selectedTimeSlot)) {
      setErrors(prev => ({ ...prev, delivery: null }));
    }
  }, [selectedDelivery, selectedTimeSlot, errors.delivery]);

  // Utility function to scroll to a section
  const scrollToSection = useCallback((section: string) => {
    const sectionOffsets = {
      address: 0,
      payment: 300,
      delivery: 600,
      coupon: 900,
      order: 1200
    };
    
    scrollViewRef.current?.scrollTo({ 
      y: sectionOffsets[section as keyof typeof sectionOffsets] || 0, 
      animated: true 
    });
  }, []);

  // Error handling with field validation and auto-scroll to error
  const validateCheckout = useCallback(() => {
    const newErrors: Record<string, string | null> = {
      address: null,
      payment: null,
      delivery: null,
      coupon: null,
      order: null
    };
    let isValid = true;

    if (!selectedAddress) {
      newErrors.address = 'Please select a delivery address';
      isValid = false;
    }
    
    if (!isCashOnDelivery && !selectedPayment) {
      newErrors.payment = 'Please select a payment method';
      isValid = false;
    }
    
    if (selectedDelivery.id === '2' && !selectedTimeSlot) {
      newErrors.delivery = 'Please select a delivery time slot';
      isValid = false;
    }

    setErrors(newErrors);
    
    // Auto-scroll to first error
    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      setTimeout(() => {
        // Find first error section and scroll to it
        const errorSections = Object.entries(newErrors)
          .filter(([_, value]) => value !== null)
          .map(([key]) => key);
        
        if (errorSections.length > 0) {
          const firstError = errorSections[0];
          scrollToSection(firstError);
        }
      }, 100);
    }
    
    return isValid;
  }, [selectedAddress, isCashOnDelivery, selectedPayment, selectedDelivery, selectedTimeSlot, scrollToSection]);

  // Handle pull-to-refresh functionality
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        refetchAddresses(),
        refetchPaymentMethods(),
        refreshSettings()
      ]);
    } catch (err) {
      // Silent error handling
    } finally {
      setRefreshing(false);
    }
  }, [refetchAddresses, refetchPaymentMethods, refreshSettings]);

  // Improved function to get scheduled delivery time with more precision
  const getScheduledDeliveryTime = useCallback(() => {
    if (selectedDelivery.id === '1') {
      // ASAP - 45 minutes from now
      return new Date(Date.now() + 45 * 60 * 1000).toISOString();
    } else if (selectedTimeSlot) {
      // Get the selected time slot
      const slot = timeSlots.find(slot => slot.id === selectedTimeSlot);
      if (slot) {
        // Parse the time slot and create a date
        const isToday = slot.day === 'today';
        const [hours, minutes] = slot.start.split(':').map(Number);
        
        const date = new Date();
        if (!isToday) {
          // Add a day for tomorrow
          date.setDate(date.getDate() + 1);
        }
        
        // Set time with precise hour and minute
        date.setHours(hours, minutes, 0, 0);
        
        return date.toISOString();
      }
    }
    
    // Default to 1 hour from now
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }, [selectedDelivery, selectedTimeSlot]);

  // Place order with improved validation and error handling
  const handlePlaceOrder = useCallback(async () => {
    Keyboard.dismiss();
    
    // Validate all fields before proceeding
    if (!validateCheckout()) {
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      setErrors(prev => ({ ...prev, order: null }));
      
      // Provide haptic feedback when starting the order process
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const orderData: CreateOrderData = {
        delivery_address_id: selectedAddress!,
        payment_method_id: isCashOnDelivery ? null : selectedPayment!,
        delivery_fee: finalDeliveryFee,
        estimated_delivery: getScheduledDeliveryTime(),
        is_cash_on_delivery: isCashOnDelivery,
        applied_coupon_id: appliedCoupon?.id,
        discount_amount: discountAmount
      };
      
      const order = await createOrder(orderData);
      
      if (order) {
        // Show success animation before navigating
        setShowSuccessAnimation(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Delay navigation to show animation
        setTimeout(() => {
          router.replace({
            pathname: '/order-confirmation',
            params: { orderId: order.id }
          });
        }, 1000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrors(prev => ({ ...prev, order: 'Failed to create order. Please try again.' }));
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      if (err instanceof Error) {
        // Map error message to user-friendly message and appropriate section
        const errorMessage = err.message.toLowerCase();
        
        if (errorMessage.includes('address') || errorMessage.includes('delivery')) {
          setErrors(prev => ({ ...prev, address: err.message }));
          scrollToSection('address');
        } else if (errorMessage.includes('payment') || errorMessage.includes('card')) {
          setErrors(prev => ({ ...prev, payment: err.message }));
          scrollToSection('payment');
        } else if (errorMessage.includes('coupon') || errorMessage.includes('discount')) {
          setErrors(prev => ({ ...prev, coupon: err.message }));
          scrollToSection('coupon');
        } else {
          setErrors(prev => ({ ...prev, order: err.message }));
        }
      } else {
        setErrors(prev => ({ ...prev, order: 'An unexpected error occurred. Please try again.' }));
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    validateCheckout,
    selectedAddress,
    isCashOnDelivery,
    selectedPayment,
    selectedDelivery,
    selectedTimeSlot,
    finalDeliveryFee,
    getScheduledDeliveryTime,
    appliedCoupon,
    discountAmount,
    createOrder,
    scrollToSection
  ]);

  // Apply coupon with improved error handling and feedback
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    Keyboard.dismiss();

    try {
      setIsApplyingCoupon(true);
      setCouponError(null);
      setErrors(prev => ({ ...prev, coupon: null }));
      
      const couponResult = await applyCoupon(couponCode.trim());
      
      if (couponResult) {
        setIsCouponValid(true);
        setCouponCode('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show success toast
        if (Platform.OS === 'android') {
          ToastAndroid.show(`Coupon "${couponResult.code || ''}" applied successfully!`, ToastAndroid.SHORT);
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setCouponError('Invalid coupon code or coupon has expired');
        setIsCouponValid(false);
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Handle minimum purchase requirement error more prominently
      if (err instanceof Error) {
        const errorMessage = err.message;
        
        if (errorMessage.includes('Minimum purchase')) {
          // Extract the minimum amount from the error message
          const amountMatch = errorMessage.match(/₹(\d+)/);
          const minAmount = amountMatch ? amountMatch[1] : '500';
          const shortfall = Number(minAmount) - subtotal;
          
          setCouponError(`This coupon requires a minimum purchase of ₹${minAmount}. Add ₹${shortfall.toFixed(2)} more to your cart.`);
          setErrors(prev => ({ ...prev, coupon: `Minimum purchase of ₹${minAmount} required` }));
        } else {
          setCouponError(errorMessage);
          setErrors(prev => ({ ...prev, coupon: errorMessage }));
        }
      } else {
        setCouponError('Failed to apply coupon');
        setErrors(prev => ({ ...prev, coupon: 'Failed to apply coupon' }));
      }
      
      setIsCouponValid(false);
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [couponCode, subtotal, applyCoupon]);

  // Remove coupon with optimistic UI update
  const handleRemoveCoupon = useCallback(() => {
    removeCoupon();
    setIsCouponValid(false);
  }, [removeCoupon]);

  // Show skeleton loading state while fetching data
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonPlaceholder style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 20 }} />
        <SkeletonPlaceholder style={{ width: 200, height: 24, marginBottom: 8 }} />
        <SkeletonPlaceholder style={{ width: 160, height: 16, marginBottom: 40 }} />
        
        <SkeletonPlaceholder style={{ width: '100%', height: 24, marginBottom: 16 }} />
        <SkeletonPlaceholder style={{ width: '100%', height: 80, marginBottom: 24 }} />
        
        <SkeletonPlaceholder style={{ width: '100%', height: 24, marginBottom: 16 }} />
        <SkeletonPlaceholder style={{ width: '100%', height: 80, marginBottom: 24 }} />
        
        <SkeletonPlaceholder style={{ width: '100%', height: 24, marginBottom: 16 }} />
        <SkeletonPlaceholder style={{ width: '100%', height: 120, marginBottom: 24 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Success Animation Modal */}
      <SuccessAnimation visible={showSuccessAnimation} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2ECC71']}
            tintColor="#2ECC71"
          />
        }>
        
        {/* Progress Indicator */}
        <Animated.View 
          entering={FadeInUp.duration(300)}
          style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressCircle, styles.activeProgressCircle]}>
              <ShoppingBag size={18} color="#fff" />
            </View>
            <Text style={[styles.progressText, styles.activeProgressText]}>Cart</Text>
          </View>
          <View style={styles.progressConnector} />
          <View style={styles.progressStep}>
            <View style={[styles.progressCircle, styles.activeProgressCircle]}>
              <CheckCircle size={18} color="#fff" />
            </View>
            <Text style={[styles.progressText, styles.activeProgressText]}>Checkout</Text>
          </View>
          <View style={styles.progressConnector} />
          <View style={styles.progressStep}>
            <View style={styles.progressCircle}>
              <Truck size={18} color="#999" />
            </View>
            <Text style={styles.progressText}>Delivery</Text>
          </View>
        </Animated.View>

        {/* General Error Message */}
        {error && (
          <Animated.View 
            entering={FadeIn.duration(300)} 
            style={styles.errorContainer}>
            <AlertCircle size={20} color="#D32F2F" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Delivery Address Section */}
        <DeliveryAddressSection 
          addresses={addresses}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
          error={errors.address}
        />

        {/* Payment Method Section */}
        <PaymentMethodSection 
          paymentMethods={paymentMethods}
          selectedPayment={selectedPayment}
          setSelectedPayment={setSelectedPayment}
          isCashOnDelivery={isCashOnDelivery}
          setIsCashOnDelivery={setIsCashOnDelivery}
          error={errors.payment}
        />

        {/* Delivery Time Section */}
        <DeliveryTimeSection 
          selectedDelivery={selectedDelivery}
          setSelectedDelivery={setSelectedDelivery}
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
          error={errors.delivery}
        />

        {/* Coupon Section */}
        <CouponSection 
          appliedCoupon={appliedCoupon}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          handleApplyCoupon={handleApplyCoupon}
          handleRemoveCoupon={handleRemoveCoupon}
          isApplyingCoupon={isApplyingCoupon}
          couponError={couponError}
          error={errors.coupon}
        />

        {/* Order Summary */}
        <OrderSummarySection 
          subtotal={subtotal}
          discountAmount={discountAmount}
          finalDeliveryFee={finalDeliveryFee}
          total={total}
          itemCount={itemCount}
          isFreeDelivery={isFreeDelivery}
          deliverySettings={deliverySettings}
          appliedCoupon={appliedCoupon}
          selectedDelivery={selectedDelivery}
          selectedTimeSlot={selectedTimeSlot}
          error={errors.order}
        />

        {/* Extra space for footer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Order Footer */}
      <OrderFooter 
        total={total}
        isProcessing={isProcessing}
        selectedAddress={selectedAddress}
        isCashOnDelivery={isCashOnDelivery}
        selectedPayment={selectedPayment}
        handlePlaceOrder={handlePlaceOrder}
      />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 10,
  },
  progressStep: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeProgressCircle: {
    backgroundColor: '#2ECC71',
  },
  progressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  activeProgressText: {
    fontFamily: 'Poppins-Medium',
    color: '#2ECC71',
  },
  progressConnector: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#D32F2F',
    marginLeft: 10,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 24,
  },
});