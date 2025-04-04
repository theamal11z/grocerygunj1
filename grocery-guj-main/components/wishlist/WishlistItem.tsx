import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions 
} from 'react-native';
import { Trash2, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 32 - COLUMN_GAP) / NUM_COLUMNS;

interface WishlistItemProps {
  item: any;
  index: number;
  viewMode: 'grid' | 'list';
  onRemove: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  processingAction: string | null;
}

export function WishlistItem({ 
  item, 
  index, 
  viewMode, 
  onRemove, 
  onAddToCart, 
  processingAction 
}: WishlistItemProps) {
  
  // Navigate to product details
  const navigateToProduct = () => {
    router.push({
      pathname: '/product/[id]',
      params: { id: item.product_id }
    });
  };
  
  // Grid view
  if (viewMode === 'grid') {
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).duration(400)}
        style={styles.gridItem}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={navigateToProduct}
          style={styles.gridItemInner}
        >
          <Image 
            source={{ uri: item.product.image_urls[0] }} 
            style={styles.gridItemImage}
            resizeMode="cover"
          />
          <View style={styles.gridItemInfo}>
            <Text style={styles.gridItemName} numberOfLines={2}>{item.product.name}</Text>
            <Text style={styles.gridItemPrice}>₹{item.product.price}/{item.product.unit}</Text>
          </View>
          
          <View style={styles.gridItemActions}>
            <TouchableOpacity 
              style={styles.gridItemBtn}
              onPress={() => onAddToCart(item.product_id)}
              disabled={processingAction === `cart-${item.product_id}`}
            >
              {processingAction === `cart-${item.product_id}` ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Plus size={16} color="#fff" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.gridItemBtn, styles.removeBtn]}
              onPress={() => onRemove(item.product_id)}
              disabled={processingAction === item.product_id}
            >
              {processingAction === item.product_id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Trash2 size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
  
  // List view
  return (
    <Animated.View 
      entering={SlideInRight.delay(index * 100).duration(400)}
      style={styles.listItem}
    >
      <TouchableOpacity
        onPress={navigateToProduct}
        style={styles.listItemContent}
      >
        <Image 
          source={{ uri: item.product.image_urls[0] }} 
          style={styles.listItemImage} 
        />
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemName}>{item.product.name}</Text>
          <Text style={styles.listItemCategory}>
            {(item.product as any).category || 'Uncategorized'}
          </Text>
          <Text style={styles.listItemPrice}>₹{item.product.price}/{item.product.unit}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.listItemActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onAddToCart(item.product_id)}
          disabled={processingAction === `cart-${item.product_id}`}
        >
          {processingAction === `cart-${item.product_id}` ? (
            <ActivityIndicator size="small" color="#2ECC71" />
          ) : (
            <Plus size={20} color="#2ECC71" />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onRemove(item.product_id)}
          disabled={processingAction === item.product_id}
        >
          {processingAction === item.product_id ? (
            <ActivityIndicator size="small" color="#FF4B4B" />
          ) : (
            <Trash2 size={20} color="#FF4B4B" />
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Grid Styles
  gridItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gridItemInner: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridItemImage: {
    width: '100%',
    height: ITEM_WIDTH,
    backgroundColor: '#f9f9f9',
  },
  gridItemInfo: {
    padding: 10,
  },
  gridItemName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  gridItemPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#2ECC71',
  },
  gridItemActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 8,
  },
  gridItemBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    backgroundColor: '#FF4B4B',
  },
  
  // List Styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listItemName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
  },
  listItemCategory: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  listItemPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2ECC71',
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 