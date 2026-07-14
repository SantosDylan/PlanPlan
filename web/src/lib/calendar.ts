import { buildIcsFeed, buildIcsSingleEvent } from '../../../ingest/src/ics.js';
import type { Cinema, Movie, Showtime } from '../../../ingest/src/types.js';

function downloadIcsFile(ics: string, filename: string): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Génère le .ics d'une séance (implémentation partagée et testée dans ingest) et le télécharge. */
export function downloadShowtimeIcs(cinema: Cinema, movie: Movie, showtime: Showtime): void {
  downloadIcsFile(buildIcsSingleEvent(cinema, movie, showtime, new Date()), `${showtime.id}.ics`);
}

/** Génère un .ics multi-événements couvrant toutes les séances du film et le télécharge. */
export function downloadMovieIcs(cinema: Cinema, movie: Movie): void {
  downloadIcsFile(buildIcsFeed(cinema, [movie], new Date()), `${movie.id}.ics`);
}

/** URL d'abonnement au flux calendrier d'un cinéma (webcal:// est compris par Apple/Outlook ; Google accepte l'URL https). */
export function cinemaFeedUrls(cinemaId: string): { webcal: string; https: string } {
  const path = `${import.meta.env.BASE_URL}calendar/${cinemaId}.ics`;
  return {
    webcal: `webcal://${window.location.host}${path}`,
    https: `${window.location.origin}${path}`,
  };
}
