import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Announcement } from '../api/types';

// The offline cache is replaced with a fixed answer, as in Admin.test.tsx.
vi.mock('../lib/offline', () => ({ readComposerChoices: async () => ({}) }));
vi.mock('../lib/useCachedRows', () => ({
  useCachedRows: () => ({
    result: { state: 'ready', value: { faculties: [], departments: [] } },
    retry: () => {},
    progress: {},
  }),
}));

import ManageAnnouncements, { EditForm, ItemActions } from './ManageAnnouncements';
import { NO_OVERLAY } from '../lib/manageView';

const item: Announcement = {
  id: 'a1',
  title: 'Registration opens',
  body: 'Register on the portal.',
  scope: 'sug',
  author_id: 'x',
  published_at: '2026-10-01T10:00:00Z',
  expires_at: '2099-01-01T09:00:00Z',
  verification: { status: 'unverified' },
  updated_at: '2026-10-01T10:00:00Z',
};

const noop = () => {};
function actions(mode: 'delete' | null, busy = false) {
  return renderToStaticMarkup(
    <ItemActions
      mode={mode}
      busy={busy}
      onEdit={noop}
      onAskDelete={noop}
      onConfirmDelete={noop}
      onCancel={noop}
    />,
  );
}

describe('the delete confirmation', () => {
  it('first shows Edit and Delete, with no confirmation yet', () => {
    const html = actions(null);

    expect(html).toContain('>Edit<');
    expect(html).toContain('>Delete<');
    expect(html).not.toContain('Students will stop seeing it');
    expect(html).not.toContain('Yes, delete');
  });

  it('asks before deleting, and offers cancel', () => {
    const html = actions('delete');

    expect(html).toContain('Delete this announcement? Students will stop seeing it.');
    expect(html).toContain('>Yes, delete<');
    expect(html).toContain('>Cancel<');
    expect(html).not.toContain('>Edit<');
  });

  it('disables every button while a request is in flight', () => {
    for (const mode of [null, 'delete'] as const) {
      const buttons = actions(mode, true).match(/<button[^>]*>/g) ?? [];

      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons.every((tag) => tag.includes('disabled'))).toBe(true);
    }
  });
});

describe('the edit form', () => {
  function form(busy = false, error: string | null = null, announcement = item) {
    return renderToStaticMarkup(
      <EditForm item={announcement} busy={busy} error={error} onSave={noop} onCancel={noop} />,
    );
  }

  it('starts with the current title, text and expiry, and the composer limits', () => {
    const html = form();

    expect(html).toContain('value="Registration opens"');
    expect(html).toContain('Register on the portal.');
    expect(html).toContain('18 / 200 characters');
    expect(html).toContain('23 / 4000 characters');
    expect(html).toContain('type="datetime-local"');
  });

  it('has no scope or target fields: those cannot be changed', () => {
    const html = form();

    expect(html).not.toContain('<select');
    expect(html).not.toContain('Who is it for');
  });

  it('offers to remove an expiry only when there is one', () => {
    expect(form()).toContain('Remove expiry');
    expect(form(false, null, { ...item, expires_at: null })).not.toContain('Remove expiry');
  });

  it('disables Save and Cancel while saving', () => {
    const html = form(true);

    expect(html).toMatch(/<button type="submit" disabled/);
    expect(html).toContain('Saving…');
  });

  it('shows a request error as an alert', () => {
    const html = form(false, 'You cannot change this announcement.');

    expect(html).toContain('role="alert"');
    expect(html).toContain('You cannot change this announcement.');
  });
});

describe('the list before it has loaded', () => {
  it('shows a heading and a loading line, and no buttons', () => {
    const html = renderToStaticMarkup(
      <ManageAnnouncements
        user={{ id: 'u', full_name: 'A', email: 'a@b.co', role: 'super_admin' }}
        overlay={NO_OVERLAY}
        onOverlay={noop}
        refreshKey={0}
      />,
    );

    expect(html).toContain('Your announcements');
    expect(html).toContain('Loading your announcements');
    expect(html).not.toContain('>Edit<');
  });
});
