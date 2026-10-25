# Campus data collection

You are building the most valuable part of the app: **correct, sourced information.**
Fill the CSVs in `data/templates/`: copy them to `data/collected/<faculty>/` and work there (see *Folder layout* below).

## Rules
1. **One row = one fact. Every row needs `source`, `collected_by`, `date_collected`.**
   - `source`: where you got it. Examples: "department notice board", "HOD office", "faculty website", "told by class rep".
   - `date_collected`: `YYYY-MM-DD`.
2. **Never guess.** Leave the cell empty if you don't know.
3. **Use exact names.** `faculty_name` / `department_name` must match the spelling in `faculties.csv` / `departments.csv` exactly. Fill those two files first.
4. **Personal data (NDPR):**
   - Lecturers: official school email and office only. No personal phone numbers.
   - Class reps: only put a `contact` if they agreed. Set `consent_given` to `yes` or `no`. No consent = leave `contact` empty.
5. Save as **CSV UTF-8**. Don't rename or reorder columns. Don't add formatting or merged cells.
6. Do **one faculty at a time** and finish it before starting the next.

## Order
`faculties.csv` → `departments.csv` → `lecturers.csv`, `courses.csv`, `class_reps.csv` → `buildings.csv` → `timetable.csv`

## Column notes
| File | Column | Format / example |
|---|---|---|
| departments | `hod_name` | `Prof. A. B. Surname` |
| lecturers | `title` / `rank` | `Dr.` / `Senior Lecturer` |
| courses | `code` | `CSC 101` (as printed in the course list) |
| courses | `units`, `level`, `semester` | `3`, `100`, `1` (or `2`) |
| class_reps | `level` | `100`, `200`, … |
| buildings | `type` | one of: faculty, department, lecture_hall, hostel, admin, library, sports, food, health, worship, gate, other |
| buildings | `lat`, `lng` | decimals, e.g. `7.3011`, `5.1366` (stand at the entrance when recording) |
| timetable | `day_of_week` | `1` = Monday … `7` = Sunday |
| timetable | `start_time`, `end_time` | 24-hour `HH:MM`, e.g. `08:00` |
| timetable | `venue_name` | must match a `name` in `buildings.csv`, otherwise use `venue_note` |

## Folder layout
```
data/
  faculties.csv, departments.csv        (imported first, by db/import_seed.py)
  templates/                            (empty copies of every CSV: do not edit)
  collected/
    <faculty folder>/                   (one folder per faculty or per collector, any name)
      lecturers.csv
      courses.csv
      class_reps.csv
      buildings.csv
      timetable.csv
```
- Use exactly these five file names. A CSV with another name, or in the wrong place, is ignored (the report says so).
- The files from **all** folders are combined into one import, so a building or course in one folder can be used by a timetable in another.
- Each file's header row must be exactly the template's: same columns, same order.
- The same fact must not appear twice (see the keys below). The same lecturer in two folders is an error, so the report shows both lines.

## Check your files before opening a PR
Run this from the repo root. It needs **no database** and no `DATABASE_URL`.

Windows:
```
.venv\Scripts\python.exe db/import_collected.py --check
```
Mac/Linux: `.venv/bin/python db/import_collected.py --check`

It prints every error with the file name and line number (line 1 is the header), plus warnings. It exits with an error code if anything is wrong, so fix the errors and run it again until it says `No errors.`

What it checks: all columns present and in order, UTF-8 (Excel's BOM is fine), the three provenance columns on every row (`date_collected` as `YYYY-MM-DD`, not in the future), field formats and limits, duplicate rows, and that every department name matches `departments.csv`. A wrong department name lists the closest real names.

Notes on names: leading/trailing spaces, repeated spaces and upper/lower case do not matter when names are matched.

Rules that are **errors**: a phone number in a lecturer row; a class rep `contact` when `consent_given` is not `yes`; `consent_given` that is not `yes`/`no`; a building outside the FUTA/Akure box (`lat` 7.2 to 7.4, `lng` 5.0 to 5.3); `end_time` not after `start_time`; units outside 0-12; level not 100-700 (courses also need a multiple of 100); semester not 1 or 2.

Rules that are **warnings** (the file still passes): a lecturer email that is not `@futa.edu.ng`; a timetable `venue_name` that matches no building (fix the spelling, or leave it empty and use `venue_note`); a cell that starts with `=`, `+`, `-` or `@` (it is imported as plain text, never run as a formula); a timetable course that is not in your `courses.csv` (`--check` cannot see the database, so the dry run checks that).

The keys that identify a row (the importer matches existing rows with these):

| File | A row is the same fact when these match |
|---|---|
| lecturers | department + full name |
| courses | department + code (`CSC101` and `csc 101` both become `CSC 101`) |
| class_reps | department + level + full name |
| buildings | name |
| timetable | department + level + semester + course code + day + start time |

## Importing into the database (backend / lead)
Faculties and departments first: `python db/import_seed.py`. Then, with `DATABASE_URL` set (as for `db/import_seed.py`):

- `python db/import_collected.py`: **dry run**. Connects read-only and prints, per kind and per file, how many rows would be created, updated, skipped (unchanged) or are in conflict, plus every error. Nothing is written.
- `python db/import_collected.py --apply`: writes the plan in **one transaction** (all or nothing), in this order: lecturers, courses, class reps, buildings, timetable. It only runs when there are zero errors, and it refuses a pooled (`-pooler`) database host. The report shows only a masked host, never the connection string.

What the import does and does not do:
- Every imported row is `unverified`, with the source stored as `<source> (collected by <collected_by>, <date_collected>)`. It never sets `verified_by`, `verified_at` or any other status.
- A row that is already `verified` or `outdated` is never overwritten. If the files differ from it, it is listed as a **conflict** for a human to resolve.
- A blank cell never clears existing data. Nothing is deleted. A row missing from the files is left alone. A row someone soft-deleted is not brought back: it is listed as a conflict.
- Running it twice with the same files changes nothing.
- Class reps: `consent_given` is stored as `true` only when it is `yes`, and the contact is kept only then.
