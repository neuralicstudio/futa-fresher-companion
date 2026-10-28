// Pure logic for the Admin centre: the role bar and the name of the admin's own scope.
import type { Department, Faculty, User } from '../api/types';
import { COPY, fill } from './adminCopy';

type Named = Pick<Faculty, 'id' | 'name'>;

/**
 * The name of the faculty or department an admin works inside, or null when it is everything
 * (SUG has no faculty) or the name is not on this device yet. Names come from the offline cache.
 */
export function scopeName(
  user: Pick<User, 'role' | 'faculty_id' | 'department_id'>,
  faculties: readonly Named[],
  departments: readonly Pick<Department, 'id' | 'name'>[],
): string | null {
  switch (user.role) {
    case 'super_admin':
      return COPY.scopes.university;
    case 'faculty_admin':
      return faculties.find((f) => f.id === user.faculty_id)?.name ?? null;
    case 'department_admin':
      return departments.find((d) => d.id === user.department_id)?.name ?? null;
    default:
      return null;
  }
}

/** "Department admin, Computer Science". Just the role when the scope has no name. */
export function roleLine(role: User['role'], scope: string | null): string {
  const name = COPY.roles[role];
  return scope ? fill(COPY.admin.roleLine, { role: name, scope }) : name;
}
