import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { useHelpSupport } from '@/hooks/useHelpSupport';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface SupportRequestFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const SUBJECT_OPTIONS = [
  { id: 'order', label: 'Order Issue' },
  { id: 'delivery', label: 'Delivery Problem' },
  { id: 'product', label: 'Product Quality' },
  { id: 'app', label: 'App Technical Issue' },
  { id: 'payment', label: 'Payment Problem' },
  { id: 'other', label: 'Other' },
];

const CONTACT_METHODS = [
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone Call' },
  { id: 'sms', label: 'SMS' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

export function SupportRequestForm({ onClose, onSuccess }: SupportRequestFormProps) {
  const { submitSupportRequest } = useHelpSupport();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactMethod, setContactMethod] = useState('email');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (!subject) {
      Alert.alert('Error', 'Please select a subject');
      return;
    }

    try {
      setIsSubmitting(true);
      const { success, error } = await submitSupportRequest(message, subject, contactMethod);
      
      if (success) {
        if (onSuccess) {
          onSuccess();
        } else {
          Alert.alert(
            'Request Submitted',
            'We have received your support request and will get back to you shortly.',
            [{ text: 'OK', onPress: onClose }]
          );
        }
      } else {
        Alert.alert('Error', error || 'Failed to submit request. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.title}>Contact Support</Text>
          <Text style={styles.subtitle}>
            Please provide details about your issue and we'll get back to you as soon as possible.
          </Text>
        </Animated.View>

        <Animated.View 
          entering={SlideInDown.delay(100).springify()}
          style={styles.formSection}
        >
          <Text style={styles.label}>Subject</Text>
          <View style={styles.optionsContainer}>
            {SUBJECT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  subject === option.id && styles.selectedOption,
                ]}
                onPress={() => setSubject(option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    subject === option.id && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View 
          entering={SlideInDown.delay(200).springify()}
          style={styles.formSection}
        >
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Describe your issue in detail..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </Animated.View>

        <Animated.View 
          entering={SlideInDown.delay(300).springify()}
          style={styles.formSection}
        >
          <Text style={styles.label}>Preferred Contact Method</Text>
          <View style={styles.contactMethodsContainer}>
            {CONTACT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.contactMethodButton,
                  contactMethod === method.id && styles.selectedContactMethod,
                ]}
                onPress={() => setContactMethod(method.id)}
              >
                <Text
                  style={[
                    styles.contactMethodText,
                    contactMethod === method.id && styles.selectedContactMethodText,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View 
          entering={SlideInDown.delay(400).springify()}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, !message.trim() && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Send size={16} color="#fff" />
                <Text style={styles.submitButtonText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  optionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  selectedOptionText: {
    color: '#2196f3',
  },
  messageInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
    minHeight: 120,
  },
  contactMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  contactMethodButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedContactMethod: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  contactMethodText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  selectedContactMethodText: {
    color: '#2196f3',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#b0bec5',
  },
  submitButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
}); 