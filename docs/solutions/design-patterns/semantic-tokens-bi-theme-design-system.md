---
title: "Bi-theme design system with semantic tokens and pre-paint script"
date: 2026-07-12
category: design-patterns
module: web
problem_type: design_pattern
component: frontend_stimulus
severity: high
applies_when:
  - "Implementing light and dark themes with OS preference detection"
  - "Avoiding flash of unstyled content (FOUC) during theme initialization"
  - "Building composable, maintainable token systems in CSS-in-JS"
  - "Supporting theme persistence across page reloads"
tags:
  - panda-css
  - semantic-tokens
  - theme-switching
  - bi-theme
  - design-system
  - accessibility
---

# Bi-theme Design System with Semantic Tokens and Pre-Paint Script

## Context

Building a multi-theme UI requires coordination across several layers: design tokens that shift between themes, runtime JS that reads preferences and applies themes, and CSS that respects data-driven theme switches. A naive approach causes a visible flash when the page loads—CSS renders in one theme, then JS switches it, causing a jarring layout shift. Additionally, hardcoded color values scattered across components make theme maintenance fragile: a new theme requires edits in dozens of places. Maintaining two separate token sets (light and dark) that drift over time is a common source of visual inconsistency.

## Guidance

### Architecture: Semantic Tokens with Condition Overrides

Define a **single token source of truth** that maps to both light and dark variants via Panda CSS semantic tokens. Structure tokens as:

```typescript
// panda.config.ts
export default defineConfig({
  semanticTokens: {
    colors: {
      // Each token: {base: light value, _dark: dark value}
      accent: { value: { base: '#A11220', _dark: '#C41E3A' } },
      accentSoft: { value: { base: '#F7E9E8', _dark: '#4A1215' } },
      paper: { value: { base: '#F7F2E8', _dark: '#0A0806' } },
      ink: { value: { base: '#0A0806', _dark: '#F7F2E8' } },
      // ... all semantic tokens follow this pattern
    },
  },
  conditions: {
    extend: {
      dark: '[data-theme=dark] &',
    },
  },
});
```

**Why this structure:**
- A single token object with `base` and `_dark` variants ensures both themes are defined together — they can't drift.
- The custom condition `[data-theme=dark] &` uses a data attribute (not `prefers-color-scheme` media query) so JS can **override OS preference** when the user explicitly picks a theme.
- Generators (like `css()` in Panda) automatically wire both variants; no manual theme-switching logic in component classes.

### Initialize Theme Before First Paint

Add an **inline script in the HTML `<head>`** (before CSS and bundle load) that applies the user's theme synchronously:

```html
<!-- web/index.html -->
<head>
  <script>
    // Mirrors resolveTheme logic from web/src/lib/theme.ts
    // Must run before CSS and React mount to prevent FOUC.
    (function() {
      const STORAGE_KEY = 'planplan-theme';
      const DARK_QUERY = '(prefers-color-scheme: dark)';
      
      function resolveTheme(preference, osPrefersDark) {
        if (preference === 'light' || preference === 'dark') return preference;
        return osPrefersDark ? 'dark' : 'light';
      }
      
      const stored = localStorage.getItem(STORAGE_KEY);
      const preference = stored === 'system' || stored === 'light' || stored === 'dark' ? stored : 'system';
      const osPrefersDark = window.matchMedia(DARK_QUERY).matches;
      const theme = resolveTheme(preference, osPrefersDark);
      
      document.documentElement.dataset.theme = theme;
    })();
  </script>
  <!-- CSS and bundle load after script; theme is already applied -->
</head>
```

**Critical invariant:** The inline script **mirrors the React hook's logic** (see below). Any change to `resolveTheme()` must be reflected in both places, or preference resolution will diverge between initial paint and React mount.

### Manage Theme State in React

Keep theme preference and application in a dedicated hook:

```typescript
// web/src/lib/theme.ts — Dependency-free so both inline script and React can use it
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export function resolveTheme(preference: ThemePreference, osPrefersDark: boolean): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return osPrefersDark ? 'dark' : 'light';
}

// web/src/hooks/useColorTheme.ts
export function useColorTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  
  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Unavailable in private mode; session-only fallback is acceptable
    }
    applyTheme(next);
  }, []);
  
  useEffect(() => {
    applyTheme(preference);
    if (preference !== 'system') return;
    // Listen for OS theme changes when in 'system' mode
    const media = window.matchMedia(DARK_QUERY);
    const handler = () => applyTheme('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [preference]);
  
  return { preference, setPreference };
}

function applyTheme(preference: ThemePreference): void {
  const osPrefersDark = window.matchMedia(DARK_QUERY).matches;
  const next = resolveTheme(preference, osPrefersDark);
  if (document.documentElement.dataset.theme === next) return; // Idempotent
  document.documentElement.dataset.theme = next;
}
```

