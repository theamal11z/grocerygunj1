import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CreditCard, DollarSign, Plus, CheckCircle, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface PaymentMethod {
  id: string;
  type: string;
  last_four?: string | null;
  is_default?: boolean;
}

interface PaymentMethodSectionProps {
  paymentMethods: PaymentMethod[];
  selectedPayment: string | null;
  setSelectedPayment: (id: string | null) => void;
  isCashOnDelivery: boolean;
  setIsCashOnDelivery: (value: boolean) => void;
  error: string | null;
}

const PaymentMethodSection = ({
  paymentMethods,
  selectedPayment,
  setSelectedPayment,
  isCashOnDelivery,
  setIsCashOnDelivery,
  error
}: PaymentMethodSectionProps) => {
  return (
    <Animated.View 
      entering={FadeInRight.delay(200).duration(300)} 
      style={[
        styles.section,
        error ? styles.sectionWithError : null
      ]}>
      {error && (
        <View style={styles.sectionErrorMessage}>
          <AlertCircle size={16} color="#D32F2F" />
          <Text style={styles.sectionErrorText}>{error}</Text>
        </View>
      )}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <CreditCard size={20} color="#2ECC71" />
          <Text style={styles.sectionTitle}>Payment Method</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/payment-methods')}
          accessibilityRole="button"
          accessibilityLabel="Add new payment method">
          <Plus size={16} color="#2ECC71" />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>
      
      {/* Cash on Delivery Option */}
      <TouchableOpacity
        style={[
          styles.selectionCard,
          isCashOnDelivery && styles.selectedCard,
        ]}
        onPress={() => {
          setIsCashOnDelivery(true);
          setSelectedPayment(null);
          Haptics.selectionAsync();
        }}
        accessibilityRole="radio"
        accessibilityState={{ checked: isCashOnDelivery }}>
        <View style={styles.selectionContent}>
          <View style={[
            styles.iconContainer,
            isCashOnDelivery && styles.selectedIconContainer
          ]}>
            <DollarSign
              size={20}
              color={isCashOnDelivery ? '#fff' : '#666'}
            />
          </View>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionTitle}>Cash on Delivery</Text>
            <Text style={styles.selectionSubtitle}>Pay when you receive your order</Text>
          </View>
        </View>
        {isCashOnDelivery && (
          <View style={styles.selectedIndicator}>
            <CheckCircle size={20} color="#2ECC71" />
          </View>
        )}
      </TouchableOpacity>
      
      {/* Saved Payment Methods */}
      {!isCashOnDelivery && (
        <>
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <CreditCard size={32} color="#999" />
              <Text style={styles.emptyStateText}>No payment methods found. Add a new payment method or use Cash on Delivery.</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton} 
                onPress={() => router.push('/payment-methods')}>
                <Text style={styles.emptyStateButtonText}>Add Payment Method</Text>
              </TouchableOpacity>
            </View>
          ) : (
            paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.selectionCard,
                  selectedPayment === method.id && styles.selectedCard,
                ]}
                onPress={() => {
                  setSelectedPayment(method.id);
                  setIsCashOnDelivery(false);
                  Haptics.selectionAsync();
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedPayment === method.id }}>
                <View style={styles.selectionContent}>
                  <View style={[
                    styles.iconContainer,
                    selectedPayment === method.id && styles.selectedIconContainer
                  ]}>
                    <CreditCard
                      size={20}
                      color={selectedPayment === method.id ? '#fff' : '#666'}
                    />
                  </View>
                  <View style={styles.selectionInfo}>
                    <Text style={styles.selectionTitle}>{method.type}</Text>
                    {method.last_four && (
                      <Text style={styles.selectionSubtitle}>
                        **** **** **** {method.last_four}
                      </Text>
                    )}
                  </View>
                </View>
                {selectedPayment === method.id && (
                  <View style={styles.selectedIndicator}>
                    <CheckCircle size={20} color="#2ECC71" />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </>
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1FFF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
  },
  emptyState: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 12,
  },
  emptyStateButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  emptyStateButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  selectedCard: {
    borderColor: '#2ECC71',
    backgroundColor: '#F9FFF9',
  },
  selectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconContainer: {
    backgroundColor: '#2ECC71',
  },
  selectionInfo: {
    marginLeft: 16,
    flex: 1,
  },
  selectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  selectionSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  selectedIndicator: {
    marginLeft: 10,
  },
});

export default PaymentMethodSection; 