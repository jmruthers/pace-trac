# SLICE-01 — Platform shell — Requirements

**Document status:** Draft — rebuild implementation contract.  
**Companion authority:** `trac-project-brief.md`, `trac-architecture.md`.

---

## Orchestration metadata (canonical)

Reinforces `trac-architecture.md` — do not drift without updating architecture first.

| Field | Value |
|--------|--------|
| **Slice ID** | SLICE-01 |
| **Name** | Platform shell |
| **Bounded context** | Platform shell |
| **Owning routes** | `/login`, `/user-dashboard` (redirect to `/`), `*` (NotFound within authenticated shell) |
| **Depends on** | — (foundation slice) |
| **Blocks** | All other slices (SLICE-02…10) |
| **Implementation order** | 1 of 10 |
| **High-risk** | Yes — pace-core2 bootstrap, auth, RBAC, provider assumptions vs legacy |
| **Cross-cutting** | Router, app layout, TRAC app id + RBAC wiring, org/event providers |

---

## Overview

Establish the TRAC client on **pace-core2**: Vite + React entry, authentication, organisation and event context, protected routing, primary navigation shell (structure only — nav labels/links completed as routes land), and deterministic handling of unknown routes. This slice delivers the **platform spine** so domain slices mount under a single authenticated layout without re-solving auth or provider topology.

- Prototype reference: routing, auth gate, authenticated shell, event landing, and nav switching in `pace-prototype/apps/pace-trac/app.jsx`; event picker layout in `pace-prototype/apps/pace-trac/pages/OverviewPage.jsx` (`TracLandingPage`).

---

## Rebuild target

- **Dependency:** `@solvera/pace-core` (pace-core2 monorepo), not legacy `@solvera/pace-core`.
- **Auth:** pace-core2 **`UnifiedAuthProvider`** with session restoration and inactivity wiring per the current pace-core2 shell pattern.
- **Redirect:** `/user-dashboard` redirects to **`/`** (**TRAC** authenticated home), matching architecture IA v1.
- **Protected shell:** Authenticated routes render inside the pace-core2 app shell with org/event selection gating as required by platform patterns.
- **Routing pattern:** Use pace-core2 **`ProtectedRoute`** for authenticated route trees, and use **`ProtectedRoute requireEvent`** for event-scoped routes so TRAC has one consistent no-event fallback instead of page-by-page variations.
- **Navigation:** Primary nav order is defined in architecture (Planning → Assignments → Itinerary → …); this slice provides the **shell** and route outlets; individual nav items may be feature-flagged or hidden until their slice ships, but **routes must not duplicate ownership**.
- **NotFound:** Authenticated `*` route shows a controlled NotFound UI inside the shell (not a blank screen), with navigation back to `/`; it is **shell-owned** and must not depend on dashboard-specific page guards to remain reachable.
- **RBAC setup:** Call **`setupRBAC`** once at app startup for the TRAC app id; page guards and secure data access then use the same configured client boundary.
- **Standard RBAC contract only:** Use pace-core2 **`ProtectedRoute`**, **`ProtectedRoute requireEvent`**, **`PagePermissionGuard`**, navigation permission wiring, and secure-client data access as documented in pace-core2 RBAC guidance. Do **not** introduce TRAC-specific page-local permission bypasses or custom no-event fallbacks.
- **Prerequisites:** Required TRAC page registration / permission seeding in **`rbac_app_pages`** is a **pre-build prerequisite on dev-db**; this slice names the target guards and page names but does **not** assign seeding work to implementation agents.
- **No domain data:** This slice does not implement planning, assignments, or other domain CRUD — only the shell and routing contracts.

---

## pace-core2 shell contract

