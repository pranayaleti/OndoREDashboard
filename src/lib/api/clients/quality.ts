import { apiGet, apiPost } from "../http";

export interface QualityScore {
  id: string;
  propertyId: string;
  overallScore: number;
  feedbackScore: number | null;
  maintenanceScore: number | null;
  occupancyScore: number | null;
  renewalScore: number | null;
  aiSummary: string | null;
  calculatedAt: string;
}

export interface QualityInsights {
  score: QualityScore;
  improvementAreas: string[];
  recommendations: string[];
}

export const qualityApi = {
  async getPropertyQuality(propertyId: string): Promise<QualityScore> {
    const res = await apiGet<{ data: QualityScore }>(`/quality/property/${propertyId}`);
    return res.data;
  },
  async getInsights(propertyId: string): Promise<QualityInsights> {
    const res = await apiGet<{ data: QualityInsights }>(`/quality/property/${propertyId}/insights`);
    return res.data;
  },
  async getPortfolioQuality(): Promise<QualityScore[]> {
    const res = await apiGet<{ data: QualityScore[] }>('/quality/portfolio');
    return res.data;
  },
  async refreshScores(): Promise<void> {
    await apiPost('/quality/portfolio/refresh', {});
  },
};
