# SLICE-08 — Journal — Requirements

**Document status:** Draft — rebuild implementation contract.  
**Companion authority:** `trac-project-brief.md`, `trac-architecture.md`.

---

## Orchestration metadata (canonical)

| Field | Value |
|--------|--------|
| **Slice ID** | SLICE-08 |
| **Name** | Journal |
| **Bounded context** | Journal |
| **Owning routes** | `/journal` |
| **Depends on** | SLICE-01 |
| **Blocks** | — |
| **Implementation order** | 7 of 10 (may parallelise with SLICE-07 after SLICE-01 — coordinate merge) |
| **High-risk** | Yes — posts + **storage** + images; RLS nuance (images lack `event_id`) |
| **Cross-cutting** | Storage bucket policies; orphan handling |

---

## Overview

Event **journal** at `/journal`: **posts** with optional **images**, backed by **`trac_journal_posts`** and **`trac_journal_images`** + Supabase Storage. **RLS:** Both tables use `check_rbac_permission_with_context` with page key **`journal`** and TRAC app id (architecture — policy hygiene migration). **Critical:** `trac_journal_posts` passes `event_id` to permission checker; **`trac_journal_images` has no `event_id`** — pass `NULL` for event param in policy; **app must load images only via posts** (query posts filtered by `event_id`, join images), never a bare images list for event UI.

- Prototype reference: list, new, and item editors in `pace-prototype/apps/pace-trac/pages/JournalPage.jsx` (`JournalPage`, `JournalNewPage`, `JournalItemPage` — full-page routes, draft/publish dual actions).

---

## Rebuild target

- Posts CRUD for event; rich or plain text per schema.
- Image upload/delete tied to post; storage lifecycle follows the pace-core2 secure/storage-capable client contract and the explicit journal rules below.
- **Event-scoped UI:** Always anchor reads on `event_id` on posts; join images.
- Loading/error for storage failures; permission denied for journal page.
- **Standard RBAC only:** Journal uses the standard pace-core2 RBAC/RLS model for `journal`; do **not** add TRAC-specific super-admin branches or other slice-local access bypasses.
- **Storage contract (v1):**
  - Storage operations use the **secure/storage-capable client path** from pace-core2 (`useSecureSupabase()` when storage is exposed, or `useStorageCapableClient()` / approved successor). Do **not** use raw `createClient()` or service-role behaviour in the browser.
  - `trac_journal_images.id` is the canonical storage object key; insert the image row first, then upload bytes to the configured bucket using that `id`-based path (`bucket/{id}` pattern) per the TRAC domain contract.
  - Upload is always initiated from a post context; standalone image upload is not supported.
  - If the storage upload succeeds but the image-row follow-up metadata/update step fails, remove the newly uploaded object immediately and surface an actionable error. This follows the same rollback principle documented in pace-core2 attachment lifecycle helpers.
  - If an image delete path removes the storage object and storage deletion fails, the UI must surface the failure and treat it as incomplete cleanup; do not silently claim success.
  - Deleting a post cascades image rows in the database, but the storage object still requires explicit cleanup through the approved secure storage path; do not assume FK cascade removes the object from storage.
  - Event journal UI must never derive event scope from storage paths alone; event scope comes from posts.
- **Optional later (not v1 blocker):** denormalise `event_id` onto images per architecture note — **do not depend on it for v1**.

**Suggested sub-phases:** posts CRUD → image upload/delete → storage error paths.

---

## pace-core2 delta (vs legacy)

| Area | Rebuild |
|------|---------|
| RLS assumptions | `journal` page key; images scoped via posts |
| Client | pace-core2 + secure/storage-capable client |

---

## pace-core2 imports (expected)

| Need | Import path (expected) |
|------|------------------------|
| RBAC | `@solvera/pace-core/rbac` — `PagePermissionGuard`, `useSecureSupabase`, or `useStorageCapableClient` |
| Storage helpers | pace-core2 secure/storage-capable client path; attachment lifecycle principles from pace-core2 CRUD/storage docs |
| Components / forms | `@solvera/pace-core/components`, `@solvera/pace-core/forms` |
| Providers | `@solvera/pace-core/providers` |

---

## Data and schema references

| Table | Notes |
|-------|--------|
| `trac_journal_posts` | `event_id`; RLS with permission checker |
| `trac_journal_images` | `post_id` FK; **no** `event_id` column |
| Storage bucket | Policies per brief — **validate on dev-db**; object path uses image `id` per TRAC domain contract |
| **Supabase MCP (dev-db)** | **Verified (pace project):** `journal` RBAC alignment on posts and images per `20260418143100_fu011_fu027_policy_hygiene.sql` |

---

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Authorised user can create, edit, delete posts for the event. | **Complete** | [`useJournalPosts.ts`](../../src/hooks/journal/useJournalPosts.ts) mutations; [`JournalPage.tsx`](../../src/app/pages/JournalPage.tsx) + [`JournalPostEditor.tsx`](../../src/components/journal/JournalPostEditor.tsx); actions gated by `useResourcePermissions('journal')`. |
| 2 | Images upload and display when tied to a post; deleting posts or images follows the documented secure storage cleanup rules and does not silently ignore storage failure. | **Complete** | [`journal-image-lifecycle.ts`](../../src/hooks/journal/journal-image-lifecycle.ts); signed URLs in [`JournalImageThumbnail.tsx`](../../src/components/journal/JournalImageThumbnail.tsx); per-file upload progress; storage failures surfaced via toast/Alert. |
| 3 | UI **never** lists images without post/event filter. | **Complete** | Single query: `trac_journal_posts` `.eq('event_id', …)` with `trac_journal_images(*)` embed only. |
| 4 | Unauthorised users cannot read or write posts/images for the event. | **Complete** (app); **manual** (dev-db RLS) | `PagePermissionGuard pageName="journal"`; shell `/journal` → `journal` read; writes enforced by RLS + permission-gated UI. |
| 5 | Behaviour matches RLS tests for `journal` page key. | **Complete** (app); **manual** (dev-db) | App uses `journal` page key throughout; AC5 strategy and dev-db checklist in [TR08-slice-completion.md](../delivery/TR08-slice-completion.md). |

