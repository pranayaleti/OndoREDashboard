import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GripVertical, Mail, Building } from "lucide-react"
import {
  type InboxLead,
  type LeadInboxStatus,
  isUnclaimedLead,
  formatInquiryTypeLabel,
} from "@/lib/api"
import { LEAD_STAGES, groupLeadsByStage, canMoveLead } from "@/lib/lead-stages"
import { daysSince, isStaleLead } from "@/lib/lead-insights"
import { LeadOriginText } from "./lead-origin-text"
import { formatUSDate } from "@/lib/us-format"
import { cn } from "@/lib/utils"

function TemperatureChip({ temperature }: { temperature?: "HOT" | "WARM" | "COLD" }) {
  if (!temperature) return null
  const styles = {
    HOT: "bg-red-100 text-red-700 border border-red-200",
    WARM: "bg-amber-100 text-amber-700 border border-amber-200",
    COLD: "bg-blue-100 text-blue-700 border border-blue-200",
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[temperature]}`}>
      {temperature}
    </span>
  )
}

interface LeadPipelineBoardProps {
  leads: InboxLead[]
  userId: string | undefined
  onMove: (lead: InboxLead, status: LeadInboxStatus) => void
  onSelect: (lead: InboxLead) => void
  onClaim: (lead: InboxLead) => void
}

/**
 * Kanban-style lead pipeline. Drag a card between stage columns to retag the
 * lead; the compact stage select on each card is the keyboard-accessible way
 * to do the same. Only leads claimed by the signed-in manager can move —
 * unclaimed cards show Claim instead.
 */
export function LeadPipelineBoard({ leads, userId, onMove, onSelect, onClaim }: LeadPipelineBoardProps) {
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [dropStage, setDropStage] = useState<LeadInboxStatus | null>(null)

  const grouped = useMemo(() => groupLeadsByStage(leads), [leads])
  const leadByKey = useMemo(() => new Map(leads.map((l) => [`${l.kind}:${l.id}`, l])), [leads])

  const finishDrag = () => {
    setDragKey(null)
    setDropStage(null)
  }

  const handleDrop = (stage: LeadInboxStatus) => {
    const lead = dragKey ? leadByKey.get(dragKey) : null
    finishDrag()
    if (lead && lead.status !== stage) onMove(lead, stage)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Lead pipeline stages">
      {LEAD_STAGES.map((stage) => {
        const column = grouped.get(stage.value) ?? []
        const isDropTarget = dropStage === stage.value && dragKey !== null
        return (
          <div
            key={stage.value}
            role="listitem"
            className={cn(
              "flex flex-col w-72 shrink-0 rounded-lg border bg-muted/40 dark:bg-card/40 transition-colors",
              isDropTarget && "border-orange-400 bg-orange-50 dark:bg-orange-900/20",
            )}
            onDragOver={(e) => {
              e.preventDefault()
              if (dropStage !== stage.value) setDropStage(stage.value)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropStage(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              handleDrop(stage.value)
            }}
          >
            <div className={cn("h-1 rounded-t-lg", stage.accentClass)} />
            <div className="flex items-center justify-between px-3 py-2">
              <div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stage.label}</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{stage.hint}</p>
              </div>
              <Badge variant="secondary" className="ml-2 shrink-0">{column.length}</Badge>
            </div>

            <div className="flex-1 space-y-2 px-2 pb-2 min-h-24">
              {column.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">No leads here</p>
              ) : (
                column.map((lead) => {
                  const key = `${lead.kind}:${lead.id}`
                  const unclaimed = isUnclaimedLead(lead)
                  const movable = canMoveLead(lead, userId)
                  return (
                    <div
                      key={key}
                      draggable={movable}
                      onDragStart={() => setDragKey(key)}
                      onDragEnd={finishDrag}
                      onClick={() => onSelect(lead)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onSelect(lead)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${lead.name}, ${stage.label} lead`}
                      className={cn(
                        "rounded-md border bg-white dark:bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                        movable && "cursor-grab active:cursor-grabbing",
                        dragKey === key && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        {movable ? (
                          <GripVertical className="h-4 w-4 mt-0.5 text-gray-300 dark:text-gray-600 shrink-0" aria-hidden="true" />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{lead.name}</span>
                            <TemperatureChip temperature={lead.score?.temperature} />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                            <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {lead.kind === "property" ? "Property" : "Website"}
                        </Badge>
                        {lead.inquiryType ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {formatInquiryTypeLabel(lead.inquiryType)}
                          </Badge>
                        ) : null}
                        {lead.overdueTaskCount > 0 ? (
                          <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                            {lead.overdueTaskCount} overdue
                          </Badge>
                        ) : null}
                        {isStaleLead(lead) ? (
                          <Badge
                            className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                            title={`No activity for ${daysSince(lead.lastActivityAt)} days`}
                          >
                            Stale {daysSince(lead.lastActivityAt)}d
                          </Badge>
                        ) : null}
                      </div>

                      {lead.propertyTitle ? (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                          <Building className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{lead.propertyTitle}</span>
                        </div>
                      ) : null}

                      <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                        {lead.origin ? (
                          <LeadOriginText origin={lead.origin} />
                        ) : (
                          <span>Source: {lead.source ?? "—"}</span>
                        )}
                      </div>

                      <div
                        className="mt-2 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {formatUSDate(lead.lastActivityAt)}
                        </span>
                        {unclaimed ? (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => onClaim(lead)}
                          >
                            Claim
                          </Button>
                        ) : movable ? (
                          <Select
                            value={lead.status}
                            onValueChange={(next) => onMove(lead, next as LeadInboxStatus)}
                          >
                            <SelectTrigger
                              className="h-7 w-32 text-xs"
                              aria-label={`Change stage for ${lead.name}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STAGES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
