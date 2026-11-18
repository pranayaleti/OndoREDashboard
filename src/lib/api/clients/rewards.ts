import { apiGet, apiPost } from "../http";

/**
 * Ondo Rewards, the tenant loyalty program. Served by the Edge API in
 * production and Express in dev from one shared module
 * (OndoREBackend/supabase/functions/_shared/tenant-rewards.ts).
 */

export type RewardTierId = "bronze" | "silver" | "gold" | "platinum";

export interface RewardTier {
  id: RewardTierId;
  name: string;
  minPoints: number;
  rentMultiplier: number;
}

export interface RewardCatalogItem {
  id: string;
  title: string;
  description: string;
  points: number;
  kind: "redeemed_credit" | "redeemed_gift";
}

export type RedemptionStatus = "pending" | "fulfilled" | "cancelled";

export interface RewardActivity {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
  /** Redemptions only: pending until the owner marks it done or cancels it. */
  status: RedemptionStatus | null;
}

/** A tenant's redemption as the owner sees it. */
export interface RedemptionRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyLabel: string;
  title: string;
  points: number;
  kind: "redeemed_credit" | "redeemed_gift";
  status: RedemptionStatus;
  requestedAt: string;
  fulfilledAt: string | null;
  note: string | null;
}

export interface RewardsOverview {
  available: number;
  lifetime: number;
  redeemed: number;
  tier: RewardTier;
  nextTier: RewardTier | null;
  pointsToNextTier: number | null;
  /** 0 at the Bronze trailhead, 1 at the Platinum summit. */
  trailProgress: number;
  earnRates: {
    /** Includes the current tier's bonus. */
    onTimeRent: number;
    baseOnTimeRent: number;
    referral: number;
    renewal: number;
    /** Welcome bonus a referred friend gets when they sign a lease. */
    friendBonus: number;
  };
  tiers: RewardTier[];
  catalog: RewardCatalogItem[];
  earningStartsOn: string;
  canRedeem: boolean;
  recentActivity: RewardActivity[];
}

export const rewardsApi = {
  getOverview: () =>
    apiGet<{ data: RewardsOverview }>("/tenant/rewards").then((r) => r.data),
  getHistory: (page = 1, limit = 20) =>
    apiGet<{ data: RewardActivity[] }>(`/tenant/rewards/history?page=${page}&limit=${limit}`).then(
      (r) => r.data ?? [],
    ),
  redeem: (itemId: string) =>
    apiPost<{ data: { transaction: RewardActivity; overview: RewardsOverview } }>(
      "/tenant/rewards/redeem",
      { itemId },
    ).then((r) => r.data),

  // Owner side
  listRedemptions: (status?: RedemptionStatus) =>
    apiGet<{ data: RedemptionRequest[] }>(
      `/rewards/redemptions${status ? `?status=${status}` : ""}`,
    ).then((r) => r.data ?? []),
  fulfilRedemption: (id: string, note?: string) =>
    apiPost<{ data: RedemptionRequest }>(`/rewards/redemptions/${encodeURIComponent(id)}/fulfil`, { note }).then(
      (r) => r.data,
    ),
  cancelRedemption: (id: string, note?: string) =>
    apiPost<{ data: RedemptionRequest }>(`/rewards/redemptions/${encodeURIComponent(id)}/cancel`, { note }).then(
      (r) => r.data,
    ),
};
