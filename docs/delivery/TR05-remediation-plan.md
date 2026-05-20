# SLICE-05 — Itinerary — Remediation plan

**Authority:** [TR05-itinerary-requirements.md](../requirements/TR05-itinerary-requirements.md)  
**Completion record:** [TR05-slice-completion.md](./TR05-slice-completion.md)  
**Created:** 2026-05-21

Implementation satisfies TR05 **acceptance criteria in code** and automated gates. The items below close manual verification, documentation, and remaining rebuild-target polish before full product sign-off.

---

## Priority overview

| Priority | Item | Blocks sign-off? |
|----------|------|------------------|
| P0 | Manual dev-db: planner full list+map; participant A/B RLS isolation; day visitor; dual-role tabs | Yes (product) |
| P1 | Record dev-db MCP: `itinerary` page key + Option A policies on three logistics tables | Yes (prerequisite doc) |
| P2 | Map transport **legs** (polyline dep→arr when both coords) | No (F-05-02 / AC1 polish) |
| P2 | Same-day accommodation: check-in **and** check-out on one day | No (rebuild target) |
| P2 | `useViewerApplication`: applicant row only (`base_application_is_applicant`) | No (correctness) |
| P3 | Integration RTL: skipped invalid rows → `Alert` (test #2) | No |
| P3 | Unit: timezone precedence + in-day ordering cases | No |
| P3 | `ItineraryPage.test.tsx` smoke | No |
| P3 | Planning deep link with resource tab context | No |

**Out of scope:** pace-portal2 participant route (F-05-10); `visibleDateRange` on this page (TR02).

---

## P0 — Manual dev-db verification

**Goal:** Satisfy TR05 § Verification and completion record manual checklist.

**Steps:**

1. Configure `.env` for dev Supabase (`yihzsfcceciimdoiibif`).
2. Confirm `read:page.itinerary` and `itinerary` in `rbac_app_pages`.
3. **Planner** with planning read: open `/itinerary` — full event timeline; map shows markers and transport legs when dep/arr coords exist; links to assignments/planning work.
4. **Participant A** with assignments only to A’s resources: sees only assigned rows; cannot see B’s logistics.
5. **Participant B** — reciprocal isolation vs A.
6. **Day visitor** (no `base_application`): sees personalised-unavailable message, not silent empty.
7. **Dual role** (planner + application): Event / Your tabs behave correctly.
8. **Map empty:** logistics without coords → map empty copy; list still complete.
9. **Invalid row:** break a timestamp in planning — itinerary shows skip `Alert`, stable order for valid rows.

**Record:** Date, tester, pass/fail per step in completion record or comment on PR.

---

## P1 — Dev-db MCP artifact

**Goal:** Document Option A and page key state per TR05 platform dependency.

**Steps:**

1. `list_migrations` tail includes `p4_batch11_trac_participant_itinerary_rls`.
2. `execute_sql` or policy inspection: `participant_select_trac_transport`, `_activity`, `_accommodation` exist.
3. Confirm `rbac_app_pages` row for `itinerary`.
4. Paste summary into completion record **Prerequisites** section.

---

## P2 — Code gaps (implemented in remediation pass)

| Item | Files |
|------|-------|
| Transport map legs | `collect-map-points.ts`, `ItineraryMapPanel.tsx` |
| Same-day stay details | `types.ts`, `map-logistics-to-itinerary-input.ts`, `ItineraryEntryRow.tsx` |
| Applicant-only viewer app | `useViewerApplication.ts` |

---

## P3 — Test and polish gaps

| Item | Files |
|------|-------|
| Validation RTL | `ItineraryContent.validation.test.tsx` |
| Precedence / ordering units | `build-itinerary-model.test.ts`, `itinerary-fixtures.ts` |
| Page smoke | `ItineraryPage.test.tsx` |
| Planning deep link | `ItineraryEntryRow.tsx` — `?kind=` query on planning link |

---

## Sign-off criteria

- [ ] P0 manual checklist complete
- [ ] P1 MCP artifact recorded
- [x] P2 code items shipped (this remediation pass)
- [x] P3 automated tests added
- [x] `npm run validate` PASS
