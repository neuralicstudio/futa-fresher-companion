"""Admin & Verification system. Owners: Backend + Admin/Data."""

import uuid
from collections.abc import Callable
from dataclasses import dataclass
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from psycopg import Connection
from pydantic import BaseModel, BeforeValidator, Field

from app.admin_scope import may_manage_department, may_publish
from app.auth_deps import AdminUser
from app.db import get_conn
from app.stubs import not_implemented

router = APIRouter(prefix="/admin", tags=["admin"])

DbConn = Annotated[Connection, Depends(get_conn)]

EntityType = Literal[
    "faculties",
    "departments",
    "lecturers",
    "courses",
    "class_reps",
    "buildings",
    "timetable_entries",
    "announcements",
]
Status = Literal["unverified", "verified", "outdated"]
SOURCE_MAX = 300


def _strip(value: Any) -> Any:
    return value.strip() if isinstance(value, str) else value


SourceText = Annotated[str, BeforeValidator(_strip), Field(max_length=SOURCE_MAX)]


class VerifyRequest(BaseModel):
    entity_type: EntityType
    entity_id: uuid.UUID
    status: Status
    # Optional. A blank value counts as not sent, so it never erases the stored source.
    source: SourceText | None = None


# ----------------------------------------------------------------- who may verify what
# Each check gets the caller (from the database) and the STORED row.

Check = Callable[[Connection, dict[str, Any], dict[str, Any]], bool]


def _super_admin_only(conn: Connection, admin: dict[str, Any], row: dict[str, Any]) -> bool:
    return admin["role"] == "super_admin"


def _department(conn: Connection, admin: dict[str, Any], row: dict[str, Any]) -> bool:
    role = admin["role"]
    if role == "super_admin":
        return True
    if role == "faculty_admin":
        return admin["faculty_id"] is not None and row["faculty_id"] == admin["faculty_id"]
    if role == "department_admin":
        return admin["department_id"] is not None and row["id"] == admin["department_id"]
    return False


def _in_a_department(conn: Connection, admin: dict[str, Any], row: dict[str, Any]) -> bool:
    return may_manage_department(conn, admin, row["department_id"])


def _announcement(conn: Connection, admin: dict[str, Any], row: dict[str, Any]) -> bool:
    # The same rule as editing and deleting an announcement.
    return may_publish(conn, admin, row["scope"], row["faculty_id"], row["department_id"])


@dataclass(frozen=True)
class Entity:
    table: str
    select: str  # the stored row: scope columns, then the verification columns
    may_verify: Check


_VERIFICATION_COLUMNS = "verification_status, source, verified_by, verified_at"


def _entity(table: str, scope_columns: str, may_verify: Check) -> Entity:
    # The table name comes from the fixed list below, never from the request.
    select = (
        "SELECT id, "
        + scope_columns
        + _VERIFICATION_COLUMNS
        + " FROM "
        + table
        + " WHERE id = %(id)s AND deleted_at IS NULL"
    )
    return Entity(table, select, may_verify)


# The only tables this route can write to. entity_type is looked up here and nowhere else.
ENTITIES: dict[str, Entity] = {
    "faculties": _entity("faculties", "", _super_admin_only),
    "buildings": _entity("buildings", "", _super_admin_only),
    "departments": _entity("departments", "faculty_id, ", _department),
    "lecturers": _entity("lecturers", "department_id, ", _in_a_department),
    "courses": _entity("courses", "department_id, ", _in_a_department),
    "class_reps": _entity("class_reps", "department_id, ", _in_a_department),
    "timetable_entries": _entity("timetable_entries", "department_id, ", _in_a_department),
    "announcements": _entity("announcements", "scope, faculty_id, department_id, ", _announcement),
}

# ----------------------------------------------------------------- the update
# Fixed fragments for each status. The updated_at trigger on every table bumps updated_at, so
# /sync sends the change (it reads rows with updated_at > since).
_SET = {
    # The caller and the time are recorded.
    "verified": (
        "verification_status = 'verified', source = %(source)s, "
        "verified_by = %(verified_by)s::uuid, verified_at = now()"
    ),
    # Who verified it and when stay as they were.
    "outdated": "verification_status = 'outdated', source = %(source)s",
    "unverified": (
        "verification_status = 'unverified', source = %(source)s, "
        "verified_by = NULL, verified_at = NULL"
    ),
}
_WHERE = " WHERE id = %(id)s AND deleted_at IS NULL RETURNING id"
UPDATE_SQL: dict[tuple[str, str], str] = {
    (name, status): "UPDATE " + entity.table + " SET " + fragment + _WHERE
    for name, entity in ENTITIES.items()
    for status, fragment in _SET.items()
}


@router.post("/verify", status_code=204)
def verify_record(body: VerifyRequest, admin: AdminUser, conn: DbConn):
    entity = ENTITIES[body.entity_type]

    # 1. Unknown or soft-deleted: 404, so a 403 never reveals a row that does not exist.
    stored = conn.execute(entity.select, {"id": body.entity_id}).fetchone()
    if stored is None:
        raise HTTPException(status_code=404, detail="Record not found")
    # 2. Outside this admin's scope, judged on the stored row.
    if not entity.may_verify(conn, admin, stored):
        raise HTTPException(status_code=403, detail="You cannot verify this record")

    # 3. Rules that depend on the row.
    source = body.source if body.source else stored["source"]
    if body.status == "verified" and not (source or "").strip():
        raise HTTPException(
            status_code=422,
            detail="A record needs a source before it can be verified. Send a source.",
        )

    if _nothing_to_change(stored, body.status, source):
        return Response(status_code=204)

    row = conn.execute(
        UPDATE_SQL[(body.entity_type, body.status)],
        {"id": body.entity_id, "source": source, "verified_by": admin["id"]},
    ).fetchone()
    if row is None:  # deleted between the check and the update
        raise HTTPException(status_code=404, detail="Record not found")
    return Response(status_code=204)


@router.get("/verify/queue")
def list_verify_queue():
    # Contract first (docs/DECISIONS.md, decision 10). Built in the next PR with its tests.
    not_implemented()


def _nothing_to_change(stored: dict[str, Any], status: str, source: str | None) -> bool:
    """The same status and source: leave the row alone, so verified_at does not move."""
    if stored["verification_status"] != status or stored["source"] != source:
        return False
    if status == "unverified":
        # An unverified row should carry no verifier. If it does, clear it.
        return stored["verified_by"] is None and stored["verified_at"] is None
    return True
