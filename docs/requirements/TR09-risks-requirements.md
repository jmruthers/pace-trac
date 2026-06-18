# SLICE-09 — Risks — Requirements

**Document status:** Draft — rebuild implementation contract.  
**Companion authority:** `trac-project-brief.md`, `trac-architecture.md`.

---

## Orchestration metadata (canonical)

| Field | Value |
|--------|--------|
| **Slice ID** | SLICE-09 |
| **Name** | Risks |
| **Bounded context** | Risks |
| **Owning routes** | `/risks` |
| **Depends on** | SLICE-01, **SLICE-06** (contacts) |
| **Blocks** | — |
| **Implementation order** | 8 of 10 |
| **High-risk** | Yes — **generated** impacts (DEC-081), **print**, contact linkage |
| **Cross-cutting** | Contact pickers from SLICE-06 |

---

## Overview

Event **risk register** at `/risks`: CRUD on **`trac_risks`** with **likelihood** and **consequence** fields driving **read-only** **`impact_before`** / **`impact_after`** (generated columns — **DEC-081**). **Do not write** impact columns from the app. Link risks to **contacts** from SLICE-06 per schema. **Print:** retain **print capability** (architecture) alongside Master Plan — `window.print()` or equivalent with print-friendly CSS.

- Prototype reference: register, matrix, and full-page editors in `pace-prototype/apps/pace-trac/pages/RisksPage.jsx` (`RisksPage`, `RiskNewPage`, `RiskItemPage`).

---

## Current legacy baseline (observational only)

Legacy allowed manual impact fields in some flows — **rebuild forbids** writing generated impacts. Legacy risk/contact patterns are **observational** only.

---

## Rebuild target

- List/create/edit/delete risks (subject to RLS).
- **Inputs:** likelihood, consequence, mitigations, titles, status enums per dev-db — **validate enums via Supabase MCP**.
- **Display:** Show generated impacts from DB reads only.
- **Contacts:** Attach or reference contacts via FK/join defined in brief.
- **Print:** Button triggers print; layout hides nav/chrome where appropriate for print stylesheet.
- **Empty / loading / permission** states.

**Suggested sub-phases:** CRUD + generated impact display → print stylesheet.

---

## pace-core2 delta (vs legacy)

| Area | Legacy | Rebuild |
|------|--------|---------|
| Impact | Possibly manual | **Generated only** |
| Contacts | Various | SLICE-06 IDs |
| UI | Old | pace-core2 |

---

## pace-core2 imports (expected)

| Need | Import path (expected) |
|------|------------------------|
| RBAC | `@solvera/pace-core/rbac` — `PagePermissionGuard` for risks |
| Components / forms | `@solvera/pace-core/components`, `@solvera/pace-core/forms` |
| Providers | `@solvera/pace-core/providers` |

---

## Data and schema references

| Table | Notes |
|-------|--------|
| `trac_risks` | Generated `impact_before`, `impact_after`; likelihood/consequence enums |
| Contacts table | FK from risks — **validate on dev-db** |
| **Supabase MCP (dev-db)** | **Required:** confirm generated column definitions and GRANTs |

---

## Acceptance criteria

1. User can manage risks with valid enum values; impacts **display** from generated columns after save.
2. Attempts to PATCH impact columns **fail or are ignored** — client must not send them (omit from update payloads).
3. Contact linkage works with contacts from SLICE-06.
4. Print action completes without throw; print layout is readable.
5. RLS enforced for risks page.

### Layout (prototype parity targets)

- [ ] Register header: **Print** secondary + **Add risk** primary.
- [ ] Residual risk **5×5 matrix** card above table (counts per likelihood × consequence cell).
- [ ] Status filter tabs (All + each risk status) with counts.
- [ ] `DataTable`: risk description link, when badge, before/after impact chips, responsible contact, status badge; row activate opens item page.
- [ ] New risk: full page with `RiskFields` sections (before controls, controls & response, after controls) and read-only `ImpactReadout` blocks.
- [ ] Item page: same field grid with `PageSaveBar`; delete confirmation.

---

## API / Contract

- INSERT/UPDATE/DELETE on `trac_risks` via secure client with **omit generated fields** on write.
- Reads return generated impacts for display.
- Contact IDs must reference existing event contacts (or global scope per brief).

---

## Visual specification

### Risk register list (`/risks`)

- `PageHeader`: breadcrumb; title **Risk register**; subtitle explains generated impact; actions **Print** + **Add risk**.
- **Residual risk matrix** (`RiskMatrix`) in top `Card`:
  - 5×5 grid: likelihood rows × consequence columns; cell shows count of risks at residual position; colour band by impact score; axis labels with ranks.
  - Footnote explaining residual (after-control) positioning.
- **Status tabs:** All + each `RISK_STATUSES` value with count.
- **DataTable:**
  - Risk column: linked description + type subline.
  - When badge (During vs Prior styling).
  - Before / After: `ImpactChip` with tooltip of L×C.
  - Responsible contact name or em dash.
  - Status badge with tone.
  - Row actions: Open, Delete; row click navigates to item route.
- Empty state per filter.
- Print: sets CSS variables for print title/event name; uses `window.print()`; hide chrome via print stylesheet.

### New risk (full-page — `#/events/:code/risks/new`)

- `BackLink` → register.
- `PageHeader`: **Add risk**.
- Section card with `RiskFields` grid:
  - Type, when, description.
  - **Before controls:** likelihood + consequence selects; **ImpactReadout** (read-only, lock icon).
  - **Controls & response:** control measures, residual response, responsible contact select, status, comment.
  - **After controls:** likelihood + consequence; second **ImpactReadout**.
- `PageSaveBar`: Cancel + **Create risk** (submit).

### Risk item (full-page — `#/events/:code/risks/:riskId`)

- Same `RiskFields` layout; `PageSaveBar` when dirty; delete with confirmation.
- Not-found pattern if id missing.

### Implementation delta (pass 2)

- Prototype computes impact client-side for display chips; production reads **generated columns** from DB after save — chips must reflect server values on refetch.
- Prototype routes under `#/events/:code/risks/*`; production flat `/risks` + nested item routes.
- Kanban optional; prototype is table + matrix only.

---

## Verification

- dev-db: update likelihood and observe impact change read-only.
- Print smoke in browser.

---

## Testing requirements

| # | Scenario | Type |
|---|----------|------|
| 1 | **Happy path:** Create risk with L/C; generated impact appears on refetch | Integration |
| 2 | **Validation failure:** Invalid enum rejected | Integration |
| 3 | **Auth / permission failure:** No risks permission — AccessDenied | Integration |

Unit: display formatting for risk score (pure, from mocked row).

---

## Open questions

*(None — enum labels: validate via dev-db; see `trac-architecture.md` database-backed design.)*

---

## Do not

- Do not **write** `impact_before` / `impact_after`.
- Do not use production DB.
- Do not invent contact linkage shape — confirm schema.

---

## References

| Document | Role |
|----------|------|
| `trac-architecture.md` | Risks print retained, DEC-081 summary, risk model |
| `TR06-contacts-requirements.md` | Contact prerequisite |
