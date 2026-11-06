// Timetable: the week's classes, day by day (screenshots timetable-390, timetable-768,
// timetable-loading-390, timetable-empty-390, timetable-error-390, timetable-noDept-390).
//
// It is its own tab (`/timetable`), so it shows the signed-in student's department; the
// department screen and Home also link to one department's timetable directly. Everything below
// the hero comes from the offline cache, so a saved timetable reads with no network.
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon from '../components/Icon';
import StateBlock from '../components/StateBlock';
import { COPY } from '../copy/pidgin';
import type { Building, Course, TimetableEntry } from '../api/types';
import { useAuth } from '../lib/auth';
import { levelHeading, resolveDepartment } from '../lib/departmentView';
import {
  browserLocalStorage,
  buildingsById,
  chooseLevel,
  chooseSemester,
  COURSE_MISSING,
  entriesForSemester,
  entriesOnDay,
  formatClock,
  levelsWithEntries,
  loadRememberedLevel,
  nextToday,
  rememberLevel,
  semesterLabel,
  semestersWithEntries,
  timetableEmptyMessage,
  todayDayNumber,
  venueText,
  weekDays,
  type Semester,
  type WeekDay,
} from '../lib/timetableView';
import { readTimetableScreen } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

/** "Next up, in 12 min", the badge on the class that is about to start. */
function nextUpLabel(minutes: number): string {
  return `${COPY.timetable.nextUp}, ${COPY.timetable.inMin.replace('{n}', String(minutes))}`;
}

export default function Timetable() {
  const { facultyId, departmentId } = useParams();
  const { status, user } = useAuth();

  // Its own tab has no department in the address: it belongs to the student. The deep link from
  // a department or from Home names one, so that department's timetable wins.
  const school = facultyId ?? user?.faculty_id ?? '';
  const department = departmentId ?? user?.department_id ?? '';

  return (
    <>
      <Hero
        size="std"
        photo="/photos/gate-l.webp"
        kicker={COPY.timetable.kicker}
        title={COPY.timetable.title}
        lead={COPY.timetable.lead}
        header={<AppHeader variant="hero" pill />}
      />

      <div className="page page--timetable">
        {department ? (
          // Keyed by department, so moving to another one starts from loading.
          <TimetablePage
            key={department}
            facultyId={school}
            departmentId={department}
            studentLevel={user?.level ?? null}
          />
        ) : status === 'loading' ? (
          <TimetableLoading />
        ) : (
          <ChooseDepartment signedIn={status === 'signed-in'} />
        )}
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}

/** What the screen shows while the cache is being read: the shape of the classes, not a spinner. */
function TimetableLoading() {
  return (
    <>
      <p className="muted" role="status">
        {COPY.timetable.loading}
      </p>
      <div className="skeleton" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div className="skeleton__row" key={row}>
            <span className="skeleton__bar skeleton__bar--title" />
            <span className="skeleton__bar" />
            <span className="skeleton__bar skeleton__bar--short" />
          </div>
        ))}
      </div>
    </>
  );
}

/** A guest, or a student whose profile has no department yet: there is no timetable to show. */
function ChooseDepartment({ signedIn }: { signedIn: boolean }) {
  return (
    <StateBlock
      icon="bank"
      title={COPY.timetable.chooseDepartmentTitle}
      body={COPY.timetable.chooseDepartmentBody}
      action={
        <Link className="btn btn--gold" to={signedIn ? '/academics' : '/register'}>
          {COPY.timetable.chooseDepartment}
        </Link>
      }
    />
  );
}

