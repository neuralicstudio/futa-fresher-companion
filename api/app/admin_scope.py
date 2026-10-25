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
