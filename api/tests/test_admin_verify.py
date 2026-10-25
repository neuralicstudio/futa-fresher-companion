"""POST /admin/verify, with a fake DB connection (no Postgres needed)."""

import re
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.db import get_conn
from app.main import app
from app.routers import admin as admin_router
from app.security import create_access_token
from tests.fakedb import FakeCursor, FakeDb
from tests.test_announcement_writes import (
    DEPT_BIO,
    DEPT_CSC,
    FACULTY_ENG,
    FACULTY_SCI,
    SPEC,
    user,
)
from tests.test_sync import SyncFakeDb

OLD = datetime.now(timezone.utc) - timedelta(days=2)
VERIFIED_AT = datetime.now(timezone.utc) - timedelta(days=1)
PREVIOUS_VERIFIER = uuid.UUID("99999999-9999-9999-9999-999999999999")
URL = "/api/v1/admin/verify"
STATUSES = ("unverified", "verified", "outdated")
VERIFICATION_COLUMNS = {"verification_status", "source", "verified_by", "verified_at"}


class VerifyFakeDb(FakeDb):
    """FakeDb plus the UPDATE the route sends. It plays the updated_at trigger and now()."""

    def __init__(self, **tables):
        super().__init__(**tables)
        self.updates = []

    def execute(self, sql, params=None):
        if sql.lstrip().startswith("UPDATE "):
            self.queries.append(sql)
            self.updates.append((sql, params))
            return self._update(sql, params or {})
        return super().execute(sql, params)

    def _update(self, sql, params):
        table = re.match(r"\s*UPDATE (\w+) SET", sql).group(1)
        rows = [
            row
            for row in self.tables.get(table, [])
            if row["id"] == params["id"] and row["deleted_at"] is None
        ]
        if not rows:
            return FakeCursor([])
        row = rows[0]
        set_list = re.search(r"SET (.*?) WHERE", sql, re.DOTALL).group(1)
        for column, expression in re.findall(r"(\w+) = ([^,]+)", set_list):
            expression = expression.strip()
            if expression.startswith("'"):
                row[column] = expression.strip("'")
            elif expression == "NULL":
                row[column] = None
            elif expression == "now()":
                row[column] = datetime.now(timezone.utc)
            else:
                row[column] = params[re.search(r"%\((\w+)\)s", expression).group(1)]
        row["updated_at"] = datetime.now(timezone.utc)  # the BEFORE UPDATE trigger
        return FakeCursor([{"id": row["id"]}])


@pytest.fixture(autouse=True)
def clear_overrides():
    yield
    app.dependency_overrides.clear()


# ----------------------------------------------------------------- data


def record(row_id=None, **fields):
    """A stored row with the verification columns."""
    row = {
        "id": row_id or uuid.uuid4(),
        "name": "Stored name",
        "verification_status": "unverified",
        "source": None,
        "verified_by": None,
        "verified_at": None,
        "updated_at": OLD,
        "deleted_at": None,
    }
    row.update(fields)
    return row


def departments():
    return [
        record(DEPT_CSC, faculty_id=FACULTY_ENG),
        record(DEPT_BIO, faculty_id=FACULTY_SCI),
    ]


def entity_row(entity, where, **fields):
    """A row of `entity` that sits in "csc" (faculty ENG) or "bio" (faculty SCI)."""
    dept, faculty = (DEPT_CSC, FACULTY_ENG) if where == "csc" else (DEPT_BIO, FACULTY_SCI)
    if entity == "departments":
        return record(dept, faculty_id=faculty, **fields)
    if entity in ("lecturers", "courses", "class_reps", "timetable_entries"):
        return record(department_id=dept, **fields)
    if entity == "announcements":
        return record(scope="department", faculty_id=None, department_id=dept, **fields)
    return record(**fields)  # faculties and buildings have no scope


def make_db(caller, entity=None, *rows):
    tables = {"users": [caller] if caller else [], "departments": departments()}
    if entity == "departments":
        taken = {row["id"] for row in rows}
        tables["departments"] = [*rows, *(d for d in departments() if d["id"] not in taken)]
    elif entity:
        tables[entity] = list(rows)
    return VerifyFakeDb(**tables)


