// The coloured chip at the top of a notice, on the list and on the notice's own screen:
// University gold, SUG red, School green, Department indigo, each with its own icon.
import Icon, { type IconName } from '../Icon';
import type { Announcement } from '../../api/types';
import { scopeName, scopeTone } from '../../lib/announcementsView';

const ICONS: Record<Announcement['scope'], IconName> = {
  university: 'megaphone',
  sug: 'bellRinging',
  faculty: 'buildings',
  department: 'bookOpenText',
};

export default function ScopeChip({ scope }: { scope: Announcement['scope'] }) {
  return (
    <span className={`chip chip--scope-${scopeTone(scope)}`}>
      <Icon name={ICONS[scope]} size={16} />
      {scopeName(scope)}
    </span>
  );
}
