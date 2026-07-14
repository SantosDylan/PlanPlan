import { useState, type FC } from 'react';
import type { Cinema, Movie, Showtime } from '../../../ingest/src/types.js';
import { css } from '../../styled-system/css';
import { downloadShowtimeIcs } from '../lib/calendar.js';
import { useToast } from '../context/ToastContext.js';

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const dayNameFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short' });
const dayNumberFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric' });
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
  const { showToast } = useToast();
  const dayGroups = groupShowtimesByDay(movie.showtimes);
  const [selectedDayKey, setSelectedDayKey] = useState(dayGroups[0]?.[0]);
  const [addedShowtimeIds, setAddedShowtimeIds] = useState<Set<string>>(new Set());

  const activeGroup = dayGroups.find(([key]) => key === selectedDayKey) ?? dayGroups[0];

  const meta = [
    movie.director,
    movie.durationMinutes !== undefined ? formatDuration(movie.durationMinutes) : undefined,
    movie.genres.length > 0 ? movie.genres.join(', ') : undefined,
    movie.releaseYear !== undefined ? String(movie.releaseYear) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  const handleShowtimeClick = (showtime: Showtime) => {
    downloadShowtimeIcs(cinema, movie, showtime);
    setAddedShowtimeIds((current) => new Set(current).add(showtime.id));
    showToast(`✓ Ajouté à ton agenda (${timeFormat.format(new Date(showtime.startsAt))})`);
  };

  return (
    <article
      className={css({
        display: 'flex',
        flexDir: 'column',
        gap: '3',
        bg: 'surface',
        rounded: '2xl',
        p: '4',
        border: '1px solid',
        borderColor: 'border',
      })}
    >
      <div className={css({ display: 'flex', gap: '3' })}>
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`Affiche de ${movie.title}`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
            className={css({ w: '80px', h: '120px', objectFit: 'cover', rounded: 'lg', flexShrink: 0, bg: 'surfaceRaised' })}
          />
        ) : (
          <div
            aria-hidden="true"
            className={css({
              w: '80px',
              h: '120px',
              flexShrink: 0,
              rounded: 'lg',
              bg: 'surfaceRaised',
              backgroundImage:
                'repeating-linear-gradient(135deg, {colors.hairline} 0 6px, {colors.hairlineFaint} 6px 12px)',
            })}
          />
        )}

        <div className={css({ minW: 0, display: 'flex', flexDir: 'column', gap: '1.5' })}>
          <h2 className={css({ fontSize: 'md', fontWeight: 'bold', lineHeight: 'tight', m: '0' })}>
            {movie.title}
            {movie.version && (
              <span
                className={css({
                  ml: '2',
                  fontSize: '2xs',
                  fontWeight: 'semibold',
                  bg: 'surfaceRaised',
                  color: 'paperMuted',
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

          {meta && <p className={css({ fontSize: 'xs', color: 'paperFaint', m: '0' })}>{meta}</p>}

          {movie.synopsis && <p className={css({ fontSize: 'xs', color: 'paperMuted', lineClamp: 2, m: '0' })}>{movie.synopsis}</p>}
        </div>
      </div>

      {activeGroup && (
        <>
          <div
            role="tablist"
            aria-label={`Choisir un jour pour ${movie.title}`}
            className={css({ display: 'flex', gap: '1.5', overflowX: 'auto', pb: '0.5' })}
          >
            {dayGroups.map(([key, dayShowtimes]) => {
              const active = key === selectedDayKey;
              const date = new Date(dayShowtimes[0]!.startsAt);
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedDayKey(key)}
                  className={css({
                    flexShrink: 0,
                    w: '10',
                    h: '12',
                    display: 'flex',
                    flexDir: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5',
                    rounded: 'lg',
                    cursor: 'pointer',
                    border: active ? 'none' : '1px solid',
                    borderColor: 'borderStrong',
                    bg: active ? 'accent' : 'transparent',
                  })}
                >
                  <span
                    className={css({
                      fontSize: '2xs',
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      color: active ? 'accentText' : 'paperFaint',
                    })}
                  >
                    {dayNameFormat.format(date).replace(/\.$/, '')}
                  </span>
                  <span className={css({ fontSize: 'sm', fontWeight: 'extrabold', color: active ? 'accentText' : 'paper' })}>
                    {dayNumberFormat.format(date)}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className={css({
              display: 'flex',
              gap: '1.5',
              flexWrap: 'wrap',
              borderTop: '1px solid',
              borderColor: 'border',
              pt: '2.5',
            })}
          >
            <span className={css({ fontSize: 'xs', color: 'paperFaint', textTransform: 'capitalize', alignSelf: 'center' })}>
              {dayLabelFormat.format(new Date(activeGroup[1][0]!.startsAt))}
            </span>
            {activeGroup[1].map((showtime) => {
              const added = addedShowtimeIds.has(showtime.id);
              return (
                <button
                  key={showtime.id}
                  type="button"
                  aria-label={`Ajouter la séance de ${movie.title} du ${dayLabelFormat.format(new Date(showtime.startsAt))} à ${timeFormat.format(new Date(showtime.startsAt))} à mon calendrier`}
                  onClick={() => handleShowtimeClick(showtime)}
                  className={css({
                    fontSize: 'xs',
                    fontWeight: added ? 'bold' : 'medium',
                    rounded: 'lg',
                    px: '2.5',
                    py: '1',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: added ? 'accent' : 'borderStrong',
                    bg: added ? 'accent' : 'transparent',
                    color: added ? 'accentText' : 'paperMuted',
                  })}
                >
                  {added && <span aria-hidden="true">✓ </span>}
                  {timeFormat.format(new Date(showtime.startsAt))}
                </button>
              );
            })}
          </div>
        </>
      )}
    </article>
  );
};
