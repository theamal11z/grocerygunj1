import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ticket, X, AlertCircle, Info, ChevronRight, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInRight, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Coupon {
  id: string;
  code: string;
  discount: string | number;
  description?: string;
  min_purchase_amount?: number;
  max_discount_amount?: number;
}

interface CouponSectionProps {
  appliedCoupon: Coupon | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  handleApplyCoupon: () => Promise<void>;
  handleRemoveCoupon: () => void;
  isApplyingCoupon: boolean;
  couponError: string | null;
  error: string | null;
}

const CouponSection = ({
  appliedCoupon,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  handleRemoveCoupon,
  isApplyingCoupon,
  couponError,
  error
}: CouponSectionProps) => {
  // Format discount text safely
  const getDiscountText = () => {
    if (!appliedCoupon) return null;
    
    if (typeof appliedCoupon.discount === 'string') {
      return appliedCoupon.discount;
    } 
    
    if (typeof appliedCoupon.discount === 'number') {
      return `${appliedCoupon.discount}%`;
    }
    
    return '0%';
  };

  return (
    <Animated.View 
      entering={FadeInRight.delay(400).duration(300)} 
      style={[
        styles.section,
        error ? styles.sectionWithError : null
      ]}>
      {/* Error message */}
      {error && (
        <View style={styles.sectionErrorMessage}>
          <AlertCircle size={16} color="#D32F2F" />
          <Text style={styles.sectionErrorText}>{error}</Text>
        </View>
      )}
      
      {/* Section title */}
      <View style={styles.sectionTitleContainer}>
        <Ticket size={20} color="#2ECC71" />
        <Text style={styles.sectionTitle}>Coupon Code</Text>
      </View>
      
      {/* Applied coupon card */}
      {appliedCoupon ? (
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.appliedCouponCard}>
          <View style={styles.appliedCouponHeader}>
            <View style={styles.couponBadge}>
              <Ticket size={18} color="#fff" />
              <Text style={styles.couponBadgeText}>
                {appliedCoupon.code || ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeCouponButton}
              onPress={() => {
                handleRemoveCoupon();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              accessibilityRole="button"
              accessibilityLabel="Remove coupon">
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.couponDetails}>
            <View style={styles.couponDetailRow}>
              <Text style={styles.couponDetailLabel}>Discount:</Text>
              <Text style={styles.couponDetailValue}>{getDiscountText()}</Text>
            </View>
            
            {appliedCoupon.description && (
              <View style={styles.couponDetailRow}>
                <Text style={styles.couponDetailLabel}>Details:</Text>
                <Text style={styles.couponDetailValue}>{appliedCoupon.description}</Text>
              </View>
            )}
            
            {appliedCoupon.min_purchase_amount && appliedCoupon.min_purchase_amount > 0 && (
              <View style={styles.couponDetailRow}>
                <Text style={styles.couponDetailLabel}>Min Purchase:</Text>
                <Text style={styles.couponDetailValue}>₹{appliedCoupon.min_purchase_amount.toString()}</Text>
              </View>
            )}
            
            {appliedCoupon.max_discount_amount && (
              <View style={styles.couponDetailRow}>
                <Text style={styles.couponDetailLabel}>Max Discount:</Text>
                <Text style={styles.couponDetailValue}>₹{appliedCoupon.max_discount_amount.toString()}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.appliedSuccessMessage}>
            <CheckCircle size={16} color="#2ECC71" />
            <Text style={styles.appliedSuccessText}>Coupon applied successfully</Text>
          </View>
        </Animated.View>
      ) : (
        <>
          {/* Coupon input form */}
          <View style={styles.couponInputContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[
                styles.applyCouponButton,
                (isApplyingCoupon || !couponCode.trim()) && styles.disabledButton,
              ]}
              disabled={isApplyingCoupon || !couponCode.trim()}
              onPress={handleApplyCoupon}
              accessibilityRole="button"
              accessibilityLabel="Apply coupon">
              {isApplyingCoupon ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyCouponButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Coupon error message */}
          {couponError && (
            <View style={styles.couponErrorContainer}>
              <AlertCircle size={18} color="#FF3B30" />
              <Text style={styles.couponErrorText}>{couponError}</Text>
            </View>
          )}
        </>
      )}
      
      {/* Available coupons button */}
      <TouchableOpacity 
        style={styles.availableCouponsButton}
        onPress={() => {
          Alert.alert(
            'Available Coupons',
            'Check out our ongoing promotions for discount coupons.'
          );
        }}
        accessibilityRole="button"
        accessibilityLabel="See available coupons">
        <Info size={16} color="#2ECC71" />
        <Text style={styles.availableCouponsText}>
          See available coupons
        </Text>
        <ChevronRight size={16} color="#2ECC71" />
      </TouchableOpacity>
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
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginLeft: 8,
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 10,
    fontFamily: 'Poppins-Regular',
  },
  applyCouponButton: {
    backgroundColor: '#2ECC71',
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCouponButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  couponErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFEBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  couponErrorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#D32F2F',
    flex: 1,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  // New redesigned styles
  appliedCouponCard: {
    backgroundColor: '#F1FFF6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9F3E3',
    overflow: 'hidden',
  },
  appliedCouponHeader: {
    backgroundColor: '#2ECC71',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponBadgeText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
  removeCouponButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponDetails: {
    padding: 12,
  },
  couponDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  couponDetailLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#555',
    width: 100,
  },
  couponDetailValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  appliedSuccessMessage: {
    backgroundColor: '#E8F8F0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D9F3E3',
  },
  appliedSuccessText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
    marginLeft: 8,
  },
  availableCouponsButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  availableCouponsText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
    marginLeft: 8,
    marginRight: 4,
  },
});

export default CouponSection; 