| Area | Current pace-core2 contract |
|------|---------------------------|
| App bootstrap | `setupRBAC(...)` called once before render; shell bootstraps through `QueryClientProvider` → `BrowserRouter` → `UnifiedAuthProvider` → session restoration loader → app/providers |
| Provider stack | `InactivityServiceProvider` wraps app content; org/event context comes from `OrganisationServiceProvider` and `EventServiceProvider` inside auth context |
| Protected routing | Use `ProtectedRoute` for authenticated routes and `ProtectedRoute requireEvent` for event-scoped routes |
| App shell | Use pace-core2 shell/layout primitives (for example `PaceAppLayout`) and keep logo/home navigation aligned to `/` |
| Secure data access | Domain slices use `useSecureSupabase()` (or approved successor secure hook) rather than raw clients |
| Types | Regenerate from dev-db via pace-core2 `db:gen-types` when schema changes |

---

## pace-core2 imports (current reference pattern — confirm exact package version at implementation)

| Need | Import path | Notes |
|------|-------------|--------|
| Auth facade | `@solvera/pace-core` | `UnifiedAuthProvider`, `useUnifiedAuthContext` |
| Org / event context | `@solvera/pace-core/providers` | `OrganisationServiceProvider`, `EventServiceProvider`, `InactivityServiceProvider` |
| Protected routing / shell UI | `@solvera/pace-core/components` | `ProtectedRoute`, `PaceLoginPage`, `PaceAppLayout`, `LoadingSpinner`, login/shell/loading components as applicable |
| RBAC guards / setup | `@solvera/pace-core/rbac` | `setupRBAC`, `PagePermissionGuard`, `NavigationGuard`, `AccessDenied`, `useSecureSupabase` |
| Theming / tokens | `@solvera/pace-core/theming` | App theme attachment if required by shell |

*This slice follows the current pace-core2 shell contract; implementers verify exact symbols against the installed `@solvera/pace-core` package version.*

---

## Data and schema references

| Source | Use |
|--------|-----|
| **`trac-architecture.md`** | TRAC app id, RBAC model, `rbac_app_pages` page keys, pre-build prerequisites |
| **Supabase MCP (dev-db only)** | Confirm `rbac_app_pages`, app registration, permission function behaviour, and schema-sensitive columns |

This slice does not own `trac_*` domain tables but **must** load RBAC/page metadata needed for guards.

---

## Acceptance criteria

1. User can complete sign-in at `/login` and reach the authenticated shell with valid session.
2. `/user-dashboard` **redirects** to `/` (or equivalent home) without rendering a duplicate dashboard at that path unless explicitly routed (dashboard is SLICE-02 on `/` and `/dashboard` per architecture — clarify redirect target is **`/`** which owns dashboard in IA).
3. Unauthenticated access to protected routes redirects to login (or platform-standard behaviour).
4. Unknown paths under the authenticated app show **NotFound** (`*`) with accessible navigation back.
5. Org and event context are available to child routes via pace-core2 providers (or documented successor API).
6. Event-scoped routes use pace-core2 **`ProtectedRoute requireEvent`** (or documented successor API) with one approved TRAC no-event fallback.
7. RBAC secure client is configured once; domain slices use the same pattern (no parallel raw clients for privileged operations).
8. Shell renders without requiring domain slices to patch provider internals.
9. Authenticated NotFound remains reachable without requiring **`read:page.dashboard`**.

### Layout (prototype parity targets)

- [ ] Public `/login` renders without authenticated header, footer, or primary nav (prototype: `PaceLoginPage` only).
- [ ] Authenticated routes render vertical stack: header → main outlet → footer inside the shell (prototype: `PaceHeader` → `page-body` → `PaceFooter`).
- [ ] Authenticated home at `/` shows the event landing pattern: `PageHeader`, `EventTile` grid with show-more toggle, optional cross-event `AttentionQueue` (prototype `TracLandingPage`).
- [ ] Primary nav shows **Events** only when no event is in context; when an event is active, nav lists **Overview**, **Planning**, **Itinerary**, **Risks** (prototype `navItemsForRoute`).
- [ ] Header includes AppSwitcher for TRAC, org context selector, event context, user menu with **All events** back to home (prototype `PaceHeader`).
- [ ] Unknown authenticated paths show NotFound with 404 glyph, explanatory copy, and primary **Back to events** action to `/` (prototype `notFound`).
- [ ] Invalid event code in URL shows event-not-found surface with same structure and CTA (prototype `eventNotFound`).
- [ ] Event-scoped routes without a selected event use one shared route-level fallback only (not per-page prompts).

