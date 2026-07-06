import { useRef, useState } from 'react';
import { css } from '../../styled-system/css';
import { useCatalog } from '../api/useCatalog.js';
import { BottomNav } from '../components/BottomNav.js';
import { MovieCard } from '../components/MovieCard.js';
import { SubscribeDrawer } from '../components/SubscribeDrawer.js';

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
    <div className={css({ maxW: '860px', mx: 'auto', px: '4', py: '6', pb: '20', display: 'flex', flexDir: 'column', gap: '4' })}>
      <header
        className={css({
          position: 'sticky',
          top: '0',
          zIndex: '20',
          mx: '-4',
          px: '4',
          pt: '2',
          pb: '2.5',
          bg: 'rgba(15, 13, 11, 0.68)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 1px 0 rgba(0, 0, 0, 0.6), 0 8px 16px -8px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '3',
        })}
      >
        <div className={css({ minW: '0', display: 'flex', flexDir: 'column', gap: '0.5' })}>
          <h1 className={css({ fontSize: 'xl', fontWeight: 'extrabold', letterSpacing: 'tight', m: '0' })}>
            <span aria-hidden="true">🎬</span> Plan-Plan
          </h1>
          {catalog && (
            <p className={css({ fontSize: '2xs', color: 'paperFaint', display: 'flex', alignItems: 'center', gap: '1', m: '0' })}>
              <span aria-hidden="true" className={css({ w: '1.5', h: '1.5', rounded: 'full', bg: 'success', flexShrink: '0' })} />
              Synchronisé le {shortSyncFormat.format(new Date(catalog.generatedAt))}
            </p>
          )}
        </div>
        {catalog && catalog.cinemas.length > 0 && (
          <button
            ref={subscribeButtonRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="S'abonner au calendrier"
            className={css({
              w: '9',
              h: '9',
              rounded: 'full',
              bg: 'accentSoft',
              border: '1px solid',
              borderColor: 'accentBorder',
              color: 'accent',
              fontSize: 'md',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            📅
          </button>
        )}
      </header>

      {!catalog?.cinemas.length && <p className={css({ color: 'paperMuted', fontSize: 'sm', m: '0' })}>Les séances du cinéma, direct dans ton agenda.</p>}

      {isPending && <p className={css({ color: 'paperMuted' })}>Chargement de la programmation…</p>}

      {isError && (
        <p role="alert" className={css({ color: 'red.400' })}>
          Impossible de charger la programmation : {error.message}
        </p>
      )}

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

      <BottomNav />
    </div>
  );
}

export default CatalogPage;
