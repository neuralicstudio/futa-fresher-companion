// Campus Map: the gate photo, the search field, the quick categories, the drawn campus map, the
// selected place and the full list of places (screenshots map-390, map-768).
//
// Everything below the hero comes from the offline cache, so the screen works with no data. The
// drawing itself is a lazy chunk (`components/map/`), which keeps the map data out of the first
// load. There is no routing in v1 and no "get directions" anywhere on this screen.
import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon from '../components/Icon';
import StateBlock from '../components/StateBlock';
import CampusMap, { type CampusMapHandle } from '../components/map/CampusMap';
import PlaceRow from '../components/map/PlaceRow';
import { COPY } from '../copy/pidgin';
import type { Building } from '../api/types';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  categoryBlurb,
  categoryName,
  categoryStyle,
  countLabel,
  filterPlaces,
  placePhoto,
  sortPlaces,
  toMapPlace,
  type MapCategory,
  type MapPlace,
} from '../lib/mapView';
import { readBuildings } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';
import { useOnline } from '../lib/useOnline';

/** The card under the map: the place the student picked, with the way to its own screen. */
function SelectedPlace({
  place,
  onViewOnMap,
}: {
  place: MapPlace;
  onViewOnMap: () => void;
}) {
  const photo = placePhoto(place.name);
  const category = CATEGORIES[place.category];
  return (
    <article className="card sel" aria-live="polite">
      {photo ? (
        <img
          className="sel__pic"
          src={photo}
          alt=""
          width={768}
          height={432}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span
          className="sel__pic sel__pic--icon"
          style={categoryStyle(place.category)}
          aria-hidden="true"
        >
          <Icon name={category.icon} size={40} />
        </span>
      )}
      <div className="sel__body">
        <span className="chip chip--gold-solid">{categoryName(place.category)}</span>
        <h3>{place.name}</h3>
        <p className="meta-line">
          <Icon name="map" size={18} />
          <span>{place.verified ? COPY.status.verified : COPY.map.sourceLine}</span>
        </p>
        <p className="meta-line">
          <Icon name="clock" size={18} />
          <span>{COPY.place.hoursUnknown}</span>
        </p>
        <p className="sel__blurb">{categoryBlurb(place.category)}</p>
        <div className="btn-row">
          <Link className="btn btn--outline" to={`/place/${place.id}`}>
            <Icon name="info" size={18} />
            <span>{COPY.map.openPlace}</span>
          </Link>
          <button className="btn btn--gold" type="button" onClick={onViewOnMap}>
            <Icon name="mapTrifold" size={18} />
            <span>{COPY.map.viewOnMap}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MapPage() {
  const { result, retry } = useCachedRows(readBuildings);
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState<MapCategory | null>(null);
  // A place page's "View on map" opens `/map?place=<id>`, so the map starts on that place.
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get('place'));
  const [located, setLocated] = useState(false);
  const online = useOnline();
  const mapRef = useRef<CampusMapHandle>(null);
  const firstCatRef = useRef<HTMLButtonElement>(null);

  const query = params.get('q') ?? '';
  // The field answers on the first keystroke; the 163 pins can catch up a frame later, so typing
  // stays smooth on a cheap phone.
  const deferredQuery = useDeferredValue(query);

  const buildings: Building[] = result.state === 'ready' ? result.value : [];
  const places = useMemo(() => sortPlaces(buildings.map(toMapPlace)), [buildings]);
  const shown = useMemo(
    () => filterPlaces(places, { q: deferredQuery, category }),
    [places, deferredQuery, category],
  );

  // A selection that the filter just hid falls back to the first place on screen. Nothing is
  // written back to state, so clearing the filter brings the place back.
  const selected = shown.find((place) => place.id === selectedId) ?? shown[0] ?? null;

  function setQuery(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  }

  function toggleCategory(next: MapCategory) {
    setCategory((current) => (current === next ? null : next));
  }

  /** The search field's filter button: the chips are the filters, so it brings them to you. */
  function showFilters() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById('map-cats')
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    firstCatRef.current?.focus({ preventScroll: true });
  }

  function showOnMap(id: string) {
    setSelectedId(id);
    mapRef.current?.center(id);
  }

  const hint = located
    ? `${COPY.map.locationOff} ${COPY.map.locationSample}`
    : online
      ? COPY.map.routingSoon
      : COPY.map.offlineNote;

  return (
    <>
      <Hero
        size="std"
        photo="/photos/gate-l.webp"
        kicker={COPY.map.kicker}
        title={COPY.map.title}
        gold={COPY.map.titleGold}
        lead={COPY.map.lead}
        header={<AppHeader variant="hero" pill />}
      >
        <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label className="visually-hidden" htmlFor="map-q">
            {COPY.map.search}
          </label>
          <Icon name="search" size={22} />
          <input
            id="map-q"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={COPY.map.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="iconbtn iconbtn--plain"
            type="button"
            aria-label={COPY.home.searchFilters}
            onClick={showFilters}
          >
            <Icon name="filters" size={22} />
          </button>
        </form>
      </Hero>

      <div className="page page--map">
        {result.state === 'loading' && (
          <StateBlock inline icon="map" title={COPY.states.loadingTitle} />
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

        {result.state === 'ready' && (
          <>
            <section className="section" aria-labelledby="map-cats-h">
              <div className="section__head">
                <h2 id="map-cats-h">
                  <Icon name="map" size={22} />
                  <span>{COPY.map.categoriesTitle}</span>
                </h2>
              </div>
              <ul className="cats" id="map-cats" role="list">
                {CATEGORY_ORDER.map((cat, index) => (
                  <li key={cat}>
                    <button
                      ref={index === 0 ? firstCatRef : undefined}
                      className="cat"
                      type="button"
                      style={categoryStyle(cat)}
                      aria-pressed={category === cat}
                      onClick={() => toggleCategory(cat)}
                    >
                      <span className="cat__icon">
                        <Icon name={CATEGORIES[cat].icon} size={24} />
                      </span>
                      <span>{categoryName(cat)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <CampusMap
              ref={mapRef}
              places={shown}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
              onLocate={() => setLocated(true)}
            />

            <p className="hint" role="status">
              {hint}
            </p>

            {selected && (
              <SelectedPlace place={selected} onViewOnMap={() => showOnMap(selected.id)} />
            )}

            <section className="section" aria-labelledby="map-places-h">
              <div className="section__head">
                <h2 id="map-places-h">
                  <span>{COPY.map.resultsTitle}</span>
                </h2>
                <span className="hint">{countLabel(shown.length)}</span>
              </div>

              {shown.length > 0 ? (
                <ul className="place-list" role="list">
                  {shown.map((place) => (
                    <PlaceRow key={place.id} place={place} onShow={showOnMap} />
                  ))}
                </ul>
              ) : (
                <StateBlock
                  icon={query || category ? 'search' : 'map'}
                  title={
                    query
                      ? COPY.map.noMatchTitle.replace('{q}', query)
                      : category
                        ? COPY.map.noCategoryTitle
                        : COPY.map.noPlacesTitle
                  }
                  body={query || category ? COPY.map.noMatchBody : COPY.place.notFoundBody}
                />
              )}
            </section>
          </>
        )}
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}
