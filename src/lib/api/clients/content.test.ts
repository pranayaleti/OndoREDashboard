import { describe, expect, it } from "vitest";
import { CONTENT_TYPES } from "./content";

describe("content studio types", () => {
  it("exposes the six product content types", () => {
    expect(CONTENT_TYPES).toEqual([
      "listing_video_script",
      "local_content_ideas",
      "topic_to_script",
      "buyer_questions",
      "buyer_question_video",
      "market_commentary",
    ]);
  });
});