### Layout (prototype parity targets)

- [ ] List: `Tabs` filter All / Published / Drafts with counts; **New post** in header; post cards with status badge, linked title, author + publish meta, body preview, image placeholders, row actions (Edit, Publish for drafts, Delete).
- [ ] New post: full page with `BackLink`, section card for title + content + image list; footer **Cancel**, **Save as draft**, **Publish** (not single Save).
- [ ] Edit post: status badge + Delete in header; same fields; publish label **Update post** when already published.
- [ ] List quick **Publish** on draft cards without opening editor (prototype).

---

## API / Contract

- Post mutations via secure client; storage operations via pace-core2 secure/storage-capable client path only.
- Image rows reference `post_id` only; event derived from parent post.
- **No** direct client service-role storage.
- **No** TRAC-specific super-admin override logic in page or hook code; rely on standard pace-core2 RBAC + RLS behaviour only.

---

## Visual specification

### Journal list (`/journal`)

- `PageHeader`: breadcrumb; title **Journal**; subtitle draft vs publish semantics; **New post** primary action.
- **Status filter tabs:** All, Published, Drafts — each with count badge.
- **Post feed** (`journal-list`): each post in `Card`:
  - Status `Badge` (published vs draft).
  - Title as link button → item route.
  - Meta line: author, published date or “not yet published”.
  - Body text preview.
  - Image strip: placeholder tiles with optional captions.
  - Actions: **Edit**, **Publish** (draft only), delete icon.
- Empty: book glyph, **No posts yet**, CTA copy.

### New post (full-page — `#/events/:code/journal/new`)

- `BackLink` → journal list.
- `PageHeader`: **New journal post**.
- Section card **Post**: title input, content textarea, **Images** subsection with add/remove rows (caption per image).
- `JournalSaveBar` footer: Cancel | **Save as draft** (secondary) | **Publish** (primary).

### Edit post (full-page — `#/events/:code/journal/:postId`)

- Header: published/draft badge + **Delete** secondary.
- Same field card as new post.
- Footer: Cancel | **Save as draft** | **Publish** or **Update post** when already published.
- Not-found: 404 pattern with back to journal.

### Implementation delta (pass 2)

- Prototype image rows use caption placeholders; production uses real storage upload with progress ([TR08-slice-completion.md](../delivery/TR08-slice-completion.md)).
- Prototype routes under `#/events/:code/journal/*`; production flat `/journal` + nested routes.
- List inline Publish is optional parity; editor publish path is required.

---

## Verification

| Item | Status |
|------|--------|
| RLS: user without journal permission denied on dev-db. | **Manual — pending sign-off** (app: `PagePermissionGuard` + shell; see [TR08-slice-completion.md](../delivery/TR08-slice-completion.md)) |
| Upload rollback and delete failure paths surfaced correctly. | **Complete** (automated lifecycle tests + mutation toasts; UI integration for rollback in page tests) |

---

## Testing requirements

| # | Scenario | Type | Status |
|---|----------|------|--------|
| 1 | **Happy path:** Create post with image; appears in event journal | Integration (mock storage or test bucket) | **Complete** — [`JournalPage.integration.test.tsx`](../../src/app/pages/JournalPage.integration.test.tsx) (page create + image); [`useJournalPosts.test.tsx`](../../src/hooks/journal/useJournalPosts.test.tsx). |
| 2 | **Validation failure:** Upload rejected or metadata/update step fails after upload — user-visible error and rollback/cleanup behaviour triggered | Integration | **Complete** — [`journal-image-lifecycle.test.ts`](../../src/hooks/journal/journal-image-lifecycle.test.ts); destructive toast in [`JournalPage.integration.test.tsx`](../../src/app/pages/JournalPage.integration.test.tsx). |
| 3 | **Auth / permission failure:** No journal read — no post content leakage | Integration | **Complete** — [`JournalPage.integration.test.tsx`](../../src/app/pages/JournalPage.integration.test.tsx). |

Unit: storage path / key helpers, markdown sanitisation if applicable (pure). **Complete** — [`journal-storage.test.ts`](../../src/utils/journal-storage.test.ts), [`journal-content.test.ts`](../../src/utils/journal-content.test.ts).

---

## Open questions

*(None — architecture + **dev-db** verification: posts and images both use **`journal`** page key via `check_rbac_permission_with_context`; images pass **`NULL`** event id in checker.)*

---

## Do not

- Do not query `trac_journal_images` without post join for event UI.
- Do not put secrets in client.
- Do not bypass storage policies.

---

## References

| Document | Role |
|----------|------|
| `trac-architecture.md` | Journal RLS investigation, policy hygiene, tables and storage |
| `TR01-platform-shell-requirements.md` | Auth/shell |
