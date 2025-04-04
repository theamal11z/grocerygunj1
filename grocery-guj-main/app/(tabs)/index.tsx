import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, RefreshControl } from 'react-native';
import { Search, Bell, ChevronRight, MapPin, Truck, Star, Clock, Bookmark, TrendingUp, ChevronDown } from 'lucide-react-native';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { CartIcon } from '@/components/CartIcon';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import type { Product } from '@/lib/supabase';
import { OfferBanner } from '@/components/OfferBanner';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { products, loading: productsLoading, error: productsError, fetchProducts } = useProducts();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { user } = useAuth();
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('User');
  const [profile, setProfile] = useState<{ first_name?: string } | null>(null);
  const [userAddress, setUserAddress] = useState('');

  useEffect(() => {
    // Get user profile data
    if (user) {
      fetchUserProfile();
    }
    
    // Get popular products (most ordered)
    if (products && products.length > 0) {
      fetchPopularProducts();
    }
  }, [user, products]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
        
      if (data && !error) {
        // Just take the first name
        const firstName = data.full_name.split(' ')[0];
        setUserName(firstName);
        setProfile({ first_name: firstName });
      }
    } catch (err) {
      
    }
  };

  const fetchPopularProducts = async () => {
    try {
      // In a real app, we'd query for most ordered products
      // For now, just use the first few products and randomize them
      if (products && products.length > 0) {
        setPopularProducts(
          [...products]
            .sort(() => 0.5 - Math.random())
            .slice(0, 4)
        );
      }
    } catch (err) {
      
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    fetchPopularProducts();
    setRefreshing(false);
  };

  if ((productsLoading || categoriesLoading) && !refreshing) {
    return <LoadingSpinner />;
  }

  if (productsError || categoriesError) {
    return <ErrorMessage message="Failed to load data" />;
  }

  // Products on sale (with discounts)
  const deals = products
    .filter(product => product.discount && product.discount > 0)
    .slice(0, 5);

  // Featured products (can be manually curated in a real app)
  const featuredProducts = products.slice(0, 3);

  // Get seasonal products (just using some random products here)
  const seasonalProducts = [...products]
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  // The greeting message
  const greeting = profile?.first_name ? `Hello, ${profile.first_name}!` : 'Hello, User!';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2ECC71']}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#666" />
            <Text style={styles.location}>Birgunj, Nepal</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <View style={styles.cartIconContainer}>
            <CartIcon size={26} color="#2ECC71" backgroundColor="#E8F5E9" />
          </View>
          <TouchableOpacity 
            style={styles.notification}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offer Banner */}
      <OfferBanner />

      <TouchableOpacity 
        style={styles.searchBar}
        onPress={() => router.push('/(tabs)/search')}
      >
        <Search size={20} color="#666" />
        <Text style={styles.searchText}>Search for groceries...</Text>
      </TouchableOpacity>

      {/* Featured Banner */}
      <TouchableOpacity 
        style={styles.featuredBanner}
        onPress={() => router.push('/offers')}
      >
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1553546895-531931aa1aa8?w=600&q=80' }}
          style={styles.bannerImage}
          imageStyle={{ borderRadius: 16 }}
        >
          <View style={styles.bannerContent}>
            <Animated.View entering={FadeIn.delay(200)}>
              <Text style={styles.bannerTitle}>Fresh Vegetables</Text>
              <Text style={styles.bannerSubtitle}>Get 20% off on your first order</Text>
              <View style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Shop Now</Text>
              </View>
            </Animated.View>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      {/* Delivery Status Card (for logged in users) */}
      {user && (
        <Animated.View entering={FadeIn.delay(200)} style={styles.deliveryCard}>
          <View style={styles.deliveryIconContainer}>
            <Truck size={24} color="#2ECC71" />
          </View>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryTitle}>Your delivery status</Text>
            <Text style={styles.deliveryStatus}>Delivery in 30 minutes</Text>
          </View>
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Categories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity 
            style={styles.seeAll}
            onPress={() => router.push('/categories')}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <ChevronRight size={20} color="#2ECC71" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category, index) => (
            <Animated.View 
              key={category.id} 
              entering={FadeInRight.delay(index * 100)}
            >
              <TouchableOpacity 
                style={styles.categoryCard}
                onPress={() => router.push({
                  pathname: '/products',
                  params: { categoryId: category.id }
                })}
              >
                <Image 
                  source={{ uri: category.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' }} 
                  style={styles.categoryImage} 
                />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Today's Deals Section */}
      {deals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Clock size={18} color="#2ECC71" />
              <Text style={styles.sectionTitle}>Today's Deals</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAll}
              onPress={() => router.push('/offers')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={20} color="#2ECC71" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dealsScroll}>
            {deals.map((deal, index) => (
              <Animated.View 
                key={deal.id} 
                entering={FadeInRight.delay(index * 100)}
              >
                <TouchableOpacity 
                  style={styles.dealCard}
                  onPress={() => router.push({
                    pathname: '/product/[id]',
                    params: { id: deal.id }
                  })}
                >
                  <Image 
                    source={{ uri: deal.image_urls[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' }} 
                    style={styles.dealImage} 
                  />
                  {deal.discount && deal.discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{deal.discount}% OFF</Text>
                    </View>
                  )}
                  <View style={styles.dealDetails}>
                    <Text style={styles.dealName} numberOfLines={1}>{deal.name}</Text>
                    <Text style={styles.dealUnit}>{deal.unit}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.dealPrice}>₹{deal.price.toFixed(2)}</Text>
                      {deal.discount && deal.discount > 0 && (
                        <Text style={styles.originalPrice}>₹{(deal.price / (1 - deal.discount / 100)).toFixed(2)}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Popular Products Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <TrendingUp size={18} color="#2ECC71" />
            <Text style={styles.sectionTitle}>Popular Items</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/popular')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
          {popularProducts.map((product, index) => (
            <Animated.View 
              key={product.id}
              entering={FadeInRight.delay(index * 100)}
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
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.productUnit}>{product.unit}</Text>
                  <View style={styles.ratingContainer}>
                    <Star size={14} color="#FFC107" fill="#FFC107" />
                    <Text style={styles.ratingText}>{(product.rating ?? 4.8).toFixed(1)}</Text>
                  </View>
                  <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Seasonal Products Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Seasonal Picks</Text>
          <TouchableOpacity onPress={() => router.push('/seasonal')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.gridContainer}>
          {seasonalProducts.map((product, index) => (
            <Animated.View 
              key={product.id}
              entering={FadeIn.delay(index * 100)}
              style={styles.gridItem}
            >
              <TouchableOpacity 
                style={styles.gridCard}
                onPress={() => router.push({
                  pathname: '/product/[id]',
                  params: { id: product.id }
                })}
              >
                <Image 
                  source={{ uri: product.image_urls[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' }} 
                  style={styles.gridImage} 
                />
                <View style={styles.gridDetails}>
                  <Text style={styles.gridName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.gridPrice}>₹{product.price}/{product.unit}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Footer Spacer */}
      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  greeting: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartIconContainer: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 12,
  },
  notification: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  searchText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  featuredBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  bannerContent: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    height: '100%',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryIconContainer: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  deliveryStatus: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2ECC71',
  },
  trackButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  trackButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
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
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
  },
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoryCard: {
    marginRight: 16,
    alignItems: 'center',
    width: 90,
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  categoryName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  dealsScroll: {
    paddingLeft: 20,
  },
  dealCard: {
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  dealImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
  dealDetails: {
    padding: 12,
  },
  dealName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
  },
  dealUnit: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  dealPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2ECC71',
  },
  originalPrice: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productsScroll: {
    paddingLeft: 20,
  },
  productCard: {
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productDetails: {
    padding: 12,
  },
  productName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
  },
  productUnit: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#666',
  },
  productPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2ECC71',
    marginTop: 4,
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
  addButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  gridItem: {
    width: (width - 56) / 2, // Subtract padding and gap
  },
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gridImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridDetails: {
    padding: 12,
  },
  gridName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
  },
  gridPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2ECC71',
    marginTop: 4,
  },
  footerSpace: {
    height: 100,
  },
  viewAll: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
  },
});