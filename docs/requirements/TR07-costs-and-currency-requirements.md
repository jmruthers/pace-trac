# SLICE-07 — Costs & currency — Requirements

**Document status:** Draft — rebuild implementation contract.  
**Companion authority:** `trac-project-brief.md`, `trac-architecture.md`.

---

## Orchestration metadata (canonical)

| Field | Value |
|--------|--------|
| **Slice ID** | SLICE-07 |
| **Name** | Costs |
| **Bounded context** | Costs & currency |
| **Owning routes** | `/costs`, `/currency-rates` |
| **Depends on** | SLICE-01, SLICE-03, **SLICE-04** (participant-aware rollups where required) |
| **Blocks** | SLICE-02 (dashboard costs card), SLICE-10 (Master Plan costs) |
| **Implementation order** | 6 of 10 |
| **High-risk** | Medium — currency edge cases, assignment-aware maths |
| **Cross-cutting** | **MINT** reads cost-related data from DB only — **no** TRAC↔MINT integration in this phase |

---

## Overview

Deliver **`/costs`** and **`/currency-rates`**: event **cost totals** from the three logistics domains only, **currency conversion** via **`trac_currency_rates`**, **separate RBAC-controlled rates management**, and **per-participant** (or assignment-aware) rollups aligned to schema. **Event base currency** drives display — **no hard-coded AUD** (architecture). Share rollup logic with **Dashboard** and **Master Plan** via a single module or service to avoid drift.

- Prototype reference: rollup and rates in `pace-prototype/apps/pace-trac/pages/CostsPage.jsx` (`CostsPage`, `CurrencyRatesPage` at `#/events/:code/costs/currency`).

---

## Current legacy baseline (observational only)

Legacy showed totals and rates modals; used planning cost fields and currency rates. **Baseline informs features only** — formulas must match brief + dev-db columns.

---

## Rebuild target

- **Totals:** Aggregate costs from **logistics rows only** for the event: `trac_transport`, `trac_accommodation`, and `trac_activity`.
- **Rates route:** `trac_currency_rates` CRUD lives on **`/currency-rates`** (separate page). Access is RBAC-controlled (`currency-rates` page key target in architecture) using the standard pace-core2 page-guard + secure-client pattern; permission seeding remains an external prerequisite and `/costs` remains read/aggregate.
- **Rates operations:** v1 uses **manual edits** on `/currency-rates`; no additional approval/publish workflow in scope.
- **Per-participant (R2 — `trac-architecture.md`):** For each logistics row, each assigned participant is allocated **`individual_cost + (group_cost / assigned_count)`** where **`assigned_count`** = number of `trac_itinerary_assignment` rows for that `(resource_type, resource_id)`. **Event total for a row** is **`group_cost + (individual_cost * assigned_count)`**. **Edge cases:** **`NULL` `individual_cost` / `group_cost`** → treat as **0**. **`assigned_count = 0`:** the row contributes **`group_cost` only** to event totals; **do not** compute a per-person share for that row (no division by zero). Planner-facing UI **may** indicate **unallocated group cost** for that row. Conversion to **event base currency** via `trac_currency_rates` unchanged.
- **Input model compatibility:** Rollups assume a logistics row may carry **both** `group_cost` and `individual_cost`; `/costs` must not reintroduce a mutual-exclusion rule that contradicts planning entry semantics.
- **Rounding decision (A):** for displayed rollups, use **line-level rounding then sum** to keep `/costs`, Dashboard, and Master Plan internally consistent, using currency minor-unit precision in the shared helper.
- **Formatting:** Use event base currency symbol/code from event metadata, not literals.
- **MINT:** No API coupling; TRAC writes/reads DB only.

---

## pace-core2 delta (vs legacy)

| Area | Legacy | Rebuild |
|------|--------|---------|
| Rollups | Event-only | Assignment-aware where needed |
| Currency copy | Possible hard-code | Base currency from event |
| Package | Old pace-core | pace-core2 |

---

## pace-core2 imports (expected)

| Need | Import path (expected) |
|------|------------------------|
| RBAC | `@solvera/pace-core/rbac` — `PagePermissionGuard` for costs page |
| Components | `@solvera/pace-core/components` |
| Providers | `@solvera/pace-core/providers` |
| Utils | `@solvera/pace-core/utils` for number formatting if provided |

---

## Data and schema references

| Table | Notes |
|-------|--------|
| `trac_transport`, `trac_accommodation`, `trac_activity` | Cost fields per dev-db |
| `trac_currency_rates` | Conversion behaviour per brief |
| `trac_itinerary_assignment` | For participant counts / allocation |
| `core_events` | Base currency |
| **Supabase MCP (dev-db)** | **Required** for money columns, rate keys, RLS |

