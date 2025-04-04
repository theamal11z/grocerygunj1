import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag, Truck, Shield, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInRight, FadeIn } from 'react-native-reanimated';
import { timeSlots } from './Constants';

interface Coupon {
  id: string;
  code: string;
  discount: string | number;
}

interface OrderSummaryProps {
  subtotal: number;
  discountAmount: number;
  finalDeliveryFee: number;
  total: number;
  itemCount: number;
  isFreeDelivery: boolean;
  deliverySettings: any;
  appliedCoupon: Coupon | null;
  selectedDelivery: { id: string };
  selectedTimeSlot: string | null;
  error: string | null;
}

const OrderSummarySection = ({
  subtotal,
  discountAmount,
  finalDeliveryFee,
  total,
  itemCount,
  isFreeDelivery,
  deliverySettings,
  appliedCoupon,
  selectedDelivery,
  selectedTimeSlot,
  error
}: OrderSummaryProps) => {
  // Helper function to get delivery estimate text
  const getDeliveryEstimateText = () => {
    if (selectedDelivery.id === '1') {
      return 'Estimated delivery in 30-45 minutes';
    } else if (selectedTimeSlot) {
      const selectedSlot = timeSlots.find(slot => slot.id === selectedTimeSlot);
      return selectedSlot ? `Scheduled for ${selectedSlot.label}` : 'Select a delivery time slot';
    } else {
      return 'Select a delivery time slot';
    }
  };

  return (
    <Animated.View 
      entering={FadeInRight.delay(500).duration(300)} 
      style={[
        styles.section, 
        styles.orderSummarySection,
        error ? styles.sectionWithError : null
      ]}>
      {error && (
        <View style={styles.sectionErrorMessage}>
          <AlertCircle size={16} color="#D32F2F" />
          <Text style={styles.sectionErrorText}>{error}</Text>
        </View>
      )}
      <View style={styles.sectionTitleContainer}>
        <ShoppingBag size={20} color="#2ECC71" />
        <Text style={styles.summaryTitle}>Order Summary</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        
        {appliedCoupon && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Discount {appliedCoupon.code ? `(${appliedCoupon.code})` : ''}
            </Text>
            <Text style={[styles.summaryValue, styles.discountText]}>
              -₹{discountAmount.toFixed(2)}
            </Text>
          </Animated.View>
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
          <Text style={styles.summaryValue}>
            {isFreeDelivery ? '₹0.00' : `₹${deliverySettings?.deliveryFee ? deliverySettings.deliveryFee.toFixed(2) : '0.00'}`}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Delivery estimate */}
      <View style={styles.deliveryEstimateContainer}>
        <Truck size={16} color="#666" />
        <Text style={styles.deliveryEstimateText}>
          {getDeliveryEstimateText()}
        </Text>
      </View>

      {/* Secure checkout message */}
      <View style={styles.secureCheckoutContainer}>
        <Shield size={16} color="#2ECC71" />
        <Text style={styles.secureCheckoutText}>
          Secure checkout powered by trusted payment gateways
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  orderSummarySection: {
    marginBottom: 120, // Ensure space at bottom for the fixed footer
  },
  sectionWithError: {
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  sectionErrorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionErrorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#D32F2F',
    marginLeft: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
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
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
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
  freeDeliveryBadge: {
    backgroundColor: '#2ECC71',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  freeDeliveryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#fff',
  },
  discountText: {
    color: '#2ECC71',
  },
  deliveryEstimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  deliveryEstimateText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  secureCheckoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  secureCheckoutText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
});

export default OrderSummarySection; 