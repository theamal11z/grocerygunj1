import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface Category {
  name: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  if (!categories.length) {
    return null;
  }
  
  return (
    <Animated.View entering={FadeIn.delay(100).duration(300)}>
      <Text style={styles.filterTitle}>Filter by category</Text>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterOptions}
      >
        <TouchableOpacity
          style={[
            styles.filterOption,
            selectedCategory === null && styles.selectedFilter
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <Text style={[
            styles.filterOptionText,
            selectedCategory === null && styles.selectedFilterText
          ]}>
            All Categories
          </Text>
        </TouchableOpacity>
        
        {categories.map(category => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.filterOption,
              selectedCategory === category.name && styles.selectedFilter
            ]}
            onPress={() => onSelectCategory(category.name)}
          >
            <Text style={[
              styles.filterOptionText,
              selectedCategory === category.name && styles.selectedFilterText
            ]}>
              {category.name} ({category.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  filterTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  filterOptions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedFilter: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  filterOptionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#666',
  },
  selectedFilterText: {
    color: '#2196f3',
  },
}); 