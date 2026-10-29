"""db/import_collected.py: parsing, validation, planning and applying, with no real database.

Every name, email and number below is made up. No fixture lives under data/collected/.
"""

import csv
import importlib.util
import io
import pathlib
import re
from dataclasses import replace
from datetime import date

import pytest

SCRIPT = pathlib.Path(__file__).resolve().parents[2] / "db" / "import_collected.py"
_spec = importlib.util.spec_from_file_location("import_collected", SCRIPT)
imp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(imp)

TODAY = date(2026, 10, 25)
SRC = {"source": "notice board", "collected_by": "Fake Collector", "date_collected": "2026-10-01"}
SOURCE = "notice board (collected by Fake Collector, 2026-10-01)"
DEFAULTS = {
    "lecturers": {
        "department_name": "Computer Science",
        "full_name": "Dr Fake Person",
        "title": "Dr.",
        "rank": "Lecturer",
        "email": "fake.person@futa.edu.ng",
        "office_location": "Room 1",
        "specialization": "Testing",
        **SRC,
    },
    "courses": {
        "department_name": "Computer Science",
        "code": "CSC 101",
        "title": "Intro to Fakes",
        "units": "3",
        "level": "100",
        "semester": "1",
        **SRC,
    },
    "class_reps": {
        "department_name": "Computer Science",
        "level": "100",
        "full_name": "Fake Rep",
        "contact": "",
        "consent_given": "no",
        **SRC,
    },
    "buildings": {
        "name": "Fake Hall",
        "type": "lecture_hall",
        "description": "",
        "lat": "7.3011",
        "lng": "5.1366",
        **SRC,
    },
    "timetable": {
        "department_name": "Computer Science",
        "level": "100",
        "semester": "1",
        "course_code": "CSC 101",
        "day_of_week": "1",
        "start_time": "08:00",
        "end_time": "10:00",
        "venue_name": "",
        "venue_note": "",
        **SRC,
    },
}
DEPTS = [
    imp.Dept("d-csc", "Computer Science", "School of Fakes"),
    imp.Dept("d-bio", "Biology", "School of Fakes"),
]


def empty_state(depts=DEPTS):
    return imp.State(list(depts), {kind: [] for kind in imp.KINDS})


# ----------------------------------------------------------------- helpers


def write(tmp_path, folder, kind, rows, header=None):
    """Write data/collected-style files under tmp_path/collected/<folder>/<kind>.csv."""
    path = tmp_path / "collected" / folder / f"{kind}.csv"
    path.parent.mkdir(parents=True, exist_ok=True)
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow(header or imp.COLUMNS[kind])
    for row in rows:
        values = {**DEFAULTS[kind], **row}
        writer.writerow([values[c] for c in imp.COLUMNS[kind]])
    path.write_text(out.getvalue(), encoding="utf-8")
    return path


def read(tmp_path):
    report = imp.Report()
    items, summary = imp.read_input(tmp_path / "collected", TODAY, report)
    return items, summary, report


def plan_for(tmp_path, state=None):
    state = state or empty_state()
    report = imp.Report()
    items, _ = imp.read_input(tmp_path / "collected", TODAY, report)
    imp.resolve_departments(items, imp.Directory(state.departments), report)
    imp.drop_duplicates(items, report)
    return imp.make_plan(items, state, report), report


def kinds(changes):
    return [c.kind for c in changes]


def errors_with(report, text):
    return [e for e in report.errors if text in e]


def db_lecturer(**over):
    row = imp.DbRow(
        "l-1",
        ("d-csc", imp.match_key("Dr Fake Person")),
        {
            "title": "Dr.",
            "rank": "Lecturer",
            "email": "fake.person@futa.edu.ng",
            "office_location": "Room 1",
            "specialization": "Testing",
            "source": "older source",
        },
        "unverified",
        False,
    )
    return replace(row, **over)


def db_course(**over):
    row = imp.DbRow(
        "c-1",
        ("d-csc", "CSC 101"),
        {"title": "Intro to Fakes", "units": 3, "level": 100, "semester": 1, "source": "old"},
        "unverified",
        False,
    )
    return replace(row, **over)


def state_with(**rows):
    state = empty_state()
    for kind, items in rows.items():
        state.rows[kind] = items
    return state


def simulate(plan, state):
    """Pretend to apply a plan in memory, so a second plan can be checked for no changes."""
    created: dict[tuple, str] = {}
    rows = {kind: list(state.rows[kind]) for kind in imp.KINDS}
    number = 0

    def real(value):
        return created[(value.table, value.key)] if isinstance(value, imp.Ref) else value

    for table in imp.KINDS:
        for change in plan[table]:
            if change.kind == "insert":
                number += 1
                created[(table, change.key)] = f"new-{number}"
                fields = {f: real(change.values.get(f)) for f in imp.UPDATABLE[table]}
                fields["source"] = change.values["source"]
                rows[table].append(
                    imp.DbRow(f"new-{number}", change.key, fields, "unverified", False)
                )
            elif change.kind == "update":
                fields_now = {k: real(v) for k, v in change.values.items()}
                rows[table] = [
                    replace(r, fields={**r.fields, **fields_now})
                    if r.id == change.existing_id
                    else r
                    for r in rows[table]
                ]
    return imp.State(state.departments, rows)


# ----------------------------------------------------------------- the templates


@pytest.mark.parametrize("kind", imp.KINDS)
def test_columns_match_the_template_headers(kind):
    template = pathlib.Path(__file__).resolve().parents[2] / "data" / "templates" / f"{kind}.csv"
    header = template.read_text(encoding="utf-8-sig").splitlines()[0]

    assert tuple(header.split(",")) == imp.COLUMNS[kind]


def test_no_fixture_is_committed_under_data_collected():
    # Real collected files are added by the data team. This repo's tests must not add any fixture,
    # so no file there may contain the made-up values used above.
    collected = pathlib.Path(__file__).resolve().parents[2] / "data" / "collected"
    made_up = ("Fake Collector", "Fake Hall", "Dr Fake Person", "Fake Rep", "Intro to Fakes")
    files = list(collected.rglob("*.csv")) if collected.exists() else []
    for path in files:
        text = path.read_text(encoding="utf-8-sig")
        assert not [value for value in made_up if value in text], path


# ----------------------------------------------------------------- reading files


def test_bom_file_is_read_like_plain_utf8(tmp_path):
    path = write(tmp_path, "Fake", "buildings", [{}])
    path.write_bytes(b"\xef\xbb\xbf" + path.read_bytes())

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert len(items["buildings"]) == 1


