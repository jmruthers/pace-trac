# SLICE-06 — Contacts — Completion record

**Authority:** [TR06-contacts-requirements.md](../requirements/TR06-contacts-requirements.md)  
**Completed (code):** 2026-05-20  
**Quality gate:** `npm run validate` — PASS (6/6)

---

## Acceptance criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Authorised user can add, edit, remove contacts for the event per RLS. | Complete (implementation); manual dev-db sign-off below |
| 2 | Contact list drives SLICE-09 picker (stable IDs). | Complete |
| 3 | Validation errors map to UI for required fields and formats. | Complete |
| 4 | Unauthorised users cannot read or mutate contacts. | Complete |
| 5 | Inactive/archive + FK delete guidance. | Complete (inactive N/A on schema; FK guidance implemented) |

---

## Rebuild target summary

| Item | Status | Evidence |
|------|--------|----------|
| List contacts for active event with search/filter | Complete | `useContacts` query scoped by `event_id`; DataTable `search`, `sorting`, `pagination` |
| Create, edit, delete per schema and RLS | Complete | Mutations via `useSecureSupabase`; `useResourcePermissions('contacts')` |
| Delete follows DB constraints (FK guidance) | Complete | `23503` → risk-link message in `use-contacts.ts` |
| Archive/deactivate when soft-delete exists | N/A | dev-db `trac_contacts` has no inactive/archive columns |
| Required field validation (`first_name`, `surname`) | Complete | `contact-schema.ts` |
| Email format validation | Complete | Zod email pipe in `contact-schema.ts` |
| Phone format validation | Complete | pace-core `phoneSchema` in `contact-schema.ts` |
| Risk prep (stable IDs, picker contract) | Complete | `tracContactsQueryKey`, `invalidateContactsAndRiskPickers` |
| Active/inactive pickers exclude inactive | N/A | No inactive flag in schema |
| Empty / loading / permission states | Complete | DataTable loading + empty; load `Alert`; `PagePermissionGuard` + shell RBAC |
| pace-core2 UI (not legacy) | Complete | `DataTable`, `Card`, `Alert`, `PagePermissionGuard` |
| Secure RBAC client (not raw client) | Complete | `useSecureSupabase()` in `use-contacts.ts` |

---

## API / contract

| Item | Status |
|------|--------|
| CRUD on `trac_contacts` via secure client | Complete |
| Event scoping on all mutations | Complete (`event_id` + `organisation_id` on insert; `event_id` on update/delete) |
| No Edge Functions | Complete |
| Invalidate contacts + risk pickers on mutation success | Complete (`invalidateContactsAndRiskPickers`) |

---

## Visual specification

| Item | Status | Notes |
|------|--------|-------|
| Table with name, role, phone, email | Complete | Columns: first name, surname, role, phone, email |
| Modal/panel for edit; confirm for delete | Complete | pace-core `DataTable` create/edit dialog + delete confirm |
| Usable on smaller screens | Complete (by contract) | Relies on pace-core `DataTable` responsive behaviour; confirm on manual mobile pass |

---

## Automated verification

| Check | Result |
|-------|--------|
| `npm run validate` | PASS (6/6) |
| Unit / integration tests | 30 passed (see `src/features/contacts/**`) |
| pace-core audit | PASS |

### Testing requirements (TR06)

| # | Scenario | Status |
|---|----------|--------|
| 1 | Happy path: add contact → list | Complete (`contacts.integration.test.tsx`) |
| 2 | Validation failure | Complete (`contact-schema.test.ts`, integration) |
| 3 | AccessDenied without permission | Complete (`contacts.integration.test.tsx`) |

---

## Manual verification (sign-off)

Exercise against **dev-db** with planner (or equivalent) role and valid `.env`:

- [ ] `/contacts` reachable with event selected; Contacts nav link works
- [ ] List shows only contacts for active event
- [ ] Create contact with required names; row appears after save
- [ ] Edit contact (role, phone, email); changes persist after refresh
- [ ] Delete contact with no risk link succeeds
- [ ] Delete contact linked on `trac_risks.responsible_contact_id` shows actionable error (not raw Postgres text)
- [ ] User without `read:page.contacts` sees AccessDenied (shell and/or page guard)
- [ ] User without create/update/delete permissions cannot mutate via UI (RLS + hidden/disabled actions)

**Verification (requirements §Verification):**

- [ ] CRUD on dev-db (above)
- [ ] Risk slice smoke: existing contact ID selectable in risk form — **owner: SLICE-09** (contract ready; picker not built in SLICE-06)

---

## Routes delivered (SLICE-06 ownership)

| Route | Behaviour |
|-------|-----------|
| `/contacts` | `ContactsPage` → `PagePermissionGuard` → `ContactsContent` (DataTable CRUD) |

Registered in [`TRAC_REGISTERED_ROUTE_PATHS`](../../src/app/navigation/trac-nav.ts).

---

## SLICE-09 integration contract

Downstream risks slice should:

- Read contacts with `useQuery({ queryKey: tracContactsQueryKey(eventId), ... })` (same key as list).
- After contact mutations, rely on `invalidateContactsAndRiskPickers(queryClient, eventId)` (already called from SLICE-06 mutations).
- Use contact `id` (uuid) for `trac_risks.responsible_contact_id`.

Exports: [`contact-query-keys.ts`](../../src/features/contacts/contact-query-keys.ts).

---

## Gaps and remediation plan

| ID | Gap | Severity | Remediation |
|----|-----|----------|-------------|
| G1 | Manual dev-db CRUD not signed off | Required for closure | Run checklist above on dev-db; record dates in this doc |
| G2 | Risk picker smoke test | SLICE-09 scope | Implement `/risks` contact select using `tracContactsQueryKey`; smoke test per TR09 |
| G3 | End-to-end UI test for create dialog validation toast | Low | Optional: RTL test opening DataTable create dialog with empty `first_name` (mock pace-core table actions) |
| G4 | Explicit empty-state copy | Low | Only if manual pass shows bare DataTable empty is insufficient; add slice-specific empty panel |
| G5 | `@solvera/pace-core/forms` not imported | None | Visual spec satisfied by `DataTable` inline create/edit; no separate Form surface required |

**No code blockers** for marking SLICE-06 **built** in the queue; G1 is human sign-off; G2 is downstream.

---

## Ready for downstream slices

SLICE-06 is **built**. **SLICE-09** may consume contact query keys and IDs. **SLICE-02** / **SLICE-10** may read contact counts/lists per composite contracts.

---

## Follow-up (non-blocking)

| Item | Owner |
|------|--------|
| Manual dev-db sign-off (G1) | QA / Jess |
| Risk contact picker + smoke (G2) | SLICE-09 |
| Optional E2E validation UI test (G3) | SLICE-06 polish or SLICE-09 |
