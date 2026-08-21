import { CalendarPlusIcon } from '@phosphor-icons/react';
import { useEffect, useState, type FC } from 'react';
import type { Cinema, Movie, Showtime } from '../../../ingest/src/types.js';
import { css } from '#styled-system/css';
import { formatDayLabel, formatDayTab, formatDuration, formatTime } from '#src/lib/datetime.js';
import { groupShowtimesByDay, seanceCountLabel } from '#src/lib/showtimes.js';
import type { MovieWithCinema } from './GridView.js';
import { Poster } from './Poster.js';
import { Sheet } from './Sheet.js';

type MovieSheetProps = {
  entry: MovieWithCinema | null;
  onClose: () => void;
  isAdded: (showtimeId: string) => boolean;
  onAddShowtime: (cinema: Cinema, movie: Movie, showtime: Showtime) => void;
  onAddMovie: (cinema: Cinema, movie: Movie) => void;
};

/** Fiche détail en bottom-sheet, ouverte depuis une affiche de la Grille. */
export const MovieSheet: FC<MovieSheetProps> = ({ entry, onClose, isAdded, onAddShowtime, onAddMovie }) => {
  const [lastEntry, setLastEntry] = useState<MovieWithCinema | null>(entry);

  // Le contenu affiché suit le dernier film ouvert, pas `entry` directement : `entry` retombe à
  // `null` au moment de la fermeture, mais la sheet doit continuer d'afficher ce film pendant
  // l'animation de sortie.
  useEffect(() => {
    if (entry) setLastEntry(entry);
  }, [entry]);

  // La sheet reste montée en permanence, fermée : elle doit survivre à sa propre fermeture pour
  // l'animation de sortie, et la monter déjà ouverte lui ferait sauter son animation d'entrée.
  return (
    <Sheet open={entry !== null} onOpenChange={(isOpen) => !isOpen && onClose()} title={lastEntry?.movie.title ?? ''} peek>
      {lastEntry && (
        // `key` : changer de film repart du premier jour, sans effet de synchronisation.
        <MovieDetails
          key={lastEntry.movie.id}
          entry={lastEntry}
          isAdded={isAdded}
          onAddShowtime={onAddShowtime}
          onAddMovie={onAddMovie}
        />
      )}
    </Sheet>
  );
};

type MovieDetailsProps = {
  entry: MovieWithCinema;
} & Pick<MovieSheetProps, 'isAdded' | 'onAddShowtime' | 'onAddMovie'>;

