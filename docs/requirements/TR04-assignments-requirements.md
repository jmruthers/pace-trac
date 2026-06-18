# SLICE-04 — Assignments — Requirements

**Document status:** Draft — rebuild implementation contract.  
**Companion authority:** `trac-project-brief.md`, `trac-architecture.md`.

---

## Orchestration metadata (canonical)

| Field | Value |
|--------|--------|
| **Slice ID** | SLICE-04 |
| **Name** | Assignments |
| **Bounded context** | Assignments |
| **Owning routes** | `/assignments` |
| **Depends on** | SLICE-01, **SLICE-03** (logistics rows must exist to reference) |
| **Blocks** | SLICE-05 (itinerary), SLICE-07 (costs rollups where assignment-aware) |
| **Implementation order** | 4 of 10 |
| **High-risk** | Yes — polymorphic `trac_itinerary_assignment`, RLS, participant pickers, headcounts vs capacity |
| **Cross-cutting** | May use lists/maps **read-only** as needed — **no** full Places planning UI duplication |

**RBAC (v1):** **`planning`** page permissions for `/assignments` (authoritative per `trac-architecture.md`); optional dedicated `assignments` key is a later refinement.

---

## Overview

Deliver **`/assignments`**: planner-facing CRUD for **`trac_itinerary_assignment`**, linking **`base_application`** (participant) to logistics rows via **`resource_type`** + **`resource_id`**, with **headcounts** vs **capacity** on transport/accommodation/activity, optional **notes**, and views that help planners see coverage per resource. This route **owns all assignment mutations**; `/planning` remains logistics-only.

- Prototype reference: inline **`AssignPanel`** on `PlanningItemPage` in `pace-prototype/apps/pace-trac/pages/PlanningPage.jsx` (prototype has **no** `/assignments` route).

---

## Current legacy baseline (observational only)

Legacy TRAC had **no dedicated assignments route** and did not surface assignment UX. Baseline is **N/A** for UX parity; requirements are **schema- and brief-driven**.

---

## Rebuild target

- **Participant picker:** Select people from the active event’s **approved** `base_application` rows only. Do not show `draft`, `submitted`, `under_review`, `rejected`, or `withdrawn` applications in the assignment picker. Prevent duplicate assignment rows where DB constraints disallow them.
- **Polymorphic target:** Choose resource type (transport / accommodation / activity) and specific row; **DB trigger (DEC-082)** validates `resource_id` exists — surface errors cleanly.
- **Headcounts:** Show assigned count vs capacity (nullable capacity = uncapped). **Over-capacity (per `trac-architecture.md`):** if `capacity` is non-null and a save would exceed it, **allow** the save only after a **strong warning** and **explicit confirmation** (Option B — DB does not enforce headcount ≤ capacity).
- **Notes:** CRUD on assignment-level notes if column exists per dev-db.
- **Views:** **By resource is primary for v1** (list assignments per transport leg, etc.). Per-participant perspective is provided elsewhere in TRAC (e.g. itinerary role views).
- **RLS:** Planners with planning permission see/manage event assignments; participants see **own** rows on read surfaces (SLICE-05) — this slice focuses **planner management**.
- **Deep links:** Support navigation from Planning (read-only “open assignments”) and Itinerary as needed via URL params — without moving mutation ownership.

**Suggested sub-phases:** list by resource → add/remove assignment → notes → validation UX.

---

## pace-core2 delta (vs legacy)

| Area | Legacy | Rebuild |
|------|--------|---------|
| Route | None | Dedicated `/assignments` |
| Data model | Not in app | Full `trac_itinerary_assignment` |
| Permissions | N/A | **`planning`** page key for v1 |

---

## pace-core2 imports (expected)

| Need | Import path (expected) |
|------|------------------------|
| RBAC | `@solvera/pace-core/rbac` — `PagePermissionGuard` with **`planning`** page key for v1 |
| Providers | `@solvera/pace-core/providers` |
| Forms / tables | `@solvera/pace-core/forms`, `@solvera/pace-core/components` |
| Secure client | `@solvera/pace-core/rbac` — `createSecureClient` / usage via app setup |

---

## Data and schema references

| Table | Notes |
|-------|--------|
| `trac_itinerary_assignment` | Polymorphic link; organisation_id / event_id denormalisation per brief |
| `base_application` | Participant scope for pickers |
| `trac_transport`, `trac_accommodation`, `trac_activity` | Capacity + labels for pickers |
| **Triggers** | Integrity on resource_id; cleanup on resource delete (DEC-058) — **validate on dev-db** |
| **Supabase MCP (dev-db)** | **Required:** columns, RLS policies for planner vs participant |

---

