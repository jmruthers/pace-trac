# SLICE-09 — Risks — Remediation plan

**Authority:** [TR09-risks-requirements.md](../requirements/TR09-risks-requirements.md)  
**Completion record:** [TR09-slice-completion.md](./TR09-slice-completion.md)  
**Created:** 2026-05-20

Implementation satisfies TR09 acceptance criteria and automated testing in code. The items below close **manual sign-off**, **print layout polish**, and **documentation** gaps before treating SLICE-09 as fully signed off for release.

---

## Priority overview

| Priority | Item | Blocks sign-off? |
|----------|------|------------------|
| P0 | Manual dev-db verification (L/C → generated impact, CRUD, RLS) | Yes (product sign-off) |
| P0 | Manual print smoke (preview readable, nav hidden) | Yes (TR09 § Verification) |
| P1 | Tick manual checklist in completion record | Yes (documentation) |
| P3 | Print page-break utility on register `Card` | **Done** (2026-05-20) |
| P3 | `window.print` smoke unit test | **Done** (2026-05-20) |
| P4 | Document `pace-core/forms` vs components `Form` | No (import path delta only) |

**No P0 code blockers** — backend gate PASS; `npm run validate` PASS.

---

## P0 — Manual dev-db verification

**Goal:** Satisfy TR09 § Verification and acceptance criteria 1, 3, 5.

**Steps:**

1. Configure `.env` for **dev** Supabase (not production).
2. Sign in as role with `read` + `create` + `update` + `delete` on page `risks`, and contacts read for picker.
3. Open `/risks` with an event selected.
4. **Create** a risk with valid enums (before/after L/C); confirm row appears and **Impact (before)** / **Impact (after)** columns show integers after save/refetch (not editable in dialog).
5. **Edit** likelihood/consequence; save; confirm impacts **change** on list refetch only.
6. **Link** a responsible contact from SLICE-06 list; save; confirm FK persists.
7. **Delete** a risk (or via dialog Delete); confirm removal.
8. Sign in **without** `read:page.risks`: confirm `AccessDenied` on `/risks`.
9. Attempt mutation without write permission: confirm UI/RBAC blocks or RLS denies.
10. Tick remaining boxes in [TR09-slice-completion.md](./TR09-slice-completion.md) § Manual verification.

**Owner:** Human QA / planner on dev-db.

---

## P0 — Manual print smoke

**Goal:** Satisfy TR09 § Verification (“Print smoke in browser”) and AC4.

**Steps:**

1. On `/risks` with at least one risk row, click **Print**.
2. Confirm no console error / thrown exception.
3. In print preview: shell header, nav, and toolbar buttons hidden; risk table content visible; title metadata present (`usePaceMain` → `--print-title`).
4. Tick print item in completion record manual checklist.

**Owner:** Human QA.

---

## P1 — Completion record sign-off

**Goal:** Align delivery docs with TR03/TR06 pattern.

**Steps:**

1. After P0 passes, change all manual verification items to `[x]` in [TR09-slice-completion.md](./TR09-slice-completion.md).
2. Update [trac-build-queue.md](./trac-build-queue.md) SLICE-09 evidence: note “sign-off complete” and date.
3. Optional: remove “remediation open” line from completion header when P0 done.

---

## P3 — Print page breaks — **Done**

**Implemented:** `print:break-inside-avoid` on register `Card` in [RisksContent.tsx](../../src/features/risks/RisksContent.tsx).

**Follow-up:** Re-run manual print smoke (P0) to confirm layout in target browsers.

---

## P3 — Print smoke unit test — **Done**

**Implemented:** [RisksContent.test.tsx](../../src/features/risks/RisksContent.test.tsx) — mocks `window.print`, clicks Print, asserts call; asserts `usePaceMain` metadata and print utility class on card.

---

## P4 — pace-core/forms import path (documentation only)

**Goal:** Clarify TR09 § pace-core2 imports table.

TR09 lists `@solvera/pace-core/forms`; risks slice uses `Form` / `FormField` from `@solvera/pace-core/components` (consistent with Journal). No change required unless audit mandates forms subpath — then re-export-import from forms if package exposes the same API.

---

## Out of scope (per TR09)

- Master Plan print (SLICE-10)
- Kanban view
- Backend / schema changes
- Writing generated impact columns from the app

---

## Completion criteria for closing this plan

- [ ] P0 dev-db checklist signed off
- [ ] P0 print smoke signed off
- [ ] P1 completion + build queue updated
- [ ] P3 items either implemented or explicitly deferred with owner approval
