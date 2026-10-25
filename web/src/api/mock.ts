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
import type { Announcement, AnnouncementCreate, AnnouncementUpdate, UserRole } from './types';

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

// Announcements live here in mock mode, so publish, edit and delete show up in the next list
// read. They reset on reload. The fixtures themselves are never changed.
const mockAnnouncements: Announcement[] = [...announcements];
const ANNOUNCEMENT_ID = /^\/announcements\/([^/]+)$/;

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

  const byId = ANNOUNCEMENT_ID.exec(path);
  if (byId && (method === 'PATCH' || method === 'DELETE')) {
    return mockChangeAnnouncement(method, byId[1], body as AnnouncementUpdate);
  }

  switch (key) {
    case 'GET /faculties':
      return faculties;
    case 'GET /campus/buildings':
      return buildings;
    case 'GET /announcements':
      return mockAnnouncements.filter(isLive).slice(0, Number(query?.limit ?? 50));
    case 'POST /announcements':
      return mockPublish(body as AnnouncementCreate);
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
  const created: Announcement = {
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
  mockAnnouncements.unshift(created);
  return created;
}

// The public list hides expired rows, as the API does.
function isLive(row: Announcement) {
  return !row.expires_at || Date.parse(row.expires_at) > Date.now();
}

// PATCH changes only the fields sent (null expires_at clears it). DELETE returns nothing, like
// a 204. An unknown id is a 404. Role and scope are not checked in mock mode.
function mockChangeAnnouncement(method: string, id: string, changes: AnnouncementUpdate) {
  const index = mockAnnouncements.findIndex((row) => row.id === id);
  if (index === -1) throw new ApiError(404, 'Announcement not found');
  if (method === 'DELETE') {
    mockAnnouncements.splice(index, 1);
    return undefined;
  }
  const updated: Announcement = {
    ...mockAnnouncements[index],
    ...changes,
    updated_at: new Date().toISOString(),
  };
  mockAnnouncements[index] = updated;
  return updated;
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
    announcements: mockAnnouncements,
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
