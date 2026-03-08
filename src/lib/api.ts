// API Configuration
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string | undefined) || 'http://localhost:3000/api';
const TENANT_SCREENING_API_BASE_URL =
  (import.meta.env?.VITE_TENANT_SCREENING_API_BASE_URL as string | undefined) || API_BASE_URL;

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "super_admin" | "admin" | "manager" | "owner" | "tenant" | "maintenance";
  phone?: string;
  address?: string;
  profilePicture?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface InviteRequest {
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'owner' | 'tenant' | 'maintenance';
}

export interface InviteResponse {
  message: string;
  invitationId: string;
  token: string;
  expiresAt: string;
  inviteUrl: string;
}

export interface InvitationDetails {
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'owner' | 'tenant' | 'maintenance';
  expiresAt: string;
}

export interface SignupRequest {
  token: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  password: string;
}

export interface SignupResponse {
  message: string;
  token: string;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface PortfolioStats {
  propertiesOwned: number;
  activeTenants: number;
  portfolioValue: number;
  formattedPortfolioValue: string;
}

export interface ManagerPortfolioStats {
  propertiesManaged: number;
  totalUnits: number;
  activeTenants: number;
  monthlyRevenue: number;
  formattedMonthlyRevenue: string;
  occupancyRate: number;
}

export interface InvitedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'owner' | 'tenant';
  createdAt: string;
  invitedBy: string;
  propertyCount: number;
  isActive: boolean;
}

// Property Types
export interface PropertyOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PropertyManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface PropertyTenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

// Maintenance Request interfaces
export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: "plumbing" | "electrical" | "hvac" | "appliance" | "structural" | "pest_control" | "cleaning" | "other";
  priority: "low" | "medium" | "high" | "emergency";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  propertyId: string;
  tenantId: string;
  managerNotes?: string; // Manager's response/notes
  assignedTo?: string; // Technician name
  createdAt: string;
  updatedAt: string;
  // Optional fields that may exist in some views
  dateScheduled?: string;
  dateCompleted?: string;
  photos?: string[];
  updates?: string[];
  // Enhanced fields for manager view
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
  category: "plumbing" | "electrical" | "hvac" | "appliance" | "structural" | "pest_control" | "cleaning" | "other";
  priority?: "low" | "medium" | "high" | "emergency";
  photos?: string[];
}

export interface UpdateMaintenanceRequestRequest {
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  assignedTo?: string;
  managerNotes?: string;
}

export interface PublicPropertyOwner {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface PublicPropertyManager {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface LeadSubmissionRequest {
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  message?: string;
}

export interface LeadSubmissionResponse {
  message: string;
  leadId: string;
}

export interface Lead {
  id: string;
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  message?: string;
  // Rental details
  moveInDate?: string;
  monthlyBudget?: string;
  occupants?: number;
  hasPets?: boolean;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source: string;
  createdAt: string;
  updatedAt: string;
  // Property information
  propertyTitle: string;
  propertyType: string;
  propertyAddress: string;
  propertyCity: string;
  // Owner information
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerEmail?: string;
}

export type TenantScreeningStatus = 'approved' | 'in_review' | 'flagged' | 'pending';

export interface TenantScreeningSummary {
  timeframe: string;
  totalApplications: number;
  approvedCount: number;
  flaggedCount: number;
  fraudPrevented: number;
  averageScore: number;
  verificationRate: number;
  topSignals: Array<{ label: string; value: string }>;
}

export interface TenantScreeningApplicant {
  id: string;
  applicantName: string;
  propertyName?: string;
  score: number;
  status: TenantScreeningStatus;
  submittedAt: string;
  verifiedIds: number;
  fraudFlags?: string[];
  progress: number;
  decisionTimeline?: string;
  rentAmount?: number;
  ownerName?: string;
  managerName?: string;
}

export interface TenantScreeningReport extends TenantScreeningApplicant {
  email?: string;
  phone?: string;
  address?: string;
  history: Array<{ label: string; value: string }>;
  documents: Array<{ name: string; status: 'verified' | 'pending' | 'missing' }>;
  riskSummary?: string;
  notes?: string;
}

export interface TenantScreeningSummaryParams {
  role?: User['role'];
  ownerId?: string;
  managerId?: string;
  propertyId?: string;
  tenantId?: string;
  timeframe?: '7d' | '30d' | '90d';
}

export interface TenantScreeningApplicantParams extends TenantScreeningSummaryParams {
  limit?: number;
  status?: TenantScreeningStatus;
}

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

export interface OwnerOnboardingRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  portfolioSize?: string;
  goal?: string;
  referredBy?: string;
}

export interface OwnerOnboardingResponse {
  message: string;
  status: 'received' | 'in_review';
  nextSteps?: string[];
}

export interface Property {
  id: string;
  ownerId: string;
  tenantId?: string;
  title: string;
  type: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  
  // Property Details
  price?: number; // Monthly rent price
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number; // Square footage
  
