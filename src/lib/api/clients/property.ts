/**
 * Property API client
 */

import {
  CreatePropertyRequest,
  CreatePropertyResponse,
  UpdatePropertyRequest,
  UpdatePropertyResponse,
  GetPropertiesResponse,
  GetPropertyResponse,
  DeletePropertyResponse,
  UploadPropertyPhotoRequest,
  UploadPropertyPhotoResponse,
  DeletePropertyPhotoResponse,
} from "@ondo/types";
import { apiGet, apiPost, apiPut, apiDelete, apiRequest, getAuthHeaders } from "../http";
import type { OwnerTenantsResponse, Tenant } from "./legacy-types";
import {
  GetPropertyResponseSchema,
  GetPropertiesResponseSchema,
} from "../schemas";

export const propertyApi = {
  async getProperties(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<GetPropertiesResponse> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>(
      `/properties?page=${page}&pageSize=${pageSize}`,
      headers,
    );
    return GetPropertiesResponseSchema.parse(raw) as GetPropertiesResponse;
  },

  async getProperty(id: string): Promise<GetPropertyResponse> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>(`/properties/${id}`, headers);
    return GetPropertyResponseSchema.parse(raw) as GetPropertyResponse;
  },

  async createProperty(request: CreatePropertyRequest): Promise<CreatePropertyResponse> {
    const headers = getAuthHeaders();
    return apiPost<CreatePropertyResponse>("/properties", request, headers);
  },

  async updateProperty(
    id: string,
    request: UpdatePropertyRequest,
  ): Promise<UpdatePropertyResponse> {
    const headers = getAuthHeaders();
    return apiPut<UpdatePropertyResponse>(`/properties/${id}`, request, headers);
  },

  async deleteProperty(id: string): Promise<DeletePropertyResponse> {
    const headers = getAuthHeaders();
    return apiDelete<DeletePropertyResponse>(`/properties/${id}`, headers);
  },

  async uploadPhoto(
    propertyId: string,
    request: UploadPropertyPhotoRequest,
  ): Promise<UploadPropertyPhotoResponse> {
    const headers = getAuthHeaders();
    return apiPost<UploadPropertyPhotoResponse>(
      `/properties/${propertyId}/photos/upload-url`,
      request,
      headers,
    );
  },

  async deletePhoto(propertyIdOrPhotoId: string, photoId?: string): Promise<DeletePropertyPhotoResponse> {
    const headers = getAuthHeaders();
    const id = photoId ?? propertyIdOrPhotoId;
    return apiDelete<DeletePropertyPhotoResponse>(`/properties/photos/${id}`, headers);
  },

  async updatePropertyStatus(
    propertyId: string,
    status: string,
    reviewComment?: string,
  ): Promise<GetPropertyResponse> {
    const headers = getAuthHeaders();
    return apiRequest<GetPropertyResponse>(
      "PATCH",
      `/properties/${propertyId}/status`,
      { status, comment: reviewComment },
      headers,
    );
  },

  async getTenantProperty(): Promise<GetPropertyResponse> {
    const headers = getAuthHeaders();
    return apiGet<GetPropertyResponse>("/properties/tenant-property", headers);
  },

  async getOwnerTenants(): Promise<OwnerTenantsResponse> {
    const headers = getAuthHeaders();
    const data = await apiGet<Tenant[]>("/dashboard/tenants", headers);
    return {
      summary: {
        totalTenants: data.length,
        occupiedUnits: String(data.length),
        occupancyRate: "0",
        avgRent: "0",
      },
      tenants: data,
    };
  },

  async generatePresignedUploadUrl(
    propertyId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ presignedUrl: string; publicUrl: string; key: string }> {
    const headers = getAuthHeaders();
    return apiPost(
      "/properties/photos/presigned-url",
      { propertyId, fileName, contentType },
      headers,
    );
  },

  async uploadToS3(presignedUrl: string, file: File): Promise<void> {
    await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
  },

  async confirmPhotoUpload(
    propertyId: string,
    url: string,
    key: string,
    caption?: string,
    orderIndex: number = 0,
  ): Promise<UploadPropertyPhotoResponse> {
    const headers = getAuthHeaders();
    return apiPost<UploadPropertyPhotoResponse>(
      "/properties/photos/confirm",
      { propertyId, url, s3Key: key, caption, orderIndex: String(orderIndex) },
      headers,
    );
  },
};
