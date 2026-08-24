import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  FileText,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Link2,
  BadgeDollarSign,
  Loader2,
} from "lucide-react"
import { featureApi } from "@/lib/api"
import { screeningApi, type ScreeningViewResponse } from "@/lib/api/clients/screening"
import { useToast } from "@/hooks/use-toast"
import { ApplicationComments } from "./application-comments"
import { ScoreBreakdownTooltip } from "./score-breakdown-tooltip"
import { ScreeningViewCard } from "@/components/tenant-screening/ScreeningViewCard"

interface ApplicationAnswer {
  questionId: string
  answer: unknown
  passes: boolean | null
  questionText?: string
  questionType?: string
}

interface VerificationCheck {
  id: string
  checkType: string
  status: string
  passes: boolean | null
  result: Record<string, unknown> | null
  completedAt: string | null
  screeningId?: string | null
}

interface ApplicationDetail {
  id: string
  propertyId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  dateOfBirth: string | null
  currentAddress: string | null
  employer: string | null
  annualIncome: number | null
  desiredMoveIn: string | null
  status: string
  recommendationScore: number | null
  scoreBreakdown: Record<string, { earned: number; max: number }> | null
  ownerNotes: string | null
  submittedAt: string | null
  reviewedAt: string | null
  createdAt: string
  answers?: ApplicationAnswer[]
  checks?: VerificationCheck[]
}

interface ApplicationDetailViewProps {
  applicationId: string
  propertyId?: string
  onBack: () => void
}

const checkLabels: Record<string, string> = {
  credit: "Credit Check",
  criminal: "Criminal History",
  eviction: "Eviction History",
  income: "Income Verification",
  identity: "Identity Verification",
  references: "Reference Check",
}

const statusIcons: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  pending: Clock,
  in_progress: RefreshCw,
  failed: XCircle,
}

