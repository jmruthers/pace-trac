# SLICE-05 — Itinerary — Completion record

**Authority:** [TR05-itinerary-requirements.md](../requirements/TR05-itinerary-requirements.md)  
**Completed (implementation):** 2026-05-21  
**Sign-off:** Pending manual dev-db verification (see [TR05-remediation-plan.md](./TR05-remediation-plan.md))  
**Quality gate:** `npm run validate` — PASS (6/6)  
**Remediation plan:** [TR05-remediation-plan.md](./TR05-remediation-plan.md)

---

## Acceptance criteria (TR05 § Acceptance criteria)

| # | Criterion | Code | Sign-off |
|---|-----------|------|----------|
| 1 | Planner sees full event itinerary list and map (when coords present) ordered correctly | [x] | [ ] manual map + legs on dev-db |
| 2 | Participant sees **only** rows assigned to them; no other participants’ logistics | [x] | [ ] manual two-participant RLS |
| 3 | Day visitor sees explanatory state — not silent empty | [x] | [ ] manual day visitor |
| 4 | No mutation of logistics or assignments on this route | [x] | [x] read-only hooks |
| 5 | Timezone disclaimer or per-row timezone display | [x] | [x] |
| 6 | Multi-day rows follow day-entry and in-day ordering rules | [x] | [x] CR25 tests |
| 7 | TRAC consumes shared CR25 helper; no local derivation | [x] | [x] |

**Summary:** All seven acceptance criteria are **implemented in application code**. Full **sign-off** depends on P0 manual verification and P1 dev-db MCP record in the remediation plan.

---

## Rebuild target (TR05 § Rebuild target)

| Item | Status | Evidence |
|------|--------|----------|
| Planner: full event itinerary + map legs + planning/assignments links | [x] | [`ItineraryContent.tsx`](../../src/features/itinerary/ItineraryContent.tsx), [`ItineraryMapPanel.tsx`](../../src/features/itinerary/components/ItineraryMapPanel.tsx) |
| Participant: assigned logistics only (Option A + CR25 scope) | [x] | [`useItineraryViewModel.ts`](../../src/features/itinerary/hooks/useItineraryViewModel.ts) |
| Portal-hosted entry | N/A | Out of TRAC scope (F-05-10) |
| Route guard `itinerary` | [x] | [`ItineraryPage.tsx`](../../src/app/pages/ItineraryPage.tsx) |
| Participant labels (“Your transport”, etc.) | [x] | [`ItineraryEntryRow.tsx`](../../src/features/itinerary/components/ItineraryEntryRow.tsx) |
| Day visitor messaging | [x] | [`ItineraryDayVisitorState.tsx`](../../src/features/itinerary/components/ItineraryDayVisitorState.tsx) |
| Map: snapshot coords; no live Places | [x] | [`collect-map-points.ts`](../../src/features/itinerary/collect-map-points.ts) |
| CR25 day-entry, timezone precedence, in-day order | [x] | [`build-itinerary-model.ts`](../../src/features/itinerary/build-itinerary-model.ts) |
| Dual role: single `/itinerary` with tabs | [x] | [`ItineraryContent.tsx`](../../src/features/itinerary/ItineraryContent.tsx) |
| Same-day accommodation: one entry, both check-in/out details | [x] | [`ItineraryEntryRow.tsx`](../../src/features/itinerary/components/ItineraryEntryRow.tsx) + display metadata |
| Loading / empty / denied per role | [x] | Spinner, timeline empty, `AccessDenied`, day visitor |
| Viewer `base_application` applicant-only | [x] | [`useViewerApplication.ts`](../../src/features/itinerary/hooks/useViewerApplication.ts) |
| Deep links Planning ↔ Assignments | [x] | [`ItineraryEntryRow.tsx`](../../src/features/itinerary/components/ItineraryEntryRow.tsx) — assignments `kind`+`resourceId`; planning `?kind=` |

---

## Feature list (trac-feature-list §6)

| ID | Feature | Status |
|----|---------|--------|
| F-05-01 | Planner full event itinerary (CR25 ordering) | [x] |
| F-05-02 | Map with legs; snapshot coords; empty state | [x] |
| F-05-03 | Participant assigned-only (Option A) | [x] code; [ ] manual RLS |
| F-05-04 | Day visitor explicit message | [x] |
| F-05-05 | Dual role single route / tabs | [x] |
| F-05-06 | No mutations on route | [x] |
| F-05-07 | Timezone disclaimer / per-row TZ | [x] |
| F-05-08 | Option A assumed; verify dev-db | [ ] P1 MCP |
| F-05-09 | CR25 shared derivation | [x] |
| F-05-10 | Portal surface (no TRAC route) | N/A |
| F-05-11 | CR25 not security/RBAC layer | [x] |

---

## Route and navigation

| Item | Status |
|------|--------|
| `/itinerary` route | [x] [`authenticated-routes.tsx`](../../src/app/routes/authenticated-routes.tsx) |
| `PagePermissionGuard` `pageName="itinerary"` | [x] |
| Nav registration | [x] [`trac-nav.ts`](../../src/app/navigation/trac-nav.ts) |
| Invalidation `trac-itinerary` prefix | [x] planning + assignments |

---

## Testing requirements (TR05 § Testing requirements)

| # | Scenario | Type | Status | Evidence |
|---|----------|------|--------|----------|
| 1 | Participant happy path + CR25 | Integration | [x] | [`itinerary.integration.test.tsx`](../../src/features/itinerary/itinerary.integration.test.tsx) |
| 2 | Validation failure graceful | Unit + RTL | [x] | [`build-itinerary-model.test.ts`](../../src/features/itinerary/build-itinerary-model.test.ts), [`ItineraryContent.validation.test.tsx`](../../src/features/itinerary/ItineraryContent.validation.test.tsx) |
| 3 | Auth denied + RLS roles named | Integration | [x] | Same integration file |
| — | Timezone precedence + in-day order | Unit | [x] | [`build-itinerary-model.test.ts`](../../src/features/itinerary/build-itinerary-model.test.ts) |
| — | CR25 parity fixtures | Unit | [x] | [`itinerary-fixtures.ts`](../../src/features/itinerary/itinerary-fixtures.ts) |
| — | Nav + route permissions | Unit | [x] | [`trac-nav.test.ts`](../../src/app/navigation/trac-nav.test.ts) |
| — | Page shell | Unit | [x] | [`ItineraryPage.test.tsx`](../../src/app/pages/ItineraryPage.test.tsx) |

---

## Manual verification checklist (TR05 § Verification)

| Check | Status |
|-------|--------|
| `itinerary` page key on dev-db | [ ] P1 |
| RLS: two participants — isolation | [ ] P0 |
| Map empty state when no coordinates | [ ] P0 |
| Shared-helper parity | [x] unit fixtures |

---

## Explicit exclusions (TR05 § Do not)

| Rule | Status |
|------|--------|
| No SLICE-03/04 mutations on `/itinerary` | [x] |
| No local CR25 re-implementation | [x] |
| No live `trac_location_cache` display | [x] |
| No other participants’ assignment details | [x] |
