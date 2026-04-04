import { apiGet, apiPost, apiPut, apiDelete } from "../http";

export interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  endDate: string | null;
  propertyId: string | null;
  relatedId: string | null;
  relatedType: string | null;
  metadata: Record<string, unknown>;
}

export const calendarApi = {
  async getEvents(startDate: string, endDate: string, filters?: { propertyId?: string; eventType?: string }): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({ startDate, endDate, ...(filters || {}) } as Record<string, string>).toString();
    const res = await apiGet<{ data: CalendarEvent[] }>(`/calendar?${params}`);
    return res.data;
  },
  async getUpcoming(days?: number): Promise<CalendarEvent[]> {
    const res = await apiGet<{ data: CalendarEvent[] }>(`/calendar/upcoming${days ? `?days=${days}` : ''}`);
    return res.data;
  },
  async createEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const res = await apiPost<{ data: CalendarEvent }>('/calendar', event);
    return res.data;
  },
  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const res = await apiPut<{ data: CalendarEvent }>(`/calendar/${id}`, updates);
    return res.data;
  },
  async deleteEvent(id: string): Promise<void> {
    await apiDelete(`/calendar/${id}`);
  },
};