def callers():
    return {
        "super": user("super_admin"),
        "faculty_eng": user("faculty_admin", faculty_id=FACULTY_ENG),
        "dept_csc": user("department_admin", department_id=DEPT_CSC),
        "sug": user("sug"),
    }


def call(db, caller, payload):
    app.dependency_overrides[get_conn] = lambda: db
    headers = {}
    if caller is not None:
        headers = {"Authorization": f"Bearer {create_access_token(str(caller['id']))}"}
    return TestClient(app).post(URL, json=payload, headers=headers)


def body(entity, row, status="verified", **fields):
    return {"entity_type": entity, "entity_id": str(row["id"]), "status": status, **fields}


def unknown(entity, **fields):
    return {
        "entity_type": entity,
        "entity_id": str(uuid.uuid4()),
        "status": "verified",
        **fields,
    }


def set_columns(sql):
    set_list = re.search(r"SET (.*?) WHERE", sql, re.DOTALL).group(1)
    return {column for column, _ in re.findall(r"(\w+) = ([^,]+)", set_list)}


def content_of(row):
    return {k: v for k, v in row.items() if k not in VERIFICATION_COLUMNS | {"updated_at"}}


def verified_row(**fields):
    return entity_row(
        "lecturers",
        "csc",
        verification_status="verified",
        source="HOD office",
        verified_by=PREVIOUS_VERIFIER,
        verified_at=VERIFIED_AT,
        **fields,
    )


CHILD_TABLES = ("lecturers", "courses", "class_reps", "timetable_entries")
ALL_ENTITIES = (
    "faculties",
    "departments",
    "lecturers",
    "courses",
    "class_reps",
    "buildings",
    "timetable_entries",
    "announcements",
)

# ----------------------------------------------------------------- who may call


def test_without_a_token_is_401():
    row = entity_row("faculties", "csc", source="Registry")

    assert call(make_db(None, "faculties", row), None, body("faculties", row)).status_code == 401


def test_a_bad_token_is_401():
    row = entity_row("faculties", "csc", source="Registry")
    app.dependency_overrides[get_conn] = lambda: make_db(None, "faculties", row)

    response = TestClient(app).post(
        URL, json=body("faculties", row), headers={"Authorization": "Bearer not-a-token"}
    )

    assert response.status_code == 401


@pytest.mark.parametrize("role", ["student", "class_rep"])
@pytest.mark.parametrize("entity", ALL_ENTITIES)
def test_non_admin_roles_are_403_for_every_entity(role, entity):
    caller = user(role, department_id=DEPT_CSC, faculty_id=FACULTY_ENG)
    row = entity_row(entity, "csc", source="Registry")
    db = make_db(caller, entity, row)

    response = call(db, caller, body(entity, row))

    assert response.status_code == 403
    assert db.updates == []


def test_a_student_gets_403_even_for_an_id_that_does_not_exist():
    caller = user("student")

    assert call(make_db(caller), caller, unknown("faculties")).status_code == 403


def test_the_role_comes_from_the_database_not_the_token():
    # The token only carries the user id. This user is a student in the database now.
    caller = user("student")
    row = entity_row("faculties", "csc", source="Registry")

    response = call(make_db(caller, "faculties", row), caller, body("faculties", row))

    assert response.status_code == 403


def test_an_inactive_admin_is_401():
    caller = user("super_admin", is_active=False)
    row = entity_row("faculties", "csc", source="Registry")

    response = call(make_db(caller, "faculties", row), caller, body("faculties", row))

    assert response.status_code == 401


# ----------------------------------------------------------------- scope, per role and entity

