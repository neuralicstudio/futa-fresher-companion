import { describe, expect, it } from 'vitest';
import indexHtml from './index.html?raw';
import { fillAppName, manifest } from './brand';
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from './src/appName';

describe('the install manifest', () => {
  it('takes its name, short name and description from src/appName.ts', () => {
    expect(manifest.name).toBe(APP_NAME);
    expect(manifest.short_name).toBe(APP_NAME);
    expect(manifest.description).toBe(APP_DESCRIPTION);
  });
});

describe('index.html', () => {
  it('has placeholders instead of the name, so a rename stays a one-file change', () => {
    expect(indexHtml).toContain('<title>{{APP_NAME}}</title>');
    expect(indexHtml).toContain('<meta name="description" content="{{APP_DESCRIPTION}}" />');
  });

  it('gets the title and meta description from src/appName.ts when built', () => {
    const html = fillAppName(indexHtml);

    expect(html).toContain(`<title>${APP_NAME}</title>`);
    expect(html).toContain(`<meta name="description" content="${APP_DESCRIPTION}" />`);
    expect(html).not.toContain('{{');
  });
});

describe('the app name constants', () => {
  it('are set', () => {
    expect(APP_NAME).toBe('Sabi');
    expect(APP_TAGLINE).toBe('Your FUTA guide');
    expect(APP_DESCRIPTION.length).toBeGreaterThan(0);
  });
});
