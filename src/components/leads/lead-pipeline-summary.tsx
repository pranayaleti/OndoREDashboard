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

/**
 * Headline numbers for the lead pipeline, derived from the leads currently in
 * view (so the active filters apply to it too), plus the top lead sources.
 */
export function LeadPipelineSummary({ leads }: { leads: InboxLead[] }) {
  const summary = useMemo(() => summarizeLeads(leads), [leads])

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
            {summary.topSources.map((s) => (
              <Badge key={s.source} variant="outline" className="text-xs font-normal">
                {s.label}
                <span className="ml-1 text-gray-500 dark:text-gray-400">{s.count}</span>
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
