import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Animated,
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Heart, ShoppingBag, Star, Share2, Minus, Plus, Clock, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/lib/supabase';

const { width } = Dimensions.get('window');

// Helper function to ensure all text values are strings
const sanitizeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Skeleton loading component
const SkeletonPlaceholder = ({ style }: { style: any }) => {
  const opacityValue = useState(new Animated.Value(0.3))[0];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={[style, { opacity: opacityValue, backgroundColor: '#E0E0E0', borderRadius: 4 }]} />
  );
};

// Loading state with skeleton placeholders
const SkeletonLoadingView = () => (
  <ScrollView style={{ flex: 1 }} bounces={false}>
    <SkeletonPlaceholder style={{ width: width, height: width }} />
    <View style={{ padding: 20 }}>
      <SkeletonPlaceholder style={{ height: 28, width: '80%', marginBottom: 8 }} />
      <SkeletonPlaceholder style={{ height: 18, width: '40%', marginBottom: 16 }} />
      <SkeletonPlaceholder style={{ height: 24, width: '30%', marginBottom: 16 }} />
      <SkeletonPlaceholder style={{ height: 14, width: '20%', marginBottom: 24 }} />
      <SkeletonPlaceholder style={{ height: 60, width: '100%', marginBottom: 24 }} />

      <SkeletonPlaceholder style={{ height: 20, width: '40%', marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <SkeletonPlaceholder style={{ height: 80, width: '48%', marginBottom: 12 }} />
        <SkeletonPlaceholder style={{ height: 80, width: '48%', marginBottom: 12 }} />
        <SkeletonPlaceholder style={{ height: 80, width: '48%', marginBottom: 12 }} />
        <SkeletonPlaceholder style={{ height: 80, width: '48%', marginBottom: 12 }} />
    </View>
  </View>
  </ScrollView>
);

// Simple loading view
const LoadingView = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2ECC71" />
    <Text style={styles.loadingText}>Loading product details...</Text>
  </View>
);

// Error view with retry
const ErrorView = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <View style={styles.errorContainer}>
    <AlertTriangle size={48} color="#FF4B4B" />
    <Text style={styles.errorText}>{message}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

export default function ProductDetail() {
  const params = useLocalSearchParams();
  const productId = typeof params?.id === 'string' ? String(params.id) : null;
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  // Hooks
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  
  // Optimistic UI updates
  const [optimisticWishlistState, setOptimisticWishlistState] = useState<boolean | null>(null);
  
  // Compute actual wishlist state (combining real and optimistic state)
  const isProductInWishlist = useMemo(() => {
    if (optimisticWishlistState !== null) {
      return optimisticWishlistState;
    }
    return product ? isInWishlist(product.id) : false;
  }, [product, isInWishlist, optimisticWishlistState]);
  
  // Navigation handler
  const handleBackPress = useCallback(() => {
    router.back();
  }, []);
  
  // Wishlist handler with optimistic update
  const handleAddToWishlist = useCallback(async () => {
    if (!productId || !product) return;
    if (!user) {
      // Redirect to login if not logged in
      router.push('/auth');
      return;
    }
    
    try {
      setAddingToWishlist(true);
      
      const currentlyInWishlist = isProductInWishlist;
      
      // Optimistic update
      setOptimisticWishlistState(!currentlyInWishlist);
      
      let success;
      
      if (currentlyInWishlist) {
        success = await removeFromWishlist(productId);
      } else {
        success = await addToWishlist(productId);
      }
      
      if (!success) {
        // Revert optimistic update on failure
        setOptimisticWishlistState(currentlyInWishlist);
      } else {
        // Clear optimistic state once the real update is confirmed
        setOptimisticWishlistState(null);
      }
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticWishlistState(null);
    } finally {
      setAddingToWishlist(false);
    }
  }, [productId, product, user, isProductInWishlist, addToWishlist, removeFromWishlist]);
  
  // Add to cart handler with animation
  const handleAddToCart = useCallback(async () => {
    if (!product?.id) return;
    
    try {
      setAddingToCart(true);
      const result = await addToCart(product.id, quantity);
      
      if (result) {
        setAddedToCart(true);
        // Reset the added to cart state after 2 seconds
        setTimeout(() => {
          setAddedToCart(false);
        }, 2000);
      }
    } catch (err) {
      // Error is handled silently
    } finally {
      setAddingToCart(false);
    }
  }, [product, quantity, addToCart]);

  const handleQuantityChange = useCallback((action: 'increase' | 'decrease') => {
    setQuantity(prev => {
      if (action === 'decrease' && prev > 1) return prev - 1;
      if (action === 'increase') return prev + 1;
      return prev;
    });
  }, []);

  // Fetch product data with improved error handling
  const fetchProductData = useCallback(async (isRefreshing = false) => {
      if (!productId) {
        setError('No product ID provided');
        setLoading(false);
      setRefreshing(false);
        return;
      }
      
    if (!isRefreshing) {
      setLoading(true);
    }
      setError(null);
      
      try {
      // Fetch product details
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (fetchError) {
          setError('Could not load product. Please try again.');
          return;
        }
        
        if (!data) {
          setError('Product not found');
          return;
        }
        
        setProduct(data);
      
      // Fetch related products
      if (data.category_id) {
        const { data: relatedData, error: relatedError } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', data.category_id)
          .neq('id', productId)
          .limit(6);
          
        if (!relatedError && relatedData) {
          setRelatedProducts(relatedData);
        }
      }
      
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      setRefreshing(false);
      }
  }, [productId]);

  // Initial data fetch
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProductData(true);
  }, [fetchProductData]);

  // Image gallery component with improved UX
  const ProductGallery = useCallback(() => {
    if (!product?.image_urls || !Array.isArray(product.image_urls) || product.image_urls.length === 0) {
      return (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/400x300/f0f0f0/999999?text=No+Image' }} 
            style={styles.productImage} 
            resizeMode="cover" 
          />
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        {/* Main Image Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const offset = e.nativeEvent.contentOffset.x;
            setActiveImage(Math.round(offset / width));
          }}
          scrollEventThrottle={16}>
          {product.image_urls.map((image: string, index: number) => (
            <View key={index} style={{ width, height: width }}>
        <Image 
                source={{ uri: image || 'https://via.placeholder.com/400' }}
          style={styles.productImage}
          resizeMode="cover"
        />
            </View>
          ))}
        </ScrollView>
        
        {/* Image Indicators */}
        {product.image_urls.length > 1 && (
          <View style={styles.indicators}>
            {product.image_urls.map((_, index: number) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === activeImage && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  }, [product, activeImage]);
  
  // Simple stocks indicator
  const StockIndicator = useCallback(() => {
    if (!product) return null;
    
    let stockLevel: 'high' | 'medium' | 'low' = 'high';
    let stockText = 'In Stock';
    
    if (product.stock <= 5) {
      stockLevel = 'low';
      stockText = `Only ${product.stock} left`;
    } else if (product.stock <= 20) {
      stockLevel = 'medium';
      stockText = 'Limited Stock';
    }
    
    const colorMap = {
      high: '#2ECC71',
      medium: '#F39C12',
      low: '#E74C3C'
    };
    
    return (
      <View style={[styles.stockContainer, { backgroundColor: `${colorMap[stockLevel]}10` }]}>
        <View style={[styles.stockDot, { backgroundColor: colorMap[stockLevel] }]} />
        <Text style={[styles.stockText, { color: colorMap[stockLevel] }]}>{stockText}</Text>
      </View>
    );
  }, [product]);
  
  // Related products section
  const RelatedProducts = useCallback(() => {
    if (!relatedProducts.length) return null;
    
    return (
      <View style={styles.relatedSection}>
        <Text style={styles.sectionTitle}>You may also like</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedScrollContent}>
          {relatedProducts.map((relatedProduct) => (
            <TouchableOpacity 
              key={relatedProduct.id}
              style={styles.relatedProduct}
              onPress={() => {
                router.push({
                  pathname: '/product/[id]',
                  params: { id: relatedProduct.id }
                });
              }}>
              <Image 
                source={{ uri: relatedProduct.image_urls?.[0] || 'https://via.placeholder.com/150' }}
                style={styles.relatedProductImage}
                resizeMode="cover"
              />
              <Text style={styles.relatedProductName} numberOfLines={2}>
                {sanitizeString(relatedProduct.name)}
              </Text>
              <Text style={styles.relatedProductPrice}>
                ₹{sanitizeString(relatedProduct.price || 0)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [relatedProducts]);

  // Show skeleton loading first
  if (loading && !refreshing) {
    return <SkeletonLoadingView />;
  }
  
  // Rendering error state
  if (error || !product) {
    return <ErrorView message={error || 'Product not found'} onRetry={fetchProductData} />;
  }

  const totalPrice = product.price * quantity;

  // Main render method
  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Header */}
      <BlurView intensity={80} style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {sanitizeString(product?.name) || 'Product Details'}
        </Text>
        <TouchableOpacity 
          onPress={() => {}} 
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Share">
          <Share2 size={24} color="#333" />
        </TouchableOpacity>
      </BlurView>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2ECC71']}
            tintColor="#2ECC71"
          />
        }>
        
        {/* Image Gallery */}
        <ProductGallery />
        
        {/* Wishlist Button (floating) */}
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={handleAddToWishlist}
            disabled={addingToWishlist}
            accessibilityRole="button"
          accessibilityLabel={isProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
            {addingToWishlist ? (
              <ActivityIndicator size="small" color="#FF4B4B" />
            ) : (
              <Heart 
                size={24} 
                color="#FF4B4B" 
              fill={isProductInWishlist ? '#FF4B4B' : 'none'} 
              />
            )}
          </TouchableOpacity>

        {/* Product Info Card */}
        <View style={styles.infoCard}>
          {/* Stock indicator */}
          <StockIndicator />
          
          {/* Title and Price */}
          <View style={styles.titleContainer}>
            <Text style={styles.productName}>{sanitizeString(product.name)}</Text>
            <Text style={styles.unit}>{sanitizeString(product.unit)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{sanitizeString(product.price || 0)}</Text>
            {product.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{sanitizeString(product.discount)}% OFF</Text>
              </View>
            )}
          </View>

          {/* Rating */}
          {product.rating > 0 && (
            <View style={styles.ratingContainer}>
              <View style={styles.ratingBadge}>
                <Star size={14} color="#FFF" fill="#FFF" />
                <Text style={styles.ratingText}>{sanitizeString(product.rating)}</Text>
              </View>
              <Text style={styles.reviews}>
                ({sanitizeString(product.review_count || 0)} reviews)
              </Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{sanitizeString(product.description)}</Text>

          {/* Delivery Info */}
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryItem}>
              <Clock size={18} color="#2ECC71" />
              <Text style={styles.deliveryText}>Delivery within 24 hours</Text>
            </View>
            <View style={styles.deliveryItem}>
              <CheckCircle size={18} color="#2ECC71" />
              <Text style={styles.deliveryText}>Return available for 7 days</Text>
            </View>
          </View>

          {/* Nutrition Info */}
          {product.nutrition && Object.keys(product.nutrition).length > 0 && (
            <View style={styles.nutritionSection}>
              <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              <View style={styles.nutritionGrid}>
                {Object.entries(product.nutrition).map(([key, value]) => (
                  <View key={key} style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{sanitizeString(value)}</Text>
                    <Text style={styles.nutritionLabel}>
                      {sanitizeString(key.charAt(0).toUpperCase() + key.slice(1))}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Related Products */}
          <RelatedProducts />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity 
            onPress={() => handleQuantityChange('decrease')}
            style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
            disabled={quantity <= 1}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity">
            <Minus size={20} color={quantity <= 1 ? '#999' : '#333'} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity 
            onPress={() => handleQuantityChange('increase')}
            style={styles.quantityButton}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity">
            <Plus size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            addingToCart && styles.disabledButton,
            addedToCart && styles.successButton
          ]}
          disabled={addingToCart}
          onPress={handleAddToCart}
          accessibilityRole="button"
          accessibilityLabel="Add to cart">
          {addingToCart ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              {addedToCart ? (
                <CheckCircle size={20} color="#fff" />
              ) : (
              <ShoppingBag size={20} color="#fff" />
              )}
              <Text style={styles.addToCartButtonText}>
                {addedToCart ? 'Added to Cart!' : `Add to Cart • ₹${totalPrice}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    ...Platform.select({
      ios: {
        paddingTop: 48,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: width,
    height: width,
  },
  indicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 24,
  },
  wishlistButton: {
    position: 'absolute',
    right: 16,
    top: width - 56,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  infoCard: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stockText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  titleContainer: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  unit: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    color: '#2ECC71',
  },
  discountBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  discountText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#2ECC71',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA41C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  reviews: {
    marginLeft: 8,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  deliveryInfo: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  nutritionSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  nutritionItem: {
    width: (width - 56) / 2,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  relatedSection: {
    marginTop: 16,
  },
  relatedScrollContent: {
    paddingRight: 16,
  },
  relatedProduct: {
    width: 140,
    marginRight: 16,
  },
  relatedProductImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  relatedProductName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#333',
    marginBottom: 4,
  },
  relatedProductPrice: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#2ECC71',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  successButton: {
    backgroundColor: '#27AE60',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FF4B4B',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});

