import { motion } from 'framer-motion';
import type { ComponentPropsWithRef, FC } from 'react';
import { css, cx } from '#styled-system/css';

const iconButtonClass = css({
  w: '8',
  h: '8',
  rounded: 'full',
  bg: 'transparent',
  border: 'none',
  color: 'paper',
  fontSize: 'md',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent',
});

type IconButtonProps = ComponentPropsWithRef<typeof motion.button>;

/** Minimal, borderless icon-only button with a subtle press feedback (scale + opacity dip). */
export const IconButton: FC<IconButtonProps> = ({ className, ...props }) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.88, opacity: 0.65 }}
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    className={cx(iconButtonClass, className)}
    {...props}
  />
);
