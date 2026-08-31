import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { featureApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ApplicationTimeline, type TimelineEvent } from "@/components/rental/application-timeline"

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  required: "Required",
  uploaded: "Uploaded",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
}

const DECISIONS = [
  { value: "approved", label: "Approve" },
  { value: "conditionally_approved", label: "Conditionally approve" },
  { value: "denied", label: "Deny" },
] as const

export type ReviewBundle = {
  application: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    status: string
    statusLabel?: string
    completionPercent: number
    ownerNotes?: string | null
    assignedReviewerId?: string | null
    assignedReviewerName?: string | null
    wizardPayload?: Record<string, unknown>
    applicantNextAction?: string | null
  }
  property?: { title?: string; address?: string }
  checklist?: Array<{ type: string; label: string; required: boolean; isComplete: boolean; status: string }>
  documents?: Array<{
    id: string
    fileName: string
    documentType: string
    status: string
    uploadedAt?: string
    expiresAt?: string | null
    uploadedBy?: string | null
    url?: string
    reviewNotes?: string | null
  }>
  events?: TimelineEvent[]
  coApplicants?: Array<{ firstName: string; lastName: string; email?: string; status: string; completionPercent: number }>
  fullyComplete?: boolean
  insurance?: { status: string; label: string }
  petFees?: { chargeablePetCount: number; assistanceAnimalCount: number; extraDepositCents: number; monthlyPetRentCents: number }
  screening?: { configured: boolean; status?: string; statusLabel?: string; summary: string }
  signature?: { configured: boolean; status?: string; statusLabel?: string; summary: string }
  verification?: {
    configured: boolean
    status?: string
    statusLabel?: string
    summary: string
    checks?: Array<{ type: string; status: string; statusLabel: string }>
  }
  paymentProvider?: { configured: boolean; status?: string; statusLabel?: string; summary: string }
  payments?: Array<{
    id: string
    amountCents: number
    statusLabel: string
    paymentType: string
    transactionId?: string | null
    createdAt: string
  }>
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function money(cents: number | null | undefined): string {
  if (cents == null) return "—"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)
}

