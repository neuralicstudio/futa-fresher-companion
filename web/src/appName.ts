// The app's name, in ONE place. Everything a student sees reads from here: the page title,
// the home screen, the first-sync screen, the install name and the search description.
// To rename the app, change this file only (see brand.ts and appName.test.ts).
//
// Not renamed on purpose, because changing them would break saved data or caches on students'
// phones: the Dexie database name, localStorage keys, service worker cache names, the repo and
// package name, and API paths.
export const APP_NAME = 'Sabi';
export const APP_TAGLINE = 'Your FUTA guide';
// Used for the install manifest and the page's meta description.
export const APP_DESCRIPTION = 'Navigate FUTA, find the right people and places, get the info you need.';
