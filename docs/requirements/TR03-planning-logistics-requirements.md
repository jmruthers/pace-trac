# SLICE-03 — Planning (logistics) — Requirements

**Document status:** Draft — rebuild implementation contract.  
**Companion authority:** `trac-project-brief.md`, `trac-architecture.md`.

---

## Orchestration metadata (canonical)

| Field | Value |
|--------|--------|
| **Slice ID** | SLICE-03 |
| **Name** | Planning |
| **Bounded context** | Planning; Location (partial — snapshots + cache integration) |
| **Owning routes** | `/planning` |
| **Depends on** | SLICE-01 |
| **Blocks** | SLICE-04 (assignments need logistics rows), SLICE-05, SLICE-07 |
| **Implementation order** | 3 of 10 (after SLICE-06 per plan — contacts early; planning follows) |
| **High-risk** | Yes — three resource types, capacity, enums, location snapshots, Places/cache |
| **Cross-cutting** | Google Maps / edge mediation / `trac_location_cache` — owned here and reused by SLICE-05 |

**Explicit exclusion for this route:** **No** `trac_itinerary_assignment` **mutations** on `/planning`. Assignment CRUD is **SLICE-04** (`/assignments`). Planning may show **capacity** and **location snapshots** for logistics rows only.

---

## Overview

Implement **logistics CRUD** for **transport**, **accommodation**, and **activity** under the selected event: typed **`trac_status`** and **`transport_mode`**, **capacity** fields (nullable = uncapped per DEC-058), **supporting-document attachments**, and **location snapshots** (DEC-083) written at save time using the global **`trac_location_cache`** (DEC-080) for new lookups — **not** live-joined as display truth. Planners manage status, capacity, places, and supporting docs; **person assignments** are edited only on `/assignments` (prototype: inline on planning item page — see TR04).

- Prototype reference: list, new, and item editors in `pace-prototype/apps/pace-trac/pages/PlanningPage.jsx` (`PlanningPage`, `PlanningNewPage`, `PlanningItemPage`).

---

## Current legacy baseline (observational only)

Legacy planning views provided dialogs and lists for transport, accommodation, activities; older data could use free-text status. **Assignments were not in UX.** Location handling assumed org-scoped patterns in older docs — **rebuild follows global cache + row snapshots**. Baseline informs feature coverage only.

---

## Rebuild target

- **Tabs or sections:** Transport, accommodation, activity — each with list + create/edit/delete.
- **Enums:** All new/updated rows use `trac_status` (nullable; default `idea` per architecture summary) and `transport_mode` on transport.
- **Capacity:** `trac_transport`, `trac_accommodation`, `trac_activity` capacity fields edited here; show utilisation hints only if read-only counts are available from assignments (optional display) — **assignment writes stay SLICE-04**.
- **Costs input model:** Keep support for **both** `group_cost` and `individual_cost` on the same logistics row. UI should stay simple: one primary cost field by default, with the secondary field available when the booking needs both.
- **Documents:** Transport, accommodation, and activity rows may hold supporting documents (tickets, confirmations, run sheets) using the standard pace-core2 file/attachment lifecycle; do **not** invent a TRAC-specific attachment table or bespoke public URL pattern.
- **Location:** On place pick / save, persist denormalised place fields on the logistics row; write-through to `trac_location_cache` via **service role / edge** as per platform pattern; **no FK from logistics row to cache as SoT for display**.
- **Product copy:** Do not imply “live Google data”; snapshots are point-in-time (architecture DEC-083 explainer).
- **RBAC:** `planning` page key (confirm in dev-db).
- **States:** Loading, empty, validation errors, permission denied.

**Suggested sub-phases (in-slice):** per resource type tabs → capacity/status/costs → document attachments → location snapshots → polish.

---

## pace-core2 delta (vs legacy)

| Area | Legacy | Rebuild |
|------|--------|---------|
| Status | Free-text / string | `trac_status` enum |
| Mode | Informal | `transport_mode` enum |
| Location | Varied | DEC-083 snapshots + DEC-080 global cache |
| Assignments | Absent | Explicitly **not** on this route |

---

## pace-core2 imports (expected)

| Need | Import path (expected) |
|------|------------------------|
| RBAC | `@solvera/pace-core/rbac` — `PagePermissionGuard`, secure client |
| Providers | `@solvera/pace-core/providers` |
| Forms | `@solvera/pace-core/forms` |
| CRUD / file lifecycle | `@solvera/pace-core/crud` — shared attachment/file helpers where applicable |
| Location / Places helpers | `@solvera/pace-core/location` if exported for map/place UX |
| Components | `@solvera/pace-core/components` |
| Hooks | `@solvera/pace-core/hooks` |

