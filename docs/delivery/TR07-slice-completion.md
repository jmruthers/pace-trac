# SLICE-07 — Costs & currency — Completion record

**Authority:** [TR07-costs-and-currency-requirements.md](../requirements/TR07-costs-and-currency-requirements.md)  
**Completed (implementation):** 2026-05-21  
**Remediation (compliance):** 2026-05-21 — participant table, tests, expanded delivery docs  
**Sign-off:** Pending manual dev-db SQL cross-check (see [TR07-remediation-plan.md](./TR07-remediation-plan.md))  
**Quality gate:** `npm run validate` — PASS (6/6)

---

## Acceptance criteria (TR07 § Acceptance criteria)

| # | Criterion | Code | Tests | Sign-off |
|---|-----------|------|-------|----------|
| 1 | Totals match manual calculation using shared rounding helper (line-level round then sum, minor units) | [x] | [x] unit | [ ] manual dev-db |
| 2 | Currency display uses **event base currency** metadata | [x] | [x] unit | [ ] manual dev-db |
| 3 | `/currency-rates` secured via page-guard + secure client; rate edits validated; `/costs` read/aggregate | [x] | [x] | [ ] manual RLS |
| 4 | Per-participant R2 + row totals; NULL/zero/`assigned_count=0` handling | [x] | [x] unit | [x] UI + unit |
| 5 | Exported/shared rollup for SLICE-02 and SLICE-10 (no copy-paste) | [x] | [x] consumer smoke | [x] export; SLICE-10 consumes `useCostRollupData`; SLICE-02 pending |

**Summary:** All five acceptance criteria are **implemented in application code**. AC1–3 **sign-off** depends on manual dev-db verification (P0 in remediation plan). AC5 consumption by Dashboard/Master Plan is **deferred to SLICE-02/10** (export contract satisfied for TR07).

---

## Rebuild target (TR07 § Rebuild target)

| Item | Status | Evidence |
|------|--------|----------|
| Totals from `trac_transport`, `trac_accommodation`, `trac_activity` only | [x] | [`useCostRollupData.ts`](../../src/features/costs/hooks/useCostRollupData.ts) — `LOGISTICS_KINDS` |
| `/currency-rates` CRUD; RBAC `currency-rates` page key | [x] | [`CurrencyRatesContent.tsx`](../../src/features/costs/CurrencyRatesContent.tsx), [`useCurrencyRates.ts`](../../src/features/costs/hooks/useCurrencyRates.ts) |
| Manual rate edits only (no publish workflow) | [x] | DataTable CRUD |
| R2: `individual_cost + group_cost/assigned_count` per assignment | [x] | [`cost-rollup.ts`](../../src/features/costs/cost-rollup.ts) |
| Row event total: `group_cost + individual_cost * assigned_count` | [x] | `computeRowEventTotalNative` |
| NULL costs → 0 | [x] | `normalizeCost` + tests |
| `assigned_count = 0`: group_cost only; no per-person share | [x] | tests + breakdown `hasUnallocatedGroupCost` |
| Both `group_cost` and `individual_cost` on same row (no mutual exclusion) | [x] | Rollup accepts both fields |
| Line-level rounding then sum; minor-unit precision | [x] | `roundLineInBase` + tests |
| Base currency from metadata; no hard-coded currency strings | [x] | `useBaseCurrency` RPC + `formatCostAmount` |
| No MINT API coupling | [x] | DB reads only |
| Unallocated group cost indicator (may) | [x] | Breakdown table column |

---

## pace-core2 imports (TR07 § pace-core2 imports)

| Need | Status | Notes |
|------|--------|-------|
| RBAC — `PagePermissionGuard` | [x] | [`CostsPage.tsx`](../../src/app/pages/CostsPage.tsx), [`CurrencyRatesPage.tsx`](../../src/app/pages/CurrencyRatesPage.tsx) |
| Components | [x] | `Card`, `DataTable`, `Alert`, `LoadingSpinner` |
| Providers | [x] | App shell / `useEvents` / `useResolvedScope` via existing bootstrap |
| Utils — `formatCurrency` | [x] | [`currency-format.ts`](../../src/features/costs/currency-format.ts) wraps `@solvera/pace-core/utils` |

---

## API / Contract (TR07 § API / Contract)

| Rule | Status | Evidence |
|------|--------|----------|
| Reads: logistics + rates + event metadata via secure client | [x] | [`useCostRollupData.ts`](../../src/features/costs/hooks/useCostRollupData.ts), [`useCurrencyRates.ts`](../../src/features/costs/hooks/useCurrencyRates.ts) |
| Writes: rates only on `/currency-rates` | [x] | `useResourcePermissions('currency-rates')` |
| Logistics cost writes belong to SLICE-03 | [x] | `/costs` read-only |
| Single source for cost input on rows (SLICE-03) | [x] | Planning forms own writes; costs aggregates |

---

## Visual specification (TR07 § Visual specification)

