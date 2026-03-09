/**
 * API client barrel export
 * Re-exports all clients and utilities for easy importing
 *
 * Usage:
 *   import { authApi, propertyApi } from '@/lib/api';
 *
 * For backward compatibility, existing imports continue to work
 */

// Export HTTP utilities
export { apiRequest, apiGet, apiPost, apiPut, apiDelete, getAuthHeaders } from "./http";

// Export client modules
export { authApi } from "./clients/auth";
export { propertyApi } from "./clients/property";
export { maintenanceApi } from "./clients/maintenance";
export { leadApi } from "./clients/lead";
export { accountingApi } from "./clients/accounting";
export { assistantApi } from "./clients/assistant";
export { dashboardApi } from "./clients/dashboard";
export { notificationsApi } from "./clients/notifications";
export { tenantScreeningApi } from "./clients/tenant-screening";
export { documentsApi } from "./clients/documents";
export { vendorsApi } from "./clients/vendors";
export { rentSchedulesApi } from "./clients/rent-schedules";

// Re-export types from @ondo/types for convenience
export type {
  User,
  UserRole,
  LoginRequest,
  LoginResponse,
  SignupWithInviteRequest,
  SignupWithInviteResponse,
  Property,
  PropertyPhoto,
  PropertyDetail,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  DeletePropertyResponse,
  ApiErrorResponse,
  ApiErrorField,
  PaginatedResponse,
} from "@ondo/types";
export { ApiError } from "@ondo/types";

// Export types from domain clients
export type { Lead, LeadListResponse, SubmitLeadRequest } from "./clients/lead";
export type {
  MaintenanceListResponse,
} from "./clients/maintenance";
export type {
  Payment,
  Invoice,
  InvoiceItem,
  Expense,
} from "./clients/accounting";
export type { ChatMessage, ChatRequest, ChatResponse } from "./clients/assistant";
export type {
  DashboardStats,
  PropertyMetrics,
  TenantAnalytics,
  FinancialMetrics,
  RiskMetrics,
} from "./clients/dashboard";
export type {
  Notification,
  NotificationPreferences,
} from "./clients/notifications";
export type {
  TenantScreening,
  ScreeningReport,
} from "./clients/tenant-screening";
export type {
  Document,
  CreateDocumentPayload,
} from "./clients/documents";
export type {
  Vendor,
  CreateVendorPayload,
  VendorAssignment,
} from "./clients/vendors";
export type {
  RentSchedule,
  RentSummary,
} from "./clients/rent-schedules";
