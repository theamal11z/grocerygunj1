import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { ChevronLeft, Star, ShoppingBag, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProducts } from '@/hooks/useProducts';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { Product } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function PopularProductsScreen() {
  const { products, loading, error, fetchProducts } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);

  // Process products to get popular items (sorted by rating)
  useEffect(() => {
    if (products && products.length) {
      const sorted = [...products]
        .sort((a, b) => {
          // Sort by rating (if available)
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          
          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          }
          
          // Then by review count
          const reviewCountA = a.review_count || 0;
          const reviewCountB = b.review_count || 0;
          return reviewCountB - reviewCountA;
        });
      
      setPopularProducts(sorted);
    }
  }, [products]);

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load popular products" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Popular Products</Text>
        <View style={{ width: 40 }} />
      </View>

      {popularProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingBag size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No popular products found</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2ECC71']}
              tintColor="#2ECC71"
            />
          }
        >
          <View style={styles.gridContainer}>
            {popularProducts.map((product, index) => (
              <Animated.View 
                key={product.id} 
                entering={FadeIn.delay(index * 50)}
                style={styles.gridItem}
              >
                <TouchableOpacity 
                  style={styles.productCard}
                  onPress={() => router.push({
                    pathname: '/product/[id]',
                    params: { id: product.id }
                  })}
                >
                  <Image 
                    source={{ uri: product.image_urls[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' }} 
                    style={styles.productImage} 
                  />
                  {product.discount !== null && product.discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{product.discount}% OFF</Text>
                    </View>
                  )}
                  <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.productUnit}>{product.unit}</Text>
                    <View style={styles.ratingContainer}>
                      <Star size={14} color="#FFC107" fill="#FFC107" />
                      <Text style={styles.ratingText}>{product.rating ? product.rating.toFixed(1) : '4.0'}</Text>
                      {product.review_count ? (
                        <Text style={styles.reviewCount}>({product.review_count})</Text>
                      ) : null}
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton}>
                      <Plus size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          <View style={styles.footerSpace} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#666',
    marginTop: 16,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
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
    marginBottom: 4,
  },
  productUnit: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  ratingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  reviewCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2ECC71',
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#2ECC71',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSpace: {
    height: 100,
  },
}); 