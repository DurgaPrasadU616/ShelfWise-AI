import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import notificationService from '../services/notification.service';

const NotificationContext = createContext(null);

const POLL_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getAll({ limit: 1, unread: true });
      const count = res.data?.unreadCount || 0;
      setUnreadCount(count);
      return count;
    } catch {
      return 0;
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await notificationService.getAll({ limit: 5 });
      setRecentNotifications(res.data?.items || []);
    } catch {
      // silent
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchUnreadCount(), fetchRecent()]);
  }, [fetchUnreadCount, fetchRecent]);

  const markRead = useCallback(async (id) => {
    await notificationService.markRead(id);
    setUnreadCount(prev => Math.max(0, prev - 1));
    setRecentNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setUnreadCount(0);
    setRecentNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback(async (id) => {
    await notificationService.delete(id);
    setRecentNotifications(prev => prev.filter(n => n._id !== id));
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Initial fetch + polling
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    };
    init();

    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchUnreadCount, refresh]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        recentNotifications,
        loading,
        refresh,
        fetchRecent,
        markRead,
        markAllRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
