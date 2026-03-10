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

export const authApi = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    return apiPost<LoginResponse>("/auth/login", request);
  },

  async signup(request: SignupWithInviteRequest): Promise<SignupWithInviteResponse> {
    return apiPost<SignupWithInviteResponse>("/auth/signup", request);
  },

  async getMe(): Promise<User> {
    const headers = getAuthHeaders();
    return apiGet<User>("/auth/me", headers);
  },

  /** @deprecated Use getMe() */
  async me(): Promise<User> {
    return this.getMe();
  },

  async getInvitation(token: string): Promise<GetInvitationResponse> {
    return apiGet<GetInvitationResponse>(`/auth/invitation/${token}`);
  },

  async updateProfile(
    request: UpdateProfileRequest,
  ): Promise<UpdateProfileResponse> {
    const headers = getAuthHeaders();
    return apiPut<UpdateProfileResponse>("/auth/profile", request, headers);
  },

  async changePassword(
    request: ChangePasswordRequest,
  ): Promise<ChangePasswordResponse> {
    const headers = getAuthHeaders();
    return apiPost<ChangePasswordResponse>("/auth/change-password", request, headers);
  },

  async getProfilePictureUploadUrl(
    request: ProfilePictureUploadUrlRequest,
  ): Promise<ProfilePictureUploadUrlResponse> {
    const headers = getAuthHeaders();
    return apiPost<ProfilePictureUploadUrlResponse>(
      "/auth/profile-picture-upload-url",
      request,
      headers,
    );
  },

  async getPortfolioStats(): Promise<GetPortfolioStatsResponse> {
    const headers = getAuthHeaders();
    return apiGet<GetPortfolioStatsResponse>("/auth/portfolio-stats", headers);
  },

  async getInvitedUsers(page: number = 1, pageSize: number = 20): Promise<GetInvitedUsersResponse> {
    const headers = getAuthHeaders();
    return apiGet<GetInvitedUsersResponse>(
      `/auth/invited-users?page=${page}&pageSize=${pageSize}`,
      headers,
    );
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

  /**
   * Utility to get and store token
   */
  getToken(): string | null {
    return localStorage.getItem("auth_token");
  },

  setToken(token: string): void {
    localStorage.setItem("auth_token", token);
  },

  clearToken(): void {
    localStorage.removeItem("auth_token");
  },
};
