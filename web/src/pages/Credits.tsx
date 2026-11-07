// Photo credits: where every photo, the map, the icons and the fonts come from
// (screenshots credits-390, credits-768).
//
// The list is the photos Sabi actually ships, with the author and licence CREDITS.md records. A
// photo with no recorded source is not in the app and so is not here: only what we can credit
// gets a row, and only what we show gets credited. Nothing is read from the cache — the table is
// part of the build, so the screen works offline and has no loading, empty or error state.
//
// The bar is the design's plain one (back to Settings, the screen's name, the profile button) and
// there are no tabs, because this is a page you visit, not a section.
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import { COPY } from '../copy/pidgin';
import { PHOTOS, photoSrc } from '../lib/creditsView';

export default function Credits() {
  return (
    <>
      <AppHeader
        variant="bar"
        back={{ to: '/settings', label: COPY.shell.back }}
        title={COPY.credits.title}
      />

      <div className="page page--credits">
        <p className="hand">{COPY.credits.kicker}</p>
        <p className="credits__lead">{COPY.credits.lead}</p>

        <ul className="credits" role="list">
          {PHOTOS.map((photo, index) => (
            <li className="card credit" key={photo.id}>
              <span className="credit__pic">
                <img
                  src={photoSrc(photo.id)}
                  alt=""
                  width={384}
                  height={384}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="num-badge" aria-hidden="true">
                {index + 1}
              </span>
              <span className="credit__body">
                <b>{photo.alt}</b>
                <small>{COPY.credits.used.replace('{where}', photo.used)}</small>
                <small>{COPY.credits.author.replace('{author}', photo.author)}</small>
                <small>{COPY.credits.licence.replace('{licence}', photo.licence)}</small>
              </span>
              {photo.page && (
                <a
                  className="go"
                  href={photo.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${COPY.credits.source}: ${photo.alt}`}
                >
                  <Icon name="arrowUpRight" size={20} />
                </a>
              )}
            </li>
          ))}
        </ul>

        <section className="card">
          <h2>{COPY.credits.mapTitle}</h2>
          <p>{COPY.credits.mapBody}</p>
          <p>
            <a
              className="credits__maplink"
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
            >
              {COPY.credits.mapLink}
            </a>
          </p>
        </section>

        <section className="card">
          <h2>{COPY.credits.iconsTitle}</h2>
          <p>{COPY.credits.iconsBody}</p>
          <h2>{COPY.credits.fontsTitle}</h2>
          <p>{COPY.credits.fontsBody}</p>
        </section>

        <section className="card card--soft">
          <h2>{COPY.credits.placeholdersTitle}</h2>
          <p>{COPY.credits.placeholdersBody}</p>
        </section>

        <p className="hint center">{COPY.credits.attribution}</p>

        <div className="card card--soft center">
          <b>{COPY.credits.footer}</b>
        </div>
      </div>

      <Footer />
    </>
  );
}
