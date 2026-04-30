/**
 * Feature-level API namespaces.
 * Groups domain-specific API calls under nested namespaces for ergonomic access.
 *
 * Usage:
 *   import { featureApi } from '@/lib/api';
 *   featureApi.accounting.getProfitLoss(...)
 *   featureApi.stripe.createPaymentIntent(...)
 */

import { ApiError as OntoApiError } from "@ondo/types";
import { apiRequest, getAuthHeaders, parseApiErrorBody } from "../http";
import { getApiBaseUrl } from "../base-url";
import {
  getValidAccessToken,
  refreshAccessToken,
  clearAccessToken,
} from "./token-manager";
import { leadApi } from "./lead";
import {
  ListPaymentMethodsResponseSchema,
  CreatePaymentIntentResponseSchema,
  CreateSetupIntentResponseSchema,
  PaymentHistoryResponseSchema,
  GetCurrentSubscriptionResponseSchema,
  MaintenanceRequestSchema,
  MaintenanceRequestArraySchema,
} from "../schemas";

// ─── URL helpers ──────────────────────────────────────────────────────────────

const API_BASE_URL = getApiBaseUrl();

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'object') return;
    query.append(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

/** Many OndoREBackend handlers return `{ message?, data: T }` instead of a bare array. */
function unwrapDataArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (typeof raw === 'object' && raw !== null && 'data' in raw) {
    const d = (raw as { data: unknown }).data;
    if (Array.isArray(d)) return d as Record<string, unknown>[];
  }
  return [];
}

function defaultPnLDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setUTCMonth(start.getUTCMonth() - 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function mapBackendScreeningStatus(
  status: string,
  result: Record<string, unknown> | null | undefined,
): TenantScreeningStatus {
  if (status === 'completed') {
    const rec = result?.recommendation as string | undefined;
    if (rec === 'denied') return 'flagged';
    if (rec === 'conditional') return 'in_review';
    return 'approved';
  }
  if (status === 'failed' || status === 'cancelled') return 'flagged';
  if (status === 'in_progress') return 'in_review';
  return 'pending';
}

function screeningRowToPayload(row: Record<string, unknown>): ScreeningRequestPayload {
  const result = row.result as Record<string, unknown> | null | undefined;
  const status = mapBackendScreeningStatus(String(row.status ?? 'invited'), result);
  const email = String(row.tenantEmail ?? '');
  return {
    id: String(row.id),
    ownerId: String(row.initiatedBy ?? ''),
    tenantName: email.includes('@') ? email.split('@')[0]! : email || 'Applicant',
    tenantEmail: email,
    propertyId: String(row.propertyId ?? ''),
    status,
    invitationSentAt: String(row.createdAt ?? ''),
    completedAt: result?.completedAt != null ? String(result.completedAt) : undefined,
    reportId: row.externalId != null ? String(row.externalId) : undefined,
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.createdAt ?? new Date().toISOString()),
  };
}

function rentScheduleRowToUi(row: Record<string, unknown>): RentSchedule {
  const dueRaw = row.dueDate != null ? String(row.dueDate) : '';
  const amountCents = Number(row.amountCents ?? 0);
  const dueDay = dueRaw
    ? new Date(`${dueRaw}T12:00:00Z`).getUTCDate()
    : 1;
  return {
    tenantId: String(row.tenantId ?? ''),
    propertyId: String(row.propertyId ?? ''),
    monthlyAmount: amountCents / 100,
    dueDay: Number.isNaN(dueDay) ? 1 : dueDay,
    autopayEnabled: false,
    upcomingDueDates: dueRaw ? [dueRaw] : [],
  };
}

function documentRowToLease(row: Record<string, unknown>): LeaseDocument {
  const created = String(row.createdAt ?? new Date().toISOString());
  return {
    id: String(row.id),
    propertyId: String(row.propertyId ?? ''),
    tenantId: '',
    ownerId: String(row.ownerId ?? ''),
    status: row.docType === 'lease' ? 'active' : 'draft',
    createdAt: created,
    updatedAt: created,
    storageKey: row.storagePath != null ? String(row.storagePath) : undefined,
  };
}

function documentRowToRecord(row: Record<string, unknown>): DocumentRecord {
  const created = String(row.createdAt ?? new Date().toISOString());
  return {
    id: String(row.id),
    propertyId: row.propertyId != null ? String(row.propertyId) : undefined,
    tenantId: undefined,
    ownerId: row.ownerId != null ? String(row.ownerId) : undefined,
    categoryId: String(row.docType ?? 'general'),
    fileName: String(row.name ?? 'document'),
    fileSize: Number(row.sizeBytes ?? 0),
    storageKey: String(row.storagePath ?? ''),
    tags: [],
    uploadedBy: String(row.ownerId ?? ''),
    uploadedAt: created,
  };
}

function extractMaintenanceRequests(raw: unknown): MaintenanceRequest[] {
  const directList = MaintenanceRequestArraySchema.safeParse(raw);
  if (directList.success) {
    return directList.data as MaintenanceRequest[];
  }

  if (typeof raw === "object" && raw !== null && "data" in raw) {
    const nested = MaintenanceRequestArraySchema.safeParse((raw as { data?: unknown }).data);
    if (nested.success) {
      return nested.data as MaintenanceRequest[];
    }
  }

  return [];
}

function extractMaintenanceRequest(raw: unknown): MaintenanceRequest {
  const direct = MaintenanceRequestSchema.safeParse(raw);
  if (direct.success) {
    return direct.data as MaintenanceRequest;
  }

  if (typeof raw === "object" && raw !== null) {
    if ("request" in raw) {
      const nested = MaintenanceRequestSchema.safeParse((raw as { request?: unknown }).request);
      if (nested.success) {
        return nested.data as MaintenanceRequest;
      }
    }
    if ("data" in raw) {
      const nested = MaintenanceRequestSchema.safeParse((raw as { data?: unknown }).data);
      if (nested.success) {
        return nested.data as MaintenanceRequest;
      }
    }
  }

  return raw as MaintenanceRequest;
}

// ─── Screening types ─────────────────────────────────────────────────────────

export type TenantScreeningStatus = 'approved' | 'in_review' | 'flagged' | 'pending';
export type CommunicationChannel = 'in_app' | 'email' | 'sms';
export type LeaseStatus = 'draft' | 'pending_signature' | 'executed' | 'active' | 'expired';
export type LedgerEntryType = 'rent' | 'late_fee' | 'expense' | 'credit' | 'adjustment';
export type RentPaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
export type RentPaymentMethod = 'ach' | 'card';
export type VendorSpecialty =
  | 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'flooring'
  | 'windows' | 'structural' | 'pest_control' | 'cleaning' | 'general'
  | 'landscaping' | 'roofing' | 'painting';
export type VendorStatus = 'active' | 'inactive' | 'suspended';
export type InterventionType = 'payment_plan' | 'reminder' | 'assistance_referral' | 'outreach' | 'early_renewal';

export interface CreateScreeningRequestInput {
  tenantName: string;
  tenantEmail: string;
  propertyId: string;
  monthlyRent?: number;
  dueDate?: string;
  notes?: string;
}

export interface ScreeningRequestPayload extends CreateScreeningRequestInput {
  id: string;
  ownerId: string;
  status: TenantScreeningStatus;
  invitationSentAt?: string;
  completedAt?: string;
  reportId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningReportMetadata {
  id: string;
  requestId: string;
  vendor: 'smartmove' | 'applyconnect' | 'rentprep' | 'checkr' | 'mock';
  score?: number;
  summary?: string;
  downloadUrl?: string;
  retrievedAt?: string;
}

// ─── Rent payment types ───────────────────────────────────────────────────────

export interface RentSchedule {
  tenantId: string;
  propertyId: string;
  monthlyAmount: number;
  dueDay: number;
  lateFee?: number;
  gracePeriodDays?: number;
  autopayEnabled: boolean;
  autopayMethod?: RentPaymentMethod;
  nextChargeDate?: string;
  upcomingDueDates: string[];
}

export interface RentPayment {
  id: string;
  scheduleId: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  status: RentPaymentStatus;
  method: RentPaymentMethod;
  scheduledFor: string;
  processedAt?: string;
  failureReason?: string;
  receiptId?: string;
}

export interface RentReceipt {
  id: string;
  paymentId: string;
  tenantId: string;
  propertyId: string;
  issuedAt: string;
  downloadUrl?: string;
}

export interface LandlordStatement {
  id: string;
  ownerId: string;
  periodStart: string;
  periodEnd: string;
  totalCollected: number;
  totalFees: number;
  netPayout: number;
  downloadUrl?: string;
}

export interface AutoPayToggleRequest {
  scheduleId: string;
  enabled: boolean;
  method?: RentPaymentMethod;
}

// ─── Lease management types ───────────────────────────────────────────────────

export interface LeaseTemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
}

