import { buildIcsSingleEvent } from '../../../ingest/src/ics.js';
import type { Cinema, Movie, Showtime } from '../../../ingest/src/types.js';

/** Génère le .ics d'une séance (implémentation partagée et testée dans ingest) et le télécharge. */
export function downloadShowtimeIcs(cinema: Cinema, movie: Movie, showtime: Showtime): void {
  const ics = buildIcsSingleEvent(cinema, movie, showtime, new Date());
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${showtime.id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

/** URL d'abonnement au flux calendrier d'un cinéma (webcal:// est compris par Apple/Outlook ; Google accepte l'URL https). */
export function cinemaFeedUrls(cinemaId: string): { webcal: string; https: string } {
  const path = `${import.meta.env.BASE_URL}calendar/${cinemaId}.ics`;
  return {
    webcal: `webcal://${window.location.host}${path}`,
    https: `${window.location.origin}${path}`,
  };
}
