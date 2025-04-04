import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { 
  Search as SearchIcon, 
  X, 
  TrendingUp,
  Clock,
  Star,
  Filter,
  SlidersHorizontal,
  Plus
} from 'lucide-react-native';
import { useSearch } from '@/hooks/useSearch';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import type { Product } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchScreen() {
  const { products, categories, loading, error, searchProducts, fetchCategories, fetchPopularProducts } = useSearch();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortOption, setSortOption] = useState<'price_asc' | 'price_desc' | 'rating' | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Trending searches - in a real app, these would come from analytics
  const trendingSearches = ['Apples', 'Organic', 'Milk', 'Rice', 'Vegetables'];
  
  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
    fetchCategories();
    fetchPopularProducts();
  }, [fetchCategories, fetchPopularProducts]);
  
  const loadRecentSearches = async () => {
    try {
      const storedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
    } catch (error) {
      
    }
  };
  
  const saveRecentSearch = async (search: string) => {
    try {
      if (!search.trim() || recentSearches.includes(search)) return;
      
      const updatedSearches = [search, ...recentSearches.filter(s => s !== search)]
        .slice(0, MAX_RECENT_SEARCHES);
      
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      
    }
  };
  
  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      
    }
  };

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      searchProducts(query, selectedCategory || undefined);
      saveRecentSearch(query);
    }
  }, [query, selectedCategory, searchProducts]);
  
  const handleRecentSearchPress = (search: string) => {
    setQuery(search);
    searchProducts(search, selectedCategory || undefined);
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedCategory(null);
    setSortOption(null);
    setInStockOnly(false);
    setShowFilterOptions(false);
    fetchPopularProducts();
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPopularProducts();
    setRefreshing(false);
  };
  
  // Apply sorting and filtering
  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];
    
    // Apply in-stock filter
    if (inStockOnly) {
      filtered = filtered.filter(product => product.in_stock);
    }
    
    // Apply sorting
    if (sortOption) {
      filtered.sort((a, b) => {
        switch (sortOption) {
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          default:
            return 0;
        }
      });
    }
    
    return filtered;
  };
  
  const filteredProducts = getFilteredAndSortedProducts();

  if (error) {
    return <ErrorMessage message="Failed to load search results" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          {query ? (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowFilterOptions(!showFilterOptions)}
              style={styles.filterButton}
            >
              <SlidersHorizontal size={20} color="#2ECC71" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Filter Options */}
      {showFilterOptions && (
        <Animated.View 
          entering={FadeInDown.duration(200)}
          style={styles.filterOptions}
        >
          <Text style={styles.filterTitle}>Sort By</Text>
          <View style={styles.sortOptions}>
            <TouchableOpacity 
              style={[styles.sortOption, sortOption === 'price_asc' && styles.selectedSortOption]}
              onPress={() => setSortOption('price_asc')}
            >
              <Text style={[styles.sortOptionText, sortOption === 'price_asc' && styles.selectedSortOptionText]}>
                Price: Low to High
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortOption, sortOption === 'price_desc' && styles.selectedSortOption]}
              onPress={() => setSortOption('price_desc')}
            >
              <Text style={[styles.sortOptionText, sortOption === 'price_desc' && styles.selectedSortOptionText]}>
                Price: High to Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortOption, sortOption === 'rating' && styles.selectedSortOption]}
              onPress={() => setSortOption('rating')}
            >
              <Text style={[styles.sortOptionText, sortOption === 'rating' && styles.selectedSortOptionText]}>
                Highest Rated
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterDivider} />
          
          <Text style={styles.filterTitle}>Filter</Text>
          <TouchableOpacity 
            style={styles.stockFilterOption}
            onPress={() => setInStockOnly(!inStockOnly)}
          >
            <View style={[styles.checkbox, inStockOnly && styles.checkedCheckbox]}>
              {inStockOnly && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.stockFilterText}>In Stock Only</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

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
        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category, index) => (
            <Animated.View 
              key={category.id}
              entering={FadeInRight.delay(index * 50)}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.selectedCategoryChip,
                ]}
                onPress={() => {
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  );
                  if (query) handleSearch();
                }}
              >
                {category.image_url && (
                  <Image 
                    source={{ uri: category.image_url }} 
                    style={styles.categoryImage}
                  />
                )}
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText,
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2ECC71" />
            <Text style={styles.loadingText}>Searching for products...</Text>
          </View>
        ) : (
          <>
            {query ? (
              // Search Results
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Search Results</Text>
                  <Text style={styles.resultsCount}>{filteredProducts.length} results</Text>
                </View>
                
                {filteredProducts.length === 0 ? (
                  <View style={styles.emptyResults}>
                    <Image 
                      source={{ uri: 'https://illustrations.popsy.co/amber/no-results.svg' }} 
                      style={styles.emptyResultsImage}
                    />
                    <Text style={styles.emptyResultsTitle}>No results found</Text>
                    <Text style={styles.emptyResultsText}>
                      We couldn't find any products matching "{query}"
                    </Text>
                    <TouchableOpacity 
                      style={styles.browseButton}
                      onPress={clearSearch}
                    >
                      <Text style={styles.browseButtonText}>Browse Products</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.productsGrid}>
                    {filteredProducts.map((product, index) => (
                      <Animated.View 
                        key={product.id}
                        entering={FadeIn.delay(index * 50)}
                        style={styles.gridItem}
                      >
                        <TouchableOpacity
                          style={styles.productCard}
                          onPress={() => {
                            router.push({
                              pathname: '/product/[id]',
                              params: { id: product.id }
                            });
                          }}
                        >
                          <Image
                            source={{ uri: product.image_urls[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' }}
                            style={styles.productImage}
                          />
                          {product.discount && product.discount > 0 && (
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountText}>{product.discount}% OFF</Text>
                            </View>
                          )}
                          <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                            <Text style={styles.productUnit}>{product.unit}</Text>
                            {product.rating ? (
                              <View style={styles.ratingContainer}>
                                <Star size={12} color="#FFC107" fill="#FFC107" />
                                <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
                              </View>
                            ) : null}
                            <View style={styles.priceRow}>
                              <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                              {product.discount && product.discount > 0 && (
                                <Text style={styles.originalPrice}>
                                  ₹{(product.price / (1 - product.discount / 100)).toFixed(2)}
                                </Text>
                              )}
                            </View>
                            {!product.in_stock && (
                              <Text style={styles.outOfStock}>Out of stock</Text>
                            )}
                          </View>
                          <TouchableOpacity style={styles.addButton}>
                            <Plus size={16} color="#fff" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              // Not searching - show recent and trending
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <View style={styles.searchSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleContainer}>
                        <Clock size={16} color="#666" />
                        <Text style={styles.sectionTitle}>Recent Searches</Text>
                      </View>
                      <TouchableOpacity onPress={clearRecentSearches}>
                        <Text style={styles.clearText}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.searchTermsContainer}>
                      {recentSearches.map((search, index) => (
                        <TouchableOpacity
                          key={`recent-${index}`}
                          style={styles.searchTermChip}
                          onPress={() => handleRecentSearchPress(search)}
                        >
                          <Clock size={14} color="#666" />
                          <Text style={styles.searchTermText}>{search}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Trending Searches */}
                <View style={styles.searchSection}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <TrendingUp size={16} color="#666" />
                      <Text style={styles.sectionTitle}>Trending Searches</Text>
                    </View>
                  </View>
                  <View style={styles.searchTermsContainer}>
                    {trendingSearches.map((search, index) => (
                      <TouchableOpacity
                        key={`trending-${index}`}
                        style={styles.searchTermChip}
                        onPress={() => handleRecentSearchPress(search)}
                      >
                        <TrendingUp size={14} color="#666" />
                        <Text style={styles.searchTermText}>{search}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Popular Products */}
                <View style={styles.searchSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Popular Products</Text>
                  </View>
                  <View style={styles.productsGrid}>
                    {filteredProducts.map((product, index) => (
                      <Animated.View 
                        key={product.id}
                        entering={FadeIn.delay(index * 50)}
                        style={styles.gridItem}
                      >
                        <TouchableOpacity
                          style={styles.productCard}
                          onPress={() => {
                            router.push({
                              pathname: '/product/[id]',
                              params: { id: product.id }
                            });
                          }}
                        >
                          <Image
                            source={{ uri: product.image_urls[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' }}
                            style={styles.productImage}
                          />
                          {product.discount && product.discount > 0 && (
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountText}>{product.discount}% OFF</Text>
                            </View>
                          )}
                          <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                            <Text style={styles.productUnit}>{product.unit}</Text>
                            {product.rating ? (
                              <View style={styles.ratingContainer}>
                                <Star size={12} color="#FFC107" fill="#FFC107" />
                                <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
                              </View>
                            ) : null}
                            <View style={styles.priceRow}>
                              <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                              {product.discount && product.discount > 0 && (
                                <Text style={styles.originalPrice}>
                                  ₹{(product.price / (1 - product.discount / 100)).toFixed(2)}
                                </Text>
                              )}
                            </View>
                            {!product.in_stock && (
                              <Text style={styles.outOfStock}>Out of stock</Text>
                            )}
                          </View>
                          <TouchableOpacity style={styles.addButton}>
                            <Plus size={16} color="#fff" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </>
        )}
        
        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
    height: 24,
    padding: 0,
  },
  filterButton: {
    padding: 4,
  },
  filterOptions: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  filterTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectedSortOption: {
    backgroundColor: '#E8F5E9',
  },
  sortOptionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  selectedSortOptionText: {
    color: '#2ECC71',
    fontFamily: 'Poppins-Medium',
  },
  filterDivider: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginVertical: 12,
  },
  stockFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    borderColor: '#2ECC71',
    backgroundColor: '#2ECC71',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  stockFilterText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  selectedCategoryChip: {
    backgroundColor: '#E8F5E9',
  },
  categoryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#2ECC71',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  searchSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  resultsCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  clearText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
  },
  searchTermsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
  },
  searchTermChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  searchTermText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#333',
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyResultsImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyResultsTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  emptyResultsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  browseButton: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  gridItem: {
    width: (width - 48) / 2, // Account for padding
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  productInfo: {
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
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
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
  outOfStock: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#2ECC71',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSpace: {
    height: 100,
  },
});