export interface LeaseTemplate {
  id: string;
  name: string;
  jurisdiction: string;
  description?: string;
  fields: LeaseTemplateField[];
  isDefault?: boolean;
}

export interface LeaseDocument {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  templateId?: string;
  status: LeaseStatus;
  effectiveDate?: string;
  expirationDate?: string;
  storageKey?: string;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ESignRequest {
  id: string;
  documentId: string;
  provider: 'docusign' | 'hellosign' | 'mock';
  status: 'draft' | 'sent' | 'signed' | 'declined' | 'expired';
  signerEmails: string[];
  sentAt?: string;
  completedAt?: string;
}

// ─── Document types ───────────────────────────────────────────────────────────

export interface DocumentCategory {
  id: string;
  label: string;
  description?: string;
  slug: string;
  roles: string[];
}

export interface DocumentRecord {
  id: string;
  propertyId?: string;
  tenantId?: string;
  ownerId?: string;
  categoryId: string;
  fileName: string;
  fileSize: number;
  storageKey: string;
  downloadUrl?: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
}

// ─── Communication types ──────────────────────────────────────────────────────

export interface MessageParticipant {
  userId: string;
  role: string;
  lastReadAt?: string;
  joinedAt?: string;
}

export interface MessageThread {
  id: string;
  subject: string;
  propertyId?: string;
  createdBy: string;
  createdAt: string;
  lastMessageAt?: string;
  status: 'open' | 'pending' | 'closed' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'maintenance' | 'billing' | 'lease' | 'other';
  assignedTo?: string;
  vendorRecipients?: { vendorId: string; name: string; email: string }[];
  participants: MessageParticipant[];
  unreadCount: number;
}

export interface MessagePayload {
  threadId?: string;
  recipientId: string;
  body: string;
  attachments?: string[];
  channel: CommunicationChannel;
}

export interface MessageRecord {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  mentions: string[];
  templateId?: string;
  channel: string;
  sentAt: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  body: string;
  quickReplies: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface NotificationPreference {
  channel: CommunicationChannel;
  enabled: boolean;
  phoneNumber?: string;
  email?: string;
}

// ─── Accounting types ─────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  propertyId: string;
  tenantId?: string;
  ownerId: string;
  type: LedgerEntryType;
  category?: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface ProfitLossSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  startDate: string;
  endDate: string;
  propertiesIncluded: number;
}

export interface LedgerExportRequest {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  format?: 'csv' | 'pdf';
}

// ─── Admin types ──────────────────────────────────────────────────────────────

export interface AdminMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface RoleAssignment {
  id: string;
  userId: string;
  role: string;
  status: 'pending' | 'approved' | 'revoked';
  createdAt: string;
}

// ─── Stripe / Payment types ───────────────────────────────────────────────────

export interface StripePaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  type: 'card' | 'us_bank_account';
  brand?: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreatePaymentIntentParams {
  amountCents: number;
  paymentType: 'rent' | 'one_time' | 'investment';
  propertyId?: string;
  description?: string;
  paymentMethodId?: string;
}

export interface PaymentRecord {
  id: string;
  stripePaymentIntentId: string;
  amountCents: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  paymentType: 'rent' | 'one_time' | 'investment' | 'subscription';
  propertyId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRecord {
  id: string;
  stripeSubscriptionId: string;
  planName: 'starter' | 'growth' | 'portfolio';
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

// ─── Vendor types ─────────────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  specialty: VendorSpecialty;
  secondary_specialties?: VendorSpecialty[];
  license_number?: string;
  insurance_info?: string;
  hourly_rate?: number;
  rating: number;
  review_count: number;
  status: VendorStatus;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  service_radius_miles: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorPayload {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  specialty: VendorSpecialty;
  secondary_specialties?: VendorSpecialty[];
  license_number?: string;
  insurance_info?: string;
  hourly_rate?: number;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  service_radius_miles?: number;
}

export interface VendorAssignment {
  id: string;
  vendor_id: string;
  maintenance_request_id: string;
  assigned_by: string;
  estimated_cost?: number;
  actual_cost?: number;
  scheduled_date?: string;
  completed_date?: string;
  notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  vendor?: Vendor;
}

export interface AssignVendorPayload {
  vendor_id: string;
  maintenance_request_id: string;
  estimated_cost?: number;
  scheduled_date?: string;
  notes?: string;
}

// ─── Maintenance types (local copies for featureApi.maintenance) ──────────────

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'flooring' | 'windows' | 'structural' | 'pest_control' | 'cleaning' | 'other';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  propertyId: string;
  tenantId: string;
  managerNotes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  dateScheduled?: string;
  dateCompleted?: string;
  photos?: string[];
  updates?: string[];
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCity?: string;
  tenantFirstName?: string;
  tenantLastName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
}

export interface CreateMaintenanceRequestRequest {
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'flooring' | 'windows' | 'structural' | 'pest_control' | 'cleaning' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'emergency';
  photos?: string[];
}

export interface UpdateMaintenanceRequestRequest {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  managerNotes?: string;
}

// ─── Internal helpers used by featureApi ─────────────────────────────────────

/**
 * Make a raw fetch (typically multipart/binary body) with the auth token and
 * JSON-aware response parsing.
 *
 * Aligned with apiRequest in lib/api/http.ts:
 *   - awaits getValidAccessToken() so an expiring token silently refreshes
 *   - on 401 retries once after refreshAccessToken() succeeds
 *   - on terminal 401 dispatches auth:session-expired (matches http.ts)
 *   - throws OntoApiError (parsed via parseApiErrorBody) so callers get the
 *     same instance type as apiRequest — single error model in the dashboard
 */
async function rawAuthRequest<T>(
  method: string,
  endpoint: string,
  body?: BodyInit,
  extraHeaders?: Record<string, string>,
  isRetry = false,
): Promise<T> {
  const token = await getValidAccessToken();
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    body,
    credentials: 'include',
  });

  if (response.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return rawAuthRequest<T>(method, endpoint, body, extraHeaders, true);
    }
    clearAccessToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
    throw new OntoApiError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const text = await response.text();

  let data: unknown;
  if (isJson && text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  } else {
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const errorData = parseApiErrorBody(data, response.status);
    throw new OntoApiError(
      errorData.message,
      response.status,
      errorData.code,
      errorData.errors,
      errorData.correlationId,
    );
  }

  // Type assertion is safe here because we control the return type T
  // Callers are responsible for validating the shape matches T
  return data as T;
}

// ─── featureApi ───────────────────────────────────────────────────────────────

/**
 * Feature-level API namespaces.
 * Each property groups calls for a specific business domain.
 */
