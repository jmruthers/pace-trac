# TRAC Build Queue

## Run Readiness Summary

- Backend-ready report: `docs/delivery/trac-backend-ready-report.md` (`Gate status: PASS`)
- Backend freeze status: `Frozen for this run` (SLICE-01 … SLICE-10)
- Unresolved blockers: `0` (`none`)
- Execution mode: `full run`

## Dependency handling for this run

- Source authority for slice identity/title/dependencies: `docs/requirements/TR01-platform-shell-requirements.md` … `docs/requirements/TR10-master-plan-requirements.md`
- `.contract` dependencies are treated as backend-pre-satisfied for runtime sequencing when the backend-ready report is `PASS` and backend is frozen for this run
- Runtime `depends_on` values in the queue table include executable build-order prerequisites only; authority `.contract` edges are preserved in **Evidence** below

## Queue


| slice_id                        | depends_on                                                 | status | blocker_reason |
| ------------------------------- | ---------------------------------------------------------- | ------ | -------------- |
| SLICE-01 — Platform shell       | -                                                          | built  |                |
| SLICE-03 — Planning (logistics) | SLICE-01                                                   | built  |                |
| SLICE-06 — Contacts             | SLICE-01                                                   |        |                |
| SLICE-08 — Journal              | SLICE-01                                                   | built  |                |
| SLICE-04 — Assignments          | SLICE-01, SLICE-03                                         |        |                |
| SLICE-05 — Itinerary            | SLICE-01, SLICE-03, SLICE-04                               |        |                |
| SLICE-07 — Costs & currency     | SLICE-01, SLICE-03, SLICE-04                               |        |                |
| SLICE-09 — Risks                | SLICE-01, SLICE-06                                         |        |                |
| SLICE-02 — Dashboard            | SLICE-01, SLICE-03, SLICE-04, SLICE-05, SLICE-06, SLICE-07 |        |                |
| SLICE-10 — Master Plan          | SLICE-01, SLICE-03, SLICE-04, SLICE-05, SLICE-06, SLICE-07 |        |                |


## Evidence

### SLICE-01 — Platform shell

- authority: `docs/requirements/TR01-platform-shell-requirements.md`
- completion: `docs/delivery/TR01-slice-completion.md`
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)
- validate: PASS (6/6 checks)
- tests: 15+ passed (`auth-flow`, `protected-route`, redirects, nav, pages, shell)
- routes: `/login`, `/user-dashboard` → `/`, `/` placeholder, `*` NotFound
- follow-up: CI monorepo path for `@solvera/pace-core`; dashboard on `/` (SLICE-02)

### SLICE-03 — Planning (logistics)

- authority: `docs/requirements/TR03-planning-logistics-requirements.md`
- completion: `docs/delivery/TR03-slice-completion.md`
- remediation: `docs/delivery/TR03-remediation-plan.md` (open until manual sign-off)
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)
- validate: PASS (6/6 checks)
- tests: 37 passed (planning enums/snapshots/validation, mutations integration, PlanningPage, nav)
- routes: `/planning` — transport, accommodation, activity tabs; `read:page.planning`; writes via `usePageCan('planning', create|update|delete)`
- acceptance criteria (TR03 §1–8): **implemented in code** — see completion record table; **sign-off pending** manual dev-db + P1 MCP record
- testing (TR03 table): scenarios 1–2 **complete**; scenario 3 **partial** (mock-only permission test)
- explicit exclusions: no `trac_itinerary_assignment` mutations; no cache-as-display-SoT; no BASE UX
- open follow-up: manual verification checklist; dev-db MCP artifact; permission RTL test; optional Edit-button gating; invalidation/attachment tests

### SLICE-06 — Contacts

- authority: `docs/requirements/TR06-contacts-requirements.md`
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)

### SLICE-08 — Journal

- authority: `docs/requirements/TR08-journal-requirements.md`
- completion: `docs/delivery/TR08-slice-completion.md`
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)
- validate: PASS (6/6 checks)
- tests: 55 passed (`journal-*`, `JournalPage.integration.test.tsx`, nav)
- routes: `/journal` (post CRUD, images via `files` bucket, `journal` RBAC)
- acceptance: AC1–AC4 complete; AC5 partial (manual dev-db RLS sign-off); see completion remediation plan for visual-spec/test gaps

### SLICE-04 — Assignments

- authority: `docs/requirements/TR04-assignments-requirements.md`
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)

### SLICE-05 — Itinerary

- authority: `docs/requirements/TR05-itinerary-requirements.md`
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)
- contract (backend-pre-satisfied): pace-core2 DB — logistics `SELECT` RLS Option A on `trac_transport`, `trac_activity`, `trac_accommodation` — PASS per backend report
- contract (app lane): pace-core2 shared itinerary derivation helper (authority: CR25; installed package: CR26 at `@solvera/pace-core/itinerary`) — verify export at implementation; out of backend gate scope per backend report

### SLICE-07 — Costs & currency

- authority: `docs/requirements/TR07-costs-and-currency-requirements.md`
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)
- advisory: client-side cost rollup helper aligns with TR02/TR10 during frontend execution (not a Supabase RPC contract)

### SLICE-09 — Risks

- authority: `docs/requirements/TR09-risks-requirements.md`
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)

### SLICE-02 — Dashboard

- authority: `docs/requirements/TR02-dashboard-requirements.md`
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)
- composite upstream: `docs/requirements/trac-architecture.md` §Composite contracts — Dashboard (planning, itinerary, costs, contacts; lightweight `/assignments` link)

### SLICE-10 — Master Plan

- authority: `docs/requirements/TR10-master-plan-requirements.md`
- backend freeze: Frozen for this run — see `docs/delivery/trac-backend-ready-report.md` (PASS)
- composite upstream: `docs/requirements/trac-architecture.md` §Composite contracts — Master Plan (contacts, planning, assignments, itinerary, costs per explicit composite contract)

