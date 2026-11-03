// Pure auth logic: form checks and friendly error text. No React or storage imports.
import { ApiError } from '../api/client';

// Same shape check as the server. Full email validation is not needed on the client.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const LEVEL_OPTIONS = [100, 200, 300, 400, 500, 600, 700] as const;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

function emailError(email: string): string | undefined {
  if (!email) return 'Enter your email address.';
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
  return undefined;
}

export function validateLogin(values: { email: string; password: string }): FieldErrors<'email' | 'password'> {
  const email = values.email.trim();
  const errors: FieldErrors<'email' | 'password'> = {};
  const emailProblem = emailError(email);
  if (emailProblem) errors.email = emailProblem;
  if (!values.password) errors.password = 'Enter your password.';
  return errors;
}

// Counts characters the way the server does (code points), so the limits match.
export function passwordLength(password: string): number {
  return Array.from(password).length;
}

/** The four-segment strength meter: 0 for an empty field, then 1 to 4. */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

/**
 * How strong a password looks, for the meter only. The server is the real judge: this never
 * blocks a sign-up. Any typed password is at least "weak" (one segment), so the meter never
 * shows nothing while the field has text.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (passwordLength(password) >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.max(1, Math.min(score, 4)) as PasswordStrength;
}

export function validateRegister(values: {
  fullName: string;
  email: string;
  password: string;
  matric: string;
}): FieldErrors<'fullName' | 'email' | 'password' | 'matric'> {
  const errors: FieldErrors<'fullName' | 'email' | 'password' | 'matric'> = {};
  if (values.fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name (at least 2 characters).';
  }
  const emailProblem = emailError(values.email.trim());
  if (emailProblem) errors.email = emailProblem;
  const length = passwordLength(values.password);
  if (length < 8) errors.password = 'Use at least 8 characters.';
  else if (length > 128) errors.password = 'Use no more than 128 characters.';
  if (values.matric.trim().length > 40) errors.matric = 'The matric number is too long.';
  return errors;
}

/**
 * Friendly text for a failed request. Uses the server's own message where it is generic.
 * Never says whether an account exists.
 */
export function friendlyError(error: unknown, online: boolean): string {
  if (!online) return "You appear to be offline. Connect to the internet and try again.";

  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
      case 409:
        return error.message;
      case 422:
        return 'Some details are not valid. Check the form and try again.';
      case 429:
        return 'Too many attempts. Wait a few minutes and try again.';
      case 503:
        return error.retryAfter
          ? `The service is busy right now. Try again in ${error.retryAfter} seconds.`
          : 'The service is busy right now. Try again shortly.';
      default:
        return 'Something went wrong. Try again.';
    }
  }

  // A request that never got an answer (network failure).
  return 'Could not reach the server. Check your connection and try again.';
}
