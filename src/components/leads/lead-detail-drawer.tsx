// src/components/leads/lead-detail-drawer.tsx
import { useEffect, useState } from "react";
import { featureApi } from "@/lib/api";
import type { LeadScore, SiteVisit } from "@/lib/api/clients/lead";
import { SiteVisitProposer } from "./site-visit-proposer";

interface Lead {
  id: string;
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  status: string;
  monthlyBudget?: string;
  moveInDate?: string;
  propertyTitle?: string;
}

interface Props {
  lead: Lead | null;
  onClose: () => void;
}

export function LeadDetailDrawer({ lead, onClose }: Props) {
  const [score, setScore] = useState<LeadScore | null>(null);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [showProposer, setShowProposer] = useState(false);

  useEffect(() => {
    if (!lead) return;
    featureApi.leads.getLeadScore(lead.id).then(setScore);
    featureApi.leads.getSiteVisits({ leadId: lead.id }).then(setVisits);
  }, [lead?.id]);

  if (!lead) return null;

  const BREAKDOWN_LABELS: Record<string, string> = {
    budget: "Budget match",
    urgency: "Move-in urgency",
    completeness: "Qualification completeness",
    quality: "Message quality",
    bonus: "Low-risk bonus",
    engagement: "Engagement signals",
  };

  // Max points differ by model: property (has budget+bonus) vs website (has engagement, higher quality cap)
  const isWebsite = !score?.breakdown?.budget && !score?.breakdown?.bonus;
  const BREAKDOWN_MAX: Record<string, number> = isWebsite
    ? { urgency: 30, completeness: 30, quality: 25, engagement: 15 }
    : { budget: 25, urgency: 25, completeness: 25, quality: 15, bonus: 10 };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/20" onClick={onClose} />
      <div className="relative w-[480px] bg-card h-full shadow-xl overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{lead.tenantName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Contact info */}
        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
          <p className="text-sm">{lead.tenantEmail} · {lead.tenantPhone}</p>
          {lead.propertyTitle && <p className="text-sm text-gray-500">{lead.propertyTitle}</p>}
          <p className="text-sm text-gray-500">Budget: ${lead.monthlyBudget} · Move-in: {lead.moveInDate}</p>
        </section>

        {/* Score */}
        {score ? (
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Lead Score</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                score.temperature === "HOT" ? "bg-red-100 text-red-700" :
                score.temperature === "WARM" ? "bg-amber-100 text-amber-700" :
                "bg-blue-100 text-blue-700"
              }`}>{score.temperature}</span>
              <span className="text-2xl font-bold">{score.score}<span className="text-sm font-normal text-gray-400">/100</span></span>
            </div>
            <div className="space-y-2">
              {Object.entries(score.breakdown).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                    <span>{BREAKDOWN_LABELS[key] ?? key}</span>
                    <span>{val}/{BREAKDOWN_MAX[key] ?? 25}</span>
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
        ) : (
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Lead Score</h3>
            <p className="text-sm text-gray-400">Qualification pending</p>
          </section>
        )}

        {/* Qualification answers */}
        {score?.qualificationAnswers && (
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Qualification Answers</h3>
            <dl className="space-y-1">
              {Object.entries(score.qualificationAnswers).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <dt className="text-gray-400 capitalize">{k.replace(/([A-Z])/g, " $1")}:</dt>
                  <dd className="text-gray-700">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Site visits */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Site Visits</h3>
            <button
              onClick={() => setShowProposer(true)}
              className="text-xs text-indigo-600 hover:underline"
            >+ Propose Visit</button>
          </div>
          {visits.length === 0 ? (
            <p className="text-sm text-gray-400">No visits scheduled yet.</p>
          ) : (
            <ul className="space-y-2">
              {visits.map((v) => (
                <li key={v.id} className="text-sm border rounded p-2">
                  <div className="flex justify-between">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      v.status === "confirmed" ? "bg-green-100 text-green-700" :
                      v.status === "proposed" ? "bg-yellow-100 text-yellow-700" :
                      "bg-muted text-gray-500"
                    }`}>{v.status}</span>
                    {v.scheduledAt && <span className="text-gray-500">{new Date(v.scheduledAt).toLocaleString()}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {showProposer && (
            <SiteVisitProposer
              leadId={lead.id}
              propertyId={lead.propertyId}
              leadEmail={lead.tenantEmail}
              onSuccess={(visit) => { setVisits((prev) => [...prev, visit]); setShowProposer(false); }}
              onCancel={() => setShowProposer(false)}
            />
          )}
        </section>
      </div>
    </div>
  );
}
