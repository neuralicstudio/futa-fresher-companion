// Notices: what FUTA, SUG, the student's school and their department have posted (screenshots
// notices-390, notices-768, notices-empty-390, notices-loading-390, notices-error-390).
//
// The text is whatever the admin wrote, shown as text and never as HTML. There is no Verified
// tick here: the "From ..." line is the trust signal. Everything reads from the offline cache,
// so the saved notices open with no network. "Unread" is local to this phone (see
// lib/noticesSeen.ts), because the contract has no read flag.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon from '../components/Icon';
import StateBlock from '../components/StateBlock';
import ScopeChip from '../components/notice/ScopeChip';
import { COPY } from '../copy/pidgin';
import type { Announcement } from '../api/types';
import { useAuth } from '../lib/auth';
import {
  announcementsForDisplay,
  emptyBody,
  emptyFilteredText,
  filterChoices,
  filterLabel,
  namesById,
  noticeDate,
  noticesFor,
  sourceLine,
  type NoticeFilter,
} from '../lib/announcementsView';
import { SEEN_EVENT, loadSeenIds, rememberSeen, unreadIds } from '../lib/noticesSeen';
import { readAnnouncementsScreen } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';
import { useOnline } from '../lib/useOnline';

export default function Announcements() {
  const { result, retry, progress } = useCachedRows(readAnnouncementsScreen);
  const online = useOnline();
  const auth = useAuth();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<NoticeFilter>('all');
  // The ids this phone had already shown when the screen opened. The labels below come from this
  // snapshot, so a card stays marked "Unread" for the visit that revealed it.
  const [seen] = useState(() => loadSeenIds());

  const signedIn = auth.status === 'signed-in';
  const facultyId = (signedIn && auth.user?.faculty_id) || null;
  const departmentId = (signedIn && auth.user?.department_id) || null;

  const view = useMemo(() => {
    if (result.state !== 'ready') return null;
    const { announcements, faculties, departments } = result.value;
    return {
      items: announcementsForDisplay(announcements, Date.now()),
      facultyNames: namesById(faculties),
      departmentNames: namesById(departments),
    };
  }, [result]);

  const choices = filterChoices(facultyId, departmentId);
  const activeFilter = choices.includes(filter) ? filter : 'all';

  const shown = useMemo(() => {
    if (!view) return [];
    return noticesFor(
      view.items,
      { filter: activeFilter, query, facultyId, departmentId },
      view.facultyNames,
      view.departmentNames,
    );
  }, [view, activeFilter, query, facultyId, departmentId]);

  const unread = useMemo(() => (view ? unreadIds(view.items, seen) : new Set<string>()), [view, seen]);

  // The screen has now drawn these cards, so they stop being new. The tab bar drops its dot.
  useEffect(() => {
    if (!shown.length) return;
    if (rememberSeen(shown.map((item) => item.id))) {
      window.dispatchEvent(new Event(SEEN_EVENT));
    }
  }, [shown]);

  return (
    <>
      <Hero
        size="std"
        photo="/photos/library-l.webp"
        kicker={COPY.notices.kicker}
        title={COPY.notices.title}
        gold={COPY.notices.titleGold}
        lead={COPY.notices.lead}
        header={<AppHeader variant="hero" pill />}
      >
        <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label className="visually-hidden" htmlFor="notices-q">
            {COPY.notices.search}
          </label>
          <Icon name="search" size={22} />
          <input
            id="notices-q"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={COPY.notices.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
      </Hero>

      <div className="page page--notices">
        {result.state !== 'error' && (
          <div
            className="filter"
            role="group"
            aria-label={`${COPY.notices.title} ${COPY.notices.titleGold}`}
          >
            {choices.map((choice) => (
              <button
                key={choice}
                type="button"
                aria-pressed={choice === activeFilter}
                onClick={() => setFilter(choice)}
              >
                {filterLabel(choice)}
              </button>
            ))}
          </div>
        )}

        {result.state === 'loading' && (
          <>
            <p className="muted" role="status">
              {COPY.notices.loading}
            </p>
            <NoticesLoading />
          </>
        )}

        {result.state === 'error' && (
          <StateBlock
            icon="warningCircle"
            title={COPY.notices.errorTitle}
            body={COPY.notices.errorBody}
            action={
              <button type="button" className="btn btn--outline" onClick={retry}>
                <Icon name="arrowsClockwise" size={18} />
                {COPY.notices.retry}
              </button>
            }
          />
        )}

        {view && shown.length > 0 && (
          <ul className="notices" role="list">
            {shown.map((item, index) => (
              <NoticeCard
                key={item.id}
                item={item}
                lead={index === 0}
                unread={unread.has(item.id)}
                facultyNames={view.facultyNames}
                departmentNames={view.departmentNames}
              />
            ))}
          </ul>
        )}

        {view && shown.length === 0 &&
          (query.trim() ? (
            <NoMatch />
          ) : (
            <NothingHere
              filter={activeFilter}
              empty={emptyBody(progress, online)}
              facultyNames={view.facultyNames}
              departmentNames={view.departmentNames}
              facultyId={facultyId}
              departmentId={departmentId}
            />
          ))}
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}

interface NoticeCardProps {
  item: Announcement;
  /** The newest card on screen is outlined in gold. */
  lead: boolean;
  unread: boolean;
  facultyNames: ReadonlyMap<string, string>;
  departmentNames: ReadonlyMap<string, string>;
}

function NoticeCard({ item, lead, unread, facultyNames, departmentNames }: NoticeCardProps) {
  const date = noticeDate(item.published_at);

  return (
    <li>
      <article
        className={`card notice${lead ? ' card--hl' : ''}${unread ? ' is-unread' : ''}`}
      >
        <p className="notice__top">
          <ScopeChip scope={item.scope} />
          {date && <span className="notice__date">{date}</span>}
          {unread && <span className="unread">{COPY.notices.unread}</span>}
        </p>

        {/* The title is the link, and its stretched hit area is the whole card (the design's
            `.stretch`), so a tap anywhere opens the notice. The chevron and the row below
            point at it; neither takes the tap. */}
        <h2 className="notice__title">
          <Link className="stretch" to={`/announcements/${item.id}`}>
            {item.title}
          </Link>
        </h2>

        <p className="notice__from">
          <Icon name="megaphone" size={16} />
          {sourceLine(item, facultyNames, departmentNames)}
        </p>

        <p className="notice__body clamp3">{item.body}</p>

        <p className="notice__more">
          <span>{COPY.notices.viewDetails}</span>
          <Icon name="arrowRight" size={16} />
        </p>
        <Icon name="caretRight" size={20} className="notice__go" />
      </article>
    </li>
  );
}

/** The shape of three notices while the cache is read, rather than a spinner. */
function NoticesLoading() {
  return (
    <div className="skeleton" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div className="skeleton__row" key={row}>
          <span className="skeleton__bar skeleton__bar--short" />
          <span className="skeleton__bar skeleton__bar--title" />
          <span className="skeleton__bar" />
          <span className="skeleton__bar" />
        </div>
      ))}
    </div>
  );
}

function NoMatch() {
  return (
    <StateBlock icon="search" title={COPY.states.noMatchTitle} body={COPY.states.noMatchBody} />
  );
}

interface NothingHereProps {
  filter: NoticeFilter;
  /** The body for the all-notices case, which depends on sync and connection. */
  empty: string;
  facultyNames: ReadonlyMap<string, string>;
  departmentNames: ReadonlyMap<string, string>;
  facultyId: string | null;
  departmentId: string | null;
}

/** No notice at all, or none in the chip the student picked. */
function NothingHere({
  filter,
  empty,
  facultyNames,
  departmentNames,
  facultyId,
  departmentId,
}: NothingHereProps) {
  if (filter !== 'all') {
    return (
      <StateBlock
        icon="bell"
        title={emptyFilteredText(filter, facultyNames, departmentNames, facultyId, departmentId)}
      />
    );
  }

  return <StateBlock icon="bell" title={COPY.notices.emptyTitle} body={empty} />;
}
