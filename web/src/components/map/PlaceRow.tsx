// One row of a place list: the picture (or its category icon), the name and its category, then
// the round arrow. Shared by the Campus Map's list and a place page's "Nearby".
//
// On the map the body is a button that shows that place on the drawing, and the arrow opens its
// own screen (map-390). On a place's screen the row is one link to the other place, so there is
// not a second tap target that goes to the same address.
import { Link } from 'react-router-dom';
import Icon from '../Icon';
import {
  CATEGORIES,
  categoryName,
  categoryStyle,
  placePhoto,
  type MapPlace,
} from '../../lib/mapView';
import { COPY } from '../../copy/pidgin';

function Picture({ place }: { place: MapPlace }) {
  const photo = placePhoto(place.name);
  return photo ? (
    <img
      className="place-row__pic"
      src={photo}
      alt=""
      width={144}
      height={144}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span
      className="place-row__pic place-row__pic--icon"
      style={categoryStyle(place.category)}
      aria-hidden="true"
    >
      <Icon name={CATEGORIES[place.category].icon} size={28} />
    </span>
  );
}

function Body({ place }: { place: MapPlace }) {
  return (
    <>
      <b>{place.name}</b>
      <small>{categoryName(place.category)}</small>
    </>
  );
}

interface PlaceRowProps {
  place: MapPlace;
  /** Given on the map: the body shows the place there instead of opening it. */
  onShow?: (id: string) => void;
}

export default function PlaceRow({ place, onShow }: PlaceRowProps) {
  if (!onShow) {
    return (
      <li className="place-row place-row--link">
        <Link className="place-row__link" to={`/place/${place.id}`}>
          <Picture place={place} />
          <span className="place-row__body">
            <Body place={place} />
          </span>
          <span className="go" aria-hidden="true">
            <Icon name="arrowRight" size={20} />
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li className="place-row">
      <Picture place={place} />
      <button
        className="place-row__body"
        type="button"
        onClick={() => onShow(place.id)}
        aria-label={`${COPY.map.viewOnMap}: ${place.name}`}
      >
        <Body place={place} />
      </button>
      <Link className="go" to={`/place/${place.id}`} aria-label={`${COPY.map.openPlace}: ${place.name}`}>
        <Icon name="arrowRight" size={20} />
      </Link>
    </li>
  );
}
