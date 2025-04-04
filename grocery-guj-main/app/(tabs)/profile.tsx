import React, { useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Settings, MapPin, CreditCard, ShieldCheck, CircleHelp as HelpCircle, LogOut, ChevronRight, Heart } from 'lucide-react-native';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useWishlist } from '@/hooks/useWishlist';
import { useNotifications } from '@/hooks/useNotifications';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { NotificationIcon } from '@/components/NotificationIcon';
import { router } from 'expo-router';

// Define menu items without notifications (we'll handle it specially)
const menuItems = [
  { icon: MapPin, label: 'Delivery Address', color: '#FF9800', route: '/address' },
  { icon: CreditCard, label: 'Payment Methods', color: '#2196F3', route: '/payment-methods' },
  { icon: ShieldCheck, label: 'Privacy & Security', color: '#4CAF50', route: '/privacy-security' },
  { icon: HelpCircle, label: 'Help & Support', color: '#607D8B', route: '/help' },
] as const;

export default function ProfileScreen() {
  const { profile, loading: profileLoading, error: profileError, refreshProfile } = useProfile();
  const { user, signOut } = useAuth();
  const { orderStats, loading: ordersLoading, fetchOrders } = useOrders();
  const { wishlistItems, refreshWishlist, loading: wishlistLoading } = useWishlist();
  const { unreadCount, refresh: refreshNotifications } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), fetchOrders(), refreshWishlist(), refreshNotifications()]);
    setRefreshing(false);
  }, [refreshProfile, fetchOrders, refreshWishlist, refreshNotifications]);

  if (profileLoading || ordersLoading || wishlistLoading) {
    return <LoadingSpinner />;
  }

  if (profileError) {
    return (
      <View style={styles.container}>
        <ErrorMessage message="Failed to load profile" />
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={refreshProfile}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2ECC71']}
          tintColor="#2ECC71"
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image
            source={{ 
              uri: profile?.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : 
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80' 
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.full_name || user?.email?.split('@')[0] || 'Guest User'}</Text>
            <Text style={styles.userEmail}>{profile?.email || user?.email || ''}</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orderStats.completedOrders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orderStats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>₹{orderStats.totalSavings.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      <View style={styles.wishlistContainer}>
        <View style={styles.wishlistHeader}>
          <Heart size={20} color="#FF4B4B" />
          <Text style={styles.wishlistTitle}>Wishlist</Text>
        </View>
        <Text style={styles.wishlistCount}>{wishlistItems.length} items</Text>
        <TouchableOpacity 
          style={styles.viewWishlistButton}
          onPress={() => router.push('/(tabs)/wishlist')}
        >
          <Text style={styles.viewWishlistText}>View Wishlist</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        {/* Special Notifications menu item with badge */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/notifications')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#9C27B015' }]}>
            <NotificationIcon 
              size={24} 
              color="#9C27B0" 
              hideBackground={true} 
              onPress={() => router.push('/notifications')}
            />
          </View>
          <Text style={styles.menuLabel}>Notifications</Text>
          <ChevronRight size={20} color="#666" />
        </TouchableOpacity>
        
        {/* Regular menu items */}
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuItem}
            onPress={() => router.push(item.route)}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
              <item.icon size={24} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <LogOut size={24} color="#FF4B4B" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  retryButton: {
    backgroundColor: '#2ECC71',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#FFF1F1',
    borderRadius: 12,
    gap: 12,
  },
  logoutText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FF4B4B',
  },
  wishlistContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wishlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  wishlistTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  wishlistCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  viewWishlistButton: {
    backgroundColor: '#FFF1F1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewWishlistText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FF4B4B',
  },
});