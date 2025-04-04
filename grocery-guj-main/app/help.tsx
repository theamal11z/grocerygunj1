import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, CircleHelp as HelpCircle } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const faqs = [
  {
    id: '1',
    question: 'How do I track my order?',
    answer:
      'You can track your order by going to the Orders tab and selecting the specific order. You\'ll see real-time updates on your order status and estimated delivery time.',
  },
  {
    id: '2',
    question: 'What is your return policy?',
    answer:
      'We accept returns within 24 hours of delivery if the products are unused and in their original packaging. For perishable items, please report any issues immediately upon delivery.',
  },
  {
    id: '3',
    question: 'How can I change my delivery address?',
    answer:
      'You can manage your delivery addresses in the Profile section under "My Addresses". You can add, edit, or remove addresses and set a default delivery location.',
  },
];

export default function HelpScreen() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <HelpCircle size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactOptions}>
            <TouchableOpacity style={styles.contactOption}>
              <View style={[styles.contactIcon, { backgroundColor: '#E8F5E9' }]}>
                <MessageCircle size={24} color="#2ECC71" />
              </View>
              <Text style={styles.contactLabel}>Live Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactOption}>
              <View style={[styles.contactIcon, { backgroundColor: '#E3F2FD' }]}>
                <Phone size={24} color="#2196F3" />
              </View>
              <Text style={styles.contactLabel}>Call Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactOption}>
              <View style={[styles.contactIcon, { backgroundColor: '#FFF3E0' }]}>
                <Mail size={24} color="#FF9800" />
              </View>
              <Text style={styles.contactLabel}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <Animated.View
              key={faq.id}
              entering={FadeInUp.delay(100 * index)}
              style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() =>
                  setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                }>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedFaq === faq.id ? (
                  <ChevronUp size={20} color="#666" />
                ) : (
                  <ChevronDown size={20} color="#666" />
                )}
              </TouchableOpacity>
              {expandedFaq === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </Animated.View>
          ))}
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Hours</Text>
          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Customer Support</Text>
            <Text style={styles.supportText}>
              Monday to Saturday: 9:00 AM - 8:00 PM
            </Text>
            <Text style={styles.supportText}>Sunday: 10:00 AM - 6:00 PM</Text>
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  }, sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  contactOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  contactOption: {
    alignItems: 'center',
    gap: 8,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
  },
  faqAnswer: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    padding: 16,
    paddingTop: 0,
  },
  supportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  supportText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});