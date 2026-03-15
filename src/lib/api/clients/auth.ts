/**
 * Authentication API client
 */

import {
  User,
  LoginRequest,
  LoginResponse,
  SignupWithInviteRequest,
  SignupWithInviteResponse,
  GetInvitationResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ProfilePictureUploadUrlRequest,
  ProfilePictureUploadUrlResponse,
  GetPortfolioStatsResponse,
  GetInvitedUsersResponse,
  InviteRequest,
  InviteResponse,
  UpdateUserStatusRequest,
  UpdateUserStatusResponse,
} from "@ondo/types";
import type { OwnerOnboardingRequest, OwnerOnboardingResponse } from "./legacy-types";
import {
  apiPost,
  apiGet,
  apiPut,
  getAuthHeaders,
} from "../http";
import {
  LoginResponseSchema,
  UserSchema,
  GetPortfolioStatsResponseSchema,
  GetInvitedUsersResponseSchema,
  UpdateProfileResponseSchema,
} from "../schemas";
import { getAccessToken } from "./token-manager";

// ---------------------------------------------------------------------------
// Extended login response — includes refresh token rotation fields
// ---------------------------------------------------------------------------

export interface LoginResponseWithTokens extends LoginResponse {
  accessToken: string;
  expiresIn: number;
  tokenType?: string;
  csrfToken?: string;
}

export const authApi = {
  async login(request: LoginRequest): Promise<LoginResponseWithTokens> {
    const raw = await apiPost<unknown>("/auth/login", request);
    return LoginResponseSchema.parse(raw) as unknown as LoginResponseWithTokens;
  },

  async signup(request: SignupWithInviteRequest): Promise<SignupWithInviteResponse> {
    return apiPost<SignupWithInviteResponse>("/auth/signup", request);
  },

  async getMe(): Promise<User> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>("/auth/me", headers);
    return UserSchema.parse(raw) as User;
  },

  /** @deprecated Use getMe() */
  async me(): Promise<User> {
    return this.getMe();
  },

  async logout(): Promise<void> {
    // Best-effort — ignore errors so the UI logout always completes
    try {
      await apiPost<unknown>("/auth/logout");
    } catch {
      // Silently ignore — cookie will expire on its own
    }
  },

  async logoutAll(): Promise<void> {
    await apiPost<unknown>("/auth/logout-all");
  },

  async getInvitation(token: string): Promise<GetInvitationResponse> {
    return apiGet<GetInvitationResponse>(`/auth/invitation/${token}`);
  },

  async updateProfile(
    request: UpdateProfileRequest,
  ): Promise<UpdateProfileResponse> {
    const headers = getAuthHeaders();
    const raw = await apiPut<unknown>("/auth/profile", request, headers);
    return UpdateProfileResponseSchema.parse(raw) as UpdateProfileResponse;
  },

  async changePassword(
    request: ChangePasswordRequest,
  ): Promise<ChangePasswordResponse> {
    const headers = getAuthHeaders();
    return apiPost<ChangePasswordResponse>("/password/change-password", request, headers);
  },

  async getProfilePictureUploadUrl(
    request: ProfilePictureUploadUrlRequest,
  ): Promise<ProfilePictureUploadUrlResponse> {
    const headers = getAuthHeaders();
    return apiPost<ProfilePictureUploadUrlResponse>(
      "/auth/profile-picture/upload-url",
      request,
      headers,
    );
  },

  async getPortfolioStats(): Promise<GetPortfolioStatsResponse> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>("/auth/portfolio-stats", headers);
    return GetPortfolioStatsResponseSchema.parse(raw) as GetPortfolioStatsResponse;
  },

  async getInvitedUsers(page: number = 1, pageSize: number = 20): Promise<GetInvitedUsersResponse> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>(
      `/auth/invited-users?page=${page}&pageSize=${pageSize}`,
      headers,
    );
    return GetInvitedUsersResponseSchema.parse(raw) as GetInvitedUsersResponse;
  },

  async updateUserStatus(
    userId: string,
    request: UpdateUserStatusRequest,
  ): Promise<UpdateUserStatusResponse> {
    const headers = getAuthHeaders();
    return apiPut<UpdateUserStatusResponse>(
      `/auth/users/${userId}/status`,
      request,
      headers,
    );
  },

  async invite(request: InviteRequest): Promise<InviteResponse> {
    const headers = getAuthHeaders();
    return apiPost<InviteResponse>("/auth/invite", request, headers);
  },

  async requestOwnerOnboarding(
    request: OwnerOnboardingRequest,
  ): Promise<OwnerOnboardingResponse> {
    const headers = getAuthHeaders();
    return apiPost<OwnerOnboardingResponse>("/auth/owner-onboarding", request, headers);
  },

  // -------------------------------------------------------------------------
  // Deprecated token helpers — kept for backward compatibility only.
  // New code should use setAccessToken / getAccessToken from token-manager.
  // -------------------------------------------------------------------------

  /** @deprecated Read access token from token-manager instead. */
  getToken(): string | null {
    return getAccessToken();
  },

  /** @deprecated Use setAccessToken(token, expiresIn) from token-manager. */
  setToken(_token: string): void {
    // No-op: token storage is now handled by auth-context via setAccessToken().
    // This stub prevents runtime errors in any code that still calls this.
  },

  /** @deprecated Use clearAccessToken() from token-manager. */
  clearToken(): void {
    // No-op: token is cleared by auth-context on logout.
  },
};
