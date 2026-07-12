import { useCallback, useEffect, useState } from 'react';
import { readStoredPreference, resolveTheme, THEME_STORAGE_KEY, type ThemePreference } from '../lib/theme.js';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function applyTheme(preference: ThemePreference): void {
  const osPrefersDark = window.matchMedia(DARK_QUERY).matches;
  const next = resolveTheme(preference, osPrefersDark);
  // Idempotent: setPreference applies immediately (no flash) and the effect
  // re-applies on mount/change; skip the write when nothing changed so we don't
  // trigger a redundant style recalc across every themed element.
  if (document.documentElement.dataset.theme === next) return;
  document.documentElement.dataset.theme = next;
}

/**
 * Owns the color-theme preference: persists it, applies `data-theme` on <html>,
 * and — while in 'system' mode — follows the OS setting live. The pre-paint
 * script in index.html has already set the initial `data-theme`; this hook keeps
 * it in sync once React mounts.
 */
export function useColorTheme(): { preference: ThemePreference; setPreference: (next: ThemePreference) => void } {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode, quota): the in-memory preference still
      // applies for this session; it just won't persist across reloads.
    }
    applyTheme(next);
  }, []);

  useEffect(() => {
    applyTheme(preference);
    if (preference !== 'system') return;
    const media = window.matchMedia(DARK_QUERY);
    const handler = () => applyTheme('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [preference]);

  return { preference, setPreference };
}
