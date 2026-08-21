import { useState, type FC } from 'react';
import type { Cinema } from '../../../ingest/src/types.js';
import { css } from '#styled-system/css';
import { Sheet } from './Sheet.js';
import { cinemaFeedUrls } from '#src/lib/calendar.js';
import { useToast } from '#src/context/ToastContext.js';

type SubscribeDrawerProps = {
  cinemas: Cinema[];
  open: boolean;
  onClose: () => void;
};

export const SubscribeDrawer: FC<SubscribeDrawerProps> = ({ cinemas, open, onClose }) => {
  const { showToast } = useToast();
  const [copiedCinemaId, setCopiedCinemaId] = useState<string | null>(null);

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
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title="S’abonner au calendrier">
      {cinemas.map((cinema) => {
        const feed = cinemaFeedUrls(cinema.id);
        return (
          <div key={cinema.id} className={css({ display: 'flex', flexDir: 'column', gap: '3' })}>
            <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'paperBody', m: '0' })}>{cinema.name}</h3>

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
                  fontFamily: 'mono',
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
    </Sheet>
  );
};
