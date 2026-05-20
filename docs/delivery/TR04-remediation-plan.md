# SLICE-04 — Assignments — Remediation plan

**Authority:** [TR04-assignments-requirements.md](../requirements/TR04-assignments-requirements.md)  
**Completion record:** [TR04-slice-completion.md](./TR04-slice-completion.md)  
**Created:** 2026-05-20

Implementation satisfies TR04 **acceptance criteria and automated testing in code**. The items below close documentation, manual verification, cross-slice deep links, and quality gaps before treating SLICE-04 as fully signed off.

---

## Priority overview

| Priority | Item | Blocks sign-off? |
|----------|------|------------------|
| P0 | Manual dev-db verification checklist | Yes (product sign-off) |
| P1 | Record dev-db MCP schema / RLS for assignments + `base_application` | Yes (requirements prerequisite) |
| P2 | Permission RTL: `canCreate` false hides Add; `canUpdate` false hides Edit | No (quality / AC5 polish) |
| P2 | Integration test: duplicate assignment (`23505`) | No (quality) |
| P3 | Itinerary deep links when SLICE-05 ships | No for TR04 alone (cross-slice) |
| P3 | Optional `DataTable` for assignment list (visual spec) | No |
| P3 | Optional `@solvera/pace-core/forms` + Zod for assignment dialog | No |
| P3 | Gate empty-state CTA copy next to “No assignments yet” | No (header Add already present) |

---

## P0 — Manual dev-db verification

**Goal:** Satisfy TR04 § Verification and completion record manual checklist.

**Steps:**

1. Configure `.env` for dev Supabase (not production).
2. Sign in as **planner** with `read` + `create` + `update` + `delete` on page **`planning`**.
3. Ensure logistics rows exist on Planning for transport, accommodation, and activity.
4. On `/assignments`:
   - For each resource type, select a row, **create** assignment for an **approved** participant, confirm list + headcount update.
   - **Update** assignment notes; **delete** assignment.
   - Save assignment that would exceed **capacity** — confirm warning step then **Confirm save** succeeds (Option B).
5. Attempt insert with invalid `resource_id` (API or race) — confirm actionable error in UI.
6. Sign in without `read:page.planning` — confirm shell **AccessDenied** on `/assignments`.
7. Sign in as role without planning **create** — confirm Add disabled / save blocked; RLS blocks direct API if attempted.
8. From Planning, use **Open assignments** link — confirm `/assignments?kind=&resourceId=` pre-selects resource.
9. Tick boxes in [TR04-slice-completion.md](./TR04-slice-completion.md) § Verification and acceptance sign-off column.

**Owner:** Human QA on dev-db.

---

## P1 — Dev-db MCP validation record

**Goal:** Meet TR04 § Data and schema references — columns, RLS, triggers on dev-db.

**Steps:**

1. Supabase MCP (or SQL) on **dev-db** for:
   - `trac_itinerary_assignment` — writable columns match [types.ts](../../src/features/assignments/types.ts)
   - `base_application` — confirm `status` value for approved; confirm `first_name` / `surname` (or adjust picker `select` + [participant-label.ts](../../src/features/assignments/participant-label.ts))
   - `trac_resource_type` enum values
   - RLS: planner `read:page.planning` on assignments; applicant SELECT own rows
   - Triggers: `trac_itinerary_assignment_validate_resource`, cleanup on resource delete
2. Append **“Dev-db validation”** subsection to [TR04-slice-completion.md](./TR04-slice-completion.md) with date and any column renames applied in code.

**Owner:** Implementer or DB track.

---

## P2 — Permission integration tests (TR04 scenario 3 completion)

**Goal:** Match TR03 remediation pattern — prove write UI hidden when `usePageCan('planning', 'create')` is false.

**Steps:**

1. Add test in [`assignments.integration.test.tsx`](../../src/features/assignments/assignments.integration.test.tsx) or new RTL file:
   - Mock `usePageCan`: read true, create false → **Add assignment** not rendered.
2. Gate **Edit** in [`AssignmentList.tsx`](../../src/features/assignments/components/AssignmentList.tsx) on `canUpdate` from `useAssignmentMutations` (today Edit always visible; Save still permission-checked in dialog).

**Estimate:** Small PR.

---

## P2 — Duplicate assignment integration test

**Goal:** Cover rebuild target “prevent duplicate assignment rows” beyond `mapAssignmentError` unit assertion.

**Steps:**

1. Extend mock supabase `insert` to return `23505` on second insert with same `(resource_type, resource_id, application_id)`.
2. Assert `createAssignment` rejects with “already assigned” message.

**Estimate:** Small PR.

---

## P3 — Itinerary deep links (SLICE-05)

**Goal:** TR04 § Rebuild target — “Itinerary as needed via URL params”.

**Status:** URL contract implemented (`?kind=&resourceId=`). **No itinerary route in app yet.**

**Steps (in SLICE-05):**

1. When building `/itinerary`, add read-only links to `/assignments?kind=…&resourceId=…` for planner rows where assignment management is appropriate.
2. Do not add assignment mutations on `/itinerary`.

**Owner:** SLICE-05 implementer.

---

## P3 — Visual / forms polish (optional)

| Item | Action |
|------|--------|
| DataTable for assignment list | Replace `<ul>` with pace-core `DataTable` if product wants table density on desktop |
| pace-core/forms | Add Zod schema + `Form` for assignment dialog parity with Planning dialogs |
| Empty state | Duplicate “Add assignment” button inside empty `<p>` block for spec literalism |

---

## Sign-off criteria

SLICE-04 may move from **built** to **signed off** when:

- [ ] P0 manual checklist complete
- [ ] P1 dev-db MCP record appended
- [ ] P2 permission + duplicate tests merged (recommended, not blocking if P0/P1 done)
- [ ] Product accepts P3 itinerary deferral to SLICE-05

Update [trac-build-queue.md](./trac-build-queue.md) evidence line from `sign-off pending` to `signed off` when complete.
