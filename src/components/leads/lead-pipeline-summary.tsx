import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { InboxLead } from "@/lib/api"
import { STALE_AFTER_DAYS, summarizeLeads } from "@/lib/lead-insights"
import { cn } from "@/lib/utils"

interface StatTileProps {
  label: string
  value: string
  hint?: string
  valueClass?: string
}

function StatTile({ label, value, hint, valueClass }: StatTileProps) {
  return (
    <div className="min-w-0" title={hint}>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
      <p className={cn("text-2xl font-semibold text-gray-900 dark:text-gray-100", valueClass)}>{value}</p>
    </div>
  )
}

interface LeadPipelineSummaryProps {
  leads: InboxLead[]
  /** Currently active source filter (normalized source value, e.g. "direct"). */
  activeSource?: string | null
  /** When set, source chips become toggle buttons that filter the board/list. */
  onSourceToggle?: (source: string) => void
}

/**
 * Headline numbers for the lead pipeline, derived from the leads currently in
 * view (so the active filters apply to it too), plus the top lead sources.
 * The source chips double as filters when `onSourceToggle` is provided.
 */
export function LeadPipelineSummary({ leads, activeSource, onSourceToggle }: LeadPipelineSummaryProps) {
  const summary = useMemo(() => summarizeLeads(leads, new Date(), 5), [leads])

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatTile label="In pipeline" value={String(summary.total)} />
          <StatTile label="New this week" value={String(summary.newThisWeek)} />
          <StatTile
            label="Unclaimed"
            value={String(summary.unclaimed)}
            valueClass={summary.unclaimed > 0 ? "text-orange-600 dark:text-orange-400" : undefined}
            hint="Waiting for a manager to claim them"
          />
          <StatTile
            label="Going stale"
            value={String(summary.stale)}
            valueClass={summary.stale > 0 ? "text-amber-600 dark:text-amber-400" : undefined}
            hint={`Active leads with no activity for ${STALE_AFTER_DAYS}+ days`}
          />
          <StatTile
            label="Converted"
            value={
              summary.conversionRate === null
                ? "—"
                : `${summary.converted} (${summary.conversionRate}%)`
            }
            hint="Share of leads in view that became clients"
          />
        </div>

        {summary.topSources.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Top sources:</span>
            {summary.topSources.map((s) => {
              const active = activeSource === s.source
              const chip = (
                <Badge
                  variant={active ? "default" : "outline"}
                  className={cn("text-xs font-normal", active && "bg-orange-500 hover:bg-orange-600 text-white")}
                >
                  {s.label}
                  <span className={cn("ml-1", active ? "text-orange-100" : "text-gray-500 dark:text-gray-400")}>
                    {s.count}
                  </span>
                </Badge>
              )
              return onSourceToggle ? (
                <button
                  key={s.source}
                  type="button"
                  onClick={() => onSourceToggle(s.source)}
                  aria-pressed={active}
                  aria-label={`${active ? "Clear filter" : "Filter leads"} by source ${s.label}`}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {chip}
                </button>
              ) : (
                <span key={s.source}>{chip}</span>
              )
            })}
            {activeSource && onSourceToggle ? (
              <button
                type="button"
                onClick={() => onSourceToggle(activeSource)}
                className="text-xs text-gray-500 dark:text-gray-400 underline underline-offset-2 ml-1"
              >
                Clear
              </button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