def test_non_utf8_file_is_reported_not_crashed(tmp_path):
    path = write(tmp_path, "Fake", "buildings", [{}])
    path.write_bytes(path.read_bytes().replace(b"Fake Hall", b"Fak\xe9 Hall"))

    _, _, report = read(tmp_path)

    assert errors_with(report, "not UTF-8")


def test_header_must_match_the_template(tmp_path):
    columns = imp.COLUMNS["buildings"]
    write(tmp_path, "Fake", "buildings", [{}], header=columns[:-1])  # one column short

    _, _, report = read(tmp_path)

    assert errors_with(report, "missing column 'date_collected'")
    assert errors_with(report, "the header row must be exactly")


def test_unknown_and_reordered_columns_are_rejected(tmp_path):
    columns = list(imp.COLUMNS["courses"])
    write(tmp_path, "A", "courses", [{}], header=[*columns, "extra"])
    swapped = list(columns)
    swapped[1], swapped[2] = swapped[2], swapped[1]
    write(tmp_path, "B", "courses", [{}], header=swapped)

    _, _, report = read(tmp_path)

    assert errors_with(report, "A/courses.csv line 1: unknown column 'extra'")
    assert errors_with(report, "B/courses.csv line 1: columns are in a different order")


def test_blank_lines_are_ignored_and_wrong_field_counts_are_reported(tmp_path):
    path = write(tmp_path, "Fake", "buildings", [{}])
    path.write_text(path.read_text() + "\n\n,,,\nFake Hall 2,other\n", encoding="utf-8")

    items, _, report = read(tmp_path)

    assert len(items["buildings"]) == 1
    assert errors_with(report, "Fake/buildings.csv line 6: 2 values, expected 8")


def test_line_numbers_count_lines_inside_quoted_cells(tmp_path):
    path = write(tmp_path, "Fake", "buildings", [{"description": "two\nlines"}, {"lat": "9.9"}])

    _, _, report = read(tmp_path)

    # Header is line 1. The first row spans lines 2-3, so the second starts on line 4.
    assert path.exists()
    assert errors_with(report, "Fake/buildings.csv line 4: lat must be between")


def test_files_in_every_folder_are_combined_and_others_are_ignored(tmp_path):
    write(tmp_path, "Alpha", "buildings", [{"name": "Fake Hall A"}])
    write(tmp_path, "Beta", "buildings", [{"name": "Fake Hall B"}])
    (tmp_path / "collected" / "Beta" / "notes.csv").write_text("x\n")
    (tmp_path / "collected" / "stray.csv").write_text("x\n")

    items, summary, report = read(tmp_path)

    assert [i.label for i in items["buildings"]] == ["Fake Hall A", "Fake Hall B"]
    assert summary == [("Alpha/buildings.csv", 1), ("Beta/buildings.csv", 1)]
    assert len([w for w in report.warnings if "ignored" in w]) == 2


# ----------------------------------------------------------------- names and text


def test_names_are_matched_after_trimming_whitespace_and_unicode_normalisation():
    composed = "Ọlá Fake"  # precomposed letters
    decomposed = "Ọ́lá Fake".replace("Ọ́", "Ọ")  # mixed form
    messy = "  DR  fake\t person  "

    assert imp.match_key(composed) == imp.match_key(decomposed)
    assert imp.match_key(messy) == "dr fake person"
    assert imp.match_key("ＣＳＣ 101") == "csc 101"  # full-width letters


def test_a_row_matches_the_database_row_despite_spacing_and_case(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{"full_name": "  DR FAKE   person "}])
    state = state_with(lecturers=[db_lecturer()])

    plan, report = plan_for(tmp_path, state)

    assert report.errors == []
    assert kinds(plan["lecturers"]) == ["unchanged"]


def test_control_characters_and_long_values_are_reported(tmp_path):
    write(
        tmp_path,
        "Fake",
        "lecturers",
        [{"full_name": "Dr Bell\x07"}, {"full_name": "x" * 121}, {"office_location": "y" * 201}],
    )

    _, _, report = read(tmp_path)

    assert errors_with(report, "line 2: full_name contains a control character")
    assert errors_with(report, "line 3: full_name is longer than 120")
    assert errors_with(report, "line 4: office_location is longer than 200")


def test_cells_starting_with_formula_characters_are_plain_text_with_a_warning(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{"specialization": "=HYPERLINK(1)", "rank": "@rank"}])

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert items["lecturers"][0].values["specialization"] == "=HYPERLINK(1)"
    assert len([w for w in report.warnings if "starts with" in w]) == 2


# ----------------------------------------------------------------- source and dates


def test_source_is_stored_with_who_and_when(tmp_path):
    write(tmp_path, "Fake", "buildings", [{}])

    items, _, _ = read(tmp_path)

    assert items["buildings"][0].values["source"] == SOURCE


@pytest.mark.parametrize("column", ["source", "collected_by", "date_collected"])
def test_each_provenance_column_is_required(tmp_path, column):
    write(tmp_path, "Fake", "buildings", [{column: ""}])

    _, _, report = read(tmp_path)

    assert errors_with(report, f"{column} is empty")


@pytest.mark.parametrize(
    ("value", "message"),
    [
        ("01/10/2026", "must look like YYYY-MM-DD"),
        ("2026-02-30", "not a real date"),
        ("2026-10-26", "in the future"),
    ],
)
def test_bad_dates_are_reported(tmp_path, value, message):
    write(tmp_path, "Fake", "buildings", [{"date_collected": value}])

    _, _, report = read(tmp_path)

    assert errors_with(report, message)


def test_today_is_allowed(tmp_path):
    write(tmp_path, "Fake", "buildings", [{"date_collected": "2026-10-25"}])

    assert read(tmp_path)[2].errors == []


def test_the_longest_allowed_source_still_fits_the_stored_limit(tmp_path):
    write(
        tmp_path,
        "Fake",
        "buildings",
        [{"source": "s" * imp.SOURCE_MAX, "collected_by": "c" * imp.COLLECTED_BY_MAX}],
    )

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert len(items["buildings"][0].values["source"]) <= imp.COMPOSED_SOURCE_MAX


def test_a_source_over_the_limit_is_reported(tmp_path):
    write(tmp_path, "Fake", "buildings", [{"source": "s" * (imp.SOURCE_MAX + 1)}])

    assert errors_with(read(tmp_path)[2], f"source is longer than {imp.SOURCE_MAX}")


