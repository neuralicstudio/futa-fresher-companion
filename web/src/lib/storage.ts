// The browser's local storage, or undefined when the browser blocks it (private mode, a full
// disk, a policy). Callers fall back to a default instead of throwing.

export function browserLocalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
