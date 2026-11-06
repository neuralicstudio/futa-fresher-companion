// One notice, whole: the gist the list only shows three lines of (notice-390, notice-768).
//
// It reads the same offline cache as the list, so a saved notice opens with no network. The
// bar is the design's plain one — back, the screen's name, the profile button — because a
// hero would put a second title above a card that already carries the notice's own.
//
// The words are the admin's, drawn as text and never as HTML. There is no Verified tick: the
// "From {source}" line and "Where this come from" are where the trust lives, and an expired or
// unknown notice gets the not-found card rather than a half-empty one.
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import StateBlock from '../components/StateBlock';
import ScopeChip from '../components/notice/ScopeChip';
import { COPY } from '../copy/pidgin';
import { namesById, sourceLine } from '../lib/announcementsView';
import { audienceFor, expiresText, paragraphs, postedLine } from '../lib/noticeView';
import { readNoticeScreen } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

/** Re-keyed by id, so moving to another notice starts from loading instead of the old one. */
export default function NoticeDetail() {
  const { id = '' } = useParams();
  return <NoticeScreen key={id} id={id} />;
}

function NoticeScreen({ id }: { id: string }) {
  const { result, retry } = useCachedRows(() => readNoticeScreen(id));
  const [note, setNote] = useState('');
  const data = result.state === 'ready' ? result.value : null;
  const notice = data?.announcement ?? null;

  const names = useMemo(() => {
    if (!data) return null;
    return { faculties: namesById(data.faculties), departments: namesById(data.departments) };
  }, [data]);

  async function share() {
    if (!notice) return;
    // Every attempt starts quiet: the line under the buttons describes THIS attempt, not the
    // last one the student made.
    setNote('');
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: notice.title, text: notice.body, url });
        return;
      } catch (error) {
        // The student closed the share sheet: that is an answer, not a failure.
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote(COPY.notice.copied);
    } catch {
      setNote(COPY.notice.shareFailed);
    }
  }

  return (
    <>
      <AppHeader
        variant="bar"
        back={{ to: '/announcements', label: COPY.notice.back }}
        title={COPY.notice.title}
      />

      <div className="page page--notice">
        <p className="hand">{COPY.notice.kicker}</p>

        {result.state === 'loading' && <DetailLoading />}

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

        {data && !notice && (
          <StateBlock
            icon="bell"
            title={COPY.notice.notFoundTitle}
            body={COPY.notice.notFoundBody}
          />
        )}

        {notice && names && (
          <>
            <article className="card card--hl notice-full">
              <p className="notice__top">
                <ScopeChip scope={notice.scope} />
                {postedLine(notice.published_at) && (
                  <span className="notice__date">{postedLine(notice.published_at)}</span>
                )}
              </p>

              <h2 className="notice-full__title">{notice.title}</h2>

              <p className="notice__from">
                <Icon name="megaphone" size={16} />
                {sourceLine(notice, names.faculties, names.departments)}
              </p>

              {paragraphs(notice.body).length > 0 && (
                <div className="prose">
                  {paragraphs(notice.body).map((text, index) => (
                    <p key={index}>{text}</p>
                  ))}
                </div>
              )}

              <dl className="facts">
                <dt>{COPY.notice.forLabel}</dt>
                <dd>{audienceFor(notice.scope)}</dd>
                <dt>{COPY.notice.expiresLabel}</dt>
                <dd>{expiresText(notice.expires_at)}</dd>
              </dl>
            </article>

            <article className="card notice-source">
              <h3>{COPY.notice.sourceTitle}</h3>
              <p className="muted">{COPY.notice.sourceHelp}</p>
            </article>

            <div className="btn-row notice-actions">
              <button type="button" className="btn btn--outline" onClick={share}>
                <Icon name="shareNetwork" size={18} />
                {COPY.notice.share}
              </button>
              <Link className="btn btn--gold" to="/announcements">
                <Icon name="arrowLeft" size={18} />
                {COPY.notice.back}
              </Link>
            </div>
            <p className="notice__note" role="status">
              {note}
            </p>
          </>
        )}
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}

/** The shape of the card while the cache is read, rather than a spinner. */
function DetailLoading() {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="skeleton__row">
        <span className="skeleton__bar skeleton__bar--short" />
        <span className="skeleton__bar skeleton__bar--title" />
        <span className="skeleton__bar" />
        <span className="skeleton__bar" />
        <span className="skeleton__bar" />
      </div>
    </div>
  );
}
