/**
 * Documents API client
 */

import { apiGet, apiPost, apiDelete, getAuthHeaders } from "../http";

export interface Document {
  id: string;
  propertyId?: string;
  tenantId?: string;
  ownerId?: string;
  uploadedBy: string;
  title: string;
  description?: string;
  documentType: string;
  fileUrl: string;
  s3Key?: string;
  fileSize?: number;
  mimeType?: string;
  folder?: string;
  isShared?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentPayload {
  propertyId?: string;
  tenantId?: string;
  ownerId?: string;
  title: string;
  description?: string;
  documentType: string;
  fileUrl: string;
  s3Key?: string;
  fileSize?: number;
  mimeType?: string;
  folder?: string;
  isShared?: boolean;
}

export const documentsApi = {
  async list(propertyId?: string): Promise<{ data: Document[] }> {
    const headers = getAuthHeaders();
    return apiGet<{ data: Document[] }>(
      `/documents${propertyId ? `?propertyId=${propertyId}` : ""}`,
      headers,
    );
  },

  async get(id: string): Promise<{ data: Document }> {
    const headers = getAuthHeaders();
    return apiGet<{ data: Document }>(`/documents/${id}`, headers);
  },

  async create(payload: CreateDocumentPayload): Promise<{ data: Document }> {
    const headers = getAuthHeaders();
    return apiPost<{ data: Document }>("/documents", payload, headers);
  },

  async delete(id: string): Promise<{ message: string }> {
    const headers = getAuthHeaders();
    return apiDelete<{ message: string }>(`/documents/${id}`, headers);
  },

  async getUploadUrl(
    fileName: string,
    mimeType: string,
    folder?: string,
  ): Promise<{ data: { uploadUrl: string; s3Key: string; publicUrl: string } }> {
    const headers = getAuthHeaders();
    return apiPost<{ data: { uploadUrl: string; s3Key: string; publicUrl: string } }>(
      "/documents/upload-url",
      { fileName, mimeType, folder },
      headers,
    );
  },
};
