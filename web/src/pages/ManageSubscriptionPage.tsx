import { css } from '../../styled-system/css';
import { useCatalog } from '../api/useCatalog.js';
import { useMovieSelection } from '../hooks/useMovieSelection.js';
import { downloadFilteredIcs } from '../lib/calendar.js';

function ManageSubscriptionPage() {
  const { data: catalog, isPending, isError, error } = useCatalog();
  const { selectedIds, toggle, isSelected } = useMovieSelection();

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
    <div className={css({ maxW: '860px', mx: 'auto', px: '4', py: '8', display: 'flex', flexDir: 'column', gap: '6' })}>
      <header>
        <a href="#/" className={css({ fontSize: 'sm', color: 'amber.900', _hover: { textDecoration: 'underline' } })}>
          ← Retour à la programmation
        </a>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', letterSpacing: 'tight', mt: '2' })}>Gérer mon abonnement</h1>
        <p className={css({ color: 'stone.600' })}>
          Coche les films que tu veux suivre, puis télécharge un .ics à importer dans ton agenda. Ce fichier est un
          instantané : reviens ici et re-télécharge après chaque mise à jour du programme pour capter les nouvelles séances.
        </p>
      </header>

      {isPending && <p>Chargement de la programmation…</p>}

      {isError && (
        <p role="alert" className={css({ color: 'red.700' })}>
          Impossible de charger la programmation : {error.message}
        </p>
      )}

      {catalog && (
        <>
          <ul className={css({ display: 'flex', flexDir: 'column', gap: '2', listStyle: 'none', p: '0' })}>
            {catalog.movies.map((movie) => (
              <li
                key={movie.id}
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3',
                  bg: 'white',
                  rounded: 'lg',
                  p: '3',
                  boxShadow: 'sm',
                })}
              >
                <input
                  type="checkbox"
                  id={`movie-${movie.id}`}
                  checked={isSelected(movie.id)}
                  onChange={() => toggle(movie.id)}
                  className={css({ w: '5', h: '5', cursor: 'pointer', flexShrink: 0 })}
                />
                <label htmlFor={`movie-${movie.id}`} className={css({ cursor: 'pointer', flex: '1' })}>
                  <span className={css({ fontWeight: 'semibold' })}>{movie.title}</span>{' '}
                  <span className={css({ color: 'stone.500', fontSize: 'sm' })}>
                    ({movie.showtimes.length} séance{movie.showtimes.length > 1 ? 's' : ''})
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <section
            className={css({
              position: 'sticky',
              bottom: '4',
              bg: 'amber.50',
              border: '1px solid',
              borderColor: 'amber.200',
              rounded: 'xl',
              p: '4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '3',
              flexWrap: 'wrap',
            })}
          >
            <p className={css({ color: 'stone.700', fontSize: 'sm' })}>
              {selectedShowtimeCount} séance{selectedShowtimeCount > 1 ? 's' : ''} sélectionnée
              {selectedShowtimeCount > 1 ? 's' : ''}, sur {catalog.movies.length} film{catalog.movies.length > 1 ? 's' : ''} au programme.
            </p>
            <button
              type="button"
              disabled={selectedShowtimeCount === 0}
              onClick={handleDownload}
              className={css({
                fontSize: 'sm',
                fontWeight: 'semibold',
                bg: 'amber.400',
                color: 'amber.950',
                border: '1px solid',
                borderColor: 'amber.500',
                rounded: 'lg',
                px: '4',
                py: '2',
                cursor: 'pointer',
                _hover: { bg: 'amber.500' },
                _disabled: { opacity: '0.5', cursor: 'not-allowed', _hover: { bg: 'amber.400' } },
              })}
            >
              Télécharger mon .ics<span aria-hidden="true"> 📅</span>
            </button>
          </section>
        </>
      )}
    </div>
  );
}

export default ManageSubscriptionPage;
