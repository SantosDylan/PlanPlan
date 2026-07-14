import { useSyncExternalStore } from 'react';

// Mirrors Panda's `md` breakpoint (768px) so the responsive <Menu> switches
// between an anchored popover (desktop) and a bottom-sheet (mobile) at the same
// point the rest of the layout does (e.g. BottomNav's `hideFrom: 'md'`).
const DESKTOP_QUERY = '(min-width: 768px)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** `true` at ≥768px. Mobile-first: assumes non-desktop before hydration/SSR. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}
