/** Where a website lead came from — `origin` on inbox leads (OndoREBackend leadInboxHelpers.leadOrigin). */
export type LeadOrigin = {
  source: string
  medium: string | null
  campaign: string | null
  content: string | null
  term: string | null
  landingPath: string | null
  /** Arrived through a tagged social-comment link from the wire desk. */
  fromComment: boolean
}

const PLATFORM_NAMES: Record<string, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business_profile: "Google Business Profile",
}

// Only a plain platform id ever goes into a link.
const THREAD_ID = /^[\w-]{1,64}$/

const THREAD_URL: Partial<Record<string, (id: string) => string>> = {
  youtube: (id) => `https://www.youtube.com/watch?v=${id}`,
  reddit: (id) => `https://www.reddit.com/comments/${id}/`,
  instagram: (id) => `https://www.instagram.com/p/${id}/`,
  linkedin: (id) => `https://www.linkedin.com/feed/update/urn:li:activity:${id}/`,
  x: (id) => `https://x.com/i/web/status/${id}`,
}

export function describeLeadOrigin(origin: LeadOrigin | null | undefined): { label: string; href?: string } | null {
  if (!origin) return null
  const platform = PLATFORM_NAMES[origin.source]
  if (origin.fromComment) {
    if (!platform) return { label: `Comment on ${origin.source}` }
    const community = origin.source === "reddit" && origin.term ? ` · r/${origin.term}` : ""
    const label = `${platform} comment${community}`
    const link = THREAD_URL[origin.source]
    return origin.content && link && THREAD_ID.test(origin.content) ? { label, href: link(origin.content) } : { label }
  }
  return { label: [platform ?? origin.source, origin.medium, origin.campaign].filter(Boolean).join(" · ") }
}
