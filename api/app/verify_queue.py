"""The verify queue: records waiting to be verified, inside the caller's own scope.

Read docs/DECISIONS.md decision 10 before changing this. In short:
- Only `unverified`, not soft-deleted rows, and only what the caller may verify with
  POST /admin/verify. The scope is SQL, from admin_scope.verifiable_sql (one copy of the rules,
  with a parity test against the per-record checks).
- Oldest first by (created_at, entity_type, id). Keyset paging with a signed opaque cursor.
- At most two queries: the page (a UNION ALL of eight small branches) and the counts.
- No personal data: each query selects only the columns an item shows.
"""

import base64
import hashlib
import hmac
import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal

from fastapi import HTTPException
from psycopg import Connection
from pydantic import BaseModel

from app.admin_scope import verifiable_sql
from app.config import settings

# The same eight kinds, in the same order, as the contract (VerifiableEntityType).
KINDS = (
    "faculties",
    "departments",
    "lecturers",
    "courses",
    "class_reps",
    "buildings",
    "timetable_entries",
    "announcements",
)
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
CURSOR_VERSION = 1
CURSOR_DOMAIN = b"verify-queue."  # so a /sync cursor can never be used here, or the other way

# ----------------------------------------------------------------- the response (the contract)


class NamedRef(BaseModel):
    id: uuid.UUID
    name: str


class BelongsTo(BaseModel):
    faculty: NamedRef | None
    department: NamedRef | None
    scope: Literal["university", "sug", "faculty", "department"] | None = None


class VerifyQueueItem(BaseModel):
    entity_type: EntityType
    id: uuid.UUID
    name: str
    belongs_to: BelongsTo
    source: str | None
    created_at: datetime
    updated_at: datetime


class VerifyQueueCounts(BaseModel):
    faculties: int = 0
    departments: int = 0
    lecturers: int = 0
    courses: int = 0
    class_reps: int = 0
    buildings: int = 0
    timetable_entries: int = 0
    announcements: int = 0


class VerifyQueue(BaseModel):
    items: list[VerifyQueueItem]
    next_cursor: str | None
    counts: VerifyQueueCounts
    total: int


# ----------------------------------------------------------------- what each kind selects


@dataclass(frozen=True)
class _Kind:
    """The FROM clause (with the aliases t, d, f) and the columns of an item.

    Everything here is a fixed string in this file. Nothing from the request is ever spliced in.
    The expressions read only non-personal columns: no email, office, contact, consent flag, user
    id or announcement body.
    """

    sources: str
    name: str
    faculty_id: str = "CAST(NULL AS uuid)"
    faculty_name: str = "CAST(NULL AS TEXT)"
    department_id: str = "CAST(NULL AS uuid)"
    department_name: str = "CAST(NULL AS TEXT)"
    scope: str = "CAST(NULL AS TEXT)"


_IN_A_DEPARTMENT = (
    " LEFT JOIN departments d ON d.id = t.department_id"
    " LEFT JOIN faculties f ON f.id = d.faculty_id"
)
_OF_A_DEPARTMENT = {
    "faculty_id": "f.id",
    "faculty_name": "f.name",
    "department_id": "d.id",
    "department_name": "d.name",
}
_DAY = (
    "CASE t.day_of_week WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue' WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu'"
    " WHEN 5 THEN 'Fri' WHEN 6 THEN 'Sat' ELSE 'Sun' END"
)

KIND_SQL: dict[str, _Kind] = {
    "faculties": _Kind("faculties t", "t.name"),
    "buildings": _Kind("buildings t", "t.name"),
    "departments": _Kind(
        "departments t LEFT JOIN faculties f ON f.id = t.faculty_id",
        "t.name",
        faculty_id="f.id",
        faculty_name="f.name",
    ),
    "lecturers": _Kind(
        "lecturers t" + _IN_A_DEPARTMENT,
        "COALESCE(t.title || ' ', '') || t.full_name",
        **_OF_A_DEPARTMENT,
    ),
    "courses": _Kind(
        "courses t" + _IN_A_DEPARTMENT, "t.code || ' ' || t.title", **_OF_A_DEPARTMENT
    ),
    "class_reps": _Kind("class_reps t" + _IN_A_DEPARTMENT, "t.full_name", **_OF_A_DEPARTMENT),
    "timetable_entries": _Kind(
        "timetable_entries t" + _IN_A_DEPARTMENT + " LEFT JOIN courses c ON c.id = t.course_id",
        "COALESCE(c.code, '') || ' ' || " + _DAY + " || ' ' || "
        "substr(CAST(t.start_time AS TEXT), 1, 5) || '-' || substr(CAST(t.end_time AS TEXT), 1, 5)",
        **_OF_A_DEPARTMENT,
    ),
    "announcements": _Kind(
        "announcements t LEFT JOIN departments d ON d.id = t.department_id"
        " LEFT JOIN faculties f ON f.id = COALESCE(t.faculty_id, d.faculty_id)",
        "t.title",
        faculty_id="f.id",
        faculty_name="f.name",
        department_id="d.id",
        department_name="d.name",
        scope="CAST(t.scope AS TEXT)",
    ),
}
assert set(KIND_SQL) == set(KINDS)

_WAITING = "t.deleted_at IS NULL AND t.verification_status = 'unverified'"


def _where(admin: dict[str, Any], kind: str) -> tuple[str, dict[str, Any]]:
    condition, params = verifiable_sql(admin, kind)
    return f"{_WAITING} AND ({condition})", params


