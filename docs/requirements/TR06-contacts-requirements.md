# SLICE-06 — Contacts — Requirements

**Document status:** Implemented — rebuild contract (SLICE-06 built 2026-05-20; manual dev-db sign-off pending).  
**Companion authority:** `trac-project-brief.md`, `trac-architecture.md`.

---

## Orchestration metadata (canonical)

| Field | Value |
|--------|--------|
| **Slice ID** | SLICE-06 |
| **Name** | Contacts |
| **Bounded context** | Contacts |
| **Owning routes** | `/contacts` |
| **Depends on** | SLICE-01 |
| **Blocks** | **SLICE-09** (risks reference contacts) |
| **Implementation order** | 2 of 10 (per architecture — contacts before planning) |
| **High-risk** | Lower relative to polymorphic slices |
| **Cross-cutting** | Risk linkage consumed by SLICE-09 |

---

## Overview

Event **contacts** CRUD at `/contacts`: maintain the contact list used across TRAC (including risk register linkage in SLICE-09). Scope is **organisation/event** per brief; permissions via contacts page key. Ensure consistency with risk **contact links** (foreign keys or join table per dev-db — validate with Supabase MCP).

---

## Current legacy baseline (observational only)

Legacy exposed event contacts with risk linkage patterns. **Observational** — field sets and table names **must** match **dev-db**, not legacy components.

---

## Rebuild target

Implementation status: see [TR06-slice-completion.md](../delivery/TR06-slice-completion.md). Summary: **all applicable items complete**; inactive/archive N/A on dev-db schema.

- List contacts for active event with search/filter as appropriate.
- Create, edit, delete/archive per schema and RLS. **Delete semantics follow DB constraints**: if FK restrictions prevent delete, surface actionable guidance; if soft-delete columns exist, prefer archive/deactivate behaviour for v1 and keep pickers on active contacts.
- Required fields and validation aligned to DB constraints, with explicit field-level rules for the actual dev-db schema (for example email and phone format where those fields exist).
- **Risk prep:** Ensure contacts selectable when authoring risks (SLICE-09); stable IDs.
- **Active/inactive handling:** If soft-delete or inactive flags exist, active pickers and default lists exclude inactive contacts while preserving historical references and edit visibility where appropriate.
- **Empty / loading / permission** states.

---

## pace-core2 delta (vs legacy)

| Area | Legacy | Rebuild |
|------|--------|---------|
| UI | Legacy components | pace-core2 components |
| Data access | Old client patterns | Secure RBAC client |

---

## pace-core2 imports (expected)

| Need | Import path (expected) |
|------|------------------------|
| RBAC | `@solvera/pace-core/rbac` — `PagePermissionGuard` |
| Forms / lists | `@solvera/pace-core/forms`, `@solvera/pace-core/components` |
| Providers | `@solvera/pace-core/providers` |

---

## Data and schema references

| Table | Notes |
|-------|--------|
| `trac_contacts` | **Validate actual columns and constraints via Supabase MCP (dev-db)** |
| `trac_risks` | Incoming FKs to contacts for SLICE-09 |
| **Supabase MCP (dev-db)** | **Required** before implementation |

---

## Acceptance criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Authorised user can add, edit, remove contacts for the event per RLS. | **Complete** (client CRUD + RLS via `useSecureSupabase`; manual dev-db sign-off pending — see [TR06-slice-completion.md](../delivery/TR06-slice-completion.md)) |
| 2 | Contact list drives SLICE-09 picker (integration contract: IDs stable). | **Complete** (`tracContactsQueryKey`, `invalidateContactsAndRiskPickers`; risk picker UI is SLICE-09) |
| 3 | Validation errors map to UI for required fields and formats. | **Complete** (`parseContactFormData` → thrown errors surfaced by DataTable create/edit handlers; tests in `contact-schema.test.ts`) |
| 4 | Unauthorised users cannot read or mutate contacts. | **Complete** (shell `read:page.contacts`, `PagePermissionGuard`, mutation `useResourcePermissions`, RLS) |
| 5 | If inactive/archive semantics exist in schema, active pickers exclude inactive contacts by default and delete-blocking FK failures return actionable guidance. | **Complete (partial AC)** — no `is_active`/archive columns on dev-db (inactive clause N/A); FK `23503` maps to risk-link guidance in `use-contacts` |

---

## API / Contract

- CRUD via secure Supabase client on contact table(s) defined in brief.
- Event scoping on all mutations.
- No special Edge Functions unless brief requires enrichment.
- Successful create/update/archive/delete actions invalidate contacts reads and dependent risk pickers explicitly.

---

## Visual specification

- Table or card list with primary/secondary lines (name, role, phone, email per schema).
- Modal or side panel for edit; destructive confirm for delete.
- Desktop/mobile: list actions remain usable on smaller screens without horizontal-only affordances.

---

## Verification

- CRUD on dev-db; risk slice smoke test picks existing contact.

---

## Testing requirements

| # | Scenario | Type | Status |
|---|----------|------|--------|
| 1 | **Happy path:** Planner adds contact; appears in list | Integration | **Complete** — `contacts.integration.test.tsx` (hook + mocked Supabase) |
| 2 | **Validation failure:** Missing required field — blocked with message | Integration | **Complete** — `contact-schema.test.ts` + integration parse test |
| 3 | **Auth / permission failure:** No contacts permission — AccessDenied | Integration | **Complete** — `contacts.integration.test.tsx` (`PagePermissionGuard` denied) |

**Remediation (2026-05-20):** G1 automated sign-off in completion doc; G2 `ResponsibleContactSelect` + picker contract tests; G3 `ContactsContent.validation.test.tsx`; G4 empty-state copy in `ContactsContent`.

---

## Open questions

*(None — table **`trac_contacts`**; validate columns via dev-db.)*

---

## Do not

- Do not block SLICE-09 on undocumented contact shapes — resolve schema in brief/MCP first.
- Do not use production DB.

---

## References

| Document | Role |
|----------|------|
| `trac-architecture.md` | SLICE-06 before SLICE-09 |
| `TR09-risks-requirements.md` | Downstream consumer |
| TR09-risks-requirements.md | Downstream consumer |