**Edge Functions (verified deployed on pace Supabase project via MCP):** invoke **`google-api-key`** (JWT), **`google-timezone`** (JWT), **`google-maps-script`** (no JWT). Use **`secureSupabase.functions.invoke`** (or pace-core2 equivalent). **Payloads and responses** must be taken from the function implementations in the Supabase project — not duplicated here.

---

## Data and schema references

| Table | Notes |
|-------|--------|
| `trac_transport` | `trac_status`, `transport_mode`, capacity, snapshot place fields |
| `trac_accommodation` | `trac_status`, capacity, snapshots |
| `trac_activity` | `trac_status`, capacity, snapshots; BASE linkage `base_activity_offering.trac_activity_id` is **silent** — no BASE scanning UX |
| Shared file-reference / attachment metadata table | Validate exact table and columns on dev-db; use the standard pace-core2 file/attachment lifecycle contract rather than a TRAC-specific attachment schema |
| `trac_location_cache` | PK `place_id`; global; RLS SELECT authenticated; writes via service role |
| **Triggers** | Assignment integrity / cleanup per DEC-058, DEC-082 — validate on **dev-db** |
| **Supabase MCP (dev-db)** | **Required** before implementation: column lists, enums, RLS policies on logistics tables |

Authoritative narrative: **`trac-architecture.md`** (database-backed design, DEC summaries) and **dev-db** validation via Supabase MCP.

---

## Acceptance criteria

1. Planner can create, edit, delete transport/accommodation/activity rows for the active event (subject to RLS).
2. **Status** and **transport mode** persist as enum values; invalid enum rejected client-side and server-side.
3. **Capacity** nullable behaves as uncapped; when set, numeric validation is enforced.
4. **Location:** Saving a place writes snapshot fields on the row and participates in cache write path per platform contract.
5. **No assignment CRUD** on this route — attempting to wire assignment mutations here is out of scope.
6. Participant-only users without planning permission cannot mutate logistics (guard + RLS).
7. Supporting-document upload/access/delete works from logistics rows using the standard secure file lifecycle, and surfaces storage/reference cleanup failures explicitly.
8. Successful logistics mutations invalidate dependent itinerary/cost/dashboard/master-plan reads explicitly; refresh correctness does not depend on timing delays or custom browser events.

### Layout (prototype parity targets)

- [ ] `PageHeader` with breadcrumb Events → event code → Planning; title **Planning**; primary **Add item** opens new-item route for active type tab.
- [ ] View switch: **By type** (default) vs **By day** chronological grouping (`itin-viewswitch` / `role-toggle` pattern).
- [ ] **By type:** `Tabs` for transport / accommodation / activity with per-tab counts; `DataTable` with route/name, start/end times, capacity meter, cost (event total + per-person subline), inline status select, open + delete row actions.
- [ ] Row name opens **full-page item editor** (not modal); **Add item** opens **full-page new** route with type preselected from active tab.
- [ ] **By day:** day-grouped list with same row affordances as type view.
- [ ] **New item page:** `BackLink`; type toggle (transport / accommodation / activity); `ResourceFields` grid in section card; bottom `PageSaveBar` with cancel + **Create {type}** (not generic Submit).
- [ ] **Item page:** two-column `item-layout` — **Details** section card with `ResourceFields`; **no assignment panel on this route in production** (prototype shows inline `AssignPanel` — TR04).
- [ ] Item page shows conditional `PageSaveBar` when dirty (Save + Discard changes); delete with confirmation dialog.
- [ ] Empty states per resource type with CTA to add first item; delete confirmation warns assignments will be removed.

---

## API / Contract

- **Mutations:** INSERT/UPDATE/DELETE on `trac_transport`, `trac_accommodation`, `trac_activity` via **secure** Supabase client only.
- **Files:** Supporting documents use the pace-core2 secure/storage-capable client path and shared file/attachment lifecycle helpers where they fit the schema. Metadata/reference creation, content upload, access resolution, replacement, and delete cleanup stay explicit and testable.
- **Edge:** Place details, timezone, or key resolution via Edge Functions — secrets not exposed to browser.
- **Reads:** Event-scoped selects; respect RLS.
- **Validation:** Mirror DB constraints (FKs, triggers) with UX-friendly messages; polymorphic assignment trigger is **not** exercised from planning mutations.
- **Invalidation:** After successful create/update/delete/upload/delete-document actions, invalidate the route’s own lists plus shared downstream reads that depend on planning data. Do **not** use artificial delays, `window.dispatchEvent`, or blanket storage-key clearing as the refresh mechanism.

