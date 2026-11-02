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

**Status: implemented** (`app/verify_queue.py`, `admin_scope.verifiable_sql`, `tests/test_verify_queue.py`).
**Search (`q`) is proposed: contract only (PR 1 of 3).** The backend and the web search box follow.

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
  with other filters, or altered, is 422. With `q` the order is best match first (see Search).
- **Counts:** `counts` has all eight kinds (zero when none) and `total` is their sum. They ignore
  `entity_type` and `cursor`, so they stay the same while paging. They respect the same scope and count only
  unverified records.
- **Search (`q`), proposed (review changes applied):** an optional `q` on the same call, so an admin with hundreds of waiting
  records does not have to scroll. Same route, same scope, same item shape, same paging. A caller
  that does not send `q` sees no change.
  - **How a record matches.** `q` is split into at most 6 words (case ignored). Every word must match
    somewhere in the record's *searchable text*: the `name` the card shows, the school and
    department names in `belongs_to`, the kind (see Kind words), and the `source` (see Source text). A word matches
    when it is inside that text (a plain substring test, so partial words work and `%` or `_` mean
    nothing special) or, only for words of 4 or more letters, when pg_trgm `word_similarity(word,
    text)` is at least about 0.5 (typos: `compting`, `libary`). Short words such as `crc` must be
    inside the text, so a typo in a 3-letter word does not match noise.
  - **Kind words (review change: plurals and the tab labels).** Each kind matches its singular,
    its plural, and the label its tab shows in the app (`COPY.kinds` in
    `web/src/lib/adminCopy.ts`, which is English). The matching words are:

    | Kind | Words that match |
    |---|---|
    | faculties (tab: Schools) | school, schools, faculty, faculties |
    | departments | department, departments |
    | lecturers | lecturer, lecturers |
    | courses | course, courses |
    | class_reps (tab: Class reps) | class rep, class reps, class representative, class representatives |
    | buildings | building, buildings |
    | timetable_entries (tab: Class times) | class time, class times, timetable, timetables |
    | announcements (tab: Notices) | notice, notices, announcement, announcements |

    For **buildings**, the building type also matches, so `hostels` finds every hostel and `lecture
    halls` every lecture hall. The types with words are: hostel (hostel, hostels); lecture_hall
    (lecture hall, lecture halls, lecture theatre, lecture theatres, lecture theater, lecture
    theaters); library (library, libraries); sports (sports, sport); food (food); health (health);
    worship (worship); gate (gate, gates). The types `admin`, `department`, `faculty` and `other`
    have no words, because their words are already kind words or say nothing.
    So `courses`, typed on the All tab, finds courses.
  - **Source text (review change).** The importer stores a source as `<source> (collected by
    <name>, <date>)`. Only the part before ` (collected by ` is searched, so the collector's name
    and the date do not match. The card still shows the full stored text. A source that does not
    end with that note is searched in full.
  - **Ranking.** A word scores 1.0 if it is inside the text, otherwise its similarity. A match in
    the name counts in full, a match only in the place, kind or source counts 0.6 of that. A
    record's score is the average over its words, as a whole percent (so it fits in the cursor).
    Order: score (best first), then `created_at`, `entity_type`, `id`. The cutoffs and weights are
    starting values, to be tuned in the backend PR against the 163 collected building names. The
    tests keep `abiola`, `compting`, `lecture theatre`, `CRC` and `mosque` working.
  - **Paging.** The cursor also holds the last record's score and the normalised words, so a cursor
    made with another `q` is 422, like one made with another `entity_type`.
  - **Counts.** With `q`, `counts` and `total` count the matches of every kind (the tabs can show
    "Courses (4)" while searching), still ignoring `entity_type` and `cursor`. The Admin Home badge
    calls without `q`, so it still shows everything waiting.
  - **Scope.** The search condition is added with AND inside each branch, beside
    `admin_scope.verifiable_sql`, so it can only remove records. The parity test is extended: for
    every role and a spread of words, every result passes the per-record check `POST /admin/verify`
    uses, and a search with the broadest words returns a subset of the plain queue.
  - **Personal data.** Only what the card shows is read. Never lecturer `email` or
    `office_location`, class rep `contact` or `consent_given`, announcement `body`, or user ids. A
    test puts made-up values in those columns and shows that searching for them finds nothing.
  - **`q` is never logged (review change).** What an admin types is personal, so the API never
    writes `q` to a log. **This is not yet met by the design, and PR 2 cannot start until you choose
    how:** `q` is in the URL, and the installed uvicorn writes the request URL, query string included,
    to its access log (`uvicorn/protocols/http/h11_impl.py`, the `get_path_with_query_string` call).
    The hosting platform may also keep URL logs that the app cannot change.
    - **Option A (keep GET):** the access log for this route drops the query string, so `q` is
      never written. A test sends a made-up word and checks the log output for it. The platform's
      own URL logs would still hold it.
    - **Option B (POST):** `POST /admin/verify/search` with the words in a JSON body. Bodies are not
      in access logs or in most platform URL logs, so this is the only option that keeps the words out
      of every log we do not control. It is a new route and a second paging path, a bigger contract change.
  - **Why pg_trgm, and no migration.** `pg_trgm` is already created by `001_init.sql` (line 5) and
    is installed on the Neon dev branch (pg_trgm 1.6, PostgreSQL 18), so there is **no extension
    request and no new migration**. I tried the idea read-only on the dev branch with the 163
    collected building names: `abiola` finds 5 places, `compting` the 3 School of Computing rows,
    `lecture theatre` 7 (including the "Theater" spelling), `CRC` 3 and `mosque` 5. A query over
    20,000 made-up rows with 3 words ran in 67 ms of execution, with no index. The tables hold a few
    thousand rows, so there is no index. If one table passes about 20,000 waiting rows, add trigram
    GIN indexes in a numbered migration. The existing `idx_lecturers_name_trgm` and
    `idx_buildings_name_trgm` will not be used, because the searched text spans joined tables.
  - **Rejected.** Postgres full-text search (no typo tolerance, and it needs a stored column across
    joins); `ILIKE` alone (partial words but no typos); searching in the browser (the whole queue
    would have to reach a cheap phone); an external search service (a new dependency and cost).
  - **Tests.** The queue tests run the real SQL on SQLite, which has no `word_similarity`. The
    backend PR registers a Python version of pg_trgm's measure in `tests/sqlitedb.py`, and checks
    the real function with a read-only script against the dev branch, so the two cannot quietly differ.
  - **Tuning table (review change).** PR 2 includes a table of about 20 real test queries, each with
    what it returns in order (records, scores), taken from the dev branch and the 163 collected
    building names. The cutoffs and weights are changed on that table, not on guesses.
