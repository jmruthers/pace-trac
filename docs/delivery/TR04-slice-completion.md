# SLICE-04 — Assignments — Completion record

**Authority:** [TR04-assignments-requirements.md](../requirements/TR04-assignments-requirements.md)  
**Completed (implementation):** 2026-05-20  
**Sign-off:** Pending manual dev-db verification (see [TR04-remediation-plan.md](./TR04-remediation-plan.md))  
**Quality gate:** `npm run validate` — PASS (6/6)

---

## Acceptance criteria (TR04 § Acceptance criteria)

| # | Criterion | Code | Sign-off |
|---|-----------|------|----------|
| 1 | Planner can create, update, delete assignment rows for allowed resource types on the active event | [x] | [ ] manual dev-db |
| 2 | Invalid `resource_id` / wrong type fails with **actionable** error (DB + client validation) | [x] | [ ] manual trigger |
| 3 | Headcount UI vs capacity; over-capacity saves require warning + explicit confirmation (Option B) | [x] | [ ] manual over-cap save |
| 4 | Participant picker only lists **approved** applications for the active event | [x] | [ ] manual picker scope |
| 5 | User without **planning** read/write cannot manage assignments | [x] | [ ] manual RLS + shell |
| 6 | No assignment mutations implemented under `/planning` | [x] | [x] grep clean |

**Summary:** All six acceptance criteria are **implemented in application code**. Full **sign-off** depends on manual dev-db verification (P0 in remediation plan).

---

## Rebuild target (TR04 § Rebuild target)

| Item | Status | Evidence |
|------|--------|----------|
| Participant picker: **approved** `base_application` only | [x] | [`useApprovedApplications.ts`](../../src/features/assignments/hooks/useApprovedApplications.ts) — `status = approved`, `event_id` scoped |
| Exclude draft / submitted / under_review / rejected / withdrawn | [x] | Server-side filter; non-approved never queried for picker |
| Prevent duplicate rows (DB constraint) | [x] | Picker excludes already-assigned ids; [`errors.ts`](../../src/features/assignments/errors.ts) maps `23505` |
| Polymorphic target: transport / accommodation / activity + row | [x] | Tabs + [`ResourcePicker.tsx`](../../src/features/assignments/components/ResourcePicker.tsx) |
| DB trigger (DEC-082) errors surfaced | [x] | [`errors.ts`](../../src/features/assignments/errors.ts); integration test for bad `resource_id` |
| Headcounts vs capacity (nullable = uncapped) | [x] | [`headcount.ts`](../../src/features/assignments/headcount.ts), list header copy |
| Over-capacity Option B (warn + explicit confirm) | [x] | Two-step flow in [`AssignmentDialog.tsx`](../../src/features/assignments/components/AssignmentDialog.tsx) |
| Notes CRUD on assignment rows | [x] | Create/update `notes`; delete via row delete |
| By-resource primary view (v1) | [x] | [`AssignmentsContent.tsx`](../../src/features/assignments/AssignmentsContent.tsx) |
| Planner management / RLS (participant read in SLICE-05) | [x] | `PagePermissionGuard` + `usePageCan`; participant path out of scope here |
| Deep links from **Planning** (read-only) | [x] | [`TransportList`](../../src/features/planning/components/TransportList.tsx) / accommodation / activity `Link` → `/assignments?kind=&resourceId=` |
| Deep links from **Itinerary** as needed | [ ] | **Deferred** — `/itinerary` not built (SLICE-05); URL contract ready for SLICE-05 to consume |

---

## pace-core2 delta (TR04 § pace-core2 delta)

| Area | Status |
|------|--------|
| Dedicated `/assignments` route | [x] |
| Full `trac_itinerary_assignment` in app | [x] |
| **`planning`** page key for v1 | [x] |

---

## pace-core2 imports (TR04 § pace-core2 imports)

| Need | Status | Notes |
|------|--------|-------|
| RBAC — `PagePermissionGuard` + **`planning`** | [x] | [`AssignmentsPage.tsx`](../../src/app/pages/AssignmentsPage.tsx) |
| Providers | [x] | App shell / `useOptionalEvents` / `useResolvedScope` via existing bootstrap |
| Forms / tables — `@solvera/pace-core/forms`, `components` | [~] | **Components** used (`Dialog`, `Select`, `Tabs`, `Card`, …). **`@solvera/pace-core/forms` not used** — dialog uses local state (see remediation P3) |
| Secure client | [x] | `useSecureSupabase` in hooks |

---

## API / Contract (TR04 § API / Contract)

| Rule | Status | Evidence |
|------|--------|----------|
| CRUD on `trac_itinerary_assignment` via secure client | [x] | [`useAssignmentMutations.ts`](../../src/features/assignments/hooks/useAssignmentMutations.ts) |
| Rows scoped by `event_id` / `organisation_id` | [x] | Insert payload + query `.eq('event_id', …)` |
| Reads: `base_application` + logistics — RLS | [x] | [`useApprovedApplications`](../../src/features/assignments/hooks/useApprovedApplications.ts), planning list hooks |
| Writes: no generated / non-owned columns | [x] | Insert/update only `application_id`, `resource_*`, `notes`, scope ids |
| Invalidation: assignments + itinerary/costs/dashboard/masterplan | [x] | [`invalidation.ts`](../../src/features/assignments/invalidation.ts) — no delays / custom events |

