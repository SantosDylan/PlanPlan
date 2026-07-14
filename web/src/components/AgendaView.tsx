import type { FC } from 'react';
import type { Cinema, Movie, Showtime } from '../../../ingest/src/types.js';
import { css } from '#styled-system/css';
import { dayKeyOf, formatDayHeading, formatTime } from '#src/lib/datetime.js';
import { buildAgendaByDay, seanceCountLabel } from '#src/lib/showtimes.js';
import { Poster } from './Poster.js';

const dayHeaderClass = css({
  position: 'sticky',
  top: '0',
  zIndex: '1',
  bg: 'ink',
  display: 'flex',
  alignItems: 'baseline',
  gap: '2',
  py: '2',
});

const rowClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  py: '2.5',
  borderTop: '1px solid',
  borderColor: 'hairline',
});

type AgendaViewProps = {
  movies: Movie[];
  cinemas: Cinema[];
  isAdded: (showtimeId: string) => boolean;
  onAddShowtime: (cinema: Cinema, movie: Movie, showtime: Showtime) => void;
};

/** Vue « temps d'abord » : toutes les séances de tous les films, chronologiques par jour. */
export const AgendaView: FC<AgendaViewProps> = ({ movies, cinemas, isAdded, onAddShowtime }) => {
  const todayKey = dayKeyOf(new Date().toISOString());
  const days = buildAgendaByDay(movies, cinemas);

  if (days.length === 0) {
    return (
      <p className={css({ color: 'paperMuted', fontSize: 'sm', textAlign: 'center', py: '8', m: '0' })}>
        Aucune séance à venir.
      </p>
    );
  }

  return (
    <div className={css({ display: 'flex', flexDir: 'column' })}>
      {days.map((day) => (
        <div key={day.dayKey}>
          <div className={dayHeaderClass}>
            <h2 className={css({ fontSize: 'sm', fontWeight: 'bold', color: 'paper', m: '0' })}>
              {formatDayHeading(day.entries[0]!.showtime.startsAt, todayKey)}
            </h2>
            <span className={css({ fontSize: 'xs', color: 'paperFaint' })}>{seanceCountLabel(day.entries.length)}</span>
          </div>

          {day.entries.map(({ showtime, movie, cinema }) => {
            const added = isAdded(showtime.id);
            const versionGenre = [movie.version?.trim(), movie.genres[0]].filter(Boolean).join(' · ');
            return (
              <div key={showtime.id} className={rowClass}>
                <span className={css({ fontSize: 'md', fontWeight: 'bold', color: 'paper', w: '52px', flexShrink: '0' })}>
                  {formatTime(showtime.startsAt)}
                </span>
                <Poster
                  title={movie.title}
                  posterUrl={movie.posterUrl}
                  className={css({ w: '38px', h: '54px', flexShrink: '0', rounded: 'thumb', objectFit: 'cover' })}
                />
                <div className={css({ flex: '1', minW: '0' })}>
                  <p
                    className={css({
                      fontSize: 'sm',
                      fontWeight: 'semibold',
                      color: 'paper',
                      m: '0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    })}
                  >
                    {movie.title}
                  </p>
                  {versionGenre && <p className={css({ fontSize: 'xs', color: 'paperFaint', m: '0', mt: '0.5' })}>{versionGenre}</p>}
                </div>
                <button
                  type="button"
                  aria-label={`Ajouter la séance de ${movie.title} le ${formatDayHeading(showtime.startsAt, todayKey)} à ${formatTime(showtime.startsAt)} à mon agenda`}
                  aria-pressed={added}
                  onClick={() => onAddShowtime(cinema, movie, showtime)}
                  className={css({
                    w: '34px',
                    h: '34px',
                    flexShrink: '0',
                    rounded: 'full',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'md',
                    fontWeight: 'semibold',
                    cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: added ? 'accent' : 'borderStrong',
                    bg: added ? 'accent' : 'transparent',
                    color: added ? 'accentText' : 'accent',
                  })}
                >
                  <span aria-hidden="true">{added ? '✓' : '+'}</span>
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
