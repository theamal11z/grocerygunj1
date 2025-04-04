import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { MessageCircle, Phone, Mail, Send as WhatsApp } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useHelpSupport } from '@/hooks/useHelpSupport';

interface ContactOptionsProps {
  onChatPress?: () => void;
  showContactForm?: () => void;
}

export function ContactOptions({ onChatPress, showContactForm }: ContactOptionsProps) {
  const { supportSettings, loading } = useHelpSupport();
  const { contactInfo } = supportSettings;
  
  const handlePhonePress = () => {
    if (!contactInfo.phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    const phoneUrl = `tel:${contactInfo.phone.replace(/\s+/g, '')}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        }
        Alert.alert('Error', 'Phone calls are not available on this device');
      })
      .catch((err) => {
        Alert.alert('Error', 'Could not open phone dialer');
      });
  };
  
  const handleEmailPress = () => {
    if (!contactInfo.email) {
      if (showContactForm) {
        showContactForm();
      } else {
        Alert.alert('Error', 'Email not available');
      }
      return;
    }
    
    const emailUrl = `mailto:${contactInfo.email}?subject=Customer%20Support%20Request`;
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(emailUrl);
        }
        
        if (showContactForm) {
          showContactForm();
        } else {
          Alert.alert('Error', 'Email is not available on this device');
        }
      })
      .catch((err) => {
        if (showContactForm) {
          showContactForm();
        } else {
          Alert.alert('Error', 'Could not open email client');
        }
      });
  };
  
  const handleWhatsAppPress = () => {
    if (!contactInfo.whatsapp) {
      Alert.alert('Error', 'WhatsApp contact not available');
      return;
    }
    
    const whatsappNumber = contactInfo.whatsapp.replace(/\s+/g, '');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello%2C%20I%20need%20assistance%20with%20my%20order`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        }
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      })
      .catch((err) => {
        Alert.alert('Error', 'Could not open WhatsApp');
      });
  };
  
  // Don't show disabled methods
  const showChat = contactInfo.chatEnabled !== false;
  const showPhone = contactInfo.callEnabled !== false && contactInfo.phone;
  const showEmail = contactInfo.emailEnabled !== false;
  const showWhatsApp = contactInfo.whatsappEnabled !== false && contactInfo.whatsapp;
  
  return (
    <View style={styles.container}>
      {showChat && (
        <Animated.View entering={FadeInRight.delay(100).duration(500)}>
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={onChatPress}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#E8F5E9' }]}>
              <MessageCircle size={24} color="#2ECC71" />
            </View>
            <Text style={styles.contactLabel}>Live Chat</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {showPhone && (
        <Animated.View entering={FadeInRight.delay(200).duration(500)}>
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={handlePhonePress}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#E3F2FD' }]}>
              <Phone size={24} color="#2196F3" />
            </View>
            <Text style={styles.contactLabel}>Call Us</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {showEmail && (
        <Animated.View entering={FadeInRight.delay(300).duration(500)}>
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={handleEmailPress}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#FFF3E0' }]}>
              <Mail size={24} color="#FF9800" />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {showWhatsApp && (
        <Animated.View entering={FadeInRight.delay(400).duration(500)}>
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={handleWhatsAppPress}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#E0F2F1' }]}>
              <WhatsApp size={24} color="#4CAF50" />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  contactOption: {
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contactLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
  },
}); 