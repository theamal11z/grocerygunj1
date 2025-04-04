import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  RefreshControl, 
  ToastAndroid, 
  Clipboard, 
  Platform, 
  ActivityIndicator,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { 
  ChevronLeft, 
  Tag, 
  ShoppingBag, 
  Plus, 
  Calendar, 
  Check, 
  Percent,
  Ticket
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useOffers } from '@/hooks/useOffers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import Toast from '@/components/Toast';
import Animated, { 
  FadeIn, 
  FadeInUp,
  useSharedValue, 
  withTiming
} from 'react-native-reanimated';
import type { Product } from '@/lib/supabase';
import { format, parseISO, isPast } from 'date-fns';

const { width } = Dimensions.get('window');

export default function OffersScreen() {
  const { products, loading: productsLoading, error: productsError, fetchProducts } = useProducts();
  const { addToCart, cartItems } = useCart();
  const { offers: promoOffers, deals, loading: offersLoading, error: offersError, refetch: refetchOffers } = useOffers();
  const [refreshing, setRefreshing] = useState(false);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  // Helper function to show toast
  const displayToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      setToastMessage(message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Copy offer code to clipboard
  const copyToClipboard = (code: string) => {
    try {
      Clipboard.setString(code);
      setCopiedCode(code);
      displayToast(`Code copied: ${code}`);
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopiedCode(null);
      }, 3000);
    } catch (err) {
      
      displayToast('Failed to copy code');
    }
  };

  // Check if product is in cart
  const isProductInCart = (productId: string) => {
    return cartItems.some(item => item.product_id === productId);
  };

  // Handle adding product to cart
  const handleAddToCart = async (product: Product) => {
    if (!product.id) return;
    
    try {
      // Set loading state for this specific product
      setAddingToCart(product.id);
      
      // Add the product to cart
      const result = await addToCart(product.id, 1);
      
      // Show success message
      if (result) {
        displayToast(`Added ${product.name} to cart`);
      }
    } catch (err) {
      
      displayToast('Failed to add to cart');
    } finally {
      // Reset loading state after a short delay for better UX
      setTimeout(() => {
        setAddingToCart(null);
      }, 800);
    }
  };

  // Process products to get only discounted items
  useEffect(() => {
    if (products && products.length) {
      const filtered = products.filter(product => product.discount && product.discount > 0);
      // Sort by discount percentage (highest first)
      filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      setDiscountedProducts(filtered);
    }
  }, [products]);

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProducts(), refetchOffers()]);
    } catch (error) {
      
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = (offersLoading || productsLoading) && !refreshing;
  const hasError = offersError || productsError;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (hasError) {
    return <ErrorMessage message="Failed to load offers" />;
  }

  const noOffersAvailable = promoOffers.length === 0 && discountedProducts.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Special Offers</Text>
          <Text style={styles.headerSubtitle}>Exclusive deals and discounts</Text>
        </View>
      </View>

      {noOffersAvailable ? (
        <View style={styles.emptyState}>
          <ShoppingBag size={70} color="#ddd" />
          <Text style={styles.emptyStateTitle}>No Offers Available</Text>
          <Text style={styles.emptyStateText}>Check back later for special deals</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF3B30']}
              tintColor="#FF3B30"
            />
          }
        >
          {/* Special Offers Section */}
          {promoOffers.length > 0 && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ticket size={18} color="#FF3B30" />
                  <Text style={styles.sectionTitle}>Promotional Offers</Text>
                </View>
              </View>
              
              {promoOffers.map((offer, index) => (
                <Animated.View 
                  key={offer.id} 
                  entering={FadeInUp.delay(index * 80)}
                  style={styles.offerCard}
                >
                  {offer.image_url && (
                    <Image 
                      source={{ uri: offer.image_url }} 
                      style={styles.offerImage}
                    />
                  )}
                  <View style={styles.offerContent}>
                    <View style={styles.offerTitleRow}>
                      <Tag size={16} color="#FF3B30" />
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                    </View>
                    
                    <Text style={styles.offerDescription} numberOfLines={2}>
                      {offer.description || 'Special discount offer'}
                    </Text>
                    
                    <View style={styles.offerDetails}>
                      <View style={styles.offerCodeRow}>
                        <View style={styles.promoCodeBox}>
                          <Text style={styles.promoCode}>{offer.code}</Text>
                        </View>
                        <TouchableOpacity 
                          style={[
                            styles.copyButton, 
                            copiedCode === offer.code && styles.copiedButton
                          ]}
                          onPress={() => copyToClipboard(offer.code)}
                        >
                          {copiedCode === offer.code ? (
                            <View style={styles.buttonContent}>
                              <Check size={16} color="#fff" />
                              <Text style={styles.copyButtonText}>Copied</Text>
                            </View>
                          ) : (
                            <Text style={styles.copyButtonText}>Copy</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.offerFooter}>
                        <Calendar size={14} color="#666" />
                        <Text style={styles.offerValidity}>
                          Valid until {format(parseISO(offer.valid_until), 'MMM dd, yyyy')}
                        </Text>
                        {offer.min_purchase_amount !== undefined && offer.min_purchase_amount > 0 && (
                          <Text style={styles.offerCondition}>
                            Min. purchase: ₹{offer.min_purchase_amount}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          )}
          
          {/* Discounted Products Section */}
          {discountedProducts.length > 0 && (
            <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Percent size={18} color="#FF3B30" />
                  <Text style={styles.sectionTitle}>Discounted Products</Text>
                </View>
              </View>
              
              <View style={styles.gridContainer}>
                {discountedProducts.map((product, index) => (
                  <Animated.View 
                    key={product.id} 
                    entering={FadeInUp.delay(index * 50)}
                    style={styles.gridItem}
                  >
                    <TouchableOpacity 
                      style={styles.productCard}
                      onPress={() => router.push({
                        pathname: '/product/[id]',
                        params: { id: product.id }
                      })}
                      activeOpacity={0.8}
                    >
                      <Image 
                        source={{ uri: product.image_urls?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' }} 
                        style={styles.productImage} 
                      />
                      {product.discount && product.discount > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>{product.discount}% OFF</Text>
                        </View>
                      )}
                      <View style={styles.productDetails}>
                        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                        <Text style={styles.productUnit}>{product.unit}</Text>
                        <View style={styles.priceRow}>
                          <View>
                            <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                            {product.discount && product.discount > 0 && (
                              <Text style={styles.originalPrice}>₹{(product.price / (1 - product.discount / 100)).toFixed(2)}</Text>
                            )}
                          </View>
                          <TouchableOpacity 
                            style={[
                              styles.addButton,
                              isProductInCart(product.id) && styles.addedButton
                            ]}
                            onPress={() => handleAddToCart(product)}
                            disabled={addingToCart === product.id || isProductInCart(product.id)}
                          >
                            {addingToCart === product.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : isProductInCart(product.id) ? (
                              <Check size={14} color="#fff" />
                            ) : (
                              <Plus size={16} color="#fff" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}
          
          <View style={styles.footerSpace} />
        </ScrollView>
      )}
      
      {/* Custom Toast for iOS */}
      {Platform.OS === 'ios' && showToast && (
        <Toast 
          message={toastMessage} 
          type="success"
          onHide={() => setShowToast(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerBanner: {
    backgroundColor: '#FF3B30',
    paddingTop: Platform.OS === 'ios' ? 10 : 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerContent: {
    paddingVertical: 8,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#fff',
  },
  headerSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  offerImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  offerContent: {
    padding: 16,
  },
  offerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  offerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  offerDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  offerDetails: {
    gap: 12,
  },
  offerCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoCodeBox: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  promoCode: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  copyButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  copiedButton: {
    backgroundColor: '#2ECC71',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#fff',
  },
  offerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offerValidity: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  offerCondition: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 40) / 2,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#fff',
  },
  productDetails: {
    padding: 12,
  },
  productName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  productUnit: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FF3B30',
  },
  originalPrice: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: '#2ECC71',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedButton: {
    backgroundColor: '#999',
  },
  footerSpace: {
    height: 40,
  },
});