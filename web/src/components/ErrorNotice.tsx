import type { FC } from 'react';
import { css } from '../../styled-system/css';

/** Fetch-error banner: danger colour + alert icon so it reads as an error even next to accent-red controls. */
export const ErrorNotice: FC<{ message: string }> = ({ message }) => (
  <p
    role="alert"
    className={css({
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      color: 'danger',
      bg: 'dangerSoft',
      rounded: 'lg',
      px: '3',
      py: '2.5',
      m: '0',
    })}
  >
    <span aria-hidden="true">⚠️</span>
    Impossible de charger la programmation : {message}
  </p>
);