export function ApplicationDetailView({
  applicationId,
  onBack,
}: ApplicationDetailViewProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [app, setApp] = useState<ApplicationDetail | null>(null)
  const [checks, setChecks] = useState<VerificationCheck[]>([])
  const [notes, setNotes] = useState("")
  const [showApprove, setShowApprove] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [showWaive, setShowWaive] = useState(false)
  const [acting, setActing] = useState(false)
  const [attachCandidates, setAttachCandidates] = useState<ScreeningViewResponse[]>([])
  const [attachLoading, setAttachLoading] = useState(false)
  const [selectedScreeningId, setSelectedScreeningId] = useState("")
  const [manualScreeningId, setManualScreeningId] = useState("")
  const [linkedScreening, setLinkedScreening] = useState<ScreeningViewResponse | null>(null)
  /** Stable id from attach / package resolution. Preferred over email heuristics. */
  const [linkedScreeningId, setLinkedScreeningId] = useState<string | null>(null)

  useEffect(() => {
    setLinkedScreeningId(null)
    setLinkedScreening(null)
    void loadApplication(null)
  }, [applicationId])

  const resolveLinkedScreening = async (
    nextChecks: VerificationCheck[],
    email: string | undefined,
    preferredId: string | null
  ): Promise<void> => {
    // 1) Canonical linked package (origin / verification_checks / shares)
    try {
      const pkg = await screeningApi.getScreeningPackage(applicationId)
      if (pkg) {
        setLinkedScreeningId(pkg.id)
        setLinkedScreening(pkg)
        return
      }
    } catch {
      // fall through to legacy resolve path
    }

    // 2) Preferred attached id (local state / attach response)
    if (preferredId) {
      try {
        const view = await screeningApi.get(preferredId)
        setLinkedScreeningId(view.id)
        setLinkedScreening(view)
        return
      } catch {
        // fall through
      }
    }

    // 3) Linked screening_id from verification checks
    const checkScreeningId =
      nextChecks.map((c) => c.screeningId).find((id): id is string => !!id) ?? null
    if (checkScreeningId && checkScreeningId !== preferredId) {
      try {
        const view = await screeningApi.get(checkScreeningId)
        setLinkedScreeningId(view.id)
        setLinkedScreening(view)
        return
      } catch {
        // fall through
      }
    }

    // 4) Last resort: initiated-by list email heuristic
    if (email) {
      try {
        const matches = await screeningApi.listMatchingEmail(email)
        const completed = matches.filter((s) => s.status === "completed")
        const pick = completed[0] ?? null
        setLinkedScreeningId(pick?.id ?? null)
        setLinkedScreening(pick)
        return
      } catch {
        // ignore
      }
    }

    setLinkedScreeningId(null)
    setLinkedScreening(null)
  }

  /** Pass `null` to clear preferred id; omit to keep prior `linkedScreeningId`. */
  const loadApplication = async (preferredScreeningId?: string | null) => {
    const preferred =
      preferredScreeningId !== undefined ? preferredScreeningId : linkedScreeningId
    try {
      setLoading(true)
      const [appData, checksData] = await Promise.all([
        featureApi.applications.get(applicationId),
        featureApi.applications.getChecks(applicationId),
      ])
      const detail = (appData as { data?: ApplicationDetail })?.data ?? appData
      const nextChecks = checksData as VerificationCheck[]
      setApp(detail as ApplicationDetail)
      setChecks(nextChecks)
      setNotes((detail as ApplicationDetail)?.ownerNotes ?? "")

      await resolveLinkedScreening(
        nextChecks,
        (detail as ApplicationDetail)?.email,
        preferred
      )
    } catch {
      toast({ title: "Failed to load application", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const openAttachDialog = async () => {
    if (!app) return
    setShowAttach(true)
    setAttachLoading(true)
    setSelectedScreeningId("")
    setManualScreeningId("")
    try {
      const matches = await screeningApi.listMatchingEmail(app.email)
      setAttachCandidates(matches.filter((s) => s.status === "completed"))
    } catch {
      setAttachCandidates([])
    } finally {
      setAttachLoading(false)
    }
  }

  const handleAttach = async () => {
    const screeningId = (selectedScreeningId || manualScreeningId).trim()
    if (!screeningId) {
      toast({ title: "Select or enter a screening package", variant: "destructive" })
      return
    }
    try {
      setActing(true)
      const res = await screeningApi.attach(screeningId, { applicationId })
      const attachedId = res.screeningId || screeningId
      setLinkedScreeningId(attachedId)
      try {
        const view = await screeningApi.get(attachedId)
        setLinkedScreening(view)
      } catch {
        // Package will resolve on reload via checks / package endpoint
      }
      toast({ title: "Screening package attached" })
      setShowAttach(false)
      await loadApplication(attachedId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to attach screening"
      toast({ title: message, variant: "destructive" })
    } finally {
      setActing(false)
    }
  }

  const handleWaiveFee = async () => {
    try {
      setActing(true)
      await screeningApi.waiveFee(applicationId)
      toast({ title: "Screening fee waived" })
      setShowWaive(false)
      await loadApplication()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to waive screening fee"
      toast({ title: message, variant: "destructive" })
    } finally {
      setActing(false)
    }
  }

  const handleWaitlist = async () => {
    try {
      setActing(true)
      await featureApi.applicationActions.waitlist(applicationId)
      toast({ title: "Application waitlisted" })
      await loadApplication()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to waitlist"
      toast({ title: message, variant: "destructive" })
    } finally {
      setActing(false)
    }
  }

  const handleAllowReapply = async () => {
    try {
      setActing(true)
      await featureApi.applicationActions.allowReapply(applicationId)
      toast({ title: "Applicant can re-apply" })
      await loadApplication()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed"
      toast({ title: message, variant: "destructive" })
    } finally {
      setActing(false)
    }
  }

  const handleApprove = async () => {
    try {
      setActing(true)
      await featureApi.applications.approve(applicationId, notes || undefined)
      toast({ title: "Application approved" })
      setShowApprove(false)
      await loadApplication()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve"
      toast({ title: message, variant: "destructive" })
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    try {
      setActing(true)
      await featureApi.applications.reject(applicationId, notes || undefined)
      toast({ title: "Application rejected" })
      setShowReject(false)
      await loadApplication()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reject"
      toast({ title: message, variant: "destructive" })
    } finally {
      setActing(false)
    }
  }

  const triggerChecks = async () => {
    try {
      await featureApi.applications.triggerChecks(applicationId)
      toast({ title: "Verification checks triggered" })
      await loadApplication()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to trigger checks"
      toast({ title: message, variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Application not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Back
        </Button>
      </div>
    )
  }

  const canDecide = ["passed", "failed", "submitted", "screening"].includes(app.status)
  const completedChecks = checks.filter((c) => c.status === "completed").length
  const totalChecks = checks.length
  const checkProgress = totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Applications
        </Button>
        <div className="flex flex-wrap gap-2 justify-end">
          {["rejected", "withdrawn"].includes(app.status) && (
            <Button variant="outline" onClick={handleAllowReapply} disabled={acting}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Allow Re-apply
            </Button>
          )}
          {!["approved", "rejected", "withdrawn"].includes(app.status) && (
            <>
              <Button variant="outline" onClick={openAttachDialog} disabled={acting}>
                <Link2 className="h-4 w-4 mr-1.5" /> Attach existing screening
              </Button>
              <Button variant="outline" onClick={() => setShowWaive(true)} disabled={acting}>
                <BadgeDollarSign className="h-4 w-4 mr-1.5" /> Waive fee
              </Button>
            </>
          )}
          {canDecide && (
            <>
              <Button
                variant="outline"
                onClick={handleWaitlist}
                disabled={acting}
              >
                <Clock className="h-4 w-4 mr-1.5" /> Waitlist
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowReject(true)}
              >
                <ThumbsDown className="h-4 w-4 mr-1.5" /> Reject
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowApprove(true)}
              >
                <ThumbsUp className="h-4 w-4 mr-1.5" /> Approve
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Applicant Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              {app.firstName} {app.lastName}
            </CardTitle>
            <div className="flex items-center gap-3">
              {app.recommendationScore !== null && (
                <ScoreBreakdownTooltip score={app.recommendationScore} breakdown={app.scoreBreakdown}>
                  <div className="text-center cursor-help">
                    <p className="text-2xl font-bold text-emerald-600">{app.recommendationScore}</p>
                    <p className="text-xs text-slate-500">Score</p>
                  </div>
                </ScoreBreakdownTooltip>
              )}
              <Badge
                className={
                  app.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : app.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : app.status === "passed"
                        ? "bg-emerald-100 text-emerald-700"
                        : app.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                }
              >
                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoField label="Email" value={app.email} />
            <InfoField label="Phone" value={app.phone} />
            <InfoField
              label="Date of Birth"
              value={app.dateOfBirth ? new Date(app.dateOfBirth).toLocaleDateString() : null}
            />
            <InfoField label="Current Address" value={app.currentAddress} />
            <InfoField label="Employer" value={app.employer} />
            <InfoField
              label="Annual Income"
              value={app.annualIncome ? `$${app.annualIncome.toLocaleString()}` : null}
            />
            <InfoField
              label="Desired Move-In"
              value={app.desiredMoveIn ? new Date(app.desiredMoveIn).toLocaleDateString() : null}
            />
            <InfoField
              label="Submitted"
              value={app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : null}
            />
          </div>
        </CardContent>
      </Card>

      {/* Linked screening package (role-shaped) */}
      {linkedScreening && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-ondo-orange" />
              Tenant screening
            </CardTitle>
            <CardDescription>
              Role-shaped summary for this applicant&apos;s screening package.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScreeningViewCard
              view={linkedScreening}
              allowOwnerNoteEdit={linkedScreening.view === "full"}
              onUpdated={setLinkedScreening}
            />
          </CardContent>
        </Card>
      )}

      {/* Verification Checks */}
      {checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-amber-500" />
              Verification Checks
            </CardTitle>
            <div className="flex items-center gap-3 mt-2">
              <Progress value={checkProgress} className="flex-1 h-2" />
              <span className="text-sm text-slate-500">
                {completedChecks}/{totalChecks} complete
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {checks.map((check) => {
                const Icon = statusIcons[check.status] ?? Clock
                return (
                  <div
                    key={check.id}
                    className="flex items-center justify-between p-3 bg-muted dark:bg-card rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-5 w-5 ${
                          check.passes === true
                            ? "text-emerald-500"
                            : check.passes === false
                              ? "text-red-500"
                              : "text-slate-400"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {checkLabels[check.checkType] ?? check.checkType}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{check.status.replace("_", " ")}</p>
                      </div>
                    </div>
                    {check.passes !== null && (
                      <Badge
                        variant={check.passes ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {check.passes ? "Pass" : "Fail"}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
            {app.status === "submitted" && (
              <Button variant="outline" className="mt-4" onClick={triggerChecks}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Run Verification Checks
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Screening Answers */}
      {app.answers && app.answers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-purple-500" />
              Screening Answers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {app.answers.map((ans, i) => (
                <div key={i} className="p-3 bg-muted dark:bg-card rounded-lg border">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {ans.questionText ?? `Question ${i + 1}`}
                      </p>
                      <p className="mt-1 font-medium">{String(ans.answer ?? "N/A")}</p>
                    </div>
                    {ans.passes !== null && ans.passes !== undefined && (
                      <Badge
                        variant={ans.passes ? "default" : "destructive"}
                        className="text-xs flex-shrink-0"
                      >
                        {ans.passes ? "Pass" : "Fail"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comments</CardTitle>
          <CardDescription>Internal notes and discussion about this application</CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationComments applicationId={applicationId} />
        </CardContent>
      </Card>

      {/* Owner Notes */}
      {canDecide && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
            <CardDescription>Add notes about this application (visible to you only)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this applicant..."
              rows={3}
            />
          </CardContent>
        </Card>
      )}

      {/* Attach existing screening */}
      <Dialog open={showAttach} onOpenChange={setShowAttach}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach existing screening</DialogTitle>
            <DialogDescription>
              Link a completed portable screening package to this application. Identity must match the applicant.
            </DialogDescription>
          </DialogHeader>
          {attachLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {attachCandidates.length > 0 ? (
                <div className="space-y-2">
                  <Label>Matching packages</Label>
                  <Select value={selectedScreeningId} onValueChange={setSelectedScreeningId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a screening package" />
                    </SelectTrigger>
                    <SelectContent>
                      {attachCandidates.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.view !== "status" ? s.tenantEmail : s.id} · {s.status}
                          {s.expiresAt ? ` · until ${new Date(s.expiresAt).toLocaleDateString()}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No completed screenings found for this email in your list. You can still paste a screening ID if the applicant shared one.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="manual-screening-id">Or screening ID</Label>
                <Input
                  id="manual-screening-id"
                  value={manualScreeningId}
                  onChange={(e) => setManualScreeningId(e.target.value)}
                  placeholder="UUID of portable screening package"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttach(false)}>
              Cancel
            </Button>
            <Button onClick={handleAttach} disabled={acting || attachLoading}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Attach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waive screening fee */}
      <AlertDialog open={showWaive} onOpenChange={setShowWaive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Waive screening fee?</AlertDialogTitle>
            <AlertDialogDescription>
              This waives the applicant screening fee for {app.firstName} {app.lastName}
              and lets provider screening continue without payment. This cannot be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWaiveFee}
              disabled={acting}
              className="bg-ondo-orange hover:bg-ondo-red"
            >
              {acting ? "Waiving…" : "Waive fee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApprove} onOpenChange={setShowApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve {app.firstName} {app.lastName}'s application.
              You can then create a lease for this tenant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={acting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {acting ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showReject} onOpenChange={setShowReject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject {app.firstName} {app.lastName}'s application.
              The applicant will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={acting}
              className="bg-red-600 hover:bg-red-700"
            >
              {acting ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="font-medium text-sm">{value || "N/A"}</p>
    </div>
  )
}
