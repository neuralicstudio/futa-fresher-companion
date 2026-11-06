// Every word on the admin screens (Admin centre, Publish notice, Verify data) is in this one file.
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
    // The bar's way back is the design's one word (screenshots publish-390).
    backShort: 'Back',
    publishTitle: 'Publish notice',
    publishBody: 'Share important updates with your people.',
    verifyTitle: 'Verify data',
    verifyBody: 'Help keep FUTA info accurate.',
    roleTitle: 'Your role',
    roleBody: '{role}, {scope}',
    back: 'Back to Admin centre',
    tilesLabel: 'Admin tools',
  },
  publish: {
    kicker: 'Quick gist, make it clear.',
    title: 'Publish a Notice',
    lead: 'Post a notice and let the right people see am. No wahala.',
    fieldTitle: 'Title',
    // COPY.md shows "200" and "500"; the contract is the source of truth, so the limit is filled.
    fieldTitleHint: '{n} / {max}',
    fieldMessage: 'Message',
    fieldMessageHint: '{n} / {max}',
    fieldSendTo: 'Send to',
    sendTo: {
      university: 'Everyone',
      sug: 'SUG',
      faculty: 'My school',
      department: 'My department',
    } satisfies Record<AnnouncementScope, string>,
    sendToLocked: 'You fit post to {scope} only.',
    fieldSource: 'Source shown to students',
    fieldSourceHint: 'Students go see "From {source}" on the notice.',
    // NEW: the design writes "Computer Science department" in the source box (publish-390).
    sourceDepartment: '{name} department',
    fieldExpires: 'Expires (optional)',
    fieldExpiresHint: 'Your phone time. Leave am empty for no expiry.',
    preview: 'Preview',
    previewTo: 'To: {audience}',
    publish: 'Publish notice',
    publishing: 'Dey publish',
    published: 'Notice published successfully!',
    publishedBody: 'Students go get this one see am now.',
    publishedAgain: 'Publish another',
    plainText: 'Plain text only. E dey go live straight away.',
    errTitle: 'Give the notice a title, at least 3 letters.',
    errMessage: 'Write the message.',
    errSend: 'You no fit post to this scope.',
    errSession: 'Your session don end. Log in again to publish.',
    errBusy: 'The service dey busy. Try again in 30 seconds.',
    errOffline: 'You dey offline. Connect to data to publish.',
    // NEW
    yourDepartment: 'your department',
    sendToLockedSchool: 'You fit post to your school or a department inside your school only.',
    sourceFallback: 'Your {kind}',
    required: 'Required',
    errTitleLong: 'The title too long. Use {max} characters or less.',
    errMessageLong: 'The message too long. Use {max} characters or less.',
    errTarget: 'Choose a {kind}.',
    errExpiry: 'Enter a valid date and time.',
    errExpiryPast: 'The expiry must be in the future.',
    errNoFaculty:
      'Your account no get school set, so you no fit publish here. Ask a super admin.',
    errNoDepartment:
      'Your account no get department set, so you no fit publish here. Ask a super admin.',
    errBusyIn: 'The service dey busy. Try again in {n} seconds.',
    pickerLoading: 'Dey load…',
    pickerChoose: 'Choose a {kind}',
    listError: 'We no fit read the list on this phone.',
    listEmpty: 'No saved list on this phone yet. Connect to the internet and let the app sync first.',
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
    sourcePlaceholder: 'A link, or words. Example: HOD office, 12 Oct',
    markVerified: 'Mark verified',
    markOutdated: 'Mark outdated',
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
    // NEW: the card leaves the queue after "Mark outdated", and the screen says why.
    outdatedNotice: 'You don mark that record outdated, so e no dey the queue again.',
    verifyFailed: 'We no fit verify am. Try again.',
    verifyBusy: 'The server dey busy. Try again small.',
    serverSays: 'Server say: {message}',
    sessionEnded: 'Your session don end. Log in again to verify.',
  },
  // Your role (COPY.md "Your role"). The two rows marked NEW name the powers COPY.md did not
  // have: a department admin's own department, and the SUG's own scope.
  role: {
    kicker: 'Know your power',
    title: 'Role and permissions',
    lead: 'Here na wetin you fit publish and verify.',
    yourRole: 'Your role',
    roleHelp: 'You dey here to support {scope}. Make we do am well!',
    scopeUnknown: 'your people',
    // A SUG admin has no school or department: their people are all of FUTA's students.
    sugScope: 'FUTA students',
    canTitle: 'What you fit publish to',
    can: {
      everyone: 'Everyone (University)',
      school: 'Your school, full access',
      departments: 'All departments in your school',
      department: 'Your department',
      sug: 'SUG announcements',
      cannot: 'All schools (not allowed)',
      // A super admin has no school of its own, so the two rows below say "any" instead.
      anySchool: 'Any school, full access',
      anyDepartment: 'Any department',
    },
    allowed: 'Allowed',
    notAllowed: 'Not allowed',
    why: 'Roles come from the server. Sabi cannot give you more power.',
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
