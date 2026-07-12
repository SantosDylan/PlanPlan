import { useRef, type FC } from 'react';
import { css } from '../../styled-system/css';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap.js';
import { ThemeToggle } from './ThemeToggle.js';

type OptionsDrawerProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export const OptionsDrawer: FC<OptionsDrawerProps> = ({ open, onClose, triggerRef }) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useModalFocusTrap({ open, onClose, containerRef: sheetRef, triggerRef });

  if (!open) return null;

  return (
    <div
      className={css({ position: 'fixed', inset: '0', zIndex: '40', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' })}
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className={css({ position: 'absolute', inset: '0', bg: 'rgba(10, 8, 6, 0.62)' })}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="options-drawer-title"
        className={css({
          position: 'relative',
          w: 'full',
          maxW: '480px',
          bg: 'surfaceSheet',
          rounded: '18px 18px 0 0',
          px: '5',
          py: '5',
          display: 'flex',
          flexDir: 'column',
          gap: '4',
          boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
        })}
      >
        <span aria-hidden="true" className={css({ alignSelf: 'center', w: '9', h: '1', rounded: 'full', bg: 'borderStrong' })} />

        <h2 id="options-drawer-title" className={css({ fontSize: 'md', fontWeight: 'bold', m: '0' })}>
          Apparence
        </h2>

        <ThemeToggle />

        <button
          type="button"
          onClick={onClose}
          className={css({ textAlign: 'center', fontSize: 'xs', color: 'paperFaint', bg: 'transparent', border: 'none', cursor: 'pointer' })}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
