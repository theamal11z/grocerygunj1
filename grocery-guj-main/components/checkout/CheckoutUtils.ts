import { ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { timeSlots, sectionOffsets } from './Constants';

// Validation for checkout form
export const validateCheckout = (
  selectedAddress: string | null,
  isCashOnDelivery: boolean,
  selectedPayment: string | null,
  selectedDelivery: { id: string },
  selectedTimeSlot: string | null,
  scrollViewRef: React.RefObject<ScrollView>,
  setErrors: (errors: any) => void
) => {
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
        scrollToSection(scrollViewRef, firstError);
      }
    }, 100);
  }
  
  return isValid;
};

// Utility function to scroll to a section
export const scrollToSection = (
  scrollViewRef: React.RefObject<ScrollView>,
  section: string
) => {
  scrollViewRef.current?.scrollTo({ 
    y: sectionOffsets[section as keyof typeof sectionOffsets] || 0, 
    animated: true 
  });
};

// Calculate scheduled delivery time based on selection
export const getScheduledDeliveryTime = (
  selectedDelivery: { id: string },
  selectedTimeSlot: string | null
) => {
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
}; 