/**
 * Lease packet helpers for tenant/owner document views.
 *
 * Watch-for copy is stored on compliance_rules.description after a WATCH_FOR:
 * marker so it stays in sync with OndoREui/lib/resources/compliance-watch-for.ts
 * (public templates page — source of truth for marketing copy).
 */

export const WATCH_FOR_MARKER = "WATCH_FOR:"

export interface LeasePacketDocument {
  id: string
  name: string
  docType?: string
}

export function parseWatchForDescription(description: string): string[] {
  const idx = description.indexOf(WATCH_FOR_MARKER)
  const section = idx >= 0 ? description.slice(idx + WATCH_FOR_MARKER.length) : description
  return section
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter((line) => line.length > 0)
}

export function disclosureRulesFromUnknown(rows: unknown[]): Array<{
  id: string
  title: string
  description: string
}> {
  const out: Array<{ id: string; title: string; description: string }> = []
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue
    const o = row as Record<string, unknown>
    if (typeof o.id !== "string" || typeof o.title !== "string" || typeof o.description !== "string") {
      continue
    }
    if (o.ruleType !== undefined && o.ruleType !== "disclosure") continue
    out.push({ id: o.id, title: o.title, description: o.description })
  }
  return out
}

export function groupLeasePacketDocuments<T extends LeasePacketDocument>(docs: T[]): {
  addendums: T[]
  disclosures: T[]
  other: T[]
} {
  const addendums: T[] = []
  const disclosures: T[] = []
  const other: T[] = []
  for (const doc of docs) {
    if (doc.docType === "addendum") addendums.push(doc)
    else if (doc.docType === "disclosure") disclosures.push(doc)
    else other.push(doc)
  }
  return { addendums, disclosures, other }
}
