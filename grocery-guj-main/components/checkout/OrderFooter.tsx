import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';

interface OrderFooterProps {
  total: number;
  isProcessing: boolean;
  selectedAddress: string | null;
  isCashOnDelivery: boolean;
  selectedPayment: string | null;
  handlePlaceOrder: () => Promise<void>;
}

const OrderFooter = ({
  total,
  isProcessing,
  selectedAddress,
  isCashOnDelivery,
  selectedPayment,
  handlePlaceOrder
}: OrderFooterProps) => {
  // Determine if order button should be disabled
  const isDisabled = isProcessing || !selectedAddress || (!isCashOnDelivery && !selectedPayment);

  return (
    <Animated.View 
      entering={SlideInUp.duration(500)}
      style={styles.footer}>
      <View style={styles.footerSummary}>
        <Text style={styles.footerTotalLabel}>Total</Text>
        <Text style={styles.footerTotalValue}>₹{total.toFixed(2)}</Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.placeOrderButton, 
          isDisabled && styles.disabledButton
        ]}
        onPress={handlePlaceOrder}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel="Place order">
        {isProcessing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <ShoppingBag size={18} color="#fff" />
            <Text style={styles.placeOrderText}>Place Order</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        paddingBottom: 34
      }
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  footerSummary: {
    flex: 1,
  },
  footerTotalLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  footerTotalValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
  },
  placeOrderButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  placeOrderText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
});

export default OrderFooter; 