---

## Visual specification

### Planning list (`/planning`)

- `PageHeader`: breadcrumb trail; title **Planning**; subtitle describing logistics workbench; header action **Add item** (navigates to new route for current tab type).
- **View switch** row below header:
  - Toggle **By type** | **By day** with helper caption (grouped by resource type vs chronological all rows).
- **By type mode:**
  - `Tabs` / `TabsList` / `TabsTrigger` for transport, accommodation, activity — each shows count badge.
  - `DataTable` columns: name/route (with mode glyph or resource glyph + subline), start/end datetime columns, **CapacityMeter** (assigned vs capacity, compact), cost column (event total in base currency + per-person or “group only”), inline **status** control (`StatusBadge` tone + select), row actions (open, delete).
  - Empty state per type with icon, copy, and **Add {singular type}** primary action.
- **By day mode:** chronological day sections (`PlanningDayView`) — each row links to item page; status and delete affordances preserved.
- Delete uses `ConfirmationDialog` (destructive) warning that assignments will be removed.

### New item (full-page route — prototype `#/events/:code/planning/new/:type`)

- `BackLink` → planning list.
- `PageHeader`: trail includes **New item**; title **Add item**.
- Section card: **Type** toggle (three resource types with glyphs); `ResourceFields` grid (`dlg-grid`) — name, mode (transport), datetimes, places, costs, capacity, booking reference, notes, documents as applicable.
- Footer: `PageSaveBar` — Cancel returns to list; primary **Create {singular type}** disabled when name empty; on success navigate to item page.

### Item editor (full-page route — prototype `#/events/:code/planning/:itemId`)

- `PageHeader`: dynamic title = resource name; subtitle shows type label + start time; right: status badge + **Delete**.
- **Details** section card: `ResourceFields` for inline edit; subtitle explains Save-on-footer behaviour.
- **Assignment panel:** prototype embeds `AssignPanel` beside details (headcount readout, search, participant list, notes) — **production assigns on `/assignments`** ([TR04](./TR04-assignments-requirements.md)).
- `PageSaveBar` appears only when form dirty: **Discard changes** + **Save** (exact label).
- Not-found state: 404 glyph, **Item not found**, back to planning.

### Components (pace-core targets)

- `PageHeader`, `Breadcrumb`, `Tabs`, `DataTable`, `Button`, `ConfirmationDialog`, `Card` slots, `Form`/`FormField`/`useZodForm` for field grids, `PageSaveBar` or `SaveActions` in footers, `CapacityMeter`, `StatusBadge`, location field group per platform.

### Implementation delta (pass 2)

- Prototype uses hash routes `/events/:code/planning/new/:type` and `/events/:code/planning/:itemId`; production uses flat `/planning` with nested routes or equivalent pass-2 routing — register in architecture before implementation.
- Prototype inline **AssignPanel** on item page; production **must not** mutate assignments on `/planning` — dedicated `/assignments` route (TR04).
- Prototype inline status select in list cells; production may use read-only badge + edit on item page — preserve quick status change if product requires parity.
- Prototype `PlanningDayView` is a distinct layout mode; ensure pass-2 implements or documents deferral.

---

## Verification

- CRUD round-trip on dev-db for each resource type.
- Confirm snapshot fields unchanged when cache row updates externally (Google) — row stays until user re-saves.
- RLS: participant cannot plan logistics without permission.

---

## Testing requirements

| # | Scenario | Type |
|---|----------|------|
| 1 | **Happy path:** Planner creates transport with valid enums, capacity, saves snapshot fields | Integration (mock or dev project) |
| 2 | **Validation failure:** Submit transport with invalid `trac_status` or bad capacity — rejected with message | Integration / unit |
| 3 | **Auth / permission failure:** User without planning write cannot save — guard or RLS error surfaced | Integration |

Unit: enum guards, snapshot merge helpers (pure).

---

## Open questions

*(None for function **names** — slugs confirmed on dev; **request/response shapes** still validated from function source at implementation time.)*

---

## Do not

- Do not mutate `trac_itinerary_assignment` on `/planning`.
- Do not treat `trac_location_cache` as live join for display SoT.
- Do not use production DB for validation.
- Do not implement BASE scanning/boarding flows.

---

## References

| Document | Role |
|----------|------|
| `trac-architecture.md` | Route split vs assignments, DEC-083 explainer, high-risk, database-backed design |
| `trac-project-brief.md` | Scope, quality gates |
