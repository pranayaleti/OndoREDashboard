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

/** `/api/dashboard/tenants` returns user rows; map to the richer `Tenant` shape the owner UI expects. */
function mapDashboardTenantRowToTenant(row: Record<string, unknown>): Tenant {
  const firstName = typeof row.firstName === "string" ? row.firstName : "";
  const lastName = typeof row.lastName === "string" ? row.lastName : "";
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  const displayName = name || (typeof row.email === "string" ? row.email : "Tenant");
  const createdAt =
    typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString().slice(0, 10);

  return {
    id: String(row.id ?? ""),
    name: displayName,
    property: "—",
    unit: "—",
    rent: 0,
    leaseStart: createdAt,
    leaseEnd: createdAt,
    paymentStatus: "pending",
    email: typeof row.email === "string" ? row.email : "",
    phone: typeof row.phone === "string" ? row.phone : undefined,
    propertyType: "—",
    propertyAddress: "—",
    propertyStatus: "—",
    tenantCreatedAt: createdAt,
    propertyCreatedAt: createdAt,
  };
}
import {
  GetPropertyResponseSchema,
  GetPropertiesResponseSchema,
  PropertySchema,
} from "../schemas";

function normalizePropertyResponse(raw: unknown): GetPropertyResponse {
  const wrapped = GetPropertyResponseSchema.safeParse(raw);
  if (wrapped.success) {
    return wrapped.data as GetPropertyResponse;
  }

  const direct = PropertySchema.safeParse(raw);
  if (direct.success) {
    return { property: direct.data } as GetPropertyResponse;
  }

  throw wrapped.error;
}

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
    const parsed = GetPropertiesResponseSchema.parse(raw);
    // Remap backend envelope { data, pagination } → consumer shape { properties, total, page, pageSize }
    return {
      properties: parsed.data,
      total: parsed.pagination.total,
      page: parsed.pagination.page,
      pageSize: parsed.pagination.limit,
    } as GetPropertiesResponse;
  },

  async getProperty(id: string): Promise<GetPropertyResponse> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>(`/properties/${id}`, headers);
    return normalizePropertyResponse(raw);
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
    const raw = await apiGet<unknown>("/properties/tenant-property", headers);
    return normalizePropertyResponse(raw);
  },

  async getOwnerTenants(): Promise<OwnerTenantsResponse> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>("/dashboard/tenants", headers);
    const rows = Array.isArray(raw) ? raw : [];
    const tenants = rows.map((r) =>
      mapDashboardTenantRowToTenant(r as Record<string, unknown>),
    );
    const n = tenants.length;
    return {
      summary: {
        totalTenants: n,
        occupiedUnits: n > 0 ? `${n}` : "0/0",
        occupancyRate: n > 0 ? "—" : "0%",
        avgRent: n > 0 ? "—" : "$0",
      },
      tenants,
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