# Who may verify a row in "csc" (faculty ENG) and a row in "bio" (faculty SCI).
CHILD_RULES = {
    "super": {"csc": True, "bio": True},
    "faculty_eng": {"csc": True, "bio": False},
    "dept_csc": {"csc": True, "bio": False},
    "sug": {"csc": False, "bio": False},
}
SUPER_ONLY_RULES = {
    "super": {"csc": True, "bio": True},
    "faculty_eng": {"csc": False, "bio": False},
    "dept_csc": {"csc": False, "bio": False},
    "sug": {"csc": False, "bio": False},
}
RULES = {
    "faculties": SUPER_ONLY_RULES,
    "buildings": SUPER_ONLY_RULES,
    "departments": CHILD_RULES,
    **{table: CHILD_RULES for table in CHILD_TABLES},
}


@pytest.mark.parametrize("who", ["super", "faculty_eng", "dept_csc", "sug"])
@pytest.mark.parametrize("where", ["csc", "bio"])
@pytest.mark.parametrize("entity", sorted(RULES))
def test_scope_per_role_and_entity_type(entity, where, who):
    caller = callers()[who]
    row = entity_row(entity, where, source="Registry")
    db = make_db(caller, entity, row)

    response = call(db, caller, body(entity, row))

    if RULES[entity][who][where]:
        assert response.status_code == 204
        assert response.content == b""
        assert len(db.updates) == 1
        assert row["verification_status"] == "verified"
    else:
        assert response.status_code == 403
        assert db.updates == []
        assert row["verification_status"] == "unverified"


def _who(super_, faculty_eng, dept_csc, sug):
    return {"super": super_, "faculty_eng": faculty_eng, "dept_csc": dept_csc, "sug": sug}


# (announcement fields, who may verify it)
ANNOUNCEMENT_RULES = [
    ({"scope": "university"}, _who(True, False, False, False)),
    ({"scope": "sug"}, _who(True, False, False, True)),
    ({"scope": "faculty", "faculty_id": FACULTY_ENG}, _who(True, True, False, False)),
    ({"scope": "faculty", "faculty_id": FACULTY_SCI}, _who(True, False, False, False)),
    ({"scope": "department", "department_id": DEPT_CSC}, _who(True, True, True, False)),
    ({"scope": "department", "department_id": DEPT_BIO}, _who(True, False, False, False)),
]


@pytest.mark.parametrize("who", ["super", "faculty_eng", "dept_csc", "sug"])
@pytest.mark.parametrize(("fields", "allowed"), ANNOUNCEMENT_RULES)
def test_announcements_follow_the_edit_and_delete_rule(fields, allowed, who):
    caller = callers()[who]
    row = record(**{"faculty_id": None, "department_id": None, "source": "Registry", **fields})
    db = make_db(caller, "announcements", row)

    response = call(db, caller, body("announcements", row))

    assert response.status_code == (204 if allowed[who] else 403)
    assert len(db.updates) == (1 if allowed[who] else 0)


def test_the_announcement_rule_is_one_shared_copy():
    from app.routers import announcements

    assert announcements.may_publish is admin_router.may_publish


def test_scope_is_taken_from_the_stored_row_not_the_request():
    caller = callers()["dept_csc"]
    row = entity_row("lecturers", "bio", source="Registry")  # a lecturer in another faculty
    db = make_db(caller, "lecturers", row)
    # Extra fields claiming the CSC department are ignored.
    payload = body("lecturers", row, department_id=str(DEPT_CSC), faculty_id=str(FACULTY_ENG))

    response = call(db, caller, payload)

    assert response.status_code == 403
    assert db.updates == []


def test_admins_with_no_faculty_or_department_on_record_get_403():
    row = entity_row("departments", "csc", source="Registry")
    for caller in (user("faculty_admin"), user("department_admin")):
        db = make_db(caller, "departments", row)

        assert call(db, caller, body("departments", row)).status_code == 403


def test_a_lecturer_of_a_soft_deleted_department_is_403_for_a_faculty_admin():
    caller = callers()["faculty_eng"]
    row = entity_row("lecturers", "csc", source="Registry")
    db = make_db(caller, "lecturers", row)
    db.tables["departments"][0]["deleted_at"] = OLD

    assert call(db, caller, body("lecturers", row)).status_code == 403


# ----------------------------------------------------------------- 404 first, then 403


