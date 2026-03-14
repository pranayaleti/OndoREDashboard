/**
 * Documents API client
 * Aligned with backend: GET /documents (list), GET /documents/:id/download (signed URL).
 */

import { apiGet, apiDelete, getAuthHeaders } from "../http";

/** Backend document shape (camelCase from getDocumentsByUser / getDocumentById). Avoids conflict with feature-api DocumentRecord. */
export interface DocumentListRecord {
  id: string;
  ownerId?: string;
  propertyId?: string;
  name: string;
  storagePath?: string;
  bucket?: string;
  mimeType?: string;
  sizeBytes?: number;
  docType?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

/** Response from GET /documents — list. */
export interface ListDocumentsResponse {
  message?: string;
  data: DocumentListRecord[];
}

/** Response from GET /documents/:id/download. */
export interface DownloadDocumentResponse {
  message?: string;
  data: {
    url: string;
    expiresIn: number | null;
    document: DocumentListRecord;
  };
}

export const documentsApi = {
  /**
   * List documents for the authenticated user.
   * Backend returns { message, data: documents }.
   */
  async list(): Promise<{ data: DocumentListRecord[] }> {
    const headers = getAuthHeaders();
    const response = await apiGet<ListDocumentsResponse>("/documents", headers);
    return { data: response.data ?? [] };
  },

  /**
   * Get a signed (or public) download URL for a document.
   * Caller can open the URL in a new tab or set location.href.
   */
  async getDownloadUrl(id: string): Promise<string> {
    const headers = getAuthHeaders();
    const response = await apiGet<DownloadDocumentResponse>(`/documents/${id}/download`, headers);
    return response.data?.url ?? "";
  },

  /**
   * Soft-delete a document (backend sets is_deleted = true).
   */
  async delete(id: string): Promise<{ message: string }> {
    const headers = getAuthHeaders();
    return apiDelete<{ message: string }>(`/documents/${id}`, headers);
  },
};
