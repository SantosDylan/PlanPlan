import { CalendarPlusIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { css } from '../../styled-system/css';
import { useCatalog } from '../api/useCatalog.js';
import { ErrorNotice } from '../components/ErrorNotice.js';
import { IconButton } from '../components/IconButton.js';
import { MovieCard } from '../components/MovieCard.js';
import { SubscribeDrawer } from '../components/SubscribeDrawer.js';
import { ThemeMenu } from '../components/ThemeMenu.js';

const updatedAtFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  dateStyle: 'long',
  timeStyle: 'short',
});
const shortSyncFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function CatalogPage() {
  const { data: catalog, isPending, isError, error } = useCatalog();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const subscribeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={css({ maxW: '860px', mx: 'auto', px: '4', pt: '12', pb: '6', display: 'flex', flexDir: 'column', gap: '4' })}>
      <header
        className={css({
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          zIndex: '20',
          h: '11',
          px: '4',
          bg: 'headerBg',
          backdropFilter: 'blur(20px) saturate(180%)',
          display: 'flex',
          alignItems: 'center',
        })}
      >
        <h1
          className={css({
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'md',
            fontWeight: 'bold',
            letterSpacing: 'tight',
            m: '0',
          })}
        >
          Plan-Plan
        </h1>
        <div className={css({ display: 'flex', alignItems: 'center', ml: 'auto' })}>
          <ThemeMenu />
          {catalog && catalog.cinemas.length > 0 && (
            <IconButton ref={subscribeButtonRef} onClick={() => setDrawerOpen(true)} aria-label="S'abonner au calendrier">
              <CalendarPlusIcon size={20} />
            </IconButton>
          )}
        </div>
      </header>

      {catalog && (
        <p className={css({ fontSize: '2xs', color: 'paperFaint', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1', m: '0' })}>
          <span aria-hidden="true" className={css({ w: '1.5', h: '1.5', rounded: 'full', bg: 'success', flexShrink: '0' })} />
          Synchronisé le {shortSyncFormat.format(new Date(catalog.generatedAt))}
        </p>
      )}

      {!catalog?.cinemas.length && <p className={css({ color: 'paperMuted', fontSize: 'sm', m: '0' })}>Les séances du cinéma, direct dans ton agenda.</p>}

      {isPending && <p className={css({ color: 'paperMuted' })}>Chargement de la programmation…</p>}

      {isError && <ErrorNotice message={error.message} />}

      {catalog && (
        <>
          <main className={css({ display: 'flex', flexDir: 'column', gap: '3' })}>
            {catalog.movies.map((movie) => {
              const cinema = catalog.cinemas.find((c) => c.id === movie.cinemaId);
              return cinema ? <MovieCard key={movie.id} movie={movie} cinema={cinema} /> : null;
            })}
          </main>

          <footer className={css({ color: 'paperFaint', fontSize: 'xs', borderTop: '1px solid', borderColor: 'border', pt: '3' })}>
            Programmation mise à jour le {updatedAtFormat.format(new Date(catalog.generatedAt))} · données issues du site
            de la ville de Thionville · projet perso, non affilié au cinéma.
          </footer>

          <SubscribeDrawer
            cinemas={catalog.cinemas}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            triggerRef={subscribeButtonRef}
          />
        </>
      )}
    </div>
  );
}

export default CatalogPage;
