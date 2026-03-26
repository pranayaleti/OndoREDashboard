// src/components/shared/shared-owners-view.tsx
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Search, X, Loader2, AlertCircle } from "lucide-react"
import { authApi } from "@/lib/api"
import type { InvitedUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatUSDate } from "@/lib/us-format"

export interface SharedOwnersViewProps {
  title: string
  description?: string
}

export function SharedOwnersView({ title, description }: SharedOwnersViewProps) {
  const { toast } = useToast()
  const [owners, setOwners] = useState<InvitedUser[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOwners = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await authApi.getInvitedUsers(1, 500)
      const ownerList = result.users.filter((u) => u.role === "owner")
      setOwners(ownerList)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load owners"
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOwners()
  }, [fetchOwners])

  const filtered = search.trim()
    ? owners.filter((o) => {
        const q = search.toLowerCase()
        return (
          o.firstName.toLowerCase().includes(q) ||
          o.lastName.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q)
        )
      })
    : owners

  const activeCount = owners.filter((o) => o.isActive).length
  const inactiveCount = owners.length - activeCount

  const handleToggleStatus = async (owner: InvitedUser) => {
    setUpdatingId(owner.id)
    try {
      await authApi.updateUserStatus(owner.id, { isActive: !owner.isActive })
      toast({
        title: owner.isActive ? "Owner deactivated" : "Owner activated",
        description: `${owner.firstName} ${owner.lastName}`,
      })
      await fetchOwners()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update status"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-7 w-7" />
          {title}
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Owners", value: owners.length },
          { label: "Active", value: activeCount },
          { label: "Inactive", value: inactiveCount },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchOwners}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Owners</CardTitle>
          <CardDescription>
            {search ? `${filtered.length} matching owners` : `${owners.length} total owners`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading owners…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>{search ? "No owners match your search." : "No owners yet."}</p>
              {search && (
                <Button variant="link" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Name</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Properties</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Joined</th>
                    <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">
                        {o.firstName} {o.lastName}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{o.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={o.isActive ? "default" : "secondary"}>
                          {o.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{o.propertyCount}</td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {formatUSDate(o.createdAt)}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === o.id}
                          onClick={() => handleToggleStatus(o)}
                        >
                          {updatingId === o.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : o.isActive ? (
                            "Deactivate"
                          ) : (
                            "Activate"
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