# ----------------------------------------------------------------- lecturers


def test_lecturer_email_is_optional_but_must_look_like_an_email(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{"email": ""}, {"email": "not-an-email"}])

    items, _, report = read(tmp_path)

    assert len(items["lecturers"]) == 1
    assert errors_with(report, "line 3: email does not look like an email address")
    assert "not-an-email" not in " ".join(report.errors)


def test_a_non_futa_email_is_a_warning_not_an_error(tmp_path):
    write(
        tmp_path,
        "Fake",
        "lecturers",
        [
            {"email": "someone@gmail.com"},
            {"full_name": "Dr Two", "email": "two@csc.futa.edu.ng"},
            {"full_name": "Dr Three", "email": "THREE@FUTA.EDU.NG"},
        ],
    )

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert len(items["lecturers"]) == 3
    assert [w for w in report.warnings if "email is not an @futa.edu.ng" in w] == [
        "Fake/lecturers.csv line 2: email is not an @futa.edu.ng address. "
        "Only the official school email belongs here"
    ]
    assert items["lecturers"][2].values["email"] == "three@futa.edu.ng"


@pytest.mark.parametrize(
    "number", ["0803 123 4567", "+234 803 123 4567", "08031234567", "(0803) 123-4567"]
)
def test_phone_numbers_in_any_lecturer_field_are_errors(tmp_path, number):
    write(
        tmp_path,
        "Fake",
        "lecturers",
        [{"office_location": f"Room 1, call {number}"}, {"source": f"told by {number}"}],
    )

    items, _, report = read(tmp_path)

    assert items["lecturers"] == []
    assert errors_with(report, "line 2: office_location looks like a phone number")
    assert errors_with(report, "line 3: source looks like a phone number")
    assert number not in " ".join(report.errors)  # the number is never printed


def test_ordinary_numbers_are_not_mistaken_for_phones(tmp_path):
    write(
        tmp_path,
        "Fake",
        "lecturers",
        [{"office_location": "Block 3, Room 12", "rank": "2019-2023"}],
    )

    assert read(tmp_path)[2].errors == []


# ----------------------------------------------------------------- courses


def test_course_codes_are_normalised(tmp_path):
    write(tmp_path, "Fake", "courses", [{"code": "csc101"}, {"code": "mth  102"}])

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert [i.values["code"] for i in items["courses"]] == ["CSC 101", "MTH 102"]


@pytest.mark.parametrize("code", ["101", "CSC", "C 101", "CSC-101", "CSC 101A", "COMPUTING 101"])
def test_bad_course_codes_are_reported(tmp_path, code):
    write(tmp_path, "Fake", "courses", [{"code": code}])

    assert errors_with(read(tmp_path)[2], "code must be letters then digits")


@pytest.mark.parametrize(
    ("column", "value", "message"),
    [
        ("units", "13", "units must be between 0 and 12"),
        ("units", "-1", "units must be a whole number"),
        ("units", "2.5", "units must be a whole number"),
        ("level", "50", "level must be between 100 and 700"),
        ("level", "800", "level must be between 100 and 700"),
        ("level", "150", "level must be a multiple of 100"),
        ("semester", "3", "semester must be between 1 and 2"),
        ("semester", "", "semester is empty"),
    ],
)
def test_course_number_rules(tmp_path, column, value, message):
    write(tmp_path, "Fake", "courses", [{column: value}])

    assert errors_with(read(tmp_path)[2], message)


def test_units_zero_and_twelve_are_allowed(tmp_path):
    write(tmp_path, "Fake", "courses", [{"units": "0"}, {"code": "CSC 102", "units": "12"}])

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert [i.values["units"] for i in items["courses"]] == [0, 12]


# ----------------------------------------------------------------- class reps and consent


def test_consent_no_stores_false_and_no_contact(tmp_path):
    write(tmp_path, "Fake", "class_reps", [{"consent_given": "No"}])

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert items["class_reps"][0].values["consent_given"] is False
    assert items["class_reps"][0].values["contact"] is None


def test_consent_yes_stores_the_contact_and_true(tmp_path):
    write(tmp_path, "Fake", "class_reps", [{"consent_given": "YES", "contact": "rep@example.com"}])

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert items["class_reps"][0].values["consent_given"] is True
    assert items["class_reps"][0].values["contact"] == "rep@example.com"


def test_a_contact_without_consent_is_an_error_and_is_not_printed(tmp_path):
    write(tmp_path, "Fake", "class_reps", [{"consent_given": "no", "contact": "0803 123 4567"}])

    items, _, report = read(tmp_path)

    assert items["class_reps"] == []
    assert errors_with(report, "contact must be empty when consent_given is not yes")
    assert "0803" not in " ".join(report.errors)


@pytest.mark.parametrize("value", ["", "maybe", "true", "y"])
def test_consent_must_be_yes_or_no(tmp_path, value):
    write(tmp_path, "Fake", "class_reps", [{"consent_given": value}])

    assert errors_with(read(tmp_path)[2], "consent_given must be yes or no")


def test_consent_yes_needs_a_contact(tmp_path):
    write(tmp_path, "Fake", "class_reps", [{"consent_given": "yes", "contact": ""}])

    assert errors_with(read(tmp_path)[2], "consent_given is yes but contact is empty")


def test_class_rep_level_range_and_phone_in_other_fields(tmp_path):
    write(
        tmp_path,
        "Fake",
        "class_reps",
        [{"level": "50"}, {"full_name": "Rep 08031234567"}],
    )

    _, _, report = read(tmp_path)

    assert errors_with(report, "level must be between 100 and 700")
    assert errors_with(report, "full_name looks like a phone number")


def test_a_phone_number_is_fine_in_the_contact_column_with_consent(tmp_path):
    write(
        tmp_path,
        "Fake",
        "class_reps",
        [{"consent_given": "yes", "contact": "+234 803 123 4567"}],
    )

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert report.warnings == []  # a leading + in a phone number is expected
    assert len(items["class_reps"]) == 1


