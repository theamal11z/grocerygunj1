import React, { useEffect, useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationIconProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
  hideBackground?: boolean;
  onPress?: () => void;
}

export function NotificationIcon({ 
  size = 24, 
  color = '#333', 
  backgroundColor = '#f5f5f5',
  hideBackground = false,
  onPress
}: NotificationIconProps) {
  const { unreadCount } = useNotifications();
  const [prevCount, setPrevCount] = useState(unreadCount);
  
  // Animation for the badge when count changes
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Only animate if the count has changed and is not the initial render
    if (prevCount !== unreadCount) {
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
      
      // Animate the bell icon with a pulse effect
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
      setPrevCount(unreadCount);
    }
  }, [unreadCount, scaleAnim, pulseAnim, prevCount]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/notifications');
    }
  };

  return (
    <View style={{ position: 'relative' }}>
      <TouchableOpacity 
        style={[
          styles.container, 
          hideBackground ? styles.transparentContainer : { backgroundColor }
        ]}
        onPress={handlePress}
        accessibilityLabel={`Notifications with ${unreadCount} unread`}
        accessibilityRole="button"
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Bell size={size} color={color} />
        </Animated.View>
      </TouchableOpacity>
      
      {unreadCount > 0 && (
        <Animated.View 
          style={[
            styles.badge,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 12,
    position: 'relative',
  },
  transparentContainer: {
    padding: 0,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#9C27B0',
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