import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Users,
  UserPlus,
  Trash2,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CoOwner {
  id: string
  userId: string
  status: "pending" | "accepted" | "declined"
  createdAt: string
  user?: {
    firstName: string
    lastName: string
    email: string
  }
  email?: string
}

interface CoOwnerManagementProps {
  propertyId: string
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  accepted: { icon: CheckCircle2, color: "text-emerald-500", label: "Active" },
  pending: { icon: Clock, color: "text-amber-500", label: "Pending" },
  declined: { icon: XCircle, color: "text-red-500", label: "Declined" },
}

export function CoOwnerManagement({ propertyId }: CoOwnerManagementProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [coOwners, setCoOwners] = useState<CoOwner[]>([])
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    loadCoOwners()
  }, [propertyId])

  const loadCoOwners = async () => {
    try {
      setLoading(true)
      const data = await featureApi.coOwners.list(propertyId)
      setCoOwners(data as CoOwner[])
    } catch {
      toast({ title: "Failed to load co-owners", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const inviteCoOwner = async () => {
    if (!email.trim()) return
    try {
      setInviting(true)
      await featureApi.coOwners.invite(propertyId, email.trim())
      toast({ title: `Invitation sent to ${email}` })
      setEmail("")
      setShowInvite(false)
      await loadCoOwners()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to invite co-owner"
      toast({ title: message, variant: "destructive" })
    } finally {
      setInviting(false)
    }
  }

  const removeCoOwner = async (userId: string) => {
    try {
      await featureApi.coOwners.remove(propertyId, userId)
      toast({ title: "Co-owner removed" })
      await loadCoOwners()
    } catch {
      toast({ title: "Failed to remove co-owner", variant: "destructive" })
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Co-Owners
            </CardTitle>
            <CardDescription>
              Co-owners have equal access to manage this property
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Invite
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showInvite && (
          <div className="mb-4 p-4 border rounded-lg bg-muted dark:bg-card space-y-3">
            <Label>Co-Owner Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coowner@example.com"
                onKeyDown={(e) => e.key === "Enter" && inviteCoOwner()}
              />
              <Button onClick={inviteCoOwner} disabled={inviting || !email.trim()}>
                {inviting ? "Sending..." : "Send Invite"}
              </Button>
              <Button variant="outline" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {coOwners.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No co-owners yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {coOwners.map((co) => {
              const cfg = statusConfig[co.status] ?? statusConfig.pending
              const Icon = cfg.icon
              const name = co.user
                ? `${co.user.firstName} ${co.user.lastName}`
                : co.email ?? "Unknown"
              const emailAddr = co.user?.email ?? co.email ?? ""

              return (
                <div
                  key={co.id}
                  className="flex items-center justify-between p-3 bg-muted dark:bg-card rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                    <div>
                      <p className="font-medium text-sm">{name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {emailAddr}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        co.status === "accepted"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : co.status === "declined"
                            ? "bg-red-100 text-red-700"
                            : ""
                      }`}
                    >
                      {cfg.label}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove co-owner?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {name} will no longer have access to this property.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeCoOwner(co.userId)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
