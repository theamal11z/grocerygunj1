import React, { useEffect, useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View, AccessibilityProps } from 'react-native';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { useIsFocused } from '@react-navigation/native';

interface NotificationIconProps extends AccessibilityProps {
  size?: number;
  color?: string;
  activeColor?: string;
  backgroundColor?: string;
  badgeColor?: string;
  hideBackground?: boolean;
  onPress?: () => void;
  showBadgeWithZeroCount?: boolean;
  disableAnimation?: boolean;
}

export function NotificationIcon({ 
  size = 24, 
  color = '#333',
  activeColor = '#007AFF',
  backgroundColor = '#f5f5f5',
  badgeColor = '#FF3B30',
  hideBackground = false,
  onPress,
  showBadgeWithZeroCount = false,
  disableAnimation = false,
  ...accessibilityProps
}: NotificationIconProps) {
  const { unreadCount, refresh } = useNotifications();
  const [prevCount, setPrevCount] = useState(unreadCount);
  const isFocused = useIsFocused();
  
  // Animation for the badge when count changes
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const badgeOpacity = useRef(new Animated.Value(unreadCount > 0 ? 1 : 0)).current;
  
  // Refresh notifications when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      refresh();
    }
  }, [isFocused, refresh]);
  
  useEffect(() => {
    // Only animate if the count has changed and is not the initial render
    if (prevCount !== unreadCount && !disableAnimation) {
      // Animate badge opacity
      Animated.timing(badgeOpacity, {
        toValue: unreadCount > 0 ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Animate the badge scale
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
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
  }, [unreadCount, scaleAnim, pulseAnim, badgeOpacity, prevCount, disableAnimation]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/notifications');
    }
  };

  // Determine whether to show badge
  const shouldShowBadge = showBadgeWithZeroCount || unreadCount > 0;
  
  // Choose color based on notification count
  const bellColor = unreadCount > 0 ? activeColor : color;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.iconContainer, 
          hideBackground ? {} : { backgroundColor }
        ]}
        onPress={handlePress}
        accessibilityLabel={`Notifications${unreadCount > 0 ? ` with ${unreadCount} unread` : ''}`}
        accessibilityRole="button"
        accessibilityState={{ 
          busy: false,
          checked: false,
          disabled: false,
          expanded: false,
          selected: false
        }}
        accessibilityHint="Opens notifications screen"
        {...accessibilityProps}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Bell size={size} color={bellColor} />
        </Animated.View>
      </TouchableOpacity>
      
      {shouldShowBadge && (
        <Animated.View 
          style={[
            styles.badge,
            { 
              backgroundColor: badgeColor,
              opacity: badgeOpacity,
              transform: [{ scale: scaleAnim }] 
            }
          ]}
          accessibilityLabel={`${unreadCount} unread notifications`}
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
    position: 'relative',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
}); 