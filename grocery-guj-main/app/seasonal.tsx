import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { ChevronLeft, Calendar, ShoppingBag, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProducts } from '@/hooks/useProducts';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { Product } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function SeasonalProductsScreen() {
  const { products, loading, error, fetchProducts } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [seasonalProducts, setSeasonalProducts] = useState<Product[]>([]);

  // Process products to get seasonal items 
  // In a real app, this would be based on actual season/month data
  // For now, we'll just randomize the products to simulate "seasonal" items
  useEffect(() => {
    if (products && products.length) {
      // Simulate seasonal products by randomly selecting some products
      // In a real app, you would have a "seasonal" flag or category
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setSeasonalProducts(shuffled.slice(0, 20)); // Get 20 random products
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
    return <ErrorMessage message="Failed to load seasonal products" />;
  }

  // Create left and right columns for masonry layout
  const leftColumnItems = seasonalProducts.filter((_, index) => index % 2 === 0);
  const rightColumnItems = seasonalProducts.filter((_, index) => index % 2 === 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Seasonal Picks</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.seasonBanner}>
        <Calendar size={20} color="#2ECC71" />
        <Text style={styles.seasonBannerText}>Current Season: Summer</Text>
      </View>

      {seasonalProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingBag size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No seasonal products found</Text>
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
          <View style={styles.masonryContainer}>
            {/* Left Column */}
            <View style={styles.masonryColumn}>
              {leftColumnItems.map((product, index) => (
                <Animated.View 
                  key={product.id} 
                  entering={FadeIn.delay(index * 50)}
                >
                  <TouchableOpacity 
                    style={[styles.productCard, index % 3 === 0 ? styles.tallCard : styles.shortCard]}
                    onPress={() => router.push({
                      pathname: '/product/[id]',
                      params: { id: product.id }
                    })}
                  >
                    <Image 
                      source={{ uri: product.image_urls[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' }} 
                      style={[styles.productImage, index % 3 === 0 ? styles.tallImage : styles.shortImage]} 
                    />
                    {product.discount !== null && product.discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{product.discount}% OFF</Text>
                      </View>
                    )}
                    <View style={styles.productDetails}>
                      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.productUnit}>{product.unit}</Text>
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

            {/* Right Column */}
            <View style={styles.masonryColumn}>
              {rightColumnItems.map((product, index) => (
                <Animated.View 
                  key={product.id} 
                  entering={FadeIn.delay(index * 50 + 25)}
                >
                  <TouchableOpacity 
                    style={[styles.productCard, index % 3 === 1 ? styles.tallCard : styles.shortCard]}
                    onPress={() => router.push({
                      pathname: '/product/[id]',
                      params: { id: product.id }
                    })}
                  >
                    <Image 
                      source={{ uri: product.image_urls[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' }} 
                      style={[styles.productImage, index % 3 === 1 ? styles.tallImage : styles.shortImage]} 
                    />
                    {product.discount !== null && product.discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{product.discount}% OFF</Text>
                      </View>
                    )}
                    <View style={styles.productDetails}>
                      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.productUnit}>{product.unit}</Text>
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
  seasonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    marginBottom: 16,
  },
  seasonBannerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  masonryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  masonryColumn: {
    width: (width - 40) / 2,
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
    marginBottom: 16,
  },
  tallCard: {
    height: 280,
  },
  shortCard: {
    height: 240,
  },
  productImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  tallImage: {
    height: 180,
  },
  shortImage: {
    height: 140,
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
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