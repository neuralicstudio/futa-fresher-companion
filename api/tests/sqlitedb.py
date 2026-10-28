"""A real SQL engine (in-memory SQLite) behind the same `conn.execute(sql, params)` the routes use.

Why: the verify queue is SQL (a UNION ALL, joins, keyset paging, counts). FakeDb cannot run SQL,
so a fake would test a copy of the logic. This runs the real query text. The queue SQL is written in
the portable subset both SQLite and PostgreSQL accept (row-value comparison, CAST, COALESCE,
LEFT JOIN, UNION ALL, substr), and this adapter only turns psycopg's `%(name)s` into `:name` and
python values into what SQLite stores (UUIDs and datetimes as text, same format everywhere).

What it does NOT test: PostgreSQL itself (planner, uuid and timestamptz types, enum casts). The
queue SQL was also run read-only against the Neon dev branch; see the pull request.
"""

import re
import sqlite3
import uuid
from datetime import datetime, timezone

from tests.fakedb import FakeCursor

UUID_COLUMNS = {
    "id",
    "faculty_id",
    "department_id",
    "course_id",
    "venue_building_id",
    "author_id",
    "verified_by",
}
TIME_COLUMNS = {
    "created_at",
    "updated_at",
    "verified_at",
    "published_at",
    "expires_at",
    "deleted_at",
}
BOOL_COLUMNS = {"is_active", "consent_given"}

_VERIFICATION = (
    "verification_status TEXT NOT NULL DEFAULT 'unverified', source TEXT, verified_by TEXT,"
    " verified_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT"
)
SCHEMA = [
    "CREATE TABLE users (id TEXT PRIMARY KEY, full_name TEXT, email TEXT, role TEXT,"
    " matric_no TEXT,"
    " department_id TEXT, faculty_id TEXT, level INTEGER, is_active INTEGER, created_at TEXT,"
    " updated_at TEXT)",
    f"CREATE TABLE faculties (id TEXT PRIMARY KEY, name TEXT, short_name TEXT, {_VERIFICATION})",
    "CREATE TABLE departments (id TEXT PRIMARY KEY, faculty_id TEXT, name TEXT, short_name TEXT,"
    f" hod_name TEXT, office_location TEXT, {_VERIFICATION})",
    "CREATE TABLE lecturers (id TEXT PRIMARY KEY, department_id TEXT, full_name TEXT, title TEXT,"
    f" rank TEXT, email TEXT, office_location TEXT, specialization TEXT, {_VERIFICATION})",
    "CREATE TABLE courses (id TEXT PRIMARY KEY, department_id TEXT, code TEXT, title TEXT,"
    f" units INTEGER, level INTEGER, semester INTEGER, {_VERIFICATION})",
    "CREATE TABLE class_reps (id TEXT PRIMARY KEY, department_id TEXT, level INTEGER,"
    " full_name TEXT,"
    f" contact TEXT, consent_given INTEGER, {_VERIFICATION})",
    "CREATE TABLE buildings (id TEXT PRIMARY KEY, name TEXT, type TEXT, description TEXT,"
    f" {_VERIFICATION})",
    "CREATE TABLE timetable_entries (id TEXT PRIMARY KEY, department_id TEXT, level INTEGER,"
    " semester INTEGER, course_id TEXT, day_of_week INTEGER, start_time TEXT, end_time TEXT,"
    f" venue_building_id TEXT, venue_note TEXT, {_VERIFICATION})",
    "CREATE TABLE announcements (id TEXT PRIMARY KEY, title TEXT, body TEXT, scope TEXT,"
    " faculty_id TEXT, department_id TEXT, author_id TEXT, published_at TEXT, expires_at TEXT,"
    f" {_VERIFICATION})",
]


def to_db(value):
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat(timespec="microseconds")
    if isinstance(value, bool):
        return int(value)
    return value


def from_db(column, value):
    if value is None:
        return None
    if column in UUID_COLUMNS and isinstance(value, str):
        return uuid.UUID(value)
    if column in TIME_COLUMNS and isinstance(value, str):
        return datetime.fromisoformat(value)
    if column in BOOL_COLUMNS:
        return bool(value)
    return value


class SqliteDb:
    def __init__(self):
        # Sync routes run in a worker thread, so the connection must be usable from it.
        self.con = sqlite3.connect(":memory:", check_same_thread=False)
        for statement in SCHEMA:
            self.con.execute(statement)
        self.queries = []
        self.params = []

    def add(self, table, **fields):
        """Insert a row. Verification and time columns get their defaults. Returns the row's id."""
        now = datetime.now(timezone.utc)
        row = {"id": uuid.uuid4(), "created_at": now, "updated_at": now, **fields}
        columns = ", ".join(row)
        marks = ", ".join(f":{name}" for name in row)
        self.con.execute(
            f"INSERT INTO {table} ({columns}) VALUES ({marks})",
            {name: to_db(value) for name, value in row.items()},
        )
        return row["id"]

    def set(self, table, row_id, **fields):
        """Change columns of one row, as another admin's request would between two pages."""
        assignments = ", ".join(f"{name} = :{name}" for name in fields)
        self.con.execute(
            f"UPDATE {table} SET {assignments} WHERE id = :row_id",
            {**{name: to_db(value) for name, value in fields.items()}, "row_id": str(row_id)},
        )

    def execute(self, sql, params=None):
        self.queries.append(sql)
        self.params.append(params or {})
        statement = re.sub(r"%\((\w+)\)s", r":\1", sql)
        cursor = self.con.execute(
            statement, {name: to_db(value) for name, value in (params or {}).items()}
        )
        names = [column[0] for column in cursor.description or []]
        rows = [
            {name: from_db(name, value) for name, value in zip(names, row, strict=True)}
            for row in cursor.fetchall()
        ]
        return FakeCursor(rows)

    def non_user_queries(self):
        """Queries other than the caller lookup that every authenticated route makes."""
        return [sql for sql in self.queries if "FROM users" not in sql]
