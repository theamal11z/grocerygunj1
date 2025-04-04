import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Heart, Trash2, ShoppingBag } from 'lucide-react-native';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function WishlistScreen() {
  const { wishlistItems, loading, error, removeFromWishlist, clearWishlist, addAllToCart, refreshWishlist, lastUpdated } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFocusRefresh, setLastFocusRefresh] = useState(0);

  // Refresh wishlist when the screen comes into focus, but not too frequently
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      
      const now = Date.now();
      // Only refresh if it's been more than 2 seconds since the last refresh
      // or if this is the first time (lastFocusRefresh === 0)
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

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Please Login</Text>
        <Text style={styles.emptyText}>You need to login to view your wishlist</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load wishlist" />;
  }

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

  if (wishlistItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
        <Text style={styles.emptyText}>Add items to your wishlist to see them here</Text>
        <TouchableOpacity 
          style={styles.shopButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.shopButtonText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wishlist</Text>
        <Text style={styles.subtitle}>{wishlistItems.length} items saved</Text>
        {wishlistItems.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearWishlist}
            disabled={processingAction === 'clear'}
          >
            <Text style={styles.clearButtonText}>
              {processingAction === 'clear' ? 'Clearing...' : 'Clear All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.wishlist}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2ECC71']}
            tintColor="#2ECC71"
          />
        }
      >
        {wishlistItems.map((item) => (
          <View key={item.id} style={styles.wishlistItem}>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/product/[id]',
                  params: { id: item.product_id }
                });
              }}
            >
              <Image 
                source={{ uri: item.product.image_urls[0] }} 
                style={styles.itemImage} 
              />
            </TouchableOpacity>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemPrice}>₹{item.product.price}/{item.product.unit}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  addToCart(item.product_id, 1);
                }}
              >
                <ShoppingBag size={24} color="#2ECC71" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleRemoveFromWishlist(item.product_id)}
                disabled={processingAction === item.product_id}
              >
                {processingAction === item.product_id ? (
                  <ActivityIndicator size="small" color="#FF4B4B" />
                ) : (
                  <Trash2 size={24} color="#FF4B4B" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {wishlistItems.length > 0 && (
        <TouchableOpacity 
          style={styles.addAllButton}
          onPress={handleAddAllToCart}
          disabled={processingAction === 'add-all'}
        >
          {processingAction === 'add-all' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.addAllButtonText}>Add All to Cart</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'column',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  clearButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    padding: 8,
  },
  clearButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FF4B4B',
  },
  wishlist: {
    flex: 1,
    padding: 20,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#2ECC71',
  },
  actions: {
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  addAllButton: {
    margin: 20,
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addAllButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    alignItems: 'center',
  },
  shopButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  loginButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    alignItems: 'center',
  },
  loginButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});