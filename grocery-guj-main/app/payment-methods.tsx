import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, CreditCard, Plus, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

export default function PaymentMethodsScreen() {
  const { paymentMethods, loading, error, addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } = usePaymentMethods();
  const [isAdding, setIsAdding] = useState(false);
  const [newCard, setNewCard] = useState({
    type: 'Credit Card',
    cardNumber: '',
    expiryDate: '',
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load payment methods" />;
  }

  const handleAddCard = async () => {
    try {
      await addPaymentMethod({
        type: newCard.type,
        last_four: newCard.cardNumber.slice(-4),
        expiry_date: newCard.expiryDate,
        is_default: paymentMethods.length === 0, // Make first card default
      });
      setIsAdding(false);
      setNewCard({
        type: 'Credit Card',
        cardNumber: '',
        expiryDate: '',
      });
    } catch (err) {
      
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      await deletePaymentMethod(id);
    } catch (err) {
      
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPaymentMethod(id);
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
        <Text style={styles.title}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {paymentMethods.map((method, index) => (
          <Animated.View
            key={method.id}
            entering={FadeInUp.delay(100 * index)}
            style={styles.cardContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <CreditCard size={24} color="#2ECC71" />
                {method.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardNumber}>
                **** **** **** {method.last_four}
              </Text>
              <Text style={styles.expiryDate}>
                Expires {method.expiry_date}
              </Text>
            </View>
            <View style={styles.cardActions}>
              {!method.is_default && (
                <TouchableOpacity 
                  style={styles.setDefaultButton}
                  onPress={() => handleSetDefault(method.id)}
                >
                  <CheckCircle2 size={20} color="#666" />
                  <Text style={styles.setDefaultText}>Set as Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleDeleteCard(method.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}

        {isAdding ? (
          <Animated.View
            entering={FadeInUp}
            style={styles.addCardForm}>
            <Text style={styles.formTitle}>Add New Card</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter card number"
                value={newCard.cardNumber}
                onChangeText={(text) =>
                  setNewCard({ ...newCard, cardNumber: text })
                }
                keyboardType="numeric"
                maxLength={16}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                value={newCard.expiryDate}
                onChangeText={(text) =>
                  setNewCard({ ...newCard, expiryDate: text })
                }
                maxLength={5}
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
                  (!newCard.cardNumber || !newCard.expiryDate) && styles.saveButtonDisabled
                ]}
                onPress={handleAddCard}
                disabled={!newCard.cardNumber || !newCard.expiryDate}
              >
                <Text style={styles.saveButtonText}>Save Card</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAdding(true)}>
            <Plus size={24} color="#2ECC71" />
            <Text style={styles.addButtonText}>Add New Card</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Payment Methods</Text>
          <TouchableOpacity style={styles.paymentOption}>
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>₹</Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Cash on Delivery</Text>
              <Text style={styles.optionDescription}>
                Pay when your order arrives
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  cardNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  expiryDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  setDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setDefaultText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FF4B4B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2ECC71',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionIconText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#2ECC71',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  addCardForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  input: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
  },
});