  // Contact & Business Info
  phone?: string;
  website?: string;
  
  // Property Management Details
  leaseTerms?: string;
  fees?: string; // Management fees, leasing fees, etc.
  availability?: string; // e.g., "Immediate", "Available Jan 1"
  
  // Rating & Reviews
  rating?: number; // e.g., 4.85
  reviewCount?: number;
  
  // Amenities and Services (arrays)
  amenities?: string[]; // Array of amenity keys
  specialties?: string[];
  services?: string[];
  valueRanges?: string[];
  
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  photos?: PropertyPhoto[];
  owner?: PropertyOwner; // Only available for managers
  manager?: PropertyManager; // Property manager contact details
  tenant?: PropertyTenant; // Tenant information if property has a tenant
}

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  url: string;
  caption?: string;
  orderIndex: number;
  createdAt: string;
}

export interface PublicProperty {
  id: string;
  publicId: string;
  title: string;
  type: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  zipcode?: string;
  description?: string;
  
  // Property Details
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  phone?: string;
  website?: string;
  leaseTerms?: string;
  fees?: string;
  availability?: string;
  rating?: number;
  reviewCount?: number;
  
  // Arrays
  amenities: string[];
  specialties: string[];
  services: string[];
  valueRanges: string[];
  
  // Contact details (without IDs)
  owner: PublicPropertyOwner;
  manager: PublicPropertyManager;
  
  // Photos
  photos: PropertyPhoto[];
  
  // Status and timestamps
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  property: string;
  unit: string;
  rent: number;
  leaseStart: string;
  leaseEnd: string;
  paymentStatus: 'current' | 'overdue' | 'pending';
  // Additional details
  email: string;
  phone?: string;
  propertyType: string;
  propertyAddress: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  propertyStatus: string;
  tenantCreatedAt: string;
  propertyCreatedAt: string;
}

export interface OwnerTenantsSummary {
  totalTenants: number;
  occupiedUnits: string;
  occupancyRate: string;
  avgRent: string;
}

export interface OwnerTenantsResponse {
  summary: OwnerTenantsSummary;
  tenants: Tenant[];
}

export interface PropertyAmenity {
  amenityId: string;
  value?: string;
  key: string;
  label: string;
}

export interface Amenity {
  id: string;
  key: string;
  label: string;
}

export interface CreatePropertyRequest {
  title: string;
  type: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  amenityIds?: string[];
}

export type RentPaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
export type RentPaymentMethod = 'ach' | 'card';

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

export type LeaseStatus = 'draft' | 'pending_signature' | 'executed' | 'active' | 'expired';

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

export interface DocumentCategory {
  id: string;
  label: string;
  description?: string;
  slug: string;
  roles: Array<User['role']>;
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

export type CommunicationChannel = 'in_app' | 'email' | 'sms';

export interface MessageParticipant {
  userId: string;
  role: User['role'];
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

export type LedgerEntryType = 'rent' | 'late_fee' | 'expense' | 'credit' | 'adjustment';

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

export interface AdminMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface RoleAssignment {
  id: string;
  userId: string;
  role: User['role'];
  status: 'pending' | 'approved' | 'revoked';
  createdAt: string;
}

// Property reminders (home care: HVAC, air filter, winterize lawn, etc.)
export interface PropertyReminderItem {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  reminderType: string;
  title: string;
  description: string;
  nextDue: string;
  overdue: boolean;
  lastCompletedAt: string | null;
}

// At-risk tenants (AI/ML early intervention)
export interface AtRiskTenant {
  tenantId: string;
  propertyId: string | null;
  score: number;
  band: 'low' | 'medium' | 'high';
  features: Record<string, unknown>;
  scoredAt: string;
  tenantFirstName: string | null;
  tenantLastName: string | null;
  tenantEmail: string | null;
  tenantPhone: string | null;
  propertyTitle: string | null;
  propertyAddress: string | null;
}

export interface CreateRiskInterventionRequest {
  tenantId: string;
  interventionType: 'payment_plan' | 'reminder' | 'assistance_referral' | 'outreach' | 'early_renewal';
  propertyId?: string | null;
  notes?: string | null;
}

export type InterventionType = 'payment_plan' | 'reminder' | 'assistance_referral' | 'outreach' | 'early_renewal';

export interface RiskAnalytics {
  distribution: { low: number; medium: number; high: number };
  totalScored: number;
  atRiskCount: number;
  trend: Array<{ date: string; avgScore: number; count: number }>;
  interventionsByType: Record<string, { total: number; completed: number; avgRating: number | null }>;
  modelVersions: Record<string, number>;
  windowDays: number;
}

export interface TenantRiskHistory {
  tenantId: string;
  scoreHistory: Array<{
    id: string;
    score: number;
    band: 'low' | 'medium' | 'high';
    modelVersion: string;
    features: Record<string, unknown>;
    scoredAt: string;
  }>;
  interventions: Array<{
    id: string;
    type: InterventionType;
    status: string;
    notes: string | null;
    outcome: string | null;
    effectivenessRating: number | null;
    createdAt: string;
    resolvedAt: string | null;
  }>;
  recommendations: Array<{
    id: string;
    recommendedType: InterventionType;
    reasoning: string;
    confidence: number;
    status: string;
    createdAt: string;
  }>;
}

export interface RiskRecommendation {
  id: string;
  tenantId: string;
  propertyId: string | null;
  recommendedType: InterventionType;
  reasoning: string;
  confidence: number;
  status: 'pending' | 'approved' | 'dismissed';
  createdAt: string;
  tenantName: string | null;
  tenantEmail: string | null;
}

export interface InlineRecommendation {
  tenantId: string;
  recommended_type: InterventionType;
  reasoning: string;
  confidence: number;
  currentScore: number;
  currentBand: 'low' | 'medium' | 'high';
}

// ─── Stripe / Payment Types ───────────────────────────────────────

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

// API Error Class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]> | Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base API function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  // Add auth token if available
  const token = tokenManager.getToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Check if response has content and is JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data: Record<string, unknown>;
    if (isJson) {
      try {
        const text = await response.text();
        data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        throw new ApiError('Invalid JSON response', response.status);
      }
    } else {
      const text = await response.text();
      data = { message: text || 'An error occurred' };
    }

