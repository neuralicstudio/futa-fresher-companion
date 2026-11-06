import { useEffect, useState } from 'react';
import { COPY } from '../copy/pidgin';

// Every screen shows this strip when the phone has no connection, above its own top row
// (screenshot verify-offline-390). The phone's own flag is the only signal we trust here; the
// request layer turns a failed call into the same words on the screen itself.
export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return <div className="banner">{COPY.states.offlineBanner}</div>;
}
