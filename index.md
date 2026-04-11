# Ondo Real Estate — Manager & Owner Dashboard

> Internal web portal for property managers, property owners, and tenants.
> Live app: https://app.ondorealestate.com
> Local dev: `npm run dev` → http://localhost:5173

## What This Application Does

OndoREDashboard is a React + Vite SPA that provides role-based portals for every participant in the Ondo Real Estate platform:

- **Manager Portal** (`/dashboard`) — Full portfolio overview, tenant management, invitation system, AI assistant, risk analytics, at-risk tenant tracking, vendor management
- **Owner Portal** (`/owner`) — Property performance, tenant ledger, maintenance history, documents, financial metrics, vendor management, AI assistant
- **Tenant Portal** (`/tenant`) — Rent payments (Stripe), maintenance requests, document uploads/downloads, lease details
- **Super Admin Portal** (`/super-admin`) — Platform-wide user and system management

## Role-Based Navigation

| Role | Login Redirect | Key Capabilities |
|------|---------------|-----------------|
| `super_admin` | `/super-admin` | All access; manage all organizations |
| `admin` | `/dashboard` | Full portfolio; invite managers |
| `manager` | `/dashboard` | Invite owners/tenants; manage properties |
| `owner` | `/owner` | View own properties; AI assistant |
| `tenant` | `/tenant` | Pay rent; submit maintenance; view docs |

## Feature Map

### Manager Dashboard (`/dashboard`)
- Portfolio summary cards (properties, tenants, occupancy, revenue)
- At-risk tenant list with ML risk scores and intervention suggestions
- AI assistant chat (`/assistant`) — agentic, multi-tool, role-scoped
- Maintenance request queue with status tracking
- Vendor directory with add/edit/deactivate
- Invitation management (send invites by role)
- Push notification subscription management

### Owner Portal (`/owner`)
- Property cards with financials and occupancy
- Tenant ledger and payment history
- Maintenance request view for own units
- Document library (upload/download with signed URLs)
- Vendor management
- Investment performance metrics
- AI assistant access

### Tenant Portal (`/tenant`)
- Current balance and upcoming rent due
- Stripe-powered online rent payment
- Maintenance request creation with category and priority
- Document center (lease, move-in report, notices)
- Notification inbox

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS — OnDo gradient `from-orange-500 to-red-800`
- **Components**: Radix UI (accessible primitives) + shadcn/ui patterns
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **State/Auth**: React Context (`src/lib/auth-context.tsx`)
- **API client**: `src/lib/api.ts` — `featureApi.{domain}.{method}()` pattern with Bearer token

## API Integration

All API calls go through `src/lib/api.ts`:

```typescript
// Base helper
apiRequest<T>(endpoint, options)   // → attaches JWT, returns typed response

// Feature namespaces
featureApi.maintenance.list()
featureApi.vendors.create(data)
featureApi.payments.history()
featureApi.dashboard.summary()
featureApi.assistant.chat(messages)
featureApi.notifications.subscribe(subscription)
```

Token is managed via `tokenManager.getToken()` → stored in localStorage under auth context.

**Important**: Never read localStorage directly for auth state. Always use `useAuth()` from `src/lib/auth-context.tsx`.

## Key Source Paths

```
src/
├── pages/
│   ├── Login.tsx            # Single login → auto role redirect
│   ├── Signup.tsx           # Token-based invite completion
│   ├── Dashboard.tsx        # Manager portal root
│   ├── Owner.tsx            # Owner portal root
│   ├── Tenant.tsx           # Tenant portal root
│   └── SuperAdmin.tsx       # Super admin portal root
├── components/
│   ├── ui/                  # Radix-based base components
│   ├── admin/               # Manager-specific components
│   ├── owner/               # Owner-specific components
│   ├── tenant/              # Tenant-specific components
│   ├── vendor/
│   │   ├── vendor-list.tsx          # Vendor table with filters + deactivate
│   │   └── add-vendor-dialog.tsx    # Create/edit vendor form
│   ├── manager-assistant.tsx        # AI assistant chat UI
│   ├── risk-analytics.tsx           # Risk score charts
│   ├── manager-at-risk.tsx          # At-risk tenant table
│   ├── portal-sidebar.tsx           # Shared role-aware navigation
│   └── sparkline-chart.tsx          # Inline trend charts
├── lib/
│   ├── auth-context.tsx     # Auth state, useAuth(), tokenManager
│   ├── api.ts               # All API calls + featureApi
│   └── utils.ts             # Shared utilities
└── hooks/
    ├── use-notifications.ts  # Web Push subscription management
    └── useApi.ts            # Generic API hook with loading/error state
```

## Environment Variables

```
VITE_API_BASE_URL=http://localhost:3000/api   # OndoREBackend URL + /api
```

## Quick Start

```bash
cp .env.example .env        # Set VITE_API_BASE_URL
npm install
npm run dev                 # Starts Vite dev server on :5173
```

Test accounts (created by `npm run seed` in backend):
- Manager: `admin@ondorealestate.com` / `ondo1234`
- Owner: `owner@ondorealestate.com` / `ondo1234`
- Tenant: `tenant@ondorealestate.com` / `ondo1234`
- Maintenance: `maintenance@ondorealestate.com` / `ondo1234`

## Design System

- **Brand gradient**: `from-orange-500 to-red-800` (all Tailwind classes)
- **Brand colors** defined in `tailwind.config.ts`
- **Logo**: Circular "D" icon with "OnDo" wordmark
- All custom colors must be added to `tailwind.config.ts` — no arbitrary Tailwind values

## Related Repositories

- **OndoREBackend** — Express + Supabase API that this dashboard calls
- **OndoREui** — Next.js 15 public-facing consumer site (property search, calculators, portals)

---

*Ondo Real Estate · Lehi, UT · info@ondorealestate.com · https://ondorealestate.com*
