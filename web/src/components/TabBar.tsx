// The five-tab floating bar: Home, Map, Academics, Timetable, Notices.
//
// Settings and Admin are deliberately NOT tabs (design handoff, "The fixes to the mockups", 1).
// They open from the profile icon. Adding a sixth tab here is a design change, not a tweak.
import { NavLink, useLocation } from 'react-router-dom';
import Icon, { type IconName } from './Icon';
import { COPY } from '../copy/pidgin';
import { useUnreadNotices } from '../lib/useUnreadNotices';

interface Tab {
  to: string;
  label: string;
  icon: IconName;
  /** The filled icon shown when this tab is the current one. */
  iconActive: IconName;
  /** Exact match: Home must not stay active on every route. */
  end?: boolean;
}

const HOME: Tab = {
  to: '/',
  label: COPY.shell.tabs.home,
  icon: 'home',
  iconActive: 'homeFill',
  end: true,
};
const MAP: Tab = {
  to: '/map',
  label: COPY.shell.tabs.map,
  icon: 'map',
  iconActive: 'mapFill',
};
const ACADEMICS: Tab = {
  to: '/academics',
  label: COPY.shell.tabs.academics,
  icon: 'academics',
  iconActive: 'academicsFill',
};
const NOTICES: Tab = {
  to: '/announcements',
  label: COPY.shell.tabs.notices,
  icon: 'notices',
  iconActive: 'noticesFill',
};

/**
 * The timetable now has its own address (`/timetable`), where it shows the signed-in student's
 * department. A department's timetable keeps its deeper address, so this tab stays current on
 * either, the way Map stays current on a place's screen.
 */
const TIMETABLE: Tab = {
  to: '/timetable',
  label: COPY.shell.tabs.timetable,
  icon: 'timetable',
  iconActive: 'timetableFill',
};

export default function TabBar() {
  const { pathname } = useLocation();
  const unread = useUnreadNotices() > 0;
  // A place detail belongs to the Map section even though its address is /place/:id
  // (screenshot place-390: the Map tab is the gold one).
  const onPlace = pathname === '/place' || pathname.startsWith('/place/');
  const onTimetable = pathname === '/timetable' || pathname.endsWith('/timetable');

  // A timetable deep link under /academics is still the Timetable tab, not Academics, so only
  // one tab is gold at a time.
  function isCurrent(tab: Tab, isActive: boolean): boolean {
    if (tab === TIMETABLE) return onTimetable;
    if (onTimetable) return false;
    return isActive || (tab === MAP && onPlace);
  }

  // The design's tab order: Home, Map, Academics, Timetable, Notices.
  const tabs: Tab[] = [HOME, MAP, ACADEMICS, TIMETABLE, NOTICES];

  return (
    <nav className="tabbar" aria-label={COPY.shell.nav}>
      {tabs.map((tab) => {
        const showsUnread = tab === NOTICES && unread;

        return (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `tab${isCurrent(tab, isActive) ? ' is-current' : ''}`}
          >
            {({ isActive }) => {
              const current = isCurrent(tab, isActive);
              return (
                <>
                  <Icon name={current ? tab.iconActive : tab.icon} className="tab__icon" />
                  <span>{tab.label}</span>
                  {showsUnread && (
                    <>
                      <span className="tab__dot" aria-hidden="true" />
                      <span className="visually-hidden">{COPY.notices.unreadDot}</span>
                    </>
                  )}
                </>
              );
            }}
          </NavLink>
        );
      })}
    </nav>
  );
}
