import { useState, useEffect } from "react"
import { HomeownerPropertyShell } from "./homeowner-property-shell"
import { ConfirmDeleteDialog } from "./confirm-delete-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  homeownerApi,
  type PropertyMortgage,
  type AdditionalLoan,
  type InsurancePolicy,
  type PropertyTaxRecord,
} from "@/lib/api"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function money(cents: number | null | undefined) {
  if (cents == null) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function MortgageLoansPage() {
  return (
    <HomeownerPropertyShell>
      {({ propertyId }) => <MortgageLoansInner propertyId={propertyId} />}
    </HomeownerPropertyShell>
  )
}

function MortgageLoansInner({ propertyId }: { propertyId: string }) {
  const { toast } = useToast()
  const [mortgage, setMortgage] = useState<PropertyMortgage | null>(null)
  const [loans, setLoans] = useState<AdditionalLoan[]>([])
  const [insurance, setInsurance] = useState<InsurancePolicy[]>([])
  const [taxes, setTaxes] = useState<PropertyTaxRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [mortgageOpen, setMortgageOpen] = useState(false)
  const [loanOpen, setLoanOpen] = useState(false)
  const [insuranceOpen, setInsuranceOpen] = useState(false)
  const [taxOpen, setTaxOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<AdditionalLoan | null>(null)
  const [editingIns, setEditingIns] = useState<InsurancePolicy | null>(null)
  const [editingTax, setEditingTax] = useState<PropertyTaxRecord | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "loan" | "insurance" | "tax"
    id: string
    label: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      const [m, ls, ins, tx] = await Promise.all([
        homeownerApi.getMortgage(propertyId),
        homeownerApi.listLoans(propertyId),
        homeownerApi.listInsurance(propertyId),
        homeownerApi.listPropertyTaxes(propertyId),
      ])
      setMortgage(m)
      setLoans(ls)
      setInsurance(ins)
      setTaxes(tx)
    } catch {
      toast({ title: "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [propertyId])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.type === "loan") {
        await homeownerApi.deleteLoan(propertyId, deleteTarget.id)
      } else if (deleteTarget.type === "insurance") {
        await homeownerApi.deleteInsurance(propertyId, deleteTarget.id)
      } else {
        await homeownerApi.deletePropertyTax(propertyId, deleteTarget.id)
      }
      toast({ title: `${deleteTarget.label} removed` })
      void load()
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Mortgage &amp; loans
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track mortgage details, insurance, and property taxes for this home.
        </p>
      </header>

      <Tabs defaultValue="mortgage" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="mortgage">Mortgage</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="taxes">Property taxes</TabsTrigger>
        </TabsList>

        <TabsContent value="mortgage" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Primary mortgage</CardTitle>
                <CardDescription>Your main home loan details</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMortgageOpen(true)}
              >
                <Pencil className="mr-1 h-4 w-4" />
                {mortgage ? "Edit" : "Add"}
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="mb-1 h-3 w-20" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                  ))}
                </div>
              ) : mortgage ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Lender</p>
                    <p className="font-medium">{mortgage.lenderName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account</p>
                    <p className="font-medium">
                      {mortgage.accountNumberMasked
                        ? `••••${mortgage.accountNumberMasked}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly payment</p>
                    <p className="font-medium">{money(mortgage.monthlyPaymentCents)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Interest rate</p>
                    <p className="font-medium">
                      {mortgage.interestRate != null
                        ? `${Number(mortgage.interestRate).toFixed(3)}%`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining balance</p>
                    <p className="font-medium">{money(mortgage.remainingBalanceCents)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payoff date</p>
                    <p className="font-medium">
                      {mortgage.payoffDate
                        ? new Date(mortgage.payoffDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No primary mortgage on file. Click Edit to add details.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Additional loans</CardTitle>
                <CardDescription>HELOC, home equity, or other loans</CardDescription>
              </div>
              <Button
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={() => {
                  setEditingLoan(null)
                  setLoanOpen(true)
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add loan
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))
              ) : loans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No additional loans.</p>
              ) : (
                loans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{loan.lenderName}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {loan.loanType.replace("_", " ")}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                        <span>Payment {money(loan.monthlyPaymentCents)}</span>
                        <span>
                          Rate{" "}
                          {loan.interestRate != null
                            ? `${Number(loan.interestRate).toFixed(3)}%`
                            : "—"}
                        </span>
                        <span>Balance {money(loan.remainingBalanceCents)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit loan"
                        onClick={() => {
                          setEditingLoan(loan)
                          setLoanOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        aria-label="Delete loan"
                        onClick={() =>
                          setDeleteTarget({ type: "loan", id: loan.id, label: "Loan" })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingIns(null)
                setInsuranceOpen(true)
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add policy
            </Button>
          </div>
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))
          ) : insurance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No insurance policies on file.</p>
          ) : (
            insurance.map((pol) => (
              <Card key={pol.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{pol.provider || "Homeowner policy"}</CardTitle>
                    <CardDescription>
                      Policy #{pol.policyNumber || "—"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingIns(pol)
                        setInsuranceOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        setDeleteTarget({ type: "insurance", id: pol.id, label: "Policy" })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Premium</p>
                    {money(pol.premiumCents)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coverage</p>
                    {money(pol.coverageAmountCents)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Deductible</p>
                    {money(pol.deductibleCents)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Agent</p>
                    {pol.agentName || "—"}
                    {pol.agentPhone ? (
                      <span className="block text-muted-foreground">{pol.agentPhone}</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="taxes" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingTax(null)
                setTaxOpen(true)
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add tax year
            </Button>
          </div>
          {loading ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : taxes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No property tax records.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">Year</th>
                    <th className="p-3 font-medium">Assessed value</th>
                    <th className="p-3 font-medium">Tax amount</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Due</th>
                    <th className="p-3 w-28" />
                  </tr>
                </thead>
                <tbody>
                  {taxes.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="p-3">{t.taxYear}</td>
                      <td className="p-3">{money(t.assessedValueCents)}</td>
                      <td className="p-3">{money(t.taxAmountCents)}</td>
                      <td className="p-3 capitalize">{t.paymentStatus}</td>
                      <td className="p-3">
                        {t.dueDate
                          ? new Date(t.dueDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTax(t)
                              setTaxOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() =>
                              setDeleteTarget({ type: "tax", id: t.id, label: "Tax record" })
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Delete ${deleteTarget?.label.toLowerCase()}?`}
        description="This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />

      <MortgageDialog
        open={mortgageOpen}
        onOpenChange={setMortgageOpen}
        propertyId={propertyId}
        existing={mortgage}
        onSaved={() => {
          void load()
          setMortgageOpen(false)
        }}
      />
      <LoanDialog
        open={loanOpen}
        onOpenChange={setLoanOpen}
        propertyId={propertyId}
        existing={editingLoan}
        onSaved={() => {
          void load()
          setLoanOpen(false)
          setEditingLoan(null)
        }}
      />
      <InsuranceDialog
        open={insuranceOpen}
        onOpenChange={setInsuranceOpen}
        propertyId={propertyId}
        existing={editingIns}
        onSaved={() => {
          void load()
          setInsuranceOpen(false)
          setEditingIns(null)
        }}
      />
      <TaxDialog
        open={taxOpen}
        onOpenChange={setTaxOpen}
        propertyId={propertyId}
        existing={editingTax}
        onSaved={() => {
          void load()
          setTaxOpen(false)
          setEditingTax(null)
        }}
      />
    </div>
  )
}

