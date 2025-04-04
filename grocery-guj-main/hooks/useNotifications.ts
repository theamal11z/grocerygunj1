import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system';
  read: boolean;
  created_at: string;
  link?: string; // Optional link to navigate to when notification is tapped
  meta?: Record<string, any>; // Optional metadata for the notification
};

// Default number of days to keep notifications
const DEFAULT_RETENTION_DAYS = 30;
// Default page size for pagination
const DEFAULT_PAGE_SIZE = 15;

export function useNotifications(retentionDays = DEFAULT_RETENTION_DAYS, pageSize = DEFAULT_PAGE_SIZE) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Refs to track pagination
  const pageRef = useRef(0);
  const isFetchingRef = useRef(false);
  
  // Clear notifications when user changes
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user]);

  // Delete notifications older than the specified number of days
  const deleteOldNotifications = useCallback(async (days: number = retentionDays) => {
    if (!user) return { success: false, error: 'No authenticated user' };

    try {
      // Calculate the cutoff date (current date minus specified days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // Format date in ISO format for Supabase
      const cutoffDateISO = cutoffDate.toISOString();

      // Delete notifications older than the cutoff date
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffDateISO);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete old notifications' 
      };
    }
  }, [user, retentionDays]);

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(async (reset = false) => {
    if (isFetchingRef.current) return;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      isFetchingRef.current = true;
      
      if (reset) {
        setLoading(true);
        pageRef.current = 0;
        setHasMore(true);
      }

      // Auto-cleanup old notifications silently
      deleteOldNotifications().catch(() => {
        // Silently handle cleanup errors
      });

      // Calculate pagination variables
      const from = reset ? 0 : pageRef.current * pageSize;
      const to = from + pageSize - 1;

      // Fetch notifications with pagination
      const { data, error: fetchError, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) {
        throw fetchError;
      }

      // Determine if there are more notifications to load
      if (count !== null) {
        setHasMore(from + pageSize < count);
      } else {
        // If count is not available, assume no more if fewer results returned than requested
        setHasMore(data?.length === pageSize);
      }

      // Update state
      if (reset) {
        setNotifications(data || []);
      } else {
        setNotifications(prev => [...prev, ...(data || [])]);
      }
      
      // Increment page for next fetch
      pageRef.current += 1;

      // Count unread notifications in a separate query for accuracy
      const { count: unreadCountResult, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (!countError && unreadCountResult !== null) {
        setUnreadCount(unreadCountResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, pageSize, deleteOldNotifications]);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || isFetchingRef.current || !user) return;
    await fetchNotifications(false);
  }, [hasMore, loading, user, fetchNotifications]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return { success: false, error: 'No authenticated user' };

    try {
      // Check if notification is already marked as read (optimistic update may have already happened)
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.read) {
        return { success: true };
      }

      const updateData = { read: true };
      
      const { error: updateError } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to mark notification as read' 
      };
    }
  }, [user, notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return { success: false, error: 'No authenticated user' };
    if (unreadCount === 0) return { success: true };

    try {
      const updateData = { read: true };
      
      const { error: updateError } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('read', false);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to mark all notifications as read' 
      };
    }
  }, [user, unreadCount]);

  // Delete a specific notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return { success: false, error: 'No authenticated user' };

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete notification' 
      };
    }
  }, [user, notifications]);

  // Reset (refresh) the notifications
  const refresh = useCallback(async () => {
    return fetchNotifications(true);
  }, [fetchNotifications]);

  // Initial data loading
  useEffect(() => {
    if (user) {
      fetchNotifications(true);
    }
  }, [user, fetchNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // When changes are detected, refresh the notifications
          fetchNotifications(true);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteOldNotifications,
    loadMore,
    refresh
  };
} 