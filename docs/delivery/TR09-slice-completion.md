# SLICE-09 — Risks — Completion record

**Authority:** [TR09-risks-requirements.md](../requirements/TR09-risks-requirements.md)  
**Completed (code):** 2026-05-20  
**Quality gate:** `npm run validate` — PASS (6/6)  
**Remediation:** [TR09-remediation-plan.md](./TR09-remediation-plan.md) (open until manual dev-db + print sign-off)

---

## Acceptance criteria (TR09 § Acceptance criteria)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | User can manage risks with valid enum values; impacts **display** from generated columns after save | **Complete** (code) | `use-risks.ts` CRUD; `RiskDialog` + enums; list columns + `RiskImpactDisplay`; integration happy path |
| 2 | PATCH impact columns **fail or are ignored** — client must not send them | **Complete** (code) | `toRiskWritePayload` / `assertNoGeneratedImpactKeys`; `build-risk-payload.test.ts`; `risks.integration.test.tsx` insert assertion |
| 3 | Contact linkage works with contacts from SLICE-06 | **Complete** (code) | `ResponsibleContactSelect` → `responsible_contact_id`; picker uses `tracContactsQueryKey(eventId)` |
| 4 | Print action completes without throw; print layout is readable | **Complete** (code) | `window.print()` in `RisksContent`; `usePaceMain` print metadata; pace-core `core.css` `@media print` hides shell chrome; **manual** print preview — remediation |
| 5 | RLS enforced for risks page | **Complete** (code) | `PagePermissionGuard pageName="risks"`; `useResourcePermissions('risks')`; DataTable `rbac`; integration AccessDenied test |

---

## Rebuild target (TR09 § Rebuild target)

| Item | Status | Evidence |
|------|--------|----------|
| List/create/edit/delete risks (subject to RLS) | **Complete** | `RisksContent` DataTable + `RiskDialog`; `use-risks.ts` mutations |
| Inputs: likelihood, consequence (before/after), mitigations, status enums per dev-db | **Complete** | `risk-schema.ts`; enum modules under `src/features/risks/enums/` |
| Display: generated impacts from DB reads only | **Complete** | `select('*')`; `format-risk-impact.ts`; no impact keys in write payload |
| Contacts: attach via FK | **Complete** | `trac_risks.responsible_contact_id` + SLICE-06 picker |
| Print: button + hide nav/chrome for print | **Complete** (code) | Print button; `print:hidden` on toolbar; shell print CSS |
| Empty / loading / permission states | **Complete** | Empty copy; `isLoading`; `Alert`; `PagePermissionGuard` |

**Sub-phases:** CRUD + generated impact display — **done**. Print stylesheet — **done** (shell + page metadata; see remediation for page-break polish).

---

## pace-core2 delta (TR09 § pace-core2 delta)

| Area | Rebuild target | Status |
|------|----------------|--------|
| Impact | Generated only | **Met** — DEC-081 |
| Contacts | SLICE-06 IDs | **Met** |
| UI | pace-core2 | **Met** — `DataTable`, `Dialog`, `Form`, `PagePermissionGuard` |

---

## pace-core2 imports (TR09 § pace-core2 imports)

| Need | Expected | Actual | Status |
|------|----------|--------|--------|
| RBAC | `@solvera/pace-core/rbac` | `PagePermissionGuard`, `useResourcePermissions`, `useSecureSupabase`, `usePageCan` | **Met** |
| Components / forms | `@solvera/pace-core/components`, `@solvera/pace-core/forms` | `Form` / `FormField` from **components** (same pattern as Journal); Zod via `@solvera/pace-core/utils` | **Met** (functional); forms subpath not imported — see remediation P4 |
| Providers | `@solvera/pace-core/providers` | Inherited via app shell (`useEvents`, layout) | **Met** |

---

## API / contract (TR09 § API / Contract)

| Item | Status | Evidence |
|------|--------|----------|
| INSERT/UPDATE/DELETE on `trac_risks` via secure client | **Complete** | `risksTable(secureSupabase)` |
| Omit generated fields on write | **Complete** | `toRiskWritePayload` |
| Reads return generated impacts | **Complete** | `impact_before` / `impact_after` on row type + display |
| Contact IDs reference event contacts | **Complete** | Picker lists event-scoped contacts only; invalid UUID blocked in schema; FK/RLS on dev-db |

---

## Visual specification (TR09 § Visual specification)

| Item | Status | Notes |
|------|--------|-------|
| Table register (kanban optional) | **Complete** | `DataTable` on `/risks` |
| Detail panel with L/C controls + read-only impact (visually distinct) | **Complete** | `RiskDialog` (modal detail); `RiskImpactDisplay` bordered/`bg-sec-50` + `<output>` |
| Print: hide side nav | **Complete** | pace-core shell print rules |
| Print: page breaks | **Complete** | `print:break-inside-avoid` on register `Card`; `RisksContent.test.tsx` |

