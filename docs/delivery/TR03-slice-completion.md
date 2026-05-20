# SLICE-03 — Planning (logistics) — Completion record

**Authority:** [TR03-planning-logistics-requirements.md](../requirements/TR03-planning-logistics-requirements.md)  
**Completed (implementation):** 2026-05-20  
**Sign-off:** Pending manual dev-db verification (see below)  
**Quality gate:** `npm run validate` — PASS (6/6)  
**Remediation plan:** [TR03-remediation-plan.md](./TR03-remediation-plan.md)

---

## Acceptance criteria (TR03 § Acceptance criteria)

| # | Criterion | Status | Evidence / notes |
|---|-----------|--------|------------------|
| 1 | Planner CRUD transport / accommodation / activity for active event | **Complete** (code) | Three tabs, list + dialog CRUD on `trac_*` tables scoped by `event_id` / `organisation_id` via [useLogisticsMutations.ts](../../src/features/planning/hooks/useLogisticsMutations.ts). **Manual:** dev-db round-trip per type. |
| 2 | `trac_status` and `transport_mode` enums enforced; invalid rejected client- and server-side | **Complete** (client) / **Assumed** (server) | Zod + [enums.ts](../../src/features/planning/enums.ts); Form `schema` on dialogs. Server relies on Postgres enums + RLS (not exercised in automated tests). |
| 3 | Nullable capacity = uncapped; positive integer when set | **Complete** | [validation.ts](../../src/features/planning/validation.ts) `capacitySchema`; list copy “uncapped”. |
| 4 | Location snapshots on row; cache write path on save | **Complete** | [build-payloads.ts](../../src/features/planning/build-payloads.ts) + [location-snapshot.ts](../../src/features/planning/location-snapshot.ts); [writeLocationCacheBestEffort](../../src/features/planning/location-cache.ts) after mutation. Lists display row snapshot fields only. |
| 5 | No `trac_itinerary_assignment` mutations on `/planning` | **Complete** | No references in `src/`; completion grep clean. |
| 6 | Users without planning write cannot mutate logistics | **Complete** (writes) | `PagePermissionGuard` + shell `read:page.planning`; `usePageCan('planning', create\|update\|delete)` disables Save/Delete/Add. **Polish gap:** Edit still opens dialog for read-only users (Save disabled) — see remediation. |
| 7 | Supporting documents via secure file lifecycle; failures explicit | **Complete** (code) | `core_file_references` + `FileUpload` + explicit upload/delete `Alert`s in [PlanningAttachmentsSection.tsx](../../src/features/planning/components/PlanningAttachmentsSection.tsx). **Manual:** upload/delete on dev-db. |
| 8 | Mutations invalidate planning + downstream reads (no delays/events) | **Complete** | [invalidation.ts](../../src/features/planning/invalidation.ts); no `dispatchEvent` / artificial delays. **Gap:** no automated test of invalidation keys. |

**Summary:** All eight acceptance criteria are **implemented in code**. Full **sign-off** depends on manual dev-db verification and remediation items in [TR03-remediation-plan.md](./TR03-remediation-plan.md).

---

## Rebuild target (TR03 § Rebuild target)

| Item | Status | Notes |
|------|--------|-------|
| Tabs: transport, accommodation, activity — list + CRUD | **Complete** | [PlanningPage.tsx](../../src/app/pages/PlanningPage.tsx) |
| Enums `trac_status`, `transport_mode`; default `idea` | **Complete** | Dialog defaults; Zod default `idea` |
| Capacity on all three resource types | **Complete** | Shared [PlanningFormFields.tsx](../../src/features/planning/components/PlanningFormFields.tsx) |
| Capacity utilisation hints from assignments | **Deferred (optional)** | Explicitly optional in requirements; SLICE-04 |
| `group_cost` + `individual_cost` (primary + secondary) | **Complete** | Checkbox reveals secondary cost field |
| Supporting documents (pace-core2 lifecycle) | **Complete** | `FileUpload` + `core_file_references`; no TRAC attachment table |
| Location snapshots + best-effort cache write | **Complete** | DEC-083 copy on page; edge `google-*` via [useGoogleMapsRuntime.ts](../../src/features/planning/hooks/useGoogleMapsRuntime.ts) |
| No live cache join as display SoT | **Complete** | Lists use `*_display_name` / `*_short_address` on rows |
| Product copy: point-in-time snapshots | **Complete** | Page `<p>` explainer |
| RBAC `planning` page key | **Complete** | `pageName="planning"`; nav `pageId: 'planning'` |
| Loading, empty, validation, permission denied | **Complete** | Spinners, empty copy, Zod + `Alert`, `AccessDenied` at shell |
| No assignment CRUD on route | **Complete** | — |
| No BASE scanning UX | **Complete** | No BASE references in feature module |
| Desktop/mobile collapse | **Not verified** | Relies on pace-core layout; manual responsive pass recommended |

