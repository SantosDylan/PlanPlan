import type { FC } from 'react';
import type { Cinema, Movie, Showtime } from '../../../ingest/src/types.js';
import { css } from '../../styled-system/css';
import { downloadShowtimeIcs } from '../lib/calendar.js';

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const dayLabelFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const timeFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  hour: '2-digit',
  minute: '2-digit',
});

/** Les séances arrivent triées de l'ingestion → l'ordre d'insertion des groupes est chronologique. */
function groupShowtimesByDay(showtimes: Showtime[]): [string, Showtime[]][] {
  const groups = new Map<string, Showtime[]>();
  for (const showtime of showtimes) {
    const key = dayKeyFormat.format(new Date(showtime.startsAt));
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(showtime);
    } else {
      groups.set(key, [showtime]);
    }
  }
  return [...groups.entries()];
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`;
}

type MovieCardProps = {
  movie: Movie;
  cinema: Cinema;
};

export const MovieCard: FC<MovieCardProps> = ({ movie, cinema }) => {
  const meta = [
    movie.director,
    movie.durationMinutes !== undefined ? formatDuration(movie.durationMinutes) : undefined,
    movie.genres.length > 0 ? movie.genres.join(', ') : undefined,
    movie.releaseYear !== undefined ? String(movie.releaseYear) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={css({
        display: 'flex',
        gap: '5',
        bg: 'white',
        rounded: '2xl',
        p: '5',
        boxShadow: 'sm',
      })}
    >
      {movie.posterUrl && (
        <img
          src={movie.posterUrl}
          alt={`Affiche de ${movie.title}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
          className={css({
            w: '110px',
            h: '165px',
            objectFit: 'cover',
            rounded: 'lg',
            flexShrink: 0,
            bg: 'stone.200',
          })}
        />
      )}

      <div className={css({ display: 'flex', flexDir: 'column', gap: '2', minW: 0 })}>
        <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', lineHeight: 'tight' })}>
          {movie.title}
          {movie.version && (
            <span
              className={css({
                ml: '2',
                fontSize: 'xs',
                fontWeight: 'semibold',
                bg: 'stone.200',
                color: 'stone.700',
                rounded: 'md',
                px: '1.5',
                py: '0.5',
                verticalAlign: 'middle',
              })}
            >
              {movie.version}
            </span>
          )}
        </h2>

        {meta && <p className={css({ fontSize: 'sm', color: 'stone.500' })}>{meta}</p>}

        {movie.synopsis && (
          <p className={css({ fontSize: 'sm', color: 'stone.600', lineClamp: 3 })}>{movie.synopsis}</p>
        )}

        <div className={css({ display: 'flex', flexDir: 'column', gap: '1.5', mt: '1' })}>
          {groupShowtimesByDay(movie.showtimes).map(([day, dayShowtimes]) => (
            <div key={day} className={css({ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '1.5' })}>
              <span
                className={css({
                  fontSize: 'sm',
                  fontWeight: 'semibold',
                  color: 'stone.700',
                  minW: '10rem',
                  textTransform: 'capitalize',
                })}
              >
                {dayLabelFormat.format(new Date(dayShowtimes[0]!.startsAt))}
              </span>
              {dayShowtimes.map((showtime) => (
                <button
                  key={showtime.id}
                  type="button"
                  title="Ajouter cette séance à mon calendrier (.ics)"
                  onClick={() => downloadShowtimeIcs(cinema, movie, showtime)}
                  className={css({
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    bg: 'amber.100',
                    color: 'amber.900',
                    border: '1px solid',
                    borderColor: 'amber.300',
                    rounded: 'lg',
                    px: '2.5',
                    py: '1',
                    cursor: 'pointer',
                    _hover: { bg: 'amber.200' },
                  })}
                >
                  {timeFormat.format(new Date(showtime.startsAt))}
                  <span aria-hidden="true"> +📅</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {movie.bookingUrl && (
          <a
            href={movie.bookingUrl}
            target="_blank"
            rel="noreferrer"
            className={css({ fontSize: 'sm', color: 'blue.700', _hover: { textDecoration: 'underline' }, mt: '1' })}
          >
            Réserver sur le site du cinéma ↗
          </a>
        )}
      </div>
    </article>
  );
};
