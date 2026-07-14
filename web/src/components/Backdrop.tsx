import { motion } from 'framer-motion';
import type { FC } from 'react';
import { css } from '../../styled-system/css';

const backdropClass = css({
  position: 'absolute',
  inset: '0',
  bg: 'scrim',
  pointerEvents: 'auto',
});

type BackdropProps = { onClick?: () => void };

/**
 * Full-bleed dimming layer behind a bottom sheet or popover. Fades in/out with
 * the sheet, and releases pointer events the instant it starts closing.
 */
export const Backdrop: FC<BackdropProps> = ({ onClick }) => (
  <motion.div
    aria-hidden="true"
    onClick={onClick}
    className={backdropClass}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, pointerEvents: 'none' }}
  />
);
