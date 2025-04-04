import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, Shield, Lock, Eye, FileText, Bell } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const privacyPolicySections = [
  {
    id: '1',
    title: 'Information We Collect',
    content:
      'We collect personal information that you provide to us, such as your name, email address, phone number, and delivery address. We also collect information about your device and how you use our app, including IP address, browser type, and pages visited. This helps us improve our services and provide a better user experience.',
  },
  {
    id: '2',
    title: 'How We Use Your Information',
    content:
      'We use your information to process orders, deliver products, send notifications about your orders, and provide customer support. We may also use your information to personalize your experience, improve our app, and send you marketing communications if you\'ve opted in.',
  },
  {
    id: '3',
    title: 'Information Sharing',
    content:
      'We share your information with delivery partners to fulfill your orders and payment processors to handle transactions. We may also share information with service providers who help us operate our business. We do not sell your personal information to third parties.',
  },
  {
    id: '4',
    title: 'Data Security',
    content:
      'We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure. We use encryption, secure servers, and regular security audits to ensure your data remains safe.',
  },
  {
    id: '5',
    title: 'Your Rights',
    content:
      'You have the right to access, correct, or delete your personal information. You can manage your information through your account settings or by contacting our customer support team. You can also opt out of marketing communications at any time.',
  },
];

const securityFeatures = [
  {
    id: '1',
    title: 'Secure Payments',
    icon: <Lock size={24} color="#2ECC71" />,
    description: 'All payment information is encrypted and processed securely.',
  },
  {
    id: '2',
    title: 'Data Protection',
    icon: <Shield size={24} color="#2196F3" />,
    description: 'Your personal data is protected with industry-standard security measures.',
  },
  {
    id: '3',
    title: 'Privacy Controls',
    icon: <Eye size={24} color="#FF9800" />,
    description: 'Manage your privacy settings and control how your data is used.',
  },
  {
    id: '4',
    title: 'Terms of Service',
    icon: <FileText size={24} color="#9C27B0" />,
    description: 'Clear terms that explain your rights and responsibilities.',
  },
];

export default function PrivacySecurityScreen() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Security Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Features</Text>
          <View style={styles.featuresGrid}>
            {securityFeatures.map((feature, index) => (
              <Animated.View
                key={feature.id}
                entering={FadeInUp.delay(100 * index)}
                style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  {feature.icon}
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Privacy Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Controls</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}>
            <View style={styles.menuItemContent}>
              <Bell size={20} color="#2ECC71" />
              <Text style={styles.menuText}>Notification Preferences</Text>
            </View>
            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Text style={styles.policyIntro}>
            Our Privacy Policy explains how we collect, use, and protect your personal information. 
            Last updated: June 1, 2023.
          </Text>
          
          {privacyPolicySections.map((section, index) => (
            <Animated.View
              key={section.id}
              entering={FadeInUp.delay(100 * index)}
              style={styles.policySection}>
              <TouchableOpacity
                style={styles.policySectionHeader}
                onPress={() =>
                  setExpandedSection(expandedSection === section.id ? null : section.id)
                }>
                <Text style={styles.policySectionTitle}>{section.title}</Text>
                {expandedSection === section.id ? (
                  <ChevronUp size={20} color="#666" />
                ) : (
                  <ChevronDown size={20} color="#666" />
                )}
              </TouchableOpacity>
              {expandedSection === section.id && (
                <Text style={styles.policySectionContent}>{section.content}</Text>
              )}
            </Animated.View>
          ))}
        </View>

        {/* Contact for Privacy Concerns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Concerns?</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactText}>
              If you have any questions or concerns about your privacy or our data practices, please contact our Privacy Team at:
            </Text>
            <Text style={styles.contactEmail}>privacy@yourcompany.com</Text>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact Privacy Team</Text>
            </TouchableOpacity>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
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
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
  },
  policyIntro: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  policySection: {
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
  policySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  policySectionTitle: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
  },
  policySectionContent: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    padding: 16,
    paddingTop: 0,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  contactEmail: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#2ECC71',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  contactButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
}); 