def test_withdrawing_consent_updates_the_flag_but_keeps_the_stored_contact():
    # Consent "no" is explicit (not blank), so it is applied. A blank never clears the contact.
    row = imp.DbRow(
        "r-1",
        ("d-csc", 100, imp.match_key("Fake Rep")),
        {"contact": "rep@example.com", "consent_given": True, "source": "old"},
        "unverified",
        False,
    )
    item = imp.Item(
        "class_reps",
        "f.csv",
        2,
        "Fake Rep",
        (100, imp.match_key("Fake Rep")),
        {"contact": None, "consent_given": False, "source": SOURCE},
        dept=DEPTS[0],
    )

    changes = imp.plan_kind("class_reps", [item], [row])

    assert kinds(changes) == ["update"]
    assert changes[0].values["consent_given"] is False
    assert changes[0].values["contact"] == "rep@example.com"


# ----------------------------------------------------------------- buildings


def test_building_types_must_be_in_the_enum(tmp_path):
    write(tmp_path, "Fake", "buildings", [{"type": "lecture_hall"}, {"name": "B", "type": "shed"}])

    items, _, report = read(tmp_path)

    assert len(items["buildings"]) == 1
    assert errors_with(report, "line 3: type must be one of: faculty, department, lecture_hall")


@pytest.mark.parametrize("building_type", imp.BUILDING_TYPES)
def test_every_enum_value_is_accepted(tmp_path, building_type):
    write(tmp_path, "Fake", "buildings", [{"type": building_type}])

    assert read(tmp_path)[2].errors == []


def test_enum_in_code_matches_the_migration():
    sql = (
        pathlib.Path(__file__).resolve().parents[2] / "db" / "migrations" / "001_init.sql"
    ).read_text()
    start = sql.index("CREATE TYPE building_type AS ENUM")
    block = sql[start : sql.index(";", start)]

    assert set(imp.BUILDING_TYPES) == set(re.findall(r"'(\w+)'", block))


@pytest.mark.parametrize(
    ("lat", "lng", "message"),
    [
        ("7.1", "5.1366", "lat must be between 7.2 and 7.4"),
        ("7.5", "5.1366", "lat must be between 7.2 and 7.4"),
        ("7.3011", "4.9", "lng must be between 5.0 and 5.3"),
        ("7.3011", "5.4", "lng must be between 5.0 and 5.3"),
        ("seven", "5.1366", "lat must be a decimal number"),
        ("7.3011", "", "lng is empty"),
        ("7,3011", "5.1366", "lat must be a decimal number"),
        ("1e1", "5.1366", "lat must be a decimal number"),
    ],
)
def test_coordinates_must_be_decimals_inside_the_box(tmp_path, lat, lng, message):
    write(tmp_path, "Fake", "buildings", [{"lat": lat, "lng": lng}])

    assert errors_with(read(tmp_path)[2], message)


def test_box_edges_are_inside(tmp_path):
    write(
        tmp_path,
        "Fake",
        "buildings",
        [{"lat": "7.2", "lng": "5.0"}, {"name": "B", "lat": "7.4", "lng": "5.3"}],
    )

    assert read(tmp_path)[2].errors == []


def test_duplicate_building_names_are_errors_across_folders(tmp_path):
    write(tmp_path, "Alpha", "buildings", [{"name": "Fake Hall"}])
    write(tmp_path, "Beta", "buildings", [{"name": "  fake   HALL "}])

    plan, report = plan_for(tmp_path)

    assert errors_with(
        report,
        "Beta/buildings.csv line 2: duplicate buildings row 'fake   HALL'".replace("   ", " "),
    ) or errors_with(report, "duplicate buildings row")
    assert errors_with(report, "(also on Alpha/buildings.csv line 2)")
    assert len(plan["buildings"]) == 1


def test_building_location_is_stored_as_lng_then_lat():
    insert = imp.INSERT_SQL["buildings"]
    values = {
        "name": "Fake Hall",
        "type": "gate",
        "description": None,
        "lat": 7.3011,
        "lng": 5.1366,
        "source": SOURCE,
    }

    params = imp.insert_params("buildings", values, {})

    assert "ST_MakePoint(%s::float8, %s::float8)" in insert
    assert params[3:5] == (5.1366, 7.3011)  # lng first, then lat


# ----------------------------------------------------------------- timetable


def good_files(tmp_path, **timetable):
    write(tmp_path, "Fake", "courses", [{}])
    write(tmp_path, "Fake", "buildings", [{}])
    write(tmp_path, "Fake", "timetable", [timetable])


@pytest.mark.parametrize(
    ("column", "value", "message"),
    [
        ("day_of_week", "0", "day_of_week must be between 1 and 7"),
        ("day_of_week", "8", "day_of_week must be between 1 and 7"),
        ("start_time", "8am", "start_time must be 24-hour HH:MM"),
        ("start_time", "24:00", "start_time must be 24-hour HH:MM"),
        ("end_time", "10:60", "end_time must be 24-hour HH:MM"),
        ("semester", "3", "semester must be between 1 and 2"),
        ("course_code", "", "course_code is empty"),
        ("course_code", "101", "course_code must be letters then digits"),
    ],
)
def test_timetable_field_rules(tmp_path, column, value, message):
    write(tmp_path, "Fake", "timetable", [{column: value}])

    assert errors_with(read(tmp_path)[2], message)


def test_end_must_be_after_start(tmp_path):
    write(
        tmp_path,
        "Fake",
        "timetable",
        [
            {"start_time": "10:00", "end_time": "10:00"},
            {"start_time": "10:00", "end_time": "09:00"},
        ],
    )

    assert len(errors_with(read(tmp_path)[2], "end_time must be after start_time")) == 2


def test_single_digit_hours_are_accepted_and_normalised(tmp_path):
    write(tmp_path, "Fake", "timetable", [{"start_time": "8:00", "end_time": "9:30"}])

    items, _, report = read(tmp_path)

    assert report.errors == []
    assert items["timetable"][0].key_rest[-1] == "08:00:00"


def test_timetable_needs_an_existing_department_and_course(tmp_path):
    write(tmp_path, "Fake", "timetable", [{"course_code": "CSC 999"}])

    plan, report = plan_for(tmp_path)

    assert errors_with(report, "course 'CSC 999' in 'Computer Science' was not found")
    assert plan["timetable"] == []


def test_timetable_course_can_come_from_the_database(tmp_path):
    write(tmp_path, "Fake", "timetable", [{}])

    plan, report = plan_for(tmp_path, state_with(courses=[db_course()]))

    assert report.errors == []
    assert kinds(plan["timetable"]) == ["insert"]
    assert plan["timetable"][0].values["course_id"] == "c-1"


