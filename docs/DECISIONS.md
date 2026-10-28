# Decisions (append new ones at the bottom)

| # | Decision | Why |
|---|---|---|
| 1 | Architecture diagram is the agreed plan | Team decision |
| 2 | Website first, mobile app later | Faster to ship; one codebase |
| 3 | Web is an installable **PWA** with offline + low-data support | Fast on Android/iOS, tiny download vs. app stores |
| 4 | Backend "services" are modules inside **one FastAPI app** | Same boundaries as the diagram, one thing to deploy and debug. Split into separate services only if there is a real need. |
| 5 | API contract (`docs/openapi.yaml`) and DB migrations are frozen; changes via lead-approved PR | Lets frontend/backend/data work in parallel without breaking each other |
| 6 | Plain-SQL migrations (`db/migrate.py`), PostGIS from day one | Simple to read and review; map/geo data needs it |
| 7 | `/sync` endpoint feeds an IndexedDB (Dexie) cache | One small request keeps the offline cache fresh |

## Deferred (not forgotten)
- Student verification method (matric number? school email?)
- Data privacy (NDPR) review and privacy policy
- Hostels/accommodation, AI assistant (RAG), notifications: phase 2/3
- Hosting, domain, monitoring

## 8. `/sync` is paged, with an overlap window on `server_time`

- **Decision:** `GET /sync` returns pages. It takes `cursor` (opaque, takes precedence over
  `since`) and `limit` (1–1000, default 500, counted across all collections). Every response
  has `next_cursor`, which is null on the last page. Clients must loop until it is null.
- **Why paging:** a first sync of all reference data and announcements can be large. One
  unbounded response must stay under Vercel's 4.5 MB response limit, and it is slow and
  costly on low-data phones. Row caps keep each response small and predictable.
- **Why an overlap window:** PostgreSQL `now()` returns the transaction start time, so a slow
  transaction can commit a row with an `updated_at` older than a `server_time` a client already
  holds. The client would never receive that row. Subtracting 60 seconds from the stored
  `server_time` makes the next sync re-fetch recent changes. Re-received rows are idempotent,
  since saving by id is safe to repeat.
- **Limits of the overlap:** it covers transactions shorter than 60 seconds. A longer transaction
  still needs `clock_timestamp()` in `set_updated_at()`, planned as a separate migration.
- **Rules that follow:**
  - Store `server_time` only from the last page. Storing it earlier can skip rows that later
    pages would have sent.
  - `full: true` only on the first page of a full sync, so clients clear their cache once.
  - Cursors expire after 24 hours and return 422, so the client restarts from its stored `since`.
  - The web client (`offline.ts`) must loop on `next_cursor` before the API ships with paging.
    Until then, large syncs silently lose rows.
- **Launch decision:** no scheduled announcements for launch. The create endpoint will force `published_at = now()`. Clients hide expired announcements locally, and the API does not filter on `expires_at`.
- **Open:** publishing and expiry happen with time, and `updated_at` does not change, so a
  scheduled announcement is not sent when it is published. Expired announcements are never
  tombstoned. Needs a decision (for example, sort announcements by `greatest(updated_at,
  published_at)`).

## 9. Who may verify what (`POST /admin/verify`)

- **Decision:** one admin call sets `verification_status` on one record. It changes nothing else.
  The role and the faculty/department come from the database row of the caller, never the token.
  The scope is read from the STORED record, never from the request.
- **Who may verify:**

  | Record | Who |
  |---|---|
  | faculties, buildings | `super_admin` only |
  | departments | `super_admin`; `faculty_admin` of that department's faculty; `department_admin` of that department |
  | lecturers, courses, class_reps, timetable_entries | `super_admin`; `faculty_admin` whose faculty owns the record's department; `department_admin` of that department |
  | announcements | the same rule as editing or deleting one (`app/admin_scope.py`, one shared copy). `sug` may verify only announcements with scope `sug` |

- **Order of checks:** unknown or soft-deleted record: 404. Outside the caller's scope: 403 (so a
  403 never reveals a record that does not exist). Rules that depend on the record: 422.
  A faculty admin gets 403 on a record of a soft-deleted department.
- **Statuses:** `verified` records `verified_by` (the caller) and `verified_at` (now).
  `outdated` keeps both as they were. `unverified` clears both.
- **Source rule:** `source` is optional, trimmed, at most 300 characters. If sent, it replaces the
  stored source. This is how the long technical seed sources get replaced by a person's own
  wording when they verify. A blank value counts as not sent: it never erases the stored source.
  **Setting `verified` needs a non-empty source**, either in the request or already stored,
  otherwise 422.
- **Idempotent:** the same status and source again returns 204 and writes nothing, so
  `verified_at`, `verified_by` and `updated_at` do not move, and a second admin cannot take over
  an existing verification by repeating it. A changed source on a verified record counts as a new
  verification (new verifier, new time).
