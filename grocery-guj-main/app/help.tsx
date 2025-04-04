import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  RefreshControl,
  StatusBar,
  FlatList
} from 'react-native';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Search,
  X,
  Clock,
  CircleHelp,
  Filter,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHelpSupport, FAQ } from '@/hooks/useHelpSupport';
import { FAQItem } from '@/components/support/FAQItem';
import { ContactOptions } from '@/components/support/ContactOptions';
import { SupportRequestForm } from '@/components/support/SupportRequestForm';

// FAQ category badges with colors
const CATEGORIES = [
  { id: 'all', label: 'All FAQs', color: '#e0e0e0', textColor: '#333' },
  { id: 'orders', label: 'Orders', color: '#E3F2FD', textColor: '#1976D2' },
  { id: 'delivery', label: 'Delivery', color: '#E8F5E9', textColor: '#2E7D32' },
  { id: 'payment', label: 'Payment', color: '#FFF3E0', textColor: '#F57C00' },
  { id: 'account', label: 'Account', color: '#F3E5F5', textColor: '#7B1FA2' },
  { id: 'returns', label: 'Returns', color: '#FFEBEE', textColor: '#C62828' },
];

export default function HelpScreen() {
  const { 
    supportSettings, 
    loading, 
    error, 
    searchFAQs, 
    searchResults, 
    searchQuery,
    refreshSupportSettings
  } = useHelpSupport();
  
  const insets = useSafeAreaInsets();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  
  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSupportSettings();
    setRefreshing(false);
  }, [refreshSupportSettings]);
  
  // Handle search input changes with 300ms debounce
  const handleSearchChange = useCallback((text: string) => {
    setLocalSearchQuery(text);
    
    // Clear previous timeout
    const timeoutId = (handleSearchChange as any).timeoutId;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout
    (handleSearchChange as any).timeoutId = setTimeout(() => {
      searchFAQs(text);
    }, 300);
  }, [searchFAQs]);
  
  // Clear search
  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    searchFAQs('');
    searchInputRef.current?.blur();
  }, [searchFAQs]);
  
  // Toggle FAQ expansion
  const toggleExpandFaq = useCallback((id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  }, [expandedFaq]);
  
  // Get filtered FAQs based on category and search
  const getFilteredFAQs = useCallback(() => {
    // If search is active, use search results
    if (searchQuery.trim()) {
      return searchResults;
    }
    
    // Otherwise filter by category
    if (selectedCategory === 'all') {
      return supportSettings.faqs;
    } else {
      return supportSettings.faqs.filter(faq => 
        faq.category === selectedCategory
      );
    }
  }, [searchQuery, searchResults, selectedCategory, supportSettings.faqs]);
  
  // Render FAQ item
  const renderFAQItem = useCallback(({ item, index }: { item: FAQ, index: number }) => (
    <FAQItem
      faq={item}
      index={index}
      isExpanded={expandedFaq === item.id}
      onToggle={() => toggleExpandFaq(item.id)}
      highlightTerms={searchQuery ? searchQuery.split(' ') : []}
    />
  ), [expandedFaq, toggleExpandFaq, searchQuery]);
  
  // Show form for contacting support
  const handleShowContactForm = useCallback(() => {
    setShowContactForm(true);
  }, []);
  
  // Hide form for contacting support
  const handleHideContactForm = useCallback(() => {
    setShowContactForm(false);
  }, []);
  
  // Handle successful contact form submission
  const handleContactSuccess = useCallback(() => {
    setShowContactForm(false);
  }, []);
  
  // If loading, show spinner
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading support information...</Text>
      </View>
    );
  }
  
  // Get the filtered FAQs
  const filteredFAQs = getFilteredFAQs();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main content */}
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        {/* Search Bar */}
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.searchContainer}
        >
          <Search size={20} color="#666" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search for help"
            value={localSearchQuery}
            onChangeText={handleSearchChange}
            placeholderTextColor="#666"
            returnKeyType="search"
          />
          {localSearchQuery ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </Animated.View>
        
        {/* Categories */}
        <Animated.View entering={FadeIn.delay(100).duration(300)}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryBadge,
                  { backgroundColor: category.color },
                  selectedCategory === category.id && styles.selectedCategoryBadge,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: category.textColor },
                    selectedCategory === category.id && styles.selectedCategoryText,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Contact Options */}
        <Animated.View 
          entering={FadeIn.delay(200).duration(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <ContactOptions 
            onChatPress={handleShowContactForm}
            showContactForm={handleShowContactForm}
          />
        </Animated.View>

        {/* FAQs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery 
                ? `Search Results (${filteredFAQs.length})` 
                : selectedCategory === 'all' 
                  ? 'Frequently Asked Questions' 
                  : `${CATEGORIES.find(c => c.id === selectedCategory)?.label}`
              }
            </Text>
            
            {!searchQuery && (
              <TouchableOpacity style={styles.filterButton}>
                <Filter size={18} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          
          {filteredFAQs.length === 0 ? (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.emptyStateContainer}
            >
              <CircleHelp size={48} color="#bdbdbd" />
              <Text style={styles.emptyStateTitle}>No results found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery 
                  ? `We couldn't find any FAQs matching "${searchQuery}"`
                  : `No FAQs available for ${selectedCategory}`
                }
              </Text>
              
              <TouchableOpacity
                style={styles.contactSupportButton}
                onPress={handleShowContactForm}
              >
                <Text style={styles.contactSupportButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <FlatList
              data={filteredFAQs}
              renderItem={renderFAQItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              initialNumToRender={10}
              removeClippedSubviews={true}
            />
          )}
        </View>

        {/* Support Hours */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Support Hours</Text>
          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Customer Support</Text>
            
            <View style={styles.supportHoursRow}>
              <Clock size={16} color="#666" />
              <Text style={styles.supportText}>
                {supportSettings.supportHours.weekdays || 'Monday to Friday: 9:00 AM - 8:00 PM'}
              </Text>
            </View>
            
            <View style={styles.supportHoursRow}>
              <Clock size={16} color="#666" />
              <Text style={styles.supportText}>
                {supportSettings.supportHours.weekends || 'Saturday & Sunday: 10:00 AM - 6:00 PM'}
              </Text>
            </View>
            
            {supportSettings.supportHours.holidays && (
              <View style={styles.supportHoursRow}>
                <Clock size={16} color="#666" />
            <Text style={styles.supportText}>
                  {supportSettings.supportHours.holidays}
                </Text>
              </View>
            )}
            
            {supportSettings.supportNote && (
              <Text style={styles.supportNote}>
                {supportSettings.supportNote}
            </Text>
            )}
          </View>
        </Animated.View>
        
        {/* Extra space at bottom */}
        <View style={{ height: 30 }} />
      </ScrollView>
      
      {/* Contact Form Modal */}
      <Modal
        visible={showContactForm}
        animationType="slide"
        transparent={false}
        onRequestClose={handleHideContactForm}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleHideContactForm}>
              <ChevronLeft size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Contact Support</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <SupportRequestForm 
            onClose={handleHideContactForm}
            onSuccess={handleContactSuccess}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#333',
  },
  content: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategoryBadge: {
    borderColor: '#2196F3',
  },
  categoryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  selectedCategoryText: {
    fontFamily: 'Poppins-SemiBold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
  },
  filterButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  contactSupportButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  contactSupportButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
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
    marginBottom: 12,
  },
  supportHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  supportText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  supportNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    fontStyle: 'italic',
  },
});