---

## Prerequisites (TR09 § Data and schema references)

| Prerequisite | Status | Notes |
|--------------|--------|-------|
| Supabase MCP dev-db: `trac_risks` generated columns + enums | **Recorded** | See § Dev-db validation below |
| `responsible_contact_id` → `trac_contacts` | **Confirmed** | FK per backend-ready report; SLICE-06 contract |

### Dev-db validation (MCP, 2026-05-20)

Project `yihzsfcceciimdoiibif` (dev-db):

- **Generated columns:** `impact_before`, `impact_after` — `GENERATED ALWAYS` as `(risk_likelihood_rank(likelihood_*) * risk_consequence_rank(consequence_*))`.
- **Writable columns used by app:** `type`, `risk`, `likelihood_before`, `consequence_before`, `control`, `responsible_contact_id`, `when`, `status`, `comment`, `likelihood_after`, `response`, plus scope `event_id` / `organisation_id` on insert.
- **Enums aligned in code:** `risk_type`, `risk_likelihood`, `risk_consequence`, `risk_when`, `risk_status` — see `src/features/risks/enums/*`.

---

## Verification (TR09 § Verification)

| Check | Status | Evidence |
|-------|--------|----------|
| dev-db: update likelihood → impact changes read-only | **Code complete** | Generated columns; refetch after save — **manual** sign-off |
| Print smoke in browser | **Code complete** | `window.print()` — **manual** sign-off |

---

## Testing requirements (TR09 § Testing requirements)

| # | Scenario | Type | Status | Evidence |
|---|----------|------|--------|----------|
| 1 | Happy path: create risk with L/C; generated impact on refetch | Integration | **Complete** | [risks.integration.test.tsx](../../src/features/risks/risks.integration.test.tsx) |
| 2 | Validation failure: invalid enum rejected | Integration | **Complete** | [risk-schema.test.ts](../../src/features/risks/risk-schema.test.ts) + integration |
| 3 | Auth / permission: no risks permission — AccessDenied | Integration | **Complete** | [risks.integration.test.tsx](../../src/features/risks/risks.integration.test.tsx) |
| — | Unit: impact display formatting | Unit | **Complete** | [format-risk-impact.test.ts](../../src/features/risks/format-risk-impact.test.ts) |

Additional: [build-risk-payload.test.ts](../../src/features/risks/build-risk-payload.test.ts), [enums.test.ts](../../src/features/risks/enums.test.ts), [RisksContent.test.tsx](../../src/features/risks/RisksContent.test.tsx) (print smoke), nav/route tests.

---

## Explicit exclusions (TR09 § Do not)

| Rule | Status |
|------|--------|
| Do not write `impact_before` / `impact_after` | **Met** |
| Do not use production DB | **Met** (tests mock / dev-db manual only) |
| Do not invent contact linkage shape | **Met** — `responsible_contact_id` per schema |

---

## Routes delivered (SLICE-09 ownership)

| Route | Behaviour |
|-------|-----------|
| `/risks` | `RisksPage` → `PagePermissionGuard` → `RisksContent` |

Registered in [`TRAC_REGISTERED_ROUTE_PATHS`](../../src/app/navigation/trac-nav.ts).

---

## Automated verification

| Check | Result |
|-------|--------|
| `npm run validate` | PASS (6/6) |
| Tests (risks slice) | 11+ in `src/features/risks/**` (101 total suite) |
| pace-core audit | PASS |

---

## Manual verification (sign-off)

**Automated sign-off (2026-05-20):** Items marked `[x]` where covered by tests/code; live dev-db + print preview still recommended before release.

- [x] `/risks` route and Risks nav enabled — `authenticated-routes`, `trac-nav.test.ts`
- [ ] Create/edit/delete risk on **dev-db** with planner role; RLS respected
- [ ] Change `likelihood_before` / `consequence_before`; confirm `impact_before` updates on refetch only (not editable in form)
- [ ] Assign `responsible_contact_id` from contacts list; invalid contact rejected by DB if forced
- [ ] Print preview: no JS error; header/nav hidden; table readable
- [x] User without `read:page.risks` sees AccessDenied — integration test

---

## SLICE-06 integration

- `ResponsibleContactSelect` for `responsible_contact_id`
- `tracRisksQueryKey` invalidation on risk mutations
- Contact delete FK message when risk links exist (SLICE-06)

---

## Ready for downstream slices

SLICE-09 is **built** in code. **Sign-off:** complete [TR09-remediation-plan.md](./TR09-remediation-plan.md) P0–P1 before release. SLICE-10 (Master Plan) may add complementary print surfaces per architecture.
