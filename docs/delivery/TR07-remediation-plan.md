# SLICE-07 — Costs & currency — Remediation plan

**Authority:** [TR07-costs-and-currency-requirements.md](../requirements/TR07-costs-and-currency-requirements.md)  
**Completion record:** [TR07-slice-completion.md](./TR07-slice-completion.md)  
**Opened:** 2026-05-21 (compliance review)

---

## Status

| Priority | Item | Status |
|----------|------|--------|
| P0 | Manual dev-db verification | Open |
| P1 | R2 per-participant amounts on `/costs` | Complete (2026-05-21) |
| P2 | Currency-rates auth + consumer export tests | Complete (2026-05-21) |
| P3 | Strengthen costs integration assertions | Complete (2026-05-21) |

---

## P0 — Manual dev-db verification (sign-off)

Run against target project `yihzsfcceciimdoiibif` (see [trac-backend-ready-report.md](./trac-backend-ready-report.md)).

### Checklist

1. Select an event with logistics costs, assignments, and at least one `trac_currency_rates` row.
2. Compare `/costs` **event total** to a manual calculation:
   - Per logistics row: `group_cost + (individual_cost * assigned_count)` in row currency (NULL → 0).
   - Convert each row total to org base currency using stored rates (foreign × `exchange_rate`).
   - Round each line in base to minor units, then sum.
3. Confirm displayed currency code matches `data_core_org_settings_base_currency(organisation_id)` for the event org.
4. On `/currency-rates`, edit a rate; confirm `/costs` totals refresh after navigation back.
5. Spot-check RLS: user without `read:page.costs` cannot load `/costs`; user without `currency-rates` CUD cannot mutate rates.

### Reference SQL (adjust `event_id`)

```sql
-- Row-level native totals + assignment counts
SELECT
  'transport' AS kind,
  t.id AS resource_id,
  t.currency,
  t.individual_cost,
  t.group_cost,
  COUNT(a.id) AS assigned_count,
  COALESCE(t.group_cost, 0) + COALESCE(t.individual_cost, 0) * COUNT(a.id) AS row_total_native
FROM trac_transport t
LEFT JOIN trac_itinerary_assignment a
  ON a.resource_type = 'transport' AND a.resource_id = t.id AND a.event_id = t.event_id
WHERE t.event_id = :event_id
GROUP BY t.id, t.currency, t.individual_cost, t.group_cost

UNION ALL

SELECT
  'accommodation',
  t.id,
  t.currency,
  t.individual_cost,
  t.group_cost,
  COUNT(a.id),
  COALESCE(t.group_cost, 0) + COALESCE(t.individual_cost, 0) * COUNT(a.id)
FROM trac_accommodation t
LEFT JOIN trac_itinerary_assignment a
  ON a.resource_type = 'accommodation' AND a.resource_id = t.id AND a.event_id = t.event_id
WHERE t.event_id = :event_id
GROUP BY t.id, t.currency, t.individual_cost, t.group_cost

UNION ALL

SELECT
  'activity',
  t.id,
  t.currency,
  t.individual_cost,
  t.group_cost,
  COUNT(a.id),
  COALESCE(t.group_cost, 0) + COALESCE(t.individual_cost, 0) * COUNT(a.id)
FROM trac_activity t
LEFT JOIN trac_itinerary_assignment a
  ON a.resource_type = 'activity' AND a.resource_id = t.id AND a.event_id = t.event_id
WHERE t.event_id = :event_id
GROUP BY t.id, t.currency, t.individual_cost, t.group_cost;

-- Rates for event
SELECT currency_code, exchange_rate
FROM trac_currency_rates
WHERE event_id = :event_id;

-- Base currency for org
SELECT data_core_org_settings_base_currency(:organisation_id);
```

### Sign-off record (fill when done)

| Field | Value |
|-------|-------|
| Event ID | |
| Organisation ID | |
| Verified by | |
| Date | |
| Notes | |

---

## P1 — Per-participant UI (complete)

Added [`CostsParticipantTable.tsx`](../../src/features/costs/components/CostsParticipantTable.tsx) listing R2 allocated totals per approved application, wired in [`CostsContent.tsx`](../../src/features/costs/CostsContent.tsx).

---

## P2 — Tests (complete)

- [`currency-rates-page.integration.test.tsx`](../../src/features/costs/currency-rates-page.integration.test.tsx) — AccessDenied without read
- [`consumer-export.test.ts`](../../src/features/costs/consumer-export.test.ts) — `@/features/costs` import smoke
- Updated [`costs.integration.test.tsx`](../../src/features/costs/costs.integration.test.tsx) — R2 participant amount assertion

---

## P3 — Integration assertions (complete)

See P2 `costs.integration.test.tsx` updates.
