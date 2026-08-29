/**
 * Content studio API — POST /api/content/generate
 */

import { apiPost, getAuthHeaders } from "../http";

export const CONTENT_TYPES = [
  "listing_video_script",
  "local_content_ideas",
  "topic_to_script",
  "buyer_questions",
  "buyer_question_video",
  "market_commentary",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
export type MarketAudience = "buyer" | "seller";

export interface RestrictedMatch {
  category: "fairHousing" | "lending" | "valuation";
  term: string;
  index?: number;
  reason: string;
}

export interface GenerateContentRequest {
  contentType: ContentType;
  listingId?: string | null;
  city?: string | null;
  topic?: string | null;
  question?: string | null;
  extraNotes?: string | null;
  audience?: MarketAudience | null;
}

export type ListingVideoPayload = {
  type: "listing_video_script";
  title: string;
  script: string;
  estimatedDurationSeconds: number;
  callToAction: string;
  wordCount: number;
};

export type LocalContentIdeasPayload = {
  type: "local_content_ideas";
  location: string;
  categories: Array<{ name: string; ideas: string[] }>;
};

export type TopicScriptPayload = {
  type: "topic_to_script";
  title: string;
  topic: string;
  location: string | null;
  script: string;
  estimatedDurationSeconds: number;
  engagementQuestion: string;
  wordCount: number;
};

export type BuyerQuestionsPayload = {
  type: "buyer_questions";
  questions: string[];
};

export type BuyerQuestionVideoPayload = {
  type: "buyer_question_video";
  title: string;
  question: string;
  script: string;
  estimatedDurationSeconds: number;
  callToAction: string;
  wordCount: number;
};

export type MarketCommentaryPayload = {
  type: "market_commentary";
  title: string;
  audience: MarketAudience;
  script: string;
  market: string;
  dataDate: string | null;
  source: string | null;
  asOf: string | null;
  verifiedFacts: string[];
  educationalContext: string[];
  dataAvailability: "verified" | "unavailable";
};

export type ContentPayload =
  | ListingVideoPayload
  | LocalContentIdeasPayload
  | TopicScriptPayload
  | BuyerQuestionsPayload
  | BuyerQuestionVideoPayload
  | MarketCommentaryPayload;

export interface GenerateContentResult {
  contentType: ContentType;
  body: string;
  payload?: ContentPayload;
  disclosures: string;
  bodyWithDisclosures: string;
  complianceWarnings: RestrictedMatch[];
  listing: { id: string; title: string; city: string } | null;
  source: "ai";
}

export const contentApi = {
  async generate(input: GenerateContentRequest): Promise<GenerateContentResult> {
    const headers = getAuthHeaders();
    const res = await apiPost<{ message: string; data: GenerateContentResult }>(
      "/content/generate",
      input,
      headers,
    );
    return res.data;
  },
};
