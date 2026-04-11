import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  Plus,
  Send,
  PenTool,
  Eye,
  RefreshCw,
} from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Lease {
  id: string
  applicationId: string | null
  tenantId: string | null
  ownerId: string
  leaseStart: string
  leaseEnd: string
  monthlyRent: number
  securityDeposit: number | null
  status: string
  ownerSignedAt: string | null
  tenantSignedAt: string | null
  createdAt: string
  tenant?: { firstName: string; lastName: string; email: string }
}

interface LeaseManagementProps {
  propertyId: string
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-slate-600",
  pending_signature: "bg-amber-100 text-amber-700",
  partially_signed: "bg-blue-100 text-blue-700",
  signed: "bg-emerald-100 text-emerald-700",
  active: "bg-green-100 text-green-700",
  terminated: "bg-red-100 text-red-700",
  expired: "bg-muted text-slate-500",
}

export function LeaseManagement({ propertyId }: LeaseManagementProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [leases, setLeases] = useState<Lease[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [creating, setCreating] = useState(false)
  const [newLease, setNewLease] = useState({
    applicationId: "",
    leaseStart: "",
    leaseEnd: "",
    monthlyRent: "",
    securityDeposit: "",
  })

  useEffect(() => {
    loadLeases()
  }, [propertyId])

  const loadLeases = async () => {
    try {
      setLoading(true)
      const data = await featureApi.leases.listForProperty(propertyId)
      setLeases(data as Lease[])
    } catch {
      toast({ title: "Failed to load leases", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const createLease = async () => {
    try {
      setCreating(true)
      await featureApi.leases.create({
        propertyId,
        applicationId: newLease.applicationId || undefined,
        leaseStart: newLease.leaseStart,
        leaseEnd: newLease.leaseEnd,
        monthlyRent: Number(newLease.monthlyRent),
        securityDeposit: newLease.securityDeposit ? Number(newLease.securityDeposit) : undefined,
      })
      toast({ title: "Lease created" })
      setShowCreate(false)
      setNewLease({ applicationId: "", leaseStart: "", leaseEnd: "", monthlyRent: "", securityDeposit: "" })
      await loadLeases()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create lease"
      toast({ title: message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const sendForSignature = async (leaseId: string) => {
    try {
      await featureApi.leases.sendForSignature(leaseId)
      toast({ title: "Lease sent for signature" })
      await loadLeases()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send"
      toast({ title: message, variant: "destructive" })
    }
  }

  const signLease = async (leaseId: string) => {
    try {
      await featureApi.leases.sign(leaseId)
      toast({ title: "Lease signed" })
      await loadLeases()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign"
      toast({ title: message, variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Leases
              </CardTitle>
              <CardDescription>
                {leases.length} lease{leases.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={loadLeases}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> New Lease
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leases.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No leases yet</p>
              <p className="text-sm mt-1">Create a lease after approving a tenant application</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leases.map((lease) => (
                    <TableRow key={lease.id}>
                      <TableCell>
                        {lease.tenant ? (
                          <div>
                            <p className="font-medium text-sm">
                              {lease.tenant.firstName} {lease.tenant.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{lease.tenant.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(lease.leaseStart).toLocaleDateString()} –{" "}
                        {new Date(lease.leaseEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(lease.monthlyRent).toLocaleString()}/mo
                      </TableCell>
                      <TableCell>
                        <Badge className={statusStyles[lease.status] ?? statusStyles.draft}>
                          {lease.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {lease.status === "draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendForSignature(lease.id)}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" /> Send
                            </Button>
                          )}
                          {(lease.status === "pending_signature" || lease.status === "partially_signed") &&
                            !lease.ownerSignedAt && (
                              <Button size="sm" onClick={() => signLease(lease.id)}>
                                <PenTool className="h-3.5 w-3.5 mr-1" /> Sign
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLease(lease)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Lease Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lease</DialogTitle>
            <DialogDescription>
              Set lease terms for an approved tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Application ID (optional)</Label>
              <Input
                value={newLease.applicationId}
                onChange={(e) => setNewLease({ ...newLease, applicationId: e.target.value })}
                placeholder="From an approved application"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lease Start</Label>
                <Input
                  type="date"
                  value={newLease.leaseStart}
                  onChange={(e) => setNewLease({ ...newLease, leaseStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lease End</Label>
                <Input
                  type="date"
                  value={newLease.leaseEnd}
                  onChange={(e) => setNewLease({ ...newLease, leaseEnd: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Rent ($)</Label>
                <Input
                  type="number"
                  value={newLease.monthlyRent}
                  onChange={(e) => setNewLease({ ...newLease, monthlyRent: e.target.value })}
                  placeholder="2000"
                />
              </div>
              <div className="space-y-2">
                <Label>Security Deposit ($)</Label>
                <Input
                  type="number"
                  value={newLease.securityDeposit}
                  onChange={(e) => setNewLease({ ...newLease, securityDeposit: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                onClick={createLease}
                disabled={creating || !newLease.leaseStart || !newLease.leaseEnd || !newLease.monthlyRent}
              >
                {creating ? "Creating..." : "Create Lease"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lease Detail Dialog */}
      <Dialog open={!!selectedLease} onOpenChange={() => setSelectedLease(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lease Details</DialogTitle>
          </DialogHeader>
          {selectedLease && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Status</p>
                  <Badge className={statusStyles[selectedLease.status] ?? ""}>
                    {selectedLease.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-500">Monthly Rent</p>
                  <p className="font-semibold">${Number(selectedLease.monthlyRent).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Lease Period</p>
                  <p className="font-medium">
                    {new Date(selectedLease.leaseStart).toLocaleDateString()} –{" "}
                    {new Date(selectedLease.leaseEnd).toLocaleDateString()}
                  </p>
                </div>
                {selectedLease.securityDeposit && (
                  <div>
                    <p className="text-slate-500">Security Deposit</p>
                    <p className="font-medium">${Number(selectedLease.securityDeposit).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Owner Signed</p>
                  <p className="font-medium">
                    {selectedLease.ownerSignedAt
                      ? new Date(selectedLease.ownerSignedAt).toLocaleDateString()
                      : "Not yet"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Tenant Signed</p>
                  <p className="font-medium">
                    {selectedLease.tenantSignedAt
                      ? new Date(selectedLease.tenantSignedAt).toLocaleDateString()
                      : "Not yet"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
