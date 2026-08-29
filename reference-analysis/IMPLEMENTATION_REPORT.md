# Implementation Report — AI inspections walkthrough

**Reference video:** [AI Inspections: From Hours to Minutes](https://www.youtube.com/watch?v=LTEmCgv4c_I) (YouTube Short, DoorLoop)

**Audit:** `OndoREDashboard/reference-analysis/REFERENCE_FEATURE_AUDIT.md`

DoorLoop branding, logos, reminder-card chrome, voice notes, vision photo-sorting, and **Save & Create Bill** were not copied. The walkthrough uses Ondo’s existing design system, APIs, and maintenance tickets.

---

## Features found in the video

1. Start an on-site inspection from a unit summary (beds / baths / sqft, conversational prompt).
2. Choose layout: upload plan vs **AI generated (Recommended)** from unit records.
3. Room-by-room checklist (where to check, what to capture).
4. Item walkthrough with `n/n` progress, area subtitle, **Save & close**.
5. Condition tiles: Good / Repair / Replace / Missing.
6. Per-item photo upload + thumbnails.
7. Per-item notes.
8. All-rooms summary with `n/n complete`, **Edit** / **Finish**.
9. Download PDF condition report (photos matched to items).
10. Owner & tenant signature block on the report.
11. Findings become work orders (notes + photos on the ticket).
12. Vendor picker / billing on the work-order form (DoorLoop).
13. Calendar reminder cards (Keep / Turn off).
14. Mobile-first vertical flow.

---

## Already present (no change, or equivalent)

| Feature | Where |
|---|---|
| Schedule / list inspections | Dashboard `InspectionManager` |
| Checklist rows + conditions on the API | `inspection_items` |
| One issue → maintenance ticket (idempotent) | `POST /inspections/:id/items/:itemId/maintenance` |
| Floor-plan upload + named rooms | `PropertyFloorPlans` |
| Vendor assignment | Existing maintenance screens |
| Tenant self-inspection | OndoREui wizard (different product) |
| Calendar / notifications | Existing manager calendar + notifications |

---

## Implemented

### 1. AI / floor-plan layout generation

**Missing:** Items were typed one at a time.

**Change:** `POST /inspections/:id/layout` builds a room-by-room checklist from bedrooms/baths or floor-plan room names. Second generate returns 409. Inspection moves to `in_progress`.

**Files:** `inspectionLayout.ts`, `inspectionService.ts`, Express `operationsRoutes.ts`, Edge `operations.ts`, dashboard + mobile walkthroughs.

### 2. Guided walkthrough (dashboard + mobile)

**Missing:** No item-by-item UI; no photos in UI.

**Change:** Layout choice → item cards (Good/Repair/Replace/Missing mapped to `good|poor|damaged|missing`) → photos via documents upload → notes → all-rooms summary → finish.

**Files:** `inspection-walkthrough.tsx`, `inspection-manager.tsx`, mobile `InspectionWalkthrough.tsx`, list + property links.

### 3. PDF report + signatures

**Missing:** Lease PDF only.

**Change:** Express generates a condition PDF (item notes + photo URLs, signature page) into the `documents` bucket. Owner/tenant typed names + timestamps on `property_inspections`. Edge returns structured report JSON (no pdfkit on Deno); dashboard can still generate PDF against the Node API.

**Files:** `inspectionReportService.ts`, migration `20260829173738_inspection_ai_workflow.sql`, sign + report routes.

### 4. Bulk work orders

**Missing:** One “Open ticket” per row.

**Change:** `POST /inspections/:id/work-orders` converts remaining poor/damaged/missing items (same idempotent convert path).

---

## Partial improvements

- Property beds/baths/sqft **and lease dates** shown at inspection start.
- Item notes and `photo_urls` existed on the API; they are now in the walkthrough.
- Extra inspection photos (beyond the first) are appended to the work-order description.
- “Open ticket” remains as “Ticket opened” links after convert; each finding also has **Open work order**.

---

## Gap pass (vs screenshots / original prompt)

Closed after comparing `reference-04` through `reference-13` and the audit:

| Gap | Change |
|---|---|
| Checklist overview (“where to check, what to capture”) was skipped | New **checklist** phase after layout generate; room cards with capture hints; Start walkthrough |
| Upload PDF/image was a fake generate | File picker → documents `floor_plan` upload → floor-plan row (optional room names) → `POST /layout` `uploaded` |
| Lease dates unused | Inspection manager + mobile walkthrough load the current lease |
| Condition tiles were text-only | Smile / wrench / trash / search icons (Lucide + Ionicons) |
| All-rooms list had no room icons | Door / sofa / kitchen / bath / bed icons by room name |
| Legal copy only in PDF | Same disclaimer on the in-app signature step |
| Mobile photos were library-only | Camera + library, matching “snap photos” |
| Work order dropped extra photos | Remaining URLs in the ticket description (Express + Edge) |
| Findings had bulk convert only | Per-item **Open work order** |

Intentionally still not cloned: Confirm lease / Move in, reminder Keep/Turn-off chrome, vendor modal, Save & Create Bill, DoorLoop watermark, voice notes, vision photo-sort.

---

## Files changed

**Backend:** `supabase/migrations/20260829173738_inspection_ai_workflow.sql`, `src/types/database.ts`, `src/services/inspectionLayout.ts`, `inspectionLayout.test.ts`, `inspectionService.ts`, `inspectionReportService.ts`, `src/routes/operationsRoutes.ts`, `supabase/functions/_shared/routes/operations.ts`, `src/test/integration/flows/inspection-maintenance-floor-plans.test.ts`, `src/middleware/rateLimitMiddleware.ts` (skip `apiLimiter` when `NODE_ENV=test`).

**Dashboard:** `inspection-walkthrough.tsx`, `inspection-walkthrough-ui.ts`, `inspection-manager.tsx`, `owner-property-detail.tsx`, `manager-property-ops.tsx`, `feature-api.ts` (layout / sign / report / work-orders / updateItem).

**Mobile:** `packages/api-types/src/index.ts`, `src/features/owner/inspections/*`, owner `property/[id]/inspections` + `inspection/[inspectionId]`, manager `property-inspections/[id]` + `inspection/[inspectionId]`, layouts, property detail links.

---

## Screenshots

**Reference (analysis):** `OndoREDashboard/reference-analysis/screenshots/reference-01-…` through `reference-13-…`

**Current app after implementation:** Manager walkthrough verified live: layout choice, AI generate → room checklist with capture hints, item condition tiles with icons, all-rooms summary with room icons. Owner portal currently errors in `PortalSidebar` (`useContext` null) — unrelated to this walkthrough.

---

## Testing

| Check | Result |
|---|---|
| Backend `tsc` | Pass |
| Backend `inspectionLayout` unit tests | Pass (7) |
| Backend inspection integration | Pass (3) after applying migration locally + remotely |
| Dashboard walkthrough helper tests | Pass (11) |
| Dashboard eslint (touched files) + `tsc` | Pass |
| Mobile eslint (inspection files) + Jest `useInspections` + `inspectionWalkUi` | Pass (9) |
| Responsive | Walkthrough uses stacked layout, `sm:grid-cols-2`, dialog `max-w-2xl` / 90vh scroll; native screens are phone-first |
| Live dashboard | Manager property inspections: layout choice (beds + start prompt + Upload PDF/image + AI recommended), AI generate → room checklist with capture hints, item tiles with condition icons, all-rooms chef-hat icon + Edit/Finish. Lease dates appear when the property has a current lease. Owner `/owner` hit a pre-existing PortalSidebar `useContext` crash unrelated to this walkthrough. |

**Migration:** Applied with `supabase db push` (remote) and `supabase migration up --local`.

---

## Remaining differences (intentional)

| Difference | Why |
|---|---|
| No DoorLoop branding / reminder Keep-Turn-off cards | Existing calendar + notifications; not cloning chrome |
| No Save & Create Bill | Accounting is a separate product surface |
| Vendor picker stays on maintenance | Equivalent; tickets open there |
| No speech SDK / Claude vision photo sort | Notes + explicit photo attach for v1 |
| Edge `POST /report` does not render PDF | pdfkit is Node-only; Express generates the file; Edge returns JSON + signed URL if a path already exists |
| Photo URLs printed in the PDF, not embedded images | Avoids fetching arbitrary bytes into pdfkit in v1 |
| Tenant self-inspection unchanged | Different product (OndoREui) |
| Condition API still `excellent\|good\|fair\|poor\|damaged\|missing` | UI maps Repair→poor, Replace→damaged |