export const featureApi = {
  screening: {
    async listRequests(params?: Record<string, string | number>): Promise<ScreeningRequestPayload[]> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<{ screenings?: unknown[] }>(
        'GET',
        `/screening${buildQueryString(params)}`,
        undefined,
        headers,
      );
      const list = Array.isArray(raw.screenings) ? raw.screenings : [];
      return list
        .map((r) => screeningRowToPayload(r as Record<string, unknown>));
    },
    async createRequest(payload: CreateScreeningRequestInput): Promise<ScreeningRequestPayload> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<{
        screeningId: string;
        externalId?: string;
        inviteUrl?: string;
        status?: string;
      }>(
        'POST',
        '/screening/initiate',
        {
          tenantEmail: payload.tenantEmail,
          tenantName: payload.tenantName,
          propertyId: payload.propertyId,
        },
        headers,
      );
      const now = new Date().toISOString();
      return {
        id: raw.screeningId,
        ownerId: '',
        tenantName: payload.tenantName,
        tenantEmail: payload.tenantEmail,
        propertyId: payload.propertyId,
        monthlyRent: payload.monthlyRent,
        dueDate: payload.dueDate,
        notes: payload.notes,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
    },
    sendScreeningLink(
      _requestId: string,
      _channel: CommunicationChannel = 'email',
    ): Promise<{ message: string }> {
      return Promise.resolve({
        message: 'Invite link is created when screening is initiated; resend is not yet exposed by the API.',
      });
    },
    async fetchReportMetadata(requestId: string): Promise<ScreeningReportMetadata> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<{ screening?: Record<string, unknown> }>(
        'GET',
        `/screening/${requestId}`,
        undefined,
        headers,
      );
      const s = raw.screening ?? {};
      const result = s.result as Record<string, unknown> | undefined;
      const bc = result?.backgroundCheck as Record<string, unknown> | undefined;
      return {
        id: requestId,
        requestId,
        vendor: 'mock',
        score: typeof result?.creditScore === 'number' ? result.creditScore : undefined,
        summary: typeof bc?.summary === 'string' ? bc.summary : undefined,
        downloadUrl: typeof result?.reportUrl === 'string' ? result.reportUrl : undefined,
        retrievedAt:
          typeof result?.completedAt === 'string' ? result.completedAt : undefined,
      };
    },
  },

  rentPayments: {
    async getSchedule(propertyId?: string): Promise<RentSchedule[]> {
      const headers = getAuthHeaders();
      const endpoint = propertyId
        ? `/rent-schedules/property/${encodeURIComponent(propertyId)}`
        : '/rent-schedules/my-schedule';
      const raw = await apiRequest<unknown>('GET', endpoint, undefined, headers);
      return unwrapDataArray(raw).map(rentScheduleRowToUi);
    },
    updateSchedule(scheduleId: string, partial: Partial<RentSchedule>): Promise<RentSchedule> {
      const headers = getAuthHeaders();
      return apiRequest<RentSchedule>('PATCH', `/rent/schedules/${scheduleId}`, partial, headers);
    },
    toggleAutopay(payload: AutoPayToggleRequest): Promise<RentSchedule> {
      const headers = getAuthHeaders();
      return apiRequest<RentSchedule>(
        'POST',
        `/rent/schedules/${payload.scheduleId}/autopay`,
        payload,
        headers,
      );
    },
    createPayment(
      scheduleId: string,
      amount: number,
      method: RentPaymentMethod = 'ach',
    ): Promise<RentPayment> {
      // ROADMAP: Wire to Stripe + Plaid ACH once credentials provided (Q2 2026 - payment system).
      const headers = getAuthHeaders();
      return apiRequest<RentPayment>(
        'POST',
        `/rent/schedules/${scheduleId}/payments`,
        { amount, method },
        headers,
      );
    },
    listPayments(_params?: { propertyId?: string; tenantId?: string }): Promise<RentPayment[]> {
      return Promise.resolve([]);
    },
    listReceipts(_tenantId?: string): Promise<RentReceipt[]> {
      return Promise.resolve([]);
    },
    getLandlordStatements(_ownerId?: string): Promise<LandlordStatement[]> {
      return Promise.resolve([]);
    },
  },

  leaseManagement: {
    listTemplates(): Promise<LeaseTemplate[]> {
      const headers = getAuthHeaders();
      return apiRequest<LeaseTemplate[]>('GET', '/leases/templates', undefined, headers);
    },
    createTemplate(payload: LeaseTemplate): Promise<LeaseTemplate> {
      const headers = getAuthHeaders();
      return apiRequest<LeaseTemplate>('POST', '/leases/templates', payload, headers);
    },
    generateFromTemplate(
      templateId: string,
      context: Record<string, unknown>,
    ): Promise<LeaseDocument> {
      const headers = getAuthHeaders();
      return apiRequest<LeaseDocument>(
        'POST',
        `/leases/templates/${templateId}/generate`,
        context,
        headers,
      );
    },
    uploadLease(metadata: Partial<LeaseDocument>): Promise<LeaseDocument> {
      const headers = getAuthHeaders();
      return apiRequest<LeaseDocument>('POST', '/leases/documents', metadata, headers);
    },
    async listLeases(params?: {
      propertyId?: string;
      tenantId?: string;
      status?: LeaseStatus;
    }): Promise<LeaseDocument[]> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>(
        'GET',
        `/documents${buildQueryString({
          propertyId: params?.propertyId,
          tenantId: params?.tenantId,
        })}`,
        undefined,
        headers,
      );
      const rows = unwrapDataArray(raw).filter((r) => String(r.docType ?? '') === 'lease');
      return rows.map(documentRowToLease);
    },
    sendForSignature(
      documentId: string,
      provider: ESignRequest['provider'] = 'mock',
    ): Promise<ESignRequest> {
      // ROADMAP: Plug in DocuSign/HelloSign keys (Q2 2026 - lease management).
      const headers = getAuthHeaders();
      return apiRequest<ESignRequest>(
        'POST',
        `/leases/documents/${documentId}/esign`,
        { provider },
        headers,
      );
    },
  },

  maintenance: {
    async createMaintenanceRequest(data: CreateMaintenanceRequestRequest): Promise<MaintenanceRequest> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>('POST', '/maintenance', data, headers);
      return extractMaintenanceRequest(raw);
    },
    async getTenantMaintenanceRequests(): Promise<MaintenanceRequest[]> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>('GET', '/maintenance/tenant', undefined, headers);
      return extractMaintenanceRequests(raw);
    },
    async getManagerMaintenanceRequests(): Promise<MaintenanceRequest[]> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>('GET', '/dashboard/maintenance', undefined, headers);
      return extractMaintenanceRequests(raw);
    },
    async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>('GET', `/maintenance/${id}`, undefined, headers);
      return extractMaintenanceRequest(raw);
    },
    async updateMaintenanceRequest(
      id: string,
      data: UpdateMaintenanceRequestRequest,
    ): Promise<MaintenanceRequest> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>('PUT', `/maintenance/${id}`, data, headers);
      return extractMaintenanceRequest(raw);
    },
  },

  documents: {
    listCategories(): Promise<DocumentCategory[]> {
      return Promise.resolve([]);
    },
    async listDocuments(params?: {
      propertyId?: string;
      tenantId?: string;
      ownerId?: string;
    }): Promise<DocumentRecord[]> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>(
        'GET',
        `/documents${buildQueryString(params)}`,
        undefined,
        headers,
      );
      return unwrapDataArray(raw).map(documentRowToRecord);
    },
    uploadDocument(record: Partial<DocumentRecord>): Promise<DocumentRecord> {
      const headers = getAuthHeaders();
      return apiRequest<DocumentRecord>('POST', '/documents', record, headers);
    },
    deleteDocument(documentId: string): Promise<{ message: string }> {
      const headers = getAuthHeaders();
      return apiRequest<{ message: string }>('DELETE', `/documents/${documentId}`, undefined, headers);
    },
  },

  communication: {
    listThreads(filters?: {
      propertyId?: string;
      priority?: string;
      status?: string;
      category?: string;
      from?: string;
      to?: string;
      sort?: string;
      order?: string;
    }): Promise<MessageThread[]> {
      const headers = getAuthHeaders();
      const params = filters
        ? '?' +
          new URLSearchParams(
            Object.fromEntries(
              Object.entries(filters).filter(([, v]) => v !== undefined)
            ) as Record<string, string>
          ).toString()
        : '';
      return apiRequest<{ data: MessageThread[] }>(
        'GET',
        `/communication/threads${params}`,
        undefined,
        headers
      ).then((r) => r.data || []);
    },

    getThread(threadId: string): Promise<MessageThread> {
      const headers = getAuthHeaders();
      return apiRequest<{ data: MessageThread }>(
        'GET',
        `/communication/threads/${threadId}`,
        undefined,
        headers
      ).then((r) => r.data);
    },

    createThread(payload: {
      subject: string;
      propertyId?: string;
      participantIds?: string[];
      status?: string;
      priority?: string;
      category?: string;
    }): Promise<MessageThread> {
      const headers = getAuthHeaders();
      return apiRequest<{ data: MessageThread }>(
        'POST',
        '/communication/threads',
        payload,
        headers
      ).then((r) => r.data);
    },

    updateThread(
      threadId: string,
      updates: {
        status?: string;
        priority?: string;
        category?: string;
        assignedTo?: string | null;
      }
    ): Promise<MessageThread> {
      const headers = getAuthHeaders();
      return apiRequest<{ data: MessageThread }>(
        'PATCH',
        `/communication/threads/${threadId}`,
        updates,
        headers
      ).then((r) => r.data);
    },

    listMessages(threadId: string, page = 1): Promise<MessageRecord[]> {
      const headers = getAuthHeaders();
      return apiRequest<{ data: MessageRecord[] }>(
        'GET',
        `/communication/threads/${threadId}/messages?page=${page}`,
        undefined,
        headers
      ).then((r) => r.data || []);
    },

    sendMessage(payload: {
      threadId: string;
      body: string;
      templateId?: string;
    }): Promise<MessageRecord> {
      const headers = getAuthHeaders();
      return apiRequest<{ data: MessageRecord }>(
        'POST',
        `/communication/threads/${payload.threadId}/messages`,
        { body: payload.body, templateId: payload.templateId },
        headers
      ).then((r) => r.data);
    },

    markRead(threadId: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>(
        'PATCH',
        `/communication/threads/${threadId}/read`,
        {},
        headers
      );
    },

    addParticipant(threadId: string, userId: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>(
        'POST',
        `/communication/threads/${threadId}/participants`,
        { userId },
        headers
      );
    },

    listTemplates(): Promise<MessageTemplate[]> {
      const headers = getAuthHeaders();
      return apiRequest<{ data: MessageTemplate[] }>(
        'GET',
        '/communication/templates',
        undefined,
        headers
      ).then((r) => r.data || []);
    },

    createTemplate(payload: {
      title: string;
      body: string;
      quickReplies: string[];
      isPublic: boolean;
    }): Promise<MessageTemplate> {
      const headers = getAuthHeaders();
      return apiRequest<{ data: MessageTemplate }>(
        'POST',
        '/communication/templates',
        payload,
        headers
      ).then((r) => r.data);
    },

    updatePreferences(
      preferences: NotificationPreference[]
    ): Promise<NotificationPreference[]> {
      const headers = getAuthHeaders();
      return apiRequest<NotificationPreference[]>(
        'PUT',
        '/communication/preferences',
        preferences,
        headers
      );
    },
  },

  accounting: {
    async listLedgerEntries(params?: {
      propertyId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<LedgerEntry[]> {
      if (!params?.propertyId) return [];
      const headers = getAuthHeaders();
      const query = buildQueryString({
        startDate: params.startDate,
        endDate: params.endDate,
      });
      const raw = await apiRequest<unknown>(
        'GET',
        `/properties/${params.propertyId}/expenses${query}`,
        undefined,
        headers,
      );
      const rows = unwrapDataArray(raw);
      return rows.map((r) => ({
        id: String(r.id ?? ''),
        propertyId: String(r.property_id ?? params.propertyId ?? ''),
        ownerId: String(r.created_by ?? ''),
        type: 'expense' as LedgerEntryType,
        category: String(r.category ?? ''),
        description: String(r.description ?? ''),
        amount: typeof r.amount_cents === 'number' ? r.amount_cents / 100 : 0,
        date: String(r.expense_date ?? r.created_at ?? ''),
        createdAt: String(r.created_at ?? ''),
      }));
    },
    async createLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
      const headers = getAuthHeaders();
      const payload = {
        category: entry.category ?? 'other',
        description: entry.description,
        amount_cents: Math.round(entry.amount * 100),
        expense_date: entry.date,
        tax_deductible: true,
      };
      const raw = await apiRequest<unknown>(
        'POST',
        `/properties/${entry.propertyId}/expenses`,
        payload,
        headers,
      );
      const r = (raw as Record<string, unknown>)?.data ?? raw as Record<string, unknown>;
      return {
        ...entry,
        id: String((r as Record<string, unknown>)?.id ?? entry.id),
        createdAt: String((r as Record<string, unknown>)?.created_at ?? new Date().toISOString()),
      };
    },
    async recordExpense(
      entry: Omit<LedgerEntry, 'id' | 'type'> & { type?: LedgerEntry['type'] },
    ): Promise<LedgerEntry> {
      const headers = getAuthHeaders();
      const payload = {
        category: entry.category ?? 'other',
        description: entry.description,
        amount_cents: Math.round(entry.amount * 100),
        expense_date: entry.date,
        tax_deductible: true,
      };
      const raw = await apiRequest<unknown>(
        'POST',
        `/properties/${entry.propertyId}/expenses`,
        payload,
        headers,
      );
      const r = ((raw as Record<string, unknown>)?.data ?? raw) as Record<string, unknown>;
      return {
        ...entry,
        id: String(r?.id ?? ''),
        type: 'expense' as LedgerEntryType,
        createdAt: String(r?.created_at ?? new Date().toISOString()),
      };
    },
    async getProfitLoss(params?: {
      propertyId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<ProfitLossSummary> {
      const headers = getAuthHeaders();
      const range = defaultPnLDateRange();
      const startDate = params?.startDate ?? range.startDate;
      const endDate = params?.endDate ?? range.endDate;
      const raw = await apiRequest<{
        data?: {
          startDate: string;
          endDate: string;
          income: { total: number };
          expenses: { total: number };
          netIncome: number;
          properties: unknown[];
        };
      }>(
        'GET',
        `/reports/pnl${buildQueryString({
          startDate,
          endDate,
          propertyId: params?.propertyId,
        })}`,
        undefined,
        headers,
      );
      const d = raw.data;
      if (!d) {
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netIncome: 0,
          startDate,
          endDate,
          propertiesIncluded: 0,
        };
      }
      return {
        totalIncome: d.income.total,
        totalExpenses: d.expenses.total,
        netIncome: d.netIncome,
        startDate: d.startDate,
        endDate: d.endDate,
        propertiesIncluded: Array.isArray(d.properties) ? d.properties.length : 0,
      };
    },
    async exportLedger(payload: LedgerExportRequest): Promise<{ downloadUrl: string; fileName?: string; expiresIn?: number }> {
      const headers = getAuthHeaders();
      return apiRequest<{ downloadUrl: string; fileName?: string; expiresIn?: number }>(
        'GET',
        `/reports/pnl/export-url${buildQueryString({
          startDate: payload.startDate,
          endDate: payload.endDate,
          propertyId: payload.propertyId,
          format: payload.format,
        })}`,
        undefined,
        headers,
      );
    },
  },

  admin: {
    getMetrics(): Promise<AdminMetric[]> {
      const headers = getAuthHeaders();
      return apiRequest<AdminMetric[]>('GET', '/admin/metrics', undefined, headers);
    },
    listRoleAssignments(): Promise<RoleAssignment[]> {
      const headers = getAuthHeaders();
      return apiRequest<RoleAssignment[]>('GET', '/admin/roles', undefined, headers);
    },
    updateRoleAssignment(
      roleId: string,
      status: RoleAssignment['status'],
    ): Promise<RoleAssignment> {
      const headers = getAuthHeaders();
      return apiRequest<RoleAssignment>('PATCH', `/admin/roles/${roleId}`, { status }, headers);
    },
  },

  stripe: {
    async createSetupIntent(): Promise<{ success: boolean; clientSecret: string }> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>(
        'POST',
        '/payments/setup-intent',
        undefined,
        headers,
      );
      return CreateSetupIntentResponseSchema.parse(raw);
    },
    async listPaymentMethods(): Promise<{ success: boolean; data: StripePaymentMethod[] }> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>(
        'GET',
        '/payments/payment-methods',
        undefined,
        headers,
      );
      return ListPaymentMethodsResponseSchema.parse(raw);
    },
    attachPaymentMethod(
      stripePaymentMethodId: string,
    ): Promise<{ success: boolean; data: StripePaymentMethod }> {
      const headers = getAuthHeaders();
      return apiRequest<{ success: boolean; data: StripePaymentMethod }>(
        'POST',
        '/payments/payment-methods',
        { stripePaymentMethodId },
        headers,
      );
    },
    removePaymentMethod(id: string): Promise<{ success: boolean }> {
      const headers = getAuthHeaders();
      return apiRequest<{ success: boolean }>(
        'DELETE',
        `/payments/payment-methods/${id}`,
        undefined,
        headers,
      );
    },
    setDefaultPaymentMethod(id: string): Promise<{ success: boolean }> {
      const headers = getAuthHeaders();
      return apiRequest<{ success: boolean }>(
        'PUT',
        `/payments/payment-methods/${id}/default`,
        undefined,
        headers,
      );
    },
    async createPaymentIntent(
      params: CreatePaymentIntentParams,
    ): Promise<{ success: boolean; clientSecret: string; paymentId: string }> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>(
        'POST',
        '/payments/create-payment-intent',
        params,
        headers,
      );
      return CreatePaymentIntentResponseSchema.parse(raw);
    },
    async getPaymentHistory(
      page?: number,
      limit?: number,
    ): Promise<{
      success: boolean;
      data: PaymentRecord[];
      pagination: { page: number; limit: number; total: number; hasMore: boolean };
    }> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>(
        'GET',
        `/payments/history${buildQueryString({ page, limit })}`,
        undefined,
        headers,
      );
      return PaymentHistoryResponseSchema.parse(raw);
    },
  },

  plaid: {
    async configured(): Promise<{ success: boolean; configured: boolean }> {
      const headers = getAuthHeaders();
      return apiRequest<{ success: boolean; configured: boolean }>(
        'GET',
        '/plaid/configured',
        undefined,
        headers,
      );
    },
    async createLinkToken(): Promise<{ success: boolean; linkToken: string }> {
      const headers = getAuthHeaders();
      return apiRequest<{ success: boolean; linkToken: string }>(
        'POST',
        '/plaid/link-token',
        undefined,
        headers,
      );
    },
    async exchangePublicToken(args: {
      publicToken: string;
      selectedAccountId?: string;
    }): Promise<{
      success: boolean;
      data: { bankSourceId: string; bankName: string; last4: string; plaidItemRowId: string };
    }> {
      const headers = getAuthHeaders();
      return apiRequest<{
        success: boolean;
        data: { bankSourceId: string; bankName: string; last4: string; plaidItemRowId: string };
      }>('POST', '/plaid/exchange-public-token', args, headers);
    },
  },

  subscriptions: {
    create(
      planName: string,
    ): Promise<{ success: boolean; clientSecret: string; subscriptionId: string }> {
      const headers = getAuthHeaders();
      return apiRequest<{ success: boolean; clientSecret: string; subscriptionId: string }>(
        'POST',
        '/subscriptions/create',
        { planName },
        headers,
      );
    },
    async getCurrent(): Promise<{ success: boolean; data: SubscriptionRecord | null }> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>(
        'GET',
        '/subscriptions/current',
        undefined,
        headers,
      );
      return GetCurrentSubscriptionResponseSchema.parse(raw);
    },
    cancel(): Promise<{ success: boolean; message: string }> {
      const headers = getAuthHeaders();
      return apiRequest<{ success: boolean; message: string }>(
        'POST',
        '/subscriptions/cancel',
        undefined,
        headers,
      );
    },
    resume(): Promise<{ success: boolean; message: string }> {
      const headers = getAuthHeaders();
      return apiRequest<{ success: boolean; message: string }>(
        'POST',
        '/subscriptions/resume',
        undefined,
        headers,
      );
    },
  },

  vendors: {
    list(params?: {
      specialty?: VendorSpecialty;
      status?: VendorStatus;
      city?: string;
    }): Promise<Vendor[]> {
      const headers = getAuthHeaders();
      const query = params
        ? '?' +
          new URLSearchParams(
            Object.entries(params).filter(([, v]) => v != null) as [string, string][],
          ).toString()
        : '';
      return apiRequest<{ vendors: Vendor[] } | Vendor[]>(
        'GET',
        `/vendors${query}`,
        undefined,
        headers,
      ).then((r) => {
        // Type narrowing: check response shape
        if (Array.isArray(r)) {
          return r;
        }
        if (typeof r === 'object' && r !== null && 'vendors' in r) {
          return (r as { vendors: Vendor[] }).vendors ?? [];
        }
        return [];
      });
    },
    get(id: string): Promise<Vendor> {
      const headers = getAuthHeaders();
      return apiRequest<Vendor>('GET', `/vendors/${id}`, undefined, headers);
    },
    create(payload: CreateVendorPayload): Promise<Vendor> {
      const headers = getAuthHeaders();
      return apiRequest<{ vendor: Vendor } | Vendor>(
        'POST',
        '/vendors',
        payload,
        headers,
      ).then((r) => {
        // Type narrowing: check for nested vendor object
        if (typeof r === 'object' && r !== null && 'vendor' in r) {
          return (r as { vendor: Vendor }).vendor;
        }
        // Assume it's a direct Vendor object
        return r as Vendor;
      });
    },
    update(id: string, payload: Partial<CreateVendorPayload>): Promise<Vendor> {
      const headers = getAuthHeaders();
      return apiRequest<{ vendor: Vendor } | Vendor>(
        'PUT',
        `/vendors/${id}`,
        payload,
        headers,
      ).then((r) => {
        // Type narrowing: check for nested vendor object
        if (typeof r === 'object' && r !== null && 'vendor' in r) {
          return (r as { vendor: Vendor }).vendor;
        }
        // Assume it's a direct Vendor object
        return r as Vendor;
      });
    },
    deactivate(id: string): Promise<{ message: string }> {
      const headers = getAuthHeaders();
      return apiRequest<{ message: string }>('DELETE', `/vendors/${id}`, undefined, headers);
    },
    assign(payload: AssignVendorPayload): Promise<VendorAssignment> {
      const headers = getAuthHeaders();
      return apiRequest<{ assignment: VendorAssignment } | VendorAssignment>(
        'POST',
        '/vendors/assign',
        payload,
        headers,
      ).then((r) =>
        'assignment' in r
          ? (r as { assignment: VendorAssignment }).assignment
          : (r as VendorAssignment),
      );
    },
    suggest(category: string, city?: string): Promise<Vendor[]> {
      const headers = getAuthHeaders();
      const query = new URLSearchParams({ category, ...(city ? { city } : {}) }).toString();
      return apiRequest<{ vendors: Vendor[] } | Vendor[]>(
        'GET',
        `/vendors/suggest?${query}`,
        undefined,
        headers,
      ).then((r) => (Array.isArray(r) ? r : (r as { vendors: Vendor[] }).vendors ?? []));
    },
    getAssignments(vendorId: string): Promise<VendorAssignment[]> {
      const headers = getAuthHeaders();
      return apiRequest<{ assignments: VendorAssignment[] } | VendorAssignment[]>(
        'GET',
        `/vendors/${vendorId}/assignments`,
        undefined,
        headers,
      ).then((r) =>
        Array.isArray(r) ? r : (r as { assignments: VendorAssignment[] }).assignments ?? [],
      );
    },
  },

  // ── Plans ──────────────────────────────────────────────────────────────────

  plans: {
    list(): Promise<unknown[]> {
      return apiRequest<unknown>('GET', '/plans').then((r) => unwrapDataArray(r));
    },
    getMyPlan(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/plans/my', undefined, headers);
    },
  },

  // ── Co-Owners ──────────────────────────────────────────────────────────────

  coOwners: {
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/co-owners`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    invite(propertyId: string, email: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/co-owners`, { email }, headers);
    },
    remove(propertyId: string, userId: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>('DELETE', `/properties/${propertyId}/co-owners/${userId}`, undefined, headers);
    },
  },

  // ── Screening Config ───────────────────────────────────────────────────────

  screeningConfig: {
    getTemplates(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/screening-templates', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    getConfig(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/screening-config`, undefined, headers);
    },
    setConfig(
      propertyId: string,
      templateId: string | null,
      criteria: Record<string, unknown>,
      requiredChecks: string[],
      applicantDisclosureNotes: string | null,
    ): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>(
        'PUT',
        `/properties/${propertyId}/screening-config`,
        { templateId, criteria, requiredChecks, applicantDisclosureNotes },
        headers,
      );
    },
    getQuestions(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/screening-questions`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    addQuestion(propertyId: string, question: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/screening-questions`, question, headers);
    },
    updateQuestion(questionId: string, updates: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/screening-questions/${questionId}`, updates, headers);
    },
    deleteQuestion(questionId: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>('DELETE', `/screening-questions/${questionId}`, undefined, headers);
    },
  },

  // ── Applications ───────────────────────────────────────────────────────────

  applications: {
    inviteTenant(propertyId: string, email: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/invite-tenant`, { email }, headers);
    },
    createPublicLink(propertyId: string, expiryDays?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/public-link`, { expiryDays }, headers);
    },
    getLinks(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/application-links`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    deactivateLink(linkId: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>('DELETE', `/application-links/${linkId}`, undefined, headers);
    },
    listForProperty(propertyId: string, status?: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const query = status ? `?status=${status}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/applications${query}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    get(applicationId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/applications/${applicationId}`, undefined, headers);
    },
    approve(applicationId: string, notes?: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/applications/${applicationId}/approve`, { notes }, headers);
    },
    reject(applicationId: string, notes?: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/applications/${applicationId}/reject`, { notes }, headers);
    },
    triggerChecks(applicationId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/applications/${applicationId}/checks/trigger`, undefined, headers);
    },
    getChecks(applicationId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/applications/${applicationId}/checks`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Leases ─────────────────────────────────────────────────────────────────

  leases: {
    create(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/leases', data, headers);
    },
    get(leaseId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/leases/${leaseId}`, undefined, headers);
    },
    update(leaseId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/leases/${leaseId}`, data, headers);
    },
    sendForSignature(leaseId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/leases/${leaseId}/send-for-signature`, undefined, headers);
    },
    sign(leaseId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/leases/${leaseId}/sign`, undefined, headers);
    },
    listForProperty(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/leases`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    getMyLease(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/leases/my', undefined, headers);
    },
    generatePdf(leaseId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/leases/${leaseId}/generate-pdf`, undefined, headers);
    },
    getPdfUrl(leaseId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/leases/${leaseId}/pdf-url`, undefined, headers);
    },
    offerRenewal(leaseId: string, terms: { leaseEnd: string; monthlyRent: number; securityDeposit?: number }): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/leases/${leaseId}/offer-renewal`, terms, headers);
    },
    getExpiringSoon(days?: number): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const query = days ? `?days=${days}` : '';
      return apiRequest<unknown>('GET', `/leases/expiring-soon${query}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Application Comments ────────────────────────────────────────────────────

  applicationComments: {
    list(applicationId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/applications/${applicationId}/comments`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    add(applicationId: string, comment: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/applications/${applicationId}/comments`, { comment }, headers);
    },
    remove(commentId: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>('DELETE', `/application-comments/${commentId}`, undefined, headers);
    },
  },

  // ── Application Attachments ─────────────────────────────────────────────────

  applicationAttachments: {
    list(applicationId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/applications/${applicationId}/attachments`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    remove(attachmentId: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>('DELETE', `/application-attachments/${attachmentId}`, undefined, headers);
    },
  },

  // ── Application Analytics ───────────────────────────────────────────────────

  analytics: {
    getApplicationFunnel(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/analytics/applications', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    getPropertyFunnel(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/analytics/applications/${propertyId}`, undefined, headers);
    },
  },

  // ── Enhanced Application Actions ────────────────────────────────────────────

  applicationActions: {
    waitlist(applicationId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/applications/${applicationId}/waitlist`, undefined, headers);
    },
    allowReapply(applicationId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/applications/${applicationId}/allow-reapply`, undefined, headers);
    },
    compare(propertyId: string, applicationIds: string[]): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/compare-applications`, { applicationIds }, headers)
        .then((r) => unwrapDataArray(r));
    },
    bulkInvite(propertyId: string, emails: string[]): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/bulk-invite`, { emails }, headers);
    },
  },

  // ── Webhook Subscriptions ───────────────────────────────────────────────────

  webhooks: {
    list(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/webhooks/subscriptions', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    create(eventType: string, url: string, secret?: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/webhooks/subscriptions', { eventType, url, secret }, headers);
    },
    remove(id: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>('DELETE', `/webhooks/subscriptions/${id}`, undefined, headers);
    },
  },

  // ── Inspections ─────────────────────────────────────────────────────────────

  inspections: {
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/inspections`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    get(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/inspections/${id}`, undefined, headers);
    },
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/inspections`, data, headers);
    },
    update(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/inspections/${id}`, data, headers);
    },
    addItems(id: string, items: unknown[]): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/inspections/${id}/items`, { items }, headers);
    },
    compare(moveInId: string, moveOutId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/inspections/${moveInId}/compare/${moveOutId}`, undefined, headers);
    },
  },

  // ── Expenses & P&L ──────────────────────────────────────────────────────────

  expenses: {
    list(propertyId: string, filters?: Record<string, string>): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = buildQueryString(filters);
      return apiRequest<unknown>('GET', `/properties/${propertyId}/expenses${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/expenses`, data, headers);
    },
    update(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/expenses/${id}`, data, headers);
    },
    remove(id: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>('DELETE', `/expenses/${id}`, undefined, headers);
    },
    getPnL(propertyId: string, startDate?: string, endDate?: string): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = buildQueryString({ startDate, endDate });
      return apiRequest<unknown>('GET', `/properties/${propertyId}/pnl${qs}`, undefined, headers);
    },
    getOwnerSummary(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/pnl-summary', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Late Fees ───────────────────────────────────────────────────────────────

  lateFees: {
    getRule(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/late-fee-rules`, undefined, headers);
    },
    setRule(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/properties/${propertyId}/late-fee-rules`, data, headers);
    },
    apply(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/apply-late-fees`, undefined, headers);
    },
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/late-fees`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    waive(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/late-fees/${id}/waive`, undefined, headers);
    },
  },

  // ── Rent Increases ──────────────────────────────────────────────────────────

  rentIncreases: {
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/rent-increases`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/rent-increases`, data, headers);
    },
    sendNotice(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/rent-increases/${id}/send-notice`, undefined, headers);
    },
    cancel(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/rent-increases/${id}/cancel`, undefined, headers);
    },
  },

  // ── Amenities ───────────────────────────────────────────────────────────────

  amenities: {
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/amenities`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/amenities`, data, headers);
    },
    update(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/amenities/${id}`, data, headers);
    },
    getBookings(amenityId: string, date?: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = buildQueryString({ date });
      return apiRequest<unknown>('GET', `/amenities/${amenityId}/bookings${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Announcements ──────────────────────────────────────────────────────────

  announcements: {
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/announcements`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/announcements`, data, headers);
    },
    remove(id: string): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>('DELETE', `/announcements/${id}`, undefined, headers);
    },
  },

  // ── Surveys ─────────────────────────────────────────────────────────────────

  surveys: {
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/surveys`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    get(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/surveys/${id}`, undefined, headers);
    },
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/surveys`, data, headers);
    },
    activate(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/surveys/${id}/activate`, undefined, headers);
    },
    getResults(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/surveys/${id}/results`, undefined, headers);
    },
  },

  // ── Audit Log ───────────────────────────────────────────────────────────────

  auditLog: {
    list(filters?: Record<string, string | number>): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = buildQueryString(filters);
      return apiRequest<unknown>('GET', `/audit-log${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Two-Factor Auth ─────────────────────────────────────────────────────────

  twoFactor: {
    getStatus(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/auth/2fa/status', undefined, headers);
    },
    setup(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/auth/2fa/setup', undefined, headers);
    },
    verify(code: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/auth/2fa/verify', { code }, headers);
    },
    disable(): Promise<void> {
      const headers = getAuthHeaders();
      return apiRequest<void>('DELETE', '/auth/2fa', undefined, headers);
    },
  },

  // ── Insurance ───────────────────────────────────────────────────────────────

  insurance: {
    listForProperty(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/insurance`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    verify(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/insurance/${id}/verify`, undefined, headers);
    },
    getExpiring(days?: number): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = buildQueryString({ days });
      return apiRequest<unknown>('GET', `/insurance/expiring${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Referrals ───────────────────────────────────────────────────────────────

  referrals: {
    list(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/referrals', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    create(email: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/referrals', { email }, headers);
    },
  },

  // ── Tax Documents ──────────────────────────────────────────────────────────

  taxDocuments: {
    getAnnualSummary(year: number): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/tax/annual-summary/${year}`, undefined, headers);
    },
    downloadPdf(year: number): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/tax/annual-summary/${year}/pdf`, undefined, headers);
    },
  },

  // ── Checklists ──────────────────────────────────────────────────────────────

  checklists: {
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/checklists`, data, headers);
    },
    list(propertyId: string, tenantId?: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = tenantId ? `?tenantId=${tenantId}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/checklists${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    get(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/checklists/${id}`, undefined, headers);
    },
    updateItem(itemId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/checklist-items/${itemId}`, data, headers);
    },
    complete(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/checklists/${id}/complete`, {}, headers);
    },
  },

  // ── Maintenance Chat ────────────────────────────────────────────────────────

  maintenanceChat: {
    send(requestId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/maintenance/${requestId}/messages`, data, headers);
    },
    list(requestId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/maintenance/${requestId}/messages`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Rent Splits ─────────────────────────────────────────────────────────────

  rentSplits: {
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/rent-splits`, data, headers);
    },
    get(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/rent-splits`, undefined, headers);
    },
    updateMember(memberId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/rent-split-members/${memberId}`, data, headers);
    },
    deactivate(splitId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('DELETE', `/rent-splits/${splitId}`, {}, headers);
    },
  },

  // ── Packages ────────────────────────────────────────────────────────────────

  packages: {
    log(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/packages`, data, headers);
    },
    list(propertyId: string, status?: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = status ? `?status=${status}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/packages${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    markPickedUp(packageId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/packages/${packageId}/pickup`, {}, headers);
    },
  },

  // ── Complaints ──────────────────────────────────────────────────────────────

  complaints: {
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/complaints`, data, headers);
    },
    list(propertyId: string, params?: Record<string, string>): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/complaints${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    get(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/complaints/${id}`, undefined, headers);
    },
    updateStatus(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/complaints/${id}/status`, data, headers);
    },
    addUpdate(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/complaints/${id}/updates`, data, headers);
    },
  },

  // ── Rewards ─────────────────────────────────────────────────────────────────

  rewards: {
    setup(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/rewards/setup`, data, headers);
    },
    get(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/rewards`, undefined, headers);
    },
    leaderboard(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/rewards/leaderboard`, undefined, headers);
    },
    getTenantRewards(propertyId?: string): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = propertyId ? `?propertyId=${propertyId}` : '';
      return apiRequest<unknown>('GET', `/tenant/rewards${qs}`, undefined, headers);
    },
    redeem(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/tenant/rewards/redeem', data, headers);
    },
    history(propertyId?: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = propertyId ? `?propertyId=${propertyId}` : '';
      return apiRequest<unknown>('GET', `/tenant/rewards/history${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Lease Renewals ──────────────────────────────────────────────────────────

  leaseRenewals: {
    create(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/lease-renewals', data, headers);
    },
    send(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/lease-renewals/${id}/send`, {}, headers);
    },
    respond(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/lease-renewals/${id}/respond`, data, headers);
    },
    list(propertyId: string, status?: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = status ? `?status=${status}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/lease-renewals${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    upcoming(daysAhead?: number): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = daysAhead ? `?daysAhead=${daysAhead}` : '';
      return apiRequest<unknown>('GET', `/lease-renewals/upcoming${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Vacancy Marketing ───────────────────────────────────────────────────────

  vacancyMarketing: {
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/vacancy-listings`, data, headers);
    },
    list(propertyId?: string, status?: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = buildQueryString({ propertyId, status });
      return apiRequest<unknown>('GET', `/vacancy-listings${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    get(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/vacancy-listings/${id}`, undefined, headers);
    },
    update(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/vacancy-listings/${id}`, data, headers);
    },
    publish(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/vacancy-listings/${id}/publish`, data, headers);
    },
    markFilled(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/vacancy-listings/${id}/fill`, {}, headers);
    },
  },

  // ── Owner Digest ────────────────────────────────────────────────────────────

  ownerDigest: {
    getPreferences(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/digest-preferences', undefined, headers);
    },
    updatePreferences(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', '/owner/digest-preferences', data, headers);
    },
    preview(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/digest-preview', undefined, headers);
    },
  },

  // ── Bulk Operations ─────────────────────────────────────────────────────────

  bulkOps: {
    lateFeeRules(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/bulk/late-fee-rules', data, headers);
    },
    rentIncreases(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/bulk/rent-increases', data, headers);
    },
    screeningConfig(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/bulk/screening-config', data, headers);
    },
    announcements(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/bulk/announcements', data, headers);
    },
  },

  // ── Turnover Costs ──────────────────────────────────────────────────────────

  turnoverCosts: {
    record(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/turnover-costs`, data, headers);
    },
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/turnover-costs`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    estimate(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/turnover-estimate`, undefined, headers);
    },
    portfolioStats(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/turnover-stats', undefined, headers);
    },
  },

  // ── Smart Pricing ───────────────────────────────────────────────────────────

  smartPricing: {
    suggestedRent(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/suggested-rent`, undefined, headers);
    },
    comparables(propertyId: string, limit?: number): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = limit ? `?limit=${limit}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/comparables${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    rentTrends(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/rent-trends`, undefined, headers);
    },
  },

  // ── Scheduled Maintenance ───────────────────────────────────────────────────

  scheduledMaintenance: {
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/scheduled-maintenance`, data, headers);
    },
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/scheduled-maintenance`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    update(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/scheduled-maintenance/${id}`, data, headers);
    },
    delete(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('DELETE', `/scheduled-maintenance/${id}`, {}, headers);
    },
    process(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/scheduled-maintenance/${id}/process`, {}, headers);
    },
  },

  // ── Community Events ────────────────────────────────────────────────────────

  communityEvents: {
    create(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/events`, data, headers);
    },
    list(propertyId: string, upcoming?: boolean): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = upcoming ? '?upcoming=true' : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/events${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    get(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/events/${id}`, undefined, headers);
    },
    rsvp(eventId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/events/${eventId}/rsvp`, data, headers);
    },
    delete(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('DELETE', `/events/${id}`, {}, headers);
    },
  },

  // ── SMS ─────────────────────────────────────────────────────────────────────

  sms: {
    getPreferences(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/sms/preferences', undefined, headers);
    },
    updatePreferences(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', '/sms/preferences', data, headers);
    },
    requestVerification(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/sms/verify-request', data, headers);
    },
    verify(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/sms/verify', data, headers);
    },
  },

  // ── Move Out ────────────────────────────────────────────────────────────────

  moveOut: {
    submit(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/move-out', data, headers);
    },
    list(propertyId: string, status?: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = status ? `?status=${status}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/move-outs${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    getTenantMoveOut(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/tenant/move-out', undefined, headers);
    },
    approve(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/move-outs/${id}/approve`, data, headers);
    },
    scheduleInspection(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/move-outs/${id}/schedule-inspection`, data, headers);
    },
    completeInspection(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/move-outs/${id}/complete-inspection`, data, headers);
    },
    processDeposit(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/move-outs/${id}/process-deposit`, {}, headers);
    },
    complete(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/move-outs/${id}/complete`, data, headers);
    },
    cancel(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/move-outs/${id}/cancel`, {}, headers);
    },
  },

  // ── Equipment ───────────────────────────────────────────────────────────────

  equipment: {
    add(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/equipment`, data, headers);
    },
    list(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/equipment`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    update(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/equipment/${id}`, data, headers);
    },
    logService(id: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/equipment/${id}/service-log`, data, headers);
    },
    getLog(id: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/equipment/${id}/log`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    atRisk(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/equipment/at-risk`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    health(id: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/equipment/${id}/health`, undefined, headers);
    },
    forecast(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/maintenance-forecast`, undefined, headers);
    },
  },

  // ── Satisfaction ────────────────────────────────────────────────────────────

  satisfaction: {
    property(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/satisfaction`, undefined, headers);
    },
    portfolio(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/satisfaction', undefined, headers);
    },
    correlation(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/satisfaction/correlation', undefined, headers);
    },
    alerts(threshold?: number): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = threshold !== undefined ? `?threshold=${threshold}` : '';
      return apiRequest<unknown>('GET', `/owner/satisfaction/alerts${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Cash Flow ───────────────────────────────────────────────────────────────

  cashFlow: {
    forecast(monthsAhead?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = monthsAhead ? `?monthsAhead=${monthsAhead}` : '';
      return apiRequest<unknown>('GET', `/owner/cash-flow/forecast${qs}`, undefined, headers);
    },
    propertyForecast(propertyId: string, monthsAhead?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = monthsAhead ? `?monthsAhead=${monthsAhead}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/cash-flow/forecast${qs}`, undefined, headers);
    },
    scenario(vacancyRate: number): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/owner/cash-flow/scenario?vacancyRate=${vacancyRate}`, undefined, headers);
    },
    historical(monthsBack?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = monthsBack ? `?monthsBack=${monthsBack}` : '';
      return apiRequest<unknown>('GET', `/owner/cash-flow/historical${qs}`, undefined, headers);
    },
  },

  // ── Performance ─────────────────────────────────────────────────────────────

  performance: {
    metrics(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/metrics`, undefined, headers);
    },
    portfolio(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/portfolio-comparison', undefined, headers);
    },
    benchmark(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/benchmark`, undefined, headers);
    },
    trends(propertyId: string, monthsBack?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = monthsBack ? `?monthsBack=${monthsBack}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/performance-trends${qs}`, undefined, headers);
    },
  },

  // ── Credit Reporting ──────────────────────────────────────────────────────

  creditReporting: {
    status(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/tenant/credit-reporting/status', undefined, headers);
    },
    enroll(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/tenant/credit-reporting/enroll', data, headers);
    },
    unenroll(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/tenant/credit-reporting/unenroll', {}, headers);
    },
    history(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/tenant/credit-reporting/history', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Pet Screening ─────────────────────────────────────────────────────────

  petScreening: {
    getPolicy(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/pet-policy`, undefined, headers);
    },
    upsertPolicy(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/properties/${propertyId}/pet-policy`, data, headers);
    },
    getPropertyPets(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/pets`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── Utility Billing ───────────────────────────────────────────────────────

  utilityBilling: {
    getAccounts(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/utility-accounts`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    createAccount(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/utility-accounts`, data, headers);
    },
    recordBill(accountId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/utility-accounts/${accountId}/bills`, data, headers);
    },
    allocateBill(billId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/utility-bills/${billId}/allocate`, {}, headers);
    },
  },

  // ── Trust Accounting ──────────────────────────────────────────────────────

  trustAccounting: {
    getAccounts(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/trust-accounts', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    createAccount(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/owner/trust-accounts', data, headers);
    },
    getTransactions(accountId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/trust-accounts/${accountId}/transactions`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    recordTransaction(accountId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/trust-accounts/${accountId}/transactions`, data, headers);
    },
    reconcile(accountId: string, statementBalance: number): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/trust-accounts/${accountId}/reconcile`, { statementBalance }, headers);
    },
    distribute(accountId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/trust-accounts/${accountId}/distribute`, data, headers);
    },
  },

  // ── 1099 Filing ───────────────────────────────────────────────────────────

  form1099: {
    getForms(year?: number): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = year ? `?year=${year}` : '';
      return apiRequest<unknown>('GET', `/owner/tax-forms/1099${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    generateForms(year: number): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/owner/tax-forms/1099/generate', { year }, headers);
    },
    fileForm(formId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/tax-forms/1099/${formId}/file`, {}, headers);
    },
    getPdfUrl(formId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/tax-forms/1099/${formId}/pdf`, undefined, headers);
    },
    saveW9(vendorId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/vendors/${vendorId}/w9`, data, headers);
    },
  },

  // ── Parts Inventory ───────────────────────────────────────────────────────

  inventory: {
    getItems(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/inventory`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    addItem(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/inventory`, data, headers);
    },
    updateItem(itemId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/inventory/${itemId}`, data, headers);
    },
    recordUsage(itemId: string, quantity: number, requestId?: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/inventory/${itemId}/use`, { quantity, requestId }, headers);
    },
    restock(itemId: string, quantity: number): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/inventory/${itemId}/restock`, { quantity }, headers);
    },
    lowStockAlerts(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/inventory/low-stock`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    /** Alias used by inventory-manager component (no propertyId filter). */
    list(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/inventory', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
     
    add(item: any): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/inventory', item, headers);
    },
  },

  // ── AI Leasing Agent ──────────────────────────────────────────────────────

  leasingAgent: {
    chat(sessionId: string, message: string, propertyId?: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/leasing-agent/chat', { sessionId, message, propertyId }, headers);
    },
    getSession(sessionId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/leasing-agent/sessions/${sessionId}`, undefined, headers);
    },
    getPropertySessions(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/leasing-sessions`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    handoff(sessionId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/leasing-agent/sessions/${sessionId}/handoff`, {}, headers);
    },
  },

  // ── AI Maintenance Triage ─────────────────────────────────────────────────

  aiTriage: {
    triage(requestId: string, photoUrls: string[]): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/maintenance/${requestId}/triage`, { photoUrls }, headers);
    },
    getResult(requestId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/maintenance/${requestId}/triage`, undefined, headers);
    },
    batchTriage(requestIds: string[]): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/maintenance/batch-triage', { requestIds }, headers);
    },
  },

  // ── Compliance Engine ─────────────────────────────────────────────────────

  compliance: {
    getPropertyCompliance(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/compliance`, undefined, headers);
    },
    runCheck(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/compliance/check`, {}, headers);
    },
    getPortfolioSummary(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/compliance/summary', undefined, headers);
    },
    getRules(state?: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = state ? `?state=${state}` : '';
      return apiRequest<unknown>('GET', `/compliance/rules${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    resolveCheck(checkId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/compliance/checks/${checkId}/resolve`, data, headers);
    },
    listProperties(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/compliance/properties', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    listIssues(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/compliance/issues', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    resolveIssue(issueId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/compliance/issues/${issueId}/resolve`, {}, headers);
    },
  },

  // ── ESG / Sustainability ──────────────────────────────────────────────────

  esg: {
    getPropertyEsg(propertyId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/esg`, undefined, headers);
    },
    getSummary(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/esg/summary', undefined, headers);
    },
    listProperties(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/esg/properties', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    recordMetrics(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/esg/metrics`, data, headers);
    },
    getPortfolioReport(year?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = year ? `?year=${year}` : '';
      return apiRequest<unknown>('GET', `/owner/esg/report${qs}`, undefined, headers);
    },
    updateGoals(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/properties/${propertyId}/esg/goals`, data, headers);
    },
  },

  // ── Lead Scoring ──────────────────────────────────────────────────────────

  leadScoring: {
    getLeads(filters?: Record<string, string>): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = filters ? '?' + new URLSearchParams(filters).toString() : '';
      return apiRequest<unknown>('GET', `/owner/leads${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    createLead(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/owner/leads', data, headers);
    },
    getLead(leadId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/owner/leads/${leadId}`, undefined, headers);
    },
    updateLead(leadId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/owner/leads/${leadId}`, data, headers);
    },
    logActivity(leadId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/owner/leads/${leadId}/activity`, data, headers);
    },
    scoreLead(leadId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/owner/leads/${leadId}/score`, {}, headers);
    },
    getFunnelAnalytics(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/owner/leads/funnel/analytics', undefined, headers);
    },
  },

  // ── Tours ─────────────────────────────────────────────────────────────────

  tours: {
    getPropertyTours(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/tours`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    bookTour(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/tours`, data, headers);
    },
    getTour(tourId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/tours/${tourId}`, undefined, headers);
    },
    updateStatus(tourId: string, status: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/tours/${tourId}/status`, { status }, headers);
    },
    getShowingFeedback(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/tours/feedback`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    getSmartLocks(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/smart-locks`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
  },

  // ── IoT / Smart Home ─────────────────────────────────────────────────────

  iot: {
    getDevices(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/iot/devices`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    registerDevice(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/iot/devices`, data, headers);
    },
    getReadings(deviceId: string, limit?: number): Promise<unknown[]> {
      const headers = getAuthHeaders();
      const qs = limit ? `?limit=${limit}` : '';
      return apiRequest<unknown>('GET', `/iot/devices/${deviceId}/readings${qs}`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    getAlerts(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/iot/alerts`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    resolveAlert(alertId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/iot/alerts/${alertId}/resolve`, {}, headers);
    },
  },

  // ── Investor Portal ───────────────────────────────────────────────────────

  investorPortal: {
    getDeals(): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/investments/deals', undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    createDeal(data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', '/investments/deals', data, headers);
    },
    getDeal(dealId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/investments/deals/${dealId}`, undefined, headers);
    },
    addInvestor(dealId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/investments/deals/${dealId}/investors`, data, headers);
    },
    createCapitalCall(dealId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/investments/deals/${dealId}/capital-calls`, data, headers);
    },
    createDistribution(dealId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/investments/deals/${dealId}/distributions`, data, headers);
    },
    getMyPortfolio(): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', '/investments/my-portfolio', undefined, headers);
    },
  },

  // ── Budget vs Actual ──────────────────────────────────────────────────────

  budget: {
    getPropertyBudget(propertyId: string, year?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = year ? `?year=${year}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/budget${qs}`, undefined, headers);
    },
    createBudget(propertyId: string, year: number): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/budget`, { year }, headers);
    },
    upsertLineItem(budgetId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/budgets/${budgetId}/line-items`, data, headers);
    },
    getSummary(propertyId: string, year?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = year ? `?year=${year}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/budget/summary${qs}`, undefined, headers);
    },
    getPortfolioSummary(year?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = year ? `?year=${year}` : '';
      return apiRequest<unknown>('GET', `/owner/budget/portfolio-summary${qs}`, undefined, headers);
    },
  },

  // ── Tenant Inspections (owner view) ──────────────────────────────────────

  tenantInspections: {
    getPropertyInspections(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/tenant-inspections`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    reviewInspection(inspectionId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/tenant/inspections/${inspectionId}/review`, data, headers);
    },
  },

  // ── CAM Reconciliation ────────────────────────────────────────────────────

  cam: {
    getPools(propertyId: string): Promise<unknown[]> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('GET', `/properties/${propertyId}/cam-pools`, undefined, headers)
        .then((r) => unwrapDataArray(r));
    },
    createPool(propertyId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/properties/${propertyId}/cam-pools`, data, headers);
    },
    updatePool(poolId: string, data: Record<string, unknown>): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('PUT', `/cam-pools/${poolId}`, data, headers);
    },
    reconcile(poolId: string): Promise<unknown> {
      const headers = getAuthHeaders();
      return apiRequest<unknown>('POST', `/cam-pools/${poolId}/reconcile`, {}, headers);
    },
    getSummary(propertyId: string, year?: number): Promise<unknown> {
      const headers = getAuthHeaders();
      const qs = year ? `?year=${year}` : '';
      return apiRequest<unknown>('GET', `/properties/${propertyId}/cam-summary${qs}`, undefined, headers);
    },
  },

  leads: leadApi,

  // ─── Stub namespaces for feature-flagged APIs not yet wired to backend ───
  // These stubs let components use optional chaining (featureApi.tax?.list1099s?.())
  // without casting to `any`. Replace stubs with real implementations as backend
  // endpoints become available.
  tax: undefined as undefined | {
    list1099s: (year: number) => Promise<unknown[]>;
    generate1099s: (year: number) => Promise<void>;
    file1099: (formId: string) => Promise<void>;
  },
  trust: undefined as undefined | {
    listAccounts: () => Promise<unknown[]>;
    listTransactions: () => Promise<unknown[]>;
    listDistributions: () => Promise<unknown[]>;
     
    recordTransaction: (txn: any) => Promise<void>;
  },
  utilities: undefined as undefined | {
    listAccounts: () => Promise<unknown[]>;
    listBills: () => Promise<unknown[]>;
    addAccount: (account: Record<string, unknown>) => Promise<void>;
    allocateBill: (billId: string) => Promise<void>;
  },
  pets: undefined as undefined | {
    getPolicy: () => Promise<unknown>;
    list: () => Promise<unknown[]>;
     
    updatePolicy: (draft: any) => Promise<void>;
  },
  investor: undefined as undefined | {
    listDeals: () => Promise<unknown[]>;
     
    createDeal: (deal: any) => Promise<void>;
     
    addInvestor: (inv: any) => Promise<void>;
     
    createCapitalCall: (call: any) => Promise<void>;
     
    createDistribution: (dist: any) => Promise<void>;
  },
};

// Suppress unused import warning for rawAuthRequest if not called directly
void rawAuthRequest;
