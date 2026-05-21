# SLICE-10 — Master Plan — Remediation plan

**Authority:** [TR10-master-plan-requirements.md](../requirements/TR10-master-plan-requirements.md)  
**Completion record:** [TR10-slice-completion.md](./TR10-slice-completion.md)  
**Created:** 2026-05-21

Implementation satisfies TR10 acceptance criteria and automated testing in code. The items below close **manual sign-off** and document **compliance fixes** applied after the initial SLICE-10 build.

---

## Priority overview

| Priority | Item | Blocks sign-off? | Status |
|----------|------|------------------|--------|
| P1 | Section order vs architecture (map → contacts → costs → itinerary) | No (code) | **Done** — `MasterPlanContent.tsx` |
| P2 | Hide “Manage currency rates” link on Master Plan print/summary | No (code) | **Done** — `CostsSummary` prop |
| P1 | Delivery docs + build queue | No (code) | **Done** — this file + completion record |
| P0 | Manual dev-db walkthrough + RBAC | Yes (product sign-off) | Open |
| P0 | Manual print smoke | Yes (TR10 § Verification) | Open |
| P0 | Cost parity vs `/costs` on one event | Yes (AC3 sign-off) | Open |

**No P0 code blockers** — backend gate PASS; `npm run validate` PASS.

---

## P0 — Manual dev-db verification

**Goal:** Satisfy TR10 § Verification and acceptance criteria 1, 3; confirm `masterplan` page key.

**Steps:**

1. Configure `.env` for **dev** Supabase (not production).
2. Confirm `masterplan` exists in `rbac_app_pages` and role has `read:page.masterplan`.
3. Select an event with transport coords, contacts, logistics costs, and itinerary data.
4. Open `/masterplan` and verify all sections load with real data.
5. Compare event total on Master Plan **Costs** section vs `/costs` for the same event.
6. Sign in **without** `read:page.masterplan`: confirm `AccessDenied` on `/masterplan`.
7. Tick checklist in [TR10-slice-completion.md](./TR10-slice-completion.md) § Manual verification.

**Owner:** Human QA / planner on dev-db.

---

## P0 — Manual print smoke

**Goal:** Satisfy TR10 § Verification and AC2.

**Steps:**

1. On `/masterplan` with content loaded, click **Print**.
2. Confirm no console error / thrown exception.
3. In print preview: shell header/nav subdued or hidden per pace-core `@media print`; Print button hidden; sections readable; `--print-title` / `--print-event-name` in page margins.
4. Confirm “Manage currency rates” link does **not** appear in printed cost summary (Master Plan uses `showCurrencyManagementLink={false}`).
5. Tick print items in completion record manual checklist.

**Owner:** Human QA.

---

## P1 — Code compliance (completed)

### Section order

**Was:** map → costs → contacts → itinerary.  
**Now:** map → contacts → costs → itinerary per [trac-architecture.md](../requirements/trac-architecture.md) § Master Plan.

### Print-friendly costs

**Was:** Reused `CostsSummary` with link to `/currency-rates`.  
**Now:** `showCurrencyManagementLink={false}` from [`MasterPlanCostSummary`](../../src/features/master-plan/components/MasterPlanCostSummary.tsx).

---

## P4 — Optional follow-up (not blocking)

| Item | Notes |
|------|-------|
| Duplicate h2 “Journey map” / “Map” | `ItineraryMapPanel` inner heading; low severity |
| `window.print` unit smoke test | TR09 pattern; optional for TR10 |
| `print:hidden` on itinerary deep links | Cross-cutting `ItineraryEntryRow` polish |

---

## Sign-off criteria

Treat SLICE-10 as **fully signed off** when:

1. P0 manual checklist in [TR10-slice-completion.md](./TR10-slice-completion.md) is complete.
2. `npm run validate` remains PASS.
3. Build queue Evidence § SLICE-10 notes sign-off date (optional).