- **Sync:** the update fires the `updated_at` trigger, and `/sync` returns every row with
  `updated_at > since`, so clients receive the new status on their next sync.
- **Open:** `entity_type` is mapped to a table by a fixed list in code. Editing a record's
  content (for example via the importer) does not reset its status; a person decides when
  something is outdated.

## 10. The verify queue (`GET /admin/verify/queue`)

**Status: contract only (this PR). The implementation and tests come in the next PR.**

- **Decision:** one read-only admin call lists the records waiting to be verified, inside the
  caller's own scope, with a count per kind. It feeds the Verify Data screen and the badge on the
  Admin Home card. It sits next to `POST /admin/verify` and covers the same eight kinds.
- **Same scope as `POST /admin/verify`, with a guarantee.** The queue shows exactly the records the
  caller could verify (table in decision 9). `app/admin_scope.py` holds the rules per record. A queue
  must filter in SQL (paging and counts cannot be done in Python), so the next PR adds one function
  to `admin_scope.py` that returns the SQL condition for each role and kind, next to the existing
  per-record checks. A test then runs every role against every kind and fails if the two ever
  disagree (every listed item passes `may_verify`; no verifiable unverified record is missing).
  Nothing in a route builds a scope condition by hand.
- **Roles:** `super_admin` everything. `faculty_admin` their faculty's departments, the records of
  those departments, and announcements for their faculty or those departments (faculties and
  buildings are `super_admin` only). `department_admin` their department, its records and its
  announcements. `sug` only `sug` announcements. Everyone else: 403. A faculty admin with no
  faculty, or a department admin with no department, sees an empty queue, not an error.
- **What is listed:** only records whose status is `unverified`. There is no `status` parameter:
  `verified` and `outdated` are never listed, and neither are soft-deleted rows. An optional
  `entity_type` narrows it. (Re-checking `outdated` records is not part of this queue.)
- **Item (just enough for a card):** `entity_type`, `id`, `name`, `belongs_to` (faculty and
  department, each `{id, name}` or null, plus `scope` for announcements), `source`, `created_at`,
  `updated_at`. `name` is built on the server from non-personal fields and is not localised.
  Clients send `entity_type` and `id` back to `POST /admin/verify`.
- **Never exposed (NDPR):** lecturer `email` and `office_location`; class rep `contact` and
  `consent_given`; user ids (`verified_by`, `author_id`); announcement bodies. Lecturer and class rep
  names are already public in the normal lists. The next PR adds a test that no item contains any
  of these keys.
- **Order and paging:** oldest first, by `(created_at, entity_type, id)`. Keyset paging with an
  opaque, signed `cursor` (the same approach as `/sync`), `limit` 1-200, **default 25** (smaller
  than the shared default of 50, because each item is a card; the maximum is unchanged). Offset paging
  is not offered: a record verified between two pages would shift every later row and skip one.
  Seed imports share one `created_at`, so `entity_type` and `id` break the ties. A cursor made
  with other filters, or altered, is 422.
- **Counts:** `counts` has all eight kinds (zero when none) and `total` is their sum. They ignore
  `entity_type` and `cursor`, so they stay the same while paging. They respect the same scope and count only
  unverified records.
- **Errors, in order:** no or bad token 401; not an admin role 403 (the role is read from the
  database, as everywhere); bad query value or cursor 422; database trouble 503 with `Retry-After: 5`
  (the existing handler). **There is no 404** because the route has no id in its path (the rule
  "404 before 403" is about records a caller names, and this call names none).
- **Caching:** `Cache-Control: no-store` (private to the admin).
- **Speed on Neon free tier:** at most two queries, in one connection: one `UNION ALL` of eight
  small branches (each `ORDER BY created_at, id LIMIT n+1`), and one query of eight `count(*)`.
  The biggest tables hold a few thousand rows, so a sequential scan is a few milliseconds and **no
  migration is needed for this PR**. If `EXPLAIN` on real data says otherwise, the next PR proposes a
  partial index `(created_at, id) WHERE verification_status = 'unverified' AND deleted_at IS NULL`
  on `courses`, `timetable_entries` and `lecturers` as `002_*.sql`, with the numbers.
- **In this PR:** `docs/openapi.yaml`, this note, the one-list change to `VerifyRequest`, a route that answers 501 (so
  `test_contract.py` passes with no logic, the same way other unbuilt routes started) and the
  regenerated `web/src/api/schema.d.ts` (CI fails if it is out of sync with the contract).
- **One list of kinds:** the new schema `VerifiableEntityType` is the only list. `VerifyRequest.entity_type`
  now points at it, with the same eight values, so the two cannot drift.
- **Open:**
  - The caller's role decides what a "department" means for `faculty_admin` of a soft-deleted
    department, exactly as `POST /admin/verify`: 403 there, and absent from the queue here.
