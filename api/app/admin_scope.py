"""Which records an admin may manage. One copy, used by announcements and by /admin/verify.

The role and the faculty/department always come from the database row of the caller
(get_current_user), never from the token. The scope of the record comes from the STORED row,
never from the request.
"""

import uuid
from typing import Any

from psycopg import Connection

DEPARTMENT_FACULTY = "SELECT faculty_id FROM departments WHERE id = %(id)s AND deleted_at IS NULL"


def may_publish(
    conn: Connection,
    admin: dict[str, Any],
    scope: str,
    faculty_id: uuid.UUID | None,
    department_id: uuid.UUID | None,
) -> bool:
    """Each admin role works only inside its own scope. The database role is the source."""
    role = admin["role"]
    if role == "super_admin":
        return True
    if role == "sug":
        return scope == "sug"
    if role == "faculty_admin":
        if scope == "faculty":
            return faculty_id == admin["faculty_id"]
        if scope == "department":
            return may_manage_department(conn, admin, department_id)
        return False
    if role == "department_admin":
        return scope == "department" and department_id == admin["department_id"]
    return False


def may_manage_department(
    conn: Connection, admin: dict[str, Any], department_id: uuid.UUID | None
) -> bool:
    """Records that belong to a department (the department's own row is not one of them).

    super_admin: any. faculty_admin: the department's faculty is their faculty (looked up, and a
    soft-deleted department has none). department_admin: their own department.
    """
    role = admin["role"]
    if role == "super_admin":
        return True
    if department_id is None:
        return False
    if role == "faculty_admin":
        if admin["faculty_id"] is None:
            return False
        row = conn.execute(DEPARTMENT_FACULTY, {"id": department_id}).fetchone()
        return row is not None and row["faculty_id"] == admin["faculty_id"]
    if role == "department_admin":
        return admin["department_id"] is not None and department_id == admin["department_id"]
    return False


NEVER = "1 = 0"
ALWAYS = "1 = 1"


def verifiable_sql(admin: dict[str, Any], kind: str) -> tuple[str, dict[str, Any]]:
    """The SQL condition for "this admin may verify this record", for the verify queue.

    The same rules as the per-record checks in app/routers/admin.py (_department,
    _in_a_department, _announcement) and as may_publish / may_manage_department above, written as
    SQL, because a queue has to filter, page and count in the database. A test
    (tests/test_verify_queue.py) runs every role against every kind and fails if this and the
    per-record checks ever disagree. Change them together.

    The condition reads these aliases, which the query builder provides:
      t  the record itself
      d  its department, LEFT JOINed on t.department_id (records that belong to a department,
         and announcements)
    It uses only the named parameters it returns, never a value from the request, so it is safe
    to splice into a query. A role or kind with no access gets a condition that is never true.
    """
    role = admin["role"]
    if role == "super_admin":
        return ALWAYS, {}
    faculty = admin["faculty_id"]
    department = admin["department_id"]

    if kind in ("faculties", "buildings"):
        return NEVER, {}  # super_admin only

    if kind == "departments":
        if role == "faculty_admin" and faculty is not None:
            return "t.faculty_id = %(scope_faculty_id)s", {"scope_faculty_id": faculty}
        if role == "department_admin" and department is not None:
            return "t.id = %(scope_department_id)s", {"scope_department_id": department}
        return NEVER, {}

    if kind == "announcements":
        if role == "sug":
            return "t.scope = 'sug'", {}
        if role == "faculty_admin" and faculty is not None:
            return (
                "((t.scope = 'faculty' AND t.faculty_id = %(scope_faculty_id)s)"
                " OR (t.scope = 'department' AND d.deleted_at IS NULL"
                " AND d.faculty_id = %(scope_faculty_id)s))",
                {"scope_faculty_id": faculty},
            )
        if role == "department_admin" and department is not None:
            return (
                "(t.scope = 'department' AND t.department_id = %(scope_department_id)s)",
                {"scope_department_id": department},
            )
        return NEVER, {}

    # lecturers, courses, class_reps, timetable_entries: records of a department.
    if role == "faculty_admin" and faculty is not None:
        # A soft-deleted department has no faculty for this purpose, as in may_manage_department.
        return (
            "(d.deleted_at IS NULL AND d.faculty_id = %(scope_faculty_id)s)",
            {"scope_faculty_id": faculty},
        )
    if role == "department_admin" and department is not None:
        return "t.department_id = %(scope_department_id)s", {"scope_department_id": department}
    return NEVER, {}
