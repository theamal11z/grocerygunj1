import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, MapPin, Plus, Chrome as Home, Briefcase, CreditCard as Edit2, Trash2 } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAddresses } from '@/hooks/useAddresses';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

export default function AddressScreen() {
  const { addresses, loading, error, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'Home',
    address: '',
    area: '',
    city: 'Birgunj',
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load addresses" />;
  }

  const handleAddAddress = async () => {
    try {
      await addAddress({
        type: newAddress.type,
        address: newAddress.address,
        area: newAddress.area,
        city: newAddress.city,
        is_default: addresses.length === 0, // Make first address default
      });
      setIsAdding(false);
      setNewAddress({
        type: 'Home',
        address: '',
        area: '',
        city: 'Birgunj',
      });
    } catch (err) {
      
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
    } catch (err) {
      
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
    } catch (err) {
      
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Address List */}
        {addresses.map((address, index) => (
          <Animated.View
            key={address.id}
            entering={FadeInUp.delay(100 * index)}
            style={styles.addressCard}>
            <View style={styles.addressIcon}>
              {address.type === 'Home' ? (
                <Home size={24} color="#2ECC71" />
              ) : (
                <Briefcase size={24} color="#2196F3" />
              )}
            </View>
            <View style={styles.addressContent}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressType}>{address.type}</Text>
                {address.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressText}>{address.address}</Text>
              <Text style={styles.areaText}>
                {address.area}, {address.city}
              </Text>
            </View>
            <View style={styles.addressActions}>
              {!address.is_default && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(address.id)}
                >
                  <Text style={styles.setDefaultText}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDeleteAddress(address.id)}
              >
                <Trash2 size={20} color="#FF4B4B" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}

        {/* Add New Address Form */}
        {isAdding ? (
          <Animated.View
            entering={FadeInUp}
            style={styles.addAddressForm}>
            <Text style={styles.formTitle}>Add New Address</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newAddress.type === 'Home' && styles.activeTypeButton,
                  ]}
                  onPress={() => setNewAddress({ ...newAddress, type: 'Home' })}>
                  <Home
                    size={20}
                    color={newAddress.type === 'Home' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      newAddress.type === 'Home' && styles.activeTypeButtonText,
                    ]}>
                    Home
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newAddress.type === 'Work' && styles.activeTypeButton,
                  ]}
                  onPress={() => setNewAddress({ ...newAddress, type: 'Work' })}>
                  <Briefcase
                    size={20}
                    color={newAddress.type === 'Work' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      newAddress.type === 'Work' && styles.activeTypeButtonText,
                    ]}>
                    Work
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street address"
                value={newAddress.address}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, address: text })
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Area</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter area or landmark"
                value={newAddress.area}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, area: text })
                }
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsAdding(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  (!newAddress.address || !newAddress.area) && styles.saveButtonDisabled
                ]}
                onPress={handleAddAddress}
                disabled={!newAddress.address || !newAddress.area}
              >
                <Text style={styles.saveButtonText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAdding(true)}>
            <Plus size={24} color="#2ECC71" />
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressType: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#2ECC71',
  },
  addressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  areaText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2ECC71',
  },
  addAddressForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  activeTypeButton: {
    backgroundColor: '#2ECC71',
  },
  typeButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#333',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2ECC71',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  setDefaultText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
  },
});