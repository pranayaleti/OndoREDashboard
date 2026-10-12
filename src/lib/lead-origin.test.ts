import { describe, expect, it } from "vitest"
import { describeLeadOrigin, type LeadOrigin } from "./lead-origin"

function origin(overrides: Partial<LeadOrigin>): LeadOrigin {
  return {
    source: "youtube",
    medium: "Comments",
    campaign: "Comments",
    content: null,
    term: null,
    landingPath: "/property-management/",
    fromComment: true,
    ...overrides,
  }
}

describe("describeLeadOrigin", () => {
  it.each([
    ["youtube", "dQw4w9WgXcQ", "YouTube comment", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["reddit", "1fz0abc", "Reddit comment", "https://www.reddit.com/comments/1fz0abc/"],
    ["instagram", "C9xYz12AbCd", "Instagram comment", "https://www.instagram.com/p/C9xYz12AbCd/"],
    ["linkedin", "7234567890123456789", "LinkedIn comment", "https://www.linkedin.com/feed/update/urn:li:activity:7234567890123456789/"],
    ["x", "1834567890123456789", "X comment", "https://x.com/i/web/status/1834567890123456789"],
  ])("names a %s comment lead and links to the thread", (source, content, label, href) => {
    expect(describeLeadOrigin(origin({ source, content }))).toEqual({ label, href })
  })

  it("adds the subreddit for a Reddit comment", () => {
    expect(describeLeadOrigin(origin({ source: "reddit", content: "1fz0abc", term: "RealEstate" }))?.label).toBe(
      "Reddit comment · r/RealEstate",
    )
  })

  it("has no link when the comment's thread is unknown or not linkable", () => {
    expect(describeLeadOrigin(origin({ source: "youtube", content: null }))).toEqual({ label: "YouTube comment" })
    expect(describeLeadOrigin(origin({ source: "tiktok", content: "7412345678901234567" }))).toEqual({ label: "TikTok comment" })
  })

  it("names the website for a comment on some other site", () => {
    expect(describeLeadOrigin(origin({ source: "sltrib.com" }))).toEqual({ label: "Comment on sltrib.com" })
  })

  it("never builds a link from a thread id that isn't a plain id", () => {
    expect(describeLeadOrigin(origin({ source: "youtube", content: "x\" onmouseover=\"alert(1)" }))?.href).toBeUndefined()
    expect(describeLeadOrigin(origin({ source: "reddit", content: "../../evil" }))?.href).toBeUndefined()
  })

  it("lists source, medium, and campaign for any other campaign", () => {
    expect(
      describeLeadOrigin(origin({ source: "instagram", medium: "social", campaign: "bio", fromComment: false })),
    ).toEqual({ label: "Instagram · social · bio" })
    expect(
      describeLeadOrigin(origin({ source: "google.com", medium: "organic", campaign: null, fromComment: false })),
    ).toEqual({ label: "google.com · organic" })
  })

  it("returns null when the lead has no origin", () => {
    expect(describeLeadOrigin(null)).toBeNull()
    expect(describeLeadOrigin(undefined)).toBeNull()
  })
})
