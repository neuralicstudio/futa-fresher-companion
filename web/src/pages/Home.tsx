// Home: the night gate, the countdown to the next lecture, the latest notice and four places.
//
// The screen follows docs/design/screenshots/home-390.webp. It reads only the offline cache, so
// everything below the hero works on a phone with no data. The hero itself is drawn by the page:
// App keeps its own header off this route and gives it the full width (main--bare).
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon, { type IconName } from '../components/Icon';
import StateBlock from '../components/StateBlock';
import { COPY } from '../copy/pidgin';
import type { Building, User } from '../api/types';
import { useAuth } from '../lib/auth';
import { previewText } from '../lib/announcementsView';
import {
  latestNotice,
  nextClass,
  noticeDate,
  noticeSource,
  placePhoto,
  popularPlaces,
  whenText,
  type HomeClass,
} from '../lib/homeView';
import { readHomeScreen } from '../lib/offline';
import { entriesForLevel } from '../lib/timetableView';
import { useCachedRows } from '../lib/useCachedRows';

/** The timetable belongs to a school and a department, so the arrow needs both. */
function timetablePath(user: User | null): string {
  if (user?.faculty_id && user.department_id) {
    return `/academics/${user.faculty_id}/${user.department_id}/timetable`;
  }
  return '/academics';
}

/** The countdown ring. One number, and the ring shows how close the class is. */
function CountdownBadge({ minutes }: { minutes: number }) {
  const value = Math.max(0, Math.min(1, 1 - minutes / 60));
  // `pathLength="100"` on the circle, so the dash pattern is in percent: 80 draws 80% of the ring.
  const style = { '--v': (value * 100).toFixed(1) } as CSSProperties;

  return (
    <div
      className="badge-ring"
      role="img"
      aria-label={`${minutes} ${COPY.home.badge.unit} ${COPY.home.badge.label}`}
    >
      <svg className="ring" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
        <circle className="ring__track" cx="22" cy="22" r="19" />
        <circle className="ring__arc" cx="22" cy="22" r="19" pathLength={100} style={style} />
      </svg>
      <span className="badge-ring__in">
        <Icon name="clock" size={22} />
        <b className="num">{minutes}</b>
        <span>{COPY.home.badge.unit}</span>
        <small>{COPY.home.badge.label}</small>
      </span>
    </div>
  );
}

const TYPE_ICONS: Partial<Record<Building['type'], IconName>> = {
  gate: 'map',
  library: 'bookOpen',
  lecture_hall: 'bookOpen',
  department: 'buildings',
  faculty: 'buildings',
  admin: 'buildings',
  food: 'forkKnife',
  sports: 'soccerBall',
  health: 'firstAidKit',
  hostel: 'home',
  worship: 'buildings',
  other: 'map',
};

/** The one-line description under a place, from the map's category copy. */
function placeBlurb(building: Building): string {
  switch (building.type) {
    case 'gate':
      return COPY.map.blurbs.gate;
    case 'library':
      return COPY.map.blurbs.library;
    case 'lecture_hall':
      return COPY.map.blurbs.lecture;
    case 'food':
      return COPY.map.blurbs.food;
    case 'sports':
      return COPY.map.blurbs.sports;
    case 'health':
      return COPY.map.blurbs.health;
    case 'hostel':
      return COPY.map.blurbs.hostel;
    default:
      return COPY.map.blurbs.building;
  }
}

function NextLecture({ entry, href }: { entry: HomeClass | null; href: string }) {
  if (!entry) {
    return (
      <article className="card next" aria-labelledby="next-h">
        <span className="chip chip--gold-solid">{COPY.home.nextTitle}</span>
        <h2 id="next-h" className="next__code">
          <span className="next__icon">
            <Icon name="calendarDots" size={24} />
          </span>
          {COPY.home.noTimetableTitle}
        </h2>
        <p className="next__title">{COPY.home.noTimetableLine}</p>
        <Link className="btn btn--outline btn--sm" to="/academics">
          {COPY.home.noTimetableAction}
        </Link>
      </article>
    );
  }

  return (
    <article className="card card--hl-soft next" aria-labelledby="next-h">
      <span className="chip chip--gold-solid">{COPY.home.nextTitle}</span>
      <h2 id="next-h" className="next__code">
        <span className="next__icon">
          <Icon name="bookOpen" size={24} />
        </span>
        {entry.code}
      </h2>
      {entry.title && <p className="next__title">{entry.title}</p>}
      <p className="meta-line">
        <Icon name="clock" size={18} />
        <span className="num">{whenText(entry)}</span>
      </p>
      <p className="meta-line">
        <Icon name="map" size={18} />
        <span>{entry.venue}</span>
      </p>
      <Link className="go" to={href} aria-label={COPY.timetable.nextClass}>
        <Icon name="arrowRight" size={22} />
      </Link>
    </article>
  );
}

