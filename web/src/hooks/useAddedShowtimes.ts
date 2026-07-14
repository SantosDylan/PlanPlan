import { useState } from 'react';
import type { Cinema, Movie, Showtime } from '../../../ingest/src/types.js';
import { formatTime } from '../lib/datetime.js';
import { downloadMovieIcs, downloadShowtimeIcs } from '../lib/calendar.js';
import { seanceCountLabel } from '../lib/showtimes.js';
import { useToast } from '../context/ToastContext.js';

/**
 * État partagé « séance ajoutée à l'agenda », consommé à la fois par la Grille (fiche détail)
 * et l'Agenda — une séance ajoutée depuis l'une doit apparaître ✓ dans l'autre.
 */
export function useAddedShowtimes() {
  const { showToast } = useToast();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const isAdded = (showtimeId: string) => addedIds.has(showtimeId);

  const addShowtime = (cinema: Cinema, movie: Movie, showtime: Showtime) => {
    downloadShowtimeIcs(cinema, movie, showtime);
    setAddedIds((current) => new Set(current).add(showtime.id));
    showToast(`✓ Ajouté à ton agenda (${formatTime(showtime.startsAt)})`);
  };

  const addMovie = (cinema: Cinema, movie: Movie) => {
    downloadMovieIcs(cinema, movie);
    setAddedIds((current) => {
      const next = new Set(current);
      for (const showtime of movie.showtimes) next.add(showtime.id);
      return next;
    });
    showToast(`✓ ${seanceCountLabel(movie.showtimes.length)} ajoutées à ton agenda`);
  };

  return { isAdded, addShowtime, addMovie };
}
