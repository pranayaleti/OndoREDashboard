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
import { apiGet, apiPost, apiPut, apiDelete, getAuthHeaders } from "../http";

export const propertyApi = {
  async getProperties(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<GetPropertiesResponse> {
    const headers = getAuthHeaders();
    return apiGet<GetPropertiesResponse>(
      `/properties?page=${page}&pageSize=${pageSize}`,
      headers,
    );
  },

  async getProperty(id: string): Promise<GetPropertyResponse> {
    const headers = getAuthHeaders();
    return apiGet<GetPropertyResponse>(`/properties/${id}`, headers);
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

  async deletePhoto(propertyId: string, photoId: string): Promise<DeletePropertyPhotoResponse> {
    const headers = getAuthHeaders();
    return apiDelete<DeletePropertyPhotoResponse>(
      `/properties/${propertyId}/photos/${photoId}`,
      headers,
    );
  },
};
