// How many saved notices this phone has not shown yet, for the gold dot on the Notices tab.
//
// The cache (Dexie) is loaded on demand, so this reads it after mount instead of pulling it into
// the first load. It counts again when a sync lands and when the Notices screen marks what it
// has drawn, so the dot disappears the moment the student has seen the list.
import { useEffect, useState } from 'react';
import { announcementsForDisplay } from './announcementsView';
import { SEEN_EVENT, loadSeenIds, unreadIds } from './noticesSeen';
import { useSyncView } from './syncStatus';

export function useUnreadNotices(): number {
  const { progress } = useSyncView();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    const read = () => {
      import('./offline')
        .then((module) => module.readAnnouncementsScreen())
        .then(({ announcements }) => {
          if (!active) return;
          const shown = announcementsForDisplay(announcements, Date.now());
          setCount(unreadIds(shown, loadSeenIds()).size);
        })
        .catch(() => {
          // No cache yet, or a blocked one: no dot is the honest answer.
        });
    };

    read();
    window.addEventListener(SEEN_EVENT, read);
    window.addEventListener('online', read);
    return () => {
      active = false;
      window.removeEventListener(SEEN_EVENT, read);
      window.removeEventListener('online', read);
    };
  }, [progress.running, progress.pages]);

  return count;
}
