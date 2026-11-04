import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import FirstSyncScreen from './components/FirstSyncScreen';
import OfflineBanner from './components/OfflineBanner';
import SyncNotice from './components/SyncNotice';
import TabBar from './components/TabBar';
import { hasSeenWelcome } from './lib/firstRun';
import { dismissFirstSync, showFirstSyncScreen, useSyncView } from './lib/syncStatus';
import Home from './pages/Home';
import Welcome from './pages/Welcome';

// Heavy / rarely used screens are lazy-loaded to protect the first-load budget.
// The Academics screens read the offline cache (Dexie), so they load on demand too.
const MapPage = lazy(() => import('./pages/MapPage'));
const PlacePage = lazy(() => import('./pages/PlacePage'));
// The admin screens share one stylesheet that loads with them, not on first load.
const Admin = lazy(() => import('./pages/Admin'));
const AdminPublish = lazy(() => import('./pages/AdminPublish'));
const AdminVerify = lazy(() => import('./pages/AdminVerify'));
const Academics = lazy(() => import('./pages/Academics'));
const FacultyDepartments = lazy(() => import('./pages/FacultyDepartments'));
const DepartmentDetail = lazy(() => import('./pages/DepartmentDetail'));
const Timetable = lazy(() => import('./pages/Timetable'));
// Login and sign-up are optional, so they load only when opened.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
// Reads the offline cache, so it loads on demand too.
const Announcements = lazy(() => import('./pages/Announcements'));

// The offline store (Dexie) is loaded on demand, so it stays out of the first load.
function retrySync() {
  import('./lib/offline')
    .then((m) => m.syncReferenceData())
    .catch(() => {});
}

/**
 * Screens that carry their own header inside the hero, so App must not draw a second one.
 * Welcome, Home, Campus Map, Place detail, Academics, Timetable, log in and sign-up all show
 * their own top row over the photo (screenshots `welcome-390`, `home-390`, `map-390`,
 * `place-390`, `academics-390`, `timetable-390`, `login-390`, `register-390`).
 */
function showsHeader(pathname: string): boolean {
  return (
    pathname !== '/' &&
    pathname !== '/welcome' &&
    pathname !== '/map' &&
    !pathname.startsWith('/place/') &&
    pathname !== '/academics' &&
    pathname !== '/timetable' &&
    !pathname.endsWith('/timetable') &&
    pathname !== '/login' &&
    pathname !== '/register'
  );
}

/**
 * The five-tab bar belongs to the main sections only. Welcome, log in, sign-up, the admin
 * screens and the first-sync screen each stand on their own (screenshots `welcome-390`,
 * `login-390`, `sync-390`, `admin-390`).
 */
function showsTabBar(pathname: string, firstSync: boolean): boolean {
  if (firstSync) return false;
  if (pathname.startsWith('/admin')) return false;
  return pathname !== '/welcome' && pathname !== '/login' && pathname !== '/register';
}

export default function App() {
  const sync = useSyncView();
  const { pathname } = useLocation();

  // Welcome owns the first visit, so the sync screen must not jump over it. Once the student
  // taps "Oya, make we start!" the route changes and this turns back on.
  const firstSync = showFirstSyncScreen(sync) && pathname !== '/welcome';
  // The sync screen carries its own logo row inside the hero and no tabs (screenshot sync-390).
  // Home, Campus Map, Place detail, Academics and Timetable also draw their own hero, page and
  // footer, so the shell adds no padding (home-390, map-390, place-390, academics-390,
  // timetable-390).
  const bare =
    firstSync ||
    pathname === '/' ||
    pathname === '/map' ||
    pathname === '/academics' ||
    pathname === '/timetable' ||
    pathname.endsWith('/timetable') ||
    pathname.startsWith('/place/') ||
    !showsTabBar(pathname, false);
  // Welcome, log in and sign-up stand alone: no sync banner over their hero.
  const authScreen =
    pathname === '/welcome' || pathname === '/login' || pathname === '/register';

  useEffect(() => {
    // Prime the offline cache in the background. Fails silently when offline / API not ready.
    if (navigator.onLine) retrySync();
    // Retry when the connection comes back, so a failed sync does not wait for a reload.
    window.addEventListener('online', retrySync);
    return () => window.removeEventListener('online', retrySync);
  }, []);

  return (
    <>
      <OfflineBanner />
      {showsHeader(pathname) && !firstSync && <AppHeader />}
      {!authScreen && !firstSync && <SyncNotice onRetry={retrySync} />}
      <main className={bare ? 'main--bare' : undefined}>
        {firstSync ? (
          <FirstSyncScreen
            progress={sync.progress}
            onContinue={dismissFirstSync}
            onRetry={retrySync}
          />
        ) : (
          <Suspense fallback={<p className="muted">Loading…</p>}>
            <Routes>
              <Route
                path="/"
                element={hasSeenWelcome() ? <Home /> : <Navigate to="/welcome" replace />}
              />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/place/:id" element={<PlacePage />} />
              <Route path="/academics" element={<Academics />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/academics/:facultyId" element={<FacultyDepartments />} />
              <Route
                path="/academics/:facultyId/:departmentId"
                element={<DepartmentDetail />}
              />
              <Route
                path="/academics/:facultyId/:departmentId/timetable"
                element={<Timetable />}
              />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/publish" element={<AdminPublish />} />
              <Route path="/admin/verify" element={<AdminVerify />} />
            </Routes>
          </Suspense>
        )}
      </main>

      {showsTabBar(pathname, firstSync) && <TabBar />}
    </>
  );
}
