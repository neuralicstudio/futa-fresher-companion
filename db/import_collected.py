"""Import the collected data (lecturers, courses, class reps, buildings, timetable) from CSV.

Reads every data/collected/<folder>/<name>.csv for the names lecturers, courses, class_reps,
buildings and timetable. Files from all folders are combined. See data/README.md.

Usage (from repo root; on Windows use .venv\\Scripts\\python.exe):
  python db/import_collected.py --check    # files only. No database, no DATABASE_URL.
  python db/import_collected.py            # dry run: read-only database, prints the plan
  python db/import_collected.py --apply    # writes the plan, only if there are zero errors
--apply writes in ONE transaction (all or nothing), in this order: lecturers, courses,
class_reps, buildings, timetable. It refuses a pooled DATABASE_URL host.
DATABASE_URL comes from the environment or .env, as in db/import_seed.py.

Rules (same as db/import_seed.py, see data/README.md):
  - Every row needs source, collected_by and date_collected. The source is stored as
    "<source> (collected by <collected_by>, <date_collected>)".
  - Imported rows are 'unverified'. This script never sets verified_by or verified_at, and
    never sets a verification status other than 'unverified'.
  - Verified or outdated rows are never overwritten: a change to one is a conflict for a human.
  - A blank CSV value never clears data. Nothing is deleted or soft-deleted. A row missing from
    the CSV is left alone. A row whose only difference is the source text is left alone.
  - A matching row that a person soft-deleted is not brought back: it is a conflict.
  - Re-running the same files changes nothing.
  - Cell contents are never evaluated. They are plain text.
"""

import argparse
import csv
import difflib
import io
import pathlib
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from datetime import date, time
from decimal import Decimal, InvalidOperation
from typing import Any, Literal
from urllib.parse import urlsplit

import psycopg

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
# The import below needs the path line above, so it cannot come first.
import import_seed  # noqa: E402

ROOT = import_seed.ROOT
DATA = import_seed.DATA
COLLECTED = DATA / "collected"

# Dependency order: timetable points at courses and buildings, so it comes last.
KINDS = ("lecturers", "courses", "class_reps", "buildings", "timetable")
COMMON = ("source", "collected_by", "date_collected")
# The header of each file must be exactly this. A test compares it with data/templates/.
COLUMNS: dict[str, tuple[str, ...]] = {
    "lecturers": (
        "department_name",
        "full_name",
        "title",
        "rank",
        "email",
        "office_location",
        "specialization",
        *COMMON,
    ),
    "courses": ("department_name", "code", "title", "units", "level", "semester", *COMMON),
    "class_reps": ("department_name", "level", "full_name", "contact", "consent_given", *COMMON),
    "buildings": ("name", "type", "description", "lat", "lng", *COMMON),
    "timetable": (
        "department_name",
        "level",
        "semester",
        "course_code",
        "day_of_week",
        "start_time",
        "end_time",
        "venue_name",
        "venue_note",
        *COMMON,
    ),
}
# Columns that hold free text: checked for control characters, length and a leading = + - @.
TEXT_COLUMNS: dict[str, tuple[str, ...]] = {
    "lecturers": (
        "department_name",
        "full_name",
        "title",
        "rank",
        "email",
        "office_location",
        "specialization",
        "source",
        "collected_by",
    ),
    "courses": ("department_name", "code", "title", "source", "collected_by"),
    "class_reps": ("department_name", "full_name", "contact", "source", "collected_by"),
    "buildings": ("name", "description", "source", "collected_by"),
    "timetable": (
        "department_name",
        "course_code",
        "venue_name",
        "venue_note",
        "source",
        "collected_by",
    ),
}
# Limits chosen for the importer (the schema only says text). source plus collected_by plus the
# fixed words and the date must fit in COMPOSED_SOURCE_MAX: 190 + 80 + 28 = 298.
SOURCE_MAX = 190
COLLECTED_BY_MAX = 80
COMPOSED_SOURCE_MAX = 300
LIMITS: dict[str, dict[str, int]] = {
    "lecturers": {
        "department_name": 120,
        "full_name": 120,
        "title": 40,
        "rank": 60,
        "email": 254,
        "office_location": 200,
        "specialization": 200,
    },
    "courses": {"department_name": 120, "code": 20, "title": 200},
    "class_reps": {"department_name": 120, "full_name": 120, "contact": 60},
    "buildings": {"name": 120, "description": 500},
    "timetable": {"department_name": 120, "course_code": 20, "venue_name": 120, "venue_note": 200},
}
for _limits in LIMITS.values():
    _limits.update(source=SOURCE_MAX, collected_by=COLLECTED_BY_MAX)

BUILDING_TYPES = (
    "faculty",
    "department",
    "lecture_hall",
    "hostel",
    "admin",
    "library",
    "sports",
    "food",
    "health",
    "worship",
    "gate",
    "other",
)
# A box around FUTA / Akure. A building outside it is almost certainly a typo.
LAT_MIN, LAT_MAX = Decimal("7.2"), Decimal("7.4")
LNG_MIN, LNG_MAX = Decimal("5.0"), Decimal("5.3")
OFFICIAL_DOMAIN = "futa.edu.ng"

DATE_PATTERN = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")
EMAIL_PATTERN = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
INTEGER_PATTERN = re.compile(r"[0-9]{1,6}")
DECIMAL_PATTERN = re.compile(r"-?[0-9]{1,3}(\.[0-9]{1,12})?")
TIME_PATTERN = re.compile(r"([0-9]{1,2}):([0-9]{2})")
CODE_PATTERN = re.compile(r"([A-Z]{2,6}) ?([0-9]{2,4})")
# A run of 9 or more digits, with spaces, dots, dashes or brackets inside: looks like a phone.
PHONE_PATTERN = re.compile(r"(?<!\w)\+?[\d(][\d ().-]{6,}\d")
PHONE_MIN_DIGITS = 9
FORMULA_START = ("=", "+", "-", "@")
# Shown in reports as a changed field name only. The values are never printed.
SENSITIVE_FIELDS = ("email", "contact")

Kind = Literal["insert", "update", "unchanged", "conflict"]


