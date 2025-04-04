import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const { notifications, loading, error, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteOldNotifications, refresh } = useNotifications();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteNotification = async (id: string) => {
    try {
      const { success, error } = await deleteNotification(id);
      if (!success && error) {
        Alert.alert('Error', `Failed to delete notification: ${error}`);
      }
    } catch (err) {
      
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleCleanupOldNotifications = async () => {
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
              Alert.alert('Success', 'Old notifications have been deleted');
            } catch (error) {
              
              Alert.alert('Error', 'Failed to delete old notifications');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return 'cart-outline';
      case 'promotion':
        return 'pricetag-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationBackground = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return '#E3F2FD';
      case 'promotion':
        return '#F3E5F5';
      case 'system':
        return '#E8F5E9';
      default:
        return '#F5F5F5';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View
      style={[
        styles.notificationItem,
        { backgroundColor: getNotificationBackground(item.type) }
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color="#666"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          {!item.read && (
            <TouchableOpacity 
              style={styles.markReadButton}
              onPress={() => markAsRead(item.id)}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteNotification(item.id)}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading || deleting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>
          {deleting ? 'Deleting old notifications...' : 'Loading notifications...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerButtons}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={markAllAsRead}
            >
              <Ionicons name="checkmark-done-outline" size={20} color="#007AFF" />
              <Text style={styles.markAllReadText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.cleanupButton}
              onPress={handleCleanupOldNotifications}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllReadText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 4,
  },
  cleanupButton: {
    padding: 8,
    backgroundColor: '#FFF1F1',
    borderRadius: 16,
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    marginTop: 4,
  },
  markReadButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});