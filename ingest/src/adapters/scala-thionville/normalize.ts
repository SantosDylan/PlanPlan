import type { Cinema, Movie, Showtime } from '../../types.js';
import { seanceSchema, type RawMovie } from './schema.js';

const FILE_BASE_URL = 'https://www.thionville.fr/fileadmin';
const DEFAULT_DURATION_MINUTES = 120;

/** "1h 7m" → 67 ; "2h" → 120 ; "45m" → 45 ; illisible ou nul ("0m", vu en réel) → undefined. */
export function parseDurationToMinutes(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined;
  const hours = /(\d+)\s*h/i.exec(raw);
  const minutes = /(\d+)\s*m/i.exec(raw);
  if (!hours && !minutes) return undefined;
  const total = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return total > 0 ? total : undefined;
}

/**
 * Film brut TYPO3 → Movie normalisé, séances futures uniquement.
 * Retourne null si le film n'a plus aucune séance à venir.
 *
 * ⚠ L'index TYPO3 ne contient PAS tout l'historique : c'est une fenêtre glissante
 * d'uid récents. Un film peut donc en disparaître alors qu'il a encore des séances
 * (constaté en 2026-07). Ce trou est comblé en aval par le rattrapage billetterie
 * (cf. cotecine.ts) ; ici on se contente d'écarter les films réellement épuisés.
 */
export function normalizeMovie(raw: RawMovie, cinema: Cinema, now: Date): Movie | null {
  const movieId = `${cinema.id}-${raw.uid}`;
  const durationMinutes = parseDurationToMinutes(raw.duration);

  const showtimes: Showtime[] = [];
  for (const item of raw.seances ?? []) {
    const parsed = seanceSchema.safeParse(item);
    if (!parsed.success) {
      console.warn(`⚠ ${movieId} : séance ignorée (champ manquant)`, JSON.stringify(item).slice(0, 120));
      continue;
    }
    const startMs = Date.parse(parsed.data.start);
    if (Number.isNaN(startMs)) {
      console.warn(`⚠ ${movieId} : séance ${parsed.data.uid} ignorée (date illisible : ${parsed.data.start})`);
      continue;
    }
    if (startMs < now.getTime()) continue;
    showtimes.push({
      id: `${cinema.id}-${parsed.data.uid}`,
      movieId,
      cinemaId: cinema.id,
      startsAt: parsed.data.start,
      endsAtEstimate: new Date(startMs + (durationMinutes ?? DEFAULT_DURATION_MINUTES) * 60_000).toISOString(),
    });
  }
  if (showtimes.length === 0) return null;
  showtimes.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const posterIdentifier = raw.pictureShow?.[0]?.originalResource?.originalFile?.identifier;
  const version = raw.langues?.[0]?.title;
  const bookingUrl = raw.billeterie ?? cinema.bookingUrl;

  return {
    id: movieId,
    cinemaId: cinema.id,
    title: raw.title,
    genres: (raw.genre ?? []).map((g) => g.title),
    showtimes,
    ...(raw.director ? { director: raw.director } : {}),
    ...(durationMinutes !== undefined ? { durationMinutes } : {}),
    ...(raw.synopsis ? { synopsis: raw.synopsis } : {}),
    ...(posterIdentifier ? { posterUrl: `${FILE_BASE_URL}${posterIdentifier}` } : {}),
    ...(version ? { version } : {}),
    ...(raw.releaseYear ? { releaseYear: raw.releaseYear } : {}),
    ...(raw.idTmdb ? { tmdbId: raw.idTmdb } : {}),
    ...(bookingUrl ? { bookingUrl } : {}),
  };
}