**Key design decisions:**
- `applyTheme()` is idempotent: it checks the current theme before writing, so re-renders don't trigger redundant style recalculations.
- The hook listens to OS changes **only when preference is 'system'**, avoiding unnecessary media-query listeners.
- `localStorage` errors are caught (private mode, quota) and sessions fall back to in-memory preference.

### Extraction Pattern: Reusable Focus Trap

When the same modal pattern (focus cycling, Escape to close, focus restoration) appears in multiple components, extract it as a hook to avoid duplication and ensure consistency:

```typescript
// web/src/hooks/useModalFocusTrap.ts
export function useModalFocusTrap({
  open,
  onClose,
  containerRef,
  triggerRef,
}: UseModalFocusTrapOptions): void {
  useEffect(() => {
    if (!open) return;
    
    // Focus the first focusable element when opened
    const container = containerRef.current;
    const focusable = Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
    focusable[0]?.focus();
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !container) return;
      
      // Cycle Tab/Shift+Tab focus within the container
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus(); // Restore focus to trigger
    };
  }, [open, onClose, containerRef, triggerRef]);
}
```

**Usage:**
```typescript
// In a Modal or Drawer component
const sheetRef = useRef<HTMLDivElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);

useModalFocusTrap({ open, onClose, containerRef: sheetRef, triggerRef });
```

## Why This Matters

**FOUC prevention:** The pre-paint script ensures the correct theme applies before CSS is parsed. Users on slow networks or with large bundles see no theme flicker; the initial render matches their preference immediately.

**Single source of truth:** Semantic tokens defined once eliminate drift between themes. Adding a new color variant requires one edit, not two parallel edits that can diverge.

**User control + OS respect:** The preference hierarchy (explicit choice > OS setting) gives users agency while respecting their system settings when they haven't chosen. Persisting preferences across sessions is expected; forgetting on every reload feels broken.

**Maintainability:** Extracted reusable patterns (like `useModalFocusTrap`) reduce cognitive load and catch bugs once rather than per-implementation. A single fix to focus cycling benefits every modal in the codebase.

**Accessibility:** Respecting `prefers-color-scheme` and supporting explicit theme selection means users with visual sensitivities or accessibility needs can read your UI comfortably. Focus management in modals is a WCAG requirement.

## When to Apply

- **Bi-theme or multi-theme UI** — light and dark modes, or brand variations (e.g., cinema theme + corporate theme).
- **User theme preference should persist** — explicit "dark mode" choice saved across sessions.
- **OS preference detection is desired** — respect `prefers-color-scheme` when the user hasn't made an explicit choice.
- **CSS-in-JS with atomic or semantic tokens** — Panda CSS, Tailwind, styled-components, vanilla CSS custom properties.
- **Modal or overlay patterns** — `useModalFocusTrap` applies to any dialog, sheet, or popover that should trap focus and respect Escape.

**Do NOT use when:**
- A single theme is sufficient and never changing.
- Theme preference doesn't need persistence across sessions (e.g., a one-off demo).
- CSS media queries alone (`@media (prefers-color-scheme: dark)`) are sufficient — no runtime override needed.

## Examples

### Cinema-Themed Bi-Theme (from this learning)

**Light theme: "Velours & tapis rouge"** (velvet and red carpet)
- Accent: `#A11220` (cramoisi red)
- Paper: `#F7F2E8` (cream)
- Ink: `#0A0806` (near-black)

**Dark theme: Doré** (golden)
- Accent: `#C41E3A` (warm red)
- Paper: `#0A0806` (near-black)
- Ink: `#F7F2E8` (cream)

Both themes use the same **semantic token structure** — only the color values differ. A component using `color: 'accent'` automatically gets the right red in both themes; no conditional rendering needed.

### Theme Switch Modal

```typescript
export const OptionsDrawer: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { preference, setPreference } = useColorTheme();
  
  useModalFocusTrap({ open, onClose, containerRef: sheetRef, triggerRef });
  
  if (!open) return null;
  
  return (
    <div role="dialog" aria-modal="true" ref={sheetRef}>
      <h2>Apparence</h2>
      {['system', 'light', 'dark'].map((theme) => (
        <label key={theme}>
          <input
            type="radio"
            name="theme"
            value={theme}
            checked={preference === theme}
            onChange={(e) => setPreference(e.target.value as ThemePreference)}
          />
          {theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}
        </label>
      ))}
      <button onClick={onClose}>Close</button>
    </div>
  );
};
```

The user's choice is persisted, the modal traps focus, and Escape closes it — all coordinated.

## Related

- Panda CSS semantic tokens documentation
- WCAG 2.1 Level AA: Focus management in modals and dialogs
- `prefers-color-scheme` media query (MDN)
- localStorage scope and quota considerations