# ----------------------------------------------------------------- text helpers


def clean(value: str) -> str:
    """Unicode NFC, invisible format characters removed, whitespace trimmed and collapsed."""
    value = unicodedata.normalize("NFC", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Cf")
    return " ".join(value.split())


def match_key(value: str) -> str:
    """What names are compared by: normalised (NFKC), whitespace collapsed, case-insensitive."""
    return unicodedata.normalize("NFKC", clean(value)).casefold()


def normalise_code(value: str) -> str | None:
    """'csc101' and 'CSC  101' become 'CSC 101'. None if it is not letters then digits."""
    found = CODE_PATTERN.fullmatch(clean(value).upper())
    return f"{found.group(1)} {found.group(2)}" if found else None


# ----------------------------------------------------------------- reading files


@dataclass(frozen=True)
class Row:
    line: int  # the line where the record starts in the file
    values: dict[str, str]


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def error(self, where: str, text: str) -> None:
        self.errors.append(f"{where}: {text}" if where else text)

    def warn(self, where: str, text: str) -> None:
        self.warnings.append(f"{where}: {text}" if where else text)


def parse_collected_csv(
    text: str, columns: tuple[str, ...], filename: str
) -> tuple[list[Row], list[str]]:
    """Parse CSV text. The header must be exactly the template's. Cells are cleaned."""
    text = text.lstrip("﻿")  # the byte order mark Excel adds
    reader = csv.reader(io.StringIO(text, newline=""))
    header_row = next(reader, None)
    if header_row is None:
        return [], [f"{filename}: the file is empty"]

    header = [clean(cell).lower() for cell in header_row]
    expected = ",".join(columns)
    problems = []
    for column in columns:
        if column not in header:
            problems.append(f"{filename} line 1: missing column '{column}'")
    for column in header:
        if column not in columns:
            problems.append(f"{filename} line 1: unknown column '{column}'")
    if len(set(header)) != len(header):
        problems.append(f"{filename} line 1: a column appears more than once")
    if not problems and header != list(columns):
        problems.append(f"{filename} line 1: columns are in a different order")
    if problems:
        problems.append(f"{filename} line 1: the header row must be exactly: {expected}")
        return [], problems

    rows = []
    while True:
        start = reader.line_num + 1
        try:
            values = next(reader)
        except StopIteration:
            break
        except csv.Error as error:
            problems.append(f"{filename} line {start}: not readable as CSV ({error})")
            break
        if not any(value.strip() for value in values):
            continue  # Excel often leaves blank lines
        if len(values) != len(header):
            problems.append(
                f"{filename} line {start}: {len(values)} values, expected {len(header)}"
            )
            continue
        rows.append(Row(start, {h: clean(v) for h, v in zip(header, values, strict=True)}))
    return rows, problems


def find_files(collected: pathlib.Path) -> tuple[dict[str, list[pathlib.Path]], list[str]]:
    """Files at <collected>/<folder>/<name>.csv for the five names, sorted. Plus notes about any
    other CSV that was found and ignored."""
    found: dict[str, list[pathlib.Path]] = {kind: [] for kind in KINDS}
    ignored = []
    if not collected.is_dir():
        return found, ignored
    for path in sorted(collected.rglob("*")):
        if not path.is_file() or path.suffix.lower() != ".csv":
            continue
        relative = path.relative_to(collected)
        if len(relative.parts) == 2 and path.stem.lower() in found:
            found[path.stem.lower()].append(path)
        else:
            ignored.append(
                f"{'/'.join(relative.parts)}: ignored. Files must be "
                "data/collected/<folder>/<lecturers|courses|class_reps|buildings|timetable>.csv"
            )
    return found, ignored


def display_name(path: pathlib.Path, collected: pathlib.Path) -> str:
    return "/".join(path.relative_to(collected).parts)


# ----------------------------------------------------------------- validated items


@dataclass(frozen=True)
class Dept:
    ref: str  # the database id, or a name-based stand-in when checking files only
    name: str
    faculty: str


@dataclass(frozen=True)
class Ref:
    """A row that is created earlier in the same run. Its id is known only when applying."""

    table: str
    key: tuple


@dataclass
class Item:
    kind: str
    file: str
    line: int
    label: str
    key_rest: tuple
    values: dict[str, Any]
    dept_name: str | None = None
    dept: Dept | None = None

    @property
    def where(self) -> str:
        return f"{self.file} line {self.line}"

    @property
    def key(self) -> tuple:
        return (self.dept.ref, *self.key_rest) if self.dept else self.key_rest


def check_text(report: Report, where: str, kind: str, column: str, value: str) -> None:
    if any(unicodedata.category(ch) == "Cc" for ch in value):
        report.error(where, f"{column} contains a control character")
    limit = LIMITS[kind].get(column)
    if limit and len(value) > limit:
        report.error(where, f"{column} is longer than {limit} characters")
    # Never evaluated: a formula in a cell is only text. contact starts with + in a phone number.
    if value.startswith(FORMULA_START) and column != "contact":
        report.warn(
            where,
            f"{column} starts with '{value[0]}'. It is stored as plain text; "
            "check it is not a spreadsheet formula",
        )


def check_no_phone(report: Report, where: str, values: dict[str, str], columns) -> None:
    """The README forbids personal phone numbers. The number itself is never printed."""
    for column in columns:
        for found in PHONE_PATTERN.finditer(values[column]):
            if sum(ch.isdigit() for ch in found.group()) >= PHONE_MIN_DIGITS:
                report.error(
                    where, f"{column} looks like a phone number. Remove it (no personal numbers)"
                )
                break


def source_text(report: Report, where: str, values: dict[str, str], today: date) -> str | None:
    """'<source> (collected by <collected_by>, <date_collected>)', or None with errors reported."""
    ok = True
    for column in COMMON:
        if not values[column]:
            report.error(
                where, f"{column} is empty (every row needs source, collected_by and date)"
            )
            ok = False
    when = values["date_collected"]
    if when:
        if not DATE_PATTERN.fullmatch(when):
            report.error(where, "date_collected must look like YYYY-MM-DD")
            ok = False
        else:
            try:
                collected_on = date.fromisoformat(when)
            except ValueError:
                report.error(where, "date_collected is not a real date")
                ok = False
            else:
                if collected_on > today:
                    report.error(where, "date_collected is in the future")
                    ok = False
    if not ok:
        return None
    composed = f"{values['source']} (collected by {values['collected_by']}, {when})"
    if len(composed) > COMPOSED_SOURCE_MAX:  # cannot happen while the limits above hold
        report.error(where, f"source is longer than {COMPOSED_SOURCE_MAX} characters")
        return None
    return composed


def need(report: Report, where: str, values: dict[str, str], column: str) -> bool:
    if values[column]:
        return True
    report.error(where, f"{column} is empty")
    return False


def whole_number(
    report: Report,
    where: str,
    values: dict[str, str],
    column: str,
    low: int,
    high: int,
    multiple_of: int | None = None,
) -> int | None:
    if not need(report, where, values, column):
        return None
    text = values[column]
    if not INTEGER_PATTERN.fullmatch(text):
        report.error(where, f"{column} must be a whole number")
        return None
    number = int(text)
    if not low <= number <= high:
        report.error(where, f"{column} must be between {low} and {high}")
        return None
    if multiple_of and number % multiple_of:
        report.error(where, f"{column} must be a multiple of {multiple_of} (100, 200, ...)")
        return None
    return number


def clock_time(report: Report, where: str, values: dict[str, str], column: str) -> time | None:
    if not need(report, where, values, column):
        return None
    found = TIME_PATTERN.fullmatch(values[column])
    if not found or int(found.group(1)) > 23 or int(found.group(2)) > 59:
        report.error(where, f"{column} must be 24-hour HH:MM, for example 08:00")
        return None
    return time(int(found.group(1)), int(found.group(2)))


def text_or_none(value: str) -> str | None:
    return value or None


def validate_lecturers(rows: list[Row], filename: str, today: date, report: Report) -> list[Item]:
    items = []
    for row in rows:
        v, where = row.values, f"{filename} line {row.line}"
        before = len(report.errors)
        for column in TEXT_COLUMNS["lecturers"]:
            check_text(report, where, "lecturers", column, v[column])
        check_no_phone(report, where, v, TEXT_COLUMNS["lecturers"])
        need(report, where, v, "department_name")
        need(report, where, v, "full_name")
        email = v["email"].lower()
        if email:
            if not EMAIL_PATTERN.fullmatch(email):
                report.error(where, "email does not look like an email address")
            else:
                domain = email.rsplit("@", 1)[1]
                if domain != OFFICIAL_DOMAIN and not domain.endswith("." + OFFICIAL_DOMAIN):
                    report.warn(
                        where,
                        f"email is not an @{OFFICIAL_DOMAIN} address. "
                        "Only the official school email belongs here",
                    )
        source = source_text(report, where, v, today)
        if len(report.errors) > before or source is None:
            continue
        items.append(
            Item(
                "lecturers",
                filename,
                row.line,
                v["full_name"],
                (match_key(v["full_name"]),),
                {
                    "full_name": v["full_name"],
                    "title": text_or_none(v["title"]),
                    "rank": text_or_none(v["rank"]),
                    "email": text_or_none(email),
                    "office_location": text_or_none(v["office_location"]),
                    "specialization": text_or_none(v["specialization"]),
                    "source": source,
                },
                dept_name=v["department_name"],
            )
        )
    return items


def validate_courses(rows: list[Row], filename: str, today: date, report: Report) -> list[Item]:
    items = []
    for row in rows:
        v, where = row.values, f"{filename} line {row.line}"
        before = len(report.errors)
        for column in TEXT_COLUMNS["courses"]:
            check_text(report, where, "courses", column, v[column])
        need(report, where, v, "department_name")
        code = None
        if need(report, where, v, "code"):
            code = normalise_code(v["code"])
            if code is None:
                report.error(where, "code must be letters then digits, for example CSC 101")
        need(report, where, v, "title")
        units = whole_number(report, where, v, "units", 0, 12)
        level = whole_number(report, where, v, "level", 100, 700, multiple_of=100)
        semester = whole_number(report, where, v, "semester", 1, 2)
        source = source_text(report, where, v, today)
        if len(report.errors) > before or source is None:
            continue
        items.append(
            Item(
                "courses",
                filename,
                row.line,
                str(code),
                (code,),
                {
                    "code": code,
                    "title": v["title"],
                    "units": units,
                    "level": level,
                    "semester": semester,
                    "source": source,
                },
                dept_name=v["department_name"],
            )
        )
    return items


def validate_class_reps(rows: list[Row], filename: str, today: date, report: Report) -> list[Item]:
    items = []
    for row in rows:
        v, where = row.values, f"{filename} line {row.line}"
        before = len(report.errors)
        for column in TEXT_COLUMNS["class_reps"]:
            check_text(report, where, "class_reps", column, v[column])
        # The contact column is where a phone number belongs, so it is the one not checked.
        check_no_phone(report, where, v, [c for c in TEXT_COLUMNS["class_reps"] if c != "contact"])
        need(report, where, v, "department_name")
        need(report, where, v, "full_name")
        level = whole_number(report, where, v, "level", 100, 700)
        if level is not None and level % 100:
            report.warn(where, "level is not a multiple of 100. Check it is right")
        consent = v["consent_given"].lower()
        if consent not in ("yes", "no"):
            report.error(where, "consent_given must be yes or no")
        elif consent == "no" and v["contact"]:
            report.error(where, "contact must be empty when consent_given is not yes (NDPR)")
        elif consent == "yes" and not v["contact"]:
            report.error(where, "consent_given is yes but contact is empty")
        source = source_text(report, where, v, today)
        if len(report.errors) > before or source is None:
            continue
        items.append(
            Item(
                "class_reps",
                filename,
                row.line,
                f"{v['full_name']} ({level} level)",
                (level, match_key(v["full_name"])),
                {
                    "level": level,
                    "full_name": v["full_name"],
                    "contact": text_or_none(v["contact"]) if consent == "yes" else None,
                    "consent_given": consent == "yes",
                    "source": source,
                },
                dept_name=v["department_name"],
            )
        )
    return items


def decimal_in_box(
    report: Report, where: str, values: dict[str, str], column: str, low: Decimal, high: Decimal
) -> float | None:
    if not need(report, where, values, column):
        return None
    text = values[column]
    try:
        number = Decimal(text) if DECIMAL_PATTERN.fullmatch(text) else None
    except InvalidOperation:  # cannot happen after the pattern, kept as a guard
        number = None
    if number is None:
        report.error(where, f"{column} must be a decimal number, for example 7.3011")
        return None
    if not low <= number <= high:
        report.error(where, f"{column} must be between {low} and {high} (the FUTA / Akure area)")
        return None
    return float(number)


def validate_buildings(rows: list[Row], filename: str, today: date, report: Report) -> list[Item]:
    items = []
    for row in rows:
        v, where = row.values, f"{filename} line {row.line}"
        before = len(report.errors)
        for column in TEXT_COLUMNS["buildings"]:
            check_text(report, where, "buildings", column, v[column])
        need(report, where, v, "name")
        kind = v["type"].lower()
        if need(report, where, v, "type") and kind not in BUILDING_TYPES:
            report.error(where, f"type must be one of: {', '.join(BUILDING_TYPES)}")
        lat = decimal_in_box(report, where, v, "lat", LAT_MIN, LAT_MAX)
        lng = decimal_in_box(report, where, v, "lng", LNG_MIN, LNG_MAX)
        source = source_text(report, where, v, today)
        if len(report.errors) > before or source is None:
            continue
        items.append(
            Item(
                "buildings",
                filename,
                row.line,
                v["name"],
                (match_key(v["name"]),),
                {
                    "name": v["name"],
                    "type": kind,
                    "description": text_or_none(v["description"]),
                    "lat": lat,
                    "lng": lng,
                    "source": source,
                },
            )
        )
    return items


def validate_timetable(rows: list[Row], filename: str, today: date, report: Report) -> list[Item]:
    items = []
    for row in rows:
        v, where = row.values, f"{filename} line {row.line}"
        before = len(report.errors)
        for column in TEXT_COLUMNS["timetable"]:
            check_text(report, where, "timetable", column, v[column])
        need(report, where, v, "department_name")
        code = None
        if need(report, where, v, "course_code"):
            code = normalise_code(v["course_code"])
            if code is None:
                report.error(where, "course_code must be letters then digits, for example CSC 101")
        level = whole_number(report, where, v, "level", 100, 700)
        if level is not None and level % 100:
            report.warn(where, "level is not a multiple of 100. Check it is right")
        semester = whole_number(report, where, v, "semester", 1, 2)
        day = whole_number(report, where, v, "day_of_week", 1, 7)
        start = clock_time(report, where, v, "start_time")
        end = clock_time(report, where, v, "end_time")
        if start and end and end <= start:
            report.error(where, "end_time must be after start_time")
        source = source_text(report, where, v, today)
        if len(report.errors) > before or source is None:
            continue
        assert start and end  # no errors means both were read
        items.append(
            Item(
                "timetable",
                filename,
                row.line,
                f"{code} on day {day} at {start:%H:%M}",
                (level, semester, code, day, start.strftime("%H:%M:%S")),
                {
                    "level": level,
                    "semester": semester,
                    "course_code": code,
                    "day_of_week": day,
                    "start_time": start,
                    "end_time": end,
                    "venue_name": text_or_none(v["venue_name"]),
                    "venue_note": text_or_none(v["venue_note"]),
                    "source": source,
                },
                dept_name=v["department_name"],
            )
        )
    return items


VALIDATORS = {
    "lecturers": validate_lecturers,
    "courses": validate_courses,
    "class_reps": validate_class_reps,
    "buildings": validate_buildings,
    "timetable": validate_timetable,
}


def read_input(
    collected: pathlib.Path, today: date, report: Report
) -> tuple[dict[str, list[Item]], list[tuple[str, int]]]:
    """Read and validate every file. Returns the items per kind and (file, rows) per file."""
    files, ignored = find_files(collected)
    for note in ignored:
        report.warn("", note)
    items: dict[str, list[Item]] = {kind: [] for kind in KINDS}
    summary = []
    for kind in KINDS:
        for path in files[kind]:
            name = display_name(path, collected)
            try:
                text = path.read_bytes().decode("utf-8-sig")
            except UnicodeDecodeError:
                report.error("", f"{name}: not UTF-8. Save the file as 'CSV UTF-8'.")
                continue
            rows, problems = parse_collected_csv(text, COLUMNS[kind], name)
            for problem in problems:
                report.error("", problem)
            summary.append((name, len(rows)))
            items[kind] += VALIDATORS[kind](rows, name, today, report)
    return items, summary


# ----------------------------------------------------------------- departments


class Directory:
    """Live departments by normalised name."""

    def __init__(self, departments: list[Dept]):
        self.by_key: dict[str, list[Dept]] = {}
        for dept in departments:
            self.by_key.setdefault(match_key(dept.name), []).append(dept)

    def resolve(self, name: str) -> tuple[Dept | None, str]:
        found = self.by_key.get(match_key(name), [])
        if len(found) == 1:
            return found[0], ""
        if len(found) > 1:
            schools = ", ".join(sorted(d.faculty for d in found))
            return None, (
                f"department '{name}' exists in more than one school ({schools}). "
                "Ask the lead how to tell them apart"
            )
        close = difflib.get_close_matches(match_key(name), list(self.by_key), n=3, cutoff=0.5)
        if close:
            names = "; ".join(
                f"{self.by_key[k][0].name} ({self.by_key[k][0].faculty})" for k in close
            )
            return None, f"unknown department '{name}'. Closest existing names: {names}"
        return None, f"unknown department '{name}'. No similar name exists. Check the spelling"


def directory_from_files(
    faculties: pathlib.Path, departments: pathlib.Path, report: Report
) -> Directory:
    """For --check: the departments listed in data/departments.csv."""
    rows, problems = import_seed.read_csv_file(departments, import_seed.DEPARTMENT_COLUMNS)
    for problem in problems:
        report.error("", problem)
    if not faculties.exists():
        report.error("", f"{faculties.name}: file not found")
    found = []
    for _, row in rows:
        if row["faculty"] and row["name"]:
            ref = f"csv:{match_key(row['faculty'])}|{match_key(row['name'])}"
            found.append(Dept(ref, row["name"], row["faculty"]))
    return Directory(list({d.ref: d for d in found}.values()))


def resolve_departments(items: dict[str, list[Item]], directory: Directory, report: Report) -> None:
    """Sets item.dept. Items whose department is unknown are dropped, with an error."""
    for kind in KINDS:
        kept = []
        for item in items[kind]:
            if item.dept_name is None:
                kept.append(item)
                continue
            dept, problem = directory.resolve(item.dept_name)
            if dept is None:
                report.error(item.where, problem)
                continue
            item.dept = dept
            item.values["department_id"] = dept.ref
            kept.append(item)
        items[kind] = kept


def drop_duplicates(items: dict[str, list[Item]], report: Report) -> None:
    """Two rows with the same natural key (across all folders) are an error. The first is kept."""
    for kind in KINDS:
        seen: dict[tuple, Item] = {}
        kept = []
        for item in items[kind]:
            first = seen.get(item.key)
            if first:
                report.error(
                    item.where,
                    f"duplicate {kind} row '{item.label}' (also on {first.where})",
                )
                continue
            seen[item.key] = item
            kept.append(item)
        items[kind] = kept


# ----------------------------------------------------------------- timetable references


def link_timetable(
    items: list[Item],
    course_ids: dict[tuple, Any],
    building_ids: dict[str, Any],
    database_known: bool,
    report: Report,
) -> list[Item]:
    """Points each timetable row at its course and venue. Returns the rows that have a course.

    course_ids: (department ref, code) -> id or Ref. building_ids: name key -> id or Ref.
    With database_known False (--check), an unknown course is a warning: the file may still be
    right because the course can already be in the database.
    """
    linked = []
    for item in items:
        course = course_ids.get((item.dept.ref, item.values["course_code"])) if item.dept else None
        if course is None:
            if database_known:
                report.error(
                    item.where,
                    f"course '{item.values['course_code']}' in '{item.dept_name}' was not found "
                    "in the database or the courses files (or it is duplicated in the database)",
                )
            else:
                report.warn(
                    item.where,
                    f"course '{item.values['course_code']}' in '{item.dept_name}' is not in the "
                    "courses files. --check cannot see the database; the dry run will check there",
                )
                linked.append(item)
            continue
        item.values["course_id"] = course
        venue = item.values["venue_name"]
        item.values["venue_building_id"] = None
        if venue:
            building = building_ids.get(match_key(venue))
            if building is None:
                where_text = "buildings.csv" if database_known else "the buildings files"
                report.warn(
                    item.where,
                    f"venue_name '{venue}' is not a known building. Fix the spelling to match "
                    f"{where_text}, or leave venue_name empty and use venue_note. "
                    "It is saved without a building",
                )
            else:
                item.values["venue_building_id"] = building
        linked.append(item)
    return linked


def check_references(items: dict[str, list[Item]], report: Report) -> None:
    """--check: references that can be followed inside the files."""
    courses = {item.key: Ref("courses", item.key) for item in items["courses"]}
    buildings = {item.key[0]: Ref("buildings", item.key) for item in items["buildings"]}
    link_timetable(items["timetable"], courses, buildings, False, report)


# ----------------------------------------------------------------- database state


@dataclass(frozen=True)
class DbRow:
    id: str
    key: tuple
    fields: dict[str, Any]
    status: str
    deleted: bool


@dataclass
class State:
    departments: list[Dept]
    rows: dict[str, list[DbRow]]


def _text(value: str | None) -> str | None:
    return clean(value) or None if value is not None else None


def _whole_time(value: time | None) -> time | None:
    return value.replace(second=0, microsecond=0) if value is not None else None


def _code_of(value: str) -> str:
    return normalise_code(value) or clean(value).upper()


LOAD_DEPARTMENTS = (
    "SELECT d.id, d.name, f.name FROM departments d JOIN faculties f ON f.id = d.faculty_id "
    "WHERE d.deleted_at IS NULL AND f.deleted_at IS NULL"
)
LOAD_LECTURERS = (
    "SELECT id, department_id, full_name, title, rank, email, office_location, specialization, "
    "source, verification_status::text, deleted_at IS NOT NULL FROM lecturers"
)
LOAD_COURSES = (
    "SELECT id, department_id, code, title, units, level, semester, source, "
    "verification_status::text, deleted_at IS NOT NULL FROM courses"
)
LOAD_CLASS_REPS = (
    "SELECT id, department_id, level, full_name, contact, consent_given, source, "
    "verification_status::text, deleted_at IS NOT NULL FROM class_reps"
)
LOAD_BUILDINGS = (
    "SELECT id, name, type::text, description, ST_Y(location::geometry), "
    "ST_X(location::geometry), source, verification_status::text, deleted_at IS NOT NULL "
    "FROM buildings"
)
LOAD_TIMETABLE = (
    "SELECT t.id, t.department_id, t.level, t.semester, c.code, t.day_of_week, t.start_time, "
    "t.end_time, t.venue_building_id, t.venue_note, t.source, t.verification_status::text, "
    "t.deleted_at IS NOT NULL FROM timetable_entries t JOIN courses c ON c.id = t.course_id"
)


def load_state(conn) -> State:
    """Every row, including soft-deleted ones (they block re-creating the same row)."""
    departments = [Dept(str(r[0]), r[1], r[2]) for r in conn.execute(LOAD_DEPARTMENTS).fetchall()]
    rows: dict[str, list[DbRow]] = {kind: [] for kind in KINDS}
    for r in conn.execute(LOAD_LECTURERS).fetchall():
        rows["lecturers"].append(
            DbRow(
                str(r[0]),
                (str(r[1]), match_key(r[2])),
                {
                    "title": _text(r[3]),
                    "rank": _text(r[4]),
                    "email": _text(r[5]),
                    "office_location": _text(r[6]),
                    "specialization": _text(r[7]),
                    "source": r[8],
                },
                r[9],
                r[10],
            )
        )
    for r in conn.execute(LOAD_COURSES).fetchall():
        rows["courses"].append(
            DbRow(
                str(r[0]),
                (str(r[1]), _code_of(r[2])),
                {
                    "title": _text(r[3]),
                    "units": r[4],
                    "level": r[5],
                    "semester": r[6],
                    "source": r[7],
                },
                r[8],
                r[9],
            )
        )
    for r in conn.execute(LOAD_CLASS_REPS).fetchall():
        rows["class_reps"].append(
            DbRow(
                str(r[0]),
                (str(r[1]), r[2], match_key(r[3])),
                {"contact": _text(r[4]), "consent_given": r[5], "source": r[6]},
                r[7],
                r[8],
            )
        )
    for r in conn.execute(LOAD_BUILDINGS).fetchall():
        rows["buildings"].append(
            DbRow(
                str(r[0]),
                (match_key(r[1]),),
                {
                    "type": r[2],
                    "description": _text(r[3]),
                    "lat": r[4],
                    "lng": r[5],
                    "source": r[6],
                },
                r[7],
                r[8],
            )
        )
    for r in conn.execute(LOAD_TIMETABLE).fetchall():
        start = _whole_time(r[6])
        rows["timetable"].append(
            DbRow(
                str(r[0]),
                (str(r[1]), r[2], r[3], _code_of(r[4]), r[5], start.strftime("%H:%M:%S")),
                {
                    "end_time": _whole_time(r[7]),
                    "venue_building_id": str(r[8]) if r[8] else None,
                    "venue_note": _text(r[9]),
                    "source": r[10],
                },
                r[11],
                r[12],
            )
        )
    return State(departments, rows)


# ----------------------------------------------------------------- planning


@dataclass(frozen=True)
class Change:
    kind: Kind
    table: str
    label: str
    file: str
    line: int
    key: tuple
    # insert: all values. update: the complete final values (blanks keep the old values).
    values: dict[str, Any] = field(default_factory=dict)
    existing_id: str | None = None
    changed: dict[str, tuple[Any, Any]] = field(default_factory=dict)
    reason: str = ""


# What an existing row is compared on. The source is handled on its own (see merge).
UPDATABLE = {
    "lecturers": ("title", "rank", "email", "office_location", "specialization"),
    "courses": ("title", "units", "level", "semester"),
    "class_reps": ("contact", "consent_given"),
    "buildings": ("type", "description", "lat", "lng"),
    "timetable": ("end_time", "venue_building_id", "venue_note"),
}


def same(old: Any, new: Any) -> bool:
    if isinstance(new, float) and old is not None:
        return abs(float(old) - new) < 1e-9  # coordinates
    if isinstance(new, Ref):
        return False  # a building that does not exist yet cannot be the current one
    return old == new


def merge(row: DbRow, item: Item, fields: tuple[str, ...]):
    """The fields that differ, and the final values. A blank CSV value never overwrites."""
    changed: dict[str, tuple[Any, Any]] = {}
    final: dict[str, Any] = {}
    for name in fields:
        old, new = row.fields.get(name), item.values.get(name)
        if new is None or same(old, new):
            final[name] = old
        else:
            changed[name] = (old, new)
            final[name] = new
    old_source, new_source = row.fields.get("source"), item.values["source"]
    if changed:
        final["source"] = new_source
        if old_source != new_source:
            changed["source"] = (old_source, new_source)
    else:
        final["source"] = old_source  # a different source alone is not a change
    return changed, final


def plan_kind(table: str, items: list[Item], existing: list[DbRow]) -> list[Change]:
    by_key: dict[tuple, list[DbRow]] = {}
    for row in existing:
        by_key.setdefault(row.key, []).append(row)
    changes = []
    for item in items:
        common = {"table": table, "label": item.label, "file": item.file, "line": item.line}
        matches = by_key.get(item.key, [])
        live = [r for r in matches if not r.deleted]
        if len(live) > 1:
            changes.append(
                Change("conflict", key=item.key, reason="matches more than one live row", **common)
            )
        elif not live and matches:
            changes.append(
                Change(
                    "conflict",
                    key=item.key,
                    reason="a deleted row matches. It was removed by a person; "
                    "restore it by hand or take the row out of the file",
                    **common,
                )
            )
        elif not live:
            changes.append(Change("insert", key=item.key, values=dict(item.values), **common))
        else:
            row = live[0]
            changed, final = merge(row, item, UPDATABLE[table])
            if not changed:
                changes.append(Change("unchanged", key=item.key, existing_id=row.id, **common))
            elif row.status != "unverified":
                changes.append(
                    Change(
                        "conflict",
                        key=item.key,
                        existing_id=row.id,
                        changed=changed,
                        reason=f"already {row.status}; would change " + ", ".join(changed),
                        **common,
                    )
                )
            else:
                changes.append(
                    Change(
                        "update",
                        key=item.key,
                        values=final,
                        existing_id=row.id,
                        changed=changed,
                        **common,
                    )
                )
    return changes


def reference_ids(existing: list[DbRow], changes: list[Change]) -> dict[Any, Any]:
    """What a timetable row can point at: live database rows, then this run's own plan."""
    counts: dict[tuple, int] = {}
    for row in existing:
        if not row.deleted:
            counts[row.key] = counts.get(row.key, 0) + 1
    ids: dict[Any, Any] = {r.key: r.id for r in existing if not r.deleted and counts[r.key] == 1}
    for change in changes:
        if change.kind == "insert":
            ids[change.key] = Ref(change.table, change.key)
        elif change.existing_id:
            ids[change.key] = change.existing_id
        else:
            ids.pop(change.key, None)  # a conflict with no usable row
    return ids


def make_plan(
    items: dict[str, list[Item]], state: State, report: Report
) -> dict[str, list[Change]]:
    """The plan for every kind, in dependency order. Timetable is planned last so it can point
    at courses and buildings that this same run creates."""
    plan: dict[str, list[Change]] = {}
    for kind in KINDS:
        if kind != "timetable":
            plan[kind] = plan_kind(kind, items[kind], state.rows[kind])
            continue
        courses = reference_ids(state.rows["courses"], plan["courses"])
        buildings = {
            k[0]: v for k, v in reference_ids(state.rows["buildings"], plan["buildings"]).items()
        }
        linked = link_timetable(items["timetable"], courses, buildings, True, report)
        plan[kind] = plan_kind(kind, linked, state.rows["timetable"])
    return plan


# ----------------------------------------------------------------- applying

INSERT_SQL = {
    "lecturers": (
        "INSERT INTO lecturers (department_id, full_name, title, rank, email, office_location, "
        "specialization, verification_status, source) "
        "VALUES (%s::uuid, %s, %s, %s, %s, %s, %s, 'unverified', %s) RETURNING id"
    ),
    "courses": (
        "INSERT INTO courses (department_id, code, title, units, level, semester, "
        "verification_status, source) VALUES (%s::uuid, %s, %s, %s, %s, %s, 'unverified', %s) "
        "RETURNING id"
    ),
    "class_reps": (
        "INSERT INTO class_reps (department_id, level, full_name, contact, consent_given, "
        "verification_status, source) VALUES (%s::uuid, %s, %s, %s, %s, 'unverified', %s) "
        "RETURNING id"
    ),
    "buildings": (
        "INSERT INTO buildings (name, type, description, location, verification_status, source) "
        "VALUES (%s, %s::building_type, %s, "
        "ST_SetSRID(ST_MakePoint(%s::float8, %s::float8), 4326)::geography, 'unverified', %s) "
        "RETURNING id"
    ),
    "timetable": (
        "INSERT INTO timetable_entries (department_id, level, semester, course_id, day_of_week, "
        "start_time, end_time, venue_building_id, venue_note, verification_status, source) "
        "VALUES (%s::uuid, %s, %s, %s::uuid, %s, %s, %s, %s::uuid, %s, 'unverified', %s) "
        "RETURNING id"
    ),
}
# Updates also check that the row is still live and unverified, as a second line of defence.
GUARD = "WHERE id = %s::uuid AND deleted_at IS NULL AND verification_status = 'unverified'"
UPDATE_SQL = {
    "lecturers": (
        "UPDATE lecturers SET title = %s, rank = %s, email = %s, office_location = %s, "
        "specialization = %s, source = %s " + GUARD
    ),
    "courses": (
        "UPDATE courses SET title = %s, units = %s, level = %s, semester = %s, source = %s " + GUARD
    ),
    "class_reps": "UPDATE class_reps SET contact = %s, consent_given = %s, source = %s " + GUARD,
    "buildings": (
        "UPDATE buildings SET type = %s::building_type, description = %s, "
        "location = ST_SetSRID(ST_MakePoint(%s::float8, %s::float8), 4326)::geography, "
        "source = %s " + GUARD
    ),
    "timetable": (
        "UPDATE timetable_entries SET end_time = %s, venue_building_id = %s::uuid, "
        "venue_note = %s, source = %s " + GUARD
    ),
}


def insert_params(table: str, v: dict[str, Any], created: dict[tuple, str]) -> tuple:
    def real(value: Any) -> Any:
        return created[(value.table, value.key)] if isinstance(value, Ref) else value

    if table == "lecturers":
        return (
            v["department_id"],
            v["full_name"],
            v["title"],
            v["rank"],
            v["email"],
            v["office_location"],
            v["specialization"],
            v["source"],
        )
    if table == "courses":
        return (
            v["department_id"],
            v["code"],
            v["title"],
            v["units"],
            v["level"],
            v["semester"],
            v["source"],
        )
    if table == "class_reps":
        return (
            v["department_id"],
            v["level"],
            v["full_name"],
            v["contact"],
            v["consent_given"],
            v["source"],
        )
    if table == "buildings":
        return (v["name"], v["type"], v["description"], v["lng"], v["lat"], v["source"])
    return (
        v["department_id"],
        v["level"],
        v["semester"],
        real(v["course_id"]),
        v["day_of_week"],
        v["start_time"],
        v["end_time"],
        real(v["venue_building_id"]),
        v["venue_note"],
        v["source"],
    )


def update_params(table: str, v: dict[str, Any], row_id: str, created: dict[tuple, str]) -> tuple:
    if table == "lecturers":
        return (
            v["title"],
            v["rank"],
            v["email"],
            v["office_location"],
            v["specialization"],
            v["source"],
            row_id,
        )
    if table == "courses":
        return (v["title"], v["units"], v["level"], v["semester"], v["source"], row_id)
    if table == "class_reps":
        return (v["contact"], v["consent_given"], v["source"], row_id)
    if table == "buildings":
        return (v["type"], v["description"], v["lng"], v["lat"], v["source"], row_id)
    venue = v["venue_building_id"]
    if isinstance(venue, Ref):
        venue = created[(venue.table, venue.key)]
    return (v["end_time"], venue, v["venue_note"], v["source"], row_id)


def apply_changes(conn, plan: dict[str, list[Change]]) -> None:
    """Write the plan in dependency order. The caller's transaction decides whether it commits."""
    created: dict[tuple, str] = {}
    with conn.cursor() as cur:
        for table in KINDS:
            for change in plan[table]:
                if change.kind == "insert":
                    params = insert_params(table, change.values, created)
                    created[(table, change.key)] = str(
                        cur.execute(INSERT_SQL[table], params).fetchone()[0]
                    )
                elif change.kind == "update":
                    params = update_params(table, change.values, change.existing_id, created)
                    cur.execute(UPDATE_SQL[table], params)
                    if cur.rowcount != 1:
                        raise RuntimeError(
                            f"{table}: a row to update was not found or not editable"
                        )


# ----------------------------------------------------------------- reporting

COUNT_ORDER = (
    ("insert", "create"),
    ("update", "update"),
    ("unchanged", "skip"),
    ("conflict", "conflict"),
)


def counts(changes: list[Change]) -> str:
    return ", ".join(
        f"{label} {sum(1 for c in changes if c.kind == kind)}" for kind, label in COUNT_ORDER
    )


def describe(change: Change) -> str:
    where = f"[{change.file} line {change.line}]"
    if change.kind == "insert":
        return f"  + {change.label} {where}"
    if change.kind == "update":
        parts = []
        for name, (old, new) in change.changed.items():
            if name in SENSITIVE_FIELDS:
                parts.append(f"{name} changed")
            elif name == "venue_building_id":
                parts.append("venue building changed")
            else:
                parts.append(f"{name}: {old!r} -> {new!r}")
        return f"  ~ {change.label} {where}: " + "; ".join(parts)
    return f"  ! {change.label} {where}: {change.reason}"


def limits_lines() -> list[str]:
    lines = [
        f"Limits chosen (characters): source {SOURCE_MAX}, collected_by {COLLECTED_BY_MAX} "
        f"(the stored source is at most {COMPOSED_SOURCE_MAX})."
    ]
    for kind, limits in LIMITS.items():
        own = ", ".join(f"{c} {n}" for c, n in limits.items() if c not in COMMON)
        lines.append(f"  {kind}: {own}")
    lines.append(
        f"Building area: lat {LAT_MIN} to {LAT_MAX}, lng {LNG_MIN} to {LNG_MAX} (FUTA / Akure)."
    )
    return lines


def format_report(
    title: str,
    summary: list[tuple[str, int]],
    report: Report,
    plan: dict[str, list[Change]] | None,
) -> list[str]:
    lines = [title, ""]
    if summary:
        lines.append("Files read:")
        lines += [f"  {name}: {rows} row(s)" for name, rows in summary]
    else:
        lines.append("No collected files found (data/collected/<folder>/<name>.csv).")
    lines += ["", *limits_lines(), ""]
    if plan is not None:
        for table in KINDS:
            changes = plan[table]
            lines.append(f"{table}: {counts(changes)}")
            for file in sorted({c.file for c in changes}):
                lines.append(f"    {file}: {counts([c for c in changes if c.file == file])}")
            lines += [describe(c) for c in changes if c.kind in ("insert", "update", "conflict")]
        lines.append("")
    if report.warnings:
        lines.append(f"WARNINGS ({len(report.warnings)}):")
        lines += [f"  WARNING: {w}" for w in report.warnings]
        lines.append("")
    if report.errors:
        lines.append(f"ERRORS ({len(report.errors)}):")
        lines += [f"  ERROR: {e}" for e in report.errors]
        lines.append("")
        lines.append("Nothing was written. Fix the files and run again.")
    return lines


# ----------------------------------------------------------------- command line

POOLER_MARKER = "-pooler"
MASK_HEAD = 8
MASK_TAIL = 14


# The same masking as scripts/create_admin.py (that script needs the API packages, so it is
# not imported here).
def mask_host(host: str) -> str:
    if len(host) <= MASK_HEAD + MASK_TAIL:
        return "..."
    return f"{host[:MASK_HEAD]}...{host[-MASK_TAIL:]}"


def database_host(url: str) -> str:
    return urlsplit(url).hostname or ""


def is_pooled_host(host: str) -> bool:
    return POOLER_MARKER in host


def database_url() -> str:
    return import_seed.database_url()


def connect(applying: bool):
    """Read-only unless applying, exactly as db/import_seed.py does."""
    return import_seed.connect(applying)


def run_database(
    conn,
    collected: pathlib.Path,
    today: date,
    apply: bool,
    host_line: str,
) -> int:
    """Dry run or apply on an open connection. The caller commits (or rolls back)."""
    report = Report()
    items, summary = read_input(collected, today, report)
    title = "APPLY" if apply else "DRY RUN: nothing will be written. Run with --apply to write."
    if not any(items.values()) and not summary:
        print("\n".join(format_report(title, summary, report, None)))
        return 1 if report.errors else 0
    if apply and report.errors:
        # The files are broken, so there is nothing safe to write and no need to connect.
        print("\n".join(format_report(title, summary, report, None)))
        return 1

    state = load_state(conn)
    resolve_departments(items, Directory(state.departments), report)
    drop_duplicates(items, report)
    plan = make_plan(items, state, report)
    print(host_line)
    print("\n".join(format_report(title, summary, report, plan)))
    if report.errors:
        return 1
    if apply:
        apply_changes(conn, plan)
        print("Applied in one transaction.")
    return 0


def run_check(
    collected: pathlib.Path,
    faculties: pathlib.Path,
    departments: pathlib.Path,
    today: date,
) -> int:
    report = Report()
    items, summary = read_input(collected, today, report)
    directory = directory_from_files(faculties, departments, report)
    resolve_departments(items, directory, report)
    drop_duplicates(items, report)
    check_references(items, report)
    title = "CHECK: files only. No database was used."
    lines = format_report(title, summary, report, None)
    if not report.errors:
        lines.append("No errors.")
    print("\n".join(lines))
    return 1 if report.errors else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="validate the files only (no database)")
    mode.add_argument("--apply", action="store_true", help="write the plan (default: dry run)")
    parser.add_argument("--collected", type=pathlib.Path, default=COLLECTED)
    parser.add_argument("--faculties", type=pathlib.Path, default=DATA / "faculties.csv")
    parser.add_argument("--departments", type=pathlib.Path, default=DATA / "departments.csv")
    args = parser.parse_args(argv)
    today = date.today()

    if args.check:
        return run_check(args.collected, args.faculties, args.departments, today)

    url = database_url()
    host = database_host(url)
    if not host:
        print("Not done: DATABASE_URL has no host.")
        return 2
    if args.apply and is_pooled_host(host):
        print("Not done: --apply needs the direct (non-pooled) connection string.")
        return 2

    host_line = f"Database host: {mask_host(host)}"
    try:
        with connect(args.apply) as conn:
            return run_database(conn, args.collected, today, args.apply, host_line)
    except psycopg.Error as error:
        # Only the error type is printed: the message can contain row values.
        print(f"Not done: database error ({type(error).__name__}). Nothing was written.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
