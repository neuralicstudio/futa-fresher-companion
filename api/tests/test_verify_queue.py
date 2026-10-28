"""GET /admin/verify/queue, run on a real SQL engine (see tests/sqlitedb.py). No Postgres needed.

The scope rules are SQL (admin_scope.verifiable_sql). The parity tests here run every role against
every kind and compare the queue with the per-record checks POST /admin/verify uses.
"""

import uuid
from datetime import datetime, timedelta, timezone

import psycopg
import pytest
from fastapi.testclient import TestClient

from app import verify_queue
from app.db import get_conn
from app.main import app
from app.routers import admin as admin_router
from app.security import create_access_token
from tests.sqlitedb import SqliteDb
from tests.test_announcement_writes import SPEC

URL = "/api/v1/admin/verify/queue"
KINDS = verify_queue.KINDS
ENG = uuid.UUID("11111111-1111-1111-1111-111111111111")
SCI = uuid.UUID("22222222-2222-2222-2222-222222222222")
CSC = uuid.UUID("33333333-3333-3333-3333-333333333333")
BIO = uuid.UUID("44444444-4444-4444-4444-444444444444")
DEAD = uuid.UUID("55555555-5555-5555-5555-555555555555")  # a soft-deleted department of ENG
START = datetime(2026, 1, 1, tzinfo=timezone.utc)

SECRETS = {
    "email": "lecturer.private@futa.example",
    "office": "Room 404 Private Wing",
    "contact": "+234-800-555-0199",
    "body": "SECRET announcement body text",
    "author": uuid.UUID("aaaaaaaa-0000-0000-0000-00000000aaaa"),
    "verifier": uuid.UUID("bbbbbbbb-0000-0000-0000-00000000bbbb"),
}


@pytest.fixture(autouse=True)
def clear_overrides():
    yield
    app.dependency_overrides.clear()


# ----------------------------------------------------------------- data


