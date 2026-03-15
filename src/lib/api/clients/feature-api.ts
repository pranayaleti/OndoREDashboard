/**
 * Feature-level API namespaces.
 * Groups domain-specific API calls under nested namespaces for ergonomic access.
 *
 * Usage:
 *   import { featureApi } from '@/lib/api';
 *   featureApi.accounting.getProfitLoss(...)
 *   featureApi.stripe.createPaymentIntent(...)
 */

import { apiRequest, getAuthHeaders } from "../http";
import { tokenManager } from "./token-manager";
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

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:3000/api";

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
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: MessageParticipant[];
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface MessagePayload {
  threadId?: string;
  recipientId: string;
  body: string;
  attachments?: string[];
  channel: CommunicationChannel;
}

export interface MessageRecord extends MessagePayload {
  id: string;
  senderId: string;
  sentAt: string;
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
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest_control' | 'cleaning' | 'other';
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
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest_control' | 'cleaning' | 'other';
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
 * Make a raw fetch with auth token and JSON parsing.
 * Used only for maintenance photo upload which needs multipart form.
 */
async function rawAuthRequest<T>(
  method: string,
  endpoint: string,
  body?: BodyInit,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const token = tokenManager.getToken();
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
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const text = await response.text();

  let data: Record<string, unknown>;
  if (isJson && text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { message: text };
    }
  } else {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : `HTTP ${response.status}`);
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
    listRequests(params?: Record<string, string | number>): Promise<ScreeningRequestPayload[]> {
      const headers = getAuthHeaders();
      return apiRequest<ScreeningRequestPayload[]>(
        'GET',
        `/screening/requests${buildQueryString(params)}`,
        undefined,
        headers,
      );
    },
    createRequest(payload: CreateScreeningRequestInput): Promise<ScreeningRequestPayload> {
      // ROADMAP: Integrate actual SmartMove/Checkr provider IDs once backend wiring is ready (Q3 2026).
      const headers = getAuthHeaders();
      return apiRequest<ScreeningRequestPayload>('POST', '/screening/requests', payload, headers);
    },
    sendScreeningLink(
      requestId: string,
      channel: CommunicationChannel = 'email',
    ): Promise<{ message: string }> {
      const headers = getAuthHeaders();
      return apiRequest<{ message: string }>(
        'POST',
        `/screening/requests/${requestId}/send-link`,
        { channel },
        headers,
      );
    },
    fetchReportMetadata(requestId: string): Promise<ScreeningReportMetadata> {
      const headers = getAuthHeaders();
      return apiRequest<ScreeningReportMetadata>(
        'GET',
        `/screening/requests/${requestId}/report`,
        undefined,
        headers,
      );
    },
  },

  rentPayments: {
    getSchedule(propertyId?: string): Promise<RentSchedule[]> {
      const headers = getAuthHeaders();
      return apiRequest<RentSchedule[]>(
        'GET',
        `/rent/schedules${buildQueryString(propertyId ? { propertyId } : undefined)}`,
        undefined,
        headers,
      );
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
    listPayments(params?: { propertyId?: string; tenantId?: string }): Promise<RentPayment[]> {
      const headers = getAuthHeaders();
      return apiRequest<RentPayment[]>(
        'GET',
        `/rent/payments${buildQueryString(params)}`,
        undefined,
        headers,
      );
    },
    listReceipts(tenantId?: string): Promise<RentReceipt[]> {
      const headers = getAuthHeaders();
      return apiRequest<RentReceipt[]>(
        'GET',
        `/rent/receipts${buildQueryString(tenantId ? { tenantId } : undefined)}`,
        undefined,
        headers,
      );
    },
    getLandlordStatements(ownerId?: string): Promise<LandlordStatement[]> {
      const headers = getAuthHeaders();
      return apiRequest<LandlordStatement[]>(
        'GET',
        `/rent/statements${buildQueryString(ownerId ? { ownerId } : undefined)}`,
        undefined,
        headers,
      );
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
    listLeases(params?: {
      propertyId?: string;
      tenantId?: string;
      status?: LeaseStatus;
    }): Promise<LeaseDocument[]> {
      const headers = getAuthHeaders();
      return apiRequest<LeaseDocument[]>(
        'GET',
        `/leases/documents${buildQueryString(params)}`,
        undefined,
        headers,
      );
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
      return MaintenanceRequestSchema.parse(raw) as MaintenanceRequest;
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
      return MaintenanceRequestSchema.parse(raw) as MaintenanceRequest;
    },
    async updateMaintenanceRequest(
      id: string,
      data: UpdateMaintenanceRequestRequest,
    ): Promise<MaintenanceRequest> {
      const headers = getAuthHeaders();
      const raw = await apiRequest<unknown>('PUT', `/maintenance/${id}`, data, headers);
      return MaintenanceRequestSchema.parse(raw) as MaintenanceRequest;
    },
  },

  documents: {
    listCategories(): Promise<DocumentCategory[]> {
      const headers = getAuthHeaders();
      return apiRequest<DocumentCategory[]>('GET', '/documents/categories', undefined, headers);
    },
    listDocuments(params?: {
      propertyId?: string;
      tenantId?: string;
      ownerId?: string;
    }): Promise<DocumentRecord[]> {
      const headers = getAuthHeaders();
      return apiRequest<DocumentRecord[]>(
        'GET',
        `/documents${buildQueryString(params)}`,
        undefined,
        headers,
      );
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
    listThreads(): Promise<MessageThread[]> {
      const headers = getAuthHeaders();
      return apiRequest<MessageThread[]>('GET', '/communication/threads', undefined, headers);
    },
    listMessages(threadId: string): Promise<MessageRecord[]> {
      const headers = getAuthHeaders();
      return apiRequest<MessageRecord[]>(
        'GET',
        `/communication/threads/${threadId}/messages`,
        undefined,
        headers,
      );
    },
    sendMessage(payload: MessagePayload): Promise<MessageRecord> {
      const headers = getAuthHeaders();
      return apiRequest<MessageRecord>('POST', '/communication/messages', payload, headers);
    },
    updatePreferences(preferences: NotificationPreference[]): Promise<NotificationPreference[]> {
      const headers = getAuthHeaders();
      return apiRequest<NotificationPreference[]>(
        'PUT',
        '/communication/preferences',
        preferences,
        headers,
      );
    },
    triggerNotification(payload: {
      template: string;
      channel: CommunicationChannel;
      targetId: string;
    }): Promise<{ message: string }> {
      // ROADMAP: Integrate SendGrid/Resend + Twilio credentials here (Q2 2026 - notifications).
      const headers = getAuthHeaders();
      return apiRequest<{ message: string }>('POST', '/communication/notify', payload, headers);
    },
  },

  accounting: {
    listLedgerEntries(params?: {
      propertyId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<LedgerEntry[]> {
      const headers = getAuthHeaders();
      return apiRequest<LedgerEntry[]>(
        'GET',
        `/accounting/ledger${buildQueryString(params)}`,
        undefined,
        headers,
      );
    },
    createLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
      const headers = getAuthHeaders();
      return apiRequest<LedgerEntry>('POST', '/accounting/ledger', entry, headers);
    },
    recordExpense(
      entry: Omit<LedgerEntry, 'id' | 'type'> & { type?: LedgerEntry['type'] },
    ): Promise<LedgerEntry> {
      const headers = getAuthHeaders();
      return apiRequest<LedgerEntry>(
        'POST',
        '/accounting/expenses',
        { ...entry, type: entry.type ?? 'expense' },
        headers,
      );
    },
    getProfitLoss(params?: {
      propertyId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<ProfitLossSummary> {
      const headers = getAuthHeaders();
      return apiRequest<ProfitLossSummary>(
        'GET',
        `/accounting/profit-loss${buildQueryString(params)}`,
        undefined,
        headers,
      );
    },
    exportLedger(payload: LedgerExportRequest): Promise<{ downloadUrl: string }> {
      const headers = getAuthHeaders();
      return apiRequest<{ downloadUrl: string }>('POST', '/accounting/export', payload, headers);
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
};

// Suppress unused import warning for rawAuthRequest if not called directly
void rawAuthRequest;
