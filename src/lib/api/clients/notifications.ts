/**
 * Notifications API client
 */

import { apiGet, apiPut, apiDelete, getAuthHeaders } from "../http";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

/**
 * GET/PUT /notifications/preferences response: one flat row of `notification_preferences`
 * columns in camelCase, plus legacy aliases the Edge handler still echoes.
 * Quiet hours are Postgres `time` values ("HH:MM:SS") or null when unset.
 */
export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  maintenanceUpdates: boolean;
  paymentReminders: boolean;
  leaseAlerts: boolean;
  newListings: boolean;
  documentUploads: boolean;
  vendorUpdates: boolean;
  financialReports: boolean;
  communityUpdates: boolean;
  dailyAiSummary: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  /** Legacy aliases (emailEnabled, pushEnabled, maintenanceUpdates, leaseAlerts, documentUploads). */
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  maintenanceAlerts?: boolean;
  tenantNotifications?: boolean;
  reportNotifications?: boolean;
}

/** PUT body: any subset of the column fields. The server rejects a body with none (400). */
export type NotificationPreferencesUpdate = Partial<
  Omit<
    NotificationPreferences,
    | "userId"
    | "emailNotifications"
    | "pushNotifications"
    | "maintenanceAlerts"
    | "tenantNotifications"
    | "reportNotifications"
  >
>;

/** Backend returns { message, data }; list items may have isRead (camelCase). */
interface GetNotificationsApiResponse {
  message?: string;
  data?: Array<Omit<Notification, "read"> & { isRead?: boolean; read?: boolean }>;
}

export const notificationsApi = {
  async getNotifications(
    unreadOnly: boolean = false,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ notifications: Notification[]; total: number; page: number }> {
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (unreadOnly) query.append("unread", "true");
    query.append("limit", String(pageSize));

    const res = await apiGet<GetNotificationsApiResponse>(`/notifications?${query.toString()}`, headers);
    const raw = res.data ?? [];
    const notifications: Notification[] = raw.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: Boolean(n.isRead ?? (n as Notification).read),
      actionUrl: n.actionUrl,
      createdAt: n.createdAt,
    }));
    return { notifications, total: notifications.length, page };
  },

  async getNotification(id: string): Promise<Notification> {
    const headers = getAuthHeaders();
    return apiGet<Notification>(`/notifications/${id}`, headers);
  },

  async markAsRead(id: string): Promise<Notification> {
    const headers = getAuthHeaders();
    return apiPut<Notification>(`/notifications/${id}/read`, {}, headers);
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const headers = getAuthHeaders();
    return apiPut(`/notifications/read-all`, {}, headers);
  },

  async deleteNotification(id: string): Promise<{ message: string }> {
    const headers = getAuthHeaders();
    return apiDelete<{ message: string }>(`/notifications/${id}`, headers);
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const headers = getAuthHeaders();
    return apiGet<NotificationPreferences>("/notifications/preferences", headers);
  },

  async updatePreferences(
    preferences: NotificationPreferencesUpdate,
  ): Promise<NotificationPreferences> {
    const headers = getAuthHeaders();
    return apiPut<NotificationPreferences>(
      "/notifications/preferences",
      preferences,
      headers,
    );
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const headers = getAuthHeaders();
    return apiGet<{ count: number }>("/notifications/unread-count", headers);
  },
};
