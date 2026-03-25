# Finances Across All Roles + Coming-Soon Pages — Design Spec

**Date:** 2026-03-24
**Status:** Approved
**Scope:** OndoREDashboard (`/Users/pranay/Documents/RE/OndoREDashboard`)

---

## Problem Statement

Several dashboard views are incomplete:

1. **Tenant role** has no "Finances" page — only a "Payments" action page. Tenants lack a read-only financial overview of their rent, YTD totals, and on-time rate.
2. **Admin / Super-Admin home dashboards** don't surface financial summary widgets on the home screen.
3. **Coming-soon stubs** — `admin-properties`, `admin-owners`, `super-admin-properties`, `super-admin-owners`, `owner-property-management` all render a single "coming soon" sentence with no real data.

---

## Approach: Shared Components + Role-Aware Wrappers

Mirrors the existing `RoleFinancesView` / `FinancialReportsView` pattern: build shared, reusable components and wrap them in thin role-specific files.

---

## New Shared Components

### 1. `src/components/shared/shared-properties-view.tsx`

**Purpose:** Full property management list, usable by admin, super-admin, and owner.

**Props:**
```ts
interface SharedPropertiesViewProps {
  title: string
  description?: string
  ownerView?: boolean   // hides admin-only status change actions
}
```

**Data:** `propertyApi.getProperties(page, pageSize)` — paginated, page size 20.

**UI:**
- Stat bar at top: Total properties, Active count, Pending count
- Search input (client-side filter on address / city / status)
- Table columns: Address, City/State, Status badge, Beds/Baths, Price/mo, Actions
- Status badge colors: `active` → green, `pending` → yellow, `inactive` → gray, other → secondary
- Actions: "View" button (links to property detail if available); status change dropdown for non-`ownerView` (calls `propertyApi.updatePropertyStatus()`)
- Pagination controls (prev/next)
- Empty state card: "No properties found" with clear-search button when filtered

**Error handling:** Toast on API failure, retry button in error card.

**Role wrappers (thin):**
- `admin-properties.tsx` → `<SharedPropertiesView title="System Properties" description="All properties across the system" />`
- `super-admin-properties.tsx` → `<SharedPropertiesView title="System Properties" description="All properties across the platform" />`
- `owner-property-management.tsx` → `<SharedPropertiesView title="Your Properties" description="Manage your rental portfolio" ownerView />`

---

### 2. `src/components/shared/shared-owners-view.tsx`

**Purpose:** Owner list with search, status management, and invite action.

**Props:**
```ts
interface SharedOwnersViewProps {
  title: string
  description?: string
}
```

**Data:** `authApi.getInvitedUsers(1, 500)` filtered to `role === "owner"`.

**UI:**
- Stat cards at top: Total Owners, Active Owners, Inactive Owners
- Search input (client-side filter on first name / last name / email)
- Table columns: Name, Email, Status badge (active → green, inactive → gray), Joined date, Actions
- Actions: Activate / Deactivate button (calls `authApi.updateUserStatus()`) with optimistic loading spinner; revert on failure
- Invite button in header (reuses existing `authApi.invite()` flow or links to existing invite dialog)
- Empty state: "No owners yet" with invite CTA

**Error handling:** Toast on fetch or status update failure.

**Role wrappers (thin):**
- `admin-owners.tsx` → `<SharedOwnersView title="Owner Management" description="Manage all owner accounts" />`
- `super-admin-owners.tsx` → `<SharedOwnersView title="Owner Management" description="Manage all owner accounts" />`

---

### 3. `src/components/tenant/tenant-finances.tsx`

**Purpose:** Read-only financial overview for tenants — distinct from the "Payments" action page.

**Data sources:**
- `propertyApi.getTenantProperty()` — rent amount, lease dates, address
- `featureApi` payment records — same source as `tenant-payments.tsx`

**Derived metrics:**
- YTD total paid (sum of `succeeded` payments in current year)
- On-time rate (succeeded / total × 100)
- Next due date (monthly recurrence from move-in date)
- Average monthly payment

**UI — 3 tabs:**

