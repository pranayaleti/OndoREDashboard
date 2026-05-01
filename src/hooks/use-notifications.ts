import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsApi, type Notification } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getDemoNotifications } from "@/lib/seed-data";

const POLL_INTERVAL_MS = 60_000; // poll every 60 s (checks run every 15 min)

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => void;
}

export function useNotifications(enabled: boolean): UseNotificationsReturn {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Track IDs seen this session to fire toasts only for truly new arrivals
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const usingDemoFallback = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!enabled) return;
    try {
      const { notifications: data } = await notificationsApi.getNotifications();
      const fallbackNotifications = getDemoNotifications(user)
      const nextNotifications = data.length === 0 && fallbackNotifications.length > 0
        ? fallbackNotifications
        : data
      usingDemoFallback.current = data.length === 0 && fallbackNotifications.length > 0
      setNotifications(nextNotifications);

      const newUnread = nextNotifications.filter((n: Notification) => !n.read);
      setUnreadCount(newUnread.length);

      if (initialized.current) {
        // Show toast for each newly appeared unread notification
        for (const n of newUnread) {
          if (!seenIds.current.has(n.id)) {
            toast({
              title: n.title,
              variant: "destructive",
              description: n.message,
              duration: 8000,
              id: n.id, // prevents duplicate toasts for the same id
            });
          }
        }
      } else {
        initialized.current = true;
      }

      // Update seen set with current unread IDs
      for (const n of newUnread) {
        seenIds.current.add(n.id);
      }
    } catch {
      // Silently swallow auth errors (non-manager roles won't have access)
    }
  }, [enabled, user]);

  useEffect(() => {
    if (!enabled) return;
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, fetchAll]);

  const markRead = useCallback(async (id: string) => {
    if (!usingDemoFallback.current) {
      await notificationsApi.markAsRead(id);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    seenIds.current.delete(id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!usingDemoFallback.current) {
      await notificationsApi.markAllAsRead();
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    seenIds.current.clear();
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchAll };
}
