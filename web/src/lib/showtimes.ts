import type { Cinema, Movie, Showtime } from '../../../ingest/src/types.js';
import { dayKeyOf, formatDayNumber, formatWeekdayShort } from './datetime.js';

export type AgendaEntry = { showtime: Showtime; movie: Movie; cinema: Cinema };
export type AgendaDay = { dayKey: string; entries: AgendaEntry[] };

/** Les séances arrivent triées de l'ingestion → l'ordre d'insertion des groupes est chronologique. */
export function groupShowtimesByDay(showtimes: Showtime[]): [string, Showtime[]][] {
  const groups = new Map<string, Showtime[]>();
  for (const showtime of showtimes) {
    const key = dayKeyOf(showtime.startsAt);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(showtime);
    } else {
      groups.set(key, [showtime]);
    }
  }
  return [...groups.entries()];
}

export function seanceCountLabel(count: number): string {
  return count > 1 ? `${count} séances` : `${count} séance`;
}

/** « auj. » ou « dès mer. 15 » selon que la prochaine séance tombe aujourd'hui, suivi du décompte. */
export function nextShowtimeShort(showtimes: Showtime[], todayKey: string): string {
  const first = showtimes[0];
  if (!first) return '';
  const key = dayKeyOf(first.startsAt);
  const when = key === todayKey ? 'auj.' : `dès ${formatWeekdayShort(first.startsAt)} ${formatDayNumber(first.startsAt)}`;
  return `${when} · ${seanceCountLabel(showtimes.length)}`;
}

/**
 * Aplatit toutes les séances de tous les films en lignes chronologiques groupées par jour.
 * Le flatten entrelace les films : un tri global par `startsAt` est nécessaire avant le groupement.
 */
export function buildAgendaByDay(movies: Movie[], cinemas: Cinema[]): AgendaDay[] {
  const cinemaById = new Map(cinemas.map((cinema) => [cinema.id, cinema]));
  const entries: AgendaEntry[] = [];
  for (const movie of movies) {
    const cinema = cinemaById.get(movie.cinemaId);
    if (!cinema) continue;
    for (const showtime of movie.showtimes) {
      entries.push({ showtime, movie, cinema });
    }
  }
  entries.sort((a, b) => new Date(a.showtime.startsAt).getTime() - new Date(b.showtime.startsAt).getTime());

  const groups = new Map<string, AgendaEntry[]>();
  for (const entry of entries) {
    const key = dayKeyOf(entry.showtime.startsAt);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }
  return [...groups.entries()].map(([dayKey, dayEntries]) => ({ dayKey, entries: dayEntries }));
}
