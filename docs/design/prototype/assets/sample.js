// Sample data: stand-ins for what the API and the local database give the app. NOTHING here is a real
// fact about FUTA, except the OpenStreetMap place names (assets/campus-map.js) and the photo credits
// (assets/pack.js). In the app these come from Dexie (web/src/lib/offline.ts); the shapes match the
// contract in docs/openapi.yaml. Replace this file, not the screens.
//
//  - Lecturers are placeholders with initials avatars. No real or invented person is shown, and no face.
//  - A notice's title and body are exactly what an admin wrote. Sabi never rewrites them, so they are in
//    plain English here, as an admin might type them.
//  - verification.status is only "verified" when an admin verified it (verifiedBy and date shown).
//    Notices carry a source line ("From SUG"), never a Verified seal.
//  - Dates follow the prototype clock (Tuesday 27 Oct 2026, 09:48, so the next class is in 12 minutes).
window.SABI_SAMPLE = {
  now: { day: 'Tuesday', date: '27 Oct 2026', time: '09:48', minutes: 588, dow: 1 },

  user: { name: 'Sample Fresher', department: 'Computer Science', school: 'School of Computing', level: 100, role: 'student' },
  admin: { name: 'Sample Admin', role: 'department_admin', roleLabel: 'Department admin', scope: 'Computer Science' },

  sync: { schools: [8, 8], departments: [24, 24], courses: [132, 256], timetables: [0, 8], buildings: [0, 25], notices: [0, 48], sizeMb: '12 to 30 MB', percent: 68 },

  storage: { used: '142 MB', total: '500 MB', pct: 28, lastSaved: 'Sun 25 Oct 2026, 09:12 am' },
  pack: { count: 11, size: '0.9 MB', downloaded: 5 },

  schools: [
    { id: 'computing', name: 'School of Computing', short: 'Computing', departments: 4, icon: 'desktop', photo: 'computing', status: 'verified', updated: '21 Oct 2026', verifiedBy: 'Sample registry officer', source: 'Sample source: school office list' },
    { id: 'engineering', name: 'School of Engineering', short: 'Engineering', departments: 6, icon: 'gear', photo: '', status: 'unverified', updated: '19 Oct 2026', source: 'Sample source: departmental page, third party' },
    { id: 'management', name: 'School of Management Sciences', short: 'Management Sciences', departments: 5, icon: 'chart-line-up', photo: '', status: 'unverified', updated: '19 Oct 2026', source: 'Sample source: class rep' },
    { id: 'environment', name: 'School of Environmental Sciences', short: 'Environmental Sciences', departments: 4, icon: 'leaf', photo: '', status: 'outdated', updated: '3 Mar 2026', source: 'Sample source: 2025 handbook' },
    { id: 'agriculture', name: 'School of Agriculture', short: 'Agriculture', departments: 4, icon: 'plant', photo: '', status: 'unverified', updated: '12 Oct 2026', source: 'Sample source: department notice board' },
    { id: 'medical', name: 'School of Basic Medical Sciences', short: 'Basic Medical Sciences', departments: 5, icon: 'stethoscope', photo: '', status: 'unverified', updated: '12 Oct 2026', source: 'Sample source: department notice board' },
  ],

  department: {
    id: 'csc', name: 'Computer Science', school: 'School of Computing', code: 'CSC', photo: 'computing', icon: 'desktop',
    blurb: 'Code today, build tomorrow. If you like computers, you are in the right place.',
    status: 'verified', updated: '21 Oct 2026', verifiedBy: 'Sample department admin', source: 'Sample source: HOD office notice board',
    office: 'Room 12, department office', email: 'department@example.com',
    courses: [
      { code: 'CSC 101', title: 'Computer Science 101', short: 'Introduction to computing', units: 3, level: 100, semester: 1, status: 'verified', updated: '20 Oct 2026', verifiedBy: 'Sample department admin', source: 'Sample source: course list from HOD office' },
      { code: 'CSC 201', title: 'Data Structures and Algorithms', units: 3, level: 200, semester: 1, status: 'verified', updated: '20 Oct 2026', verifiedBy: 'Sample department admin', source: 'Sample source: course list from HOD office' },
      { code: 'CSC 301', title: 'Database Systems', units: 3, level: 300, semester: 1, status: 'unverified', updated: '14 Oct 2026', source: 'Sample source: class rep' },
      { code: 'CSC 401', title: 'Web Technologies', units: 2, level: 400, semester: 1, status: 'unverified', updated: '14 Oct 2026', source: 'Sample source: class rep' },
    ],
    lecturers: [
      { name: 'Prof. A. Sample', rank: 'Head of Department', hod: true, status: 'verified', updated: '20 Oct 2026', verifiedBy: 'Sample department admin', source: 'Sample source: department staff list' },
      { name: 'Dr. B. Sample', rank: 'Senior Lecturer', status: 'unverified', updated: '9 Oct 2026', source: 'Sample source: told by a student' },
      { name: 'Dr. C. Sample', rank: 'Lecturer', status: 'unverified', updated: '9 Oct 2026', source: 'Sample source: told by a student' },
    ],
  },

  // The week of the prototype clock. today: true marks Tuesday. Venues are sample names.
  week: [
    { short: 'Mon', date: 26, long: 'Monday, Oct 26' }, { short: 'Tue', date: 27, long: 'Tuesday, Oct 27', today: true }, { short: 'Wed', date: 28, long: 'Wednesday, Oct 28' },
    { short: 'Thu', date: 29, long: 'Thursday, Oct 29' }, { short: 'Fri', date: 30, long: 'Friday, Oct 30' }, { short: 'Sat', date: 31, long: 'Saturday, Oct 31' }, { short: 'Sun', date: 1, long: 'Sunday, Nov 1' },
  ],
  classes: {
    Mon: [{ start: '08:00', end: '10:00', code: 'CSC 101', title: 'Computer Science 101', venue: 'Lecture Theatre A1', kind: 'lecture' }, { start: '11:00', end: '13:00', code: 'CSC 201', title: 'Data Structures and Algorithms', venue: 'Lecture Theatre B3', kind: 'lecture' }],
    Tue: [{ start: '10:00', end: '11:00', code: 'CSC 101', title: 'Computer Science 101', venue: 'Lecture Theatre A1', kind: 'lecture' }, { start: '14:00', end: '16:00', code: 'CSC 301', title: 'Database Systems', venue: 'Lecture Theatre A2', kind: 'lecture' }],
    Wed: [],
    Thu: [{ start: '09:00', end: '11:00', code: 'CSC 101', title: 'Computer Science 101', venue: 'Lecture Theatre A1', kind: 'practical' }],
    Fri: [], Sat: [], Sun: [],
  },

  // A notice's from-line is who posted it. verification is not shown on notices.
  notices: [
    { id: 'n1', scope: 'university', source: 'the Registry', title: 'Academic calendar for the 2026/2027 session', date: '26 Oct 2026', unread: false, attachment: true,
      body: 'This is to inform all students that the academic calendar for the 2026/2027 session has been released. Please take note of the important dates and plan accordingly.' },
    { id: 'n2', scope: 'sug', source: 'SUG', title: 'SUG registration now open', date: '25 Oct 2026', unread: true, attachment: true,
      body: 'All freshers and returning students are to complete their SUG registration before Friday, 30 October 2026. Do not be that person who go later, register sharp sharp!' },
    { id: 'n3', scope: 'department', source: 'Computer Science department', title: 'CSC 101 lecture venue change', date: '24 Oct 2026', unread: true, attachment: false,
      body: 'The venue for CSC 101 (today\'s lecture) has been changed from Lecture Theatre A1 to Lecture Theatre B3. Students are to take note and adjust accordingly.' },
    { id: 'n4', scope: 'school', source: 'School of Computing', title: 'Orientation week for new students', date: '21 Oct 2026', unread: false, attachment: false,
      body: 'Orientation for new students in the School of Computing holds this week. Bring your admission letter.' },
  ],

  mine: [
    { id: 'm1', title: 'Library extended hours', date: '20 Oct 2026', audience: 'Everyone', status: 'published' },
    { id: 'm2', title: 'School of Computing orientation', date: '18 Oct 2026', audience: 'My school', status: 'published' },
    { id: 'm3', title: 'Lab safety talk moved', date: '15 Oct 2026', audience: 'My department', status: 'published' },
    { id: 'm4', title: 'Tutorial week plan', date: '12 Oct 2026', audience: 'My department', status: 'draft' },
  ],

  queue: [
    { id: 'q1', kind: 'buildings', icon: 'buildings', title: 'New lecture theatre (LT B3)', source: 'Facilities department', added: '27 Oct 2026, 2:15 pm', status: 'unverified' },
    { id: 'q2', kind: 'departments', icon: 'book-open-text', title: 'Cyber security department', source: 'School of Computing', added: '27 Oct 2026, 11:32 am', status: 'unverified' },
    { id: 'q3', kind: 'courses', icon: 'graduation-cap', title: 'CSC 402, Artificial Intelligence', source: 'Department of CS', added: '26 Oct 2026, 4:20 pm', status: 'outdated' },
    { id: 'q4', kind: 'lecturers', icon: 'user-circle', title: 'Dr. E. Sample', source: 'Department of CS', added: '26 Oct 2026, 10:05 am', status: 'unverified' },
  ],

  // Quick categories on the Map and the places shown on Home. Names come from OpenStreetMap (campus-map.js).
  homePlaces: [['gate', 'Main gate', 'Entrance to FUTA'], ['library', 'Albert Ilemobade Library', 'Books, e-resources, quiet place to study.'], ['computing', 'School of Computing', 'Labs, ICT and innovation hub.'], ['road', 'Campus roads', 'Move well, no wahala.']],
};
