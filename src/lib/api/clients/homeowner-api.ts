import { apiRequest, apiGet, apiPost, apiPut, apiDelete, apiUpload } from "../http";

export interface HomeownerSummary {
  monthlyExpensesCents: number;
  monthlyAverageCents: number;
  utilitiesThisMonthCents: number;
  subscriptionsThisMonthCents: number;
  householdThisMonthCents: number;
  mortgagePaymentCents: number | null;
  insurancePremiumCents: number | null;
}

export interface PropertyMortgage {
  id: string;
  propertyId: string;
  userId: string;
  lenderName: string | null;
  accountNumberMasked: string | null;
  monthlyPaymentCents: number | null;
  interestRate: number | null;
  remainingBalanceCents: number | null;
  originalAmountCents: number | null;
  payoffDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdditionalLoan {
  id: string;
  propertyId: string;
  userId: string;
  lenderName: string;
  loanType: "heloc" | "home_equity" | "personal" | "other";
  monthlyPaymentCents: number | null;
  interestRate: number | null;
  remainingBalanceCents: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsurancePolicy {
  id: string;
  propertyId: string;
  userId: string;
  provider: string | null;
  policyNumber: string | null;
  premiumCents: number | null;
  coverageAmountCents: number | null;
  deductibleCents: number | null;
  agentName: string | null;
  agentPhone: string | null;
  renewalDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyTaxRecord {
  id: string;
  propertyId: string;
  userId: string;
  taxYear: number;
  assessedValueCents: number | null;
  taxAmountCents: number | null;
  paymentStatus: "pending" | "paid" | "overdue";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HomeImprovementProject {
  id: string;
  propertyId: string;
  userId: string;
  name: string;
  category: string;
  scheduledDate: string | null;
  status: "planning" | "scheduled" | "in_progress" | "completed";
  estimatedCostCents: number | null;
  estimatedRoiPercent: number | null;
  description: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceProvider {
  id: string;
  propertyId: string;
  userId: string;
  name: string;
  trade: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSource {
  documentName: string;
  documentType: string;
  excerpt: string;
}

export interface HomeownerSearchResult {
  answer: string;
  nextSteps: string[];
  followUpQuestions: string[];
  sources: DocumentSource[];
}

export type PropertyDocumentType =
  | "insurance"
  | "lease"
  | "mortgage"
  | "tax"
  | "warranty"
  | "inspection"
  | "receipt"
  | "other";

export type PropertyDocumentStatus = "pending" | "indexed" | "failed";

export interface PropertyDocument {
  id: string;
  propertyId: string;
  userId: string;
  name: string;
  documentType: PropertyDocumentType;
  fileSizeBytes: number;
  mimeType: string | null;
  pageCount: number | null;
  status: PropertyDocumentStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

function unwrap<T>(res: { data: T }): T {
  return res.data;
}

export const homeownerApi = {
  getSummary(propertyId: string) {
    return apiGet<{ data: HomeownerSummary }>(
      `/homeowner/properties/${propertyId}/summary`
    ).then(unwrap);
  },

  getMortgage(propertyId: string) {
    return apiGet<{ data: PropertyMortgage | null }>(
      `/homeowner/properties/${propertyId}/mortgage`
    ).then(unwrap);
  },

  putMortgage(propertyId: string, body: Record<string, unknown>) {
    return apiPut<{ data: PropertyMortgage }>(
      `/homeowner/properties/${propertyId}/mortgage`,
      body
    ).then(unwrap);
  },

  listLoans(propertyId: string) {
    return apiGet<{ data: AdditionalLoan[] }>(
      `/homeowner/properties/${propertyId}/loans`
    ).then(unwrap);
  },

  createLoan(propertyId: string, body: Record<string, unknown>) {
    return apiPost<{ data: AdditionalLoan }>(
      `/homeowner/properties/${propertyId}/loans`,
      body
    ).then(unwrap);
  },

  updateLoan(propertyId: string, loanId: string, body: Record<string, unknown>) {
    return apiPut<{ data: AdditionalLoan }>(
      `/homeowner/properties/${propertyId}/loans/${loanId}`,
      body
    ).then(unwrap);
  },

  deleteLoan(propertyId: string, loanId: string) {
    return apiDelete(`/homeowner/properties/${propertyId}/loans/${loanId}`);
  },

  listInsurance(propertyId: string) {
    return apiGet<{ data: InsurancePolicy[] }>(
      `/homeowner/properties/${propertyId}/insurance`
    ).then(unwrap);
  },

  createInsurance(propertyId: string, body: Record<string, unknown>) {
    return apiPost<{ data: InsurancePolicy }>(
      `/homeowner/properties/${propertyId}/insurance`,
      body
    ).then(unwrap);
  },

  updateInsurance(propertyId: string, insuranceId: string, body: Record<string, unknown>) {
    return apiPut<{ data: InsurancePolicy }>(
      `/homeowner/properties/${propertyId}/insurance/${insuranceId}`,
      body
    ).then(unwrap);
  },

  deleteInsurance(propertyId: string, insuranceId: string) {
    return apiDelete(`/homeowner/properties/${propertyId}/insurance/${insuranceId}`);
  },

  listPropertyTaxes(propertyId: string) {
    return apiGet<{ data: PropertyTaxRecord[] }>(
      `/homeowner/properties/${propertyId}/property-taxes`
    ).then(unwrap);
  },

  createPropertyTax(propertyId: string, body: Record<string, unknown>) {
    return apiPost<{ data: PropertyTaxRecord }>(
      `/homeowner/properties/${propertyId}/property-taxes`,
      body
    ).then(unwrap);
  },

  updatePropertyTax(propertyId: string, taxId: string, body: Record<string, unknown>) {
    return apiPut<{ data: PropertyTaxRecord }>(
      `/homeowner/properties/${propertyId}/property-taxes/${taxId}`,
      body
    ).then(unwrap);
  },

  deletePropertyTax(propertyId: string, taxId: string) {
    return apiDelete(`/homeowner/properties/${propertyId}/property-taxes/${taxId}`);
  },

  listProjects(propertyId: string) {
    return apiGet<{ data: HomeImprovementProject[] }>(
      `/homeowner/properties/${propertyId}/projects`
    ).then(unwrap);
  },

  createProject(propertyId: string, body: Record<string, unknown>) {
    return apiPost<{ data: HomeImprovementProject }>(
      `/homeowner/properties/${propertyId}/projects`,
      body
    ).then(unwrap);
  },

  updateProject(propertyId: string, projectId: string, body: Record<string, unknown>) {
    return apiPut<{ data: HomeImprovementProject }>(
      `/homeowner/properties/${propertyId}/projects/${projectId}`,
      body
    ).then(unwrap);
  },

  patchProjectStatus(propertyId: string, projectId: string, status: string) {
    return apiRequest<{ data: HomeImprovementProject }>(
      "PATCH",
      `/homeowner/properties/${propertyId}/projects/${projectId}/status`,
      { status }
    ).then(unwrap);
  },

  deleteProject(propertyId: string, projectId: string) {
    return apiDelete(`/homeowner/properties/${propertyId}/projects/${projectId}`);
  },

  listServiceProviders(propertyId: string) {
    return apiGet<{ data: ServiceProvider[] }>(
      `/homeowner/properties/${propertyId}/service-providers`
    ).then(unwrap);
  },

  createServiceProvider(propertyId: string, body: Record<string, unknown>) {
    return apiPost<{ data: ServiceProvider }>(
      `/homeowner/properties/${propertyId}/service-providers`,
      body
    ).then(unwrap);
  },

  updateServiceProvider(propertyId: string, providerId: string, body: Record<string, unknown>) {
    return apiPut<{ data: ServiceProvider }>(
      `/homeowner/properties/${propertyId}/service-providers/${providerId}`,
      body
    ).then(unwrap);
  },

  deleteServiceProvider(propertyId: string, providerId: string) {
    return apiDelete(`/homeowner/properties/${propertyId}/service-providers/${providerId}`);
  },

  search(propertyId: string, question: string) {
    return apiPost<{ data: HomeownerSearchResult }>(
      `/homeowner/properties/${propertyId}/search`,
      { question }
    ).then(unwrap);
  },

  listDocuments(propertyId: string) {
    return apiGet<{ data: PropertyDocument[] }>(
      `/homeowner/properties/${propertyId}/documents`
    ).then(unwrap);
  },

  uploadDocument(propertyId: string, file: File, documentType: PropertyDocumentType) {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", documentType);
    return apiUpload<{ data: PropertyDocument }>(
      `/homeowner/properties/${propertyId}/documents`,
      form
    ).then(unwrap);
  },

  deleteDocument(propertyId: string, documentId: string) {
    return apiDelete(`/homeowner/properties/${propertyId}/documents/${documentId}`);
  },
};
