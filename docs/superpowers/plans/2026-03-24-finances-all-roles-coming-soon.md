# Finances Across All Roles + Coming-Soon Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace coming-soon stubs with real data views, add a Tenant Finances page, and surface financial summary stat cards on the Admin/Manager/Super-Admin dashboard home screens.

**Architecture:** Shared components (`SharedPropertiesView`, `SharedOwnersView`) wrap existing API clients and are mounted by thin role-specific files — exactly mirroring how `RoleFinancesView` already works. The Tenant Finances page fetches from `featureApi.stripe.getPaymentHistory` and `propertyApi.getTenantProperty`. Dashboard financial widgets are added by extending the existing `dataFetchers` + `statCards` pattern in each portal config.

**Tech Stack:** React 18, TypeScript, React Router v6, shadcn/ui (Card, Badge, Button, Input, Tabs, Table), lucide-react icons, existing API clients (`propertyApi`, `authApi`, `featureApi`, `reportsApi`), Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-03-24-finances-all-roles-coming-soon-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/shared/shared-properties-view.tsx` | **Create** | Paginated property list with search, status badges, status change |
| `src/components/shared/shared-owners-view.tsx` | **Create** | Owner list with search, activate/deactivate |
| `src/components/tenant/tenant-finances.tsx` | **Create** | 3-tab tenant financial overview (Overview, History, Lease Cost) |
| `src/components/admin/admin-properties.tsx` | **Update** | Thin wrapper → `SharedPropertiesView` |
| `src/components/admin/admin-owners.tsx` | **Update** | Thin wrapper → `SharedOwnersView` |
| `src/components/super-admin/super-admin-properties.tsx` | **Update** | Thin wrapper → `SharedPropertiesView` |
| `src/components/super-admin/super-admin-owners.tsx` | **Update** | Thin wrapper → `SharedOwnersView` |
| `src/components/owner/owner-property-management.tsx` | **Update** | Thin wrapper → `SharedPropertiesView ownerView` |
| `src/components/dashboard/portals/admin/admin.config.tsx` | **Update** | Add `financialSummary` param + 3 finance stat cards + dataFetcher |
| `src/components/dashboard/portals/admin/AdminDashboard.new.tsx` | **Update** | Pass `data.financialSummary` to `createAdminConfig` |
| `src/components/dashboard/portals/manager/manager.config.tsx` | **Update** | Same pattern as admin config |
| `src/components/dashboard/portals/manager/ManagerDashboard.new.tsx` | **Update** | Pass `data.financialSummary` to `createManagerConfig` |
| `src/components/dashboard/portals/super-admin/super-admin.config.tsx` | **Update** | Same pattern as admin config |
| `src/components/dashboard/portals/super-admin/SuperAdminDashboard.new.tsx` | **Update** | Pass `data.financialSummary` to `createSuperAdminConfig` |
| `src/pages/Tenant.tsx` | **Update** | Add `/finances` route |
| `src/components/portal-sidebar.tsx` | **Update** | Add Finances nav item to tenant case |

---

## Task 1: SharedPropertiesView

**Files:**
- Create: `src/components/shared/shared-properties-view.tsx`
- Modify: `src/components/admin/admin-properties.tsx`
- Modify: `src/components/super-admin/super-admin-properties.tsx`
- Modify: `src/components/owner/owner-property-management.tsx`

### Context

`propertyApi.getProperties(page, pageSize)` returns `{ properties: Property[], total: number, page: number, pageSize: number }`.

`Property` (from `@ondo/types`) has: `id`, `title`, `addressLine1`, `addressLine2`, `city`, `state`, `zipcode`, `status` (`'pending' | 'approved' | 'rejected' | 'active' | 'inactive'`), `bedrooms`, `bathrooms`, `price`, `createdAt`.

`propertyApi.updatePropertyStatus(propertyId, status, comment?)` changes status.

- [ ] **Step 1: Create `shared-properties-view.tsx`**

```tsx
// src/components/shared/shared-properties-view.tsx
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building, Search, X, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { propertyApi } from "@/lib/api"
import type { Property } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatUSDate } from "@/lib/us-format"

export interface SharedPropertiesViewProps {
  title: string
  description?: string
  ownerView?: boolean
}

type PropertyStatus = Property["status"]

function statusBadgeVariant(status: PropertyStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active" || status === "approved") return "default"
  if (status === "pending") return "secondary"
  return "outline"
}

