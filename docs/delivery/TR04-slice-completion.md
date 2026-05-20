# SLICE-04 — Assignments — Completion record

**Authority:** [TR04-assignments-requirements.md](../requirements/TR04-assignments-requirements.md)  
**Completed (implementation):** 2026-05-20  
**Sign-off:** Pending manual dev-db verification (see below)  
**Quality gate:** `npm run validate` — PASS (6/6)

---

## Acceptance criteria (TR04 § Acceptance criteria)

| # | Criterion | Status | Evidence / notes |
|---|-----------|--------|------------------|
| 1 | Planner CRUD assignment rows for allowed resource types | **Complete** (code) | [`useAssignmentMutations.ts`](../src/features/assignments/hooks/useAssignmentMutations.ts), [`AssignmentDialog.tsx`](../src/features/assignments/components/AssignmentDialog.tsx), [`AssignmentList.tsx`](../src/features/assignments/components/AssignmentList.tsx). **Manual:** dev-db round-trip. |
| 2 | Invalid `resource_id` / wrong type — actionable error | **Complete** (code) | [`errors.ts`](../src/features/assignments/errors.ts); client picker limits ids to loaded logistics rows. **Manual:** trigger failure on dev-db. |
| 3 | Headcount vs capacity; over-capacity Option B | **Complete** (code) | [`headcount.ts`](../src/features/assignments/headcount.ts), [`CapacityPressureBadge.tsx`](../src/features/assignments/components/CapacityPressureBadge.tsx); two-step confirm in dialog. |
| 4 | Picker: approved applications only | **Complete** (code) | [`useApprovedApplications.ts`](../src/features/assignments/hooks/useApprovedApplications.ts) filters `status = approved`. |
| 5 | No planning permission — cannot manage | **Complete** (code) | `PagePermissionGuard` + `usePageCan('planning', …)` on [`AssignmentsPage.tsx`](../src/app/pages/AssignmentsPage.tsx). |
| 6 | No assignment mutations on `/planning` | **Complete** (code) | Planning lists only [`Link`](../src/features/planning/components/TransportList.tsx) to `/assignments?…`; no `trac_itinerary_assignment` writes in planning feature. |

---

## Routes and navigation

| Item | Status |
|------|--------|
| `/assignments` route | **Complete** — [`authenticated-routes.tsx`](../src/app/routes/authenticated-routes.tsx) |
| Nav registration | **Complete** — [`trac-nav.ts`](../src/app/navigation/trac-nav.ts) |
| RBAC v1 `planning` page key | **Complete** — read guard + write via `usePageCan` |

---

## Testing requirements (TR04 § Testing requirements)

| # | Scenario | Type | Status | Evidence |
|---|----------|------|--------|----------|
| 1 | Happy path: assign to activity; headcount updates | Integration | **Complete** | [`assignments.integration.test.tsx`](../src/features/assignments/assignments.integration.test.tsx) |
| 2 | Validation failure: bad `resource_id` | Integration | **Complete** | Same file |
| 3 | Auth / permission failure | Integration | **Complete** | Same file + [`AssignmentsPage.test.tsx`](../src/app/pages/AssignmentsPage.test.tsx) |
| — | Unit: headcount vs capacity | Unit | **Complete** | [`headcount.test.ts`](../src/features/assignments/headcount.test.ts) |
| — | Nav `/assignments` registered | Unit | **Complete** | [`trac-nav.test.ts`](../src/app/navigation/trac-nav.test.ts) |

**Automated:** 98 tests passed (`npm run test`).

---

## Verification (manual — pending sign-off)

- [ ] Assignment create/update/delete round-trip on dev-db
- [ ] Insert with invalid `resource_id` — trigger error surfaced in UI
- [ ] Planner vs participant: management route blocked without `read:page.planning` (participant read on SLICE-05)

---

## Invalidation contract

[`invalidateAssignmentsAndDependents`](../src/features/assignments/invalidation.ts) invalidates assignment queries and `TRAC_ITINERARY`, `TRAC_COSTS`, `TRAC_DASHBOARD`, `TRAC_MASTERPLAN` prefixes after mutations.

---

## Explicit exclusions (TR04 § Do not)

| Rule | Status |
|------|--------|
| No assignment CRUD on `/planning` | **Met** |
| No service-role in browser | **Met** |
| Management route planner-gated | **Met** |