---

## API / Contract

| Boundary | Contract |
|----------|----------|
| **Auth** | Session establishment and teardown per pace-core2; no secrets in client bundle |
| **RBAC** | `check_rbac_permission_with_context`-style enforcement on server; client uses guards aligned to page keys in dev-db |
| **Routing** | React Router (or pace-core2 wrapper): public `/login`; protected layout wraps all TRAC feature routes owned by SLICE-02…10; event-scoped routes use pace-core2 `ProtectedRoute requireEvent` |
| **TRAC app** | Single TRAC application id in RBAC; page keys must match brief + dev-db |

No Edge Function requirement for this slice unless login flow depends on platform-wide functions (document if so when implementing).

### Route map (prototype → production)

Prototype uses hash routing (`#/…`); production uses `BrowserRouter` paths with event context from the header selector (not `/events/:code` in the URL).

| Prototype hash path | Production path | Shell / notes |
|---|---|---|
| `#/login` | `/login` | Public — no authenticated chrome |
| `#/` | `/` | Prototype: event picker (`TracLandingPage`); production pass-2 may use header event selector + dashboard when event selected |
| `#/events/:code` | `/`, `/dashboard` | Event overview content is SLICE-02 (`EventOverviewPage` in prototype) |
| `#/events/:code/planning` | `/planning` | Event-scoped |
| `#/events/:code/planning/new/:type` | *(pass 2 — planning slice)* | Full-page new item |
| `#/events/:code/planning/:itemId` | *(pass 2 — planning slice)* | Full-page item editor |
| `#/events/:code/itinerary` | `/itinerary` | Schedule mode |
| `#/events/:code/itinerary/full` | `/masterplan` or itinerary full mode | See TR10 |
| `#/events/:code/costs` | `/costs` | Event-scoped |
| `#/events/:code/costs/currency` | `/currency-rates` | RBAC `currency-rates` page key |
| `#/events/:code/risks` | `/risks` | Event-scoped |
| `#/events/:code/contacts` | `/contacts` | Event-scoped |
| `#/events/:code/journal` | `/journal` | Event-scoped |
| `#/user-dashboard` | `/user-dashboard` → `/` | Redirect only |
| unmatched | `*` | `NotFoundPage` inside authenticated shell |