@pytest.mark.parametrize("entity", ALL_ENTITIES)
def test_unknown_id_is_404_for_every_entity(entity):
    caller = callers()["super"]

    response = call(make_db(caller, entity), caller, unknown(entity, source="x"))

    assert response.status_code == 404


@pytest.mark.parametrize("entity", ALL_ENTITIES)
def test_soft_deleted_row_is_404_for_every_entity(entity):
    caller = callers()["super"]
    row = entity_row(entity, "csc", source="Registry", deleted_at=OLD)
    db = make_db(caller, entity, row)

    assert call(db, caller, body(entity, row)).status_code == 404
    assert db.updates == []


def test_404_comes_before_403_so_a_403_never_reveals_a_missing_row():
    caller = callers()["dept_csc"]  # may not touch faculties at all
    existing = entity_row("faculties", "csc", source="Registry")

    missing = call(make_db(caller, "faculties"), caller, unknown("faculties"))
    present = call(make_db(caller, "faculties", existing), caller, body("faculties", existing))

    assert missing.status_code == 404
    assert present.status_code == 403


def test_403_comes_before_the_row_dependent_422():
    caller = callers()["dept_csc"]
    row = entity_row("faculties", "csc")  # no source, and out of scope

    assert (
        call(make_db(caller, "faculties", row), caller, body("faculties", row)).status_code == 403
    )


def test_404_comes_before_the_row_dependent_422():
    caller = callers()["super"]

    assert call(make_db(caller, "faculties"), caller, unknown("faculties")).status_code == 404


# ----------------------------------------------------------------- 422

BAD_REQUESTS = [
    unknown("users"),
    unknown("paths"),
    unknown("lecturers; DROP TABLE users"),
    unknown("LECTURERS"),
    {**unknown("lecturers"), "status": "approved"},
    {**unknown("lecturers"), "status": "VERIFIED"},
    {**unknown("lecturers"), "entity_id": "not-a-uuid"},
    {"entity_id": str(uuid.uuid4()), "status": "verified"},
    {"entity_type": "lecturers", "status": "verified"},
    {"entity_type": "lecturers", "entity_id": str(uuid.uuid4())},
    unknown("lecturers", source="s" * 301),
    unknown("lecturers", source=5),
]


@pytest.mark.parametrize("payload", BAD_REQUESTS)
def test_bad_requests_are_422_and_run_no_query_on_a_table(payload):
    caller = callers()["super"]
    db = make_db(caller)

    response = call(db, caller, payload)

    assert response.status_code == 422
    assert db.updates == []
    assert all("lecturers" not in query and "DROP" not in query for query in db.queries)


def test_the_longest_allowed_source_is_accepted():
    caller = callers()["super"]
    row = entity_row("faculties", "csc")

    response = call(
        make_db(caller, "faculties", row), caller, body("faculties", row, source="s" * 300)
    )

    assert response.status_code == 204
    assert len(row["source"]) == 300


def test_verified_needs_a_source_from_the_request_or_the_row():
    caller = callers()["super"]
    row = entity_row("lecturers", "csc")
    db = make_db(caller, "lecturers", row)

    missing = call(db, caller, body("lecturers", row))
    blank = call(db, caller, body("lecturers", row, source="   "))
    null = call(db, caller, body("lecturers", row, source=None))

    assert (missing.status_code, blank.status_code, null.status_code) == (422, 422, 422)
    assert "source" in missing.json()["detail"]
    assert db.updates == []
    assert row["verification_status"] == "unverified"


def test_verified_is_fine_when_the_stored_row_already_has_a_source():
    caller = callers()["super"]
    row = entity_row("lecturers", "csc", source="Department notice board")
    db = make_db(caller, "lecturers", row)

    response = call(db, caller, body("lecturers", row))

    assert response.status_code == 204
    assert row["source"] == "Department notice board"


