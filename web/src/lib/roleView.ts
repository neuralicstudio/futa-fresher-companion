// Pure logic for the Your role screen. No React, fetch or storage imports.
//
// The screen only repeats what the server already decided: the role comes from the account, the
// scope name from the offline cache, and the powers from the same rule the composer uses
// (`scopesForRole`). Nothing here grants anything — it explains what the app will let the admin do,
// so the words have to stay true to `api/app/admin_scope.py`.
import type { AnnouncementScope, UserRole } from '../api/types';
import { COPY, fill } from './adminCopy';
import { scopesForRole } from './composerView';

/** One line of "What you fit publish to": what it covers, and whether this role may use it. */
export interface Power {
  text: string;
  allowed: boolean;
}

const CAN = COPY.role.can;

/** A row as written: the words, and the scope that would make it true (null = never). */
type Row = [text: string, scope: AnnouncementScope | null];

/**
 * What the role may publish to, in the order the design lists it (screenshot role-390). A role only
 * sees rows it could plausibly want: a department admin is not offered the university, and a super
 * admin is not shown a ceiling they do not have.
 */
export function publishPowers(role: UserRole): Power[] {
  if (scopesForRole(role).length === 0) return [];
  const allowed = new Set<AnnouncementScope>(scopesForRole(role));
  const rows: Row[] =
    role === 'super_admin'
      ? [
          // A super admin has no school of its own, so the wording is "any", not "yours".
          [CAN.everyone, 'university'],
          [CAN.anySchool, 'faculty'],
          [CAN.anyDepartment, 'department'],
        ]
      : role === 'faculty_admin'
        ? [
            [CAN.departments, 'department'],
            [CAN.school, 'faculty'],
            [CAN.cannot, null],
          ]
        : role === 'department_admin'
          ? [
              [CAN.department, 'department'],
              [CAN.school, 'faculty'],
              [CAN.cannot, null],
            ]
          : [
              [CAN.sug, 'sug'],
              [CAN.school, 'faculty'],
              [CAN.cannot, null],
            ];
  return rows.map(([text, scope]) => ({ text, allowed: scope !== null && allowed.has(scope) }));
}

/** "You dey here to support Computer Science. Make we do am well!" */
export function roleHelp(scope: string | null): string {
  return fill(COPY.role.roleHelp, { scope: scope ?? COPY.role.scopeUnknown });
}

/**
 * The line under the admin's name. The cache names a school or a department; a SUG admin sits
 * over every student, which the cache cannot name, so the screen says it instead.
 */
export function cardScope(role: UserRole, scope: string | null): string | null {
  return scope ?? (role === 'sug' ? COPY.role.sugScope : null);
}

/** The word at the end of a row: "Allowed" or "Not allowed". */
export function powerWord(allowed: boolean): string {
  return allowed ? COPY.role.allowed : COPY.role.notAllowed;
}
