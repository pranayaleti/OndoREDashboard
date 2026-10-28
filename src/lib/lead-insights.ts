/**
 * Derived lead-pipeline insights — pure helpers shared by the summary strip,
 * the board, and the list view. Everything is computed client-side from the
 * already-fetched inbox page, so no new API surface is needed.
 */

import { isUnclaimedLead, type InboxLead } from "@/lib/api/clients/lead"

/** An active-stage lead with no activity for this many days counts as stale. */
export const STALE_AFTER_DAYS = 7

const DAY_MS = 86_400_000

/** Stages where silence means the lead is going cold (vs. terminal stages). */
const ACTIVE_STAGES: ReadonlySet<string> = new Set(["new", "prospective", "contacted", "qualified"])

/** Whole days elapsed since an ISO timestamp; never negative, 0 on bad input. */
export function daysSince(iso: string, now: Date = new Date()): number {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 0
  return Math.max(0, Math.floor((now.getTime() - then) / DAY_MS))
}

export function isStaleLead(lead: InboxLead, now: Date = new Date()): boolean {
  return ACTIVE_STAGES.has(lead.status) && daysSince(lead.lastActivityAt, now) >= STALE_AFTER_DAYS
}

export function formatSourceLabel(source: string | null | undefined): string {
  if (!source) return "Direct"
  const cleaned = source.replace(/[-_]+/g, " ").trim()
  if (!cleaned) return "Direct"
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export interface LeadSourceCount {
  source: string
  label: string
  count: number
}

export interface LeadSummary {
  total: number
  /** Leads created within the last 7 days. */
  newThisWeek: number
  unclaimed: number
  stale: number
  converted: number
  /** Converted share of the pipeline, 0–100; null when there are no leads. */
  conversionRate: number | null
  /** Most common sources, descending by count (ties break alphabetically). */
  topSources: LeadSourceCount[]
}

export function summarizeLeads(
  leads: InboxLead[],
  now: Date = new Date(),
  topSourceLimit = 3,
): LeadSummary {
  let newThisWeek = 0
  let unclaimed = 0
  let stale = 0
  let converted = 0
  const bySource = new Map<string, number>()

  for (const lead of leads) {
    if (daysSince(lead.createdAt, now) < 7) newThisWeek++
    if (isUnclaimedLead(lead)) unclaimed++
    if (isStaleLead(lead, now)) stale++
    if (lead.status === "converted") converted++
    const source = lead.source ?? "direct"
    bySource.set(source, (bySource.get(source) ?? 0) + 1)
  }

  const topSources = [...bySource.entries()]
    .sort(([aSource, aCount], [bSource, bCount]) => bCount - aCount || aSource.localeCompare(bSource))
    .slice(0, topSourceLimit)
    .map(([source, count]) => ({ source, label: formatSourceLabel(source), count }))

  return {
    total: leads.length,
    newThisWeek,
    unclaimed,
    stale,
    converted,
    conversionRate: leads.length === 0 ? null : Math.round((converted / leads.length) * 100),
    topSources,
  }
}