**Overview tab:**
- 4 stat cards: Monthly Rent, Next Due Date, Total Paid (YTD), On-Time Rate
- "Upcoming Payment" callout card: amount + due date + "Make a payment →" link to `/tenant/payments`
- If no property assigned: empty state "No lease found — contact your property manager"

**History tab:**
- Paginated list of payment records (same card style as `role-finances-view` payments tab)
- Columns: Description, Property, Date, Status badge, Amount
- Shows initial 10, "Load more" button
- Empty state: "No payment history yet"

**Lease Cost tab:**
- Monthly rent breakdown card
- Lease start / end dates
- Days remaining on lease
- "View full lease details →" link to `/tenant/lease-details`
- "View documents →" link to `/tenant/documents`

**Export:** No export on this page — stays in Payments page.

---

## Dashboard Home Financial Widget

**Component:** Inline stat cards added to existing portal configs for admin, manager, and super-admin dashboard homes.

**Affected configs:**
- `src/components/dashboard/portals/admin/admin.config.tsx`
- `src/components/dashboard/portals/manager/manager.config.tsx`
- `src/components/dashboard/portals/super-admin/super-admin.config.tsx`

**What to add:** 3 stat cards to each config's `statCards` array:
- Revenue (from `reportsApi.getPnL()` current month `income.total`)
- Expenses (`expenses.total`)
- Net Income / NOI (`netIncome`)

Each card links to `/{role}/finances`.

Data fetched in the existing `dataFetchers` map of each config — add a `financialSummary` fetcher calling `reportsApi.getPnL({ startDate, endDate })` with current-month defaults.

**Note:** Owner and tenant dashboard home pages already have financial stat cards — no changes needed.

---

## Routing & Navigation Updates

### `src/pages/Tenant.tsx`
Add route:
```tsx
import TenantFinances from "@/components/tenant/tenant-finances"
// ...
<Route path="/finances" element={<TenantFinances />} />
```

### `src/components/portal-sidebar.tsx`
In the `"tenant"` case of `getNavItems()`, add after "Payments":
```tsx
{ title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
```

---

## Files Changed / Created

| File | Action |
|---|---|
| `src/components/shared/shared-properties-view.tsx` | **Create** |
| `src/components/shared/shared-owners-view.tsx` | **Create** |
| `src/components/tenant/tenant-finances.tsx` | **Create** |
| `src/components/admin/admin-properties.tsx` | **Update** (replace stub) |
| `src/components/admin/admin-owners.tsx` | **Update** (replace stub) |
| `src/components/super-admin/super-admin-properties.tsx` | **Update** (replace stub) |
| `src/components/super-admin/super-admin-owners.tsx` | **Update** (replace stub) |
| `src/components/owner/owner-property-management.tsx` | **Update** (replace stub) |
| `src/components/dashboard/portals/admin/admin.config.tsx` | **Update** (add finance stat cards) |
| `src/components/dashboard/portals/manager/manager.config.tsx` | **Update** (add finance stat cards) |
| `src/components/dashboard/portals/super-admin/super-admin.config.tsx` | **Update** (add finance stat cards) |
| `src/pages/Tenant.tsx` | **Update** (add /finances route) |
| `src/components/portal-sidebar.tsx` | **Update** (add Finances nav item for tenant) |

---

## Scope Boundary (Explicitly Out of Scope)

- Full CRUD (create/delete) for properties in admin view — status change only
- Owner financial reporting inside `SharedOwnersView`
- Payment actions (pay now, add card) inside `TenantFinancesView` — stays in Payments page
- Maintenance role — no finances needed (workers, not financial stakeholders)
- New backend API endpoints — all functionality uses existing APIs

---

## API Dependencies (All Existing)

| API | Used By |
|---|---|
| `propertyApi.getProperties()` | SharedPropertiesView |
| `propertyApi.updatePropertyStatus()` | SharedPropertiesView |
| `propertyApi.getTenantProperty()` | TenantFinancesView |
| `authApi.getInvitedUsers()` | SharedOwnersView |
| `authApi.updateUserStatus()` | SharedOwnersView |
| `featureApi` (payment records) | TenantFinancesView |
| `reportsApi.getPnL()` | Dashboard home configs |
