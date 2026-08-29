import { useEffect, useRef, useState } from "react";
import { featureApi, leadApi, isUnclaimedLead, isQueueConvert, type InboxLead, type LeadWorkEvent, type ActivityType, type DuplicateHint } from "@/lib/api";
import { propertyApi } from "@/lib/api/clients/property";
import type { LeadScore, SiteVisit } from "@/lib/api/clients/lead";
import { SiteVisitProposer } from "./site-visit-proposer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatUSDate, formatUSPhone } from "@/lib/us-format";

interface Props {
  lead: InboxLead | null;
  onClose: () => void;
  onChanged?: () => void;
}

const ACTIVITY_TYPES: ActivityType[] = ["note", "call", "email", "task"];

export function LeadDetailDrawer({ lead, onClose, onChanged }: Props) {
  const [score, setScore] = useState<LeadScore | null>(null);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [events, setEvents] = useState<LeadWorkEvent[]>([]);
  const [showProposer, setShowProposer] = useState(false);
  const [occupancy, setOccupancy] = useState<"vacant" | "occupied" | "hidden" | "unknown">("unknown");
  const [activityType, setActivityType] = useState<ActivityType>("note");
  const [activityBody, setActivityBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [duplicateHint, setDuplicateHint] = useState<DuplicateHint[]>([]);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!lead) return;
    setDuplicateHint([]);
    if (lead.kind === "website") {
      featureApi.leads.getWebsiteLeadScore(lead.id).then(setScore);
      if (lead.propertyId) {
        featureApi.leads.getSiteVisits({ leadId: lead.id, kind: "website" }).then(setVisits).catch(() => setVisits([]));
      }
    } else {
      featureApi.leads.getLeadScore(lead.id).then(setScore);
      featureApi.leads.getSiteVisits({ leadId: lead.id }).then(setVisits);
    }
    if (lead.propertyId) {
      propertyApi
        .getProperty(lead.propertyId)
        .then((res) => {
          const status = res.property.status;
          if (status === "approved") setOccupancy("vacant");
          else if (status === "occupied") setOccupancy("occupied");
          else setOccupancy("hidden");
        })
        .catch(() => setOccupancy("unknown"));
    } else {
      setOccupancy("unknown");
    }
    leadApi.getActivities(lead.kind, lead.id).then(setEvents).catch(() => setEvents([]));
    leadApi
      .getLead(lead.kind, lead.id)
      .then((res) => setDuplicateHint(res.duplicateHint))
      .catch(() => setDuplicateHint([]));
    setPropertyId(lead.propertyId ?? "");
  }, [lead?.id, lead?.kind]);

  useEffect(() => {
    if (!lead) return;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lead?.id, onClose]);

  if (!lead) return null;
  const current = lead;

  const unclaimed = isUnclaimedLead(lead);
  const queueConvert = isQueueConvert(lead);

  const BREAKDOWN_LABELS: Record<string, string> = {
    budget: "Budget match",
    urgency: "Move-in urgency",
    completeness: "Qualification completeness",
    quality: "Message quality",
    bonus: "Low-risk bonus",
    engagement: "Engagement signals",
  };
  const isWebsite = !score?.breakdown?.budget && !score?.breakdown?.bonus;
  const BREAKDOWN_MAX: Record<string, number> = isWebsite
    ? { urgency: 30, completeness: 30, quality: 25, engagement: 15 }
    : { budget: 25, urgency: 25, completeness: 25, quality: 15, bonus: 10 };

  async function refreshActivities() {
    const next = await leadApi.getActivities(current.kind, current.id);
    setEvents(next);
    onChanged?.();
  }

  async function handleAddActivity() {
    setSaving(true);
    try {
      await leadApi.addActivity(current.kind, current.id, {
        type: activityType,
        body: activityBody,
        ...(activityType === "task" ? { dueAt: new Date(dueAt).toISOString() } : {}),
      });
      setActivityBody("");
      setDueAt("");
      await refreshActivities();
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(eventId: string) {
    await leadApi.completeTask(current.kind, current.id, eventId, new Date().toISOString());
    await refreshActivities();
  }

  async function handleConvert(outcome?: "converted" | "closed") {
    setSaving(true);
    try {
      await leadApi.convertLead(current.kind, current.id, {
        outcome,
        propertyId: propertyId || undefined,
      });
      await refreshActivities();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/20" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className="relative w-[480px] bg-card h-full shadow-xl overflow-y-auto p-6 flex flex-col gap-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detail-title"
      >
        <div className="flex items-center justify-between">
          <h2 id="lead-detail-title" className="text-lg font-semibold">
            {lead.name}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close lead details"
          >
            ✕
          </button>
        </div>

        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
          <p className="text-sm">
            {lead.email}
            {lead.phone ? ` · ${formatUSPhone(lead.phone)}` : ""}
          </p>
          {lead.propertyTitle ? <p className="text-sm text-gray-500">{lead.propertyTitle}</p> : null}
          <p className="text-sm text-gray-500">Last activity: {formatUSDate(lead.lastActivityAt)}</p>
          {lead.overdueTaskCount > 0 ? (
            <p className="text-sm text-orange-700">{lead.overdueTaskCount} overdue task{lead.overdueTaskCount === 1 ? "" : "s"}</p>
          ) : null}
          {duplicateHint.length > 0 ? (
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-2" role="status">
              Another inbox lead uses this email
              {duplicateHint.length === 1
                ? `: ${duplicateHint[0].name}`
                : ` (${duplicateHint.length} others)`}
              . This is a warning only — leads are not merged.
            </p>
          ) : null}
        </section>

        {score ? (
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Lead Score</h3>
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  score.temperature === "HOT"
                    ? "bg-red-100 text-red-700"
                    : score.temperature === "WARM"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {score.temperature}
              </span>
              <span className="text-2xl font-bold">
                {score.score}
                <span className="text-sm font-normal text-gray-400">/100</span>
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(score.breakdown).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                    <span>{BREAKDOWN_LABELS[key] ?? key}</span>
                    <span>
                      {val}/{BREAKDOWN_MAX[key] ?? 25}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(val / (BREAKDOWN_MAX[key] ?? 25)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Activity</h3>
          {events.length === 0 ? (
            <p className="text-sm text-gray-400 mb-3">No activity yet.</p>
          ) : (
            <ul className="space-y-2 mb-3">
              {events.map((event) => (
                <li key={event.id} className="text-sm border rounded p-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium capitalize">{event.type}</span>
                    <span className="text-xs text-gray-500">{formatUSDate(event.occurredAt)}</span>
                  </div>
                  {event.body ? <p className="text-gray-700 mt-1 whitespace-pre-wrap">{event.body}</p> : null}
                  {event.type === "task" && event.dueAt ? (
                    <p className="text-xs text-gray-500 mt-1">Due {formatUSDate(event.dueAt)}</p>
                  ) : null}
                  {event.type === "task" && !event.completedAt && !unclaimed ? (
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => void handleComplete(event.id)}>
                      Complete task
                    </Button>
                  ) : null}
                  {event.completedAt ? <p className="text-xs text-green-700 mt-1">Completed</p> : null}
                </li>
              ))}
            </ul>
          )}

          {!unclaimed ? (
            <div className="space-y-2">
              <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={activityBody}
                onChange={(e) => setActivityBody(e.target.value)}
                placeholder="Add a note, call log, email, or task"
                rows={3}
              />
              {activityType === "task" ? (
                <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              ) : null}
              <Button
                size="sm"
                disabled={saving || !activityBody.trim() || (activityType === "task" && !dueAt)}
                onClick={() => void handleAddActivity()}
              >
                Save activity
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Claim this lead to add notes, calls, emails, or tasks.</p>
          )}
        </section>

        {!unclaimed ? (
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Convert</h3>
            {lead.kind === "website" && lead.inquiryType === "renter" && !lead.propertyId ? (
              <Input
                className="mb-2"
                placeholder="Property ID"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              />
            ) : null}
            {queueConvert ? (
              <div className="flex gap-2">
                <Button size="sm" disabled={saving} onClick={() => void handleConvert("converted")}>
                  Mark converted
                </Button>
                <Button size="sm" variant="outline" disabled={saving} onClick={() => void handleConvert("closed")}>
                  Close
                </Button>
              </div>
            ) : (
              <Button size="sm" disabled={saving} onClick={() => void handleConvert("converted")}>
                Convert
              </Button>
            )}
          </section>
        ) : null}

        {lead.propertyId ? (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Site Visits</h3>
              {occupancy !== "vacant" ? (
                <button onClick={() => setShowProposer(true)} className="text-xs text-indigo-600 hover:underline">
                  + Propose Visit
                </button>
              ) : null}
            </div>
            {occupancy === "vacant" ? (
              <p className="text-sm text-gray-500 mb-2">Prospects self-schedule from the listing calendar.</p>
            ) : null}
            {visits.length === 0 ? (
              <p className="text-sm text-gray-400">No visits scheduled yet.</p>
            ) : (
              <ul className="space-y-2">
                {visits.map((v) => (
                  <li key={v.id} className="text-sm border rounded p-2">
                    <div className="flex justify-between">
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          v.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : v.status === "proposed"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-muted text-gray-500"
                        }`}
                      >
                        {v.status}
                      </span>
                      {v.scheduledAt && (
                        <span className="text-gray-500">{new Date(v.scheduledAt).toLocaleString()}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {showProposer ? (
              <SiteVisitProposer
                leadId={lead.id}
                propertyId={lead.propertyId}
                leadEmail={lead.email}
                occupancy={occupancy}
                leadKind={lead.kind}
                onSuccess={(visit) => {
                  setVisits((prev) => [...prev, visit]);
                  setShowProposer(false);
                }}
                onCancel={() => setShowProposer(false)}
              />
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
