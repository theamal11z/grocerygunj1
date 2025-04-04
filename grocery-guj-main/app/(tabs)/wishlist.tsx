import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  RefreshControl,
  StatusBar
} from 'react-native';
import { Trash2, ShoppingBag, Search, Grid, List } from 'lucide-react-native';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import Animated, { 
  FadeIn, 
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import wishlist components
import { WishlistItem } from '@/components/wishlist/WishlistItem';
import { CategoryFilter } from '@/components/wishlist/CategoryFilter';
import { EmptyWishlist } from '@/components/wishlist/EmptyWishlist';

export default function WishlistScreen() {
  const { 
    wishlistItems, 
    loading, 
    error, 
    removeFromWishlist, 
    clearWishlist, 
    addAllToCart, 
    refreshWishlist, 
  } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFocusRefresh, setLastFocusRefresh] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Animation values
  const filterHeight = useSharedValue(0);
  
  // Animated styles
  const filterContainerStyle = useAnimatedStyle(() => {
    return {
      height: filterHeight.value,
      opacity: filterHeight.value === 0 ? 0 : 1,
      overflow: 'hidden',
    };
  });
  
  // Toggle filter section
  const toggleFilter = useCallback(() => {
    if (showFilter) {
      filterHeight.value = withTiming(0, { duration: 300 });
      setTimeout(() => setShowFilter(false), 300);
    } else {
      setShowFilter(true);
      filterHeight.value = withTiming(80, { duration: 300 });
    }
  }, [showFilter, filterHeight]);

  // Refresh wishlist when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      
      const now = Date.now();
      // Only refresh if it's been more than 2 seconds since the last refresh
      if (now - lastFocusRefresh > 2000 || lastFocusRefresh === 0) {
        refreshWishlist();
        setLastFocusRefresh(now);
      }
    }, [user?.id, refreshWishlist, lastFocusRefresh])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshWishlist();
    setRefreshing(false);
  }, [refreshWishlist]);

  // Group items by category for filtering
  const categories = React.useMemo(() => {
    if (!wishlistItems.length) return [];
    
    const categoriesMap = new Map();
    wishlistItems.forEach(item => {
      // Safely access category with type checking
      const category = (item.product as any).category || 'Uncategorized';
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, 1);
      } else {
        categoriesMap.set(category, categoriesMap.get(category) + 1);
      }
    });
    
    return Array.from(categoriesMap.entries()).map(([name, count]) => ({
      name,
      count
    }));
  }, [wishlistItems]);
  
  // Filter items by category
  const filteredItems = React.useMemo(() => {
    if (!selectedCategory) return wishlistItems;
    
    return wishlistItems.filter(item => 
      ((item.product as any).category || 'Uncategorized') === selectedCategory
    );
  }, [wishlistItems, selectedCategory]);

  // Handle removing item from wishlist
  const handleRemoveFromWishlist = async (productId: string) => {
    setProcessingAction(productId);
    try {
      await removeFromWishlist(productId);
    } catch (err) {
      Alert.alert('Error', 'Failed to remove item from wishlist');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle adding item to cart
  const handleAddToCart = async (productId: string) => {
    setProcessingAction(`cart-${productId}`);
    try {
      await addToCart(productId, 1);
      Alert.alert('Success', 'Item added to cart');
    } catch (err) {
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle adding all items to cart
  const handleAddAllToCart = async () => {
    setProcessingAction('add-all');
    try {
      const result = await addAllToCart();
      
      if (result.success) {
        if (result.count === result.total) {
          Alert.alert('Success', 'All items added to cart');
          router.push('/cart');
        } else {
          Alert.alert('Partial Success', `${result.count} out of ${result.total} items added to cart`);
          router.push('/cart');
        }
      } else {
        Alert.alert('Error', 'Failed to add items to cart');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add items to cart');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle clearing the wishlist
  const handleClearWishlist = async () => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to clear your wishlist?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setProcessingAction('clear');
            try {
              await clearWishlist();
              Alert.alert('Success', 'Wishlist cleared');
            } catch (err) {
              Alert.alert('Error', 'Failed to clear wishlist');
            } finally {
              setProcessingAction(null);
            }
          },
        },
      ]
    );
  };

  // Render wishlist item
  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <WishlistItem 
      item={item}
      index={index}
      viewMode={viewMode}
      onRemove={handleRemoveFromWishlist}
      onAddToCart={handleAddToCart}
      processingAction={processingAction}
    />
  );

  // Show loading state
  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  // Show error state
  if (error) {
    return <ErrorMessage message="Failed to load wishlist" />;
  }

  // Show empty state for not logged in or empty wishlist
  if (!user || wishlistItems.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <StatusBar barStyle="dark-content" />
        <EmptyWishlist isLoggedIn={!!user} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <Animated.View 
        entering={FadeIn.duration(300)} 
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Wishlist</Text>
            <Text style={styles.subtitle}>
              {filteredItems.length === wishlistItems.length 
                ? `${wishlistItems.length} items saved` 
                : `${filteredItems.length} of ${wishlistItems.length} items`
              }
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={toggleFilter}
            >
              <Search size={22} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <List size={22} color="#333" />
              ) : (
                <Grid size={22} color="#333" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Filter section */}
        {showFilter && (
          <Animated.View style={[filterContainerStyle]}>
            <CategoryFilter 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Wishlist items */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
        contentContainerStyle={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2ECC71']}
            tintColor="#2ECC71"
          />
        }
      />

      {/* Footer actions */}
      <Animated.View 
        entering={SlideInDown.duration(400)}
        style={styles.footer}
      >
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClearWishlist}
          disabled={processingAction === 'clear'}
        >
          {processingAction === 'clear' ? (
            <ActivityIndicator size="small" color="#FF4B4B" />
          ) : (
            <>
              <Trash2 size={20} color="#FF4B4B" />
              <Text style={styles.clearButtonText}>Clear All</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addAllButton}
          onPress={handleAddAllToCart}
          disabled={processingAction === 'add-all'}
        >
          {processingAction === 'add-all' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <ShoppingBag size={20} color="#FFFFFF" />
              <Text style={styles.addAllButtonText}>Add All to Cart</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#333',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  gridContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF4B4B',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  clearButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FF4B4B',
  },
  addAllButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  addAllButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});