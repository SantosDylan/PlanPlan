import { CalendarPlusIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { css } from '#styled-system/css';
import { useCatalog } from '#src/api/useCatalog.js';
import { AgendaView } from '#src/components/AgendaView.js';
import { ErrorNotice } from '#src/components/ErrorNotice.js';
import { GridView, type MovieWithCinema } from '#src/components/GridView.js';
import { IconButton } from '#src/components/IconButton.js';
import { MovieSheet } from '#src/components/MovieSheet.js';
import { SubscribeDrawer } from '#src/components/SubscribeDrawer.js';
import { ThemeMenu } from '#src/components/ThemeMenu.js';
import { ViewToggle } from '#src/components/ViewToggle.js';
import { useAddedShowtimes } from '#src/hooks/useAddedShowtimes.js';
import { useCatalogView } from '#src/hooks/useCatalogView.js';
import { formatLongSync, formatShortSync } from '#src/lib/datetime.js';

const VIEW_PANEL_ID = 'catalog-view-panel';

function CatalogPage() {
  const { data: catalog, isPending, isError, error } = useCatalog();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { view, setView } = useCatalogView();
  const { isAdded, addShowtime, addMovie } = useAddedShowtimes();
  const [selectedEntry, setSelectedEntry] = useState<MovieWithCinema | null>(null);

  const entries: MovieWithCinema[] = useMemo(() => {
    if (!catalog) return [];
    return catalog.movies
      .filter((movie) => movie.showtimes.length > 0)
      .flatMap((movie) => {
        const cinema = catalog.cinemas.find((c) => c.id === movie.cinemaId);
        return cinema ? [{ movie, cinema }] : [];
      });
  }, [catalog]);

  return (
    <div className={css({ minH: '100dvh', display: 'flex', flexDir: 'column' })}>
      {/* `viewport-fit=cover` lets the page paint under the notch and the home indicator, so the
          chrome pays the insets back: the bar keeps its 11 units of height *below* the status bar,
          and the row inside it stays the positioning context of the centred title. */}
      <header
        className={css({
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          zIndex: '20',
          bg: 'ink',
          pt: 'env(safe-area-inset-top)',
        })}
      >
        <div
          className={css({
            position: 'relative',
            h: '11',
            pl: 'max(token(spacing.4), env(safe-area-inset-left))',
            pr: 'max(token(spacing.4), env(safe-area-inset-right))',
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
              <IconButton onClick={() => setDrawerOpen(true)} aria-label="S'abonner au calendrier">
                <CalendarPlusIcon size={20} />
              </IconButton>
            )}
          </div>
        </div>
      </header>

      <div
        className={css({
          flex: '1',
          w: 'full',
          maxW: '860px',
          mx: 'auto',
          pl: 'max(token(spacing.4), env(safe-area-inset-left))',
          pr: 'max(token(spacing.4), env(safe-area-inset-right))',
          pt: 'calc(token(spacing.12) + env(safe-area-inset-top))',
          pb: 'calc(token(spacing.6) + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDir: 'column',
          gap: '4',
        })}
      >
        {catalog && (
          <p className={css({ fontSize: '2xs', color: 'paperFaint', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1', m: '0' })}>
            <span aria-hidden="true" className={css({ w: '1.5', h: '1.5', rounded: 'full', bg: 'success', flexShrink: '0' })} />
            Synchronisé le {formatShortSync(catalog.generatedAt)}
          </p>
        )}

        {!catalog?.cinemas.length && <p className={css({ color: 'paperMuted', fontSize: 'sm', m: '0' })}>Les séances du cinéma, direct dans ton agenda.</p>}

        {isPending && <p className={css({ color: 'paperMuted' })}>Chargement de la programmation…</p>}

        {isError && <ErrorNotice message={error.message} />}

        {catalog && (
          <>
            {/* Sticky under the fixed header now that the document scrolls: switching views
                stays one tap away wherever you are in the list. */}
            <div
              className={css({
                position: 'sticky',
                top: 'calc(token(sizes.11) + env(safe-area-inset-top))',
                zIndex: '10',
                bg: 'ink',
                pt: '2',
                pb: '3',
              })}
            >
              <ViewToggle view={view} onChange={setView} panelId={VIEW_PANEL_ID} />
            </div>

            <div className={css({ display: 'flex', flexDir: 'column', gap: '4' })}>
              <main id={VIEW_PANEL_ID} role="tabpanel" tabIndex={0} className={css({ display: 'flex', flexDir: 'column', gap: '3' })}>
                {view === 'grille' ? (
                  <GridView entries={entries} onSelectMovie={setSelectedEntry} />
                ) : (
                  <AgendaView movies={catalog.movies} cinemas={catalog.cinemas} isAdded={isAdded} onAddShowtime={addShowtime} />
                )}
              </main>

              <footer className={css({ color: 'paperFaint', fontSize: 'xs', borderTop: '1px solid', borderColor: 'hairline', pt: '3' })}>
                Programmation mise à jour le {formatLongSync(catalog.generatedAt)} · données issues du site
                de la ville de Thionville · projet perso, non affilié au cinéma.
              </footer>
            </div>

            <MovieSheet
              entry={selectedEntry}
              onClose={() => setSelectedEntry(null)}
              isAdded={isAdded}
              onAddShowtime={addShowtime}
              onAddMovie={addMovie}
            />

            <SubscribeDrawer cinemas={catalog.cinemas} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
}

export default CatalogPage;
