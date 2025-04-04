import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInRight, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { deliveryTimes, timeSlots } from './Constants';

interface DeliveryTimeSectionProps {
  selectedDelivery: { id: string; time: string; estimate: string };
  setSelectedDelivery: (delivery: { id: string; time: string; estimate: string }) => void;
  selectedTimeSlot: string | null;
  setSelectedTimeSlot: (id: string | null) => void;
  error: string | null;
}

const DeliveryTimeSection = ({
  selectedDelivery,
  setSelectedDelivery,
  selectedTimeSlot,
  setSelectedTimeSlot,
  error
}: DeliveryTimeSectionProps) => {
  return (
    <Animated.View 
      entering={FadeInRight.delay(300).duration(300)} 
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
      <View style={styles.sectionTitleContainer}>
        <Clock size={20} color="#2ECC71" />
        <Text style={styles.sectionTitle}>Delivery Time</Text>
      </View>
      
      <View style={styles.deliveryOptionsContainer}>
        {deliveryTimes.map((delivery) => (
          <TouchableOpacity
            key={delivery.id}
            style={[
              styles.deliveryOption,
              selectedDelivery.id === delivery.id && styles.selectedDeliveryOption,
            ]}
            onPress={() => {
              setSelectedDelivery(delivery);
              if (delivery.id === '1') {
                setSelectedTimeSlot(null);
              }
              Haptics.selectionAsync();
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedDelivery.id === delivery.id }}>
            <View style={styles.deliveryOptionContent}>
              <Text style={[
                styles.deliveryOptionTitle,
                selectedDelivery.id === delivery.id && styles.selectedDeliveryOptionTitle
              ]}>
                {delivery.time || ''}
              </Text>
              <Text style={styles.deliveryOptionSubtitle}>
                {delivery.estimate || ''}
              </Text>
            </View>
            {selectedDelivery.id === delivery.id && (
              <View style={styles.selectedIndicator}>
                <CheckCircle size={20} color="#2ECC71" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Time Slots for Scheduled Delivery */}
      {selectedDelivery.id === '2' && (
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.timeSlotContainer}>
          <Text style={styles.timeSlotHeading}>Select a Delivery Time Slot</Text>
          <View style={styles.timeSlotGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlotCard,
                  selectedTimeSlot === slot.id && styles.selectedTimeSlot,
                ]}
                onPress={() => {
                  setSelectedTimeSlot(slot.id);
                  Haptics.selectionAsync();
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedTimeSlot === slot.id }}>
                <Text 
                  style={[
                    styles.timeSlotText,
                    selectedTimeSlot === slot.id && styles.selectedTimeSlotText,
                  ]}>
                  {slot.label || ''}
                </Text>
                {selectedTimeSlot === slot.id && (
                  <View style={styles.timeslotSelectedIndicator}>
                    <CheckCircle size={16} color="#2ECC71" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Delivery instructions field */}
          <View style={styles.deliveryInstructionsContainer}>
            <Text style={styles.deliveryInstructionsLabel}>Delivery Instructions (Optional)</Text>
            <TextInput
              style={styles.deliveryInstructionsInput}
              placeholder="E.g., Leave at the door, call on arrival..."
              multiline={true}
              numberOfLines={3}
              placeholderTextColor="#999"
            />
          </View>
        </Animated.View>
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
  deliveryOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  deliveryOption: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f8f8f8',
  },
  selectedDeliveryOption: {
    borderColor: '#2ECC71',
    backgroundColor: '#F9FFF9',
  },
  deliveryOptionContent: {
    flex: 1,
  },
  deliveryOptionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  selectedDeliveryOptionTitle: {
    color: '#2ECC71',
  },
  deliveryOptionSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
  },
  timeSlotContainer: {
    marginTop: 16,
  },
  timeSlotHeading: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlotCard: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f8f8f8',
    position: 'relative',
  },
  selectedTimeSlot: {
    borderColor: '#2ECC71',
    backgroundColor: '#F9FFF9',
  },
  timeSlotText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#333',
  },
  selectedTimeSlotText: {
    fontFamily: 'Poppins-Medium',
    color: '#2ECC71',
  },
  timeslotSelectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectedIndicator: {
    marginLeft: 10,
  },
  deliveryInstructionsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  deliveryInstructionsLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  deliveryInstructionsInput: {
    flex: 1,
    height: 100,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Poppins-Regular',
  },
});

export default DeliveryTimeSection; 