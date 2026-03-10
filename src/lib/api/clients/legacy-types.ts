/**
 * Legacy types from the monolithic api.ts that have not yet been migrated to @ondo/types.
 * These are re-exported from lib/api/index.ts for backwards compatibility.
 *
 * DEPRECATION NOTE: Prefer types from @ondo/types for new code.
 * These will be removed once consumers are updated to the new types package.
 */

// ─── User / Auth types ────────────────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'owner' | 'tenant' | 'maintenance';
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

// ─── Property types ───────────────────────────────────────────────────────────

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

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  url: string;
  caption?: string;
  orderIndex: number;
  createdAt: string;
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
  amenities?: string[];
  specialties?: string[];
  services?: string[];
  valueRanges?: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  photos?: PropertyPhoto[];
  owner?: PropertyOwner;
  manager?: PropertyManager;
  tenant?: PropertyTenant;
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
  amenities: string[];
  specialties: string[];
  services: string[];
  valueRanges: string[];
  owner: PublicPropertyOwner;
  manager: PublicPropertyManager;
  photos: PropertyPhoto[];
  status: string;
  createdAt: string;
  updatedAt: string;
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

// ─── Tenant types ─────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  property: string;
  unit: string;
  rent: number;
  leaseStart: string;
  leaseEnd: string;
  paymentStatus: 'current' | 'overdue' | 'pending';
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

// ─── Maintenance types ────────────────────────────────────────────────────────

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category:
    | 'plumbing'
    | 'electrical'
    | 'hvac'
    | 'appliance'
    | 'structural'
    | 'pest_control'
    | 'cleaning'
    | 'other';
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
  category:
    | 'plumbing'
    | 'electrical'
    | 'hvac'
    | 'appliance'
    | 'structural'
    | 'pest_control'
    | 'cleaning'
    | 'other';
  priority?: 'low' | 'medium' | 'high' | 'emergency';
  photos?: string[];
}

export interface UpdateMaintenanceRequestRequest {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  managerNotes?: string;
}

// ─── Lead types ───────────────────────────────────────────────────────────────

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
  moveInDate?: string;
  monthlyBudget?: string;
  occupants?: number;
  hasPets?: boolean;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source: string;
  createdAt: string;
  updatedAt: string;
  propertyTitle: string;
  propertyType: string;
  propertyAddress: string;
  propertyCity: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerEmail?: string;
}

// ─── Tenant screening types ───────────────────────────────────────────────────

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

// ─── Dashboard / risk types ───────────────────────────────────────────────────

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
  interventionType:
    | 'payment_plan'
    | 'reminder'
    | 'assistance_referral'
    | 'outreach'
    | 'early_renewal';
  propertyId?: string | null;
  notes?: string | null;
}

export type InterventionType =
  | 'payment_plan'
  | 'reminder'
  | 'assistance_referral'
  | 'outreach'
  | 'early_renewal';

export interface RiskAnalytics {
  distribution: { low: number; medium: number; high: number };
  totalScored: number;
  atRiskCount: number;
  trend: Array<{ date: string; avgScore: number; count: number }>;
  interventionsByType: Record<
    string,
    { total: number; completed: number; avgRating: number | null }
  >;
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

// ─── Notifications types ──────────────────────────────────────────────────────

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
