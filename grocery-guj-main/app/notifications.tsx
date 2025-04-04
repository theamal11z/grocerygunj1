import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Bell, ShoppingCart, Tag, Info, Check, Trash2, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeInRight, 
  SlideInRight, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  Layout 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function NotificationsScreen() {
  const { 
    notifications, 
    loading, 
    error, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteOldNotifications, 
    refresh,
    hasMore,
    loadMore
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const insets = useSafeAreaInsets();
  const swipeableRefs = new Map();
  
  // Optimistic UI update handling
  const [pendingOperations, setPendingOperations] = useState<{
    read: Set<string>;
    delete: Set<string>;
  }>({
    read: new Set(),
    delete: new Set()
  });

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // Handle mark notification as read with optimistic update
  const handleMarkAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setPendingOperations(prev => ({
      ...prev,
      read: new Set(prev.read).add(id)
    }));
    
    try {
      await markAsRead(id);
    } catch (err) {
      // If error, revert optimistic update
      setPendingOperations(prev => {
        const newSet = new Set(prev.read);
        newSet.delete(id);
        return {
          ...prev,
          read: newSet
        };
      });
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  }, [markAsRead]);

  // Handle delete notification with optimistic update
  const handleDeleteNotification = useCallback(async (id: string) => {
    // Close swipeable if open
    const swipeable = swipeableRefs.get(id);
    if (swipeable) {
      swipeable.close();
    }
    
    // Optimistic update
    setPendingOperations(prev => ({
      ...prev,
      delete: new Set(prev.delete).add(id)
    }));
    
    try {
      const { success, error } = await deleteNotification(id);
      if (!success && error) {
        // If error, revert optimistic update
        setPendingOperations(prev => {
          const newSet = new Set(prev.delete);
          newSet.delete(id);
          return {
            ...prev,
            delete: newSet
          };
        });
        Alert.alert('Error', `Failed to delete notification: ${error}`);
      }
    } catch (err) {
      // If error, revert optimistic update
      setPendingOperations(prev => {
        const newSet = new Set(prev.delete);
        newSet.delete(id);
        return {
          ...prev,
          delete: newSet
        };
      });
      Alert.alert('Error', 'Failed to delete notification');
    }
  }, [deleteNotification]);

  // Handle cleanup old notifications
  const handleCleanupOldNotifications = useCallback(() => {
    Alert.alert(
      'Delete Old Notifications',
      'Are you sure you want to delete notifications older than 7 days?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteOldNotifications(7); // Delete notifications older than 7 days
              await refresh();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete old notifications');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [deleteOldNotifications, refresh]);

  // Get notification icon based on type
  const getNotificationIcon = useCallback((type: Notification['type'], read: boolean) => {
    const color = read ? '#999' : '#007AFF';
    
    switch (type) {
      case 'order':
        return <ShoppingCart size={22} color={color} />;
      case 'promotion':
        return <Tag size={22} color={color} />;
      case 'system':
        return <Info size={22} color={color} />;
      default:
        return <Bell size={22} color={color} />;
    }
  }, []);

  // Format timestamp relative to now (e.g. "2 hours ago")
  const formatTimestamp = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        // Show full date for older notifications
        return format(date, 'MMM d, yyyy');
      } else {
        // Show relative time for recent notifications
        return formatDistanceToNow(date, { addSuffix: true });
      }
    } catch (e) {
      return 'Unknown time';
    }
  }, []);

  // Render right actions for swipeable
  const renderRightActions = useCallback((id: string, read: boolean) => {
    return (
      <View style={styles.rightActions}>
        {!read && (
          <TouchableOpacity 
            style={[styles.swipeAction, styles.readAction]}
            onPress={() => handleMarkAsRead(id)}
          >
            <Check size={20} color="#fff" />
            <Text style={styles.swipeActionText}>Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => handleDeleteNotification(id)}
        >
          <Trash2 size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  }, [handleMarkAsRead, handleDeleteNotification]);

  // Filter notifications based on pending operations
  const filteredNotifications = notifications.filter(
    item => !pendingOperations.delete.has(item.id)
  );

  // Render notification item
  const renderNotification = useCallback(({ item, index }: { item: Notification; index: number }) => {
    // Consider both database read status and optimistic updates
    const isRead = item.read || pendingOperations.read.has(item.id);
    
    return (
      <Animated.View 
        entering={SlideInRight.delay(index * 50).springify()}
      >
        <Swipeable
          ref={ref => {
            if (ref) swipeableRefs.set(item.id, ref);
            else swipeableRefs.delete(item.id);
          }}
          renderRightActions={() => renderRightActions(item.id, isRead)}
          friction={2}
          overshootRight={false}
        >
          <TouchableOpacity
            onPress={() => {
              if (!isRead) {
                handleMarkAsRead(item.id);
              }
            }}
            activeOpacity={0.8}
          >
    <View
      style={[
        styles.notificationItem,
                isRead ? styles.readNotification : styles.unreadNotification
      ]}
    >
      <View style={styles.notificationContent}>
                <View style={[
                  styles.iconContainer,
                  isRead ? styles.readIconContainer : styles.unreadIconContainer
                ]}>
                  {getNotificationIcon(item.type, isRead)}
        </View>
        <View style={styles.textContainer}>
                  <Text 
                    style={[
                      styles.title,
                      isRead ? styles.readTitle : styles.unreadTitle
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text 
                    style={styles.message}
                    numberOfLines={2}
                  >
                    {item.message}
                  </Text>
          <Text style={styles.timestamp}>
                    {formatTimestamp(item.created_at)}
          </Text>
        </View>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  }, [getNotificationIcon, handleMarkAsRead, pendingOperations, renderRightActions, formatTimestamp]);

  // Handle loading more notifications when user scrolls to the bottom
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && !refreshing) {
      loadMore();
    }
  }, [hasMore, loading, refreshing, loadMore]);

  // Render footer with loading indicator when loading more items
  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>Loading more...</Text>
    </View>
  );
  }, [hasMore]);

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Animated.View entering={FadeIn.duration(500)}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </Animated.View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Animated.View entering={FadeIn.duration(500)}>
          <AlertTriangle size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Deleting state overlay
  const renderOverlay = () => {
    if (!deleting) return null;
    
    return (
      <Animated.View 
        entering={FadeIn.duration(200)}
        style={[
          StyleSheet.absoluteFill, 
          styles.overlay
        ]}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="light" />
        <View style={styles.overlayContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.overlayText}>Deleting old notifications...</Text>
        </View>
      </Animated.View>
    );
  };

  // Main UI
  return (
    <View style={[
      styles.container, 
      { paddingTop: insets.top }
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <Animated.View 
        entering={FadeIn.duration(400)}
        style={[styles.header, { zIndex: 1 }]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notifications</Text>
        
        <View style={styles.headerButtons}>
          {unreadCount > 0 && (
            <AnimatedTouchable
              entering={FadeInRight.duration(400)}
              style={styles.markAllReadButton}
              onPress={markAllAsRead}
            >
              <CheckCircle size={16} color="#007AFF" />
              <Text style={styles.markAllReadText}>Mark all read</Text>
            </AnimatedTouchable>
          )}
          
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.cleanupButton}
              onPress={handleCleanupOldNotifications}
            >
              <Trash2 size={18} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      {/* Counter section */}
      {notifications.length > 0 && (
        <Animated.View 
          entering={FadeInRight.delay(200).duration(400)}
          style={styles.countSection}
        >
          <Text style={styles.countText}>
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up! No unread notifications'}
          </Text>
        </Animated.View>
      )}
      
      {/* Notification list */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <Animated.View 
            entering={FadeIn.delay(300).duration(500)}
            style={styles.emptyContainer}
          >
            <Bell size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              You don't have any notifications yet.
              We'll notify you when something important happens.
            </Text>
          </Animated.View>
        }
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
      
      {renderOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  markAllReadText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 4,
    fontFamily: 'Poppins-Medium',
  },
  cleanupButton: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  notificationItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  readNotification: {
    backgroundColor: '#fff',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadIconContainer: {
    backgroundColor: '#E3F2FD',
  },
  readIconContainer: {
    backgroundColor: '#F5F5F5',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  unreadTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  readTitle: {
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 192,
    height: '100%',
  },
  swipeAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderRadius: 12,
    marginLeft: 8,
  },
  readAction: {
    backgroundColor: '#007AFF',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
  },
  swipeActionText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    marginTop: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Poppins-Regular',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: '20%',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  overlayText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#333',
  },
  footerLoader: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
});