    if (!response.ok) {
      throw new ApiError(
        typeof data.message === 'string' ? data.message : 'An error occurred',
        response.status,
        data.errors as Record<string, unknown> | undefined
      );
    }

    return data as unknown as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out after 30 seconds', 0);
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error: Unable to reach server', 0);
    }
    throw new ApiError('Network error', 0);
  }
}

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

async function tenantScreeningRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!TENANT_SCREENING_API_BASE_URL || TENANT_SCREENING_API_BASE_URL === API_BASE_URL) {
    return apiRequest<T>(normalizedEndpoint, options);
  }

  const url = `${TENANT_SCREENING_API_BASE_URL}${normalizedEndpoint}`;
  const headers = new Headers(options.headers as HeadersInit);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenManager.getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const { headers: _headers, ...restOptions } = options;
  void _headers
  const config: RequestInit = {
    ...restOptions,
    headers,
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data: Record<string, unknown>;
    if (isJson) {
      const text = await response.text();
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } else {
      const text = await response.text();
      data = { message: text || 'An error occurred contacting tenant screening service' };
    }

    if (!response.ok) {
      throw new ApiError(
        typeof data.message === 'string' && data.message.trim()
          ? data.message
          : `Tenant screening request failed (${response.status})`,
        response.status,
        data.errors as Record<string, unknown> | undefined
      );
    }

    return data as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error contacting tenant screening service', 0);
  }
}