function TimetablePage({
  facultyId,
  departmentId,
  studentLevel,
}: {
  facultyId: string;
  departmentId: string;
  studentLevel: number | null;
}) {
  const { result, retry, progress } = useCachedRows(() => readTimetableScreen(departmentId));
  const [picked, setPicked] = useState<number | null>(() =>
    loadRememberedLevel(browserLocalStorage()),
  );
  const [pickedSemester, setPickedSemester] = useState<Semester | null>(null);
  // Nothing picked means today; `now` is fixed for this visit, so the strip does not move under
  // the reader at midnight.
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  const [now] = useState(() => new Date());

  if (result.state === 'loading') {
    return <TimetableLoading />;
  }

  if (result.state === 'error') {
    return (
      <StateBlock
        icon="warningCircle"
        title={COPY.timetable.errorTitle}
        body={COPY.timetable.errorBody}
        action={
          <button type="button" className="btn btn--outline" onClick={retry}>
            {COPY.timetable.retry}
          </button>
        }
      />
    );
  }

  // The deep link names a school, so a department from another school is not this timetable.
  const cached = result.value.department;
  const department = resolveDepartment(cached, facultyId || cached?.faculty_id || '');
  if (!department) {
    return (
      <StateBlock
        icon="bookOpenText"
        title={COPY.states.notFoundTitle}
        body={COPY.academics.notFound}
      />
    );
  }

  return (
    <TimetableBody
      department={department}
      value={result.value}
      picked={picked}
      pickedSemester={pickedSemester}
      pickedDay={pickedDay}
      studentLevel={studentLevel}
      onPickLevel={(level) => {
        setPicked(level);
        rememberLevel(browserLocalStorage(), level);
        // Another level may run in another semester; the picker starts at its first one.
        setPickedSemester(null);
      }}
      onPickSemester={setPickedSemester}
      onPickDay={setPickedDay}
      now={now}
      progress={progress}
    />
  );
}

function TimetableBody({
  department,
  value,
  picked,
  pickedSemester,
  pickedDay,
  studentLevel,
  onPickLevel,
  onPickSemester,
  onPickDay,
  now,
  progress,
}: {
  department: { id: string; faculty_id: string };
  value: { entries: TimetableEntry[]; courses: Course[]; buildings: Building[] };
  picked: number | null;
  pickedSemester: Semester | null;
  pickedDay: number | null;
  studentLevel: number | null;
  onPickLevel: (level: number) => void;
  onPickSemester: (semester: Semester) => void;
  onPickDay: (day: number) => void;
  now: Date;
  progress: { running: boolean; firstRun: boolean };
}) {
  const levels = levelsWithEntries(value.entries);
  // A remembered level wins; before one is chosen, the student's own level is the best guess.
  const level = chooseLevel(levels, picked ?? studentLevel);
  const semesters = level === null ? [] : semestersWithEntries(value.entries, level);
  const semester = chooseSemester(semesters, pickedSemester);

  const courses = useMemo(
    () => new Map(value.courses.map((course) => [course.id, course])),
    [value.courses],
  );
  const buildings = useMemo(() => buildingsById(value.buildings), [value.buildings]);
  const shown =
    level !== null && semester !== null
      ? entriesForSemester(value.entries, level, semester)
      : [];

  const week = useMemo(() => weekDays(now), [now]);
  const today = todayDayNumber(now) || 1;
  const selected = pickedDay ?? today;
  const start = week.findIndex((day) => day.day === selected);
  const shownDays = start === -1 ? [] : week.slice(start, start + 2);
  // The badge and the gold outline belong to the class about to start, so only on today.
  const next = nextToday(shown, now);

  if (levels.length === 0) {
    return (
      <>
        <div className="card card--note">
          <Icon name="clock" size={32} className="ic" />
          <div>
            <b>{COPY.timetable.notAddedTitle}</b>
            <p>{timetableEmptyMessage(progress, COPY.timetable.notAddedBody)}</p>
          </div>
          <Link
            className="btn btn--gold btn--sm"
            to={`/academics/${department.faculty_id}/${department.id}`}
          >
            {COPY.timetable.contactDept}
          </Link>
        </div>
        <p className="hint">{COPY.timetable.times}</p>
      </>
    );
  }

  return (
    <>
      <div className="pair">
        <div className="select-box">
          <Icon name="stack" size={22} className="ic" />
          <span className="select-box__main">
            <label htmlFor="tt-level">{COPY.timetable.level}</label>
            <select
              id="tt-level"
              value={level ?? ''}
              onChange={(event) => onPickLevel(Number(event.target.value))}
            >
              {levels.map((option) => (
                <option key={option} value={option}>
                  {levelHeading(option)}
                </option>
              ))}
            </select>
          </span>
          <Icon name="caretDown" size={18} className="ic" />
        </div>

        <div className="select-box">
          <Icon name="calendarDots" size={22} className="ic" />
          <span className="select-box__main">
            <label htmlFor="tt-semester">{COPY.timetable.semester}</label>
            <select
              id="tt-semester"
              value={semester ?? ''}
              onChange={(event) => onPickSemester(Number(event.target.value) as Semester)}
            >
              {semesters.map((option) => (
                <option key={option} value={option}>
                  {semesterLabel(option)}
                </option>
              ))}
            </select>
          </span>
          <Icon name="caretDown" size={18} className="ic" />
        </div>
      </div>

      <ul className="days" role="list" aria-label={COPY.timetable.weekNav}>
        {week.map((day) => (
          <li key={day.day}>
            <button
              type="button"
              className="day"
              aria-pressed={day.day === selected}
              aria-current={day.today ? 'date' : undefined}
              onClick={() => onPickDay(day.day)}
            >
              <b>{day.short}</b>
              <small>
                {day.month} {day.date}
              </small>
            </button>
          </li>
        ))}
      </ul>

      <div className="day-view" aria-live="polite">
        {shownDays.map((day) => (
          <DayBlock
            key={day.day}
            day={day}
            entries={entriesOnDay(shown, day.day)}
            courses={courses}
            buildings={buildings}
            nextId={next?.id ?? null}
            nextIn={next?.inMinutes ?? null}
          />
        ))}
      </div>

      <p className="hint">{COPY.timetable.times}</p>
    </>
  );
}

