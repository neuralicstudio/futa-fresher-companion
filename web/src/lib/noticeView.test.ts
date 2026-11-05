import { describe, expect, it } from 'vitest';
import { COPY } from '../copy/pidgin';
import { audienceFor, expiresText, paragraphs, postedLine } from './noticeView';

describe('postedLine', () => {
  it('shows the day the notice went out, in the design form', () => {
    expect(postedLine('2026-10-25T09:00:00+01:00')).toBe('Posted 25 Oct 2026');
  });

  it('shows nothing when the date cannot be read', () => {
    expect(postedLine('not a date')).toBeNull();
  });
});

describe('audienceFor', () => {
  it('says everyone for the two whole-campus scopes', () => {
    expect(audienceFor('university')).toBe('Everyone');
    expect(audienceFor('sug')).toBe('Everyone');
  });

  it('uses the student s own words for school and department', () => {
    expect(audienceFor('faculty')).toBe('My school');
    expect(audienceFor('department')).toBe('My department');
  });
});

describe('expiresText', () => {
  it('says there is no expiry when the field is empty', () => {
    expect(expiresText(null)).toBe(COPY.notice.noExpiry);
    expect(expiresText(undefined)).toBe(COPY.notice.noExpiry);
  });

  it('shows the last day the notice is up', () => {
    expect(expiresText('2026-11-20T23:59:00+01:00')).toBe('20 Nov 2026');
  });

  it('falls back to the words when the value is not a date', () => {
    expect(expiresText('soon')).toBe(COPY.notice.noExpiry);
  });
});

describe('paragraphs', () => {
  it('keeps one paragraph as one paragraph', () => {
    expect(paragraphs('Register on the portal.')).toEqual(['Register on the portal.']);
  });

  it('splits on a blank line, which is how an admin writes two paragraphs', () => {
    expect(paragraphs('First line.\n\nSecond line.')).toEqual(['First line.', 'Second line.']);
  });

  it('keeps a single newline inside a paragraph', () => {
    expect(paragraphs('One\ntwo')).toEqual(['One\ntwo']);
  });

  it('drops empty paragraphs and trims the rest', () => {
    expect(paragraphs('\n\n  One.  \n\n\n')).toEqual(['One.']);
  });

  it('gives nothing for an empty body', () => {
    expect(paragraphs('')).toEqual([]);
  });
});