def test_timetable_can_use_a_course_and_building_created_in_the_same_run(tmp_path):
    good_files(tmp_path, venue_name="fake hall")

    plan, report = plan_for(tmp_path)

    entry = plan["timetable"][0]
    assert report.errors == []
    assert entry.values["course_id"] == imp.Ref("courses", ("d-csc", "CSC 101"))
    assert entry.values["venue_building_id"] == imp.Ref("buildings", ("fake hall",))


def test_unknown_venue_is_a_warning_and_leaves_the_building_empty(tmp_path):
    good_files(tmp_path, venue_name="Fake Hal", venue_note="Room 4")

    plan, report = plan_for(tmp_path)

    entry = plan["timetable"][0]
    assert report.errors == []
    assert entry.values["venue_building_id"] is None
    assert entry.values["venue_note"] == "Room 4"
    assert [w for w in report.warnings if "venue_name 'Fake Hal' is not a known building" in w]
    assert [w for w in report.warnings if "use venue_note" in w]


def test_no_venue_at_all_is_allowed(tmp_path):
    good_files(tmp_path)

    plan, report = plan_for(tmp_path)

    assert report.errors == [] and report.warnings == []
    assert plan["timetable"][0].values["venue_building_id"] is None


def test_venue_can_come_from_a_database_building(tmp_path):
    write(tmp_path, "Fake", "courses", [{}])
    write(tmp_path, "Fake", "timetable", [{"venue_name": "Old Hall"}])
    building = imp.DbRow(
        "b-9", ("old hall",), {"type": "other", "source": "x"}, "unverified", False
    )

    plan, report = plan_for(tmp_path, state_with(buildings=[building]))

    assert report.errors == [] and report.warnings == []
    assert plan["timetable"][0].values["venue_building_id"] == "b-9"


# ----------------------------------------------------------------- departments


def test_unknown_department_lists_the_closest_names(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{"department_name": "Computr Science"}])

    plan, report = plan_for(tmp_path)

    assert plan["lecturers"] == []
    assert errors_with(
        report,
        "Fake/lecturers.csv line 2: unknown department 'Computr Science'. "
        "Closest existing names: Computer Science (School of Fakes)",
    )


def test_department_with_no_similar_name(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{"department_name": "Zzzz"}])

    assert errors_with(plan_for(tmp_path)[1], "No similar name exists")


def test_department_names_are_matched_case_insensitively_with_messy_spacing(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{"department_name": "  computer  SCIENCE "}])

    plan, report = plan_for(tmp_path)

    assert report.errors == []
    assert plan["lecturers"][0].values["department_id"] == "d-csc"


def test_a_department_name_in_two_schools_is_ambiguous(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{}])
    depts = [*DEPTS, imp.Dept("d-other", "Computer Science", "School of Others")]

    _, report = plan_for(tmp_path, empty_state(depts))

    assert errors_with(report, "exists in more than one school (School of Fakes, School of Others)")


def test_duplicate_keys_inside_the_input_are_errors_with_both_locations(tmp_path):
    write(tmp_path, "Alpha", "lecturers", [{"full_name": "Dr Same"}])
    write(tmp_path, "Beta", "lecturers", [{"full_name": "DR  same", "title": "Prof."}])

    plan, report = plan_for(tmp_path)

    assert errors_with(
        report,
        "Beta/lecturers.csv line 2: duplicate lecturers row 'DR same' "
        "(also on Alpha/lecturers.csv line 2)",
    )
    assert len(plan["lecturers"]) == 1


def test_same_lecturer_name_in_two_departments_is_not_a_duplicate(tmp_path):
    write(
        tmp_path,
        "Fake",
        "lecturers",
        [{"department_name": "Computer Science"}, {"department_name": "Biology"}],
    )

    plan, report = plan_for(tmp_path)

    assert report.errors == []
    assert kinds(plan["lecturers"]) == ["insert", "insert"]


def test_natural_keys_of_each_kind(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{}, {"title": "Prof."}])
    write(tmp_path, "Fake", "courses", [{}, {"code": "csc101"}])
    write(tmp_path, "Fake", "class_reps", [{}, {"level": "200"}, {"full_name": " fake  REP"}])
    write(tmp_path, "Fake", "timetable", [{}, {"day_of_week": "2"}, {"start_time": "8:00"}])

    _, report = plan_for(tmp_path)

    # lecturers, courses (normalised code), class reps (same level and name) and timetable
    # (same day and start time) each have one duplicate. The level-200 rep is a different key.
    assert len(errors_with(report, "duplicate lecturers row")) == 1
    assert len(errors_with(report, "duplicate courses row")) == 1
    assert len(errors_with(report, "duplicate class_reps row")) == 1
    assert len(errors_with(report, "duplicate timetable row")) == 1


# ----------------------------------------------------------------- planning


def test_new_rows_are_inserted_unverified(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{}])

    plan, report = plan_for(tmp_path)

    assert report.errors == []
    assert kinds(plan["lecturers"]) == ["insert"]
    assert plan["lecturers"][0].values["source"] == SOURCE
    assert "verified_by" not in plan["lecturers"][0].values
    assert "verification_status" not in plan["lecturers"][0].values


def test_blank_values_never_clear_existing_data(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{"title": "", "office_location": "Room 9", "email": ""}])
    state = state_with(lecturers=[db_lecturer()])

    plan, _ = plan_for(tmp_path, state)

    change = plan["lecturers"][0]
    assert change.kind == "update"
    assert change.values["title"] == "Dr."
    assert change.values["email"] == "fake.person@futa.edu.ng"
    assert change.values["office_location"] == "Room 9"
    assert set(change.changed) == {"office_location", "source"}


def test_unverified_row_is_updated_with_the_new_source(tmp_path):
    write(tmp_path, "Fake", "courses", [{"title": "A better title"}])

    plan, _ = plan_for(tmp_path, state_with(courses=[db_course()]))

    change = plan["courses"][0]
    assert change.kind == "update"
    assert change.values["title"] == "A better title"
    assert change.values["source"] == SOURCE


@pytest.mark.parametrize("status", ["verified", "outdated"])
def test_verified_and_outdated_rows_are_conflicts_not_overwritten(tmp_path, status):
    write(tmp_path, "Fake", "courses", [{"title": "A better title"}])

    plan, report = plan_for(tmp_path, state_with(courses=[db_course(status=status)]))

    change = plan["courses"][0]
    assert report.errors == []
    assert change.kind == "conflict"
    assert f"already {status}; would change title" in change.reason
    assert change.values == {}


