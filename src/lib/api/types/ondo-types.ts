/**
 * Local shim for @ondo/types when the packages/types workspace is not available.
 * Re-exports from legacy-types and defines API error and response types.
 */

import type {
  User as UserType,
  SignupRequest,
  SignupResponse,
  InvitedUser as InvitedUserType,
  Property as PropertyType,
  PortfolioStats as PortfolioStatsType,
  CreatePropertyRequest as CreatePropertyRequestType,
} from "../clients/legacy-types";

export type {
  User,
  LoginRequest,
  LoginResponse,
  InviteRequest,
  InviteResponse,
  InvitationDetails,
  SignupRequest,
  SignupResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  PortfolioStats,
  ManagerPortfolioStats,
  InvitedUser,
  OwnerOnboardingRequest,
  OwnerOnboardingResponse,
  Property,
  PropertyPhoto,
  PropertyOwner,
  PropertyManager,
  PropertyTenant,
  CreatePropertyRequest,
  MaintenanceRequest,
  Lead,
} from "../clients/legacy-types";

export type UserRole = "super_admin" | "admin" | "manager" | "owner" | "tenant" | "maintenance";

export type SignupWithInviteRequest = SignupRequest;
export type SignupWithInviteResponse = SignupResponse;

export interface GetInvitationResponse {
  email: string;
  role: UserRole;
  expiresAt: string;
}

export interface ProfilePictureUploadUrlRequest {
  contentType: string;
  fileName?: string;
}
export interface ProfilePictureUploadUrlResponse {
  uploadUrl: string;
  publicUrl?: string;
  key?: string;
}

export type GetPortfolioStatsResponse = PortfolioStatsType;
export interface GetInvitedUsersResponse {
  users: InvitedUserType[];
  total: number;
  page: number;
  pageSize: number;
}
export interface UpdateUserStatusRequest {
  isActive: boolean;
}
export interface UpdateUserStatusResponse {
  message: string;
  user: UserType;
}

export interface ApiErrorField {
  field?: string;
  message: string;
}
export interface ApiErrorResponse {
  message: string;
  code?: string;
  statusCode: number;
  errors?: ApiErrorField[];
  correlationId?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly errors?: ApiErrorField[],
    public readonly correlationId?: string
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type PropertyDetail = PropertyType;

export type UpdatePropertyRequest = Partial<CreatePropertyRequestType>;

export interface CreatePropertyResponse {
  id: string;
  message?: string;
}
export interface UpdatePropertyResponse {
  id: string;
  message?: string;
}
export interface GetPropertiesResponse {
  properties: PropertyType[];
  total: number;
  page: number;
  pageSize: number;
}
export interface GetPropertyResponse {
  property: PropertyType;
}
export interface DeletePropertyResponse {
  message: string;
}
export interface UploadPropertyPhotoRequest {
  fileName: string;
  contentType: string;
  caption?: string;
  orderIndex?: number;
}
export interface UploadPropertyPhotoResponse {
  id: string;
  url: string;
  caption?: string;
  orderIndex: number;
}
export interface DeletePropertyPhotoResponse {
  message: string;
}
