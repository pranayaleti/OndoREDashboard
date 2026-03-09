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

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  maintenanceAlerts: boolean;
  paymentReminders: boolean;
  tenantNotifications: boolean;
  reportNotifications: boolean;
}

export const notificationsApi = {
  async getNotifications(
    unreadOnly: boolean = false,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ notifications: Notification[]; total: number; page: number }> {
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (unreadOnly) query.append("unreadOnly", "true");
    query.append("page", String(page));
    query.append("pageSize", String(pageSize));

    return apiGet(`/notifications?${query.toString()}`, headers);
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
    preferences: Partial<NotificationPreferences>,
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