@pytest.mark.parametrize("status", ["unverified", "outdated"])
def test_other_statuses_do_not_need_a_source(status):
    caller = callers()["super"]
    row = entity_row("lecturers", "csc")
    db = make_db(caller, "lecturers", row)

    assert call(db, caller, body("lecturers", row, status)).status_code == 204
    assert row["verification_status"] == status
    assert row["source"] is None


def test_a_blank_source_never_erases_the_stored_source():
    caller = callers()["super"]
    row = entity_row("lecturers", "csc", source="Stored source")
    db = make_db(caller, "lecturers", row)

    call(db, caller, body("lecturers", row, "outdated", source="  "))

    assert row["source"] == "Stored source"


# ----------------------------------------------------------------- the columns each status sets


@pytest.mark.parametrize("entity", ALL_ENTITIES)
def test_verified_sets_status_source_verifier_and_time(entity):
    caller = callers()["super"]
    row = entity_row(entity, "csc", source="notice board (collected by Fake, 2026-10-01)")
    before = content_of(row)
    db = make_db(caller, entity, row)

    response = call(db, caller, body(entity, row, source="  HOD office  "))

    sql, _ = db.updates[0]
    assert response.status_code == 204
    assert set_columns(sql) == VERIFICATION_COLUMNS
    assert row["verification_status"] == "verified"
    assert row["source"] == "HOD office"  # trimmed, and it replaced the long technical source
    assert row["verified_by"] == caller["id"]
    assert row["verified_at"] is not None and row["verified_at"] > VERIFIED_AT
    assert row["updated_at"] > OLD
    assert content_of(row) == before  # no content field changed


def test_outdated_keeps_who_verified_and_when():
    caller = callers()["faculty_eng"]
    row = verified_row()
    db = make_db(caller, "lecturers", row)

    response = call(db, caller, body("lecturers", row, "outdated"))

    sql, _ = db.updates[0]
    assert response.status_code == 204
    assert set_columns(sql) == {"verification_status", "source"}
    assert row["verification_status"] == "outdated"
    assert row["verified_by"] == PREVIOUS_VERIFIER
    assert row["verified_at"] == VERIFIED_AT
    assert row["source"] == "HOD office"


def test_unverified_clears_who_verified_and_when():
    caller = callers()["dept_csc"]
    row = verified_row()
    db = make_db(caller, "lecturers", row)

    response = call(db, caller, body("lecturers", row, "unverified"))

    sql, _ = db.updates[0]
    assert response.status_code == 204
    assert set_columns(sql) == VERIFICATION_COLUMNS
    assert row["verification_status"] == "unverified"
    assert row["verified_by"] is None and row["verified_at"] is None
    assert row["source"] == "HOD office"


@pytest.mark.parametrize("status", STATUSES)
def test_a_new_source_replaces_the_stored_one_for_any_status(status):
    caller = callers()["super"]
    row = verified_row()
    db = make_db(caller, "lecturers", row)

    call(db, caller, body("lecturers", row, status, source="Faculty website"))

    assert row["source"] == "Faculty website"
    assert row["verification_status"] == status


def test_only_the_caller_id_and_the_server_clock_are_recorded():
    caller = callers()["super"]
    row = entity_row("lecturers", "csc", source="HOD office")
    db = make_db(caller, "lecturers", row)
    payload = body(
        "lecturers", row, verified_by=str(uuid.uuid4()), verified_at="2000-01-01T00:00:00Z"
    )

    call(db, caller, payload)

    _, params = db.updates[0]
    assert set(params) == {"id", "source", "verified_by"}
    assert params["verified_by"] == caller["id"]
    assert row["verified_at"].year >= 2026


# ----------------------------------------------------------------- idempotence


def test_verifying_twice_with_the_same_values_changes_nothing_the_second_time():
    caller = callers()["super"]
    row = entity_row("lecturers", "csc", source="HOD office")
    db = make_db(caller, "lecturers", row)

    first = call(db, caller, body("lecturers", row))
    snapshot = dict(row)
    second = call(db, caller, body("lecturers", row))

    assert (first.status_code, second.status_code) == (204, 204)
    assert second.content == b""
    assert len(db.updates) == 1  # the second call wrote nothing
    assert row == snapshot  # verified_at and updated_at did not move


