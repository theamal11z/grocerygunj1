import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { ChevronLeft, ShoppingBag } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCategories } from '@/hooks/useCategories';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const cardWidth = (width - 64) / 3; // 3 cards per row with margins

export default function CategoriesScreen() {
  const { categories, loading, error, fetchCategories } = useCategories();
  const [refreshing, setRefreshing] = useState(false);

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load categories" />;
  }

  // Group categories into rows of 3
  const chunkArray = (array: any[], size: number) => {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
      array.slice(index * size, index * size + size)
    );
  };

  const categoryRows = chunkArray(categories, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>All Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingBag size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No categories found</Text>
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
            {categories.map((category, index) => (
              <Animated.View 
                key={category.id} 
                entering={FadeIn.delay(index * 50)}
                style={styles.gridItem}
              >
                <TouchableOpacity 
                  style={styles.categoryCard}
                  onPress={() => router.push({
                    pathname: '/products',
                    params: { categoryId: category.id }
                  })}
                >
                  <Image 
                    source={{ uri: category.image_url || 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=400&q=80' }} 
                    style={styles.categoryImage} 
                    resizeMode="cover"
                  />
                  <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  gridItem: {
    width: cardWidth,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryImage: {
    width: cardWidth - 24,
    height: cardWidth - 24,
    borderRadius: (cardWidth - 24) / 2,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  categoryName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    height: 40,
  },
  footerSpace: {
    height: 100,
  },
}); 