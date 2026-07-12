import { useEffect, useRef, useState, type FC } from 'react';
import { Link } from 'react-router';
import type { Cinema } from '../../../ingest/src/types.js';
import { css } from '../../styled-system/css';
import { cinemaFeedUrls } from '../lib/calendar.js';
import { useToast } from '../context/ToastContext.js';

const FOCUSABLE_SELECTOR = 'button, a[href], input, [tabindex]:not([tabindex="-1"])';

type SubscribeDrawerProps = {
  cinemas: Cinema[];
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export const SubscribeDrawer: FC<SubscribeDrawerProps> = ({ cinemas, open, onClose, triggerRef }) => {
  const { showToast } = useToast();
  const [copiedCinemaId, setCopiedCinemaId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const sheet = sheetRef.current;
    const firstFocusable = sheet?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !sheet) return;

      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
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
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  const handleCopy = async (cinema: Cinema, https: string) => {
    try {
      await navigator.clipboard.writeText(https);
      setCopiedCinemaId(cinema.id);
      setTimeout(() => setCopiedCinemaId(null), 2000);
    } catch {
      showToast('Copie impossible — sélectionne le lien manuellement');
    }
  };

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
        aria-labelledby="subscribe-drawer-title"
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

        {cinemas.map((cinema) => {
          const feed = cinemaFeedUrls(cinema.id);
          return (
            <div key={cinema.id} className={css({ display: 'flex', flexDir: 'column', gap: '3' })}>
              <h2 id="subscribe-drawer-title" className={css({ fontSize: 'md', fontWeight: 'bold', m: '0' })}>
                S’abonner à {cinema.name}
              </h2>

              <a
                href={feed.webcal}
                onClick={() => showToast('📅 Ouverture de ton agenda…')}
                className={css({
                  fontSize: 'sm',
                  fontWeight: 'bold',
                  bg: 'accent',
                  color: 'accentText',
                  border: 'none',
                  rounded: 'xl',
                  px: '4',
                  py: '3',
                  textAlign: 'center',
                  cursor: 'pointer',
                })}
              >
                📅 Ouvrir dans mon agenda
              </a>

              <p className={css({ textAlign: 'center', fontSize: 'xs', color: 'paperFaint', m: '0' })}>ou copier le lien (Google Agenda)</p>

              <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
                <span
                  className={css({
                    flex: '1',
                    minW: '0',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 'xs',
                    color: 'paperMuted',
                    bg: 'rgba(0, 0, 0, 0.25)',
                    rounded: 'md',
                    px: '2',
                    py: '1.5',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  })}
                >
                  {feed.https}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(cinema, feed.https)}
                  className={css({
                    flexShrink: '0',
                    fontSize: 'xs',
                    fontWeight: 'semibold',
                    rounded: 'md',
                    px: '2.5',
                    py: '1.5',
                    cursor: 'pointer',
                    color: copiedCinemaId === cinema.id ? 'success' : 'accent',
                    bg: copiedCinemaId === cinema.id ? 'successSoft' : 'accentSoft',
                    border: '1px solid',
                    borderColor: copiedCinemaId === cinema.id ? 'successBorder' : 'accentBorder',
                  })}
                >
                  {copiedCinemaId === cinema.id ? '✓ Copié' : '📋 Copier'}
                </button>
              </div>
            </div>
          );
        })}

        <Link
          to="/gerer"
          onClick={onClose}
          className={css({
            textAlign: 'center',
            fontSize: 'xs',
            color: 'paperMuted',
            textDecoration: 'underline',
            textDecorationColor: 'paperFaint',
          })}
        >
          Suivre certains films seulement →
        </Link>

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
