import { AnimatePresence } from 'framer-motion';
import { useRef, useState, type FC } from 'react';
import type { Cinema } from '../../../ingest/src/types.js';
import { css } from '../../styled-system/css';
import { Backdrop } from './Backdrop.js';
import { DraggableSheet } from './DraggableSheet.js';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap.js';
import { cinemaFeedUrls } from '../lib/calendar.js';
import { useToast } from '../context/ToastContext.js';

// Permanently non-interactive: only its visible children (backdrop, sheet) opt back in via
// pointerEvents: 'auto', so it never blocks the page behind it — mounted or not, animating or not.
const wrapperClass = css({
  position: 'fixed',
  inset: '0',
  zIndex: '40',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  pointerEvents: 'none',
});

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

  useModalFocusTrap({ open, onClose, containerRef: sheetRef, triggerRef });

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
    <AnimatePresence>
      {open && (
        <div className={wrapperClass}>
          <Backdrop onClick={onClose} />
          <DraggableSheet
            ref={sheetRef}
            onClose={onClose}
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
            })}
          >
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

            <button
              type="button"
              onClick={onClose}
              className={css({ textAlign: 'center', fontSize: 'xs', color: 'paperFaint', bg: 'transparent', border: 'none', cursor: 'pointer' })}
            >
              Fermer
            </button>
          </DraggableSheet>
        </div>
      )}
    </AnimatePresence>
  );
};
