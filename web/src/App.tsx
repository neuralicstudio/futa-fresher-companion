import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import FirstSyncScreen from './components/FirstSyncScreen';
import OfflineBanner from './components/OfflineBanner';
import ProfileSheet from './components/ProfileSheet';
import SyncNotice from './components/SyncNotice';
import TabBar from './components/TabBar';
import { dismissFirstSync, showFirstSyncScreen, useSyncView } from './lib/syncStatus';
import Home from './pages/Home';
import { useAuth } from './lib/auth';

// Heavy / rarely used screens are lazy-loaded to protect the first-load budget.
// The Academics screens read the offline cache (Dexie), so they load on demand too.
const MapPage = lazy(() => import('./pages/MapPage'));
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
 * The five-tab bar belongs to the main sections only. Log in, sign-up, the admin screens and
 * the first-sync screen each stand on their own (design handoff, screenshots `login-390`,
 * `sync-390`, `admin-390`).
 */
function showsTabBar(pathname: string, firstSync: boolean): boolean {
  if (firstSync) return false;
  if (pathname.startsWith('/admin')) return false;
  return pathname !== '/login' && pathname !== '/register';
}

export default function App() {
  const sync = useSyncView();
  const firstSync = showFirstSyncScreen(sync);
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    // Prime the offline cache in the background. Fails silently when offline / API not ready.
    if (navigator.onLine) retrySync();
    // Retry when the connection comes back, so a failed sync does not wait for a reload.
    window.addEventListener('online', retrySync);
    return () => window.removeEventListener('online', retrySync);
  }, []);

  // A route change closes the sheet, so it never floats over a screen it did not open from.
  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const signedIn = auth.status === 'signed-in';

  return (
    <>
      <OfflineBanner />
      <AppHeader
        signedIn={signedIn}
        name={auth.user?.full_name}
        onOpenProfile={() => setProfileOpen(true)}
      />
      <SyncNotice onRetry={retrySync} />
      <main>
        {firstSync ? (
          <FirstSyncScreen progress={sync.progress} onContinue={dismissFirstSync} />
        ) : (
          <Suspense fallback={<p className="muted">Loading…</p>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/academics" element={<Academics />} />
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

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={auth.user}
        signedIn={signedIn}
        onSignOut={() => {
          auth.signOut();
          navigate('/');
        }}
      />
    </>
  );
}