/** One day: its heading, the gold "Next class" chip on today, then its classes or a rest card. */
function DayBlock({
  day,
  entries,
  courses,
  buildings,
  nextId,
  nextIn,
}: {
  day: WeekDay;
  entries: TimetableEntry[];
  courses: ReadonlyMap<string, Course>;
  buildings: ReadonlyMap<string, Pick<Building, 'id' | 'name'>>;
  nextId: string | null;
  nextIn: number | null;
}) {
  const hasNext = day.today && nextId !== null;

  return (
    <section className="day-block" aria-labelledby={`day-${day.day}`}>
      <h2 id={`day-${day.day}`} className="day-head">
        <Icon name="calendarDots" size={22} className="ic" />
        <b>{day.label}</b>
        {hasNext && <span className="chip chip--gold-solid">{COPY.timetable.nextClass}</span>}
      </h2>

      {entries.length === 0 ? (
        <div className="card card--empty-day">
          <Icon name="calendarCheck" size={32} className="ic" />
          <div>
            <b>{COPY.timetable.emptyDayTitle}</b>
            <p>{COPY.timetable.emptyDayBody}</p>
          </div>
        </div>
      ) : (
        <ul className="classes" role="list">
          {entries.map((entry) => {
            const course = courses.get(entry.course_id);
            const isNext = entry.id === nextId && nextIn !== null;
            return (
              <li key={entry.id}>
                <article className={`card class${isNext ? ' card--hl' : ''}`}>
                  <p className="class__time">
                    <Icon name="clock" size={20} className="ic" />
                    <span className="num">
                      {formatClock(entry.start_time)} to {formatClock(entry.end_time)}
                    </span>
                    {isNext && (
                      <span className="chip chip--gold-solid">{nextUpLabel(nextIn)}</span>
                    )}
                  </p>
                  {course ? (
                    <>
                      <h3 className="class__code">{course.code}</h3>
                      <p className="class__title">{course.title}</p>
                    </>
                  ) : (
                    <p className="class__title muted">{COURSE_MISSING}</p>
                  )}
                  <p className="class__meta">
                    <span>
                      <Icon name="mapPin" size={18} className="ic" />
                      {venueText(entry, buildings)}
                    </span>
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
