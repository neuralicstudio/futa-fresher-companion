// Whether this phone has already seen the Welcome screen.
//
// Welcome is the first screen before anything is saved (docs/design/SCREENS.md, 1). It is not a
// permanent tab: once the student taps "Oya, make we start!" it never shows by itself again, and
// the app opens on Home.
const KEY = 'sabi-welcomed';

export function hasSeenWelcome(): boolean {
  try {
    return localStorage.getItem(KEY) === 'yes';
  } catch {
    // Storage can be blocked (private mode, for example). Showing Welcome on every visit would
    // trap the student in a loop, so treat an unreadable flag as "already seen".
    return true;
  }
}

export function markWelcomeSeen(): void {
  try {
    localStorage.setItem(KEY, 'yes');
  } catch {
    // Not stored: Welcome shows once more on the next visit. Nothing else depends on it.
  }
}