---

## Visual specification (TR04 § Visual specification)

| Item | Status | Notes |
|------|--------|-------|
| Dense operational UI; filter by resource type | [x] | Tabs per type (transport / accommodation / activity) |
| Mobile-friendly stacked layout | [x] | `grid gap-4`, card + `<ul>` lists |
| Tables with filters | [~] | **List/card layout** instead of `DataTable` — acceptable for v1 stacked UX; optional upgrade in remediation P3 |
| Capacity pressure badges (token colours) | [x] | [`CapacityPressureBadge.tsx`](../../src/features/assignments/components/CapacityPressureBadge.tsx) — `main-*` / `acc-*` |
| Empty state: “No assignments yet” + CTA | [x] | Copy in [`AssignmentList.tsx`](../../src/features/assignments/components/AssignmentList.tsx); **Add assignment** in card header (visible when empty) |
| Loading states for pickers | [x] | `LoadingSpinner` on resource + participant loaders |

---

## Testing requirements (TR04 § Testing requirements)

| # | Scenario | Type | Status | Evidence |
|---|----------|------|--------|----------|
| 1 | Happy path: assign to **activity**; row appears; headcount updates | Integration | [x] | [`assignments.integration.test.tsx`](../../src/features/assignments/assignments.integration.test.tsx) |
| 2 | Validation failure: non-existent `resource_id` rejected | Integration | [x] | Same file |
| 3 | Auth / permission: no planning permission — AccessDenied / no save | Integration | [~] | Page **AccessDenied** tested; **write** blocked in hook — no RTL “Add hidden” test (remediation P2) |
| — | Unit: headcount vs capacity | Unit | [x] | [`headcount.test.ts`](../../src/features/assignments/headcount.test.ts) |
| — | Nav `/assignments` registered | Unit | [x] | [`trac-nav.test.ts`](../../src/app/navigation/trac-nav.test.ts) |
| — | Page shell | Unit | [x] | [`AssignmentsPage.test.tsx`](../../src/app/pages/AssignmentsPage.test.tsx) |

**Automated:** 98 tests passed (`npm run test`); `npm run validate` PASS (6/6).

---

## Verification (TR04 § Verification)

| Check | Status |
|-------|--------|
| Assignment round-trip on dev-db | [ ] |
| Trigger failure (bad id) in UI | [ ] |
| Participant cannot use planner management views | [ ] (planner route gated; participant read model = SLICE-05) |

---

## Prerequisites (TR04 § Data and schema references)

| Prerequisite | Status | Notes |
|--------------|--------|-------|
| Supabase MCP dev-db: columns, RLS | [ ] | Assumed per [trac-backend-ready-report.md](./trac-backend-ready-report.md); **MCP artifact not recorded** — remediation P1 |
| `trac_resource_type` ↔ planning kinds | [x] | Shared `LogisticsResourceKind` in types |
| Unique `(resource_type, resource_id, application_id)` | [x] | Documented in backend report; client maps `23505` |

---

## Explicit exclusions (TR04 § Do not)

| Rule | Status |
|------|--------|
| No assignment CRUD on `/planning` | [x] |
| No service-role in browser | [x] |
| No participant PII on management route without planning read | [x] |

---

## Routes and navigation

| Item | Path / detail |
|------|----------------|
| Route | `/assignments` in [authenticated-routes.tsx](../../src/app/routes/authenticated-routes.tsx) |
| Page | [AssignmentsPage.tsx](../../src/app/pages/AssignmentsPage.tsx) |
| Nav | `/assignments` in [trac-nav.ts](../../src/app/navigation/trac-nav.ts) |
| RBAC read | `read:page.planning` via shell + `PagePermissionGuard` |
| RBAC writes | `usePageCan('planning', create \| update \| delete)` in mutations / dialog |

---

## Feature module

Primary code under [src/features/assignments/](../../src/features/assignments/):

- Types, headcount helpers, query keys, invalidation, errors, supabase helpers
- Hooks: scope (re-export planning), approved applications, resource summaries, assignments list, mutations
- Components: content shell, resource picker, assignment list/dialog, capacity badge
- Deep link query params: `?kind=<transport|accommodation|activity>&resourceId=<uuid>`

---

## Automated verification

| Check | Result |
|-------|--------|
| `npm run validate` | PASS (6/6) |
| Unit / integration tests | 98 passed (suite total; includes SLICE-04 tests) |
| pace-core audit | PASS |

---

## Gaps and remediation

See **[TR04-remediation-plan.md](./TR04-remediation-plan.md)** for prioritized follow-up (dev-db sign-off, SLICE-05 itinerary links, tests, UX polish).

---

## Ready for downstream slices

- **SLICE-05** Itinerary — may link to `/assignments?kind=&resourceId=`; consumes assignment rows + Option A logistics RLS
- **SLICE-07** Costs — `assigned_count` rollups; invalidate via `TRAC_COSTS_QUERY_PREFIX`
- **SLICE-02 / SLICE-10** — dashboard/masterplan invalidation prefixes wired

**Queue status:** SLICE-04 marked **built** in [trac-build-queue.md](./trac-build-queue.md) with remediation tracked until manual sign-off.
