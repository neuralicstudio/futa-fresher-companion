// Every word on the admin screens (Admin centre, Verify data) is in this one file.
// The wording is docs/design/COPY.md (light Pidgin). Keys marked NEW are not in COPY.md yet:
// the design owner should add them there. Screens read strings only from here.
import type { AnnouncementScope, UserRole, VerifiableEntityType } from '../api/types';

export const COPY = {
  gate: {
    loginTitle: 'Log in to continue',
    loginBody: 'Admin tools need an account.',
    loginLink: 'Log in',
    notAdminTitle: 'Admins only o',
    notAdminBody:
      'This place na for department, school, SUG and super admins. Ask your department make dem give your account admin access.',
    // NEW
    noProfileTitle: 'We no fit load your account',
    noProfileBody: 'Check your network and reload the page.',
  },
  admin: {
    kicker: 'Omo, admin no be small thing o!',
    title: 'Admin centre',
    lead: 'Manage notices, verify data, keep FUTA info sharp.',
    roleLine: '{role}, {scope}',
    publishTitle: 'Publish notice',
    publishBody: 'Share important updates with your people.',
    verifyTitle: 'Verify data',
    verifyBody: 'Help keep FUTA info accurate.',
    back: 'Back to Admin centre',
    tilesLabel: 'Admin tools',
  },
  roles: {
    department_admin: 'Department admin',
    faculty_admin: 'School admin',
    sug: 'SUG',
    super_admin: 'Super admin',
    class_rep: 'Class rep',
    student: 'Student',
  } satisfies Record<UserRole, string>,
  verify: {
    kicker: 'Check am well, make am real.',
    title: 'Verify Data',
    lead: 'New info dey queue. Verify the ones wey no get green tick yet.',
    filtersLabel: 'Kind of record',
    filterAll: 'All',
    source: 'Source: {source}',
    added: 'Added {date}',
    updated: 'Updated {date}',
    action: 'Verify',
    actionFor: 'Verify: {name}',
    notVerified: 'Not verified yet',
    detailTitle: 'Check this record',
    sourceChecked: 'Source you checked',
    sourceHint: 'Where you confirm am, in plain words. Students go see this.',
    sourceCount: '{n} / {max} characters',
    sourcePlaceholder: 'A link, or words. Example: HOD office, 12 Oct',
    markVerified: 'Mark verified',
    sending: 'Dey verify…',
    needSource: 'Add the source you check before you mark am verified.',
    sourceTooLong: 'The source too long. Use {max} characters or less.',
    verifiedTitle: 'Verified!',
    verifiedBody: 'This record don dey live on Sabi, and e carry your name and the date.',
    verifiedBy: 'Verified by: {who}',
    back: 'Back to queue',
    emptyTitle: 'Nothing to verify',
    emptyBody: 'Your queue don clean. You don try!',
    emptyKind: 'Nothing dey wait for this kind. Try another one.',
    offlineTitle: 'You dey offline',
    offlineBody: 'We no fit verify data without internet. Breathe, connect and try again.',
    retry: 'Try again',
    queueCount: '{n} waiting',
    loading: 'Dey load the queue',
    onlyYours: 'You fit verify only records wey belong to {scope}.',
    // NEW
    loadMore: 'Show more',
    loadingMore: 'Dey load more…',
    errorTitle: 'We no fit read the queue',
    errorBody: 'Try again. Nothing don commot.',
    busyTitle: 'The server dey busy',
    busyBody: 'Wait small and try again.',
    busyBodyIn: 'Wait {n} seconds and try again.',
    moreFailed: 'We no fit load more. Try again.',
    forbiddenVerify: 'You no fit verify this record.',
    gone: 'That record don commot, so e no dey the queue again.',
    verifyFailed: 'We no fit verify am. Try again.',
    verifyBusy: 'The server dey busy. Try again small.',
    serverSays: 'Server say: {message}',
    sessionEnded: 'Your session don end. Log in again to verify.',
  },
  // Chip words for where an announcement goes (COPY.md chips: University, SUG, School, Department).
  scopes: {
    university: 'University',
    sug: 'SUG',
    faculty: 'School',
    department: 'Department',
  } satisfies Record<AnnouncementScope, string>,
  // One record, and many of them. COPY.md has Buildings, Departments, Courses and Lecturers;
  // the other four are NEW.
  kinds: {
    buildings: { one: 'Building', many: 'Buildings' },
    departments: { one: 'Department', many: 'Departments' },
    courses: { one: 'Course', many: 'Courses' },
    lecturers: { one: 'Lecturer', many: 'Lecturers' },
    faculties: { one: 'School', many: 'Schools' },
    class_reps: { one: 'Class rep', many: 'Class reps' },
    timetable_entries: { one: 'Class time', many: 'Class times' },
    announcements: { one: 'Notice', many: 'Notices' },
  } satisfies Record<VerifiableEntityType, { one: string; many: string }>,
} as const;

/** Fills {name} markers: fill('Added {date}', { date: '12 Oct 2026' }). A missing value stays as-is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (marker, key: string) =>
    key in values ? String(values[key]) : marker,
  );
}
