import { useCallback, useState } from 'react';

export type CatalogView = 'grille' | 'agenda';

const CATALOG_VIEW_STORAGE_KEY = 'planplan-view';

function isCatalogView(value: unknown): value is CatalogView {
  return value === 'grille' || value === 'agenda';
}

/** Read the persisted view, falling back to 'grille' (default) on any storage failure. */
function readStoredView(): CatalogView {
  try {
    const stored = localStorage.getItem(CATALOG_VIEW_STORAGE_KEY);
    return isCatalogView(stored) ? stored : 'grille';
  } catch {
    return 'grille';
  }
}

/** Owns the Grille/Agenda toggle state and persists it — modeled on {@link readStoredPreference} in lib/theme.ts. */
export function useCatalogView(): { view: CatalogView; setView: (next: CatalogView) => void } {
  const [view, setViewState] = useState<CatalogView>(readStoredView);

  const setView = useCallback((next: CatalogView) => {
    setViewState(next);
    try {
      localStorage.setItem(CATALOG_VIEW_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode, quota): the in-memory view still
      // applies for this session; it just won't persist across reloads.
    }
  }, []);

  return { view, setView };
}
