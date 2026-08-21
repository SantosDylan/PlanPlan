import { useState, type FC, type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { css } from '#styled-system/css';
import type { SystemStyleObject } from '#styled-system/types';

// Snap points of a `peek` sheet: vaul reads numbers as a fraction of the viewport height and
// strings as px. The sheet opens at the first point and expands to the last one on drag-up.
const PEEK_SNAP_POINTS = [0.62, 1];
const PEEK_SNAP = PEEK_SNAP_POINTS[0]!;
const EXPANDED_SNAP = PEEK_SNAP_POINTS[PEEK_SNAP_POINTS.length - 1]!;

const overlayBase: SystemStyleObject = { position: 'fixed', inset: '0', zIndex: '40', bg: 'scrim' };

// vaul only dims a snap-point sheet at *one* chosen snap point (`fadeFromIndex`), so a `peek`
// sheet — which opens on another one — would show no scrim at all. Force it on for as long as
// the sheet is open: `!important` is the only lever that outranks both vaul's unlayered CSS and
// the inline opacity it writes while dragging. Scoped to `[data-state=open]` so it steps aside
// for the closing fade-out.
// `scrimIn` fades the colour rather than the opacity, which is spoken for.
const peekOverlayCss: SystemStyleObject = {
  '&[data-state=open]': {
    opacity: '1!',
    animation: 'scrimIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
    _motionReduce: { animation: 'none' },
  },
};

const contentBase: SystemStyleObject = {
  position: 'fixed',
  bottom: '0',
  left: '0',
  right: '0',
  zIndex: '41',
  mx: 'auto',
  w: 'full',
  maxW: '480px',
  display: 'flex',
  flexDir: 'column',
  bg: 'surfaceSheet',
  roundedTop: 'sheet',
  outline: 'none',
  // No `overflow: hidden` here: vaul paints a 200%-tall `::after` below the sheet (inheriting
  // this background) so an over-drag never uncovers the page behind it. Clipping kills it.
};

// vaul ships its own *unlayered* stylesheet for `[data-vaul-handle]` — a grey pill with a
// 44px invisible hit area. Unlayered rules beat Panda's `@layer utilities`, so recolouring it
// with a theme token needs `!`. The margins don't collide, so they stay layered.
const handleClass = css({ mt: '3', mb: '2', bg: 'borderStrong!' });

const titleClass = css({ fontSize: 'md', fontWeight: 'bold', m: '0' });

const bodyBase: SystemStyleObject = {
  flex: '1',
  minH: '0',
  display: 'flex',
  flexDir: 'column',
  gap: '4',
  px: '5',
  pb: 'calc(env(safe-area-inset-bottom) + token(spacing.5))',
  // Never chain a scroll that reached its end to whatever is behind the sheet.
  overscrollBehavior: 'contain',
};

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Heading of the sheet, and the dialog's accessible name. */
  title: string;
  /**
   * Open at a partial height, expandable to (almost) full screen by dragging up or tapping the
   * handle. The body only scrolls once expanded, so a drag at peek height always moves the sheet.
   */
  peek?: boolean;
  /** Merged over the body's own layout styles — mostly to retune `px` / `gap`. */
  bodyCss?: SystemStyleObject;
  children: ReactNode;
};

/**
 * The app's bottom sheet, on top of [vaul](https://vaul.emilkowal.ski) (itself a Radix Dialog).
 *
 * vaul owns the parts that are miserable to hand-roll: dragging from anywhere on the surface,
 * arbitrating that drag against a scrolled body (`scrollTop !== 0` scrolls, top-of-list drags),
 * velocity dismissal, and iOS Safari scroll locking. Radix owns focus trapping, `Escape`,
 * outside-press and focus restoration to the trigger — so no hand-rolled focus trap is needed.
 *
 * Mount it unconditionally and drive it with `open`: the exit animation needs the sheet to
 * outlive its own closing.
 */
export const Sheet: FC<SheetProps> = ({ open, onOpenChange, title, peek = false, bodyCss, children }) => {
  const [snap, setSnap] = useState<number | string | null>(PEEK_SNAP);
  const scrollable = !peek || snap === EXPANDED_SNAP;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      autoFocus
      snapPoints={peek ? PEEK_SNAP_POINTS : undefined}
      activeSnapPoint={peek ? snap : undefined}
      setActiveSnapPoint={peek ? setSnap : undefined}
      // Reopen at peek height rather than wherever the last drag left it.
      onAnimationEnd={(isOpen) => {
        if (!isOpen) setSnap(PEEK_SNAP);
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className={css(overlayBase, peek && peekOverlayCss)} />
        <Drawer.Content className={css(contentBase, peek ? { h: '96dvh' } : { maxH: '90dvh' })}>
          {/* A handle tap cycles snap points, and closes from the last one. Without snap points
              vaul makes it a no-op (it only closes when `dismissible` is false), so wire the
              obvious gesture back up ourselves — `rest` is spread last, so this wins. */}
          <Drawer.Handle className={handleClass} {...(peek ? {} : { onClick: () => onOpenChange(false) })} />
          <div className={css(bodyBase, { overflowY: scrollable ? 'auto' : 'hidden' }, bodyCss)}>
            <Drawer.Title className={titleClass}>{title}</Drawer.Title>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
