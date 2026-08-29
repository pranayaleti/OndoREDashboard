"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  leaseTemplatesApi,
  type LeaseTemplateKind,
  type LeaseTemplateRecord,
} from "@/lib/api/clients/lease-templates"

const KIND_LABELS: Record<LeaseTemplateKind, string> = {
  base_lease: "Lease",
  addendum: "Addendum",
  disclosure: "Disclosure",
  other: "Other",
}

const ALL = "all"

/** Shown on draft/sample banners. Keep in sync with SAMPLE lease-template SQL copy. */
const SAMPLE_REFERENCE_NOTE =
  "This is a sample for reference only. It is not a binding form and must be reviewed through appropriate legal channels (a licensed attorney for the applicable state) before it can be approved or used."

function isSample(template: LeaseTemplateRecord): boolean {
  const hay = `${template.name} ${template.description ?? ""}`.toLowerCase()
  return hay.includes("sample") || hay.includes("not for use") || template.status !== "approved"
}

export function LeaseTemplatePicker() {
  const [templates, setTemplates] = useState<LeaseTemplateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stateFilter, setStateFilter] = useState(ALL)
  const [kindFilter, setKindFilter] = useState(ALL)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await leaseTemplatesApi.list()
        setTemplates(rows)
      } catch {
        setTemplates([])
        setError(
          "Approved templates could not be loaded. Draft samples stay hidden until they are reviewed through appropriate legal channels.",
        )
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const states = useMemo(() => {
    const codes = [...new Set(templates.map((t) => t.state).filter((s): s is string => Boolean(s)))]
    return codes.sort((a, b) => {
      if (a === "UT") return -1
      if (b === "UT") return 1
      return a.localeCompare(b)
    })
  }, [templates])

  const visible = useMemo(() => {
    return templates.filter((t) => {
      if (stateFilter !== ALL && t.state !== stateFilter) return false
      if (kindFilter !== ALL && t.kind !== kindFilter) return false
      return true
    })
  }, [templates, stateFilter, kindFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, LeaseTemplateRecord[]>()
    for (const t of visible) {
      const key = t.state ?? "Generic"
      const list = map.get(key) ?? []
      list.push(t)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "UT") return -1
      if (b === "UT") return 1
      return a.localeCompare(b)
    })
  }, [visible])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lease templates</CardTitle>
        <CardDescription>
          Approved packets grouped by state and kind. Drafts and samples do not appear here until
          staff marks them approved after legal review. {SAMPLE_REFERENCE_NOTE}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="lease-template-state">State</Label>
            <select
              id="lease-template-state"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value={ALL}>All states</option>
              {states.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label htmlFor="lease-template-kind">Kind</Label>
            <select
              id="lease-template-kind"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
            >
              <option value={ALL}>All kinds</option>
              {(Object.keys(KIND_LABELS) as LeaseTemplateKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading approved templates…</p>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No approved templates match these filters.
          </p>
        ) : (
          grouped.map(([state, rows]) => (
            <div key={state} className="space-y-2">
              <p className="text-sm font-medium">{state}</p>
              <ul className="space-y-2">
                {rows.map((t) => (
                  <li key={t.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{t.name}</p>
                      <Badge variant="outline">{KIND_LABELS[t.kind]}</Badge>
                      {isSample(t) ? (
                        <Badge variant="secondary">Sample — for reference only</Badge>
                      ) : (
                        <Badge variant="secondary">Approved</Badge>
                      )}
                    </div>
                    {t.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                    ) : null}
                    {isSample(t) &&
                    !(t.description ?? "").toLowerCase().includes("for reference only") ? (
                      <p className="mt-1 text-sm text-muted-foreground">{SAMPLE_REFERENCE_NOTE}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
