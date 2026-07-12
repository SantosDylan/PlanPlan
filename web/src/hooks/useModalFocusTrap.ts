import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = 'button, a[href], input, [tabindex]:not([tabindex="-1"])';

type UseModalFocusTrapOptions = {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
};

/** Traps Tab focus inside an open modal/sheet, closes on Escape, and restores focus to the trigger on close. */
export function useModalFocusTrap({ open, onClose, containerRef, triggerRef }: UseModalFocusTrapOptions): void {
  useEffect(() => {
    if (!open) return;

    const container = containerRef.current;
    const firstFocusable = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !container) return;

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [open, onClose, containerRef, triggerRef]);
}