- **Errors, in order:** no or bad token 401; not an admin role 403 (the role is read from the
  database, as everywhere); bad query value, a `q` of more than 100 characters, or a bad cursor 422; database trouble 503 with `Retry-After: 5`
  (the existing handler). **There is no 404** because the route has no id in its path (the rule
  "404 before 403" is about records a caller names, and this call names none).
- **Caching:** `Cache-Control: no-store` (private to the admin).
- **Speed on Neon free tier:** at most two queries, in one connection: one `UNION ALL` of eight
  small branches (each `ORDER BY created_at, id LIMIT n+1`), and one query of eight `count(*)`.
  The biggest tables hold a few thousand rows, so a sequential scan is a few milliseconds and **no
  migration is needed**. If `EXPLAIN` on real data says otherwise, propose a
  partial index `(created_at, id) WHERE verification_status = 'unverified' AND deleted_at IS NULL`
  on `courses`, `timetable_entries` and `lecturers` as `002_*.sql`, with the numbers.
- **How it is built:** `admin_scope.verifiable_sql(admin, kind)` returns the SQL scope condition
  (one function, next to the per-record checks). `tests/test_verify_queue.py` runs every role against
  every kind and compares the queue with the per-record checks `POST /admin/verify` uses, so a change
  to one without the other fails. The tests run the real SQL on in-memory SQLite
  (`tests/sqlitedb.py`); the same SQL was also run read-only against the Neon dev branch
  (PostgreSQL 18) when it was written. The dev data is small (about 76 waiting records, no
  lecturers or courses yet), so it shows the SQL is valid and fast, not how an index would help at
  the real size. Re-run `EXPLAIN` after the real import.
- **One list of kinds:** the new schema `VerifiableEntityType` is the only list. `VerifyRequest.entity_type`
  now points at it, with the same eight values, so the two cannot drift.
- **Open:**
  - **Where `q` travels.** See *`q` is never logged* above. The choice between Option A and Option
    B is open, and the earlier claim that the API would not log it was wrong.
  - **Kind words (resolved in review).** The app's tabs use the English labels in `COPY.kinds`, so
    those are the words that match (see Kind words). No Pidgin tab names are added.
  - **Announcement bodies are not searched**, only titles, to keep the rule that no body leaves the
    server through this call.
  - The caller's role decides what a "department" means for `faculty_admin` of a soft-deleted
    department, exactly as `POST /admin/verify`: 403 there, and absent from the queue here.
