import React, { useEffect, useState, useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCart } from '@/lib/CartContext';

interface CartIconProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export function CartIcon({ 
  size = 24, 
  color = '#333', 
  backgroundColor = '#f5f5f5' 
}: CartIconProps) {
  const { getCartTotals } = useCart();
  const { itemCount } = getCartTotals();
  const [prevCount, setPrevCount] = useState(itemCount);
  
  // Animation for the badge when count changes
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Only animate if the count has changed and is not the initial render
    if (prevCount !== itemCount) {
      // Animate the badge
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Animate the cart icon with a pulse effect
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Update previous count
      setPrevCount(itemCount);
    }
  }, [itemCount, scaleAnim, pulseAnim, prevCount]);

  const handlePress = () => {
    router.push('/cart');
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor }]}
      onPress={handlePress}
      accessibilityLabel={`Cart with ${itemCount} items`}
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <ShoppingCart size={size} color={color} />
      </Animated.View>
      
      {itemCount > 0 && (
        <Animated.View 
          style={[
            styles.badge,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.badgeText}>
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4B4B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
}); 