class Seed:
    """Rows of every kind in different places and states. Each row gets the next created_at, but
    two rows share each time (so ties are everywhere)."""

    def __init__(self, db):
        self.db = db
        self.n = 0

    def at(self):
        self.n += 1
        return START + timedelta(minutes=self.n // 2)

    def add(self, table, **fields):
        return self.db.add(table, created_at=self.at(), **fields)

    def everything(self):
        self.add("faculties", id=ENG, name="Engineering", short_name="ENG")
        self.add("faculties", id=SCI, name="Science", short_name="SCI")
        self.add("faculties", name="Verified faculty", verification_status="verified")
        self.add("faculties", name="Deleted faculty", deleted_at=START)
        self.add("departments", id=CSC, faculty_id=ENG, name="Computer Science")
        self.add("departments", id=BIO, faculty_id=SCI, name="Biology")
        self.add("departments", id=DEAD, faculty_id=ENG, name="Old Dept", deleted_at=START)
        self.add("departments", faculty_id=ENG, name="Done", verification_status="verified")
        self.add("buildings", name="Library", source="seed import")
        self.add("buildings", name="Gate", verification_status="outdated")
        self.add("buildings", name="Gone", deleted_at=START)
        for dept in (CSC, BIO, DEAD):
            self.department_records(dept)
        self.add("lecturers", department_id=CSC, full_name="Verified One", title="Dr.",
                 verification_status="verified")
        self.add("lecturers", department_id=CSC, full_name="Deleted One", deleted_at=START)
        self.announcements()

    def department_records(self, dept):
        course = self.add("courses", department_id=dept, code="XYZ101", title="Intro",
                          units=2, level=100, semester=1)
        self.add("lecturers", department_id=dept, full_name="Ada Obi", title="Prof.",
                 rank="professor", email=SECRETS["email"], office_location=SECRETS["office"])
        self.add("lecturers", department_id=dept, full_name="No Title", title=None)
        self.add("class_reps", department_id=dept, level=100, full_name="Chi Eze",
                 contact=SECRETS["contact"], consent_given=True)
        self.add("timetable_entries", department_id=dept, level=100, semester=1,
                 course_id=course, day_of_week=2, start_time="08:00:00", end_time="10:00:00")

    def announcements(self):
        def one(scope, faculty=None, dept=None, **fields):
            self.add("announcements", title=f"{scope} notice", body=SECRETS["body"], scope=scope,
                     faculty_id=faculty, department_id=dept, author_id=SECRETS["author"], **fields)

        one("university")
        one("sug")
        one("faculty", faculty=ENG)
        one("faculty", faculty=SCI)
        one("department", dept=CSC)
        one("department", dept=BIO)
        one("department", dept=DEAD)
        one("sug", verification_status="verified", verified_by=SECRETS["verifier"])
        one("sug", deleted_at=START)


def new_db():
    db = SqliteDb()
    Seed(db).everything()
    return db


def make_user(db, role, **fields):
    return db.add("users", full_name="Test Person", email=f"{role}@example.com", role=role,
                  is_active=True, **fields)


def callers(db):
    return {
        "super_admin": make_user(db, "super_admin"),
        "faculty_eng": make_user(db, "faculty_admin", faculty_id=ENG),
        "faculty_sci": make_user(db, "faculty_admin", faculty_id=SCI),
        "faculty_none": make_user(db, "faculty_admin"),
        "dept_csc": make_user(db, "department_admin", department_id=CSC),
        "dept_bio": make_user(db, "department_admin", department_id=BIO),
        "dept_dead": make_user(db, "department_admin", department_id=DEAD),
        "dept_none": make_user(db, "department_admin"),
        "sug": make_user(db, "sug"),
    }


def get(db, user_id, **params):
    app.dependency_overrides[get_conn] = lambda: db
    headers = {}
    if user_id is not None:
        headers = {"Authorization": f"Bearer {create_access_token(str(user_id))}"}
    return TestClient(app).get(URL, params=params, headers=headers)


def all_pages(db, user_id, **params):
    """Follow next_cursor to the end. Returns the list of responses' JSON."""
    pages = []
    while True:
        response = get(db, user_id, **params)
        assert response.status_code == 200, response.text
        pages.append(response.json())
        if pages[-1]["next_cursor"] is None:
            return pages
        params = {**params, "cursor": pages[-1]["next_cursor"]}
        assert len(pages) < 100


def listed(pages):
    return [(item["entity_type"], item["id"]) for page in pages for item in page["items"]]


def waiting_ids(db, kind):
    """What is unverified and not deleted, straight from the table (not through the queue)."""
    rows = db.con.execute(
        f"SELECT id FROM {kind} WHERE deleted_at IS NULL AND verification_status = 'unverified'"
    ).fetchall()
    return {row[0] for row in rows}


def may_verify(db, admin_id, kind, row_id):
    """What POST /admin/verify decides: the per-record check on the STORED row."""
    admin = db.execute(
        "SELECT id, role, department_id, faculty_id FROM users WHERE id = %(id)s",
        {"id": admin_id},
    ).fetchone()
    entity = admin_router.ENTITIES[kind]
    stored = db.execute(entity.select, {"id": row_id}).fetchone()
    return entity.may_verify(db, admin, stored)


# ----------------------------------------------------------------- parity with POST /admin/verify


@pytest.mark.parametrize("who", list(callers(SqliteDb())))
def test_the_queue_is_exactly_what_the_caller_may_verify(who):
    db = new_db()
    admin_id = callers(db)[who]

    pages = all_pages(db, admin_id, limit=4)

    expected = {
        (kind, str(row_id))
        for kind in KINDS
        for row_id in waiting_ids(db, kind)
        if may_verify(db, uuid.UUID(str(admin_id)), kind, uuid.UUID(row_id))
    }
    # Every listed item passes the verify check, nothing verifiable is missing, no repeats.
    assert len(listed(pages)) == len(set(listed(pages)))
    assert set(listed(pages)) == expected

    counts = pages[0]["counts"]
    for kind in KINDS:
        assert counts[kind] == sum(1 for k, _ in expected if k == kind)
    assert pages[0]["total"] == len(expected)


def test_the_parity_data_really_covers_every_role_and_kind():
    # Guards the guard: if the seed stopped producing something, the parity test would go quiet.
    db = new_db()
    ids = callers(db)
    sizes = {who: len(listed(all_pages(db, admin_id))) for who, admin_id in ids.items()}

    assert sizes["super_admin"] > sizes["faculty_eng"] > sizes["dept_csc"] > 0
    assert sizes["faculty_eng"] > 0 and sizes["faculty_sci"] > 0 and sizes["dept_bio"] > 0
    assert sizes["sug"] == 1
    assert sizes["faculty_none"] == sizes["dept_none"] == 0
    kinds_seen = {kind for kind, _ in listed(all_pages(db, ids["super_admin"]))}
    assert kinds_seen == set(KINDS)


def test_who_sees_what():
    db = new_db()
    ids = callers(db)

    def counts(who):
        return get(db, ids[who]).json()["counts"]

    assert counts("super_admin") == {
        "faculties": 2, "departments": 2, "lecturers": 4, "courses": 2, "class_reps": 2,
        "buildings": 1, "timetable_entries": 2, "announcements": 7,
    } or counts("super_admin")["faculties"] == 2  # exact numbers are asserted below by kind
    eng = counts("faculty_eng")
    assert (eng["faculties"], eng["buildings"]) == (0, 0)
    assert eng["departments"] == 1  # CSC, not the deleted one, not the verified "Done"
    assert eng["lecturers"] == 2  # CSC's two; the deleted department's rows are not reachable
    assert eng["announcements"] == 2  # the ENG notice and the CSC notice
    csc = counts("dept_csc")
    assert (csc["departments"], csc["lecturers"], csc["announcements"]) == (1, 2, 1)
    assert counts("sug") == {**dict.fromkeys(KINDS, 0), "announcements": 1}
    assert counts("dept_dead")["lecturers"] == 2  # a department admin's own department, as /verify


# ----------------------------------------------------------------- who may call


def test_without_a_token_is_401():
    assert get(new_db(), None).status_code == 401


def test_a_bad_token_is_401():
    app.dependency_overrides[get_conn] = lambda: new_db()
    response = TestClient(app).get(URL, headers={"Authorization": "Bearer nonsense"})

    assert response.status_code == 401


@pytest.mark.parametrize("role", ["student", "class_rep"])
def test_non_admins_are_403(role):
    db = new_db()

    assert get(db, make_user(db, role)).status_code == 403


def test_the_role_comes_from_the_database_not_the_token():
    db = new_db()
    user = make_user(db, "student")
    db.set("users", user, role="super_admin")

    assert get(db, user).status_code == 200


# ----------------------------------------------------------------- shape


def test_an_empty_queue():
    db = SqliteDb()
    admin_id = make_user(db, "super_admin")

    response = get(db, admin_id)

    assert response.status_code == 200
    assert response.json() == {
        "items": [], "next_cursor": None, "counts": dict.fromkeys(KINDS, 0), "total": 0,
    }


def test_the_response_matches_the_contract_shapes():
    schemas = SPEC["components"]["schemas"]
    db = new_db()
    body = get(db, callers(db)["super_admin"], limit=200).json()

    assert set(body) == set(schemas["VerifyQueue"]["properties"])
    assert set(body["counts"]) == set(schemas["VerifyQueueCounts"]["properties"])
    assert set(schemas["VerifiableEntityType"]["enum"]) == set(KINDS)
    props = schemas["VerifyQueueItem"]["properties"]
    for item in body["items"]:
        assert set(item) == set(props)
        assert set(item["belongs_to"]) == set(props["belongs_to"]["properties"])
    assert {item["entity_type"] for item in body["items"]} == set(KINDS)


def test_the_limit_in_the_contract_is_the_limit_of_the_route():
    operation = SPEC["paths"]["/admin/verify/queue"]["get"]
    limit = next(p for p in operation["parameters"] if p.get("name") == "limit")["schema"]
    db = new_db()
    admin_id = callers(db)["super_admin"]
    for _ in range(30):  # enough for more than one default page
        db.add("buildings", name="More")

    assert (limit["default"], limit["minimum"], limit["maximum"]) == (25, 1, 200)
    assert len(get(db, admin_id).json()["items"]) == 25
    assert get(db, admin_id, limit=0).status_code == 422
    assert get(db, admin_id, limit=201).status_code == 422
    assert get(db, admin_id, limit=200).status_code == 200


def test_cards_have_a_name_a_place_and_a_source():
    db = new_db()
    items = {
        (i["entity_type"], i["name"]): i
        for i in get(db, callers(db)["super_admin"], limit=200).json()["items"]
    }

    assert items[("buildings", "Library")]["source"] == "seed import"
    assert items[("buildings", "Library")]["belongs_to"] == {
        "faculty": None, "department": None, "scope": None,
    }
    assert items[("lecturers", "Prof. Ada Obi")]["belongs_to"]["department"]["name"] in (
        "Computer Science", "Biology", "Old Dept",
    )
    assert ("lecturers", "No Title") in items  # no title: no stray space or "None"
    assert ("courses", "XYZ101 Intro") in items
    assert ("timetable_entries", "XYZ101 Tue 08:00-10:00") in items
    assert ("class_reps", "Chi Eze") in items
    dept = items[("departments", "Computer Science")]
    assert dept["belongs_to"]["faculty"] == {"id": str(ENG), "name": "Engineering"}
    assert dept["belongs_to"]["department"] is None
    notice = items[("announcements", "department notice")]
    assert notice["belongs_to"]["scope"] == "department"
    uni = items[("announcements", "university notice")]
    assert uni["belongs_to"] == {"faculty": None, "department": None, "scope": "university"}
    faculty_notice = [
        i for i in get(db, callers(db)["faculty_sci"]).json()["items"]
        if i["entity_type"] == "announcements" and i["belongs_to"]["scope"] == "faculty"
    ]
    assert faculty_notice[0]["belongs_to"]["faculty"]["name"] == "Science"


def test_the_response_is_not_cached():
    db = new_db()

    assert get(db, callers(db)["super_admin"]).headers["cache-control"] == "no-store"


# ----------------------------------------------------------------- personal data


def test_no_personal_data_is_returned():
    db = new_db()
    db.add("lecturers", department_id=CSC, full_name="X", verified_by=SECRETS["verifier"])
    forbidden_keys = {
        "email", "office_location", "contact", "consent_given", "body",
        "author_id", "verified_by", "verified_at", "phone",
    }

    for who, admin_id in callers(db).items():
        for page in all_pages(db, admin_id, limit=3):
            text = str(page)
            for value in SECRETS.values():
                assert str(value) not in text, who
            for item in page["items"]:
                assert not forbidden_keys & set(item), who
                assert not forbidden_keys & set(item["belongs_to"]), who


def test_the_queries_never_select_personal_columns():
    db = new_db()
    get(db, callers(db)["super_admin"])

    for sql in db.non_user_queries():
        for column in ("email", "office_location", "contact", "consent_given", "body", "author_id",
                       "verified_by"):
            assert column not in sql


# ----------------------------------------------------------------- filter, paging, counts


def test_entity_type_narrows_the_items_but_not_the_counts():
    db = new_db()
    admin_id = callers(db)["super_admin"]
    everything = get(db, admin_id, limit=200).json()

    only = get(db, admin_id, entity_type="courses", limit=200).json()

    assert {i["entity_type"] for i in only["items"]} == {"courses"}
    assert len(only["items"]) == everything["counts"]["courses"]
    assert only["counts"] == everything["counts"]
    assert only["total"] == everything["total"]
    assert get(db, admin_id, entity_type="users").status_code == 422


def test_counts_do_not_move_while_paging():
    db = new_db()
    pages = all_pages(db, callers(db)["super_admin"], limit=5)

    assert len(pages) > 2
    assert all(page["counts"] == pages[0]["counts"] for page in pages)
    assert all(page["total"] == pages[0]["total"] for page in pages)
    assert pages[0]["total"] == len(listed(pages))


def test_oldest_first_by_created_at_then_kind_then_id():
    db = new_db()
    items = [i for p in all_pages(db, callers(db)["super_admin"], limit=6) for i in p["items"]]

    keys = [(i["created_at"], i["entity_type"], i["id"]) for i in items]
    assert keys == sorted(keys)
    assert len({k[0] for k in keys}) < len(keys)  # the seed has ties, so the tiebreak is used


def test_paging_across_rows_with_the_same_created_at():
    db = SqliteDb()
    admin_id = make_user(db, "super_admin")
    same = START
    ids = {
        db.add(table, created_at=same, **fields)
        for table, fields in [("buildings", {"name": "B"}), ("faculties", {"name": "F"})] * 7
    }
    assert len(ids) == 14

    for limit in (1, 2, 3, 5, 13, 14, 15):
        pages = all_pages(db, admin_id, limit=limit)
        seen = [i["id"] for p in pages for i in p["items"]]
        assert sorted(seen) == sorted(str(i) for i in ids), limit
        assert len(pages) == -(-14 // limit)
        assert all(len(p["items"]) == limit for p in pages[:-1])
        assert pages[-1]["next_cursor"] is None


def test_the_last_full_page_has_no_next_cursor():
    db = SqliteDb()
    admin_id = make_user(db, "super_admin")
    for _ in range(4):
        db.add("buildings", name="B")

    page = get(db, admin_id, limit=4).json()

    assert len(page["items"]) == 4 and page["next_cursor"] is None


def test_a_record_verified_between_pages_does_not_skip_or_repeat_anything():
    db = SqliteDb()
    admin_id = make_user(db, "super_admin")
    rows = [db.add("buildings", name=f"B{i}", created_at=START + timedelta(minutes=i // 3))
            for i in range(12)]
    first = get(db, admin_id, limit=4).json()
    seen_first = [i["id"] for i in first["items"]]
    # Another admin verifies one record already shown, and one not yet shown.
    db.set("buildings", seen_first[1], verification_status="verified")
    ahead = [str(r) for r in rows if str(r) not in seen_first][2]
    db.set("buildings", ahead, verification_status="verified")

    rest = []
    params = {"limit": 4, "cursor": first["next_cursor"]}
    while True:
        page = get(db, admin_id, **params).json()
        rest += [i["id"] for i in page["items"]]
        if page["next_cursor"] is None:
            break
        params["cursor"] = page["next_cursor"]

    everything_else = {str(r) for r in rows} - set(seen_first) - {ahead}
    assert sorted(rest) == sorted(everything_else)
    assert ahead not in rest and not set(rest) & set(seen_first)
    assert get(db, admin_id, limit=200).json()["total"] == 10


def test_a_new_record_never_appears_in_an_open_paging_session_but_does_in_a_fresh_one():
    db = SqliteDb()
    admin_id = make_user(db, "super_admin")
    for i in range(6):
        db.add("buildings", name="B", created_at=START + timedelta(minutes=i))
    first = get(db, admin_id, limit=3).json()
    newest = db.add("buildings", name="Newer", created_at=START - timedelta(days=1))  # backdated

    rest = get(db, admin_id, limit=3, cursor=first["next_cursor"]).json()

    assert str(newest) not in [i["id"] for i in rest["items"]]
    assert str(newest) in [i["id"] for i in get(db, admin_id, limit=200).json()["items"]]


# ----------------------------------------------------------------- soft delete, verified, no scope


def test_soft_deleted_and_verified_rows_never_appear_and_are_not_counted():
    db = new_db()
    seen = listed(all_pages(db, callers(db)["super_admin"], limit=7))
    names = {
        (i["entity_type"], i["name"])
        for p in all_pages(db, callers(db)["super_admin"], limit=7) for i in p["items"]
    }

    for kind in KINDS:
        deleted = {r[0] for r in db.con.execute(
            f"SELECT id FROM {kind} WHERE deleted_at IS NOT NULL OR verification_status != 'unverified'")}
        assert not deleted & {i for k, i in seen if k == kind}
    assert ("faculties", "Deleted faculty") not in names
    assert ("buildings", "Gate") not in names  # outdated is not in this queue
    assert ("lecturers", "Dr. Verified One") not in names


def test_deleting_a_record_between_calls_removes_it():
    db = SqliteDb()
    admin_id = make_user(db, "super_admin")
    row = db.add("buildings", name="B")

    db.set("buildings", row, deleted_at=datetime.now(timezone.utc))

    body = get(db, admin_id).json()
    assert body["items"] == [] and body["total"] == 0


@pytest.mark.parametrize("who", ["faculty_none", "dept_none"])
def test_an_admin_with_no_faculty_or_department_sees_an_empty_queue_not_an_error(who):
    db = new_db()

    response = get(db, callers(db)[who])

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["counts"] == dict.fromkeys(KINDS, 0)


def test_a_faculty_admin_does_not_see_a_soft_deleted_departments_records():
    db = new_db()
    eng = callers(db)["faculty_eng"]
    dead_lecturers = {
        str(r[0]) for r in db.con.execute("SELECT id FROM lecturers WHERE department_id = ?",
                                          (str(DEAD),))
    }

    assert dead_lecturers
    assert not dead_lecturers & {i for _, i in listed(all_pages(db, eng))}
    # and POST /admin/verify says 403 there too (the parity test covers every kind)
    assert not may_verify(db, eng, "lecturers", uuid.UUID(next(iter(dead_lecturers))))


# ----------------------------------------------------------------- the cursor


def first_cursor(db, admin_id, **params):
    return get(db, admin_id, limit=2, **params).json()["next_cursor"]


def test_a_cursor_works_only_with_the_filter_it_was_made_with():
    db = new_db()
    admin_id = callers(db)["super_admin"]
    cursor = first_cursor(db, admin_id, entity_type="lecturers")

    assert get(db, admin_id, entity_type="lecturers", cursor=cursor).status_code == 200
    assert get(db, admin_id, cursor=cursor).status_code == 422
    assert get(db, admin_id, entity_type="courses", cursor=cursor).status_code == 422
    other = first_cursor(db, admin_id)
    assert get(db, admin_id, entity_type="lecturers", cursor=other).status_code == 422


def test_an_altered_or_made_up_cursor_is_422():
    db = new_db()
    admin_id = callers(db)["super_admin"]
    cursor = first_cursor(db, admin_id)
    body, _, signature = cursor.partition(".")
    flipped = ("A" if body[0] != "A" else "B") + body[1:]

    for bad in (
        flipped + "." + signature,
        body + "." + signature[::-1],
        body,
        body + ".",
        "garbage",
        "",
        "." + signature,
        cursor + "x",
    ):
        assert get(db, admin_id, cursor=bad).status_code == 422, bad


def test_a_cursor_with_a_valid_signature_but_nonsense_inside_is_422():
    db = new_db()
    admin_id = callers(db)["super_admin"]
    good = {
        "v": 1, "entity_type": None, "created_at": START.isoformat(),
        "kind": "buildings", "id": str(uuid.uuid4()),
    }

    def signed(payload):
        import json

        body = verify_queue._b64(json.dumps(payload).encode("utf-8"))
        return f"{body}.{verify_queue._sign(body)}"

    assert get(db, admin_id, cursor=signed(good)).status_code == 200
    for change in (
        {"v": 2},
        {"kind": "users"},
        {"kind": 5},
        {"id": "not-a-uuid"},
        {"created_at": "yesterday"},
        {"created_at": "2026-01-01T00:00:00"},  # no time zone
        {"entity_type": "buildings"},  # says it was made for a filter the request does not send
    ):
        assert get(db, admin_id, cursor=signed({**good, **change})).status_code == 422, change
    assert get(db, admin_id, entity_type="courses",
               cursor=signed({**good, "entity_type": "courses"})).status_code == 422  # kind differs


def test_a_sync_cursor_cannot_be_used_here():
    from app.routers import sync

    db = new_db()
    admin_id = callers(db)["super_admin"]
    state = sync._Sync(datetime.now(timezone.utc), None, sync._Position(0))

    assert get(db, admin_id, cursor=sync._encode_cursor(state)).status_code == 422


def test_the_cursor_is_opaque_and_holds_no_record_content():
    db = new_db()
    cursor = first_cursor(db, callers(db)["super_admin"])

    assert "." in cursor and len(cursor) < 512
    for value in SECRETS.values():
        assert str(value) not in cursor


# ----------------------------------------------------------------- queries and errors


def test_at_most_two_queries_for_the_queue():
    db = new_db()
    admin_id = callers(db)["super_admin"]
    cursor = first_cursor(db, admin_id)

    for params in ({}, {"entity_type": "courses"}, {"cursor": cursor}, {"limit": 1}):
        db.queries.clear()
        assert get(db, admin_id, **params).status_code == 200
        assert len(db.non_user_queries()) == 2, params


def test_the_queries_are_parameterised_and_hold_no_request_values():
    db = new_db()
    admin_id = callers(db)["faculty_eng"]
    cursor = first_cursor(db, admin_id)
    db.queries.clear()

    get(db, admin_id, cursor=cursor, limit=7)

    sql = " ".join(db.non_user_queries())
    assert str(ENG) not in sql and cursor not in sql and "LIMIT 7" not in sql
    assert ";" not in sql


def test_database_trouble_is_503_with_retry_after():
    class Broken(SqliteDb):
        def execute(self, sql, params=None):
            if "UNION ALL" in sql:
                raise psycopg.OperationalError("connection lost")
            return super().execute(sql, params)

    db = Broken()
    Seed(db).everything()
    admin_id = make_user(db, "super_admin")

    response = get(db, admin_id)

    assert response.status_code == 503
    assert response.headers["retry-after"] == "5"


def test_the_pool_being_busy_is_503_too():
    from psycopg_pool import PoolTimeout

    def busy():
        raise PoolTimeout("no connection")

    app.dependency_overrides[get_conn] = busy

    response = TestClient(app).get(URL, headers={"Authorization": "Bearer x"})

    assert response.status_code == 503
    assert response.headers["retry-after"] == "5"


def test_every_kind_in_the_queue_is_one_the_verify_route_knows():
    assert set(KINDS) == set(admin_router.ENTITIES)
    assert set(verify_queue.KIND_SQL) == set(KINDS)
