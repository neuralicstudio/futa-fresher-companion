// The five-tab floating bar: Home, Map, Academics, Timetable, Notices.
//
// Settings and Admin are deliberately NOT tabs (design handoff, "The fixes to the mockups", 1).
// They open from the profile icon. Adding a sixth tab here is a design change, not a tweak.
import { Link, NavLink } from 'react-router-dom';
import Icon, { type IconName } from './Icon';
import { COPY } from '../copy/pidgin';

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
 * A timetable belongs to a department, so this tab only has its own address once the app knows
 * the student's department. Until the profile carries one (step 4) it opens the academics list
 * and must NOT claim to be the current tab, or it would light up beside Academics.
 */
const TIMETABLE: Tab = {
  to: '/academics',
  label: COPY.shell.tabs.timetable,
  icon: 'timetable',
  iconActive: 'timetableFill',
};

interface TabBarProps {
  /** Shows the gold dot on Notices when there are unread notices. */
  unread?: boolean;
  /** The student's own timetable, once the profile knows their department. */
  timetableTo?: string;
}

export default function TabBar({ unread = false, timetableTo }: TabBarProps) {
  // The design's tab order: Home, Map, Academics, Timetable, Notices.
  const tabs: Tab[] = [
    HOME,
    MAP,
    ACADEMICS,
    timetableTo ? { ...TIMETABLE, to: timetableTo } : TIMETABLE,
    NOTICES,
  ];

  return (
    <nav className="tabbar" aria-label={COPY.shell.nav}>
      {tabs.map((tab) => {
        const showsUnread = tab === NOTICES && unread;

        // No department yet: a plain link, so it never reports itself as the current page.
        if (tab === TIMETABLE) {
          return (
            <Link key={tab.label} to={tab.to} className="tab">
              <Icon name={tab.icon} className="tab__icon" />
              <span>{tab.label}</span>
            </Link>
          );
        }

        return (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `tab${isActive ? ' is-current' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Icon name={isActive ? tab.iconActive : tab.icon} className="tab__icon" />
                <span>{tab.label}</span>
                {showsUnread && (
                  <>
                    <span className="tab__dot" aria-hidden="true" />
                    <span className="visually-hidden">{COPY.notices.unreadDot}</span>
                  </>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
