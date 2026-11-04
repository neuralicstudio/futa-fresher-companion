// The campus map: OpenStreetMap data drawn as SVG in the app's dark colours (screenshots
// map-390, map-768). No tiles, no satellite imagery, no network, so it works offline.
//
// There is no routing in v1: no "get directions", no walking time. Pan by drag or the arrow keys,
// zoom with the buttons, the wheel, or + and -. The drawing is one picture for people who can see
// it; the place list under the card is the keyboard and screen-reader path to the same places,
// which is why the pins are pointer targets rather than 163 extra tab stops.
//
// The view lives in a ref, so dragging rewrites one `viewBox` attribute instead of re-rendering
// every pin on each pointer move. Only a zoom change re-renders, because the pins keep their
// screen size and need a new scale.
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { CAMPUS_MAP } from './campusMapData';
import Icon, { ICON_PATHS } from '../Icon';
import { CATEGORIES, campusCentre, type MapPlace } from '../../lib/mapView';
import { COPY } from '../../copy/pidgin';

const W = CAMPUS_MAP.size[0];
const H = CAMPUS_MAP.size[1];
/** The closest you can zoom in, in drawing units (about 210 m across). */
const MIN_WIDTH = 420;
/** How far one arrow key moves, as a share of the visible width. */
const PAN_STEP = 0.1;
const ZOOM_STEP = 1.35;
const OSM_COPYRIGHT = 'https://www.openstreetmap.org/copyright';

/** Measures the view before paint in a browser, without warning when rendered alone. */
const useLayoutEffectSafe =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface CampusMapHandle {
  /** Brings a place into the middle of the view, for the card's "View on map". */
  center: (id: string) => void;
}

interface CampusMapProps {
  /** The places the pins show, already filtered by the screen. */
  places: MapPlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Called after "My location" shows the sample dot, so the screen can explain it. */
  onLocate: () => void;
}

/** The pin shape: a teardrop whose tip sits on the place. */
const PIN = 'M0 0C-9-9-14-14-14-20a14 14 0 0 1 28 0C14-14 9-9 0 0z';

/** How wide the first view is: the whole drawing when there is nothing to zoom to. */
function startWidth(placeCount: number): number {
  return placeCount > 0 ? 1500 : W;
}