def _page_branch(admin: dict[str, Any], kind: str, after: bool) -> tuple[str, dict[str, Any]]:
    spec = KIND_SQL[kind]
    where, params = _where(admin, kind)
    if after:
        # Rows after the cursor, in (created_at, entity_type, id) order. The kind is a constant.
        where += (
            f" AND (t.created_at, '{kind}', t.id)"
            " > (%(after_created_at)s, %(after_kind)s, %(after_id)s)"
        )
    sql = (
        f"SELECT * FROM (SELECT '{kind}' AS entity_type, t.id AS id, {spec.name} AS name,"
        f" {spec.faculty_id} AS faculty_id, {spec.faculty_name} AS faculty_name,"
        f" {spec.department_id} AS department_id, {spec.department_name} AS department_name,"
        f" {spec.scope} AS scope, t.source AS source, t.created_at AS created_at,"
        f" t.updated_at AS updated_at FROM {spec.sources} WHERE {where}"
        f" ORDER BY t.created_at, t.id LIMIT %(page_size)s) AS page_{kind}"
    )
    return sql, params


def _count_branch(admin: dict[str, Any], kind: str) -> tuple[str, dict[str, Any]]:
    where, params = _where(admin, kind)
    sql = f"SELECT '{kind}' AS kind, count(*) AS n FROM {KIND_SQL[kind].sources} WHERE {where}"
    return sql, params


# ----------------------------------------------------------------- the cursor


@dataclass(frozen=True)
class _After:
    created_at: datetime
    kind: str
    id: uuid.UUID


def _encode_cursor(entity_type: str | None, last: dict[str, Any]) -> str:
    payload = {
        "v": CURSOR_VERSION,
        "entity_type": entity_type,
        "created_at": last["created_at"].isoformat(),
        "kind": last["entity_type"],
        "id": str(last["id"]),
    }
    body = _b64(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return f"{body}.{_sign(body)}"


def _decode_cursor(token: str, entity_type: str | None) -> _After:
    body, separator, signature = token.partition(".")
    # Check the signature before reading anything in the cursor.
    if not separator or not hmac.compare_digest(
        signature.encode("utf-8"), _sign(body).encode("ascii")
    ):
        raise _bad_cursor()
    try:
        payload = json.loads(_unb64(body))
        if payload["v"] != CURSOR_VERSION:
            raise ValueError("unknown cursor version")
        if payload["entity_type"] != entity_type:
            raise ValueError("a cursor from other filters")
        created_at = datetime.fromisoformat(payload["created_at"])
        if created_at.tzinfo is None:
            raise ValueError("no time zone")
        kind = payload["kind"]
        if kind not in KINDS or (entity_type is not None and kind != entity_type):
            raise ValueError("unknown kind")
        return _After(created_at, kind, uuid.UUID(payload["id"]))
    except (KeyError, TypeError, ValueError) as error:
        raise _bad_cursor() from error


def _bad_cursor() -> HTTPException:
    return HTTPException(status_code=422, detail="Invalid cursor")


def _sign(body: str) -> str:
    digest = hmac.new(
        settings.sync_cursor_secret.encode("utf-8"),
        CURSOR_DOMAIN + body.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return _b64(digest)


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


# ----------------------------------------------------------------- the queue


def list_queue(
    conn: Connection,
    admin: dict[str, Any],
    entity_type: str | None,
    cursor: str | None,
    limit: int,
) -> VerifyQueue:
    after = _decode_cursor(cursor, entity_type) if cursor is not None else None
    kinds = (entity_type,) if entity_type is not None else KINDS

    # Query 1: the page. One more row than asked for tells us whether there is a next page.
    params: dict[str, Any] = {"page_size": limit + 1, "limit": limit + 1}
    branches = []
    for kind in kinds:
        sql, scope_params = _page_branch(admin, kind, after is not None)
        branches.append(sql)
        params.update(scope_params)
    if after is not None:
        params.update(after_created_at=after.created_at, after_kind=after.kind, after_id=after.id)
    page_sql = (
        "SELECT * FROM ("
        + " UNION ALL ".join(branches)
        + ") AS queue ORDER BY created_at, entity_type, id LIMIT %(limit)s"
    )
    rows = conn.execute(page_sql, params).fetchall()

    # Query 2: the counts, for every kind, whatever entity_type and cursor say.
    count_params: dict[str, Any] = {}
    count_branches = []
    for kind in KINDS:
        sql, scope_params = _count_branch(admin, kind)
        count_branches.append(sql)
        count_params.update(scope_params)
    counted = conn.execute(" UNION ALL ".join(count_branches), count_params).fetchall()
    counts = {row["kind"]: int(row["n"]) for row in counted}

    page = rows[:limit]
    return VerifyQueue(
        items=[_item(row) for row in page],
        next_cursor=_encode_cursor(entity_type, page[-1]) if len(rows) > limit else None,
        counts=VerifyQueueCounts(**counts),
        total=sum(counts.values()),
    )


def _ref(row: dict[str, Any], prefix: str) -> dict[str, Any] | None:
    if row[f"{prefix}_id"] is None:
        return None
    return {"id": row[f"{prefix}_id"], "name": row[f"{prefix}_name"]}


def _item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "entity_type": row["entity_type"],
        "id": row["id"],
        "name": row["name"],
        "belongs_to": {
            "faculty": _ref(row, "faculty"),
            "department": _ref(row, "department"),
            "scope": row["scope"],
        },
        "source": row["source"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
