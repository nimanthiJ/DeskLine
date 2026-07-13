# Decision Log

## Assumptions I made
- DeskLine is a small demo / teaching-scale app, so authentication and authorization are out of scope for this work.
- **`closed` ≠ “after resolved.”** `closed` means the ticket was ended **without** a normal resolution (duplicate, cancelled, spam, customer withdrew, etc.). `resolved` is the path where the issue was fixed; `resolved_at` applies to that path. Closing does not imply the SLA was met via a fix.

## Design decisions
### Ticket list filters + SLA status
- **Multi-select filters:** status and assignee both support selecting multiple values; filters combine with AND across types and OR within each type; omitting both returns the full list.
- **SLA at-risk threshold:** remaining time under **2 hours** is `at_risk` (hard-coded product rule, not configurable).
- **SLA badge values:** `on_track` | `at_risk` | `breached` | `complete`.
- **SLA clock:** only for `open` / `in_progress` — compare `now` to `created_at + sla_hours`. `resolved` and `closed` are complete states and always map to `complete` (no breach check).
- **`slaStatus` on the API:** computed in a shared TypeScript helper (not SQL `CASE`), returned on `GET /tickets` and `GET /tickets/:id` so list and detail share one DTO shape; detail UI also surfaces `slaHours` + the SLA badge.
- **Filter API:** repeated query params (`status`, `assigneeId`); assignee accepts positive ints and the sentinel `unassigned` (null `assignee_id`); filtering done in SQL via `ANY` / `IS NULL` for performance.
- **Validation:** UI only offers valid options; API still Zod-validates query params and returns 400 on bad input.
- **Assignee options:** `GET /users` supplies the assignee checkbox list; UI adds an Unassigned option.
- **Filter UI:** searchable multi-select dropdowns (checkboxes + search) for status and assignee so large assignee lists stay usable; **Apply** runs the query; **Clear** resets both and refetches unfiltered; filter state lives in React only (not mirrored in the URL).
- **Indexes:** add `tickets(status)` and `tickets(assignee_id)` with this feature so filtered list queries stay efficient.

## Where I used AI
- **Used for:** explore the current architecture (including the ER diagram), evaluate the existing implementation, implement filters + SLA with TDD practices, and check for performance issues on the new list/filter path (SQL filtering, indexes, avoiding load-all-then-filter).
- **Agentic skills (preferred over a plain AI chat alone):** structured skills keep analysis and implementation more accurate and repeatable. Skills used and why:
  - **`grill-me`** — stress-test the requirement before coding; surface ambiguous product rules and lock shared decisions.
  - **`/tdd`** — follow test-driven development at the agreed HTTP seams (`GET /tickets`, `GET /tickets/:id`, `GET /users`): write a failing behavioural test first, then only enough code to make it pass. That keeps the API contract as the source of truth, catches regressions early, and is more valuable than coding first and testing later because each slice proves a real requirement before the next one starts.
  - **`/code-review`** — two-axis review (Standards vs Spec) against the repo conventions and the locked design decisions / plan.
- **Implementation flow:**
  1. **`grill-me` the requirement** — combine the agent’s probing questions with my product answers. *Why grill-me:* a vague brief (“filter + SLA badge”) hides edge cases; grilling forces one decision at a time before any code, so we don’t build the wrong SLA or filter semantics.
  2. **Create a plan** to implement through the stack (schema/repo → API → UI) following existing conventions.
  3. **Review and update the plan** where needed.
  4. **Implement with `/tdd`** — build the API behaviour test-first at the HTTP seams, then wire the React list/detail.
  5. **Review the code** with `/code-review` to validate standards, spec fit, and regressions.

## Anything I noticed in the existing code

### Fixed
- **Issue:** Reopening a resolved ticket left `resolved_at` set. **Reason:** `updateStatus` only set `resolved_at` when status was `resolved`, and left it unchanged otherwise. **Fixed:** clear `resolved_at` unless status is `resolved`; TDD on `PATCH /tickets/:id/status`.
- **Issue:** `listTickets` performed N+1 queries. **Reason:** Per-row assignee + comment-count lookups (1 + 2N). **Fixed:** single join + subquery; list tests cover fixtures/order and a one-query budget.
- **Issue:** Invalid `assigneeId` on create returned 500. **Reason:** Zod allowed any positive int; missing user hit the FK and became a generic 500. **Fixed:** `AppError(400, Unknown assignee …)` before insert on `POST /tickets`.
- **Issue:** Auditable timestamps (`created_at`, `updated_at`) were left to application/repo SQL. **Reason:** The columns were already on the schema; the risk is not that they were missing, but that every service or repository `UPDATE` must remember to bump `updated_at` and must not overwrite `created_at`. If any path forgets that, audit data goes stale or wrong. **Fixed:** enforce both at DB level with shared `sync_row_timestamps()` triggers on `users`, `tickets`, and `comments` (preserve `created_at`, set `updated_at = now()` on UPDATE); app status SQL no longer sets timestamps by hand. Test asserts `updatedAt` bumps and `createdAt` is preserved on status change.
- **Issue:** React ticket detail could show a stale ticket after fast navigation. **Reason:** An older in-flight `GET /tickets/:id` could finish after a newer one and still call `setTicket`. **Fixed:** `AbortController` in `TicketDetail` aborts the previous request on `id` change/unmount and ignores `AbortError` (no new web tests added).

## What I'd do with more time
- **Authentication** — protect `POST` / `PATCH` ticket endpoints so writes are not open to anyone who can reach the API.
- **Indexes** — add indexes for list/filter paths (`created_at`, `comments.ticket_id`, `assignee_id`) so ticket queries stay fast as data grows.
- **Pagination** — page or cursor `GET /tickets` (and the UI list) instead of loading the full table every time.
- **Migrations** — replace drop/recreate seed with versioned schema migrations and a non-destructive demo seed.
- **Shared DTOs** — one shared ticket/comment type contract between `api` and `web` (or OpenAPI-generated types) to stop API/UI shape drift.
- **Comments feature** — write APIs and UI to add (and optionally edit/delete) comments on a ticket, not only read them on detail.
- **Status management** — agent UI to change ticket status (wired to the existing status endpoint), with clear transitions and feedback.
- **Edit functionalities** — implement editing for ticket fields (subject, description, priority, assignee, SLA) via API + UI, beyond create-and-status-only.
