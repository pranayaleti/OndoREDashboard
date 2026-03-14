/**
 * API client barrel export
 * Re-exports all clients and utilities for easy importing
 *
 * Usage:
 *   import { authApi, propertyApi } from '@/lib/api';
 *   import { featureApi } from '@/lib/api';
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
export { reportsApi } from "./clients/reports";
export { screeningApi } from "./clients/screening";

// New modules extracted from the legacy api.ts monolith
export { tokenManager } from "./clients/token-manager";
export { handoffApi } from "./clients/handoff";
export { featureApi } from "./clients/feature-api";

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
  DashboardPaymentItem,
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
export type { DocumentListRecord } from "./clients/documents";
// Vendor types: feature-api.ts is the canonical source (snake_case fields match component usage).
// vendors.ts (camelCase) is the REST client implementation; its types are NOT exported to avoid
// conflicts with the snake_case shape that all vendor components and featureApi.vendors depend on.
export type {
  Vendor,
  CreateVendorPayload,
  VendorAssignment,
} from "./clients/feature-api";
// RentSchedule from rent-schedules.ts is the "ledger-style" schedule used by rentSchedulesApi.
// The featureApi.rentPayments methods use the autopay-focused RentSchedule from feature-api.ts.
// We export the feature-api version as the canonical RentSchedule since all feature code uses featureApi.
// The rent-schedules.ts version is aliased as RentScheduleLedger to avoid collision.
export type { RentSummary } from "./clients/rent-schedules";
export type { RentSchedule as RentScheduleLedger } from "./clients/rent-schedules";

// Export types from feature-api (new namespaced API types)
// NOTE: Vendor/CreateVendorPayload/VendorAssignment are exported above (from feature-api, canonical).
//       TenantScreeningStatus/TenantScreeningApplicant/TenantScreeningReport are exported from
//       legacy-types below (single source of truth for those).
export type {
  // Screening
  CreateScreeningRequestInput,
  ScreeningRequestPayload,
  ScreeningReportMetadata,
  // Rent payments (featureApi.rentPayments types — RentSchedule is the autopay-focused shape)
  RentSchedule,
  RentPaymentStatus,
  RentPaymentMethod,
  RentPayment,
  RentReceipt,
  LandlordStatement,
  AutoPayToggleRequest,
  // Lease management
  LeaseStatus,
  LeaseTemplate,
  LeaseTemplateField,
  LeaseDocument,
  ESignRequest,
  // Documents
  DocumentCategory,
  DocumentRecord,
  // Communication
  CommunicationChannel,
  MessageThread,
  MessageParticipant,
  MessagePayload,
  MessageRecord,
  NotificationPreference,
  // Accounting
  LedgerEntryType,
  LedgerEntry,
  ProfitLossSummary,
  LedgerExportRequest,
  // Admin
  AdminMetric,
  RoleAssignment,
  // Stripe / payments
  StripePaymentMethod,
  CreatePaymentIntentParams,
  PaymentRecord,
  SubscriptionRecord,
  // Vendors (specialty/status enums and full types — all from feature-api, canonical snake_case shape)
  VendorSpecialty,
  VendorStatus,
  AssignVendorPayload,
  // Intervention / risk
  InterventionType,
  // Maintenance (feature-api version — includes optional tenant/property fields)
  MaintenanceRequest,
  CreateMaintenanceRequestRequest,
  UpdateMaintenanceRequestRequest,
} from "./clients/feature-api";

// Export legacy types (types from the old api.ts monolith not yet in @ondo/types)
export type {
  // Auth / user
  PortfolioStats,
  ManagerPortfolioStats,
  InvitedUser,
  OwnerOnboardingRequest,
  OwnerOnboardingResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  SignupRequest,
  SignupResponse,
  InviteRequest,
  InviteResponse,
  InvitationDetails,
  // Property
  PropertyOwner,
  PropertyManager,
  PropertyTenant,
  PublicPropertyOwner,
  PublicPropertyManager,
  PublicProperty,
  PropertyAmenity,
  Amenity,
  // Tenant
  Tenant,
  OwnerTenantsSummary,
  OwnerTenantsResponse,
  // Lead
  LeadSubmissionRequest,
  LeadSubmissionResponse,
  // Tenant screening (legacy versions — single source of truth for these names)
  TenantScreeningStatus,
  TenantScreeningSummary,
  TenantScreeningApplicant,
  TenantScreeningReport,
  TenantScreeningSummaryParams,
  TenantScreeningApplicantParams,
  // Dashboard / risk
  PropertyReminderItem,
  AtRiskTenant,
  CreateRiskInterventionRequest,
  RiskAnalytics,
  TenantRiskHistory,
  RiskRecommendation,
  InlineRecommendation,
  // Notifications
  AppNotification,
} from "./clients/legacy-types";
