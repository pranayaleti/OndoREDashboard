/**
 * Renders a role-shaped screening view (scorecard / full / status).
 */

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
  XCircle,
} from "lucide-react"
import {
  screeningApi,
  type CreditScoreBand,
  type ScreeningRecommendation,
  type ScreeningViewResponse,
} from "@/lib/api/clients/screening"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

function recommendationBadge(recommendation: ScreeningRecommendation | null | undefined) {
  if (!recommendation) return null
  switch (recommendation) {
    case "approved":
      return (
        <Badge className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    case "conditional":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Conditional
        </Badge>
      )
    case "denied":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Denied
        </Badge>
      )
    default: {
      const _exhaustive: never = recommendation
      return <Badge variant="outline">{_exhaustive}</Badge>
    }
  }
}

function bandLabel(band: CreditScoreBand): string {
  if (band === "unavailable") return "Credit band unavailable"
  return `Credit band ${band}`
}

function Chip({
  label,
  ok,
}: {
  label: string
  ok: boolean
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        ok
          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
          : "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-200"
      )}
    >
      {label}: {ok ? "Clear" : "Flagged"}
    </Badge>
  )
}

export interface ScreeningViewCardProps {
  view: ScreeningViewResponse
  /** Allow manager to edit owner note (full view only). */
  allowOwnerNoteEdit?: boolean
  onUpdated?: (next: ScreeningViewResponse) => void
  className?: string
}

export function ScreeningViewCard({
  view,
  allowOwnerNoteEdit = false,
  onUpdated,
  className,
}: ScreeningViewCardProps) {
  const { toast } = useToast()
  const [note, setNote] = useState(view.view === "status" ? "" : (view.ownerNote ?? ""))
  const [saving, setSaving] = useState(false)

  if (view.view === "status") {
    return (
      <div className={cn("space-y-3 text-sm", className)}>
        <p className="text-muted-foreground">
          Screening is incomplete or only status is available in this portal.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <span className="text-muted-foreground">Status</span>
          <span className="capitalize">{view.status.replace("_", " ")}</span>
          <span className="text-muted-foreground">Portable</span>
          <span>{view.isPortable ? "Yes" : "No"}</span>
          {view.completedAt && (
            <>
              <span className="text-muted-foreground">Completed</span>
              <span>{new Date(view.completedAt).toLocaleString()}</span>
            </>
          )}
          {view.expiresAt && (
            <>
              <span className="text-muted-foreground">Expires</span>
              <span>{new Date(view.expiresAt).toLocaleString()}</span>
            </>
          )}
        </div>
      </div>
    )
  }

  const saveNote = async () => {
    setSaving(true)
    try {
      const next = await screeningApi.updateOwnerNote(view.id, note.slice(0, 500))
      toast({ title: "Owner note saved" })
      onUpdated?.(next)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save owner note"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (view.view === "scorecard") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex flex-wrap items-center gap-2">
          {recommendationBadge(view.recommendation)}
          <Badge variant="outline">{bandLabel(view.creditScoreBand)}</Badge>
          <Badge variant="outline" className="capitalize">
            {view.status.replace("_", " ")}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip label="Criminal" ok={!view.hasCriminal} />
          <Chip label="Eviction" ok={!view.hasEviction} />
          <Badge
            variant="outline"
            className={
              view.incomeVerified
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
                : "border-slate-300 bg-muted text-muted-foreground"
            }
          >
            Income: {view.incomeVerified ? "Verified" : "Not verified"}
          </Badge>
        </div>
        {view.ownerNote ? (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Manager note</p>
            <p>{view.ownerNote}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No manager note yet.</p>
        )}
        {(view.completedAt || view.expiresAt) && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {view.completedAt && (
              <>
                <span className="text-muted-foreground">Completed</span>
                <span>{new Date(view.completedAt).toLocaleString()}</span>
              </>
            )}
            {view.expiresAt && (
              <>
                <span className="text-muted-foreground">Reusable until</span>
                <span>{new Date(view.expiresAt).toLocaleString()}</span>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // full view
  const income = view.incomeVerification as
    | { monthlyIncome?: number; employerVerified?: boolean }
    | null
    | undefined

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {recommendationBadge(view.recommendation)}
        <Badge variant="outline">{bandLabel(view.creditScoreBand)}</Badge>
        <Badge variant="outline" className="capitalize">
          {view.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="space-y-1 text-sm">
        {view.creditScore != null && <p>Credit score: {view.creditScore}</p>}
        {view.backgroundCheck && (
          <p className="text-muted-foreground">
            Background:{" "}
            {view.backgroundCheck.summary ??
              (view.backgroundCheck.hasCriminal || view.backgroundCheck.hasEviction
                ? "Adverse records"
                : "No adverse records")}
          </p>
        )}
        {income && typeof income.monthlyIncome === "number" && (
          <p className="text-muted-foreground">
            Income: ${income.monthlyIncome.toLocaleString()}/mo
            {income.employerVerified ? " (employer verified)" : ""}
          </p>
        )}
      </div>

      {view.reportUrl ? (
        <a
          href={view.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary underline"
        >
          Open report
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">No full report link available.</p>
      )}

      {allowOwnerNoteEdit ? (
        <div className="space-y-2 border-t pt-4">
          <Label htmlFor={`owner-note-${view.id}`}>Owner note (shown on owner scorecard)</Label>
          <Textarea
            id={`owner-note-${view.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={3}
            maxLength={500}
            placeholder="Short note for the property owner…"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{note.length}/500</span>
            <Button size="sm" onClick={saveNote} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save note
            </Button>
          </div>
        </div>
      ) : view.ownerNote ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Owner note</p>
          <p>{view.ownerNote}</p>
        </div>
      ) : null}
    </div>
  )
}

export { recommendationBadge }
