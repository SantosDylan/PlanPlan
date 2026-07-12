/**
 * Theme resolution — single source of truth, kept deliberately dependency-free
 * so both the React hook and the pre-paint inline script in index.html apply
 * the same logic. The inline script mirrors `resolveTheme` in vanilla JS because
 * it runs before the bundle loads and cannot import this module. Any change here
 * must be reflected there too.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'planplan-theme';

/** Resolve the applied theme from a stored preference and the OS setting. */
export function resolveTheme(preference: ThemePreference, osPrefersDark: boolean): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return osPrefersDark ? 'dark' : 'light';
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** Read the persisted preference, falling back to 'system' on any storage failure. */
export function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}
