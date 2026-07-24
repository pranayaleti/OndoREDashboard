/**
 * Events API client (admin CRUD + public read).
 * Talks to OndoREBackend /api/events. Responses are wrapped in { message, data }.
 */

import { apiGet, apiPost, apiPut, apiDelete, getAuthHeaders } from "../http";

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  rsvpUrl: string | null;
  coverImage: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  slug: string;
  title: string;
  startsAt: string;
  description?: string | null;
  endsAt?: string | null;
  location?: string | null;
  rsvpUrl?: string | null;
  coverImage?: string | null;
  isPublished?: boolean;
}

export type UpdateEventInput = Partial<CreateEventInput>;

interface Wrapped<T> {
  message: string;
  data: T;
}

export const eventsApi = {
  /** List events. Staff pass includeUnpublished=true to see drafts. */
  async listEvents(includeUnpublished = false): Promise<EventItem[]> {
    const qs = includeUnpublished ? "?includeUnpublished=1" : "";
    const res = await apiGet<Wrapped<EventItem[]>>(`/events${qs}`, getAuthHeaders());
    return res.data;
  },

  /** Get a single published event by slug. */
  async getEvent(slug: string): Promise<EventItem> {
    const res = await apiGet<Wrapped<EventItem>>(`/events/${slug}`, getAuthHeaders());
    return res.data;
  },

  /** Staff create. */
  async createEvent(input: CreateEventInput): Promise<EventItem> {
    const res = await apiPost<Wrapped<EventItem>>("/events", input, getAuthHeaders());
    return res.data;
  },

  /** Staff update by id or slug. */
  async updateEvent(idOrSlug: string, patch: UpdateEventInput): Promise<EventItem> {
    const res = await apiPut<Wrapped<EventItem>>(`/events/${idOrSlug}`, patch, getAuthHeaders());
    return res.data;
  },

  /** Staff hard-delete by id or slug. */
  async deleteEvent(idOrSlug: string): Promise<{ id: string }> {
    const res = await apiDelete<Wrapped<{ id: string }>>(`/events/${idOrSlug}`, getAuthHeaders());
    return res.data;
  },
};
