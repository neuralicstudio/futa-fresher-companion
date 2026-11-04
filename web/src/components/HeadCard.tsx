// The head of a school or a department: its picture, a way back, its symbol and name, and the
// trust mark. It is the design's department panel head (screenshot academics-390), reused so a
// school and the departments under it read as one ladder rather than two designs.
//
// The picture is a real photo only where one exists (School of Computing); elsewhere it is the
// drawn night, which the credits screen lists as a drawing rather than a photo.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Icon, { type IconName } from './Icon';
import Seal from './Seal';

interface HeadCardProps {
  /** Where the back chip goes. */
  to: string;
  backLabel: string;
  icon: IconName;
  title: string;
  /** The line under the name: a school's size, or the school a department sits in. */
  subline?: string;
  /** The record's status, for the mark beside the name. */
  status?: string;
  photo?: string;
  /** The drawn fallback when there is no photo. */
  scene?: ReactNode;
  /** The note under the picture: the date and the source. */
  children?: ReactNode;
  /** A child that brings its own spacing (the department's tabs), so the body adds none. */
  flush?: boolean;
}

export default function HeadCard({
  to,
  backLabel,
  icon,
  title,
  subline,
  status,
  photo,
  scene,
  children,
  flush = false,
}: HeadCardProps) {
  return (
    <article className="head-card" aria-labelledby="head-title">
      <div className="head-card__top">
        <div className="head-card__pic" aria-hidden="true">
          {photo ? (
            <img src={photo} alt="" width={560} height={315} decoding="async" />
          ) : (
            scene
          )}
        </div>

        <Link className="back back--chip" to={to}>
          <Icon name="arrowLeft" size={20} />
          <span>{backLabel}</span>
        </Link>

        <div className="head-card__head">
          <span className="head-card__icon">
            <Icon name={icon} size={30} />
          </span>
          <div className="head-card__name">
            <h1 id="head-title">{title}</h1>
            {subline && <p>{subline}</p>}
          </div>
          {status && <Seal status={status} />}
        </div>
      </div>

      {children && (
        <div className={`head-card__body${flush ? ' head-card__body--flush' : ''}`}>{children}</div>
      )}
    </article>
  );
}