## Acceptance criteria

1. Planner can create, update, delete assignment rows for allowed resource types on the active event.
2. Invalid `resource_id` / wrong type fails with **actionable** error (DB + client validation).
3. Headcount UI reflects assignments count vs row capacity when capacity is non-null; **over-capacity** saves require warning + explicit confirmation (architecture Option B).
4. Participant picker only lists **approved** applications in scope for the active event.
5. User without **planning** (or future **assignments**) read/write cannot manage assignments.
6. No assignment mutations implemented under `/planning`.

### Layout (prototype parity targets — `AssignPanel` on planning item page)

- [ ] Section card **Assigned people** beside resource details on item page layout (prototype `item-assign`).
- [ ] Headline readout: assigned count vs capacity (or **uncapped**); capacity bar with over/near/full styling; over-capacity note when assigned > capacity.
- [ ] Named assignment list with participant cells and per-row notes; remove action per row.
- [ ] **Add participant** flow: toggle reveals search + pick list of approved members not yet assigned; selecting adds row and warns when over capacity.
- [ ] Further unnamed headcount note when assigned count exceeds named rows (prototype `further` count).
- [ ] Production `/assignments` route: by-resource table view per rebuild target — not required to duplicate two-column item layout.

---

## API / Contract

- **CRUD** on `trac_itinerary_assignment` via secure client; all rows scoped by event/org.
- **Reads** for pickers: `base_application` + logistics tables — respect RLS.
- **Writes:** No direct changes to generated or non-owned columns; follow brief for nullable fields.
- **Invalidation:** Successful assignment mutations invalidate assignment lists/headcounts plus dependent itinerary/cost/dashboard/master-plan reads directly; do not rely on timing delays or custom browser events.

---

## Visual specification

### Prototype layout authority (`AssignPanel` on `PlanningItemPage`)

Embedded in planning item **two-column** `item-layout` (details card + assignment card):

**Header row (`section-card-head`):**

- Title **Assigned people**; subtitle explaining named allocations vs headcount cost basis.
- Capacity readout (`asg-cap-readout`): large **assigned / capacity** (or assigned only when uncapped); horizontal bar with over/near/full states; mono notes (**N over capacity**, **at capacity**).

**Body:**

- List of named assignments: `ParticipantCell` + optional notes field + remove control.
- **Add participant** toggle expands search (`SearchInput`) and scrollable pick list of available approved members.
- Footer note when headcount exceeds named rows (“N further unnamed seats” pattern).

**Interactions:**

- Add participant: toast on success; warn tone when assignment exceeds capacity (prototype — maps to architecture Option B confirmation in production).
- Remove assignment: immediate with toast.

### Production `/assignments` route (pass 2)

- Dense operational UI: filter/table **by resource type** (architecture primary v1 view).
- Capacity pressure badges using design tokens (`CapacityMeter` or equivalent).
- Empty: **No assignments yet** with CTA; loading on pickers.
- Deep link from planning item optional (“Open assignments”) without embedding mutations on `/planning`.

### Implementation delta (pass 2)

- **Route split:** prototype folds all assignment UX into planning item page; production dedicates `/assignments` per architecture — requirement layout above describes **prototype panel**; pass-2 implements equivalent capabilities on `/assignments`.
- Prototype does not implement separate by-resource management table; production v1 prioritises by-resource lists per architecture.
- Over-capacity: prototype warns via toast; production requires explicit confirmation dialog before save (Option B).

---

## Verification

- Assignment round-trip against dev-db; trigger failure cases (bad id).
- RLS: participant cannot list others’ assignments **on management views** (should be planner-only); participant read model verified in SLICE-05.

---

## Testing requirements

| # | Scenario | Type |
|---|----------|------|
| 1 | **Happy path:** Planner assigns participant to existing activity; row appears; headcount updates | Integration |
| 2 | **Validation failure:** Assignment to non-existent `resource_id` — rejected | Integration |
| 3 | **Auth / permission failure:** User without planning permission — no save; AccessDenied or RLS | Integration |

Unit: headcount vs capacity pure logic.

---

## Open questions

*(None — over-capacity Option B and `planning` RBAC recorded in `trac-architecture.md`.)*

---

## Do not

- Do not implement assignment CRUD on `/planning`.
- Do not bypass RLS with service role in the browser.
- Do not expose other participants’ PII to participant role on this **management** route (route should be planner-gated).

---

## References

| Document | Role |
|----------|------|
| `trac-architecture.md` | Assignment route split, RBAC note, participant vs planner explainer, DEC-058 |
| `trac-project-brief.md` | Person-aware logistics scope |
| TR03-planning-logistics-requirements.md | Logistics ownership boundary |
