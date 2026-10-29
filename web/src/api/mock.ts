import {
  announcements,
  buildings,
  courses,
  departments,
  faculties,
  lecturers,
  timetableEntries,
} from '../mocks/fixtures';
import { ApiError, type Query } from './client';
import type {
  AnnouncementCreate,
  UserRole,
  VerifiableEntityType,
  VerifyQueue,
  VerifyQueueItem,
  VerifyRequest,
} from './types';

// A sample account for mock mode only. It is a student unless VITE_MOCK_ROLE says otherwise,
// so the admin screens can be tried without a backend. Scoped roles get the first sample
// faculty and department.
const MOCK_ROLE = (import.meta.env.VITE_MOCK_ROLE || 'student') as UserRole;
const mockUser = {
  id: '00000000-0000-4000-8000-0000000000ff',
  full_name: 'Sample Student',
  email: 'sample.student@example.com',
  role: MOCK_ROLE,
  matric_no: null,
  department_id: MOCK_ROLE === 'department_admin' ? departments[0].id : null,
  faculty_id: MOCK_ROLE === 'faculty_admin' ? faculties[0].id : null,
  level: null,
};

// Rows per /sync page in mock mode. 0 (the default) returns everything in one page.
// Set VITE_MOCK_SYNC_PAGE_SIZE to a small number to test paging without the backend.
const MOCK_SYNC_PAGE_SIZE = Number(import.meta.env.VITE_MOCK_SYNC_PAGE_SIZE ?? 0);
const SYNC_COLLECTIONS = [
  'faculties',
  'departments',
  'lecturers',
  'courses',
  'class_reps',
  'buildings',
  'timetable_entries',
  'announcements',
] as const;

// Add a case here whenever the UI needs a new endpoint before the backend has it.
export async function mockRequest(
  method: string,
  path: string,
  query?: Query,
  body?: unknown,
): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 150)); // feel like a real network
  const key = `${method} ${path}`;

  switch (key) {
    case 'GET /faculties':
      return faculties;
    case 'GET /campus/buildings':
      return buildings;
    case 'GET /announcements':
      return announcements;
    case 'POST /announcements':
      return mockPublish(body as AnnouncementCreate);
    case 'GET /admin/verify/queue':
      return mockQueue(query);
    case 'POST /admin/verify':
      return mockVerify(body as VerifyRequest);
    case 'POST /auth/login':
      // Mock only: any password works, and the token is not a real one.
      return { access_token: 'mock-token-not-real', token_type: 'bearer', expires_in: 604800 };
    case 'POST /auth/register':
      return mockUser;
    case 'GET /auth/me':
      return mockUser;
    case 'GET /sync':
      return mockSync(query);
    default:
      throw new Error(`No mock for ${key}. Add it in src/api/mock.ts`);
  }
}

// Echoes the new announcement back, shaped like the API's 201. Nothing is stored.
function mockPublish(input: AnnouncementCreate) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: input.title,
    body: input.body,
    scope: input.scope,
    faculty_id: input.scope === 'faculty' ? (input.faculty_id ?? null) : null,
    department_id: input.scope === 'department' ? (input.department_id ?? null) : null,
    author_id: mockUser.id,
    published_at: now,
    expires_at: input.expires_at ?? null,
    verification: { status: 'unverified' as const, source: 'sample data' },
    updated_at: now,
  };
}

// Same rules as the API: rows in collection order, then in list order, cut into pages.
// The cursor is only an offset here, which is enough for mock data.
function mockSync(query: Query | undefined) {
  const data: Record<string, unknown[]> = {
    faculties,
    departments,
    lecturers,
    courses,
    class_reps: [],
    buildings,
    timetable_entries: timetableEntries,
    announcements,
  };
  const items = SYNC_COLLECTIONS.flatMap((name) => data[name].map((row) => [name, row] as const));
  const start = query?.cursor ? Number(String(query.cursor).replace('mock:', '')) : 0;
  const size = MOCK_SYNC_PAGE_SIZE > 0 ? MOCK_SYNC_PAGE_SIZE : items.length;
  const end = start + size;

  const page: Record<string, unknown[]> = Object.fromEntries(
    SYNC_COLLECTIONS.map((name) => [name, []]),
  );
  for (const [name, row] of items.slice(start, end)) page[name].push(row);

  return {
    server_time: new Date().toISOString(),
    full: !query?.since && !query?.cursor,
    next_cursor: end < items.length ? `mock:${end}` : null,
    ...page,
    deleted: {},
  };
}

