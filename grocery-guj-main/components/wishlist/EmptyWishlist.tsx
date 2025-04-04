import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, ShoppingBag, LogIn } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

interface EmptyWishlistProps {
  isLoggedIn: boolean;
}

export function EmptyWishlist({ isLoggedIn }: EmptyWishlistProps) {
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(400)}>
          <LogIn size={80} color="#f0f0f0" />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.title}>Please Login</Text>
          <Text style={styles.message}>You need to login to view your wishlist</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(400)}>
        <Heart size={80} color="#f0f0f0" />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Text style={styles.title}>Your Wishlist is Empty</Text>
        <Text style={styles.message}>Add items to your wishlist to see them here</Text>
        <TouchableOpacity 
          style={styles.shopButton}
          onPress={() => router.push('/')}
        >
          <ShoppingBag size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.shopButtonText}>Shop Now</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: 200,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  shopButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: 200,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  shopButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  buttonIcon: {
    marginRight: 8,
  }
}); 