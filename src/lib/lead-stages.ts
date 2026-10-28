/**
 * Lead pipeline stages — single ordered definition shared by the pipeline
 * board, the list view, and the status filters. Order matches the
 * `lead_status` Postgres enum in Supabase (the source of truth).
 */

import type { InboxLead, LeadInboxStatus } from "@/lib/api/clients/lead"

export interface LeadStage {
  value: LeadInboxStatus
  label: string
  /** Short hint shown in the column header tooltip / empty column. */
  hint: string
  /** Badge classes (list view + card chip). */
  badgeClass: string
  /** Column accent bar at the top of a board column. */
  accentClass: string
}

export const LEAD_STAGES: readonly LeadStage[] = [
  {
    value: "new",
    label: "New",
    hint: "Just arrived — triage them",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    accentClass: "bg-blue-500",
  },
  {
    value: "prospective",
    label: "Prospective",
    hint: "Worth pursuing — not contacted yet",
    badgeClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    accentClass: "bg-cyan-500",
  },
  {
    value: "contacted",
    label: "Contacted",
    hint: "Outreach made — waiting on them",
    badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    accentClass: "bg-yellow-500",
  },
  {
    value: "qualified",
    label: "Qualified",
    hint: "Fit confirmed — move to tour/application",
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    accentClass: "bg-green-500",
  },
  {
    value: "converted",
    label: "Converted",
    hint: "Became a client",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    accentClass: "bg-purple-500",
  },
  {
    value: "closed",
    label: "Closed",
    hint: "No longer active",
    badgeClass: "bg-muted text-gray-800 dark:bg-card dark:text-gray-200",
    accentClass: "bg-gray-400",
  },
] as const

const STAGE_BY_VALUE = new Map(LEAD_STAGES.map((s) => [s.value, s]))

export function getLeadStage(status: string): LeadStage {
  return STAGE_BY_VALUE.get(status as LeadInboxStatus) ?? LEAD_STAGES[LEAD_STAGES.length - 1]
}

export function getStageBadgeClass(status: string): string {
  return getLeadStage(status).badgeClass
}

/** Group leads into board columns, keeping the stage order. Within a column,
 * the most recently active lead comes first. */
export function groupLeadsByStage(leads: InboxLead[]): Map<LeadInboxStatus, InboxLead[]> {
  const grouped = new Map<LeadInboxStatus, InboxLead[]>(LEAD_STAGES.map((s) => [s.value, []]))
  for (const lead of leads) {
    const bucket = grouped.get(lead.status as LeadInboxStatus)
    if (bucket) bucket.push(lead)
    else grouped.get("closed")!.push(lead)
  }
  for (const bucket of grouped.values()) {
    bucket.sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt))
  }
  return grouped
}

/**
 * Only the owning manager may move a lead (the status API updates rows
 * matching `manager_id = userId`); unclaimed leads must be claimed first.
 */
export function canMoveLead(lead: InboxLead, userId: string | undefined): boolean {
  return Boolean(userId) && lead.managerId === userId
}