function HomeScreen({ departmentId, level }: { departmentId: string | null; level: number | null }) {
  const { user } = useAuth();
  const { result, retry } = useCachedRows(() => readHomeScreen(departmentId));
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // One clock reading, refreshed each minute: the countdown and "Tomorrow, 8:00 AM" stay true
  // while the screen is open, without re-reading the cache.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const data = result.state === 'ready' ? result.value : null;

  // A class needs both the department and the level: without the level the cache holds every
  // level of the department, and showing another level's lecture would be wrong.
  const next =
    data?.timetable && level !== null
      ? nextClass(
          entriesForLevel(data.timetable.entries, level),
          data.timetable.courses,
          data.timetable.buildings,
          now,
        )
      : null;
  const notice = data ? latestNotice(data.announcements, now) : null;
  const places = data ? popularPlaces(data.buildings, 4) : [];
  const today = next !== null && next.dayOffset === 0;
  const noticeSourceText = notice
    ? COPY.notices.from.replace('{source}', noticeSource(notice))
    : '';
  const noticeDay = notice ? noticeDate(notice) : null;

  function search(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/map?q=${encodeURIComponent(term)}` : '/map');
  }

  return (
    <>
      <Hero
        size="tall"
        className="hero--home"
        photo="/photos/gate-l.webp"
        kicker={COPY.home.kicker}
        title={COPY.home.title}
        lead={COPY.home.lead}
        header={<AppHeader variant="hero" pill />}
        badge={today && next ? <CountdownBadge minutes={next.startsInMinutes} /> : undefined}
      >
        <form className="search" role="search" onSubmit={search}>
          <label className="visually-hidden" htmlFor="home-q">
            {COPY.home.search}
          </label>
          <Icon name="search" size={22} />
          <input
            id="home-q"
            type="search"
            autoComplete="off"
            placeholder={COPY.home.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Link className="iconbtn iconbtn--plain" to="/map" aria-label={COPY.home.searchFilters}>
            <Icon name="filters" size={22} />
          </Link>
        </form>
      </Hero>

      <div className="page page--home">
        {result.state === 'loading' && (
          <StateBlock inline icon="buildings" title={COPY.states.loadingTitle} />
        )}

        {result.state === 'error' && (
          <>
            <StateBlock
              inline
              icon="warningCircle"
              title={COPY.states.errorTitle}
              body={COPY.states.errorBody}
            />
            <button type="button" className="btn btn--outline btn--sm" onClick={retry}>
              {COPY.states.retry}
            </button>
          </>
        )}

        {data && (
          <>
            <div className="duo">
              <NextLecture entry={next} href={timetablePath(user)} />

              {notice ? (
                <article className="card card--hl notice-card" aria-labelledby="notice-h">
                  <span className="chip chip--maroon">{COPY.home.noticeTitle}</span>
                  <div className="notice-card__row">
                    <Icon name="megaphone" size={24} />
                    <h2 id="notice-h" className="notice-card__title">
                      {notice.title}
                    </h2>
                  </div>
                  <p className="notice-card__body">{previewText(notice.body, 78)}</p>
                  <p className="meta-line">
                    <Icon name="calendarCheck" size={18} />
                    <span>
                      {noticeDay ? `${noticeSourceText} on ${noticeDay}` : noticeSourceText}
                    </span>
                  </p>
                  <Link className="go" to="/announcements" aria-label={notice.title}>
                    <Icon name="arrowRight" size={22} />
                  </Link>
                </article>
              ) : (
                <article className="card notice-card" aria-labelledby="notice-h">
                  <span className="chip chip--maroon">{COPY.home.noticeTitle}</span>
                  <h2 id="notice-h" className="notice-card__title">
                    {COPY.home.noNotice}
                  </h2>
                </article>
              )}
            </div>

            {places.length > 0 && (
              <section className="section" aria-labelledby="places-h">
                <div className="section__head">
                  <h2 id="places-h">
                    <Icon name="map" size={22} />
                    <span>{COPY.home.popular}</span>
                  </h2>
                  <Link className="link" to="/map">
                    {COPY.shell.seeAll}
                    <Icon name="arrowRight" size={16} />
                  </Link>
                </div>
                <p className="hint">{COPY.home.popularHelp}</p>
                <ul className="rail" role="list">
                  {places.map((place, index) => {
                    const photo = placePhoto(place.name);
                    return (
                      <li key={place.id} className="place-card">
                        {photo ? (
                          <img
                            className="place-card__pic"
                            src={photo}
                            alt=""
                            width={384}
                            height={256}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="place-card__pic place-card__pic--icon" aria-hidden="true">
                            <Icon name={TYPE_ICONS[place.type] ?? 'map'} size={36} />
                          </span>
                        )}
                        <div className="place-card__info">
                          <b>
                            <span className="num-badge">{index + 1}</span>
                            {place.name}
                          </b>
                          <small>{placeBlurb(place)}</small>
                        </div>
                        <Link
                          className="go"
                          to={`/map?q=${encodeURIComponent(place.name)}`}
                          aria-label={`${COPY.map.openPlace}: ${place.name}`}
                        >
                          <Icon name="arrowRight" size={20} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}

export default function Home() {
  const { user } = useAuth();
  const departmentId = user?.department_id ?? null;
  const level = user?.level ?? null;

  // A different student (or a later sign-in) means a different timetable. Remount the screen
  // so its cache read starts again with the new department.
  return (
    <HomeScreen
      key={`${departmentId ?? 'none'}-${level ?? 'none'}`}
      departmentId={departmentId}
      level={level}
    />
  );
}
