import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system';
  read: boolean;
  created_at: string;
};

// Default number of days to keep notifications
const DEFAULT_RETENTION_DAYS = 30;

export function useNotifications(retentionDays = DEFAULT_RETENTION_DAYS) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const deleteOldNotifications = async (days: number = retentionDays) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

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
        // Error is handled silently
      }
    } catch (err) {
      // Error is handled silently
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, delete old notifications
      await deleteOldNotifications();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const updateData = { read: true };
      
      const { error: updateError } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('id', notificationId);

      if (updateError) {
        throw updateError;
      }

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      const updateData = { read: true };
      
      const { error: updateError } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('read', false);

      if (updateError) {
        throw updateError;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  };

  // Delete a specific notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

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
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Notification change received:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteOldNotifications,
    refresh: fetchNotifications
  };
} 