def test_another_admin_verifying_the_same_values_does_not_take_over():
    row = verified_row()
    second_admin = callers()["faculty_eng"]
    db = make_db(second_admin, "lecturers", row)

    response = call(db, second_admin, body("lecturers", row, source="HOD office"))

    assert response.status_code == 204
    assert db.updates == []
    assert row["verified_by"] == PREVIOUS_VERIFIER
    assert row["verified_at"] == VERIFIED_AT


def test_verifying_with_a_changed_source_records_the_new_verifier_and_time():
    caller = callers()["faculty_eng"]
    row = verified_row()
    db = make_db(caller, "lecturers", row)

    call(db, caller, body("lecturers", row, source="Faculty website"))

    assert row["verified_by"] == caller["id"]
    assert row["verified_at"] > VERIFIED_AT


@pytest.mark.parametrize("status", ["unverified", "outdated"])
def test_repeating_unverified_or_outdated_writes_nothing(status):
    caller = callers()["super"]
    row = verified_row()
    db = make_db(caller, "lecturers", row)

    call(db, caller, body("lecturers", row, status))
    call(db, caller, body("lecturers", row, status))

    assert len(db.updates) == 1


def test_an_unverified_row_with_a_leftover_verifier_is_cleaned():
    caller = callers()["super"]
    row = entity_row(
        "lecturers", "csc", source="HOD office", verified_by=PREVIOUS_VERIFIER, verified_at=OLD
    )
    db = make_db(caller, "lecturers", row)

    call(db, caller, body("lecturers", row, "unverified"))

    assert row["verified_by"] is None and row["verified_at"] is None


# ----------------------------------------------------------------- the SQL


def test_entity_types_match_the_contract_and_map_to_a_fixed_list_of_tables():
    contract = SPEC["components"]["schemas"]["VerifyRequest"]["properties"]["entity_type"]["enum"]

    assert set(contract) == set(admin_router.ENTITIES)
    assert {e.table for e in admin_router.ENTITIES.values()} == set(contract)
    assert set(admin_router.UPDATE_SQL) == {(n, s) for n in contract for s in STATUSES}


def test_every_update_is_one_parameterised_statement_that_never_touches_content():
    for (name, status), sql in admin_router.UPDATE_SQL.items():
        table = admin_router.ENTITIES[name].table
        assert sql.startswith(f"UPDATE {table} SET verification_status = '{status}'")
        assert "WHERE id = %(id)s AND deleted_at IS NULL" in sql
        assert ";" not in sql
        assert set_columns(sql) <= VERIFICATION_COLUMNS
        assert "deleted_at =" not in sql


def test_the_selects_read_only_live_rows_by_id():
    for entity in admin_router.ENTITIES.values():
        assert entity.select.endswith("WHERE id = %(id)s AND deleted_at IS NULL")
        assert f" FROM {entity.table} " in entity.select


# ----------------------------------------------------------------- /sync


def test_a_verified_row_reaches_sync_with_its_new_status():
    caller = callers()["super"]
    faculty = record(short_name="SCI", source="long technical seed source, UNVERIFIED")
    since = datetime.now(timezone.utc) - timedelta(hours=1)
    clock = datetime.now(timezone.utc) + timedelta(minutes=1)

    def sync():
        app.dependency_overrides[get_conn] = lambda: SyncFakeDb(clock, faculties=[faculty])
        return TestClient(app).get("/api/v1/sync", params={"since": since.isoformat()})

    assert sync().json()["faculties"] == []  # not changed since `since`

    response = call(
        make_db(caller, "faculties", faculty),
        caller,
        body("faculties", faculty, source="Registrar's office"),
    )
    (synced,) = sync().json()["faculties"]

    assert response.status_code == 204
    assert synced["id"] == str(faculty["id"])
    assert synced["verification"]["status"] == "verified"
    assert synced["verification"]["source"] == "Registrar's office"
    assert synced["verification"]["verified_by"] == str(caller["id"])
    assert synced["name"] == "Stored name"
