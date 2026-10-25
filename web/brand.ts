// Build-time pieces that use the app name. Kept out of vite.config.ts so a test can import them.
// The name itself lives in src/appName.ts.
import { APP_DESCRIPTION, APP_NAME } from './src/appName';

export const manifest = {
  name: APP_NAME,
  short_name: APP_NAME,
  description: APP_DESCRIPTION,
  theme_color: '#0b6e4f',
  background_color: '#ffffff',
  display: 'standalone' as const,
  start_url: '/',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Fills the {{APP_NAME}} and {{APP_DESCRIPTION}} placeholders in index.html. */
export function fillAppName(html: string): string {
  return html
    .replaceAll('{{APP_NAME}}', escapeHtml(APP_NAME))
    .replaceAll('{{APP_DESCRIPTION}}', escapeHtml(APP_DESCRIPTION));
}
