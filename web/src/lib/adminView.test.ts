import { describe, expect, it } from 'vitest';
import { COPY, fill } from './adminCopy';
import { roleLine, scopeName } from './adminView';

const faculties = [
  { id: 'f1', name: 'Engineering' },
  { id: 'f2', name: 'Science' },
];
const departments = [
  { id: 'd1', name: 'Computer Science' },
  { id: 'd2', name: 'Biology' },
];

describe('scopeName', () => {
  it('is the department of a department admin', () => {
    const user = { role: 'department_admin', faculty_id: null, department_id: 'd2' } as const;
    expect(scopeName(user, faculties, departments)).toBe('Biology');
  });

  it('is the faculty of a faculty admin', () => {
    const user = { role: 'faculty_admin', faculty_id: 'f1', department_id: null } as const;
    expect(scopeName(user, faculties, departments)).toBe('Engineering');
  });

  it('is the university for a super admin, and nothing for SUG', () => {
    const base = { faculty_id: null, department_id: null };
    expect(scopeName({ role: 'super_admin', ...base }, [], [])).toBe('University');
    expect(scopeName({ role: 'sug', ...base }, faculties, departments)).toBeNull();
  });

  it('is nothing when the name is not on this device', () => {
    const user = { role: 'department_admin', faculty_id: null, department_id: 'zzz' } as const;
    expect(scopeName(user, faculties, departments)).toBeNull();
    expect(scopeName(user, [], [])).toBeNull();
  });
});

describe('roleLine', () => {
  it('joins the role and the scope', () => {
    expect(roleLine('department_admin', 'Computer Science')).toBe(
      'Department admin, Computer Science',
    );
  });

  it('is just the role without a scope', () => {
    expect(roleLine('sug', null)).toBe('SUG');
  });
});

describe('the strings', () => {
  it('fill the markers, and leave an unknown one as it is', () => {
    expect(fill('Added {date}', { date: '5 Jan 2026' })).toBe('Added 5 Jan 2026');
    expect(fill('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });

  it('have no empty string and no marker without a word', () => {
    const all: string[] = [];
    const walk = (value: unknown) => {
      if (typeof value === 'string') all.push(value);
      else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    walk(COPY);

    expect(all.length).toBeGreaterThan(60);
    for (const text of all) {
      expect(text.trim()).not.toBe('');
      expect(text).not.toMatch(/\{\}|undefined|\[object/);
    }
  });

  it('keep the wording of docs/design/COPY.md for the screens that exist there', () => {
    expect(COPY.verify.title).toBe('Verify Data');
    expect(COPY.verify.emptyTitle).toBe('Nothing to verify');
    expect(COPY.verify.needSource).toBe('Add the source you check before you mark am verified.');
    expect(COPY.gate.notAdminTitle).toBe('Admins only o');
    expect(COPY.gate.loginTitle).toBe('Log in to continue');
    expect(COPY.admin.title).toBe('Admin centre');
  });
});
