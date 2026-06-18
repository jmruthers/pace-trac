# TRAC requirements audit queue (pass 1)

Pass 1 updates **requirement slices only** so layout matches the functional prototype. Do **not** change `src/` in this pass. Pass 2 (implementation) is deferred.

**Orchestration rule:** `.cursor/rules/trac-requirements-audit-pass1.mdc`

## How to kick off

Open the **pace-trac2** workspace (with **pace-prototype** and **pace-core2** siblings available for `@` references).

In **Plan** or **Agent** mode, send:

```text
Continue TRAC requirements pass 1 from docs/delivery/requirements-audit-queue.md
```

Optional modifiers: `— one slice only` · `— dry run` · `— from TR03`

## Status values

| Value | Meaning |
|-------|---------|
| `Pending` | Not yet audited |
| `In progress` | Agent is working this slice |
| `Done` | Requirement slice updated for prototype layout |
| `N/A` | No layout surface |

## Queue

Process in **`audit_order`** sequence. Slice ids **SLICE-NN** map to requirement files **TR0N-***.

| audit_order | slice_id | requirement_doc | prototype_refs | impl_hints | audit_status |
|---:|---|---|---|---|---|
| 1 | SLICE-01 / TR01 | [TR01-platform-shell-requirements.md](../requirements/TR01-platform-shell-requirements.md) | `pace-prototype/apps/pace-trac/app.jsx` (shell, routing, auth); `pages/OverviewPage.jsx` (`TracLandingPage`) | `src/App.tsx`, shell layout | Done |
| 2 | SLICE-03 / TR03 | [TR03-planning-logistics-requirements.md](../requirements/TR03-planning-logistics-requirements.md) | `pages/PlanningPage.jsx`, `PlanningNewPage`, `PlanningItemPage` (list + full-page edit) | `src/pages/planning/` | Done |
| 3 | SLICE-06 / TR06 | [TR06-contacts-requirements.md](../requirements/TR06-contacts-requirements.md) | `pages/ContactsPage.jsx` | contacts page | Done |
| 4 | SLICE-08 / TR08 | [TR08-journal-requirements.md](../requirements/TR08-journal-requirements.md) | `pages/JournalPage.jsx`, `JournalNewPage`, `JournalItemPage` | journal pages | Done |
| 5 | SLICE-04 / TR04 | [TR04-assignments-requirements.md](../requirements/TR04-assignments-requirements.md) | `pages/PlanningPage.jsx` (`PlanningItemPage` — **inline assignment panel**; prototype has no separate `/assignments` route) | `src/pages/assignments/` — note prod route split | Done |
| 6 | SLICE-05 / TR05 | [TR05-itinerary-requirements.md](../requirements/TR05-itinerary-requirements.md) | `pages/ItineraryPage.jsx` (schedule mode) | itinerary page | Done |
| 7 | SLICE-07 / TR07 | [TR07-costs-and-currency-requirements.md](../requirements/TR07-costs-and-currency-requirements.md) | `pages/CostsPage.jsx`, `CurrencyRatesPage` (under `#/events/:code/costs/currency`) | costs + currency routes | Done |
| 8 | SLICE-09 / TR09 | [TR09-risks-requirements.md](../requirements/TR09-risks-requirements.md) | `pages/RisksPage.jsx`, `RiskNewPage`, `RiskItemPage` | risks register | Done |
| 9 | SLICE-02 / TR02 | [TR02-dashboard-requirements.md](../requirements/TR02-dashboard-requirements.md) | `pages/OverviewPage.jsx` (`EventOverviewPage` — dashboard cards on event overview) | dashboard / home | Done |
| 10 | SLICE-10 / TR10 | [TR10-master-plan-requirements.md](../requirements/TR10-master-plan-requirements.md) | `pages/ItineraryPage.jsx` (`mode=full` / `#/events/:code/itinerary/full`) | master plan / printable view | Done |

## Prototype vs production routing notes

- Prototype uses hash routes under `#/events/:code/*`; production uses React Router paths from [trac-architecture.md](../requirements/trac-architecture.md).
- Prototype **folds assignments into** the planning item page; production **`/assignments`** is a dedicated route — requirement docs should describe **prototype layout** and note the pass-2 route split under **Implementation delta (pass 2)**.
- Prototype **master plan** is Itinerary **Full plan** mode; production may use `/masterplan` — capture both in TR10 audit.

## Prototype kit index

Routes: comment block in `pace-prototype/apps/pace-trac/app.jsx`.

Shared shell: `pace-prototype/apps/_pace-core/`.

## Pass 2

Implementation is tracked in [trac-build-queue.md](./trac-build-queue.md). Do not flip build queue rows during pass 1.
