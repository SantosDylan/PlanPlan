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
  transition: 'transform 0.15s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.15s ease',
  _active: { transform: 'scale(0.88)', opacity: '0.65' },
  _motionReduce: { transition: 'none' },
});

type IconButtonProps = ComponentPropsWithRef<'button'>;

/** Minimal, borderless icon-only button with a subtle press feedback (scale + opacity dip). */
export const IconButton: FC<IconButtonProps> = ({ className, ...props }) => (
  <button type="button" className={cx(iconButtonClass, className)} {...props} />
);
