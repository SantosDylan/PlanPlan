import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { css } from '../../styled-system/css';
import { useCatalog } from '../api/useCatalog.js';
import { BottomNav } from '../components/BottomNav.js';
import { ErrorNotice } from '../components/ErrorNotice.js';
import { OptionsDrawer } from '../components/OptionsDrawer.js';
import { useMovieSelectionContext } from '../context/MovieSelectionContext.js';
import { downloadFilteredIcs } from '../lib/calendar.js';

const ALL_GENRES = 'Tous';

function ManageSubscriptionPage() {
  const { data: catalog, isPending, isError, error } = useCatalog();
  const { selectedIds, toggle, isSelected, selectAll, deselectAll } = useMovieSelectionContext();
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState(ALL_GENRES);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);

  const genres = catalog
    ? [ALL_GENRES, ...[...new Set(catalog.movies.flatMap((movie) => movie.genres))]]
    : [ALL_GENRES];

  const filteredMovies = catalog
    ? catalog.movies.filter(
        (movie) =>
          movie.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
          (genreFilter === ALL_GENRES || movie.genres.includes(genreFilter)),
      )
    : [];
  const filteredIds = filteredMovies.map((movie) => movie.id);
  const selectedFilteredCount = filteredIds.filter((id) => selectedIds.has(id)).length;
  const allFilteredSelected = filteredIds.length > 0 && selectedFilteredCount === filteredIds.length;

  const selectedShowtimeCount = catalog
    ? catalog.movies.filter((movie) => isSelected(movie.id)).reduce((total, movie) => total + movie.showtimes.length, 0)
    : 0;

  const handleDownload = () => {
    if (!catalog) return;
    for (const cinema of catalog.cinemas) {
      const cinemaMovies = catalog.movies.filter((movie) => movie.cinemaId === cinema.id);
      if (cinemaMovies.some((movie) => selectedIds.has(movie.id))) {
        downloadFilteredIcs(cinema, cinemaMovies, selectedIds);
      }
    }
  };

  return (
    <div className={css({ position: 'fixed', inset: '0', maxW: '860px', mx: 'auto', display: 'flex', flexDir: 'column', overflow: 'hidden' })}>
      <div className={css({ flexShrink: '0', px: '4', pt: '4', pb: '2', display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
          <Link
            to="/"
            aria-label="Retour à la programmation"
            className={css({
              flexShrink: '0',
              w: '9',
              h: '9',
              rounded: 'full',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'md',
              color: 'paperMuted',
              border: '1px solid',
              borderColor: 'border',
              _hover: { color: 'paper', borderColor: 'borderStrong' },
            })}
          >
            <span aria-hidden="true">←</span>
          </Link>
          <h1 className={css({ fontSize: 'lg', fontWeight: 'extrabold', m: '0', flex: '1', minW: '0' })}>Gérer mon abonnement</h1>
          <button
            ref={optionsButtonRef}
            type="button"
            onClick={() => setOptionsOpen(true)}
            aria-label="Apparence"
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
              flexShrink: '0',
            })}
          >
            ◐
          </button>
        </div>

        {isError && <ErrorNotice message={error.message} />}

        {catalog && (
          <>
            <label>
              <span className={css({ srOnly: true })}>Rechercher un film</span>
              <div
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5',
                  border: '1px solid',
                  borderColor: 'borderStrong',
                  rounded: 'lg',
                  px: '2.5',
                  py: '2',
                })}
              >
                <span aria-hidden="true" className={css({ fontSize: 'xs', color: 'paperFaint' })}>
                  🔍
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un film…"
                  className={css({
                    flex: '1',
                    minW: '0',
                    border: 'none',
                    outline: 'none',
                    bg: 'transparent',
                    color: 'paper',
                    fontSize: 'xs',
                  })}
                />
              </div>
            </label>

            {genres.length > 1 && (
              <div
                className={css({
                  display: 'flex',
                  gap: '1.5',
                  overflowX: 'auto',
                  mx: '-4',
                  px: '4',
                })}
              >
                {genres.map((genre) => {
                  const active = genre === genreFilter;
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setGenreFilter(genre)}
                      className={css({
                        flexShrink: '0',
                        whiteSpace: 'nowrap',
                        fontSize: 'xs',
                        fontWeight: active ? 'bold' : 'medium',
                        rounded: 'full',
                        px: '3',
                        py: '1',
                        cursor: 'pointer',
                        border: active ? 'none' : '1px solid',
                        borderColor: 'borderStrong',
                        bg: active ? 'accent' : 'transparent',
                        color: active ? 'accentText' : 'paperMuted',
                      })}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className={css({ flex: '1', overflowY: 'auto', px: '4' })}>
        {isPending && <p className={css({ color: 'paperMuted' })}>Chargement de la programmation…</p>}

        {catalog && filteredMovies.length === 0 && (
          <p className={css({ color: 'paperFaint', fontSize: 'sm', textAlign: 'center', py: '6' })}>Aucun film ne correspond.</p>
        )}

        {catalog && filteredMovies.length > 0 && (
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2',
              pb: '2',
            })}
          >
            <span className={css({ fontSize: 'xs', color: 'paperMuted' })}>
              {selectedFilteredCount} / {filteredIds.length} sélectionné{filteredIds.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => (allFilteredSelected ? deselectAll(filteredIds) : selectAll(filteredIds))}
              className={css({
                fontSize: 'xs',
                fontWeight: 'bold',
                color: 'accent',
                bg: 'transparent',
                border: 'none',
                p: '0',
                cursor: 'pointer',
                textDecoration: 'underline',
              })}
            >
              {allFilteredSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
        )}

        {catalog && filteredMovies.length > 0 && (
          <ul className={css({ display: 'flex', flexDir: 'column', gap: '1.5', listStyle: 'none', p: '0', m: '0', pb: '24' })}>
            {filteredMovies.map((movie) => {
              const selected = isSelected(movie.id);
              return (
                <li key={movie.id}>
                  <label
                    className={css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2.5',
                      rounded: 'xl',
                      p: '2.5',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: selected ? 'accent' : 'border',
                      bg: selected ? 'accentSoft' : 'transparent',
                    })}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(movie.id)}
                      className={css({ srOnly: true })}
                    />
                    <span
                      aria-hidden="true"
                      className={css({
                        w: '4.5',
                        h: '4.5',
                        flexShrink: '0',
                        rounded: 'md',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2xs',
                        fontWeight: 'extrabold',
                        border: selected ? 'none' : '1.5px solid',
                        borderColor: 'borderStrong',
                        bg: selected ? 'accent' : 'transparent',
                        color: 'accentText',
                      })}
                    >
                      {selected && '✓'}
                    </span>
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                        className={css({ w: '32px', h: '48px', objectFit: 'cover', rounded: 'md', flexShrink: '0', bg: 'surfaceRaised' })}
                      />
                    ) : (
                      <span aria-hidden="true" className={css({ w: '32px', h: '48px', flexShrink: '0', rounded: 'md', bg: 'surfaceRaised' })} />
                    )}
                    <span className={css({ fontSize: 'sm', color: 'paper' })}>
                      {movie.title}{' '}
                      <span className={css({ color: 'paperFaint', fontSize: 'xs' })}>
                        ({movie.showtimes.length} séance{movie.showtimes.length > 1 ? 's' : ''})
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {catalog && (
        <button
          type="button"
          disabled={selectedShowtimeCount === 0}
          onClick={handleDownload}
          aria-label={
            selectedShowtimeCount > 0
              ? `Télécharger mon .ics (${selectedShowtimeCount} séance${selectedShowtimeCount > 1 ? 's' : ''})`
              : 'Télécharger mon .ics'
          }
          title="Télécharger mon .ics"
          className={css({
            position: 'fixed',
            bottom: { base: '20', md: '6' },
            right: '4',
            w: '12',
            h: '12',
            p: '2.5',
            rounded: 'full',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'lg',
            bg: 'accent',
            color: 'accentText',
            border: 'none',
            boxShadow: '0 10px 30px -4px rgba(0, 0, 0, 0.45)',
            cursor: 'pointer',
            zIndex: '30',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
            _hover: { boxShadow: '0 14px 36px -4px rgba(0, 0, 0, 0.5)', transform: 'translateY(-1px)' },
            _active: { transform: 'scale(0.94)' },
            _disabled: {
              opacity: '0.5',
              cursor: 'not-allowed',
              boxShadow: 'none',
              _hover: { transform: 'none' },
              _active: { transform: 'none' },
            },
          })}
        >
          <span aria-hidden="true">⇩</span>
        </button>
      )}

      <OptionsDrawer open={optionsOpen} onClose={() => setOptionsOpen(false)} triggerRef={optionsButtonRef} />

      <BottomNav />
    </div>
  );
}

export default ManageSubscriptionPage;