def test_verified_row_with_no_real_difference_is_unchanged(tmp_path):
    write(tmp_path, "Fake", "courses", [{}])

    plan, _ = plan_for(tmp_path, state_with(courses=[db_course(status="verified")]))

    assert kinds(plan["courses"]) == ["unchanged"]


def test_a_different_source_alone_is_not_a_change(tmp_path):
    write(tmp_path, "Fake", "courses", [{"source": "someone else"}])

    plan, _ = plan_for(tmp_path, state_with(courses=[db_course()]))

    assert kinds(plan["courses"]) == ["unchanged"]


def test_rows_missing_from_the_files_are_left_alone(tmp_path):
    write(tmp_path, "Fake", "courses", [{"code": "CSC 102"}])

    plan, _ = plan_for(tmp_path, state_with(courses=[db_course()]))

    assert kinds(plan["courses"]) == ["insert"]  # nothing is planned for CSC 101


def test_a_soft_deleted_match_is_a_conflict_and_is_not_restored(tmp_path):
    write(tmp_path, "Fake", "courses", [{}])

    plan, _ = plan_for(tmp_path, state_with(courses=[db_course(deleted=True)]))

    assert kinds(plan["courses"]) == ["conflict"]
    assert "deleted" in plan["courses"][0].reason


def test_two_live_matches_are_a_conflict(tmp_path):
    write(tmp_path, "Fake", "courses", [{}])
    twin = db_course(id="c-2")

    plan, _ = plan_for(tmp_path, state_with(courses=[db_course(), twin]))

    assert kinds(plan["courses"]) == ["conflict"]


def test_database_codes_match_after_normalisation(tmp_path):
    write(tmp_path, "Fake", "courses", [{}])
    state = state_with(courses=[db_course(key=("d-csc", imp._code_of("csc101")))])

    plan, _ = plan_for(tmp_path, state)

    assert kinds(plan["courses"]) == ["unchanged"]


def test_building_coordinates_compare_with_a_tiny_tolerance(tmp_path):
    write(tmp_path, "Fake", "buildings", [{}])
    row = imp.DbRow(
        "b-1",
        ("fake hall",),
        {
            "type": "lecture_hall",
            "description": None,
            "lat": 7.3011000000001,
            "lng": 5.1366,
            "source": "x",
        },
        "unverified",
        False,
    )

    plan, _ = plan_for(tmp_path, state_with(buildings=[row]))

    assert kinds(plan["buildings"]) == ["unchanged"]


def test_a_faculty_timetable_row_points_at_the_existing_building_when_it_changes(tmp_path):
    good_files(tmp_path, venue_name="Fake Hall")
    course = db_course()
    entry = imp.DbRow(
        "t-1",
        ("d-csc", 100, 1, "CSC 101", 1, "08:00:00"),
        {
            "end_time": imp.time(10, 0),
            "venue_building_id": "b-old",
            "venue_note": None,
            "source": "x",
        },
        "unverified",
        False,
    )

    plan, report = plan_for(tmp_path, state_with(courses=[course], timetable=[entry]))

    assert report.errors == []
    assert plan["timetable"][0].kind == "update"
    assert "venue_building_id" in plan["timetable"][0].changed


# ----------------------------------------------------------------- idempotence


def full_set(tmp_path):
    write(tmp_path, "Fake", "lecturers", [{}])
    write(tmp_path, "Fake", "courses", [{}, {"code": "CSC 102", "units": "0"}])
    write(
        tmp_path,
        "Fake",
        "class_reps",
        [{}, {"full_name": "Other Rep", "consent_given": "yes", "contact": "x@example.com"}],
    )
    write(tmp_path, "Fake", "buildings", [{}])
    write(tmp_path, "Fake", "timetable", [{"venue_name": "Fake Hall", "venue_note": "Room 3"}])


def test_rerunning_the_same_files_changes_nothing(tmp_path):
    full_set(tmp_path)
    first, report = plan_for(tmp_path)
    assert report.errors == []
    assert {k: len(v) for k, v in first.items()} == {
        "lecturers": 1,
        "courses": 2,
        "class_reps": 2,
        "buildings": 1,
        "timetable": 1,
    }
    assert all(c.kind == "insert" for kind in imp.KINDS for c in first[kind])

    after = simulate(first, empty_state())
    second, report2 = plan_for(tmp_path, after)

    assert report2.errors == []
    assert [c.kind for kind in imp.KINDS for c in second[kind]] == ["unchanged"] * 7


def test_an_update_is_also_stable_on_the_next_run(tmp_path):
    write(tmp_path, "Fake", "courses", [{"title": "A better title"}])
    state = state_with(courses=[db_course()])
    first, _ = plan_for(tmp_path, state)

    second, _ = plan_for(tmp_path, simulate(first, state))

    assert kinds(first["courses"]) == ["update"]
    assert kinds(second["courses"]) == ["unchanged"]


# ----------------------------------------------------------------- applying and its order


class RecordingConn:
    def __init__(self, rowcount=1):
        self.calls = []
        self.rowcount = rowcount
        self.inserted = 0

    def cursor(self):
        return RecordingCursor(self)


class RecordingCursor:
    def __init__(self, conn):
        self.conn = conn

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    @property
    def rowcount(self):
        return self.conn.rowcount

    def execute(self, sql, params=None):
        self.conn.calls.append((sql, params))
        if sql.startswith("INSERT"):
            self.conn.inserted += 1
            self._id = f"id-{self.conn.inserted}"
        return self

    def fetchone(self):
        return (self._id,)


def table_of(sql):
    words = sql.split()
    return words[2] if words[0] == "INSERT" else words[1]


def test_apply_runs_in_dependency_order_and_timetable_uses_ids_created_earlier(tmp_path):
    full_set(tmp_path)
    plan, _ = plan_for(tmp_path)
    conn = RecordingConn()

    imp.apply_changes(conn, plan)

    order = [table_of(sql) for sql, _ in conn.calls]
    assert order == [
        "lecturers",
        "courses",
        "courses",
        "class_reps",
        "class_reps",
        "buildings",
        "timetable_entries",
    ]
    ids = {table_of(sql) + str(i): f"id-{i + 1}" for i, (sql, _) in enumerate(conn.calls)}
    timetable_sql, params = conn.calls[-1]
    course_id, building_id = params[3], params[7]
    assert course_id == ids["courses1"]  # CSC 101 was inserted first among the courses
    assert building_id == ids["buildings5"]
    assert timetable_sql == imp.INSERT_SQL["timetable"]


