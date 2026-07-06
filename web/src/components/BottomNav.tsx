import type { FC } from 'react';
import { NavLink } from 'react-router';
import { css } from '../../styled-system/css';
import { useMovieSelectionContext } from '../context/MovieSelectionContext.js';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  css({
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5',
    py: '2.5',
    rounded: 'full',
    fontSize: 'sm',
    fontWeight: 'semibold',
    bg: isActive ? 'accent' : 'transparent',
    color: isActive ? 'accentText' : 'paperMuted',
    textDecoration: 'none',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  });

export const BottomNav: FC = () => {
  const { selectedIds } = useMovieSelectionContext();

  return (
    <nav
      className={css({
        position: 'fixed',
        bottom: '4',
        left: '50%',
        transform: 'translateX(-50%)',
        w: 'calc(100% - 32px)',
        maxW: '360px',
        display: 'flex',
        gap: '1',
        p: '1',
        rounded: 'full',
        bg: 'rgba(26, 22, 19, 0.75)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid',
        borderColor: 'borderStrong',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        zIndex: '30',
        hideFrom: 'md',
      })}
    >
      <NavLink to="/" end className={tabClass}>
        Catalogue
      </NavLink>
      <NavLink to="/gerer" className={tabClass}>
        {({ isActive }) => (
          <>
            Gérer
            {selectedIds.size > 0 && (
              <span
                className={css({
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minW: '4.5',
                  h: '4.5',
                  px: '1',
                  rounded: 'full',
                  fontSize: '2xs',
                  fontWeight: 'bold',
                  bg: isActive ? 'accentText' : 'accent',
                  color: isActive ? 'accent' : 'accentText',
                })}
              >
                {selectedIds.size}
              </span>
            )}
          </>
        )}
      </NavLink>
    </nav>
  );
};