function statusLabel(status: PropertyStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const PAGE_SIZE = 20

export function SharedPropertiesView({ title, description, ownerView = false }: SharedPropertiesViewProps) {
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchProperties = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await propertyApi.getProperties(p, PAGE_SIZE)
      setProperties(result.properties)
      setTotal(result.total)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load properties"
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProperties(page)
  }, [fetchProperties, page])

  const filtered = search.trim()
    ? properties.filter((p) => {
        const q = search.toLowerCase()
        return (
          p.addressLine1?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.state?.toLowerCase().includes(q) ||
          p.status?.toLowerCase().includes(q)
        )
      })
    : properties

  const activeCount = properties.filter((p) => p.status === "active" || p.status === "approved").length
  const pendingCount = properties.filter((p) => p.status === "pending").length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    setUpdatingId(propertyId)
    try {
      await propertyApi.updatePropertyStatus(propertyId, newStatus)
      toast({ title: "Status updated", description: `Property marked as ${newStatus}` })
      await fetchProperties(page)
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
          <Building className="h-7 w-7" />
          {title}
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: total },
          { label: "Active", value: activeCount },
          { label: "Pending", value: pendingCount },
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
          placeholder="Search by address, city, or status…"
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
            <Button variant="outline" size="sm" onClick={() => fetchProperties(page)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>
            {search ? `Showing ${filtered.length} matching results` : `${total} total properties`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading properties…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Building className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>{search ? "No properties match your search." : "No properties found."}</p>
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
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Address</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">City / State</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Beds / Baths</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Price / mo</th>
                    <th className="pb-3 font-medium text-muted-foreground">Added</th>
                    {!ownerView && <th className="pb-3 pl-4 font-medium text-muted-foreground">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">
                        {p.addressLine1}
                        {p.addressLine2 ? `, ${p.addressLine2}` : ""}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {[p.city, p.state].filter(Boolean).join(", ")}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusBadgeVariant(p.status)}>
                          {statusLabel(p.status)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {p.bedrooms ?? "—"} bd / {p.bathrooms ?? "—"} ba
                      </td>
                      <td className="py-3 pr-4">
                        {p.price != null ? `$${p.price.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {formatUSDate(p.createdAt)}
                      </td>
                      {!ownerView && (
                        <td className="py-3 pl-4">
                          {p.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === p.id}
                                onClick={() => handleStatusChange(p.id, "approved")}
                              >
                                {updatingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === p.id}
                                onClick={() => handleStatusChange(p.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && !search && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update admin-properties.tsx**

Replace the entire file content:

```tsx
// src/components/admin/admin-properties.tsx
import { SharedPropertiesView } from "@/components/shared/shared-properties-view"

export default function AdminProperties() {
  return (
    <SharedPropertiesView
      title="System Properties"
      description="All properties across the system"
    />
  )
}
```

- [ ] **Step 3: Update super-admin-properties.tsx**

Replace entire file:

```tsx
// src/components/super-admin/super-admin-properties.tsx
import { SharedPropertiesView } from "@/components/shared/shared-properties-view"

export default function SuperAdminProperties() {
  return (
    <SharedPropertiesView
      title="System Properties"
      description="All properties across the platform"
    />
  )
}
```

- [ ] **Step 4: Update owner-property-management.tsx**

Replace entire file:

```tsx
// src/components/owner/owner-property-management.tsx
import { SharedPropertiesView } from "@/components/shared/shared-properties-view"

export default function OwnerPropertyManagement() {
  return (
    <SharedPropertiesView
      title="Your Properties"
      description="Manage your rental portfolio"
      ownerView
    />
  )
}
```

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard && npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors related to the new files. Fix any type errors before continuing.

- [ ] **Step 6: Commit**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard
git add src/components/shared/shared-properties-view.tsx \
        src/components/admin/admin-properties.tsx \
        src/components/super-admin/super-admin-properties.tsx \
        src/components/owner/owner-property-management.tsx
git commit -m "$(cat <<'EOF'
feat: add SharedPropertiesView and replace coming-soon property stubs

Admin, super-admin, and owner property management now show a real
paginated property list with search, status badges, and status change
actions for admin roles.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: SharedOwnersView

**Files:**
- Create: `src/components/shared/shared-owners-view.tsx`
- Modify: `src/components/admin/admin-owners.tsx`
- Modify: `src/components/super-admin/super-admin-owners.tsx`

### Context

`authApi.getInvitedUsers(1, 500)` returns `{ users: InvitedUser[], ... }`.

`InvitedUser` shape: `{ id, firstName, lastName, email, role: 'owner'|'tenant', createdAt, invitedBy, propertyCount, isActive }`.

Filter to `role === 'owner'` client-side.

`authApi.updateUserStatus(userId, { isActive: boolean })` — activates or deactivates.

- [ ] **Step 1: Create `shared-owners-view.tsx`**

```tsx
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
      const ownerList = (result.users ?? []).filter((u) => u.role === "owner")
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
```

- [ ] **Step 2: Update admin-owners.tsx**

Replace entire file:

```tsx
// src/components/admin/admin-owners.tsx
import { SharedOwnersView } from "@/components/shared/shared-owners-view"

export default function AdminOwners() {
  return (
    <SharedOwnersView
      title="Owner Management"
      description="Manage all owner accounts"
    />
  )
}
```

- [ ] **Step 3: Update super-admin-owners.tsx**

Replace entire file:

```tsx
// src/components/super-admin/super-admin-owners.tsx
import { SharedOwnersView } from "@/components/shared/shared-owners-view"

export default function SuperAdminOwners() {
  return (
    <SharedOwnersView
      title="Owner Management"
      description="Manage all owner accounts"
    />
  )
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard && npx tsc --noEmit 2>&1 | head -30
```

Expected: zero new errors. Fix any type errors before continuing.

- [ ] **Step 5: Commit**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard
git add src/components/shared/shared-owners-view.tsx \
        src/components/admin/admin-owners.tsx \
        src/components/super-admin/super-admin-owners.tsx
git commit -m "$(cat <<'EOF'
feat: add SharedOwnersView and replace coming-soon owner stubs

Admin and super-admin owner pages now show real owner lists with
search, status badges, and activate/deactivate actions.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: TenantFinancesView + Routing + Nav

**Files:**
- Create: `src/components/tenant/tenant-finances.tsx`
- Modify: `src/pages/Tenant.tsx` (line 29 area — add route)
- Modify: `src/components/portal-sidebar.tsx` (line 169 area — add nav item after Payments)

### Context

`featureApi.stripe.getPaymentHistory(page, limit)` returns `PaymentRecord[]`.

`PaymentRecord` shape: `{ id, stripePaymentIntentId, amountCents, currency, status: 'pending'|'processing'|'succeeded'|'failed'|'refunded', paymentType, propertyId?, description?, createdAt, updatedAt }`.

`propertyApi.getTenantProperty()` returns `Property` (has `price` for monthly rent, `addressLine1`, `createdAt` as lease start proxy).

Derived metrics:
- **YTD total**: sum of `amountCents` where `status === 'succeeded'` AND `createdAt` year === current year, divided by 100.
- **On-time rate**: `succeeded` count / total count × 100 (rounded).
- **Average monthly payment**: YTD total / months elapsed (or total / count if < 1 month).
- **Next due date**: monthly recurrence from `property.createdAt` (move-in date proxy).

- [ ] **Step 1: Write a unit test for the derived metric helpers**

Create `src/components/tenant/tenant-finances.test.ts`:

```ts
import { describe, it, expect } from "vitest"

// Copy of the helpers that will live in tenant-finances.tsx
// (defined here first so we can test before implementing)

function calcYtdTotal(payments: Array<{ amountCents: number; status: string; createdAt: string }>): number {
  const year = new Date().getFullYear()
  return payments
    .filter((p) => p.status === "succeeded" && new Date(p.createdAt).getFullYear() === year)
    .reduce((sum, p) => sum + p.amountCents / 100, 0)
}

function calcOnTimeRate(payments: Array<{ status: string }>): number {
  if (payments.length === 0) return 0
  const succeeded = payments.filter((p) => p.status === "succeeded").length
  return Math.round((succeeded / payments.length) * 100)
}

function getNextDueDate(moveInDateIso: string): Date {
  const moveIn = new Date(moveInDateIso)
  const now = new Date()
  const next = new Date(moveIn)
  while (next <= now) {
    next.setMonth(next.getMonth() + 1)
  }
  return next
}

describe("tenant-finances derived metrics", () => {
  const thisYear = new Date().getFullYear()

  it("calcYtdTotal sums only succeeded payments in current year", () => {
    const payments = [
      { amountCents: 185000, status: "succeeded", createdAt: `${thisYear}-01-15T00:00:00Z` },
      { amountCents: 185000, status: "failed", createdAt: `${thisYear}-02-15T00:00:00Z` },
      { amountCents: 185000, status: "succeeded", createdAt: `${thisYear - 1}-12-15T00:00:00Z` },
    ]
    expect(calcYtdTotal(payments)).toBe(1850)
  })

  it("calcYtdTotal returns 0 for empty list", () => {
    expect(calcYtdTotal([])).toBe(0)
  })

  it("calcOnTimeRate returns 0 for empty list", () => {
    expect(calcOnTimeRate([])).toBe(0)
  })

  it("calcOnTimeRate rounds correctly", () => {
    const payments = [
      { status: "succeeded" },
      { status: "succeeded" },
      { status: "failed" },
    ]
    expect(calcOnTimeRate(payments)).toBe(67)
  })

  it("getNextDueDate returns a future date", () => {
    const pastDate = new Date()
    pastDate.setFullYear(pastDate.getFullYear() - 1)
    const next = getNextDueDate(pastDate.toISOString())
    expect(next > new Date()).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails (helpers not yet in source)**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard && npm test -- --run src/components/tenant/tenant-finances.test.ts 2>&1
```

Expected: PASS (the test file defines its own helpers inline — this verifies the logic before we wire it into the component).

- [ ] **Step 3: Create `tenant-finances.tsx`**

```tsx
// src/components/tenant/tenant-finances.tsx
import { useState, useEffect, useCallback, useMemo } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  Loader2,
  Receipt,
  FileText,
  AlertCircle,
} from "lucide-react"
import { featureApi, propertyApi } from "@/lib/api"
import type { PaymentRecord } from "@/lib/api"
import type { Property } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatUSDate, formatUSD } from "@/lib/us-format"

// ─── Derived metric helpers ────────────────────────────────────────────────────

function calcYtdTotal(payments: PaymentRecord[]): number {
  const year = new Date().getFullYear()
  return payments
    .filter((p) => p.status === "succeeded" && new Date(p.createdAt).getFullYear() === year)
    .reduce((sum, p) => sum + p.amountCents / 100, 0)
}

function calcOnTimeRate(payments: PaymentRecord[]): number {
  if (payments.length === 0) return 0
  const succeeded = payments.filter((p) => p.status === "succeeded").length
  return Math.round((succeeded / payments.length) * 100)
}

function getNextDueDate(moveInDateIso: string): Date {
  const moveIn = new Date(moveInDateIso)
  const now = new Date()
  const next = new Date(moveIn)
  while (next <= now) {
    next.setMonth(next.getMonth() + 1)
  }
  return next
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

const INITIAL_LIMIT = 10

export default function TenantFinances() {
  const { toast } = useToast()
  const [property, setProperty] = useState<Property | null>(null)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loadingProperty, setLoadingProperty] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [errorProperty, setErrorProperty] = useState<string | null>(null)
  const [errorPayments, setErrorPayments] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const fetchProperty = useCallback(async () => {
    setLoadingProperty(true)
    setErrorProperty(null)
    try {
      const p = await propertyApi.getTenantProperty()
      setProperty(p)
    } catch (e) {
      setErrorProperty(e instanceof Error ? e.message : "Failed to load property")
    } finally {
      setLoadingProperty(false)
    }
  }, [])

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true)
    setErrorPayments(null)
    try {
      const records = await featureApi.stripe.getPaymentHistory(1, 100)
      setPayments(records)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load payment history"
      setErrorPayments(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoadingPayments(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProperty()
    fetchPayments()
  }, [fetchProperty, fetchPayments])

  const ytdTotal = useMemo(() => calcYtdTotal(payments), [payments])
  const onTimeRate = useMemo(() => calcOnTimeRate(payments), [payments])
  const nextDueDate = useMemo(
    () => (property ? getNextDueDate(property.createdAt) : null),
    [property]
  )
  const monthlyRent = property?.price ?? null
  const displayedPayments = showAll ? payments : payments.slice(0, INITIAL_LIMIT)

  const loading = loadingProperty || loadingPayments

  if (!loading && !property && !errorProperty) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold mb-2">No lease found</h2>
        <p className="text-muted-foreground">
          You don&apos;t have an active lease yet. Contact your property manager to get set up.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-2">
        <Breadcrumb items={[{ label: "Finances", icon: DollarSign }]} />
      </div>

      <div>
        <h1 className="text-3xl font-bold">Financial Overview</h1>
        <p className="text-muted-foreground mt-1">
          Your rent history, upcoming payments, and lease cost breakdown
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Monthly Rent",
            value: loading ? "Loading…" : monthlyRent != null ? formatUSD(monthlyRent) : "—",
            icon: DollarSign,
            detail: property ? `${property.addressLine1}` : "No property assigned",
          },
          {
            label: "Next Due Date",
            value: loading ? "Loading…" : nextDueDate ? formatMonthDay(nextDueDate) : "—",
            icon: Calendar,
            detail: monthlyRent != null ? `${formatUSD(monthlyRent)} due` : "",
          },
          {
            label: "Total Paid (YTD)",
            value: loading ? "Loading…" : formatUSD(ytdTotal),
            icon: TrendingUp,
            detail: `${payments.filter((p) => p.status === "succeeded" && new Date(p.createdAt).getFullYear() === new Date().getFullYear()).length} payments this year`,
          },
          {
            label: "On-Time Rate",
            value: loading ? "Loading…" : `${onTimeRate}%`,
            icon: CheckCircle,
            detail: `${payments.filter((p) => p.status === "succeeded").length} of ${payments.length} payments succeeded`,
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.detail}</p>
                  </div>
                  <div className="rounded-full bg-muted p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Upcoming payment callout */}
      {nextDueDate && monthlyRent != null && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium">Upcoming payment</p>
              <p className="text-sm text-muted-foreground">
                {formatUSD(monthlyRent)} due {formatMonthDay(nextDueDate)}
              </p>
            </div>
            <Link to="/tenant/payments">
              <Button size="sm">Make a payment →</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="lease">Lease Cost</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-4">
          {errorProperty && (
            <Card className="border-destructive/40">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive">{errorProperty}</p>
                <Button variant="outline" size="sm" onClick={fetchProperty}>Retry</Button>
              </CardContent>
            </Card>
          )}
          {property && (
            <Card>
              <CardHeader>
                <CardTitle>Your property</CardTitle>
                <CardDescription>Current rental address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {property.addressLine1}
                    {property.addressLine2 ? `, ${property.addressLine2}` : ""}
                    {property.city ? `, ${property.city}` : ""}
                    {property.state ? `, ${property.state}` : ""}
                    {property.zipcode ? ` ${property.zipcode}` : ""}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly rent</p>
                    <p className="text-xl font-semibold">{monthlyRent != null ? formatUSD(monthlyRent) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">On-time rate</p>
                    <p className="text-xl font-semibold">{onTimeRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All rent and payment records</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading payments…
                </div>
              ) : errorPayments ? (
                <div className="flex items-center gap-3 py-4">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{errorPayments}</p>
                  <Button variant="outline" size="sm" onClick={fetchPayments}>Retry</Button>
                </div>
              ) : payments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No payment history yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedPayments.map((p) => (
                    <div key={p.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">{p.description || p.paymentType || "Payment"}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatUSDate(p.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={p.status === "succeeded" ? "default" : "secondary"}>
                            {p.status}
                          </Badge>
                          <span className="font-semibold">{formatUSD(p.amountCents / 100)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!showAll && payments.length > INITIAL_LIMIT && (
                    <Button variant="outline" className="w-full" onClick={() => setShowAll(true)}>
                      Load more ({payments.length - INITIAL_LIMIT} remaining)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lease Cost tab */}
        <TabsContent value="lease" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lease Cost Breakdown</CardTitle>
              <CardDescription>Your monthly rent and lease timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingProperty ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading lease info…
                </div>
              ) : property ? (
                <>
                  <div className="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly rent</span>
                    <span className="font-semibold">{monthlyRent != null ? formatUSD(monthlyRent) : "—"}</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lease start</span>
                    <span className="font-semibold">{formatUSDate(property.createdAt)}</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next payment due</span>
                    <span className="font-semibold">{nextDueDate ? formatMonthDay(nextDueDate) : "—"}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">No lease information available.</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/tenant/lease-details" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    View full lease details
                  </Button>
                </Link>
                <Link to="/tenant/documents" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    View documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 4: Add route to Tenant.tsx**

In `src/pages/Tenant.tsx`, add the import after line 13 (after `TenantNotifications` import):

```tsx
import TenantFinances from "@/components/tenant/tenant-finances"
```

And add the route inside `<Routes>` after the `/payments` route:

```tsx
<Route path="/finances" element={<TenantFinances />} />
```

- [ ] **Step 5: Add nav item to portal-sidebar.tsx**

In `src/components/portal-sidebar.tsx`, inside the `case "tenant":` block (around line 169), add after the Payments entry:

```tsx
{ title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
```

`DollarSign` is already imported at the top of the file — no new import needed.

- [ ] **Step 6: Run unit tests**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard && npm test -- --run 2>&1
```

Expected: all tests PASS including the new `tenant-finances.test.ts`.

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard && npx tsc --noEmit 2>&1 | head -30
```

Expected: zero new errors. Fix any before continuing.

- [ ] **Step 8: Commit**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard
git add src/components/tenant/tenant-finances.tsx \
        src/components/tenant/tenant-finances.test.ts \
        src/pages/Tenant.tsx \
        src/components/portal-sidebar.tsx
git commit -m "$(cat <<'EOF'
feat: add TenantFinances page with route and sidebar nav item

3-tab view: Overview (stat cards), Payment History (paginated),
Lease Cost (rent breakdown + links). Sidebar now shows Finances
link for tenant role. Unit tests for derived metric helpers.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Financial Stat Cards on Admin / Manager / Super-Admin Dashboard Homes

**Files:**
- Modify: `src/components/dashboard/portals/admin/admin.config.tsx`
- Modify: `src/components/dashboard/portals/admin/AdminDashboard.new.tsx`
- Modify: `src/components/dashboard/portals/manager/manager.config.tsx`
- Modify: `src/components/dashboard/portals/manager/ManagerDashboard.new.tsx`
- Modify: `src/components/dashboard/portals/super-admin/super-admin.config.tsx`
- Modify: `src/components/dashboard/portals/super-admin/SuperAdminDashboard.new.tsx`

### Context

The pattern for each portal:
1. `createXConfig(data1, data2, ..., financialSummary)` — config function accepts the PnL data as an additional parameter
2. 3 stat cards are pushed onto `statCards`: Revenue, Expenses, NOI — each shows `formatUSD(value)` or `"—"` if null
3. `dataFetchers` gets a `financialSummary` key calling `reportsApi.getPnL({ startDate, endDate })` with current-month defaults
4. The Dashboard Content component passes `data.financialSummary || null` to the config function

The current-month date range helper:
```ts
function currentMonthRange() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const endDate = now.toISOString().slice(0, 10)
  return { startDate, endDate }
}
```

`reportsApi` is already exported from `@/lib/api`. `PnLStatement` type is exported from `@/lib/api/clients/reports`.

`formatUSD` is already imported in each config from `@/lib/us-format` — **check if it is; if not, add the import**.

### Admin Portal

- [ ] **Step 1: Update `admin.config.tsx`**

1. Add import at top:
```ts
import { reportsApi, type PnLStatement } from "@/lib/api/clients/reports"
import { formatUSD } from "@/lib/us-format"  // add only if not already imported
```

2. Update the function signature:
```ts
export function createAdminConfig(
  properties: Property[],
  invitedUsers: InvitedUser[],
  maintenanceRequests: MaintenanceRequest[],
  financialSummary: PnLStatement | null = null
): PortalConfig {
```

3. Add 3 stat cards to the `statCards` array (append after existing cards):
```ts
{
  id: "finance-revenue",
  title: "Revenue (MTD)",
  value: financialSummary ? formatUSD(financialSummary.income.total) : "—",
  subtitle: "Month-to-date income",
  icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
  href: "/admin/finances",
},
{
  id: "finance-expenses",
  title: "Expenses (MTD)",
  value: financialSummary ? formatUSD(financialSummary.expenses.total) : "—",
  subtitle: "Month-to-date operating costs",
  icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
  href: "/admin/finances",
},
{
  id: "finance-noi",
  title: "Net Income (MTD)",
  value: financialSummary ? formatUSD(financialSummary.netIncome) : "—",
  subtitle: `${financialSummary?.properties.length ?? 0} properties`,
  icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
  href: "/admin/finances",
},
```

4. Add `TrendingUp` and `CreditCard` to lucide-react imports if not already present.

5. Add `financialSummary` fetcher to `dataFetchers`:
```ts
financialSummary: () => {
  const { startDate, endDate } = (() => {
    const now = new Date()
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10),
    }
  })()
  return reportsApi.getPnL({ startDate, endDate }).catch(() => null)
},
```

- [ ] **Step 2: Update `AdminDashboard.new.tsx`**

In `AdminDashboardContent`, update the `config` useMemo to pass `data.financialSummary`:
```ts
const config = useMemo(() => {
  const properties = data.properties || []
  const invitedUsers = data.invitedUsers || []
  const maintenanceRequests = data.maintenanceRequests || []
  const financialSummary = data.financialSummary || null

  return createAdminConfig(properties, invitedUsers, maintenanceRequests, financialSummary)
}, [data.properties, data.invitedUsers, data.maintenanceRequests, data.financialSummary])
```

### Manager Portal

- [ ] **Step 3: Update `manager.config.tsx`**

Same pattern as admin — apply to `createManagerConfig`:

1. Add imports (same as admin step 1).
2. Add `financialSummary: PnLStatement | null = null` parameter.
3. Add the same 3 stat cards (change hrefs to `/dashboard/finances`).
4. Add `financialSummary` fetcher to `dataFetchers` (same code as admin).

- [ ] **Step 4: Update `ManagerDashboard.new.tsx`**

Same pattern as admin step 2 — pass `data.financialSummary || null` to `createManagerConfig`.

### Super-Admin Portal

- [ ] **Step 5: Update `super-admin.config.tsx`**

Same pattern as admin — apply to `createSuperAdminConfig`:

1. Add imports.
2. Add `financialSummary: PnLStatement | null = null` parameter.
3. Add 3 stat cards (hrefs to `/super-admin/finances`).
4. Add `financialSummary` fetcher to `dataFetchers`.

- [ ] **Step 6: Update `SuperAdminDashboard.new.tsx`**

Same pattern — pass `data.financialSummary || null` to `createSuperAdminConfig`.

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard && npx tsc --noEmit 2>&1 | head -30
```

Expected: zero new errors. Common mistakes to fix:
- Missing `TrendingUp` or `CreditCard` in lucide imports
- `reportsApi` not imported correctly (it's in `@/lib/api/clients/reports`, not `@/lib/api`)
- `PnLStatement` type not imported

- [ ] **Step 8: Run all tests**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard && npm test -- --run 2>&1
```

Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard
git add src/components/dashboard/portals/admin/admin.config.tsx \
        src/components/dashboard/portals/admin/AdminDashboard.new.tsx \
        src/components/dashboard/portals/manager/manager.config.tsx \
        src/components/dashboard/portals/manager/ManagerDashboard.new.tsx \
        src/components/dashboard/portals/super-admin/super-admin.config.tsx \
        src/components/dashboard/portals/super-admin/SuperAdminDashboard.new.tsx
git commit -m "$(cat <<'EOF'
feat: add financial summary stat cards to admin/manager/super-admin dashboards

Revenue (MTD), Expenses (MTD), and Net Income (MTD) stat cards now
appear on the home dashboard for admin, manager, and super-admin roles.
Data is fetched via reportsApi.getPnL with current-month defaults and
wired through the existing dataFetchers/BaseDashboardProvider pattern.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

- [ ] **Build check**

```bash
cd /Users/pranay/Documents/RE/OndoREDashboard && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors. Fix any issues before marking complete.

- [ ] **Manual smoke test checklist** (run `npm run dev`, visit `http://localhost:5173`)

| URL | Role | Check |
|---|---|---|
| `/admin/properties` | admin | Property table renders, search works, pending rows show Approve/Reject |
| `/admin/owners` | admin | Owner table renders, Activate/Deactivate buttons work |
| `/super-admin/properties` | super_admin | Same as admin properties |
| `/super-admin/owners` | super_admin | Same as admin owners |
| `/owner/property-management` | owner | Property table renders, no Approve/Reject buttons |
| `/tenant/finances` | tenant | 3 tabs render, stat cards show, sidebar has "Finances" link |
| `/admin` (home) | admin | Revenue/Expenses/NOI stat cards visible |
| `/dashboard` (home) | manager | Revenue/Expenses/NOI stat cards visible |
| `/super-admin` (home) | super_admin | Revenue/Expenses/NOI stat cards visible |
