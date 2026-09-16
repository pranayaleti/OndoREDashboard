# OndoREDashboard — Implementation, Gaps, Enhancements & Security Review

**Date:** 2026-09-15
**Subject:** `/OndoREDashboard` (React 18 + Vite SPA), with cross-references into `/OndoREBackend`
**Review team:** DB Architect · Full-Stack Engineer · Application Security Engineer · Tenant-Isolation Auditor · Frontend Quality · API Contract-Parity
**Method:** Read-only static audit. No files modified. Every headline finding below was independently re-verified against source before inclusion; see [Appendix A](#appendix-a--verification-log) for what was confirmed, corrected, or downgraded.

---

## 1. Executive summary

OndoREDashboard is a **large, genuinely well-engineered frontend with a serious authorization problem in the backend it talks to.**

The codebase quality is better than its size suggests. 113k lines across 585 files, and yet: exactly **one** real `any` annotation, **zero** `@ts-ignore`, **two** `eslint-disable` comments, and a CI pipeline (`audit → tsc → lint → test → build → bundle-budgets`) that currently passes every gate. Token handling is textbook — access token in memory only, refresh token in an HttpOnly cookie, silent refresh-and-retry on 401. That is not what a rushed codebase looks like.

The problems are concentrated in three places:

1. **Authorization is broken for the `manager` role.** Three separate backend surfaces treat *any* authenticated manager as globally privileged, with no portfolio check. The worst lets any manager on the platform read any lease's terms **and its physical lock/gate codes and emergency contacts**. This is not a theoretical gap; it is a four-line fix in one file, and the correct pattern already exists and is used by eleven other middleware functions in the same repo.

2. **A large amount of finished work is not plugged in.** Six owner-facing features (ESG, compliance, pet screening, utility billing, inventory, 1099 tax filing) are fully built *on both ends* — real UI, real API client, real backend service — and reachable from no route. Separately, ~12,300 lines of superseded code sit unreferenced in the tree. The single highest-ROI item in this review is adding routes to six files.

3. **Verification debt.** 21 test files for 585 source files, with 0% coverage on payments, auth, screening, and leases. The production API (Supabase Edge) is a deliberately partial port of the dev API (Express), and the CI gate meant to police that drift only checks mount-prefix parity — so one router with 76 Express routes vs 22 Edge routes passes clean.

**Top three actions:** fix `canUserAccessLease`/`canUserManageLease` (hours), close four `USING (true)` RLS policies (hours), route the six finished owner screens (days).

### Severity roll-up

| Severity | Count | Domain |
|---|---|---|
| Critical | 3 | Multi-tenant isolation (2), database RLS (1) |
| High | 3 | CORS/CSRF session theft, IDOR on property creation, document-RAG bypass |
| Medium | 6 | Payment-amount integrity, vendor ticket exposure, secrets in git history, org boundary, a11y contrast, Edge/Express drift |
| Low / hardening | 8 | CSP, upload validation, dependency advisories, i18n, design tokens, bundle budgets, offline, error boundaries |

---

## 2. Scope, method, and confidence

Six specialist reviews ran in parallel against the working tree at `main` (198 commits, Jul 2025 → Sep 2026, 5 contributor identities). Each produced an evidence-cited report; findings were then **independently re-verified** before being written up here.

That verification step mattered. Of the headline claims:

- **Confirmed as reported:** 5 of 7
- **Corrected in severity or scope:** 2 of 7 (one downgraded from "live production bug" to latent; one narrowed from all six portals to five)
- **One agent premise was simply wrong** and is corrected in §5.

**Confidence levels used throughout:**
- **Confirmed** — re-read in source by the reviewer writing this document.
- **Reported** — traced by the specialist with file:line evidence, not independently re-verified here.
- **Unverified** — flagged by a specialist as needing a runtime check, live DB query, or human decision.

**Explicitly out of scope:** no runtime axe/Playwright accessibility pass (no harness exists in this repo), no live Supabase `pg_policies` query, no penetration testing, no load testing. All database findings are grep-verified against 121 migration files, **not** against the live schema — see §4.3.

---

## 3. What is implemented

### 3.1 Scale and shape

| Metric | Value |
|---|---|
| Source files (`.ts`/`.tsx`) | 585 |
| Lines of source | 113,293 |
| `src/components/` | 379 files / 89,561 lines |
| `src/lib/` | 76 files / 12,759 lines |
| `src/pages/` | 26 files / 5,700 lines |
| `src/features/` | 61 files / **962 lines** (scaffold — see §4.2) |
| Route declarations | ~162 across 7 router files |
| API call sites | 607 (340 unique method+path pairs) |
| Test files | 21 (125 tests, all passing) |
| Build output | 27 MB `dist/` |

### 3.2 Role portals

Seven role-gated portals, gated centrally by `ProtectedRoute.tsx` + `auth-utils.ts`:

| Portal | Mount | Routes | Notes |
|---|---|---|---|
| Owner | `/owner` | 36 | Largest. Has **two** dashboard home screens (`/owner` → homeowner view, `/owner/portfolio` → portfolio view) |
| Manager | `/dashboard` | 24 | Note: mounted at `/dashboard`, not `/manager` |
| Admin | `/admin` | 25 | Near-identical feature set to SuperAdmin |
| SuperAdmin | `/super-admin` | 24 | |
| Tenant | `/tenant` | 20 | Reuses the homeowner sub-suite unmodified |
| Maintenance/Vendor | `/maintenance` | 9 | Smallest portal |
| Handoff | `/handoff/:propertyId?` | 1 | Shared by all six roles, renders per-role internally |

Plus 16 public routes (marketing, auth, legal).

### 3.3 Shipped feature surface

Working, routed, and API-backed across the portals:

- **Property management** — CRUD, photos, floor plans, status history, CSV/bulk import, approval workflow
- **Leasing** — pipeline, applications inbox, lease templates, e-signature send flow, renewals
- **Screening** — config wizard (775 lines), screening list, portable screening, tenant-screening cards
- **Maintenance** — tickets, assignment, vendor directory, scheduled maintenance, live Supabase realtime updates
- **Financials** — Stripe payments (Elements-based), payment methods, rent schedules, owner statements, trust accounting, transactions, cash-flow, tax views
- **Documents** — direct-to-storage signed-URL upload, document vault, per-role document views
- **Communication** — per-role message centers, notifications, announcements, inbox with auto-reply/translate
- **Reporting** — P&L, rent roll, occupancy, risk analytics, KPI charts (Recharts)
- **AI Assistant** — one shared `manager-assistant.tsx` across Manager/Owner/Admin/SuperAdmin/Tenant, with client-side guardrails in `aiGuardrails.ts`
- **Handoff** — move-in/move-out packet builder, neighborhood guide, checklist completion
- **Homeowner suite** — mortgages, additional loans, insurance, tax records, home improvement, equipment
- **Org/white-label** — organizations, co-ownership invites, per-org branding, referral program

### 3.4 Engineering practices that are genuinely good

Worth stating plainly, because they are unusual at this scale:

- **Type discipline.** 1 real `any` (guarded with an eslint-disable), 0 `@ts-ignore`, 2 `eslint-disable` total in 113k lines.
- **Auth architecture.** Access token lives in a module-level variable — never `localStorage`. Refresh token is HttpOnly. On module load the client actively purges legacy `ondoToken`/`token`/`auth_token` keys from both storages. Logout revokes the refresh-token family server-side. — `token-manager.ts:36,45-54`, `auth-context.tsx:134-141`
- **Silent 401 recovery.** `http.ts:76-88` refreshes and retries once, then dispatches `auth:session-expired`. Proactive refresh every 12 min keeps 15-min tokens alive invisibly.
- **Code splitting.** All 23 routes are `lazy()`-loaded. Manual vendor chunks (`react-vendor`, `charts`, `ui-vendor`, `style-vendor`) with `modulePreload` deliberately excluding the heavy chart chunk.
- **XSS surface is small.** Zero `dangerouslySetInnerHTML`. `react-markdown` is used once, with an explicit `allowedElements` allow-list and no `rehype-raw`.
- **CI actually gates deploy.** `deploy.yml` triggers only on a *successful* CI `workflow_run` — explicitly commented as a fix for a prior bug where failing tests still shipped. Cloudflare purge is scoped to the app hostname, never `purge_everything`.
- **Automated PR review.** `claude-review.yml` runs on every non-draft PR, scoped to cross-tenant leakage, Fair-Housing compliance, AI authorization, and Edge/Express parity.

---

## 4. Gaps

### 4.1 Finished features that are not reachable

**Six owner screens are complete on both ends and routed nowhere.** Each has working UI, a real `featureApi` client method, and a confirmed backend service:

| Screen | Lines | Backend service | Routed? |
|---|---|---|---|
| `owner/esg-dashboard.tsx` | 282 | `esgService.ts` | No |
| `owner/compliance-dashboard.tsx` | 278 | `featureApi.compliance.*` | No |
| `owner/pet-screening-manager.tsx` | 274 | `featureApi.pets.*` | No |
| `owner/utility-billing-manager.tsx` | 239 | `featureApi.utilities.*` | No |
| `owner/inventory-manager.tsx` | 296 | `inventoryService.ts` | No |
| `owner/tax-filing-1099.tsx` | 234 | `form1099Service.ts` | No |

**Confirmed:** each is referenced by zero other files. The only hit anywhere for `inventory-manager` is a code comment at `feature-api.ts:3002`.

Each fetches real data on mount and silently falls back to a `MOCK_*` constant on error via a bare `catch {}`. **That silent-fallback behavior must be fixed before routing them** — otherwise a backend outage shows users fabricated data with no error indication.

Two further files are genuinely fake (zero API calls, pure `useState(MOCK_*)`) and would need building from scratch: `owner/maintenance-detail.tsx` (426 lines) and `maintenance/maintenance-dashboard.tsx` (219 lines).

### 4.2 Dead code and an abandoned migration

- **~4,276 lines of superseded dashboards** still in the tree, replaced by `*.new.tsx` versions but never deleted: `manager-dashboard.tsx` (1,223), `tenant-dashboard.tsx` (834), `owner-dashboard.tsx` (740), `admin-dashboard.tsx` (547), `super-admin-dashboard.tsx` (528), `cash-flow-dashboard.tsx` (211), `quality-dashboard.tsx` (193).
- **~12,300 lines across 52 orphaned files** in a broader scan (12 of 52 manually spot-checked, all confirmed unreferenced).
- **`src/features/` is an abandoned migration.** Ten domain modules, 61 files — but only **962 lines total**, because every module is a barrel/pass-through skeleton. Only *one* consumer exists in the entire app (`OwnerDashboard.new.tsx`, the `/owner/portfolio` route, using 8 of 10 modules as dashboard cards). `features/admin` and `features/tenant-dashboard` are referenced by nothing at all. Meanwhile the real implementations of those same domains live independently in `src/components/<role>/`.

  This is the worst possible state: neither finished nor abandoned, and it silently invites contributors to add a third implementation.

- **Per-role duplication that was never consolidated.** Five `*-messages.tsx` components at 428–604 lines each (~2,000+ lines of overlapping inbox logic). Contrast with `*-notifications.tsx`, which *was* done correctly — every role's version is a 10-line wrapper around one shared component.

### 4.3 Database and data model

*All findings grep-verified against 121 migration files; none verified against the live database.*

- **136 of 232 RLS-enabled tables have zero policies** — including `leases`, `payments`, `trust_accounts`, `bank_accounts`, `ach_payments`. This currently fails *closed* and is safe only because the backend uses the service-role key exclusively. It means RLS provides **no tenant-isolation value** for 59% of tables; it's a blunt "deny non-service-role" switch. The danger is the next engineer who hits a silent empty result and "fixes" it with a permissive policy — which is exactly what already happened (§5.3).
- **Missing FK on a core table.** `properties.tenant_id` is a bare `uuid` with no `REFERENCES` clause, unlike every other `tenant_id` in the schema. Same for `invitations.invited_by`.
- **Two money conventions coexist.** Older tables use decimal dollars (`leases.monthly_rent decimal(10,2)`); newer tables use integer cents (74+ `_cents` columns). `feature-api.ts` divides by 100 for the cents fields and passes the dollar fields through untouched. No float-money bug was found, but this is one transposition away from a 100× error.
- **Hard-delete only.** No `deleted_at` convention anywhere, with pervasive `ON DELETE CASCADE`. Deleting a property or user permanently destroys associated lease and financial history with no recovery path.
- **A self-documented production data-loss incident.** `20260514192922_remote_schema.sql` (a `supabase db pull` diff) dropped four live tables — `property_handoffs`, `handoff_photos`, `tenant_onboarding`, `onboarding_documents` — breaking the tenant-onboarding and handoff features at the database layer. They were restored ~2 months later by `20260708000000_restore_onboarding_handoff_tables.sql`, whose own header documents the outage. **Migrations are not reliably additive in practice, despite the `IF NOT EXISTS` convention.**
- **A duplicate migration with diverging schemas.** `moderation_schema.sql` was authored twice (March and May) with different FK and `NOT NULL` constraints. Because both use `CREATE TABLE IF NOT EXISTS`, whichever ran first silently wins — the improved version may never have applied. *Unverified:* needs a live schema check to determine which is in effect.
- **The organization boundary is cosmetic.** `organizations`/`organization_members` exist, but **no** resource table carries an `organization_id`. `organizationService.ts` is the only service that queries org membership at all. Joining an organization has zero effect on what a manager can see anywhere else.
- **Confirmed pagination bug.** `admin-dashboard.tsx:40` calls `getProperties()` with no arguments — defaulting to page 1 / 20 rows — then computes site-wide totals and a `systemHealth` score from that truncated array. Silently wrong for any tenant with >20 properties. *(Mitigating note: this file is itself orphaned per §4.2 — but the same pattern should be checked in the live `.new` dashboards.)*
- **Confirmed N+1, self-documented.** `trust-accounting-panel.tsx:133-136` fetches transactions per account in a `Promise.all` fan-out, and again at `:206-209` for reconcile.

### 4.4 API contract drift

- **The production API is a deliberate partial port.** Edge is consistently a *subset* of Express — 135 unique paths (281 call sites) exist in Express but not in the Supabase Edge function. Most of this is documented and allowlisted in `express-only-routes.json` (the `advanced/` router tree: investments, ESG, CAM pools, trust accounts, tax forms, IoT).
- **But the CI gate has a real blind spot.** `check-route-parity.ts` compares **mount prefixes**, not endpoints. `operationsRoutes` is mounted on both sides, so it passes clean — while Express defines **76 routes** there and Edge implements **22**. Silently missing in production: `properties/:id/pnl`, `owner/pnl-summary`, `properties/:id/complaints`, `properties/:id/surveys`, and the entire move-out flow. **This is the one genuinely untracked drift in the system.**
- **43 unique paths are called by the client and implemented by neither backend.** Most are dead client code (the whole of `accounting.ts`'s top-level `/payments`, `/invoices`, `/expenses`; most of `tenant-screening.ts`; `dashboard.ts`'s financial/risk/tenant-analytics methods).
- **Two verb mismatches** — client sends `PUT`, both servers register `PATCH` only: `PUT /leads/:id/status` (`lead.ts:233`) and `PUT /auth/users/:id/status` (`auth.ts:136`). **Corrected from the specialist report:** both are currently *unreachable* (their only caller is the orphaned `manager-dashboard.tsx`), so these are latent landmines, not live 404s. They will fire the moment that dashboard is revived.
- **Only ~3% of API responses are runtime-validated.** 18 of 607 call sites use Zod `.parse`/`.safeParse`. The other 97% rely on the TypeScript generic on `apiGet<T>`, which is erased at build time and offers zero runtime protection. A renamed backend field propagates `undefined` into UI state silently.
- **`@ondo/types` does not exist.** Project notes record a shared types package as built; `packages/types` is not on disk anywhere in the workspace. `src/lib/api/types/ondo-types.ts` is a local shim whose own header says so, re-exporting from `legacy-types.ts`. `Property` is defined independently in 6+ files; `MaintenanceRequest` twice (identical today — no proven drift, but two independently maintained copies).
- **`base-url.ts:9-24` falls back to `http://localhost:3030/api`.** This does not currently ship, because `deploy.yml:57` sets `VITE_API_BASE_URL` explicitly. But the safety net is **one YAML line** — no build-time guard. Anyone who drops that `env:` block, or builds locally and uploads `dist/` by hand, ships a bundle pointed at the user's own localhost with no failure signal.

### 4.5 Testing and resilience

- **21 test files / 585 source files.** Coverage report (`coverage-summary.json`, dated Jul 4 2026 — **stale**) shows 1.36% line coverage. The test-file count is current and verified; treat the percentage as directional.
- **0% coverage on:** `auth-context.tsx` (gates every route), all Stripe components, `tenant-payments.tsx`, the entire screening surface, all lease management, and `ProtectedRoute.tsx` — the single file that enforces every role boundary in the app.
- **No server-state library.** No React Query/SWR. `useApi.ts` is the one shared hook and is used in **5** components; the other **164** `useEffect`-based components each hand-roll their own loading/error/data triad. No caching, no dedupe, no request cancellation (the `isMountedRef` guard prevents a warning but doesn't abort the fetch).
- **One app-wide ErrorBoundary**, mounted once at `App.tsx:76`. A render error in any single panel blanks the entire app shell.
- **Zero offline handling.** `grep -rln "navigator.onLine\|offline" src` → 0 matches. For a mobile-used payments and maintenance app, dropped-connection writes surface as a generic toast at best.

### 4.6 Frontend quality

*Static analysis only — a runtime axe pass is required before accessibility sign-off.*

- **Critical contrast failure in dark mode.** `--destructive: 0 62.8% 30.6%` (`_design-tokens.css:101`) used as `text-destructive` computes to **1.9:1** against the dark background — error text is effectively invisible. Light mode is also below the floor at 3.61:1. Affects every `FormMessage` plus 67 call sites. **Confirmed** the token value; contrast ratios are the specialist's computation.
- **CTA gradients fail contrast.** White text on the `#f97316` end of `from-orange-500 to-red-700` computes to 2.8:1 (needs 4.5:1). 35 occurrences across 16 files including Signup, ForgotPassword, ResetPassword, Verify.
- **~419 of 736 `<Label>` uses have no `htmlFor`** and the sibling input has no matching `id` — so no association, implicit or explicit. Worst: `HandoffPropertyDetails.tsx` (67), `HandoffNeighborhood.tsx` (43), `mortgage-loans-page.tsx` (27).
- **~44 of 84 icon-only buttons have no accessible name** — including the image-carousel prev/next arrows, which have none at all.
- **Non-semantic clickable divs.** `StatCard.tsx:56-62` and `QuickActions.tsx:55-61` use `<div onClick>` with no `role`, `tabIndex`, or key handler — and these are live in every portal dashboard. Keyboard and screen-reader users cannot activate them.
- **Off-brand palette ships in production.** Portal configs hardcode per-role hex: admin/manager `#3B82F6` (blue), super-admin `#9333EA` (purple), tenant/maintenance `#F97316` (on-brand). **Corrected from the specialist report:** `owner.config.tsx`'s green `#10B981` is *dead code* (0 references), but the other **five configs are live** and consumed via inline `style={{ color: primaryColor }}`. This needs a product decision, not a unilateral fix.
- **i18n convention is not followed.** Only **17 of 403** `.tsx` files import `useTranslation`, against ~3,490 candidate hardcoded strings. `portal-sidebar.tsx` — the nav every logged-in user sees — has 122 hardcoded `title:` literals vs 5 using `t()`, in a file that already imports the translation hook. Low user-facing impact (English-only by design), but a direct violation of the repo's own stated rule.
- **Design tokens bypassed ~50% of the time.** 1,449 raw `text-gray-*`/`bg-gray-*` uses vs 1,425 `text-muted-foreground`.
- **Bundle budgets are too narrow.** Only `portal-sidebar-*.js` is gated — and it's at **94%/95%** of its raw/gzip budget, so the next nav item busts it. The main entry (85.83 KB gzip), `charts` (101.27 KB gzip), and `Handoff` (27.26 KB gzip) chunks have no budget at all.
- **Unmemoized context provider.** `auth-context.tsx:193` builds a new value object every render, fanning out to **71** consumer files.
- **A 4,810-line component that re-renders on every keystroke.** `HandoffPropertyDetails.tsx` has zero hooks (fully prop-driven) and is not `React.memo`'d; its ~30 props come from `Handoff.tsx`, which has **zero** `useCallback` calls. Any keystroke in the document search box re-renders the whole tree.

---

## 5. Security risks

Ordered by severity. Each entry states what an attacker can actually do.

### 5.1 CRITICAL — Any manager can read and modify any lease on the platform

**Confirmed.** `OndoREBackend/src/services/leaseService.ts:299-317`:

```ts
export async function canUserAccessLease(lease, userId, role) {
  if (lease.ownerId === userId || lease.tenantId === userId) return true;
  if (role === "admin" || role === "super_admin" || role === "manager") return true;  // no portfolio check
  return isAcceptedCoOwner(lease.propertyId, userId);
}
```

`canUserManageLease` (`:309-317`) is identical. Routes `GET/PUT /leases/:leaseId` and the access-packet endpoints carry **only** `requireAuth` — no scope middleware (`leaseRoutes.ts:14-17`).

**Attack:** a manager who manages zero of an owner's properties calls `GET /api/leases/{any-lease-id}`. `requireAuth` passes; `canUserAccessLease` returns `true` purely on role. They receive full lease terms, rent, deposit — and via `getLeaseAccessPacket`, **the property's physical lock code, gate code, access instructions, and owner emergency contacts**.

**Why this is a small fix:** the correct pattern already exists in this repo. `managerHasPropertyAccess` (`propertyAccessMiddleware.ts:12-21`) and `getAllowedPropertyIds` (`atRiskScope.ts:13-38`) are used correctly by `requirePropertyAccess`, `requireMaintenanceRequestAccess`, `requireApplicationAccess`, `requireInspectionAccess`, `requireDealAccess`, and even the AI assistant's own `callerCanAccessProperty`. `leaseService.ts` is the one outlier that never adopted it. Note the telling contrast: `/properties/:propertyId/leases` **does** use `requirePropertyAccess` — only the id-addressed routes are unguarded.

**Fix:** replace the blanket `role === "manager"` branch in both functions with a portfolio check. Hours, not days.

### 5.2 CRITICAL — Handoff photo deletion has no ownership check at all

**Confirmed.** `DELETE /api/handoff-photos/:photoId` (`handoffRoutes.ts:167-180`) checks only that the caller's *role* is in `['owner','manager','admin','super_admin']`, then calls `handoffService.deleteHandoffPhoto(photoId)` (`handoffService.ts:197-220`), which deletes by id with no join back to the owning property.

Any owner or manager who obtains another property's photo UUID can permanently delete that property's key/gate/access-code photo. Every *other* route in the same file is gated with `requirePropertyAccess()` — this one was missed. RLS is no backstop: `handoff_photos` has RLS enabled with zero policies by design, so the Express check is the only line of defense, and it is absent.

The dashboard calls this directly at `handoff.ts:104-106`, passing only the photo id — the client matches the vulnerable server contract exactly.

### 5.3 CRITICAL — Four tables expose lead PII and AI chat transcripts across every tenant

**Confirmed.** `20260320070356_remote_schema.sql:835-890` (a raw `supabase db pull` dump) created seven policies named `"Allow authenticated select"` with `using (true)` — granting **every authenticated user of any role in any tenant** `SELECT *`.

Three were later remediated (`lead_scores`, `website_lead_scores` by `20260829051731_lead_scores_rls.sql`; `site_visits` by `20260828173243_showing_calendar.sql`). **Four remain open today:**

- `lead_drip_queue`
- `lead_qualification_sessions`
- `website_lead_drip_queue`
- `website_lead_qualification_sessions`

These hold lead email addresses, AI qualification chat transcripts (`messages jsonb`), and session tokens. Note that a **tenant or vendor login is `authenticated` too** — this is not limited to staff roles.

The remediation template already exists and can be copied nearly line-for-line from the `lead_scores` migration. **Effort: 2–4 hours.**

### 5.4 HIGH — CORS allow-lists a shared host, and `/refresh` has no CSRF check

**Confirmed (code-level certain; live exploitability conditional).**

- `supabase/functions/api/index.ts:97` allow-lists `https://pranayaleti.github.io` with `credentials: true` (`:108`).
- The Edge `/refresh` route (`_shared/routes/auth.ts:382-419`) reads the `ondo_refresh` cookie directly — no CSRF check, no `requireAuth`, by design.
- The Edge sets that cookie with `Path=/` and `SameSite=None` (`:290-299`) — **broader than the Express side**, which scopes it to `/api/auth`.

CORS matches on origin only, never path. So any JavaScript on *any* page under that shared GitHub Pages account origin can `fetch(.../auth/refresh, {credentials:'include'})`, have the browser attach the victim's refresh cookie, pass the CORS check, and read back a live Bearer token.

**Two corrections to the original finding:**
1. A CSRF mechanism **does** exist — `ondo_csrf` cookie matched against an `x-csrf-token` header at `authMiddleware.ts:75-78`. It simply only fires for cookie-auth on `requireAuth` routes, and `/refresh` is deliberately outside that. So this is a **gap in an existing control**, not a missing one — a smaller fix than first framed.
2. This repo deploys to the custom domain `app.ondorealestate.com` (CNAME), so the dashboard itself is not served from `pranayaleti.github.io`. Whether a sibling site is currently live on that shared origin depends on account configuration, not on this codebase. **The defect is certain; active exploitability is conditional.**

**Fix:** never allow-list a shared multi-tenant host (`*.github.io`, `*.vercel.app`, `*.netlify.app`) for credentialed CORS. Better still, extend the existing CSRF double-submit check to cover `/refresh` so the allow-list is not the sole defense.

### 5.5 HIGH — Manager-supplied `ownerId` is trusted on property creation

**Reported.** `propertyCrudController.ts:266`:

```ts
if (req.user.role === "manager" && req.body.ownerId) ownerId = req.body.ownerId;
```

No check that the target is an owner this manager actually manages (`managerManagesOwner()` exists and is used correctly elsewhere). `createPropertySchema` doesn't include `ownerId`, so it is read straight off `req.body` after `.parse()` — unvalidated.

The shipped dashboard UI doesn't send this field, so it is not SPA-reachable today. **Client-side field omission is not a security boundary** — it's trivially reachable with a hand-built request.

### 5.6 HIGH — Document RAG search bypass for managers

**Reported.** `documentRoutes.ts:100` skips the ownership check entirely when `role === 'manager'`, so `searchDocumentChunks(propertyId, …)` runs for any supplied `propertyId`. Any manager can semantically search any property's documents — leases, disclosures, financials. Inconsistent with `documentController.hasDocumentAccess` one file over, which scopes managers correctly via `getAllowedPropertyIds`. Not currently called by the dashboard, but mounted and reachable.

### 5.7 MEDIUM — Rent payment amount is tenant-editable and not reconciled

**Reported.** `tenant-payments.tsx` renders the payment amount as an **editable** field and sends it as `amountCents` to `createPaymentIntent`. The server (`stripeRoutes.ts:18-19`) validates only that it falls between $0.50 and $10M — it does not reconcile against the tenant's actual lease or rent schedule.

This is an **accounting-integrity** issue, not payment fraud against Stripe (Stripe collects whatever is submitted). The risk is a tenant recording a $0.50 "rent payment" that downstream late-fee or ledger logic treats as satisfying the obligation.

**Fix:** for `paymentType: "rent"`, derive the amount server-side from the active rent schedule, or require an explicit partial-payment flag.

### 5.8 MEDIUM — Any vendor can see every pending ticket platform-wide

**Reported.** `maintenanceController.ts:123-128` grants the `maintenance` role access to any ticket whose status is `pending`, regardless of property or organization — exposing tenant name, unit address, and issue description to every vendor on the platform. There is no vendor/org affiliation table anywhere in the schema.

This may be an intentional "open marketplace of unassigned jobs" design — **flagged for a product decision**, since the stated isolation model says a vendor sees only assigned tickets.

### 5.9 MEDIUM — Credentials and personal emails in public git history

**Confirmed.** `.env` was tracked across **12 commits**, removed at `1b5ce47`. It is untracked at HEAD. `git show 1b5ce47^:.env` recovers two personal Gmail addresses and a weak test password (`Test@123`).

The specialist reports the repo is public (`private: false` via the GitHub API) — **reported, not re-verified here.** The Stripe and Supabase keys in that file are publishable-by-design and not sensitive; no service-role or secret key was found anywhere in history.

**Fix:** purge with `git filter-repo`/BFG, and rotate the password if those accounts are real.

### 5.10 MEDIUM — The organization boundary does not isolate anything

**Reported.** As detailed in §4.3: `organization_members` is queried by exactly one service. Every other manager-scoping check uses the older `invited_by` relationship — and that relationship is bypassed wholesale by findings 5.1, 5.5, and 5.6. The stated threat model ("a manager is scoped to their org's properties") does not structurally exist today.

### 5.11 Lower severity and hardening

| Item | Severity | Note |
|---|---|---|
| No CSP or security headers | Low | GitHub Pages can't set headers; use a `<meta>` CSP or a Cloudflare Transform Rule. No SRI gap today — no external scripts. |
| `react-router` advisory (open redirect, SSR deserialization) | Low-Med | Moderate; needs a major version bump to 7.18.4+. Adjacent to the `returnTo` flow in `Login.tsx`. |
| `returnTo` param not allow-listed | Low | **Verified not exploitable** as coded — React Router's `navigate()` won't perform a cross-origin redirect. Worth allow-listing anyway. |
| No client-side upload size cap; MIME is client-asserted | Low | Correct architecture (client is not the trust boundary), but backend enforcement was **not verified**. |
| `npm audit` | Info | 0 critical, 0 high, 7 moderate, 1 low. CI gates at `--audit-level=high`, so none currently block. |
| PII logging | **None found** | Zero `console.log` of sensitive objects. SSN validators exist but are unused dead code in this repo. |
| AI assistant tool scoping | Mostly verified safe | Tool list is unfiltered by role by design (`runner.ts:52-55`), relying on per-handler gates. 9 handlers verified correctly session-scoped — notably `handleLeaseAbstract` is *safer* than the raw REST lease endpoint in 5.1. **~4 handlers unverified.** |

---

## 6. Recommended enhancements

Effort estimates are the specialists'; treat as directional.

### P0 — Do first (security-impacting)

| # | Action | Effort |
|---|---|---|
| 1 | Add a portfolio check to `canUserAccessLease`/`canUserManageLease` (§5.1). Reuse `managerHasPropertyAccess`. | 2–4 h |
| 2 | Add `requireHandoffPhotoAccess` middleware to the photo-delete route (§5.2), following the existing `requireInspectionAccess` pattern. | 2–4 h |
| 3 | Close the four `USING (true)` RLS policies (§5.3) — copy the `lead_scores` migration template. | 2–4 h |
| 4 | Remove `https://pranayaleti.github.io` from the credentialed CORS allow-list; extend the existing CSRF check to `/refresh` (§5.4). | 4–6 h |
| 5 | Validate `ownerId` against `managerManagesOwner()` in `createProperty` (§5.5); remove the manager bypass in `/documents/ask` (§5.6). | 3–4 h |
| 6 | Derive rent `amountCents` server-side from the rent schedule (§5.7). | 4–6 h |

### P1 — High value, well-scoped

| # | Action | Effort |
|---|---|---|
| 7 | **Route the six finished owner features** (§4.1) — fix the silent `catch {}` fallback first, then add route + sidebar entry + smoke test. Highest ROI in this review. | 4–6 d |
| 8 | Test the highest-blast-radius untested files: `auth-context.tsx`, `ProtectedRoute.tsx`, the Stripe components. | 1–2 wk |
| 9 | Fix the `check-route-parity.ts` blind spot — compare per-endpoint, not per-mount-prefix (§4.4). Then port or consciously allow-list the 54 missing `operationsRoutes` endpoints. | 3–5 d |
| 10 | Add per-portal ErrorBoundaries so one panel's crash doesn't blank the app. | 1–2 d |
| 11 | Fix the dark-mode `--destructive` contrast bug and the CTA gradient (§4.6) — the former is a one-token fix. | 1 d |
| 12 | Delete the ~4,300 lines of dead dashboards and triage the 52 orphaned files (§4.2). Needs human sign-off per file. | 2–3 d |
| 13 | Resolve `src/features/` — finish the migration or delete it. Either is better than the current state. | Decision + 1 wk |
| 14 | Add a build-time guard failing production builds when `VITE_API_BASE_URL` contains `localhost` (§4.4). | 2 h |
| 15 | Fix `properties.tenant_id`'s missing FK after an orphan-check pass (§4.3). | 2–3 h |

### P2 — Structural / hygiene

| # | Action | Effort |
|---|---|---|
| 16 | Accessibility sweep: `aria-label` on ~44 icon buttons, `id`/`htmlFor` on ~419 label pairs, real `<button>` semantics for `StatCard`/`QuickActions`, `role="alert"` on `FormMessage`. Add a runtime axe harness first. | 1–2 wk |
| 17 | Memoize `AuthContext`'s provider value; `React.memo` + `useCallback` for the Handoff tree (§4.6). | 2–3 d |
| 18 | Extend Zod validation beyond 3% of call sites, prioritizing money and auth responses. | 1–2 wk |
| 19 | Consolidate the five `*-messages.tsx` components the way `*-notifications.tsx` already was. | 1 wk |
| 20 | Standardize money on integer cents, or add a branded `Cents`/`Dollars` type as a stopgap. | 4 h (guard) / 2–3 d (full) |
| 21 | Add soft-delete (`deleted_at`) for financially and legally significant tables; replace `CASCADE` with `RESTRICT` on those edges. | 3–5 d |
| 22 | Backfill `organization_id` onto resource tables and add org-scoped policies — completes the deferred multi-tenancy phase. | 1–2 wk |
| 23 | Widen bundle budgets beyond `portal-sidebar` (currently at 94% of its own). | 2 h |
| 24 | Offline detection and a write-retry queue. | 1 wk |
| 25 | Either finish `packages/types` or delete the shim and consolidate duplicated types in place. | 1–2 d |
| 26 | Add `CHECK` constraints to free-text status columns; archival/partitioning for append-only tables. | 1 d / 3–5 d |

---

## Appendix A — Verification log

Findings were re-verified independently rather than taken on trust. Outcomes:

| Claim | Outcome |
|---|---|
| 4 tables retain `USING (true)` RLS | ✅ **Confirmed.** 7 policies created at `20260320070356_remote_schema.sql:835-890`; only 3 `DROP POLICY` statements exist anywhere. *(Initial grep missed these — the dump uses lowercase `using (true)` on its own line. Worth noting for anyone re-running this check.)* |
| Any manager can read/write any lease | ✅ **Confirmed** in `leaseService.ts:299-317` + `leaseRoutes.ts:14-17`. |
| Handoff photo delete unscoped | ✅ **Confirmed** in both route and service. |
| CORS + no-CSRF `/refresh` | ✅ **Confirmed**, with two corrections: a CSRF mechanism exists but doesn't cover `/refresh`; and the dashboard's own custom domain means live exploitability is conditional on account config. |
| 7 owner screens orphaned | ✅ **Confirmed.** The lone `inventory-manager` hit is a code comment. |
| `.env` in git history | ✅ **Confirmed**, 12 commits, untracked at HEAD. Repo-public status is **agent-reported via GitHub API**, not re-verified. |
| Off-brand palette in all portals | ⚠️ **Corrected.** `owner.config.tsx` is dead (0 refs); the other **5 are live**. |
| `PUT /leads/:id/status` is a live prod bug | ⚠️ **Downgraded.** The verb mismatch is real, but its only caller is the orphaned `manager-dashboard.tsx`. **Latent, not live.** |
| 418/708 labels lack `htmlFor` | ≈ **Confirmed directionally.** Independent count: 419/736. Same conclusion. |
| `feature-api.ts` is a bundle-size problem | ❌ **Wrong premise** (from the task brief, caught by the specialist). It is correctly code-split to 8.33 KB gzip. Maintainability concern only. |

## Appendix B — Explicitly unverified

Do not treat these as settled:

- **All database findings are grep-derived from 121 migration files**, not from the live schema. The "136 tables without policies" figure in particular should be confirmed with `SELECT * FROM pg_policies`.
- **Which `moderation_schema.sql` actually applied** (March vs May) requires a live schema check.
- **No runtime accessibility pass was run** — no axe/Playwright harness exists in this repo. Contrast ratios are computed from token values; label and button findings need mechanical confirmation.
- **~4 AI assistant tool handlers** (`manage_automations`, `categorize_expense`, `market_rent_suggest`, `suggest_rent_price`) were not read line-by-line. Treat their isolation as unverified, not passed.
- **Backend enforcement of upload size/MIME** was not checked (out of the dashboard-scoped review).
- **Edge Function parity for the isolation bugs** (§5.1, §5.2) was not diffed. If the Edge function mirrors `canUserAccessLease` or the handoff-delete route, those findings apply in production too — **check this before closing them out.**
- **Coverage percentages** come from a report dated Jul 4 2026 and are stale. The 21-test-file count is current.
- **The 52-file orphan scan** used basename matching, which can miss dynamic imports. 12 of 52 were spot-checked.
