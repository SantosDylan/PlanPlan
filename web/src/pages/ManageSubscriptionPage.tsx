import { useState } from 'react';
import { Link } from 'react-router';
import { css } from '../../styled-system/css';
import { useCatalog } from '../api/useCatalog.js';
import { BottomNav } from '../components/BottomNav.js';
import { useMovieSelectionContext } from '../context/MovieSelectionContext.js';
import { downloadFilteredIcs } from '../lib/calendar.js';

const ALL_GENRES = 'Tous';

function formatDurationHours(totalMinutes: number): string {
  return `${Math.floor(totalMinutes / 60)}h${String(totalMinutes % 60).padStart(2, '0')}`;
}

function ManageSubscriptionPage() {
  const { data: catalog, isPending, isError, error } = useCatalog();
  const { selectedIds, toggle, isSelected, selectAll, deselectAll } = useMovieSelectionContext();
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState(ALL_GENRES);

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
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  const selectedMovies = catalog ? catalog.movies.filter((movie) => isSelected(movie.id)) : [];
  const selectedShowtimeCount = selectedMovies.reduce((total, movie) => total + movie.showtimes.length, 0);
  const totalCinemaMinutes = selectedMovies.reduce((total, movie) => total + (movie.durationMinutes ?? 0) * movie.showtimes.length, 0);

  const summaryLine =
    selectedMovies.length === 0
      ? 'Aucun film sélectionné'
      : `${selectedMovies.length} film${selectedMovies.length > 1 ? 's' : ''} · ${selectedShowtimeCount} séance${selectedShowtimeCount > 1 ? 's' : ''} · ≈ ${formatDurationHours(totalCinemaMinutes)} de ciné`;

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
    <div className={css({ h: '100dvh', maxW: '860px', mx: 'auto', display: 'flex', flexDir: 'column', overflow: 'hidden' })}>
      <div className={css({ flexShrink: '0', px: '4', pt: '6', pb: '3', display: 'flex', flexDir: 'column', gap: '3' })}>
        <header className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
          <Link to="/" className={css({ fontSize: 'xs', color: 'paperMuted', _hover: { textDecoration: 'underline' } })}>
            ← Retour à la programmation
          </Link>
          <h1 className={css({ fontSize: 'lg', fontWeight: 'extrabold', m: '0' })}>Gérer mon abonnement</h1>
          <p role="note" className={css({ fontSize: 'xs', color: 'paperMuted', m: '0', lineHeight: '1.4' })}>
            <span aria-hidden="true">⚠️</span> Instantané — re-télécharge après chaque mise à jour du programme.
          </p>
        </header>

        {isError && (
          <p role="alert" className={css({ color: 'red.400' })}>
            Impossible de charger la programmation : {error.message}
          </p>
        )}

        {catalog && (
          <>
            <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
              <label className={css({ flex: '1', minW: '0' })}>
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
              <button
                type="button"
                disabled={filteredIds.length === 0}
                onClick={() => (allFilteredSelected ? deselectAll(filteredIds) : selectAll(filteredIds))}
                className={css({
                  flexShrink: '0',
                  fontSize: 'xs',
                  fontWeight: 'bold',
                  color: 'accent',
                  bg: 'transparent',
                  border: '1px solid',
                  borderColor: 'accentBorder',
                  rounded: 'lg',
                  px: '3',
                  py: '2',
                  cursor: 'pointer',
                  _disabled: { opacity: '0.5', cursor: 'not-allowed' },
                })}
              >
                {allFilteredSelected ? 'Tout décocher' : 'Tout cocher'}
              </button>
            </div>

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
          <ul className={css({ display: 'flex', flexDir: 'column', gap: '1.5', listStyle: 'none', p: '0', m: '0', pb: '3' })}>
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
        <section
          className={css({
            flexShrink: '0',
            borderTop: '1px solid',
            borderColor: 'border',
            px: '4',
            pt: '3',
            pb: '24',
            display: 'flex',
            flexDir: 'column',
            gap: '2.5',
          })}
        >
          <p className={css({ color: 'paperMuted', fontSize: 'sm', m: '0' })}>{summaryLine}</p>
          <button
            type="button"
            disabled={selectedShowtimeCount === 0}
            onClick={handleDownload}
            aria-describedby="download-help"
            className={css({
              fontSize: 'sm',
              fontWeight: 'bold',
              bg: 'accent',
              color: 'accentText',
              border: 'none',
              rounded: 'xl',
              px: '4',
              py: '2.5',
              cursor: 'pointer',
              _disabled: { opacity: '0.5', cursor: 'not-allowed' },
            })}
          >
            Télécharger mon .ics<span aria-hidden="true"> 📅</span>
          </button>
          {selectedShowtimeCount === 0 && (
            <p id="download-help" className={css({ color: 'paperFaint', fontSize: 'xs', m: '0' })}>
              Sélectionne au moins un film pour activer le téléchargement.
            </p>
          )}
        </section>
      )}

      <BottomNav />
    </div>
  );
}

export default ManageSubscriptionPage;