---

## Explicit exclusions (TR03 § Do not)

| Rule | Status |
|------|--------|
| No `trac_itinerary_assignment` mutations on `/planning` | **Met** |
| No `trac_location_cache` as live display SoT | **Met** |
| No production DB for validation | **Met** (tests mock / local only) |
| No BASE scanning/boarding flows | **Met** |

---

## Testing requirements (TR03 § Testing requirements)

| # | Scenario | Type | Status | Evidence |
|---|----------|------|--------|----------|
| 1 | Happy path: transport with enums, capacity, snapshots | Integration | **Complete** | [planning-mutations.integration.test.tsx](../../src/features/planning/planning-mutations.integration.test.tsx) |
| 2 | Validation failure: invalid status / capacity | Unit / integration | **Complete** | Same file + [validation.test.ts](../../src/features/planning/validation.test.ts) |
| 3 | Auth / permission: no planning write cannot save | Integration | **Partial** | Mock `usePageCan` only; no rendered dialog/guard test — remediation |
| — | Unit: enum guards, snapshot merge | Unit | **Complete** | [enums.test.ts](../../src/features/planning/enums.test.ts), [location-snapshot.test.ts](../../src/features/planning/location-snapshot.test.ts) |
| — | Page shell: tabs + snapshot copy | Unit | **Complete** | [PlanningPage.test.tsx](../../src/app/pages/PlanningPage.test.tsx) |
| — | Nav registration `/planning` | Unit | **Complete** | [trac-nav.test.ts](../../src/app/navigation/trac-nav.test.ts) |

---

## Prerequisites (TR03 § Data and schema references)

| Prerequisite | Status | Notes |
|--------------|--------|-------|
| Supabase MCP dev-db: columns, enums, RLS before implementation | **Not recorded** | Enums aligned with comments in [enums.ts](../../src/features/planning/enums.ts); no MCP audit artifact in repo. **Remediation:** document dev-db confirmation (see remediation plan). |
| Edge function names (`google-api-key`, `google-timezone`, `google-maps-script`) | **Complete** | [useGoogleMapsRuntime.ts](../../src/features/planning/hooks/useGoogleMapsRuntime.ts) |
| `read:page.planning` in dev-db | **Assumed** | Matches TR01/backend-ready; confirm on manual pass |

---

## Routes and navigation

| Item | Path / detail |
|------|----------------|
| Route | `/planning` in [authenticated-routes.tsx](../../src/app/routes/authenticated-routes.tsx) |
| Page | [PlanningPage.tsx](../../src/app/pages/PlanningPage.tsx) |
| Nav | `/planning` in [trac-nav.ts](../../src/app/navigation/trac-nav.ts) `SLICE_01_REGISTERED_ROUTE_PATHS` |
| RBAC read | `read:page.planning` via [trac-route-permissions.ts](../../src/app/navigation/trac-route-permissions.ts) |
| RBAC writes | `usePageCan('planning', 'create' \| 'update' \| 'delete')` in lists/dialogs |

---

## Feature module

Primary code under [src/features/planning/](../../src/features/planning/):

- Enums, Zod validation, location snapshot helpers, query keys, invalidation
- Hooks: scope, lists, mutations, attachments, Google Maps runtime
- Components: three tab lists, dialogs, place picker, attachments, status badge
- No assignment CRUD; no live cache join for list display

---

## Automated verification

| Check | Result |
|-------|--------|
| `npm run validate` | PASS (6/6) |
| Unit / integration tests | 37 passed (planning + nav + PlanningPage) |
| pace-core audit | PASS |

---

## Manual verification (sign-off)

Record when exercising against dev-db with valid `.env`:

- [ ] Planner creates/edits/deletes each resource type (transport, accommodation, activity)
- [ ] Invalid status/capacity rejected in UI before save
- [ ] User without `planning` create/update/delete cannot save (RLS + disabled Save)
- [ ] User without `read:page.planning` cannot access route (shell `AccessDenied`)
- [ ] Snapshot address unchanged when cache row updates externally until re-save
- [ ] Attachments upload and delete; errors shown on storage/reference failure
- [ ] Place picker + edge functions load (or manual fallback label path)
- [ ] `rbac_app_pages` includes `planning` with expected operations (dev-db)

---

## Gaps and remediation

See **[TR03-remediation-plan.md](./TR03-remediation-plan.md)** for prioritized follow-up (tests, UX polish, dev-db MCP record, manual sign-off).

---

## Ready for downstream slices

SLICE-04 (assignments), SLICE-05 (itinerary), SLICE-02/07/10 composites may consume logistics data and shared query prefixes (`trac-itinerary`, `trac-costs`, `trac-dashboard`, `trac-masterplan`).

**Queue status:** SLICE-03 marked **built** in [trac-build-queue.md](./trac-build-queue.md) with remediation tracked separately until manual sign-off.
