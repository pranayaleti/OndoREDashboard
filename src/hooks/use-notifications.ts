import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsApi, type AppNotification } from "@/lib/api";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 60_000; // poll every 60 s (checks run every 15 min)

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => void;
}

export function useNotifications(enabled: boolean): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Track IDs seen this session to fire toasts only for truly new arrivals
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!enabled) return;
    try {
      const { notifications: data } = await notificationsApi.list();
      setNotifications(data);

      const newUnread = data.filter((n) => !n.is_read);
      setUnreadCount(newUnread.length);

      if (initialized.current) {
        // Show toast for each newly appeared unread notification
        for (const n of newUnread) {
          if (!seenIds.current.has(n.id)) {
            toast.error(n.title, {
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
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, fetchAll]);

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    seenIds.current.delete(id);
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    seenIds.current.clear();
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchAll };
}
