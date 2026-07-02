import { css } from '../../styled-system/css';
import { useCatalog } from '../api/useCatalog.js';
import { MovieCard } from '../components/MovieCard.js';
import { cinemaFeedUrls } from '../lib/calendar.js';

const updatedAtFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  dateStyle: 'long',
  timeStyle: 'short',
});

function CatalogPage() {
  const { data: catalog, isPending, isError, error } = useCatalog();

  return (
    <div className={css({ maxW: '860px', mx: 'auto', px: '4', py: '8', display: 'flex', flexDir: 'column', gap: '6' })}>
      <header>
        <h1 className={css({ fontSize: '3xl', fontWeight: 'bold', letterSpacing: 'tight' })}>
          <span aria-hidden="true">🎬 </span>Plan-Plan
        </h1>
        <p className={css({ color: 'stone.600' })}>Les séances du cinéma, direct dans ton agenda.</p>
      </header>

      {isPending && <p>Chargement de la programmation…</p>}

      {isError && (
        <p role="alert" className={css({ color: 'red.700' })}>
          Impossible de charger la programmation : {error.message}
        </p>
      )}

      {catalog && (
        <>
          <section
            aria-label="Abonnement au calendrier"
            className={css({ bg: 'amber.50', border: '1px solid', borderColor: 'amber.200', rounded: 'xl', p: '4', fontSize: 'sm' })}
          >
            {catalog.cinemas.map((cinema) => {
              const feed = cinemaFeedUrls(cinema.id);
              return (
                <p key={cinema.id} className={css({ color: 'stone.700' })}>
                  <span aria-hidden="true">📅 </span>
                  <a href={feed.webcal} className={css({ fontWeight: 'semibold', color: 'amber.900', _hover: { textDecoration: 'underline' } })}>
                    S’abonner aux séances de {cinema.name} ({cinema.city})
                  </a>{' '}
                  — ton agenda restera synchronisé. Pour Google Agenda, utiliser « Ajouter par URL » avec{' '}
                  <code className={css({ bg: 'stone.200', rounded: 'sm', px: '1', fontSize: 'xs', wordBreak: 'break-all' })}>{feed.https}</code>
                </p>
              );
            })}
            <p className={css({ color: 'stone.700', mt: '2' })}>
              <span aria-hidden="true">🎬 </span>
              Tu ne veux suivre que certains films ?{' '}
              <a href="#/gerer" className={css({ fontWeight: 'semibold', color: 'amber.900', _hover: { textDecoration: 'underline' } })}>
                Choisis-les et télécharge ton propre .ics
              </a>
              .
            </p>
          </section>

          <main className={css({ display: 'flex', flexDir: 'column', gap: '4' })}>
            {catalog.movies.map((movie) => {
              const cinema = catalog.cinemas.find((c) => c.id === movie.cinemaId);
              return cinema ? <MovieCard key={movie.id} movie={movie} cinema={cinema} /> : null;
            })}
          </main>

          <footer className={css({ color: 'stone.500', fontSize: 'sm', borderTop: '1px solid', borderColor: 'stone.200', pt: '4' })}>
            Programmation mise à jour le {updatedAtFormat.format(new Date(catalog.generatedAt))} · données issues du site
            de la ville de Thionville · projet perso, non affilié au cinéma.
          </footer>
        </>
      )}
    </div>
  );
}

export default CatalogPage;