// Auth API functions
export const authApi = {
  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Get current user
  async me(): Promise<User> {
    return apiRequest<User>('/auth/me');
  },

  // Send invitation
  async invite(inviteData: InviteRequest): Promise<InviteResponse> {
    return apiRequest<InviteResponse>('/auth/invite', {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  },

  // Get invitation details by token
  async getInvitation(token: string): Promise<InvitationDetails> {
    return apiRequest<InvitationDetails>(`/auth/invitation/${token}`);
  },

  // Complete signup with invitation token
  async signup(signupData: SignupRequest): Promise<SignupResponse> {
    return apiRequest<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  },

  // Change password for authenticated user
  async changePassword(passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return apiRequest<ChangePasswordResponse>('/password/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },

  // Update user profile
  async updateProfile(profileData: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return apiRequest<UpdateProfileResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Generate presigned URL for profile picture upload
  async generateProfilePictureUploadUrl(fileName: string, contentType: string): Promise<{
    presignedUrl: string;
    key: string;
    publicUrl: string;
    expiresIn: number;
  }> {
    return apiRequest('/auth/profile-picture/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        contentType,
      }),
    });
  },

  // Get portfolio statistics for owners
  async getPortfolioStats(): Promise<PortfolioStats> {
    return apiRequest<PortfolioStats>('/auth/portfolio-stats');
  },

  // Get users invited by the current manager
  async getInvitedUsers(): Promise<InvitedUser[]> {
    const result = await apiRequest<InvitedUser[]>('/auth/invited-users');
    return Array.isArray(result) ? result : [];
  },

  // Update user status (enable/disable)
  async updateUserStatus(userId: string, isActive: boolean): Promise<{ message: string; user: User }> {
    return apiRequest<{ message: string; user: User }>(`/auth/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  // Owner onboarding request from marketing/register flow
  async requestOwnerOnboarding(payload: OwnerOnboardingRequest): Promise<OwnerOnboardingResponse> {
    // ROADMAP: Connect to actual onboarding service once backend endpoint exists (Q2 2026).
    return apiRequest<OwnerOnboardingResponse>('/auth/owner/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// Dashboard (manager): at-risk tenants and interventions
export const dashboardApi = {
  getAtRiskTenants(): Promise<AtRiskTenant[]> {
    return apiRequest<AtRiskTenant[]>('/dashboard/at-risk').then((r) => (Array.isArray(r) ? r : []));
  },
  refreshAtRiskScores(): Promise<{ message: string; tenantsScored: number }> {
    return apiRequest<{ message: string; tenantsScored: number }>('/dashboard/at-risk/refresh', {
      method: 'POST',
    });
  },
  createRiskIntervention(body: CreateRiskInterventionRequest): Promise<{
    id: string;
    tenantId: string;
    propertyId: string | null;
    interventionType: string;
    status: string;
    notes: string | null;
    createdAt: string;
  }> {
    return apiRequest('/dashboard/at-risk/interventions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getRiskAnalytics(days = 30): Promise<RiskAnalytics> {
    return apiRequest<RiskAnalytics>(`/dashboard/at-risk/analytics?days=${days}`);
  },
  getTenantRiskHistory(tenantId: string, limit = 30): Promise<TenantRiskHistory> {
    return apiRequest<TenantRiskHistory>(`/dashboard/at-risk/${tenantId}/history?limit=${limit}`);
  },
  getRecommendations(): Promise<RiskRecommendation[]> {
    return apiRequest<RiskRecommendation[]>('/dashboard/at-risk/recommendations').then((r) => (Array.isArray(r) ? r : []));
  },
  approveRecommendation(id: string, notes?: string): Promise<{ interventionId: string }> {
    return apiRequest(`/dashboard/at-risk/recommendations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
  dismissRecommendation(id: string): Promise<{ message: string }> {
    return apiRequest(`/dashboard/at-risk/recommendations/${id}/dismiss`, {
      method: 'POST',
    });
  },
  updateInterventionOutcome(id: string, data: { effectivenessRating?: number; outcome?: string; status?: string }): Promise<Record<string, unknown>> {
    return apiRequest(`/dashboard/at-risk/interventions/${id}/outcome`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  getInlineRecommendation(tenantId: string): Promise<InlineRecommendation> {
    return apiRequest<InlineRecommendation>(`/dashboard/at-risk/${tenantId}/recommend`);
  },
  /** AI Assistant: send conversation and get one reply. */
  assistantChat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<{ reply: string }> {
    return apiRequest<{ reply: string }>('/dashboard/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  },
  /** Home care reminders for properties (owner, tenant, manager). */
  getReminders(): Promise<PropertyReminderItem[]> {
    return apiRequest<PropertyReminderItem[]>('/dashboard/reminders').then((r) =>
      Array.isArray(r) ? r : []
    );
  },
  /** Mark a property reminder as completed. */
  completeReminder(propertyId: string, reminderType: string): Promise<{
    id: string;
    propertyId: string;
    reminderType: string;
    completedAt: string;
  }> {
    return apiRequest('/dashboard/reminders/complete', {
      method: 'POST',
      body: JSON.stringify({ propertyId, reminderType }),
    });
  },
};

// Token management
export const tokenManager = {
  getToken(): string | null {
    // Check sessionStorage first (new method)
    let token = sessionStorage.getItem('ondoToken');
    if (token) return token;
    
    // Fallback to localStorage (old method)
    token = localStorage.getItem('ondoToken');
    if (token) {
      // Migrate to sessionStorage
      sessionStorage.setItem('ondoToken', token);
      localStorage.removeItem('ondoToken');
      return token;
    }
    
    // Check for old token key
    token = localStorage.getItem('token');
    if (token) {
      // Migrate to sessionStorage with new key
      sessionStorage.setItem('ondoToken', token);
      localStorage.removeItem('token');
      return token;
    }
    
    return null;
  },

  setToken(token: string): void {
    sessionStorage.setItem('ondoToken', token);
  },

  removeToken(): void {
    sessionStorage.removeItem('ondoToken');
    localStorage.removeItem('ondoToken');
    localStorage.removeItem('token');
  },

  isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true; // Invalid JWT format
      }
      const payload = JSON.parse(atob(parts[1]));
      if (!payload || typeof payload.exp !== 'number') {
        return true; // Invalid payload or missing expiration
      }
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; // Any parsing error means token is invalid
    }
  },
};

// Property API functions
export const propertyApi = {
  // Get all properties
  async getProperties(): Promise<Property[]> {
    const result = await apiRequest<Property[]>('/properties');
    return Array.isArray(result) ? result : [];
  },

  // Get public properties (no auth required)
  async getPublicProperties(): Promise<PublicProperty[]> {
    const result = await apiRequest<PublicProperty[]>('/properties/public');
    return Array.isArray(result) ? result : [];
  },

  // Get property by ID
  async getProperty(id: string): Promise<Property> {
    return apiRequest<Property>(`/properties/${id}`);
  },

  // Get tenant's assigned property
  async getTenantProperty(): Promise<Property> {
    return apiRequest<Property>('/properties/tenant-property');
  },

  // Create new property
  async createProperty(propertyData: CreatePropertyRequest): Promise<Property> {
    return apiRequest<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  // Update property
  async updateProperty(id: string, propertyData: Partial<CreatePropertyRequest>): Promise<Property> {
    return apiRequest<Property>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  },

  // Delete property
  async deleteProperty(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/properties/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload property photo
  async uploadPhoto(propertyId: string, file: File, caption?: string, orderIndex: number = 0): Promise<PropertyPhoto> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('propertyId', propertyId);
    formData.append('orderIndex', orderIndex.toString());
    if (caption) {
      formData.append('caption', caption);
    }

    const token = tokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/properties/photos`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data: Record<string, unknown>;
    if (isJson) {
      try {
        const text = await response.text();
        data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        throw new ApiError('Invalid JSON response', response.status);
      }
    } else {
      const text = await response.text();
      data = { message: text || 'Upload failed' };
    }
    
    if (!response.ok) {
      throw new ApiError(
        typeof data.message === 'string' ? data.message : 'Upload failed',
        response.status,
        data.errors as Record<string, unknown> | undefined
      );
    }

    return data as unknown as PropertyPhoto;
  },

  // Generate presigned URL for S3 upload
  async generatePresignedUploadUrl(propertyId: string, fileName: string, contentType: string): Promise<{
    presignedUrl: string;
    key: string;
    publicUrl: string;
    expiresIn: number;
  }> {
    return apiRequest('/properties/photos/presigned-url', {
      method: 'POST',
      body: JSON.stringify({
        propertyId,
        fileName,
        contentType,
      }),
    });
  },

  // Upload file directly to S3 using presigned URL
  async uploadToS3(presignedUrl: string, file: File): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new ApiError('Failed to upload to S3', response.status);
    }
  },

  // Confirm photo upload and save to database
  async confirmPhotoUpload(propertyId: string, url: string, s3Key: string, caption?: string, orderIndex: number = 0): Promise<PropertyPhoto> {
    return apiRequest('/properties/photos/confirm', {
      method: 'POST',
      body: JSON.stringify({
        propertyId,
        url,
        s3Key,
        caption,
        orderIndex: orderIndex.toString(), // Convert to string for backend validation
      }),
    });
  },

  // Delete property photo
  async deletePhoto(photoId: string): Promise<{ message: string }> {
    return apiRequest(`/properties/photos/${photoId}`, {
      method: 'DELETE',
    });
  },

  // Get all amenities
  async getAmenities(): Promise<Amenity[]> {
    const result = await apiRequest<Amenity[]>('/properties/amenities/list');
    return Array.isArray(result) ? result : [];
  },

  // Manager functions

  async updatePropertyStatus(propertyId: string, status: 'approved' | 'rejected', comment?: string): Promise<Property> {
    return apiRequest<Property>(`/properties/${propertyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    });
  },

  // Owner functions - get tenants from properties data
  async getOwnerTenants(): Promise<OwnerTenantsResponse> {
    // Get all properties for the owner, then filter and map tenant data
    const propertiesResult = await apiRequest<Property[]>('/properties');
    const properties = Array.isArray(propertiesResult) ? propertiesResult : [];
    
    // Filter properties that have tenants
    const propertiesWithTenants = properties.filter(property => property.tenantId);
    
    // Map properties to tenant format
    const tenants: Tenant[] = propertiesWithTenants.map(property => {
      // Calculate lease end date (one month after move-in date)
      const moveInDate = new Date(property.createdAt);
      const leaseEndDate = new Date(moveInDate);
      leaseEndDate.setMonth(leaseEndDate.getMonth() + 1);

      return {
        id: property.tenantId!,
        name: property.tenant ? `${property.tenant.firstName} ${property.tenant.lastName}` : `Tenant ${property.tenantId!.slice(-4)}`,
        property: property.title,
        unit: `${property.type} - Unit ${property.id.slice(-4)}`,
        rent: property.price || 0,
        leaseStart: moveInDate.toISOString().split('T')[0],
        leaseEnd: leaseEndDate.toISOString().split('T')[0],
        paymentStatus: 'current' as const,
        email: property.tenant?.email || `tenant-${property.tenantId!.slice(-4)}@example.com`,
        phone: property.tenant?.phone,
        propertyType: property.type,
        propertyAddress: `${property.addressLine1}, ${property.city}`,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        sqft: property.sqft,
        propertyStatus: property.status,
        tenantCreatedAt: property.tenant?.createdAt || property.createdAt,
        propertyCreatedAt: property.createdAt
      };
    });

    // Calculate summary statistics
    const totalTenants = tenants.length;
    const totalRent = tenants.reduce((sum, tenant) => sum + (tenant.rent || 0), 0);
    const avgRent = totalTenants > 0 ? Math.round(totalRent / totalTenants) : 0;

    const occupiedUnits = totalTenants;
    const totalUnits = Math.max(occupiedUnits, 1);
    const occupancyRate = Math.round((occupiedUnits / totalUnits) * 100);

    const summary: OwnerTenantsSummary = {
      totalTenants,
      occupiedUnits: `${occupiedUnits}/${totalUnits}`,
      occupancyRate: `${occupancyRate}%`,
      avgRent: `$${avgRent.toLocaleString()}`
    };

    return {
      summary,
      tenants
    };
  },
};

// Lead API functions
export const leadApi = {
  // Submit lead (public API - no authentication required)
  async submitLead(leadData: LeadSubmissionRequest): Promise<LeadSubmissionResponse> {
    const response = await fetch(`${API_BASE_URL}/leads/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data: Record<string, unknown>;
    if (isJson) {
      try {
        const text = await response.text();
        data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        throw new ApiError('Invalid JSON response', response.status);
      }
    } else {
      const text = await response.text();
      data = { message: text || 'Lead submission failed' };
    }
    
    if (!response.ok) {
      throw new ApiError(
        typeof data.message === 'string' ? data.message : 'Lead submission failed',
        response.status,
        data.errors as Record<string, unknown> | undefined
      );
    }

    return data as unknown as LeadSubmissionResponse;
  },

  // Get manager leads (authenticated)
  async getManagerLeads(): Promise<Lead[]> {
    const result = await apiRequest<Lead[]>('/leads');
    return Array.isArray(result) ? result : [];
  },

  // Update lead status (authenticated)
  async updateLeadStatus(leadId: string, status: Lead['status']): Promise<{ message: string; lead: Lead }> {
    return apiRequest<{ message: string; lead: Lead }>(`/leads/${leadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Maintenance API functions
export const maintenanceApi = {
  // Create maintenance request (tenant only)
  async createMaintenanceRequest(data: CreateMaintenanceRequestRequest): Promise<MaintenanceRequest> {
    return apiRequest<MaintenanceRequest>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get maintenance requests for tenant
  async getTenantMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const result = await apiRequest<MaintenanceRequest[]>('/maintenance/tenant');
    return Array.isArray(result) ? result : [];
  },

  // Get maintenance requests for manager
  async getManagerMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const result = await apiRequest<MaintenanceRequest[]>('/maintenance/manager/all');
    return Array.isArray(result) ? result : [];
  },

  // Get maintenance request by ID
  async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest> {
    return apiRequest<MaintenanceRequest>(`/maintenance/${id}`);
  },

  // Update maintenance request (manager only)
  async updateMaintenanceRequest(id: string, data: UpdateMaintenanceRequestRequest): Promise<MaintenanceRequest> {
    return apiRequest<MaintenanceRequest>(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Tenant screening API functions
export const tenantScreeningApi = {
  async getSummary(params?: TenantScreeningSummaryParams): Promise<TenantScreeningSummary> {
    const query = buildQueryString(params as Record<string, unknown> | undefined);
    return tenantScreeningRequest<TenantScreeningSummary>(`/tenant-screening/summary${query}`);
  },

  async getApplicants(params?: TenantScreeningApplicantParams): Promise<TenantScreeningApplicant[]> {
    const query = buildQueryString(params as Record<string, unknown> | undefined);
    const result = await tenantScreeningRequest<TenantScreeningApplicant[]>(`/tenant-screening/applicants${query}`);
    return Array.isArray(result) ? result : [];
  },

  async getReport(reportId: string): Promise<TenantScreeningReport> {
    return tenantScreeningRequest<TenantScreeningReport>(`/tenant-screening/reports/${reportId}`);
  },
};

// Handoff API functions
export const handoffApi = {
  // Notify property manager about checklist completion
  async notifyChecklistCompletion(propertyId: string, tenantName: string, propertyAddress: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/handoff/checklist-completion', {
      method: 'POST',
      body: JSON.stringify({
        propertyId,
        tenantName,
        propertyAddress,
      }),
    });
  },
};

// Feature-level API namespaces (placeholders wired to backend routes)
export const featureApi = {
  screening: {
    listRequests(params?: Record<string, string | number>): Promise<ScreeningRequestPayload[]> {
      const query = buildQueryString(params);
      return apiRequest<ScreeningRequestPayload[]>(`/screening/requests${query}`);
    },
    createRequest(payload: CreateScreeningRequestInput): Promise<ScreeningRequestPayload> {
      // ROADMAP: Integrate actual SmartMove/Checkr provider IDs once backend wiring is ready (Q3 2026).
      return apiRequest<ScreeningRequestPayload>('/screening/requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    sendScreeningLink(requestId: string, channel: CommunicationChannel = 'email'): Promise<{ message: string }> {
      return apiRequest<{ message: string }>(`/screening/requests/${requestId}/send-link`, {
        method: 'POST',
        body: JSON.stringify({ channel }),
      });
    },
    fetchReportMetadata(requestId: string): Promise<ScreeningReportMetadata> {
      return apiRequest<ScreeningReportMetadata>(`/screening/requests/${requestId}/report`);
    },
  },
  rentPayments: {
    getSchedule(propertyId?: string): Promise<RentSchedule[]> {
      const query = buildQueryString(propertyId ? { propertyId } : undefined);
      return apiRequest<RentSchedule[]>(`/rent/schedules${query}`);
    },
    updateSchedule(scheduleId: string, partial: Partial<RentSchedule>): Promise<RentSchedule> {
      return apiRequest<RentSchedule>(`/rent/schedules/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify(partial),
      });
    },
    toggleAutopay(payload: AutoPayToggleRequest): Promise<RentSchedule> {
      return apiRequest<RentSchedule>(`/rent/schedules/${payload.scheduleId}/autopay`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    createPayment(scheduleId: string, amount: number, method: RentPaymentMethod = 'ach'): Promise<RentPayment> {
      // ROADMAP: Wire to Stripe + Plaid ACH once credentials provided (Q2 2026 - payment system).
      return apiRequest<RentPayment>(`/rent/schedules/${scheduleId}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount, method }),
      });
    },
    listPayments(params?: { propertyId?: string; tenantId?: string }): Promise<RentPayment[]> {
      return apiRequest<RentPayment[]>(`/rent/payments${buildQueryString(params)}`);
    },
    listReceipts(tenantId?: string): Promise<RentReceipt[]> {
      return apiRequest<RentReceipt[]>(`/rent/receipts${buildQueryString(tenantId ? { tenantId } : undefined)}`);
    },
    getLandlordStatements(ownerId?: string): Promise<LandlordStatement[]> {
      return apiRequest<LandlordStatement[]>(`/rent/statements${buildQueryString(ownerId ? { ownerId } : undefined)}`);
    },
  },
  leaseManagement: {
    listTemplates(): Promise<LeaseTemplate[]> {
      return apiRequest<LeaseTemplate[]>('/leases/templates');
    },
    createTemplate(payload: LeaseTemplate): Promise<LeaseTemplate> {
      return apiRequest<LeaseTemplate>('/leases/templates', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    generateFromTemplate(templateId: string, context: Record<string, unknown>): Promise<LeaseDocument> {
      return apiRequest<LeaseDocument>(`/leases/templates/${templateId}/generate`, {
        method: 'POST',
        body: JSON.stringify(context),
      });
    },
    uploadLease(metadata: Partial<LeaseDocument>): Promise<LeaseDocument> {
      return apiRequest<LeaseDocument>('/leases/documents', {
        method: 'POST',
        body: JSON.stringify(metadata),
      });
    },
    listLeases(params?: { propertyId?: string; tenantId?: string; status?: LeaseStatus }): Promise<LeaseDocument[]> {
      return apiRequest<LeaseDocument[]>(`/leases/documents${buildQueryString(params)}`);
    },
    sendForSignature(documentId: string, provider: ESignRequest['provider'] = 'mock'): Promise<ESignRequest> {
      // ROADMAP: Plug in DocuSign/HelloSign keys (Q2 2026 - lease management).
      return apiRequest<ESignRequest>(`/leases/documents/${documentId}/esign`, {
        method: 'POST',
        body: JSON.stringify({ provider }),
      });
    },
  },
  maintenance: {
    ...maintenanceApi,
  },
  documents: {
    listCategories(): Promise<DocumentCategory[]> {
      return apiRequest<DocumentCategory[]>('/documents/categories');
    },
    listDocuments(params?: { propertyId?: string; tenantId?: string; ownerId?: string }): Promise<DocumentRecord[]> {
      return apiRequest<DocumentRecord[]>(`/documents${buildQueryString(params)}`);
    },
    uploadDocument(record: Partial<DocumentRecord>): Promise<DocumentRecord> {
      return apiRequest<DocumentRecord>('/documents', {
        method: 'POST',
        body: JSON.stringify(record),
      });
    },
    deleteDocument(documentId: string): Promise<{ message: string }> {
      return apiRequest<{ message: string }>(`/documents/${documentId}`, {
        method: 'DELETE',
      });
    },
  },
  communication: {
    listThreads(): Promise<MessageThread[]> {
      return apiRequest<MessageThread[]>('/communication/threads');
    },
    listMessages(threadId: string): Promise<MessageRecord[]> {
      return apiRequest<MessageRecord[]>(`/communication/threads/${threadId}/messages`);
    },
    sendMessage(payload: MessagePayload): Promise<MessageRecord> {
      return apiRequest<MessageRecord>('/communication/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    updatePreferences(preferences: NotificationPreference[]): Promise<NotificationPreference[]> {
      return apiRequest<NotificationPreference[]>('/communication/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    },
    triggerNotification(payload: { template: string; channel: CommunicationChannel; targetId: string }): Promise<{ message: string }> {
      // ROADMAP: Integrate SendGrid/Resend + Twilio credentials here (Q2 2026 - notifications).
      return apiRequest<{ message: string }>('/communication/notify', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },
  accounting: {
    listLedgerEntries(params?: { propertyId?: string; startDate?: string; endDate?: string }): Promise<LedgerEntry[]> {
      return apiRequest<LedgerEntry[]>(`/accounting/ledger${buildQueryString(params)}`);
    },
    createLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
      return apiRequest<LedgerEntry>('/accounting/ledger', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
    },
    recordExpense(entry: Omit<LedgerEntry, 'id' | 'type'> & { type?: LedgerEntry['type'] }): Promise<LedgerEntry> {
      return apiRequest<LedgerEntry>('/accounting/expenses', {
        method: 'POST',
        body: JSON.stringify({ ...entry, type: entry.type ?? 'expense' }),
      });
    },
    getProfitLoss(params?: { propertyId?: string; startDate?: string; endDate?: string }): Promise<ProfitLossSummary> {
      return apiRequest<ProfitLossSummary>(`/accounting/profit-loss${buildQueryString(params)}`);
    },
    exportLedger(payload: LedgerExportRequest): Promise<{ downloadUrl: string }> {
      return apiRequest<{ downloadUrl: string }>('/accounting/export', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },
  admin: {
    getMetrics(): Promise<AdminMetric[]> {
      return apiRequest<AdminMetric[]>('/admin/metrics');
    },
    listRoleAssignments(): Promise<RoleAssignment[]> {
      return apiRequest<RoleAssignment[]>('/admin/roles');
    },
    updateRoleAssignment(roleId: string, status: RoleAssignment['status']): Promise<RoleAssignment> {
      return apiRequest<RoleAssignment>(`/admin/roles/${roleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },

  // ─── Stripe Payments ────────────────────────────────────────────
  stripe: {
    createSetupIntent(): Promise<{ success: boolean; clientSecret: string }> {
      return apiRequest('/payments/setup-intent', { method: 'POST' });
    },
    listPaymentMethods(): Promise<{ success: boolean; data: StripePaymentMethod[] }> {
      return apiRequest('/payments/payment-methods');
    },
    attachPaymentMethod(stripePaymentMethodId: string): Promise<{ success: boolean; data: StripePaymentMethod }> {
      return apiRequest('/payments/payment-methods', {
        method: 'POST',
        body: JSON.stringify({ stripePaymentMethodId }),
      });
    },
    removePaymentMethod(id: string): Promise<{ success: boolean }> {
      return apiRequest(`/payments/payment-methods/${id}`, { method: 'DELETE' });
    },
    setDefaultPaymentMethod(id: string): Promise<{ success: boolean }> {
      return apiRequest(`/payments/payment-methods/${id}/default`, { method: 'PUT' });
    },
    createPaymentIntent(params: CreatePaymentIntentParams): Promise<{ success: boolean; clientSecret: string; paymentId: string }> {
      return apiRequest('/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    getPaymentHistory(page?: number, limit?: number): Promise<{ success: boolean; data: PaymentRecord[]; pagination: { page: number; limit: number; total: number; hasMore: boolean } }> {
      return apiRequest(`/payments/history${buildQueryString({ page, limit })}`);
    },
  },

  // ─── Subscriptions ──────────────────────────────────────────────
  subscriptions: {
    create(planName: string): Promise<{ success: boolean; clientSecret: string; subscriptionId: string }> {
      return apiRequest('/subscriptions/create', {
        method: 'POST',
        body: JSON.stringify({ planName }),
      });
    },
    getCurrent(): Promise<{ success: boolean; data: SubscriptionRecord | null }> {
      return apiRequest('/subscriptions/current');
    },
    cancel(): Promise<{ success: boolean; message: string }> {
      return apiRequest('/subscriptions/cancel', { method: 'POST' });
    },
    resume(): Promise<{ success: boolean; message: string }> {
      return apiRequest('/subscriptions/resume', { method: 'POST' });
    },
  },
};

// ─── Notifications API ──────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'api_down' | 'info';
  endpoint_name: string | null;
  endpoint_url: string | null;
  status_code: number | null;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  list(): Promise<{ notifications: AppNotification[] }> {
    return apiRequest('/notifications');
  },
  unreadCount(): Promise<{ count: number }> {
    return apiRequest('/notifications/unread-count');
  },
  markRead(id: string): Promise<{ message: string }> {
    return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
  },
  markAllRead(): Promise<{ message: string }> {
    return apiRequest('/notifications/mark-all-read', { method: 'POST' });
  },
};