---

## Acceptance criteria

1. Totals match manual calculation for a fixture event on dev-db using the shared rounding helper (line-level rounding then sum with currency minor-unit precision).
2. Currency display uses **event base currency** metadata.
3. `/currency-rates` is secured via the standard pace-core2 page-guard + secure-client pattern and validates rate edits; `/costs` stays read/aggregate.
4. Per-participant figure matches **R2** (`individual_cost + group_cost/assigned_count` per assigned resource row), and row event totals match **`group_cost + (individual_cost * assigned_count)`**, including documented **NULL/zero** handling.
5. Exported/shared rollup function used by SLICE-02 and SLICE-10 (no copy-paste divergence).

### Layout (prototype parity targets)

- [ ] Costs: `PageHeader` with **Currency rates** secondary nav to rates sub-route.
- [ ] Three KPI cells: total event cost, per participant, foreign-currency line count (hero row).
- [ ] **By resource type** breakdown card with progress bars and percentages.
- [ ] Line detail `DataTable` with group/individual costs, assigned count, per-person and event total columns; footer info note explaining R2 formula.
- [ ] Currency rates: `BackLink` to costs; info alert for base currency; rates table with edit/delete; inline add/edit form swaps table.

---

## API / Contract

- Reads: logistics + rates + event metadata via secure client.
- Writes: rates updates only if product allows; logistics cost writes belong to **SLICE-03** (this slice may **display** and aggregate, not re-own transport CRUD).
- **Contract with SLICE-03:** Single source for cost **input** on rows; this slice aggregates.

---

## Visual specification

### Costs summary (`/costs`)

- `PageHeader`: breadcrumb; title **Costs**; subtitle states base currency and FX conversion; header **Currency rates** navigates to rates route.
- **Hero row** (`cost-hero`) — three cells:
  1. **Total event cost** — large formatted amount, base currency label, active row count.
  2. **Per participant** — amount over approved application count.
  3. **Foreign-currency lines** — count + currency list or “all in {base}”.
- **By resource type** card: label + rows per transport/accommodation/activity with glyph, amount, mini progress bar, percentage column.
- **Line detail** `DataTable`: title **Line detail**; sortable columns — resource name + type subline, currency, group cost, individual cost, assigned count, per person (base), event total (base); aggregate sum row; empty state directs to Planning.
- **Formula footnote** (`fx-note`): explains event total and per-person allocation rules (R2); notes excluded cancelled rows when present.

### Currency rates (`/currency-rates` — prototype `#/events/:code/costs/currency`)

- `BackLink` → costs summary.
- `PageHeader`: title **Currency rates**; **Add rate** when list visible.
- Info alert: base currency and rate direction (foreign units per 1 base).
- **List mode:** table — currency code, conversion description, numeric rate, edit/delete row actions; empty state when no foreign currencies.
- **Inline form mode** (`CurrencyForm` in `Card`): code + rate fields, duplicate-code error, `SaveActions` footer — replaces table (not modal).

### Implementation delta (pass 2)

- Prototype nests rates under `#/events/:code/costs/currency`; production uses flat `/currency-rates` per architecture.
- Prototype displays AUD-formatted hero for demo; production uses **event base currency** from metadata (no hard-coded currency).
- Charts optional in production; prototype is table-first.

---

## Verification

- Cross-check totals vs SQL on dev-db.
- Dashboard/Master Plan consume same helper — integration smoke.

---

## Testing requirements

| # | Scenario | Type |
|---|----------|------|
| 1 | **Happy path:** Event with rates + logistics costs shows correct total and per-participant | Integration + unit on pure rollup |
| 2 | **Validation failure:** Invalid rate input rejected | Integration |
| 3 | **Auth / permission failure:** User without costs read sees denial | Integration |

Unit: conversion maths, **line-level rounding then sum**, currency minor-unit handling (at least 0/2/3 decimals), rollup with fixture rows (no Supabase).

---

## Open questions

*(None — R2 allocation and `assigned_count = 0` behaviour recorded in `trac-architecture.md` *Planning stage resolutions*; document NULL handling and totals vs per-person paths in shared rollup module tests.)*

---

## Do not

- Do not hard-code currency strings.
- Do not add MINT API integration.
- Do not duplicate rollup logic across dashboard/master plan/costs.

---

## References

| Document | Role |
|----------|------|
| `trac-architecture.md` | MINT scope, base currency decision, cost columns and rates |
| `TR02-dashboard-requirements.md`, `TR10-master-plan-requirements.md` | Consumers |
| `TR03-planning-logistics-requirements.md`, `TR04-assignments-requirements.md` | Upstream cost + assignment data |
