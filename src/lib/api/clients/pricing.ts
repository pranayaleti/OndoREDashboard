import { apiGet } from "../http";

export interface SuggestedRent {
  currentRent: number | null;
  suggestedRent: number;
  avgAreaRent: number;
  pricePerSqft: number;
  comparableCount: number;
  percentile: number;
}

export interface VacancyCost {
  currentRent: number;
  avgVacancyDays: number;
  annualVacancyCost: number;
  breakEvenReduction: number;
  recommendation: string;
}

export interface RenewalRecommendation {
  currentRent: number;
  suggestedRent: number;
  cpiIncrease: number;
  marketIncrease: number;
  recommendation: string;
  renewalTermSuggestion: string;
}

export const pricingApi = {
  async getSuggestedRent(propertyId: string): Promise<SuggestedRent> {
    const res = await apiGet<{ data: SuggestedRent }>(`/pricing/suggested/${propertyId}`);
    return res.data;
  },
  async getComparables(propertyId: string): Promise<unknown[]> {
    const res = await apiGet<{ data: unknown[] }>(`/pricing/comparables/${propertyId}`);
    return res.data;
  },
  async getRentTrends(propertyId: string): Promise<Array<{ month: string; amountCents: number }>> {
    const res = await apiGet<{ data: Array<{ month: string; amountCents: number }> }>(`/pricing/trends/${propertyId}`);
    return res.data;
  },
  async getVacancyCost(propertyId: string): Promise<VacancyCost> {
    const res = await apiGet<{ data: VacancyCost }>(`/pricing/vacancy-cost/${propertyId}`);
    return res.data;
  },
  async getRenewalRecommendation(propertyId: string): Promise<RenewalRecommendation> {
    const res = await apiGet<{ data: RenewalRecommendation }>(`/pricing/renewal/${propertyId}`);
    return res.data;
  },
  async getRevenueOptimization(): Promise<unknown> {
    const res = await apiGet<{ data: unknown }>('/pricing/optimization');
    return res.data;
  },
};