const MovieDetails: FC<MovieDetailsProps> = ({ entry, isAdded, onAddShowtime, onAddMovie }) => {
  const { movie, cinema } = entry;
  const dayGroups = groupShowtimesByDay(movie.showtimes);
  const [selectedDayKey, setSelectedDayKey] = useState<string | undefined>(dayGroups[0]?.[0]);
  const activeGroup = dayGroups.find(([key]) => key === selectedDayKey) ?? dayGroups[0];

  const meta = [
    movie.director,
    movie.durationMinutes !== undefined ? formatDuration(movie.durationMinutes) : undefined,
    movie.genres.length > 0 ? movie.genres.join(', ') : undefined,
    movie.releaseYear !== undefined ? String(movie.releaseYear) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div className={css({ display: 'flex', gap: '4' })}>
        <Poster
          title={movie.title}
          posterUrl={movie.posterUrl}
          className={css({ w: '84px', h: '120px', flexShrink: '0', rounded: 'poster', objectFit: 'cover' })}
        />
        <div className={css({ minW: '0', display: 'flex', flexDir: 'column', gap: '2' })}>
          {movie.version && (
            <span
              className={css({
                alignSelf: 'flex-start',
                fontFamily: 'mono',
                fontSize: '2xs',
                color: 'paperMuted',
                border: '1px solid',
                borderColor: 'borderStrong',
                px: '1.5',
                py: '0.5',
                rounded: 'md',
              })}
            >
              {movie.version}
            </span>
          )}
          {meta && <p className={css({ fontSize: 'xs', color: 'paperFaint', m: '0' })}>{meta}</p>}
        </div>
      </div>

      {movie.synopsis && <p className={css({ fontSize: 'sm', color: 'paperBody', lineHeight: '1.5', m: '0' })}>{movie.synopsis}</p>}

      <button
        type="button"
        onClick={() => onAddMovie(cinema, movie)}
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2',
          w: 'full',
          py: '3',
          rounded: 'button',
          border: 'none',
          bg: 'accent',
          color: 'accentText',
          fontSize: 'sm',
          fontWeight: 'semibold',
          cursor: 'pointer',
        })}
      >
        <CalendarPlusIcon size={18} />
        Suivre les {seanceCountLabel(movie.showtimes.length)}
      </button>
      <p className={css({ fontSize: '2xs', color: 'paperFaint', textAlign: 'center', m: '0' })}>
        Ajoute toutes les dates du film à ton agenda en un seul .ics
      </p>

      {activeGroup && (
        <>
          <div className={css({ borderTop: '1px solid', borderColor: 'hairline' })} />
          <span
            className={css({
              fontSize: '2xs',
              fontWeight: 'semibold',
              letterSpacing: 'wide',
              textTransform: 'uppercase',
              color: 'paperFaint',
            })}
          >
            Ou choisir un jour
          </span>

          <div
            role="tablist"
            aria-label={`Choisir un jour pour ${movie.title}`}
            className={css({ display: 'flex', gap: '2', overflowX: 'auto', pb: '0.5' })}
          >
            {dayGroups.map(([key, dayShowtimes]) => {
              const active = key === selectedDayKey;
              const { name, number } = formatDayTab(dayShowtimes[0]!.startsAt);
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedDayKey(key)}
                  className={css({
                    flexShrink: '0',
                    minW: '52px',
                    px: '1.5',
                    py: '2',
                    display: 'flex',
                    flexDir: 'column',
                    alignItems: 'center',
                    gap: '0.5',
                    rounded: 'chip',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: active ? 'accent' : 'borderStrong',
                    bg: active ? 'accent' : 'surface',
                  })}
                >
                  <span className={css({ fontSize: '2xs', color: active ? 'accentText' : 'paperFaint' })}>{name}</span>
                  <span className={css({ fontSize: 'md', fontWeight: 'bold', color: active ? 'accentText' : 'paper' })}>{number}</span>
                </button>
              );
            })}
          </div>

          <span className={css({ fontSize: 'xs', color: 'paperFaint', textTransform: 'capitalize' })}>
            {formatDayLabel(activeGroup[1][0]!.startsAt)}
          </span>
          <div className={css({ display: 'flex', gap: '2', flexWrap: 'wrap' })}>
            {activeGroup[1].map((showtime) => {
              const added = isAdded(showtime.id);
              return (
                <button
                  key={showtime.id}
                  type="button"
                  aria-label={`Ajouter la séance de ${movie.title} du ${formatDayLabel(showtime.startsAt)} à ${formatTime(showtime.startsAt)} à mon calendrier`}
                  onClick={() => onAddShowtime(cinema, movie, showtime)}
                  className={css({
                    fontSize: 'sm',
                    fontWeight: added ? 'bold' : 'semibold',
                    rounded: 'chip',
                    px: '3.5',
                    py: '2',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: added ? 'accent' : 'borderStrong',
                    bg: added ? 'accent' : 'surface',
                    color: added ? 'accentText' : 'paper',
                  })}
                >
                  {added && <span aria-hidden="true">✓ </span>}
                  {formatTime(showtime.startsAt)}
                </button>
              );
            })}
          </div>
          <span className={css({ fontSize: '2xs', color: 'paperFaint', textAlign: 'center' })}>
            Un tap télécharge la séance (.ics) dans ton agenda
          </span>
        </>
      )}
    </>
  );
};
