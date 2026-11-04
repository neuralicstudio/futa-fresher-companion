// Place detail: a place's own screen, reached from the map's list or its pins (screenshots
// place-390, place-768, place-noPhoto-390, place-notFound-390).
//
// It reads the offline cache, so a saved place opens with no network. There is no routing in v1:
// the page says where the place is, not how to walk there.
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon, { type IconName } from '../components/Icon';
import StateBlock from '../components/StateBlock';
import CampusMap from '../components/map/CampusMap';
import PlaceRow from '../components/map/PlaceRow';
import PlaceScene from '../components/map/PlaceScene';
import { COPY } from '../copy/pidgin';
import type { Building } from '../api/types';
import { formatUpdated } from '../lib/academicsView';
import {
  CATEGORIES,
  categoryBlurb,
  categoryName,
  nearbyPlaces,
  placePhoto,
  placePhotoCredit,
  sortPlaces,
  toMapPlace,
} from '../lib/mapView';
import { readBuildings } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

/** How the record's verification reads, in the design's seal (place-390). */
const SEALS: Record<string, { icon: IconName; text: string; className: string }> = {
  verified: { icon: 'checkCircleFill', text: COPY.status.verified, className: 'seal--verified' },
  unverified: { icon: 'info', text: COPY.status.unverified, className: 'seal--unverified' },
  outdated: { icon: 'warning', text: COPY.status.outdated, className: 'seal--outdated' },
};
const UNKNOWN_SEAL = {
  icon: 'info' as IconName,
  text: COPY.status.unknown,
  className: 'seal--unverified',
};

export default function PlacePage() {
  const { id = '' } = useParams();
  const { result } = useCachedRows(readBuildings);

  const buildings: Building[] = result.state === 'ready' ? result.value : [];
  const places = useMemo(() => sortPlaces(buildings.map(toMapPlace)), [buildings]);
  const building = buildings.find((item) => item.id === id) ?? null;
  const place = building ? toMapPlace(building) : null;

  const photo = building ? placePhoto(building.name, 'l') : undefined;
  const credit = building ? placePhotoCredit(building.name) : undefined;
  const nearby = place ? nearbyPlaces(places, place.id) : [];
  const seal = building ? (SEALS[building.verification.status] ?? UNKNOWN_SEAL) : UNKNOWN_SEAL;

  // The hero says what the screen is about; the card below only appears when there is a place.
  let title: string = COPY.place.notFoundTitle;
  if (result.state === 'loading') title = COPY.states.loadingTitle;
  else if (result.state === 'error') title = COPY.states.errorTitle;
  else if (building) title = building.name;

  return (
    <>
      <Hero
        size={building ? 'std' : 'short'}
        photo={photo}
        scene={<PlaceScene />}
        kicker={building ? COPY.place.kicker : undefined}
        title={title}
        header={
          <AppHeader variant="hero" back={{ to: '/map', label: COPY.place.back }} />
        }
      >
        {place && (
          <span className="chip chip--gold-solid">
            <Icon name={CATEGORIES[place.category].icon} size={18} />
            {categoryName(place.category)}
          </span>
        )}
      </Hero>

      <div className="page page--place">
        {result.state === 'loading' && (
          <StateBlock inline icon="map" title={COPY.states.loadingTitle} />
        )}

        {result.state === 'error' && (
          <StateBlock
            icon="warningCircle"
            title={COPY.states.errorTitle}
            body={COPY.states.errorBody}
          />
        )}

        {result.state === 'ready' && !building && (
          <StateBlock
            icon="map"
            title={COPY.place.notFoundTitle}
            body={COPY.place.notFoundBody}
          />
        )}

        {building && place && (
          <>
            {!photo && (
              <section className="card card--empty-photo" aria-labelledby="photo-h">
                <Icon name="image" size={34} />
                <div>
                  <h2 id="photo-h">{COPY.place.noPhotoTitle}</h2>
                  <p>{COPY.place.noPhotoBody}</p>
                </div>
              </section>
            )}

            <article className="card place-about">
              <h2 className="visually-hidden">{COPY.place.about}</h2>
              <dl className="facts">
                <dt>{COPY.place.category}</dt>
                <dd>{categoryName(place.category)}</dd>
                <dt>{COPY.place.where}</dt>
                <dd>{COPY.map.sourceLine}</dd>
                <dt>{COPY.place.hours}</dt>
                <dd>{COPY.place.hoursUnknown}</dd>
              </dl>

              <p>{categoryBlurb(place.category)}</p>

              <div className="seal-wrap">
                <p className="seal-line">
                  <span className={`seal ${seal.className}`}>
                    <Icon name={seal.icon} size={16} />
                    {seal.text}
                  </span>
                  <span className="seal-line__date">{formatUpdated(building.updated_at)}</span>
                </p>
                <details className="source">
                  <summary>
                    <Icon name="caretRight" size={16} />
                    <span>{COPY.shell.sourceLabel}</span>
                  </summary>
                  <p>{building.verification.source ?? COPY.shell.noSource}</p>
                </details>
              </div>

              <div className="btn-row">
                <Link className="btn btn--gold" to={`/map?place=${place.id}`}>
                  <Icon name="mapTrifold" size={18} />
                  <span>{COPY.place.viewOnMap}</span>
                </Link>
              </div>
            </article>

            <CampusMap mini places={places} selectedId={place.id} />

            {nearby.length > 0 && (
              <section className="section" aria-labelledby="nearby-h">
                <div className="section__head">
                  <h2 id="nearby-h">{COPY.place.nearby}</h2>
                </div>
                <ul className="place-list" role="list">
                  {nearby.map((item) => (
                    <PlaceRow key={item.id} place={item} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <Footer
        className="foot--tabs"
        photoCredit={
          credit
            ? COPY.place.photoCredit
                .replace('{author}', credit.author)
                .replace('{licence}', credit.licence)
            : undefined
        }
      />
    </>
  );
}