const CampusMap = forwardRef<CampusMapHandle, CampusMapProps>(function CampusMap(
  { places, selectedId, onSelect, onLocate },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const labelRef = useRef<SVGGElement>(null);
  const meRef = useRef<SVGGElement>(null);
  const view = useRef({ ...campusCentre(), w: startWidth(places.length) });
  const placed = useRef(false);
  const placesRef = useRef(places);
  placesRef.current = places;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const [pinScale, setPinScale] = useState(1);

  const selected = places.find((place) => place.id === selectedId) ?? null;

  /** Writes the current view onto the SVG and rescales the pins so they stay the same size. */
  const layout = useCallback(() => {
    const host = hostRef.current;
    const svg = svgRef.current;
    if (!host || !svg) return;

    const box = host.getBoundingClientRect();
    const width = box.width || 1;
    const aspect = (box.height || 320) / width;
    // Never zoom out past the drawing itself: a strip of empty ground is not useful.
    const widest = Math.min(W, H / aspect);
    const v = view.current;
    v.w = Math.max(MIN_WIDTH, Math.min(widest, v.w));
    const height = v.w * aspect;
    v.x = Math.max(v.w / 2, Math.min(W - v.w / 2, v.x));
    v.y = Math.max(height / 2, Math.min(H - height / 2, v.y));

    const left = (v.x - v.w / 2).toFixed(2);
    const top = (v.y - height / 2).toFixed(2);
    svg.setAttribute('viewBox', `${left} ${top} ${v.w.toFixed(2)} ${height.toFixed(2)}`);
    const scale = v.w / width;
    setPinScale((current) => (Math.abs(current - scale) < 0.001 ? current : scale));
  }, []);

  /** Applies a zoom factor around the middle of the view. */
  const zoom = useCallback(
    (factor: number) => {
      view.current.w *= factor;
      layout();
    },
    [layout],
  );

  const center = useCallback(
    (id: string) => {
      const place = placesRef.current.find((item) => item.id === id);
      if (!place) return;
      view.current.x = place.x;
      view.current.y = place.y;
      layout();
    },
    [layout],
  );

  const locate = useCallback(() => {
    // There is no geolocation prompt in v1: the design shows a sample dot at the west gate and
    // says so, rather than asking for a permission the app does not use yet.
    const gate = CAMPUS_MAP.places.find((place) => place.id === 'west-gate');
    const at = gate ? { x: gate.x + 140, y: gate.y - 90 } : campusCentre();
    meRef.current?.setAttribute('transform', `translate(${at.x} ${at.y})`);
    meRef.current?.setAttribute('visibility', 'visible');
    if (gate) {
      view.current.x = gate.x;
      view.current.y = gate.y;
    }
    layout();
    onLocate();
  }, [layout, onLocate]);

  useImperativeHandle(ref, () => ({ center }), [center]);

  // The first view sits on the place the screen has selected, then on the first library, then on
  // the middle of campus when the cache holds nothing yet. It runs once: filtering the list must
  // not move the map under the student.
  useLayoutEffectSafe(() => {
    if (!placed.current) {
      const start =
        placesRef.current.find((place) => place.id === selectedIdRef.current) ??
        placesRef.current.find((place) => place.category === 'library') ??
        placesRef.current[0];
      if (start) {
        view.current.x = start.x;
        view.current.y = start.y;
        view.current.w = startWidth(placesRef.current.length);
      }
      placed.current = true;
    }
    layout();
  }, [layout]);

  // A new selection moves the name tag over that pin.
  useLayoutEffectSafe(() => {
    if (!labelRef.current) return;
    if (!selected) {
      labelRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    labelRef.current.setAttribute('transform', `translate(${selected.x} ${selected.y})`);
    labelRef.current.setAttribute('visibility', 'visible');
  }, [selected, pinScale]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => layout());
    observer.observe(host);
    return () => observer.disconnect();
  }, [layout]);

  // The wheel must not scroll the page while it zooms, and React's own wheel listener is passive.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoom(event.deltaY > 0 ? 1.2 : 1 / 1.2);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoom]);

  // Dragging pans; a tap on a pin selects instead.
  const drag = useRef<{ x: number; y: number } | null>(null);

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if ((event.target as Element).closest('.m-pin')) return;
    drag.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add('is-drag');
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    const width = hostRef.current?.getBoundingClientRect().width || 1;
    const perPixel = view.current.w / width;
    view.current.x -= (event.clientX - drag.current.x) * perPixel;
    view.current.y -= (event.clientY - drag.current.y) * perPixel;
    drag.current = { x: event.clientX, y: event.clientY };
    layout();
  }

  function endDrag(event: React.PointerEvent<SVGSVGElement>) {
    drag.current = null;
    event.currentTarget.classList.remove('is-drag');
  }

  function onKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    const step = view.current.w * PAN_STEP;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      view.current.x += move[0];
      view.current.y += move[1];
      layout();
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoom(1 / ZOOM_STEP);
    }
    if (event.key === '-') {
      event.preventDefault();
      zoom(ZOOM_STEP);
    }
  }

  return (
    <div className="mapcard">
      <div className="mapcard__host" ref={hostRef}>
        <svg
          ref={svgRef}
          className="campus-map"
          role="img"
          aria-label={COPY.map.mapLabel}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        >
          <rect className="m-ground" x={0} y={0} width={W} height={H} />
          {(['grass', 'wood', 'water', 'pitch'] as const).map((layer) => (
            <path key={layer} className={`m-${layer}`} d={CAMPUS_MAP.layers[layer]} />
          ))}
          <path className="m-lane" d={CAMPUS_MAP.layers.lanes} />
          <path className="m-road" d={CAMPUS_MAP.layers.roads} />
          <path className="m-building" d={CAMPUS_MAP.layers.buildings} />

          <g className="m-pins">
            {places.map((place) => {
              const category = CATEGORIES[place.category];
              return (
                <g
                  key={place.id}
                  className={`m-pin${place.id === selectedId ? ' is-selected' : ''}`}
                  transform={`translate(${place.x} ${place.y})`}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                    // A drag also ends with a pointerup; only a tap selects.
                    if (!drag.current) onSelect(place.id);
                  }}
                >
                  <g className="m-pin__s" transform={`scale(${pinScale})`}>
                    <path className="m-pin__body" d={PIN} style={{ fill: category.color }} />
                    <path
                      className="m-pin__icon"
                      d={ICON_PATHS[category.icon]}
                      transform="translate(-9 -29) scale(0.0703)"
                    />
                  </g>
                </g>
              );
            })}
          </g>

          <g ref={labelRef} className="m-label" visibility="hidden">
            <g transform={`scale(${pinScale})`}>{selected && <PinLabel name={selected.name} />}</g>
          </g>

          <g ref={meRef} className="m-me" visibility="hidden">
            <circle className="m-me__pulse" r={30} />
            <circle className="m-me__dot" r={12} />
          </g>
        </svg>

        <span className="mapcard__compass" role="img" aria-label={COPY.map.compass}>
          <svg className="ic" viewBox="0 0 256 256" aria-hidden="true" focusable="false">
            <path d={ICON_PATHS.compass} />
          </svg>
          <b>N</b>
        </span>

        <div className="mapcard__zoom">
          <button
            className="iconbtn iconbtn--glass"
            type="button"
            aria-label={COPY.map.zoomIn}
            onClick={() => zoom(1 / ZOOM_STEP)}
          >
            <Icon name="plus" size={20} />
          </button>
          <button
            className="iconbtn iconbtn--glass"
            type="button"
            aria-label={COPY.map.zoomOut}
            onClick={() => zoom(ZOOM_STEP)}
          >
            <Icon name="minus" size={20} />
          </button>
        </div>
      </div>

      {/* One row at the foot of the drawing, so the attribution can never sit under the button. */}
      <div className="mapcard__foot">
        <p className="mapcard__attr">
          {COPY.map.attribution}.{' '}
          <a href={OSM_COPYRIGHT} target="_blank" rel="noopener noreferrer">
            {COPY.map.attributionLink}
          </a>
        </p>
        <button className="btn btn--glass mapcard__me" type="button" onClick={locate}>
          <Icon name="crosshairSimple" size={18} />
          <span>{COPY.map.myLocation}</span>
        </button>
      </div>
    </div>
  );
});

/** The name tag over the selected pin. Sized by the name so the text never spills out. */
function PinLabel({ name }: { name: string }) {
  const shown = name.length > 26 ? `${name.slice(0, 25)}…` : name;
  const width = shown.length * 7.4 + 36;
  return (
    <>
      <rect x={-width / 2} y={-78} width={width} height={30} rx={15} />
      <text x={0} y={-58} textAnchor="middle">
        {shown}
      </text>
    </>
  );
}

export default CampusMap;