// ----------------------------------------------------------------- the verify queue (mock only)
// The sample records that are not verified, plus a run of extra sample courses so "Show more" has
// something to load. Scope is not applied: every mock admin sees the whole sample queue.
const QUEUE_KINDS: VerifiableEntityType[] = [
  'faculties',
  'departments',
  'lecturers',
  'courses',
  'class_reps',
  'buildings',
  'timetable_entries',
  'announcements',
];
const verifiedInMock = new Map<string, string>();

function queueItem(
  entity_type: VerifiableEntityType,
  id: string,
  name: string,
  source: string | null = 'sample data',
  belongs_to: VerifyQueueItem['belongs_to'] = { faculty: null, department: null },
): VerifyQueueItem {
  return { entity_type, id, name, belongs_to, source, created_at: now(), updated_at: now() };
}

function now() {
  return new Date().toISOString();
}

function mockQueueItems(): VerifyQueueItem[] {
  const facultyRef = (id: string | null) => {
    const faculty = faculties.find((f) => f.id === id);
    return faculty ? { id: faculty.id, name: faculty.name } : null;
  };
  const departmentRef = (id: string | null) => {
    const department = departments.find((d) => d.id === id);
    return department ? { id: department.id, name: department.name } : null;
  };
  const inDepartment = (id: string): VerifyQueueItem['belongs_to'] => ({
    department: departmentRef(id),
    faculty: facultyRef(departments.find((d) => d.id === id)?.faculty_id ?? null),
  });
  const items: VerifyQueueItem[] = [
    ...faculties.map((f) => queueItem('faculties', f.id, f.name)),
    ...departments.map((d) =>
      queueItem('departments', d.id, d.name, 'sample data', {
        faculty: facultyRef(d.faculty_id),
        department: null,
      }),
    ),
    ...lecturers.map((l) =>
      queueItem('lecturers', l.id, l.full_name, 'sample data', inDepartment(l.department_id)),
    ),
    ...courses.map((c) =>
      queueItem('courses', c.id, `${c.code} ${c.title}`, 'sample data', inDepartment(c.department_id)),
    ),
    ...buildings.map((b) => queueItem('buildings', b.id, b.name, null)),
    ...announcements.map((a) =>
      queueItem('announcements', a.id, a.title, 'sample data', {
        faculty: null,
        department: null,
        scope: a.scope,
      }),
    ),
  ];
  for (let i = 1; i <= 30; i++) {
    items.push(
      queueItem(
        'courses',
        `00000000-0000-4000-8000-0000000009${String(i).padStart(2, '0')}`,
        `SMP${100 + i} Extra sample course ${i}`,
        i % 3 === 0 ? null : 'sample data',
        inDepartment(departments[0].id),
      ),
    );
  }
  return items.filter((item) => !verifiedInMock.has(item.id));
}

// Same rules as the API: oldest first (here: the list order), cursor and limit, counts for all kinds.
function mockQueue(query: Query | undefined): VerifyQueue {
  const all = mockQueueItems();
  const kind = query?.entity_type as VerifiableEntityType | undefined;
  const matching = kind ? all.filter((item) => item.entity_type === kind) : all;
  const start = query?.cursor ? Number(String(query.cursor).replace('mock:', '')) : 0;
  const size = Number(query?.limit ?? 25);
  const end = start + size;
  const counts = Object.fromEntries(
    QUEUE_KINDS.map((k) => [k, all.filter((item) => item.entity_type === k).length]),
  ) as VerifyQueue['counts'];
  return {
    items: matching.slice(start, end),
    next_cursor: end < matching.length ? `mock:${end}` : null,
    counts,
    total: all.length,
  };
}

// Like the API: a source is needed to verify. Nothing is stored except for this page load.
function mockVerify(input: VerifyRequest): undefined {
  const known = mockQueueItems().find((item) => item.id === input.entity_id);
  if (!known) throw mockError(404, 'Record not found');
  if (input.status === 'verified' && !(input.source ?? '').trim()) {
    throw mockError(422, 'A record needs a source before it can be verified. Send a source.');
  }
  verifiedInMock.set(input.entity_id, input.source ?? '');
  return undefined;
}

function mockError(status: number, message: string) {
  return new ApiError(status, message);
}
