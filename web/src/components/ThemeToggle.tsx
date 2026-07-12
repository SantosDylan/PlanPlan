import { type FC, type KeyboardEvent, useRef } from 'react';
import { css } from '../../styled-system/css';
import { useColorTheme } from '../hooks/useColorTheme.js';
import type { ThemePreference } from '../lib/theme.js';

const OPTIONS: { value: ThemePreference; label: string; shortLabel: string; icon: string }[] = [
  { value: 'system', label: 'Thème système', shortLabel: 'Système', icon: '◐' },
  { value: 'light', label: 'Thème clair', shortLabel: 'Clair', icon: '☀' },
  { value: 'dark', label: 'Thème sombre', shortLabel: 'Sombre', icon: '☾' },
];

/**
 * Tri-state color-theme control (Système / Clair / Sombre) as an accessible
 * radiogroup: roving tabindex + arrow-key navigation, aria-checked on the active
 * option, and the active state carried by a filled background (not colour alone).
 */
export const ThemeToggle: FC = () => {
  const { preference, setPreference } = useColorTheme();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const moveTo = (index: number) => {
    const next = (index + OPTIONS.length) % OPTIONS.length;
    setPreference(OPTIONS[next]!.value);
    buttonsRef.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveTo(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveTo(index - 1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Thème de couleur"
      className={css({
        display: 'flex',
        gap: '0.5',
        p: '0.5',
        w: 'full',
        rounded: 'full',
        bg: 'accentSoft',
        border: '1px solid',
        borderColor: 'border',
      })}
    >
      {OPTIONS.map((option, index) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            tabIndex={active ? 0 : -1}
            onClick={() => setPreference(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={css({
              flex: '1',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5',
              h: '11',
              px: '2',
              rounded: 'full',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'xs',
              fontWeight: 'semibold',
              bg: active ? 'accent' : 'transparent',
              color: active ? 'accentText' : 'paperMuted',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            })}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span>{option.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
