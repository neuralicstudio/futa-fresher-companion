import { describe, expect, it } from 'vitest';
import type { UserRole } from '../api/types';
import { COPY } from './adminCopy';
import { cardScope, powerWord, publishPowers, roleHelp } from './roleView';

const CAN = COPY.role.can;

describe('what a role may publish to', () => {
  it('a super admin gets the university, any school and any department, all allowed', () => {
    expect(publishPowers('super_admin')).toEqual([
      { text: CAN.everyone, allowed: true },
      { text: CAN.anySchool, allowed: true },
      { text: CAN.anyDepartment, allowed: true },
    ]);
  });

  it('a school admin gets the school and its departments, but not everyone', () => {
    expect(publishPowers('faculty_admin')).toEqual([
      { text: CAN.departments, allowed: true },
      { text: CAN.school, allowed: true },
      { text: CAN.cannot, allowed: false },
    ]);
  });

  it('a department admin gets only their own department', () => {
    const powers = publishPowers('department_admin');
    expect(powers).toEqual([
      { text: CAN.department, allowed: true },
      { text: CAN.school, allowed: false },
      { text: CAN.cannot, allowed: false },
    ]);
  });

  it('a SUG account gets only its own announcements', () => {
    expect(publishPowers('sug')).toEqual([
      { text: CAN.sug, allowed: true },
      { text: CAN.school, allowed: false },
      { text: CAN.cannot, allowed: false },
    ]);
  });

  it('gives nothing to an account that may not publish at all', () => {
    for (const role of ['student', 'class_rep'] as UserRole[]) {
      expect(publishPowers(role)).toEqual([]);
    }
  });
});

describe('the words around the list', () => {
  it('says what the role is for, naming the real scope', () => {
    expect(roleHelp('Computer Science')).toBe(
      'You dey here to support Computer Science. Make we do am well!',
    );
  });

  it('still says something kind when the scope name is not on this device', () => {
    expect(roleHelp(null)).toBe('You dey here to support your people. Make we do am well!');
  });

  it('names the students for a SUG admin, who has no school or department', () => {
    expect(cardScope('sug', null)).toBe('FUTA students');
  });

  it('keeps the cached name when there is one', () => {
    expect(cardScope('department_admin', 'Computer Science')).toBe('Computer Science');
    expect(cardScope('super_admin', 'University')).toBe('University');
  });

  it('writes the answer at the end of each row', () => {
    expect(powerWord(true)).toBe('Allowed');
    expect(powerWord(false)).toBe('Not allowed');
  });
});