def test_apply_never_sets_verification_fields_and_updates_are_guarded():
    for sql in imp.INSERT_SQL.values():
        assert "'unverified'" in sql
        assert "verified_by" not in sql and "verified_at" not in sql
    for sql in imp.UPDATE_SQL.values():
        assert "verification_status = 'unverified'" in sql  # only in the guard
        assert "verified_by" not in sql and "verified_at" not in sql
        assert "deleted_at IS NULL" in sql
        assert "SET verification_status" not in sql and ", verification_status" not in sql
        assert "DELETE FROM" not in sql.upper()


def test_apply_writes_the_final_values_of_an_update(tmp_path):
    write(tmp_path, "Fake", "courses", [{"title": "A better title"}])
    plan, _ = plan_for(tmp_path, state_with(courses=[db_course()]))
    conn = RecordingConn()

    imp.apply_changes(conn, plan)

    sql, params = conn.calls[0]
    assert sql == imp.UPDATE_SQL["courses"]
    assert params == ("A better title", 3, 100, 1, SOURCE, "c-1")


def test_apply_skips_conflicts_and_unchanged_rows(tmp_path):
    write(tmp_path, "Fake", "courses", [{"title": "A better title"}, {"code": "CSC 102"}])
    state = state_with(
        courses=[
            db_course(status="verified"),
            db_course(
                id="c-2",
                key=("d-csc", "CSC 102"),
                fields={
                    "title": "Intro to Fakes",
                    "units": 3,
                    "level": 100,
                    "semester": 1,
                    "source": "x",
                },
            ),
        ]
    )
    plan, _ = plan_for(tmp_path, state)
    conn = RecordingConn()

    imp.apply_changes(conn, plan)

    assert kinds(plan["courses"]) == ["conflict", "unchanged"]
    assert conn.calls == []


def test_an_update_that_hits_no_row_aborts_the_run(tmp_path):
    write(tmp_path, "Fake", "courses", [{"title": "A better title"}])
    plan, _ = plan_for(tmp_path, state_with(courses=[db_course()]))

    with pytest.raises(RuntimeError, match="not found or not editable"):
        imp.apply_changes(RecordingConn(rowcount=0), plan)


# ----------------------------------------------------------------- the command line


class FakeResult:
    def __init__(self, rows):
        self.rows = rows

    def fetchall(self):
        return self.rows


class FakeDbConn:
    """Answers the loading queries from lists, records every statement, and tracks commit."""

    def __init__(self, depts=None, courses=None):
        self.depts = (
            depts if depts is not None else [("d-csc", "Computer Science", "School of Fakes")]
        )
        self.courses = courses or []
        self.calls = []
        self.committed = False
        self.inserted = 0

    def execute(self, sql, params=None):
        self.calls.append((sql, params))
        tables = {
            imp.LOAD_DEPARTMENTS: self.depts,
            imp.LOAD_COURSES: self.courses,
        }
        if sql in tables:
            return FakeResult(tables[sql])
        if sql.startswith("SELECT"):
            return FakeResult([])
        raise AssertionError(f"unexpected SQL: {sql}")

    def cursor(self):
        return RecordingCursor(self)

    @property
    def rowcount(self):
        return 1

    def __enter__(self):
        return self

    def __exit__(self, exc_type, *rest):
        self.committed = exc_type is None
        return False

    def writes(self):
        return [c for c in self.calls if not c[0].startswith("SELECT")]


URL = "postgresql://someone:secretpw@ep-example-database-host.eu-central-1.aws.neon.tech/neondb"
POOLED_URL = "postgresql://someone:secretpw@ep-example-pooler.eu-central-1.aws.neon.tech/neondb"


@pytest.fixture
def fake_db(monkeypatch):
    conn = FakeDbConn()
    monkeypatch.setattr(imp, "database_url", lambda: URL)
    monkeypatch.setattr(imp, "connect", lambda applying: conn)
    conn.applying = []
    return conn


def seed_departments_files(tmp_path):
    faculties = tmp_path / "faculties.csv"
    departments = tmp_path / "departments.csv"
    faculties.write_text("name,short_name,source,note\nSchool of Fakes,SOF,test,\n")
    departments.write_text(
        "faculty,name,short_name,hod_name,office_location,source,note\n"
        "School of Fakes,Computer Science,,,,test,\n"
        "School of Fakes,Biology,,,,test,\n"
    )
    return ["--faculties", str(faculties), "--departments", str(departments)]


def collected_args(tmp_path):
    return ["--collected", str(tmp_path / "collected")]


def test_check_needs_no_database_and_no_database_url(tmp_path, monkeypatch, capsys):
    full_set(tmp_path)

    def refuse(*args, **kwargs):
        raise AssertionError("--check must not touch the database")

    monkeypatch.setattr(imp, "database_url", refuse)
    monkeypatch.setattr(imp, "connect", refuse)
    monkeypatch.setattr(imp.psycopg, "connect", refuse)
    monkeypatch.delenv("DATABASE_URL", raising=False)

    code = imp.main(["--check", *collected_args(tmp_path), *seed_departments_files(tmp_path)])

    out = capsys.readouterr().out
    assert code == 0
    assert "No errors." in out
    assert "Building area: lat 7.2 to 7.4, lng 5.0 to 5.3" in out
    assert "Limits chosen" in out


def test_check_fails_with_a_report_for_bad_files(tmp_path, capsys):
    write(tmp_path, "Fake", "lecturers", [{"department_name": "Computr Science"}])
    write(tmp_path, "Fake", "buildings", [{"lat": "9"}])

    code = imp.main(["--check", *collected_args(tmp_path), *seed_departments_files(tmp_path)])

    out = capsys.readouterr().out
    assert code == 1
    assert "ERROR: Fake/buildings.csv line 2: lat must be between 7.2 and 7.4" in out
    assert "ERROR: Fake/lecturers.csv line 2: unknown department 'Computr Science'" in out
    assert "Computer Science (School of Fakes)" in out
    assert "Nothing was written" in out


def test_check_resolves_departments_from_departments_csv(tmp_path, capsys):
    write(tmp_path, "Fake", "lecturers", [{"department_name": "Biology"}])

    code = imp.main(["--check", *collected_args(tmp_path), *seed_departments_files(tmp_path)])

    assert code == 0


