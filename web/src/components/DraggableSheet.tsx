import { motion, useDragControls } from 'framer-motion';
import type { ComponentPropsWithRef, FC, ReactNode } from 'react';
import { css, cx } from '#styled-system/css';

// Distance (px) / velocity (px/s) past which a downward drag release dismisses the sheet.
const DISMISS_THRESHOLD_PX = 80;
const DISMISS_VELOCITY = 500;

// Interactive while mounted; releases pointer events the instant it starts closing so the
// containing viewport (permanently pointerEvents: none) never blocks the page behind it.
const sheetBaseClass = css({ pointerEvents: 'auto' });

const handleClass = css({
  alignSelf: 'center',
  w: '9',
  h: '1',
  rounded: 'full',
  bg: 'borderStrong',
  mb: '1',
  touchAction: 'none',
  cursor: 'grab',
});

type DraggableSheetProps = { onClose: () => void; children?: ReactNode } & Omit<
  ComponentPropsWithRef<typeof motion.div>,
  'children'
>;

/**
 * Bottom-sheet surface shared by every mobile sheet in the app (the {@link Menu} primitive's
 * mobile view, {@link SubscribeDrawer}): slides up from the bottom on enter, and either slides
 * back down on exit or dismisses via the grab handle once dragged past threshold/flick velocity.
 * No opacity animation on the sheet itself — only the slide.
 */
export const DraggableSheet: FC<DraggableSheetProps> = ({ onClose, children, className, ...rest }) => {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={(_event, info) => {
        if (info.offset.y > DISMISS_THRESHOLD_PX || info.velocity.y > DISMISS_VELOCITY) onClose();
      }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%', pointerEvents: 'none' }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={cx(sheetBaseClass, className)}
      {...rest}
    >
      <span aria-hidden="true" className={handleClass} onPointerDown={(event) => dragControls.start(event)} />
      {children}
    </motion.div>
  );
};
