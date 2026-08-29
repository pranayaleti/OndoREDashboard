# Reference Feature Audit — DoorLoop AI Inspections

**Reference video:** [AI Inspections: From Hours to Minutes](https://www.youtube.com/watch?v=LTEmCgv4c_I) (YouTube Short, 1:23, DoorLoop, Feb 2026)

**Analyzed:** 2026-08-29  
**Our apps in scope:** OndoREDashboard (owner/manager inspections), OndoREMobile (no inspection walkthrough today), OndoREBackend (property_inspections + inspection_items), OndoREui (tenant self-inspection wizard — different product).

This is a **feature gap analysis**. Branding, logos, and DoorLoop visual assets are not to be copied. UX patterns are recreated with Ondo’s existing design system.

---

## Video storyboard (UI states)

| Time | What appears | Screenshot |
|---|---|---|
| 0:02 | Motion type: “Your portfolio grew” | `screenshots/reference-02-intro-portfolio.png` |
| 0:10 | Weekly calendar + floating “REMINDER / Schedule inspection for {address}” cards with Keep / Turn off | `screenshots/reference-03-calendar-reminders.png` |
| 0:16–0:22 | Text: inspections take time without the product | (motion graphic) |
| 0:22 | Property summary (2 bed · 1 bath · 800 sqft, lease dates, Move in, Confirm lease) + AI message “Let’s start the inspection for Sunset Villas, Unit 3B” + **Inspection layout** choice: Upload PDF/image vs **AI generated (Recommended)** | `screenshots/reference-04-layout-choice.png`, `reference-12-ai-layout.png` |
| 0:28 | Vertical list of checklist cards (icon, title, description, action) — “where to check, what to capture” | `screenshots/reference-05-checklist-items.png` |
| 0:31 | Item header card: “Kitchen Cabinets 1/6”, “Inside kitchen”, Save & close | `screenshots/reference-13-item-header.png` |
| 0:34 | Item walkthrough: Condition assessment (Good / Repair / Replace / Missing), Images (upload JPEG/PNG + thumbnails), Note textarea | `screenshots/reference-06-item-walkthrough.png` |
| 0:40 | **All Rooms Inspected** — rooms with icons, teal check, “5/5 complete”; **Edit inspection** / **Finish inspection** | `screenshots/reference-07-all-rooms.png` |
| 0:46 | Primary CTA **Download PDF report** | `screenshots/reference-08-download-pdf.png` |
| 0:52 | Multi-page legal report: Inspection Summary, room pages, **Owner & Tenant Signature**, “Page 4 of 4” | `screenshots/reference-09-legal-signatures.png` |
| 0:58 | **NEW WORK ORDER** modal, vendor dropdown (e.g. “NS Maintenance Services”) | `screenshots/reference-10-new-work-order.png` |
| 1:01 | Work order form: Property, Memo (char count), PDF attachments with delete, Save & Create Bill, Save, Cancel | `screenshots/reference-01-work-order-form.png`, `reference-11-work-order-attachments.png` |
| 1:04 | Close: “Done before you’re in your car” | (motion graphic) |

Transcript (complete): Open the app → AI assistant starts the inspection → add layout or let AI build one → walk the property, snap photos, add notes, room by room → AI files everything → one click complete report with photos matched → legal document ready to sign → things to fix become work orders with notes and photos attached.

---

## Current Ondo architecture (what we already have)

| Layer | Location | What it does |
|---|---|---|
| DB | `property_inspections`, `inspection_items` (`area`, `item_name`, `condition`, `notes`, `photo_urls`) | Schedule + checklist; photos exist on the schema but are unused in UI |
| DB | `maintenance_requests.inspection_id` / `inspection_item_id` | Idempotent convert of one checklist issue → ticket |
| DB | `property_floor_plans` | 2D image + optional room labels (not an inspection layout) |
| API | `POST/GET /properties/:id/inspections`, `PUT /inspections/:id`, `POST /inspections/:id/items`, `PUT /inspection-items/:id`, `POST /inspections/:id/items/:itemId/maintenance` | Express + Edge (operations) |
| Dashboard | `InspectionManager` on owner property detail + manager property ops | Schedule, list, add one item at a time, complete with excellent/good/fair/poor, convert one issue to a ticket |
| Dashboard | `PropertyFloorPlans` | Upload 2D plan image + comma-separated room names |
| Dashboard | Maintenance + vendors | Create tickets, suggest vendors, attach photos on new requests |
| Dashboard | Manager assistant | General chat; no inspection start/layout tools |
| Mobile | **No inspection screens** for owner/manager | Push routes `inspection_*` to move-in / maintenance only |
| OndoREui | `SelfInspectionWizard` | Tenant self-report: type, rooms, photo URL, submit — not staff AI walkthrough |
| Planned, unimplemented | `docs/superpowers/plans/2026-04-13-vision-inspection-reports.md` | `ai_report` jsonb + Claude vision analyze — **not in schema or routes** |
| PDF / e-sign | `leasePdfService` + DocuSign adapters | Leases only, not inspection reports |

---

## Feature inventory

| # | Feature | Evidence in video | Current app status | Action |
|---|---|---|---|---|
| 1 | Open app and start an on-site inspection | 0:22 caption “Open the DoorLoop app” | Partial — inspections are scheduled from dashboard, not started as a mobile walkthrough | Implement walkthrough on dashboard (responsive) + owner/manager mobile |
| 2 | Conversational AI prompt to start (“Let’s start the inspection for {unit}”) | 0:22 | Missing in inspection UI. General assistant exists but cannot start this flow | Implement inspection-scoped assistant copy + layout prompt (not DoorLoop branding) |
| 3 | Unit summary: beds, baths, sqft, lease dates, move-in | 0:22 | Existing on property detail; **not** shown when starting an inspection | Surface property/lease summary on inspection start |
| 4 | Inspection layout: upload PDF/image | 0:22–0:25 | Partial — floor-plan upload is a **separate tab**, not an inspection layout | Wire “upload layout” to floor plan + generate checklist from named rooms |
| 5 | Inspection layout: AI generated from unit records (Recommended) | 0:22–0:25 | Missing — items are typed in one-by-one | Implement `POST /inspections/:id/layout` from bedrooms/baths/floor-plan rooms |
| 6 | Guided checklist: where to check / what to capture | 0:28 | Partial — freeform Area + Item fields, no generated checklist | Generate room-by-room items |
| 7 | Item walkthrough with progress (1/6), area subtitle, Save & close | 0:31–0:34 | Missing | Implement stepped item UI |
| 8 | Condition: Good / Repair / Replace / Missing | 0:34 | Different — excellent/good/fair/poor/damaged/missing dropdown | Map UI to existing API conditions; keep API values |
| 9 | Per-item photo capture / upload + thumbnails | 0:34 | Schema `photo_urls` exists; **UI never uploads** | Implement photo upload into `photo_urls` |
| 10 | Per-item notes while walking | 0:31–0:34 | Partial — notes only on the inspection header, not on items in the add form | Item notes already on API; expose in walkthrough |
| 11 | Room-by-room completion, nothing missed | 0:40 | Missing progress-by-room | All-rooms summary with counts |
| 12 | All rooms inspected + Edit / Finish | 0:40 | Partial — “complete” is four overall-condition buttons, no room rollup | Implement summary + finish |
| 13 | One-click complete PDF report, photos matched | 0:46–0:52 | Missing (lease PDF only) | Generate inspection report (PDF on Express; printable report everywhere) |
| 14 | Legal document ready to sign (owner + tenant) | 0:52 | Missing for inspections (lease e-sign exists) | Capture owner/tenant names + timestamps on the inspection; print on report |
| 15 | Findings → work orders in a flash | 0:58 | Partial — **one** “Open ticket” per damaged/poor/missing item | Bulk convert remaining issues |
| 16 | Work order vendor picker | 0:58 | Existing in maintenance, **not** in inspection convert | After convert, tickets land in maintenance where vendors are assigned (equivalent). Do not add billing. |
| 17 | Work order memo + attached notes/photos | 1:01 | Partial — convert copies notes + first photo URL into the ticket | Keep; bulk path must copy the same |
| 18 | Save & Create Bill | 1:01 | **Out of scope** — accounting bill-from-work-order is a different product surface | No change (intentionally different) |
| 19 | Inspection reminder cards on calendar (Keep / Turn off) | 0:10 | Partial — manager calendar has inspection-typed events; not this reminder UI | Evaluate: existing notifications/calendar cover the job; do not clone DoorLoop reminder chrome |
| 20 | Mobile-first vertical walkthrough | entire Short | Missing on native app | Implement native walkthrough |
| 21 | Voice notes to AI (“everything is great except…”) | product blog, not clearly a dedicated UI in the Short | Missing | Notes textarea is the equivalent for v1; no new speech SDK |
| 22 | Tenant self-inspection | not in this Short | Existing (OndoREui wizard + tenant_inspections) | No change |

---

## Visual vs functional gaps

**Visual:** Reference is a vertical mobile flow with large condition tiles, dashed photo dropzone, and a legal multi-page PDF. Ours is a compact desktop dialog with dropdowns.

**Functional:** Scheduling, checklist CRUD, and single-item → maintenance **work**. The missing core is the **on-site loop**: generate layout → walk items with photos/notes → finish → report + signatures → bulk work orders.

**Responsive:** Reference is phone-first. Dashboard inspections are dialog-sized; they need a full-width walkthrough that works at 375px. Native app has no inspection route at all.

**Do not implement just because it looks different:** calendar reminder chrome, DoorLoop logo, “Save & Create Bill”, hand-drawn sketch styling, Confirm lease / Move in (those are leasing, already elsewhere).

---

## Implementation plan (approved by this audit)

1. **Backend:** layout generation from unit + floor-plan rooms; report payload + PDF; owner/tenant sign; bulk work-order convert; persist layout/report/signature columns.
2. **Dashboard:** extend `InspectionManager` with start prompt, layout choice, item walkthrough, all-rooms summary, download report, sign, bulk tickets, photo upload. Reuse existing APIs and UI primitives.
3. **Mobile:** owner + manager inspection list/walkthrough using existing `apiFetch` + camera picker pattern from maintenance photos.
4. **Edge parity:** same new inspection routes on `supabase/functions/_shared/routes/operations.ts`.
5. **Not in this pass:** speech-to-text, Claude vision photo classification (the 2026-04-13 plan), DocuSign for inspection PDFs, billing from work orders.