| Item | Status | Notes |
|------|--------|-------|
| `/costs`: summary header with total and per-participant | [x] | [`CostsSummary.tsx`](../../src/features/costs/components/CostsSummary.tsx) + [`CostsParticipantTable.tsx`](../../src/features/costs/components/CostsParticipantTable.tsx) |
| Secondary table (breakdown by logistics row) | [x] | [`CostsBreakdownTable.tsx`](../../src/features/costs/components/CostsBreakdownTable.tsx) |
| `/currency-rates`: rates management table, RBAC-gated | [x] | [`CurrencyRatesContent.tsx`](../../src/features/costs/CurrencyRatesContent.tsx) |
| Mobile: totals readable; tables stack | [x] | `sm:grid-cols-2` summary grid; DataTable pagination |
| Conversion status visible | [x] | Breakdown “Conversion” column |
| Charts | [~] | **Not required** — table satisfies v1 spec |

---

## Testing requirements (TR07 § Testing requirements)

| # | Scenario | Type | Status | Evidence |
|---|----------|------|--------|----------|
| 1 | Happy path: rates + logistics → correct total and per-participant | Integration + unit | [x] | [`cost-rollup.test.ts`](../../src/features/costs/cost-rollup.test.ts), [`costs.integration.test.tsx`](../../src/features/costs/costs.integration.test.tsx) |
| 2 | Validation failure: invalid rate input rejected | Integration | [x] | [`currency-rate-schema.test.ts`](../../src/features/costs/currency-rate-schema.test.ts), [`currency-rates.integration.test.tsx`](../../src/features/costs/currency-rates.integration.test.tsx) |
| 3 | Auth: user without costs read sees denial | Integration | [x] | [`costs.integration.test.tsx`](../../src/features/costs/costs.integration.test.tsx) |
| 3b | Auth: user without currency-rates read sees denial | Integration | [x] | [`currency-rates-page.integration.test.tsx`](../../src/features/costs/currency-rates-page.integration.test.tsx) |
| — | Unit: conversion, round-then-sum, 0/2/3 decimals, rollup fixtures | Unit | [x] | `cost-rollup.test.ts`, `currency-format.test.ts` |
| — | Consumer export smoke | Unit | [x] | [`consumer-export.test.ts`](../../src/features/costs/consumer-export.test.ts) |

---

## Verification (TR07 § Verification)

| Check | Status |
|-------|--------|
| Cross-check totals vs SQL on dev-db | [ ] P0 — see [TR07-remediation-plan.md](./TR07-remediation-plan.md) |
| Dashboard/Master Plan consume same helper | [x] Master Plan — `useCostRollupData`; [ ] SLICE-02 dashboard pending |

---

## Feature list F-07-01 … F-07-08

| ID | Status | Evidence |
|----|--------|----------|
| F-07-01 | [x] | Three logistics tables in rollup hook |
| F-07-02 | [x] | `/currency-rates` + `trac_currency_rates` |
| F-07-03 | [x] | R2 in `cost-rollup.ts` + participant table |
| F-07-04 | [x] | NULL/zero/`assigned_count=0` tests |
| F-07-05 | [x] | `formatCostAmount` + base currency RPC |
| F-07-06 | [x] export / [x] SLICE-10 consume | [`useCostRollupData`](../../src/features/costs/hooks/useCostRollupData.ts) on `/masterplan`; SLICE-02 pending |
| F-07-07 | [x] | No MINT integration |
| F-07-08 | [x] | Line-level round-then-sum tests |

---

## Explicit exclusions (TR07 § Do not)

| Rule | Status |
|------|--------|
| No hard-coded currency strings in app code | [x] |
| No MINT API integration | [x] |
| No duplicate rollup logic outside `src/features/costs/` | [x] |

---

## Routes and navigation

| Item | Path / detail |
|------|----------------|
| Routes | `/costs`, `/currency-rates` in [authenticated-routes.tsx](../../src/app/routes/authenticated-routes.tsx) |
| Primary nav | `/costs` in [trac-nav.ts](../../src/app/navigation/trac-nav.ts) |
| Secondary route | `/currency-rates` in [trac-route-permissions.ts](../../src/app/navigation/trac-route-permissions.ts) |
| RBAC read | `costs`, `currency-rates` page keys |

---

## Shared module

| Path | Role |
|------|------|
| [cost-rollup.ts](../../src/features/costs/cost-rollup.ts) | R2 maths, conversion, line-level round-then-sum |
| [currency-format.ts](../../src/features/costs/currency-format.ts) | Minor units, `formatCostAmount` |
| [index.ts](../../src/features/costs/index.ts) | Public exports for SLICE-02 / SLICE-10 |

**Conversion direction:** foreign amount × `exchange_rate` → base currency (confirm on dev-db sign-off).

---

## Invalidation

Planning mutations invalidate `TRAC_COSTS_QUERY_PREFIX` via [invalidation.ts](../../src/features/planning/invalidation.ts) (from [cost-query-keys.ts](../../src/features/costs/cost-query-keys.ts)).

---

## Automated verification

| Check | Result |
|-------|--------|
| `npm run validate` | PASS (6/6) — 2026-05-21 post-remediation |
| Unit / integration tests | 140 passed (49 files) |