def test_check_warns_when_a_timetable_course_is_only_in_the_database(tmp_path, capsys):
    write(tmp_path, "Fake", "timetable", [{}])

    code = imp.main(["--check", *collected_args(tmp_path), *seed_departments_files(tmp_path)])

    out = capsys.readouterr().out
    assert code == 0  # a warning, not an error: the course may already be in the database
    assert "WARNING: Fake/timetable.csv line 2: course 'CSC 101'" in out
    assert "--check cannot see the database" in out


def test_check_with_no_files_passes(tmp_path, capsys):
    code = imp.main(["--check", *collected_args(tmp_path), *seed_departments_files(tmp_path)])

    assert code == 0
    assert "No collected files found" in capsys.readouterr().out


def test_dry_run_of_a_full_set_plans_every_kind_and_writes_nothing(tmp_path, fake_db, capsys):
    full_set(tmp_path)

    code = imp.main(collected_args(tmp_path))

    out = capsys.readouterr().out
    assert code == 0
    assert "timetable: create 1, update 0, skip 0, conflict 0" in out
    assert "lecturers: create 1" in out
    assert fake_db.writes() == []


def test_dry_run_reports_counts_and_errors_with_file_and_line(tmp_path, fake_db, capsys):
    write(tmp_path, "Fake", "courses", [{}, {"code": "CSC 102"}])
    write(tmp_path, "Other", "courses", [{"code": "CSC 103"}])
    write(tmp_path, "Fake", "lecturers", [{"department_name": "Nowhere"}])

    code = imp.main(collected_args(tmp_path))

    out = capsys.readouterr().out
    assert code == 1
    assert "courses: create 3, update 0, skip 0, conflict 0" in out
    assert "    Fake/courses.csv: create 2" in out
    assert "    Other/courses.csv: create 1" in out
    assert "ERROR: Fake/lecturers.csv line 2: unknown department 'Nowhere'" in out
    assert f"Database host: {imp.mask_host(imp.database_host(URL))}" in out
    assert "DRY RUN" in out
    assert fake_db.writes() == []


def test_dry_run_with_no_errors_exits_zero_and_never_writes(tmp_path, fake_db, capsys):
    write(tmp_path, "Fake", "courses", [{}])

    code = imp.main(collected_args(tmp_path))

    assert code == 0
    assert fake_db.writes() == []
    assert "Applied" not in capsys.readouterr().out


def test_apply_does_not_run_when_the_dry_run_has_errors(tmp_path, fake_db, capsys):
    write(tmp_path, "Fake", "courses", [{}])
    write(tmp_path, "Fake", "lecturers", [{"department_name": "Nowhere"}])

    code = imp.main(["--apply", *collected_args(tmp_path)])

    assert code == 1
    assert fake_db.writes() == []
    assert "Applied" not in capsys.readouterr().out


def test_apply_with_file_errors_does_not_even_load_the_database(tmp_path, fake_db):
    write(tmp_path, "Fake", "buildings", [{"lat": "9"}])

    code = imp.main(["--apply", *collected_args(tmp_path)])

    assert code == 1
    assert fake_db.calls == []


def test_apply_writes_everything_in_one_transaction(tmp_path, fake_db, capsys):
    write(tmp_path, "Fake", "courses", [{}])
    write(tmp_path, "Fake", "timetable", [{}])

    code = imp.main(["--apply", *collected_args(tmp_path)])

    assert code == 0
    assert [table_of(sql) for sql, _ in fake_db.writes()] == ["courses", "timetable_entries"]
    assert fake_db.committed is True
    assert "Applied in one transaction." in capsys.readouterr().out


def test_a_failure_while_applying_is_not_committed(tmp_path, fake_db, monkeypatch, capsys):
    write(tmp_path, "Fake", "courses", [{}])

    def boom(conn, plan):
        raise imp.psycopg.errors.UniqueViolation("duplicate key value (secret row)")

    monkeypatch.setattr(imp, "apply_changes", boom)

    code = imp.main(["--apply", *collected_args(tmp_path)])

    out = capsys.readouterr().out
    assert code == 1
    assert fake_db.committed is False
    assert "UniqueViolation" in out
    assert "secret row" not in out


def test_apply_refuses_a_pooled_host_but_a_dry_run_allows_it(tmp_path, monkeypatch, capsys):
    write(tmp_path, "Fake", "courses", [{}])
    conn = FakeDbConn()
    monkeypatch.setattr(imp, "database_url", lambda: POOLED_URL)
    monkeypatch.setattr(imp, "connect", lambda applying: conn)

    assert imp.main(["--apply", *collected_args(tmp_path)]) == 2
    assert "non-pooled" in capsys.readouterr().out
    assert conn.calls == []

    assert imp.main(collected_args(tmp_path)) == 0


def test_the_connection_string_and_password_are_never_printed(tmp_path, fake_db, capsys):
    write(tmp_path, "Fake", "courses", [{}])

    imp.main(collected_args(tmp_path))
    imp.main(["--apply", *collected_args(tmp_path)])

    out = capsys.readouterr().out
    for secret in ("secretpw", "someone", "postgresql://", "ep-example-database-host"):
        assert secret not in out


def test_dry_run_connects_read_only_through_import_seed(monkeypatch):
    seen = []
    monkeypatch.setattr(imp.import_seed, "connect", lambda applying: seen.append(applying) or "c")

    assert imp.connect(False) == "c"
    assert imp.connect(True) == "c"
    assert seen == [False, True]


def test_check_and_apply_cannot_be_combined():
    with pytest.raises(SystemExit):
        imp.main(["--check", "--apply"])


def test_report_does_not_print_emails_or_contacts_in_a_plan(tmp_path, capsys):
    write(tmp_path, "Fake", "lecturers", [{"email": "new.address@futa.edu.ng"}])
    state = state_with(lecturers=[db_lecturer()])
    plan, _ = plan_for(tmp_path, state)

    text = "\n".join(imp.describe(c) for c in plan["lecturers"])

    assert "email changed" in text
    assert "futa.edu.ng" not in text


def test_the_masked_host_hides_the_middle():
    host = "ep-tiny-glitter-b90w2hee.c-7.eu-central-1.aws.neon.tech"

    assert imp.mask_host(host) == f"{host[:8]}...{host[-14:]}"
    assert imp.mask_host("localhost") == "..."
    assert imp.database_host(URL) == "ep-example-database-host.eu-central-1.aws.neon.tech"
    assert imp.is_pooled_host(imp.database_host(POOLED_URL)) is True