export function ManagerReviewPanel({
  bundle,
  onRefresh,
  onBack,
}: {
  bundle: ReviewBundle
  onRefresh: () => Promise<void>
  onBack: () => void
}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const app = bundle.application
  const payload = asRecord(app.wizardPayload)
  const applicant = asRecord(payload.applicant)
  const household = asRecord(payload.household)
  const occupants = Array.isArray(household.occupants) ? household.occupants : []
  const employment = asRecord(payload.employment)
  const jobs = Array.isArray(employment.records) ? employment.records : []
  const history = asRecord(payload.rentalHistory)
  const residences = Array.isArray(history.residences) ? history.residences : []
  const pets = asRecord(payload.pets)
  const animals = Array.isArray(pets.animals) ? pets.animals : []
  const insurancePayload = asRecord(payload.insurance)

  const [note, setNote] = useState("")
  const [request, setRequest] = useState("")
  const [docTypes, setDocTypes] = useState("")
  const [busy, setBusy] = useState(false)
  const [replaceMessage, setReplaceMessage] = useState<Record<string, string>>({})

  const incomeCents = useMemo(() => {
    return jobs.reduce((sum, row) => {
      const rec = asRecord(row)
      const n = typeof rec.monthlyIncomeCents === "number" ? rec.monthlyIncomeCents : 0
      return sum + n
    }, 0)
  }, [jobs])

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true)
    try {
      await action()
      toast({ title: success })
      await onRefresh()
    } catch {
      toast({ title: "Could not save that change", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        Back to list
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>
            {app.firstName} {app.lastName}
          </CardTitle>
          <CardDescription>
            {bundle.property?.title} · {app.email} · {app.completionPercent}% complete
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge>{app.statusLabel || app.status.replace(/_/g, " ")}</Badge>
          {bundle.fullyComplete ? <Badge variant="secondary">File complete</Badge> : <Badge variant="outline">Incomplete</Badge>}
          {bundle.insurance ? <Badge variant="outline">Insurance: {bundle.insurance.label}</Badge> : null}
          {app.assignedReviewerName ? <Badge variant="secondary">Reviewer: {app.assignedReviewerName}</Badge> : null}
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={["applicant", "documents", "notes", "history"]} className="rounded-lg border px-4">
        <AccordionItem value="applicant">
          <AccordionTrigger>Applicant</AccordionTrigger>
          <AccordionContent className="space-y-1 text-sm">
            <p>{app.firstName} {app.lastName}</p>
            <p>{app.email}</p>
            <p>{app.phone || String(applicant.phone || "No phone on file")}</p>
            <p>{String(applicant.currentAddress || "No current address")}</p>
            <p>{String(applicant.dateOfBirth || "")}</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="household">
          <AccordionTrigger>Household</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            {occupants.length === 0 ? <p className="text-muted-foreground">No other occupants listed.</p> : null}
            {occupants.map((row, index) => {
              const occ = asRecord(row)
              return (
                <p key={`${occ.fullName}-${index}`}>
                  {String(occ.fullName || "Occupant")} · {String(occ.relationship || "household")} · {occ.isAdult ? "Adult" : "Under 18"}
                </p>
              )
            })}
            <ul>
              {(bundle.coApplicants ?? []).map((co, index) => (
                <li key={`${co.email ?? co.firstName}-${index}`}>
                  {co.firstName} {co.lastName} · {co.status} · {co.completionPercent}%
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="employment">
          <AccordionTrigger>Employment</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            {jobs.length === 0 ? <p className="text-muted-foreground">No employment records.</p> : null}
            {jobs.map((row, index) => {
              const job = asRecord(row)
              return (
                <p key={`${job.employer}-${index}`}>
                  {String(job.employer || "Employer")}
                  {job.title ? ` · ${String(job.title)}` : ""}
                  {job.duration ? ` · ${String(job.duration)}` : ""}
                  {job.startDate ? ` · ${String(job.startDate)}` : ""}
                  {job.endDate ? ` – ${String(job.endDate)}` : ""}
                  {job.selfEmployed ? " (self-employed)" : ""}
                  {typeof job.monthlyIncomeCents === "number" ? ` · ${money(job.monthlyIncomeCents)} / month` : ""}
                </p>
              )
            })}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="income">
          <AccordionTrigger>Income</AccordionTrigger>
          <AccordionContent className="text-sm">
            <p>Listed monthly income {money(incomeCents)}.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="history">
          <AccordionTrigger>Rental History</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            {residences.length === 0 ? <p className="text-muted-foreground">No prior residences listed.</p> : null}
            {residences.map((row, index) => {
              const res = asRecord(row)
              return (
                <div key={`${res.address}-${index}`}>
                  <p>{String(res.address || "Address")}</p>
                  <p className="text-muted-foreground">
                    {String(res.landlordName || "")}
                    {res.landlordPhone ? ` · ${String(res.landlordPhone)}` : ""}
                    {res.startDate ? ` · ${String(res.startDate)}` : ""}
                    {res.endDate ? ` – ${String(res.endDate)}` : ""}
                  </p>
                  {res.reasonForLeaving ? (
                    <p className="text-muted-foreground">{String(res.reasonForLeaving)}</p>
                  ) : null}
                </div>
              )
            })}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="documents">
          <AccordionTrigger>Documents</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {(bundle.documents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            ) : null}
            {(bundle.documents ?? []).map((doc) => (
              <div key={doc.id} className="space-y-2 rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{doc.fileName}</p>
                  <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}</Badge>
                </div>
                <p className="text-muted-foreground">
                  {doc.documentType.replace(/_/g, " ")} · Uploaded {doc.uploadedAt ? doc.uploadedAt.slice(0, 10) : "—"}
                  {doc.expiresAt ? ` · Expires ${doc.expiresAt}` : ""}
                </p>
                {doc.url ? (
                  <a className="underline" href={doc.url} target="_blank" rel="noreferrer">
                    Preview / download
                  </a>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => void run(() => featureApi.rental.reviewDocument(app.id, doc.id, { status: "approved" }), "Document approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void run(() => featureApi.rental.reviewDocument(app.id, doc.id, { status: "pending_review" }), "Marked pending review")}
                  >
                    Pending review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void run(() => featureApi.rental.reviewDocument(app.id, doc.id, { status: "rejected" }), "Document rejected")}
                  >
                    Reject
                  </Button>
                </div>
                <div>
                  <Label htmlFor={`rep-${doc.id}`}>Request replacement</Label>
                  <Input
                    id={`rep-${doc.id}`}
                    className="mt-1"
                    value={replaceMessage[doc.id] ?? ""}
                    onChange={(e) => setReplaceMessage((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                    placeholder="Tell the applicant what to upload"
                  />
                  <Button
                    className="mt-2"
                    size="sm"
                    variant="outline"
                    disabled={busy || !(replaceMessage[doc.id] ?? "").trim()}
                    onClick={() =>
                      void run(
                        () => featureApi.rental.requestDocumentReplacement(app.id, doc.id, replaceMessage[doc.id] ?? ""),
                        "Replacement requested",
                      )
                    }
                  >
                    Request replacement
                  </Button>
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="screening">
          <AccordionTrigger>Screening</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <Badge variant="outline">{bundle.screening?.statusLabel || (bundle.screening?.configured ? "Configured" : "Not configured")}</Badge>
            <p className="text-muted-foreground">
              {bundle.screening?.summary || "Screening is not connected. Ondo does not invent a pass or fail."}
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="verification">
          <AccordionTrigger>Verification</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <Badge variant="outline">{bundle.verification?.statusLabel || "Not configured"}</Badge>
            <p className="text-muted-foreground">
              {bundle.verification?.summary ||
                "Identity, employment, and rental-history verification are not connected. Ondo does not mark IDs as verified."}
            </p>
            <ul className="space-y-1">
              {(bundle.verification?.checks ?? [
                { type: "identity", status: "not_configured", statusLabel: "Not configured" },
                { type: "employment", status: "not_configured", statusLabel: "Not configured" },
                { type: "rental", status: "not_configured", statusLabel: "Not configured" },
              ]).map((check) => (
                <li key={check.type}>
                  {check.type === "rental" ? "Rental history" : check.type.charAt(0).toUpperCase() + check.type.slice(1)}: {check.statusLabel}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="signature">
          <AccordionTrigger>E-signature</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <Badge variant="outline">{bundle.signature?.statusLabel || "Not configured"}</Badge>
            <p className="text-muted-foreground">
              {bundle.signature?.summary ||
                "E-signature is not connected. Ondo does not mark leases complete without a configured provider."}
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="pets">
          <AccordionTrigger>Pets</AccordionTrigger>
          <AccordionContent className="space-y-1 text-sm">
            {animals.length === 0 ? <p className="text-muted-foreground">No animals listed.</p> : null}
            {animals.map((row, index) => {
              const pet = asRecord(row)
              return (
                <p key={`${pet.name}-${index}`}>
                  {String(pet.name || "Animal")} · {String(pet.type || "")}
                  {pet.breed ? ` · ${String(pet.breed)}` : ""}
                  {pet.ageYears != null && pet.ageYears !== "" ? ` · ${String(pet.ageYears)} yrs` : ""}
                  {pet.size ? ` · ${String(pet.size)}` : ""}
                  {pet.docs ? ` · ${String(pet.docs)}` : ""}
                  {" · "}
                  {pet.isAssistanceAnimal ? "Assistance animal (not a pet)" : "Pet"}
                </p>
              )
            })}
            {bundle.petFees ? (
              <p className="text-muted-foreground">
                Chargeable pets: {bundle.petFees.chargeablePetCount}. Assistance animals: {bundle.petFees.assistanceAnimalCount}.
                Pet deposit {money(bundle.petFees.extraDepositCents)}. Pet rent {money(bundle.petFees.monthlyPetRentCents)} / month.
                Assistance animals are not charged pet fees.
              </p>
            ) : null}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="insurance">
          <AccordionTrigger>Insurance</AccordionTrigger>
          <AccordionContent className="text-sm">
            <p>Status: {bundle.insurance?.label ?? "Unknown"}</p>
            <p>Carrier: {String(insurancePayload.carrier || "—")}</p>
            <p>Expiration: {String(insurancePayload.expiration || "—")}</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="payments">
          <AccordionTrigger>Fees & payments</AccordionTrigger>
          <AccordionContent className="space-y-1 text-sm">
            {bundle.paymentProvider ? (
              <p>
                <Badge variant="outline">{bundle.paymentProvider.statusLabel}</Badge>{" "}
                <span className="text-muted-foreground">{bundle.paymentProvider.summary}</span>
              </p>
            ) : null}
            {(bundle.payments ?? []).length === 0 ? <p className="text-muted-foreground">No application payments recorded.</p> : null}
            {(bundle.payments ?? []).map((pay) => (
              <p key={pay.id}>
                {pay.paymentType.replace(/_/g, " ")} · {money(pay.amountCents)} · {pay.statusLabel}
                {pay.transactionId ? ` · ${pay.transactionId}` : ""} · {pay.createdAt.slice(0, 16)}
              </p>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="notes">
          <AccordionTrigger>Notes</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Internal notes are never shown to applicants.</p>
            {app.ownerNotes ? <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{app.ownerNotes}</p> : null}
            <Label htmlFor="note">Add internal note</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button
              variant="outline"
              disabled={busy || !note.trim()}
              onClick={() =>
                void run(async () => {
                  await featureApi.rental.addNote(app.id, note)
                  setNote("")
                }, "Note saved")
              }
            >
              Save internal note
            </Button>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="timeline">
          <AccordionTrigger>History</AccordionTrigger>
          <AccordionContent>
            <ApplicationTimeline events={bundle.events ?? []} staff />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Status changes and applicant-visible requests. Internal notes stay off applicant views.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DECISIONS.map((decision) => (
              <Button
                key={decision.value}
                disabled={busy}
                variant={decision.value === "denied" ? "outline" : "default"}
                onClick={() => void run(() => featureApi.rental.changeStatus(app.id, decision.value), `Marked ${decision.label.toLowerCase()}`)}
              >
                {decision.label}
              </Button>
            ))}
            <Button
              variant="secondary"
              disabled={busy || !user?.id}
              onClick={() => void run(() => featureApi.rental.assign(app.id, user!.id), "Assigned to you")}
            >
              Assign to me
            </Button>
          </div>
          <div>
            <Label>Other status</Label>
            <Select
              value={app.status}
              onValueChange={(value) => void run(() => featureApi.rental.changeStatus(app.id, value), "Status updated")}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["started", "submitted", "documents_required", "under_review", "additional_information_required", "conditionally_approved", "approved", "denied", "withdrawn"].map(
                  (status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="req">Request more information (applicant-visible)</Label>
            <Input id="req" className="mt-1" value={request} onChange={(e) => setRequest(e.target.value)} />
            <Label htmlFor="doctypes" className="mt-2">
              Document types to request (optional, comma-separated)
            </Label>
            <Input id="doctypes" className="mt-1" value={docTypes} onChange={(e) => setDocTypes(e.target.value)} />
            <Button
              className="mt-2"
              disabled={busy || !request.trim()}
              onClick={() =>
                void run(async () => {
                  const types = docTypes
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                  await featureApi.rental.requestInfo(app.id, request, types.length ? types : undefined)
                  setRequest("")
                  setDocTypes("")
                }, "Request sent")
              }
            >
              Send request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
