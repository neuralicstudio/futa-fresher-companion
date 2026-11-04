// The record's trust mark, as the design draws it (place-390, academics-390): a green check when
// the data has been checked, a dashed "not yet" when it has not, an amber warning when it may be
// out of date. The text carries the meaning; the symbol is only a second cue.
import type { Faculty } from '../api/types';
import { COPY } from '../copy/pidgin';
import { formatUpdated } from '../lib/academicsView';
import Icon, { type IconName } from './Icon';

/** Every verifiable record carries the same shape, so one type covers them all. */
type Verification = Faculty['verification'];

interface SealStyle {
  icon: IconName;
  text: string;
  className: string;
}

const SEALS: Record<string, SealStyle> = {
  verified: { icon: 'checkCircleFill', text: COPY.status.verified, className: 'seal--verified' },
  unverified: { icon: 'info', text: COPY.status.unverified, className: 'seal--unverified' },
  outdated: { icon: 'warning', text: COPY.status.outdated, className: 'seal--outdated' },
};

const UNKNOWN_SEAL: SealStyle = {
  icon: 'info',
  text: COPY.status.unknown,
  className: 'seal--unverified',
};

function sealFor(status: string): SealStyle {
  return SEALS[status] ?? UNKNOWN_SEAL;
}

/** The mark on its own, for a head that shows it beside the name. */
export default function Seal({ status }: { status: string }) {
  const seal = sealFor(status);
  return (
    <span className={`seal ${seal.className}`}>
      <Icon name={seal.icon} size={16} />
      {seal.text}
    </span>
  );
}

interface SealNoteProps {
  verification: Verification;
  updatedAt: string;
  /** The head already shows the mark, so the note only adds the date and the source. */
  bare?: boolean;
}

/** The mark with its date, and the source behind a disclosure. */
export function SealNote({ verification, updatedAt, bare = false }: SealNoteProps) {
  const seal = sealFor(verification.status);
  return (
    <div className="seal-wrap">
      <p className="seal-line">
        {!bare && (
          <span className={`seal ${seal.className}`}>
            <Icon name={seal.icon} size={16} />
            {seal.text}
          </span>
        )}
        <span className="seal-line__date">{formatUpdated(updatedAt)}</span>
      </p>
      <details className="source">
        <summary>
          <Icon name="caretRight" size={16} />
          <span>{COPY.shell.sourceLabel}</span>
        </summary>
        <p>{verification.source ?? COPY.shell.noSource}</p>
      </details>
    </div>
  );
}
