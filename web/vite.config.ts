import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fillAppName, manifest } from './brand';
import { isAnnouncementsRequest, isCacheablePublicApi } from './sw-matchers';

export default defineConfig({
  plugins: [
    react(),
    // Puts the app name from src/appName.ts into index.html.
    { name: 'app-name-in-html', transformIndexHtml: fillAppName },
    VitePWA({
      registerType: 'autoUpdate',
      manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Announcements: freshness matters most, fall back to cache when offline/slow.
            // The matchers come from sw-matchers.ts: Workbox copies them as text (see that file).
            urlPattern: isAnnouncementsRequest,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-announcements',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Everything else public (departments, lecturers, buildings...): show cache, refresh quietly.
            urlPattern: isCacheablePublicApi,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-reference',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // TODO (Maps/GIS): add a CacheFirst rule for map tiles limited to the FUTA area.
        ],
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:8000' },
  },
});