import type { FC } from 'react';
import { css } from '../../styled-system/css';
import { Menu, MenuItem } from './Menu.js';
import { useColorTheme } from '../hooks/useColorTheme.js';
import type { ThemePreference } from '../lib/theme.js';

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'Thème système', icon: '◐' },
  { value: 'light', label: 'Thème clair', icon: '☀' },
  { value: 'dark', label: 'Thème sombre', icon: '☾' },
];

const triggerClass = css({
  w: '9',
  h: '9',
  rounded: 'full',
  bg: 'accentSoft',
  border: '1px solid',
  borderColor: 'accentBorder',
  color: 'accent',
  fontSize: 'md',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

/**
 * Color-theme picker (Système / Clair / Sombre) built on the responsive {@link Menu}
 * primitive — an anchored popover on desktop, a bottom-sheet on mobile.
 */
export const ThemeMenu: FC = () => {
  const { preference, setPreference } = useColorTheme();

  return (
    <Menu
      label="Apparence"
      title="Apparence"
      trigger={(props) => (
        <button type="button" className={triggerClass} {...props}>
          ◐
        </button>
      )}
    >
      {OPTIONS.map((option) => (
        <MenuItem
          key={option.value}
          selected={preference === option.value}
          onSelect={() => setPreference(option.value)}
        >
          <span aria-hidden="true">{option.icon}</span>
          <span>{option.label}</span>
        </MenuItem>
      ))}
    </Menu>
  );
};
