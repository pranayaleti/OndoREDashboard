// src/components/leads/site-visit-proposer.tsx
import { useState } from "react";
import { featureApi } from "@/lib/api";
import type { SiteVisit } from "@/lib/api/clients/lead";

interface Props {
  leadId: string;
  propertyId: string;
  leadEmail: string;
  onSuccess: (visit: SiteVisit) => void;
  onCancel: () => void;
}

export function SiteVisitProposer({ leadId, propertyId, leadEmail, onSuccess, onCancel }: Props) {
  const [slots, setSlots] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addSlot = () => { if (slots.length < 3) setSlots((s) => [...s, ""]); };
  const removeSlot = (i: number) => setSlots((s) => s.filter((_, j) => j !== i));
  const setSlot = (i: number, val: string) => setSlots((s) => s.map((v, j) => j === i ? val : v));

  const submit = async () => {
    const validSlots = slots.filter((s) => s.trim());
    if (validSlots.length === 0) { setError("Add at least one time slot."); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await featureApi.leads.proposeSiteVisit({ leadId, propertyId, proposedSlots: validSlots, notes: notes || undefined });
      setSuccess(true);
      onSuccess({ id: result.id, leadId, propertyId, status: "proposed", proposedSlots: validSlots, scheduledAt: null, slotIndex: null, notes: notes || null, createdAt: new Date().toISOString() });
    } catch {
      setError("Failed to propose visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
        ✓ Confirmation email sent to {leadEmail}
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 border rounded-lg bg-gray-50 space-y-3">
      <h4 className="text-sm font-medium">Propose Visit Times</h4>
      {slots.map((slot, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="datetime-local"
            value={slot}
            onChange={(e) => setSlot(i, e.target.value)}
            className="flex-1 text-sm border rounded px-2 py-1"
          />
          {slots.length > 1 && (
            <button onClick={() => removeSlot(i)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
          )}
        </div>
      ))}
      {slots.length < 3 && (
        <button onClick={addSlot} className="text-xs text-indigo-600 hover:underline">+ Add another time</button>
      )}
      <textarea
        placeholder="Optional notes for the lead..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full text-sm border rounded px-2 py-1 resize-none"
        rows={2}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading}
          className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send to Lead"}
        </button>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </div>
  );
}
