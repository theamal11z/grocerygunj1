import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Plus, CheckCircle, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Address {
  id: string;
  type?: string;
  address?: string;
  area?: string;
  city?: string;
  is_default?: boolean;
}

interface DeliveryAddressSectionProps {
  addresses: Address[];
  selectedAddress: string | null;
  setSelectedAddress: (id: string) => void;
  error: string | null;
}

const DeliveryAddressSection = ({
  addresses,
  selectedAddress,
  setSelectedAddress,
  error
}: DeliveryAddressSectionProps) => {
  return (
    <Animated.View 
      entering={FadeInRight.delay(100).duration(300)} 
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
          <MapPin size={20} color="#2ECC71" />
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/address')}
          accessibilityRole="button"
          accessibilityLabel="Add new address">
          <Plus size={16} color="#2ECC71" />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>
      
      {addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <MapPin size={32} color="#999" />
          <Text style={styles.emptyStateText}>No addresses found. Add a new address to continue.</Text>
          <TouchableOpacity 
            style={styles.emptyStateButton} 
            onPress={() => router.push('/address')}>
            <Text style={styles.emptyStateButtonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        addresses.map((address) => (
          <TouchableOpacity
            key={address.id}
            style={[
              styles.selectionCard,
              selectedAddress === address.id && styles.selectedCard,
            ]}
            onPress={() => {
              setSelectedAddress(address.id);
              Haptics.selectionAsync();
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedAddress === address.id }}>
            <View style={styles.selectionContent}>
              <View style={[
                styles.iconContainer, 
                selectedAddress === address.id && styles.selectedIconContainer
              ]}>
                <MapPin
                  size={20}
                  color={selectedAddress === address.id ? '#fff' : '#666'}
                />
              </View>
              <View style={styles.selectionInfo}>
                <Text style={styles.selectionTitle}>{address.type || 'Address'}</Text>
                <Text style={styles.selectionSubtitle}>
                  {address.address ? address.address + ', ' : ''}
                  {address.area ? address.area + ', ' : ''}
                  {address.city || ''}
                </Text>
              </View>
            </View>
            {selectedAddress === address.id && (
              <View style={styles.selectedIndicator}>
                <CheckCircle size={20} color="#2ECC71" />
              </View>
            )}
          </TouchableOpacity>
        ))
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

export default DeliveryAddressSection; 