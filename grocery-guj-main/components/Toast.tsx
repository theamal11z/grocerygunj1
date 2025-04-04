import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface ToastProps {
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'info';
  onHide?: () => void;
}

const { width } = Dimensions.get('window');

const Toast: React.FC<ToastProps> = ({ 
  message, 
  duration = 3000, 
  type = 'success',
  onHide
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(20));
  
  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out after duration
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide) onHide();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [fadeAnim, translateY, duration, onHide]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#2ECC71';
      case 'error':
        return '#E74C3C';
      case 'info':
        return '#3498DB';
      default:
        return '#2ECC71';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [{ translateY }]
        }
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: width / 2 - 150,
    width: 300,
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  }
});

export default Toast; 