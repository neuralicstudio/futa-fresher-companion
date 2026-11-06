// One department: its head, then courses, lecturers and the facts, in the design's tabs
// (screenshot academics-390). It reads the offline cache, so it opens with no network.
//
// The design draws this panel on the schools page, where it swaps in for the grid. Here it is its
// own screen, reached from the school, so the back chip leads to that school rather than the grid.
import { useRef, useState, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import HeadCard from '../components/HeadCard';
import Icon, { type IconName } from '../components/Icon';
import Scene from '../components/Scene';
import { SealNote } from '../components/Seal';
import StateBlock from '../components/StateBlock';
import { COPY } from '../copy/pidgin';
import type { Course, Department, Lecturer } from '../api/types';
import { emptyMessage, schoolIcon, schoolScene } from '../lib/academicsView';
import {
  groupCoursesByLevel,
  isHod,
  lecturerDisplayName,
  levelHeading,
  resolveDepartment,
  sectionEmptyMessage,
  sortLecturers,
  unitsText,
} from '../lib/departmentView';
import { initials } from '../lib/initials';
import { placePhoto } from '../lib/mapView';
import { readDepartmentScreen, readFaculty } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

type Tab = 'courses' | 'lecturers' | 'about';

const TABS: { id: Tab; icon: IconName; label: string }[] = [
  { id: 'courses', icon: 'bookOpenText', label: COPY.academics.tabs.courses },
  { id: 'lecturers', icon: 'users', label: COPY.academics.tabs.lecturers },
  { id: 'about', icon: 'info', label: COPY.academics.tabs.about },
];

/** The avatar colours the design cycles through, so a list does not read as one grey block. */
const AVATARS = ['avatar--gold', 'avatar--green', 'avatar--indigo', 'avatar--red'];

export default function DepartmentDetail() {
  const { facultyId = '', departmentId = '' } = useParams();
  // Keyed by department, so moving to another one starts from loading.
  return <DepartmentPage key={departmentId} facultyId={facultyId} departmentId={departmentId} />;
}

function CourseRows({ courses }: { courses: Course[] }) {
  return (
    <>
      {groupCoursesByLevel(courses).map((group) => (
        <section key={group.level} className="rows-group" aria-labelledby={`level-${group.level}`}>
          <h3 id={`level-${group.level}`}>{levelHeading(group.level)}</h3>
          <ul className="rows" role="list">
            {group.courses.map((course) => (
              <li className="row row--code" key={course.id}>
                <span className="code">{course.code}</span>
                <span className="row__title">
                  <b>{course.title}</b>
                  <small>
                    {/* Kept together, so "Semester 2" never breaks over two lines. */}
                    {unitsText(course.units)}&nbsp;·&nbsp;{COPY.academics.semester}&nbsp;
                    {course.semester}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

/** One lecturer: initials, name (a star for the head of department), rank and office. */
function LecturerRow({
  lecturer,
  hodName,
  tone,
}: {
  lecturer: Lecturer;
  hodName: string | null | undefined;
  tone: string;
}) {
  const body = (
    <>
      <span className={`avatar ${tone}`} aria-hidden="true">
        {initials(lecturer.full_name)}
      </span>
      <span className="row__title">
        <b>
          {lecturerDisplayName(lecturer)}
          {isHod(lecturer, hodName) && (
            <span className="row__star">
              <Icon name="starFill" size={16} />
              <span className="visually-hidden">{COPY.academics.hod}</span>
            </span>
          )}
        </b>
        {lecturer.rank && <small>{lecturer.rank}</small>}
        {lecturer.office_location && (
          <small>
            {COPY.academics.office}: {lecturer.office_location}
          </small>
        )}
        {lecturer.email && (
          // A zero-width space after the @ lets a long address wrap there, not mid-word.
          <small className="row__email">{lecturer.email.replace('@', '@​')}</small>
        )}
      </span>
    </>
  );

  return (
    <li>
      {/* The whole row is the target, so writing to a lecturer is one tap, not a 19 px link. */}
      {lecturer.email ? (
        <a className="row row--person" href={`mailto:${lecturer.email}`}>
          {body}
        </a>
      ) : (
        <div className="row row--person">{body}</div>
      )}
    </li>
  );
}

function LecturerRows({
  lecturers,
  hodName,
}: {
  lecturers: Lecturer[];
  hodName: string | null | undefined;
}) {
  return (
    <ul className="rows" role="list">
      {lecturers.map((lecturer, index) => (
        <LecturerRow
          key={lecturer.id}
          lecturer={lecturer}
          hodName={hodName}
          tone={AVATARS[index % AVATARS.length]}
        />
      ))}
    </ul>
  );
}

function DepartmentPage({ facultyId, departmentId }: { facultyId: string; departmentId: string }) {
  const { result, retry, progress } = useCachedRows(async () => ({
    screen: await readDepartmentScreen(departmentId),
    faculty: await readFaculty(facultyId),
  }));
  const [tab, setTab] = useState<Tab>('courses');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const back = (
    <p>
      <Link className="back" to={`/academics/${facultyId}`}>
        <Icon name="arrowLeft" size={20} />
        <span>{COPY.academics.backDepartments}</span>
      </Link>
    </p>
  );

  if (result.state === 'loading') {
    return (
      <>
        {back}
        <StateBlock inline icon="bookOpenText" title={COPY.states.loadingTitle} />
      </>
    );
  }

  if (result.state === 'error') {
    return (
      <>
        {back}
        <StateBlock
          icon="warningCircle"
          title={COPY.states.errorTitle}
          body={COPY.states.errorBody}
        />
        <button type="button" className="btn btn--outline btn--sm" onClick={retry}>
          {COPY.states.retry}
        </button>
      </>
    );
  }

  const department = resolveDepartment(result.value.screen.department, facultyId);
  if (!department) {
    return (
      <>
        {back}
        <StateBlock
          icon="bookOpenText"
          title={COPY.states.notFoundTitle}
          body={emptyMessage(progress, COPY.academics.notFound)}
        />
      </>
    );
  }

  const { screen, faculty } = result.value;
  const courses = screen.courses;
  const lecturers = sortLecturers(screen.lecturers);
  const keyLecturers = lecturers.slice(0, 3);
  const photo = faculty ? placePhoto(faculty.name, 'l') : undefined;
  const scene = schoolScene(faculty?.name ?? department.name);

  /** Changing tab moves the focus, so a hidden pane never keeps it. */
  function select(id: Tab) {
    setTab(id);
    const index = TABS.findIndex((item) => item.id === id);
    tabRefs.current[index]?.focus();
  }

  /** Arrow keys move between the tabs, as the design's prototype does. */
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    select(TABS[(index + step + TABS.length) % TABS.length].id);
  }

  return (
    <>
      <div className="stack">
        <HeadCard
          to={`/academics/${facultyId}`}
          backLabel={COPY.academics.backDepartments}
          icon={schoolIcon(faculty?.name ?? department.name)}
          title={department.name}
          subline={faculty ? `${faculty.name} in FUTA` : undefined}
          status={department.verification.status}
          photo={photo}
          scene={<Scene variant={scene.variant} flip={scene.flip} />}
          flush
        >
          <div className="tabs" role="tablist" aria-label={department.name}>
            {TABS.map((item, index) => (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                className="tabs__tab"
                aria-selected={tab === item.id}
                aria-controls={`pane-${item.id}`}
                tabIndex={tab === item.id ? 0 : -1}
                onClick={() => select(item.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div
            className="tabs__pane"
            role="tabpanel"
            id="pane-courses"
            aria-labelledby="tab-courses"
            hidden={tab !== 'courses'}
          >
            <div className="duo duo--flat">
              <section aria-labelledby="courses-h">
                <h2 id="courses-h">{COPY.academics.allCourses}</h2>
                {courses.length === 0 ? (
                  <p className="muted" role="status">
                    {sectionEmptyMessage(progress, COPY.academics.coursesEmpty)}
                  </p>
                ) : (
                  <CourseRows courses={courses} />
                )}
              </section>

              <section aria-labelledby="key-lecturers-h">
                <div className="section__head">
                  <h2 id="key-lecturers-h">{COPY.academics.keyLecturers}</h2>
                  {lecturers.length > keyLecturers.length && (
                    <button type="button" className="link" onClick={() => select('lecturers')}>
                      {COPY.shell.viewAll}
                    </button>
                  )}
                </div>
                {lecturers.length === 0 ? (
                  <p className="muted" role="status">
                    {sectionEmptyMessage(progress, COPY.academics.lecturersEmpty)}
                  </p>
                ) : (
                  <LecturerRows lecturers={keyLecturers} hodName={department.hod_name} />
                )}
              </section>
            </div>
          </div>

          <div
            className="tabs__pane"
            role="tabpanel"
            id="pane-lecturers"
            aria-labelledby="tab-lecturers"
            hidden={tab !== 'lecturers'}
          >
            <h2>{COPY.academics.tabs.lecturers}</h2>
            {lecturers.length === 0 ? (
              <p className="muted" role="status">
                {sectionEmptyMessage(progress, COPY.academics.lecturersEmpty)}
              </p>
            ) : (
              <LecturerRows lecturers={lecturers} hodName={department.hod_name} />
            )}
          </div>

          <div
            className="tabs__pane"
            role="tabpanel"
            id="pane-about"
            aria-labelledby="tab-about"
            hidden={tab !== 'about'}
          >
            <h2>{COPY.academics.aboutTitle}</h2>
            <DepartmentFacts department={department} />
            <SealNote verification={department.verification} updatedAt={department.updated_at} />
            <div className="btn-row">
              <Link
                className="btn btn--outline"
                to={`/academics/${facultyId}/${departmentId}/timetable`}
              >
                <Icon name="timetable" size={18} />
                <span>{COPY.shell.tabs.timetable}</span>
              </Link>
            </div>
          </div>
        </HeadCard>
      </div>

      <Footer />
    </>
  );
}

function DepartmentFacts({ department }: { department: Department }) {
  if (!department.hod_name && !department.office_location) {
    return <p className="muted">{COPY.academics.aboutEmpty}</p>;
  }

  return (
    <dl className="facts">
      {department.hod_name && (
        <>
          <dt>{COPY.academics.hod}</dt>
          <dd>{department.hod_name}</dd>
        </>
      )}
      {department.office_location && (
        <>
          <dt>{COPY.academics.office}</dt>
          <dd>{department.office_location}</dd>
        </>
      )}
    </dl>
  );
}
