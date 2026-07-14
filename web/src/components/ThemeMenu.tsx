import { CircleHalfIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import type { FC } from 'react';
import { Menu, MenuItem } from './Menu.js';
import { IconButton } from './IconButton.js';
import { useColorTheme } from '#src/hooks/useColorTheme.js';
import type { ThemePreference } from '#src/lib/theme.js';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof CircleHalfIcon }[] = [
  { value: 'system', label: 'Thème système', Icon: CircleHalfIcon },
  { value: 'light', label: 'Thème clair', Icon: SunIcon },
  { value: 'dark', label: 'Thème sombre', Icon: MoonIcon },
];

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
        <IconButton {...props}>
          <CircleHalfIcon size={20} />
        </IconButton>
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <MenuItem key={value} selected={preference === value} onSelect={() => setPreference(value)}>
          <Icon size={18} aria-hidden="true" />
          <span>{label}</span>
        </MenuItem>
      ))}
    </Menu>
  );
};