Cross-links: event overview launcher grid → [TR02-dashboard-requirements.md](./TR02-dashboard-requirements.md); primary nav IA v1 → [trac-architecture.md](./trac-architecture.md#information-architecture-v1).

---

## Visual specification

### Shell variants

**Public auth** (`/login`):

- Full-viewport login only; no `PaceAppLayout` / `PaceHeader` / `PaceFooter`.
- Use pace-core `PaceLoginPage` with clear loading and error states.

**Authenticated main shell** (all routes under protected layout):

Vertical region stack (prototype → pace-core targets):

1. **Header** — `PaceAppLayout` / prototype `PaceHeader`:
   - AppSwitcher (`app="trac"`).
   - Organisation context selector (prototype shows org list; selecting org returns to home).
   - Event context selector when event-scoped routes are active (production: `showEvents` on `PaceAppLayout`).
   - Primary nav strip (items depend on landing vs event context — see Navigation).
   - User menu: **All events** → home; optional **Event settings** stub in prototype.
2. **Main** — `PaceMain` / prototype `page-body`: lazy `<Outlet />` for slice pages.
3. **Footer** — `PaceFooter` at shell bottom.

**Global overlays:**

- `ToastProvider` at app root (prototype and production).
- `ErrorBoundary` wrapping route tree.
- Session restoration loader during auth restore.
- Inactivity warning modal before forced logout (pace-core contract).
- Change-password dialog from user menu (production shell).

### Event landing (`TracLandingPage` at prototype `#/`)

Shell-owned pre-event home (not TR02 dashboard cards):

- `PageHeader`: breadcrumb `pace-trac` → **Events**; title **Choose an event**; subtitle stating how many events the user plans logistics for.
- **Empty:** `EmptyState` with calendar icon — events from the operator app appear here.
- **Populated:** `EventTile` grid in `event-tile-grid` section; default **4** tiles, **Show all (N)** / **Show fewer** toggle when more than four events.
- Each tile: event logo/glyph, date chip, title, date range, venue meta, footer counts (days, participants); click navigates to event overview.
- **AttentionQueue** below grid: cross-event open risks with warn tone; each item deep-links to that event’s risks register.

### Navigation behaviour

| Context | Prototype primary nav |
|---------|----------------------|
| No event in route (`#/`) | Single item **Events** → `/` |
| Event active (`#/events/:code/…`) | **Overview**, **Planning**, **Itinerary**, **Risks** |

Contacts, Journal, Costs, and Master plan are **not** primary nav items in the prototype; they are reached from the event overview launcher grid ([TR02](./TR02-dashboard-requirements.md)).

Nav items must respect RBAC permission wiring (`enforcePermissions` / `routePermissions` on `PaceAppLayout`).

### Error and fallback surfaces

**NotFound** (unknown path inside shell):

- Centered `not-found` region: large **404** glyph, **Page not found** heading, muted explanatory line, primary button **Back to events** → `/`.

**Event not found** (event code in URL does not match an operated event):

- Same layout as NotFound; heading **Event not found**; copy that the code is not one of the user’s events; primary **Back to events** → `/`.

**No event selected** (event-scoped route without context):

- Single shared fallback (`TracNoEventFallback` pattern in production): card with alert explaining event selection required and link to home — not duplicated on feature pages.

**Access denied:**

- `AccessDenied` from pace-core RBAC when route or page permission fails after shell loads.

### Implementation delta (pass 2)

- Prototype routes embed event code in URL (`#/events/:code/*`); production uses flat paths with header event selector.
- Prototype full-page event picker at `/` vs production header selector + `TracNoEventFallback` + event dashboard at `/` when event selected.
- Prototype primary nav is **four items** with **Overview** label; architecture v1 primary nav is **eight items** (Planning through Risks) with dashboard reached via `/` only — align nav in pass 2 per product choice or update architecture first.
- Prototype org selector in header; production may hide organisations (`showOrganisations: false`) and rely on event selector only.
- Prototype `PaceHeader`; production uses `PaceAppLayout` (already wired in `authenticated-routes.tsx`).
- Prototype Tweaks panel is prototype-only; not a rebuild requirement.

---

## Verification

- Manual: login, refresh, deep-link to protected route, logout.
- Confirm `/user-dashboard` redirect target matches IA.
- Confirm event-scoped routes use one consistent no-event fallback.
- Confirm NotFound for garbage path.
- Confirm event landing tile grid and attention queue when auditing against prototype.
- **Dev-db:** RBAC page rows exist for TRAC for pages referenced by guards in this slice (e.g. dashboard read if guard wraps home).

---

## Testing requirements

| # | Scenario | Type |
|---|----------|------|
| 1 | **Happy path:** User with valid credentials signs in and lands in authenticated shell with context loaded | Integration / E2E (mock or test project) |
| 2 | **Validation failure:** Invalid credentials or missing fields show non-crashing error (no unhandled rejection) | Integration |
| 3 | **Auth / permission failure:** User without TRAC/event access hits protected route → redirect or `AccessDenied`, not silent blank | Integration |

Plus: unit tests for any pure route-config or redirect helpers (no Supabase in unit tests).

---

## Open questions

*(None blocking — confirm page key strings for TRAC against dev-db during implementation.)*

---

## Do not

- Do not ship **`@solvera/pace-core`** as the declared dependency for new work.
- Do not use **production** DB for RBAC or page key verification.
- Do not implement domain CRUD in this slice.
- Do not add routes owned by other slices without updating `trac-architecture.md`.

---

## References

| Document | Role |
|----------|------|
| `trac-architecture.md` | IA v1, route ownership, high-risk notes, testing expectations, RBAC page keys |
| `trac-project-brief.md` | Authority model, exclusions, quality gates |
