/**
 * Modèle normalisé partagé (source de vérité unique).
 * Le front importe ces types en type-only import — ne pas ajouter de code runtime ici.
 */

export type Cinema = {
  id: string;
  name: string;
  city: string;
  /** Lien billetterie générique du cinéma (deep-link par séance : hors POC, cf. ADR/review). */
  bookingUrl?: string;
  website?: string;
};

export type Showtime = {
  /** `${cinemaId}-${uidSeance}` — stable, sert d'UID iCalendar. */
  id: string;
  movieId: string;
  cinemaId: string;
  /** ISO8601 avec offset, tel que fourni par la source. */
  startsAt: string;
  /** startsAt + durationMinutes (défaut 120 min) — requis pour le DTEND des .ics. */
  endsAtEstimate: string;
};

export type Movie = {
  /** `${cinemaId}-${uidSource}` */
  id: string;
  cinemaId: string;
  title: string;
  director?: string;
  genres: string[];
  durationMinutes?: number;
  synopsis?: string;
  posterUrl?: string;
  /** "VF" | "VOST" (libre : dépend de la source). */
  version?: string;
  releaseYear?: number;
  tmdbId?: string;
  bookingUrl?: string;
  /** Séances futures uniquement, triées par date croissante. */
  showtimes: Showtime[];
};

export type Catalog = {
  /** Date de génération — affichée sur le site (métrique fraîcheur). */
  generatedAt: string;
  cinemas: Cinema[];
  movies: Movie[];
};
