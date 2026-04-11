/**
 * Documents API client
 * Aligned with backend: GET /documents (list), GET /documents/:id/download (signed URL).
 */

import { apiGet, apiPost, apiDelete, getAuthHeaders } from "../http";

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

export interface CreateDocumentUploadUrlRequest {
  type: "lease" | "property" | "maintenance" | "financial";
  name: string;
  fileName: string;
  contentType: string;
  propertyId?: string;
}

export interface CreateDocumentUploadUrlResponse {
  documentId: string;
  bucket: string;
  storagePath: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface ConfirmDocumentUploadRequest {
  documentId: string;
  type: "lease" | "property" | "maintenance" | "financial";
  name: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  propertyId?: string;
}

export const documentsApi = {
  listCategories(): Promise<Array<{ id: string; label: string }>> {
    return Promise.resolve([]);
  },

  /**
   * List documents for the authenticated user.
   * Backend returns { message, data: documents }.
   */
  async list(): Promise<{ data: DocumentListRecord[] }> {
    const headers = getAuthHeaders();
    const response = await apiGet<ListDocumentsResponse>("/documents", headers);
    return { data: response.data ?? [] };
  },

  async listDocuments(): Promise<DocumentListRecord[]> {
    const response = await this.list();
    return response.data;
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

  deleteDocument(id: string): Promise<{ message: string }> {
    return this.delete(id);
  },

  async createUploadUrl(request: CreateDocumentUploadUrlRequest): Promise<CreateDocumentUploadUrlResponse> {
    const headers = getAuthHeaders();
    return apiPost<CreateDocumentUploadUrlResponse>("/documents/upload-url", request, headers);
  },

  async confirmUpload(request: ConfirmDocumentUploadRequest): Promise<DocumentListRecord> {
    const headers = getAuthHeaders();
    const response = await apiPost<{ message?: string; data: DocumentListRecord }>(
      "/documents/confirm-upload",
      request,
      headers,
    );
    return response.data;
  },

  async uploadToSignedUrl(uploadUrl: string, file: File, contentType?: string): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": (contentType ?? file.type) || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload document");
    }
  },

  async uploadDocument(): Promise<DocumentListRecord> {
    throw new Error("Use createUploadUrl() and confirmUpload() for document uploads.");
  },
};