function MortgageDialog({
  open,
  onOpenChange,
  propertyId,
  existing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  propertyId: string
  existing: PropertyMortgage | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    lenderName: "",
    accountNumberMasked: "",
    monthlyPayment: "",
    interestRate: "",
    remainingBalance: "",
    originalAmount: "",
    payoffDate: "",
  })

  useEffect(() => {
    if (!open) return
    setForm({
      lenderName: existing?.lenderName ?? "",
      accountNumberMasked: existing?.accountNumberMasked ?? "",
      monthlyPayment:
        existing?.monthlyPaymentCents != null
          ? String(existing.monthlyPaymentCents / 100)
          : "",
      interestRate:
        existing?.interestRate != null ? String(existing.interestRate) : "",
      remainingBalance:
        existing?.remainingBalanceCents != null
          ? String(existing.remainingBalanceCents / 100)
          : "",
      originalAmount:
        existing?.originalAmountCents != null
          ? String(existing.originalAmountCents / 100)
          : "",
      payoffDate: existing?.payoffDate?.slice(0, 10) ?? "",
    })
  }, [open, existing])

  const save = async () => {
    try {
      await homeownerApi.putMortgage(propertyId, {
        lenderName: form.lenderName || null,
        accountNumberMasked: form.accountNumberMasked || null,
        monthlyPaymentCents: form.monthlyPayment
          ? Math.round(parseFloat(form.monthlyPayment) * 100)
          : null,
        interestRate: form.interestRate ? parseFloat(form.interestRate) : null,
        remainingBalanceCents: form.remainingBalance
          ? Math.round(parseFloat(form.remainingBalance) * 100)
          : null,
        originalAmountCents: form.originalAmount
          ? Math.round(parseFloat(form.originalAmount) * 100)
          : null,
        payoffDate: form.payoffDate || null,
      })
      toast({ title: "Mortgage saved" })
      onSaved()
    } catch {
      toast({ title: "Save failed", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Primary mortgage</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Lender</Label>
            <Input
              value={form.lenderName}
              onChange={(e) => setForm((f) => ({ ...f, lenderName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Account (last digits)</Label>
            <Input
              value={form.accountNumberMasked}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountNumberMasked: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly payment ($)</Label>
              <Input
                type="number"
                value={form.monthlyPayment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monthlyPayment: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Interest rate (%)</Label>
              <Input
                type="number"
                step="0.001"
                value={form.interestRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, interestRate: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Remaining balance ($)</Label>
              <Input
                type="number"
                value={form.remainingBalance}
                onChange={(e) =>
                  setForm((f) => ({ ...f, remainingBalance: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Original amount ($)</Label>
              <Input
                type="number"
                value={form.originalAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, originalAmount: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Payoff date</Label>
            <Input
              type="date"
              value={form.payoffDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, payoffDate: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LoanDialog({
  open,
  onOpenChange,
  propertyId,
  existing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  propertyId: string
  existing: AdditionalLoan | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    lenderName: "",
    loanType: "other" as AdditionalLoan["loanType"],
    monthlyPayment: "",
    interestRate: "",
    remainingBalance: "",
    notes: "",
  })

  useEffect(() => {
    if (!open) return
    if (existing) {
      setForm({
        lenderName: existing.lenderName,
        loanType: existing.loanType as AdditionalLoan["loanType"],
        monthlyPayment:
          existing.monthlyPaymentCents != null
            ? String(existing.monthlyPaymentCents / 100)
            : "",
        interestRate:
          existing.interestRate != null ? String(existing.interestRate) : "",
        remainingBalance:
          existing.remainingBalanceCents != null
            ? String(existing.remainingBalanceCents / 100)
            : "",
        notes: existing.notes ?? "",
      })
    } else {
      setForm({
        lenderName: "",
        loanType: "other",
        monthlyPayment: "",
        interestRate: "",
        remainingBalance: "",
        notes: "",
      })
    }
  }, [open, existing])

  const save = async () => {
    if (!form.lenderName.trim()) {
      toast({ title: "Lender is required", variant: "destructive" })
      return
    }
    try {
      const body = {
        lenderName: form.lenderName.trim(),
        loanType: form.loanType,
        monthlyPaymentCents: form.monthlyPayment
          ? Math.round(parseFloat(form.monthlyPayment) * 100)
          : null,
        interestRate: form.interestRate ? parseFloat(form.interestRate) : null,
        remainingBalanceCents: form.remainingBalance
          ? Math.round(parseFloat(form.remainingBalance) * 100)
          : null,
        notes: form.notes || null,
      }
      if (existing) {
        await homeownerApi.updateLoan(propertyId, existing.id, body)
      } else {
        await homeownerApi.createLoan(propertyId, body)
      }
      toast({ title: "Loan saved" })
      onSaved()
    } catch {
      toast({ title: "Save failed", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit loan" : "Add loan"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Lender</Label>
            <Input
              value={form.lenderName}
              onChange={(e) => setForm((f) => ({ ...f, lenderName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={form.loanType}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, loanType: v as AdditionalLoan["loanType"] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heloc">HELOC</SelectItem>
                <SelectItem value="home_equity">Home equity</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly ($)</Label>
              <Input
                type="number"
                value={form.monthlyPayment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monthlyPayment: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Rate (%)</Label>
              <Input
                type="number"
                step="0.001"
                value={form.interestRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, interestRate: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Remaining balance ($)</Label>
            <Input
              type="number"
              value={form.remainingBalance}
              onChange={(e) =>
                setForm((f) => ({ ...f, remainingBalance: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InsuranceDialog({
  open,
  onOpenChange,
  propertyId,
  existing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  propertyId: string
  existing: InsurancePolicy | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    provider: "",
    policyNumber: "",
    premium: "",
    coverage: "",
    deductible: "",
    agentName: "",
    agentPhone: "",
    renewalDate: "",
    notes: "",
  })

  useEffect(() => {
    if (!open) return
    if (existing) {
      setForm({
        provider: existing.provider ?? "",
        policyNumber: existing.policyNumber ?? "",
        premium:
          existing.premiumCents != null ? String(existing.premiumCents / 100) : "",
        coverage:
          existing.coverageAmountCents != null
            ? String(existing.coverageAmountCents / 100)
            : "",
        deductible:
          existing.deductibleCents != null
            ? String(existing.deductibleCents / 100)
            : "",
        agentName: existing.agentName ?? "",
        agentPhone: existing.agentPhone ?? "",
        renewalDate: existing.renewalDate?.slice(0, 10) ?? "",
        notes: existing.notes ?? "",
      })
    } else {
      setForm({
        provider: "",
        policyNumber: "",
        premium: "",
        coverage: "",
        deductible: "",
        agentName: "",
        agentPhone: "",
        renewalDate: "",
        notes: "",
      })
    }
  }, [open, existing])

  const save = async () => {
    try {
      const body = {
        provider: form.provider || null,
        policyNumber: form.policyNumber || null,
        premiumCents: form.premium ? Math.round(parseFloat(form.premium) * 100) : null,
        coverageAmountCents: form.coverage
          ? Math.round(parseFloat(form.coverage) * 100)
          : null,
        deductibleCents: form.deductible
          ? Math.round(parseFloat(form.deductible) * 100)
          : null,
        agentName: form.agentName || null,
        agentPhone: form.agentPhone || null,
        renewalDate: form.renewalDate || null,
        notes: form.notes || null,
      }
      if (existing) {
        await homeownerApi.updateInsurance(propertyId, existing.id, body)
      } else {
        await homeownerApi.createInsurance(propertyId, body)
      }
      toast({ title: "Policy saved" })
      onSaved()
    } catch {
      toast({ title: "Save failed", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit policy" : "Add policy"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Provider</Label>
              <Input
                value={form.provider}
                onChange={(e) =>
                  setForm((f) => ({ ...f, provider: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Policy #</Label>
              <Input
                value={form.policyNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, policyNumber: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Premium ($)</Label>
              <Input
                type="number"
                value={form.premium}
                onChange={(e) =>
                  setForm((f) => ({ ...f, premium: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Coverage ($)</Label>
              <Input
                type="number"
                value={form.coverage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverage: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Deductible ($)</Label>
              <Input
                type="number"
                value={form.deductible}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deductible: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Agent name</Label>
              <Input
                value={form.agentName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, agentName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Agent phone</Label>
              <Input
                value={form.agentPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, agentPhone: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Renewal date</Label>
            <Input
              type="date"
              value={form.renewalDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, renewalDate: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TaxDialog({
  open,
  onOpenChange,
  propertyId,
  existing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  propertyId: string
  existing: PropertyTaxRecord | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    taxYear: String(new Date().getFullYear()),
    assessedValue: "",
    taxAmount: "",
    paymentStatus: "pending" as PropertyTaxRecord["paymentStatus"],
    dueDate: "",
  })

  useEffect(() => {
    if (!open) return
    if (existing) {
      setForm({
        taxYear: String(existing.taxYear),
        assessedValue:
          existing.assessedValueCents != null
            ? String(existing.assessedValueCents / 100)
            : "",
        taxAmount:
          existing.taxAmountCents != null
            ? String(existing.taxAmountCents / 100)
            : "",
        paymentStatus: existing.paymentStatus as PropertyTaxRecord["paymentStatus"],
        dueDate: existing.dueDate?.slice(0, 10) ?? "",
      })
    } else {
      setForm({
        taxYear: String(new Date().getFullYear()),
        assessedValue: "",
        taxAmount: "",
        paymentStatus: "pending",
        dueDate: "",
      })
    }
  }, [open, existing])

  const save = async () => {
    try {
      const body = {
        taxYear: parseInt(form.taxYear, 10),
        assessedValueCents: form.assessedValue
          ? Math.round(parseFloat(form.assessedValue) * 100)
          : null,
        taxAmountCents: form.taxAmount
          ? Math.round(parseFloat(form.taxAmount) * 100)
          : null,
        paymentStatus: form.paymentStatus,
        dueDate: form.dueDate || null,
      }
      if (existing) {
        await homeownerApi.updatePropertyTax(propertyId, existing.id, body)
      } else {
        await homeownerApi.createPropertyTax(propertyId, body)
      }
      toast({ title: "Tax record saved" })
      onSaved()
    } catch {
      toast({ title: "Save failed", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit tax record" : "Add tax year"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Tax year</Label>
            <Input
              type="number"
              value={form.taxYear}
              onChange={(e) => setForm((f) => ({ ...f, taxYear: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assessed value ($)</Label>
              <Input
                type="number"
                value={form.assessedValue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assessedValue: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Tax amount ($)</Label>
              <Input
                type="number"
                value={form.taxAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, taxAmount: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.paymentStatus}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  paymentStatus: v as PropertyTaxRecord["paymentStatus"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Due date</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, dueDate: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
