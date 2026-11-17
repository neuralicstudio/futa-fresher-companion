// Academics: the schools of FUTA, as a grid of cards (screenshots academics-390, academics-768,
// academics-loading-390, academics-empty-390, academics-error-390, academics-offline-390).
//
// Everything below the hero comes from the offline cache, so the grid works with no data. The
// search stays on the phone as the student types: it matches a school's name, and the names of
// its departments, so "computer science" finds School of Computing.

import { Link, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon from '../components/Icon';
import Scene from '../components/Scene';
import StateBlock from '../components/StateBlock';
import { COPY } from '../copy/pidgin';
import type { Department, Faculty } from '../api/types';
import {
  departmentsIn,
  departmentsLabel,
  filterSchools,
  schoolIcon,
  schoolsLabel,
  schoolScene,
} from '../lib/academicsView';
import { placePhoto } from '../lib/mapView';
import { readAllDepartments, readFaculties } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

/** One school: its picture, its symbol, its name and how many departments it has. */
function SchoolCard({ faculty, departments }: { faculty: Faculty; departments: Department[] }) {
  // Six of the ten schools have a photo of their own building; the rest carry a drawing.
  const photo = placePhoto(faculty.name);
  const scene = schoolScene(faculty.name);
  const count = departmentsIn(faculty.id, departments);

  return (
    <li>
      <Link className="school" to={`/academics/${faculty.id}`}>
        <span className="school__pic">
          {photo ? (
            <img src={photo} alt="" width={384} height={216} loading="lazy" decoding="async" />
          ) : (
            <Scene variant={scene.variant} flip={scene.flip} />
          )}
        </span>
        <span className="school__body">
          <span className="school__name">
            <Icon name={schoolIcon(faculty.name)} size={22} />
            <b>{faculty.name}</b>
          </span>
          <small>{departmentsLabel(count)}</small>
        </span>
        <span className="school__go" aria-hidden="true">
          <Icon name="arrowRight" size={20} />
        </span>
      </Link>
    </li>
  );
}

/** What the grid shows while the cache is being read: the shape of the cards, not a spinner. */
function SchoolsLoading() {
  return (
    <>
      <p className="muted" role="status">
        {COPY.academics.loading}
      </p>
      <div className="skeleton" aria-hidden="true">
        {[0, 1, 2, 3].map((row) => (
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

export default function Academics() {
  const { result, retry } = useCachedRows(async () => ({
    faculties: await readFaculties(),
    departments: await readAllDepartments(),
  }));
  // In the address like the map's search, so a search can be shared and Back undoes it.
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';

  const data = result.state === 'ready' ? result.value : { faculties: [], departments: [] };
  const shown = filterSchools(data.faculties, data.departments, query);

  function setQuery(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  }

  return (
    <>
      <Hero
        size="std"
        photo="/photos/library-l.webp"
        kicker={COPY.academics.kicker}
        title={COPY.academics.title}
        gold={COPY.academics.titleGold}
        lead={COPY.academics.lead}
        header={<AppHeader variant="hero" pill />}
      >
        <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label className="visually-hidden" htmlFor="academics-q">
            {COPY.academics.search}
          </label>
          <Icon name="search" size={22} />
          <input
            id="academics-q"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={COPY.academics.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
      </Hero>

      <div className="page page--academics">
        {result.state === 'loading' && <SchoolsLoading />}

        {result.state === 'error' && (
          <>
            <StateBlock
              icon="warningCircle"
              title={COPY.academics.errorTitle}
              body={COPY.academics.errorBody}
            />
            <button type="button" className="btn btn--outline btn--sm" onClick={retry}>
              {COPY.academics.retry}
            </button>
          </>
        )}

        {result.state === 'ready' && data.faculties.length === 0 && (
          <StateBlock
            icon="bank"
            title={COPY.academics.emptyTitle}
            body={COPY.academics.emptyBody}
          />
        )}

        {result.state === 'ready' && data.faculties.length > 0 && (
          <section className="section" aria-labelledby="schools-h">
            <div className="section__head">
              <h2 id="schools-h">
                <Icon name="bank" size={22} />
                <span>{COPY.academics.schoolsTitle}</span>
              </h2>
              <span className="section__count">{schoolsLabel(shown.length)}</span>
            </div>

            {shown.length > 0 ? (
              <ul className="schools" role="list">
                {shown.map((faculty) => (
                  <SchoolCard
                    key={faculty.id}
                    faculty={faculty}
                    departments={data.departments}
                  />
                ))}
              </ul>
            ) : (
              <StateBlock
                icon="search"
                title={COPY.states.noMatchTitle}
                body={COPY.states.noMatchBody}
              />
            )}
          </section>
        )}
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}
