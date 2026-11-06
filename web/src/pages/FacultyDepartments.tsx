// A school's own page: its head and the departments it runs, reached from the schools grid.
//
// The design draws the department panel (academics-390) but no page between the grid and a
// department, so this one borrows that head and lists the departments as rows, which keeps the
// three screens reading as one ladder. It reads the offline cache, so it opens with no network.
import { Link, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import HeadCard from '../components/HeadCard';
import Icon from '../components/Icon';
import Scene from '../components/Scene';
import { SealNote } from '../components/Seal';
import StateBlock from '../components/StateBlock';
import { COPY } from '../copy/pidgin';
import type { Department } from '../api/types';
import { departmentsLabel, emptyMessage, schoolIcon, schoolScene } from '../lib/academicsView';
import { placePhoto } from '../lib/mapView';
import { readDepartments, readFaculty } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

export default function FacultyDepartments() {
  const { facultyId = '' } = useParams();
  // Keyed by school, so moving to another school starts from loading, not the old list.
  return <SchoolDepartments key={facultyId} facultyId={facultyId} />;
}

/** One department: its name, its short name, and the way in. */
function DepartmentRow({ facultyId, department }: { facultyId: string; department: Department }) {
  return (
    <li>
      <Link className="row" to={`/academics/${facultyId}/${department.id}`}>
        <span className="row__title">
          <b>{department.name}</b>
          {department.short_name && <small>{department.short_name}</small>}
        </span>
        <Icon name="caretRight" size={18} />
      </Link>
    </li>
  );
}

function SchoolDepartments({ facultyId }: { facultyId: string }) {
  const { result, retry, progress } = useCachedRows(async () => ({
    faculty: await readFaculty(facultyId),
    departments: await readDepartments(facultyId),
  }));

  const back = (
    <p>
      <Link className="back" to="/academics">
        <Icon name="arrowLeft" size={20} />
        <span>{COPY.academics.back}</span>
      </Link>
    </p>
  );

  if (result.state === 'loading') {
    return (
      <>
        {back}
        <StateBlock inline icon="bank" title={COPY.states.loadingTitle} />
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

  const { faculty, departments } = result.value;
  if (!faculty) {
    return (
      <>
        {back}
        <StateBlock
          icon="bank"
          title={COPY.states.notFoundTitle}
          body={emptyMessage(progress, COPY.states.notFoundBody)}
        />
      </>
    );
  }

  const photo = placePhoto(faculty.name, 'l');
  const scene = schoolScene(faculty.name);

  return (
    <>
      <div className="stack">
        <HeadCard
          to="/academics"
          backLabel={COPY.academics.back}
          icon={schoolIcon(faculty.name)}
          title={faculty.name}
          subline={departmentsLabel(departments.length)}
          status={faculty.verification.status}
          photo={photo}
          scene={<Scene variant={scene.variant} flip={scene.flip} />}
        >
          <SealNote verification={faculty.verification} updatedAt={faculty.updated_at} bare />
        </HeadCard>

        <section className="section" aria-labelledby="depts-h">
          <div className="section__head">
            <h2 id="depts-h">{COPY.academics.departmentsTitle}</h2>
            <span className="section__count">{departmentsLabel(departments.length)}</span>
          </div>

          {departments.length === 0 ? (
            <StateBlock
              inline
              icon="bookOpenText"
              title={emptyMessage(progress, COPY.academics.departmentsEmpty)}
            />
          ) : (
            <ul className="rows" role="list">
              {departments.map((department) => (
                <DepartmentRow key={department.id} facultyId={facultyId} department={department} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}
