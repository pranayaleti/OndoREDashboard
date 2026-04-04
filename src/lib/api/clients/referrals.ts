import { apiGet, apiPost, apiPut } from "../http";

export interface ReferralCode {
  id: string;
  code: string;
  source: "user_referral" | "affiliate";
  maxCredits: number;
  totalReferrals: number;
  isActive: boolean;
  createdAt: string;
}

export interface ReferralStats {
  code: string;
  shareUrl: string;
  totalReferrals: number;
  creditsEarned: number;
  creditsAvailable: number;
  maxCredits: number;
  sweepstakesEntries: number;
  leaderboardPosition: number | null;
}

export interface ReferralHistoryItem {
  id: string;
  referredEmail: string | null;
  status: "clicked" | "signed_up" | "converted";
  creditEarned: boolean;
  createdAt: string;
  convertedAt: string | null;
}

export interface CreditBalance {
  earned: number;
  redeemed: number;
  available: number;
  maxCredits: number;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  totalReferrals: number;
  creditsEarned: number;
  isCurrentUser: boolean;
}

export const referralApi = {
  getMyCode: () => apiGet<ReferralCode>("/referrals/my-code"),
  getStats: () => apiGet<ReferralStats>("/referrals/stats"),
  getHistory: (page = 1, limit = 20) =>
    apiGet<{ referrals: ReferralHistoryItem[]; total: number }>(
      `/referrals/history?page=${page}&limit=${limit}`
    ),
  getCredits: () => apiGet<CreditBalance>("/referrals/credits"),
  redeemCredits: (count: number) =>
    apiPost<void>("/referrals/redeem", { count }),
  getLeaderboard: () => apiGet<LeaderboardEntry[]>("/referrals/leaderboard"),
  trackClick: (code: string, email?: string) =>
    apiPost<void>("/referrals/track", { code, email }),
  applyAffiliate: (data: {
    name: string;
    email: string;
    website?: string;
    audienceSize?: string;
    motivation?: string;
  }) => apiPost<void>("/referrals/affiliate/apply", data),
  adminUpdateCap: (codeId: string, maxCredits: number) =>
    apiPut<void>(`/referrals/admin/${codeId}/cap`, { maxCredits }),
  adminGetAll: (page = 1, limit = 20) =>
    apiGet<{ codes: ReferralCode[]; total: number }>(
      `/referrals/admin/all?page=${page}&limit=${limit}`
    ),
};
