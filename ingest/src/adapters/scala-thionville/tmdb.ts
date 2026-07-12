import type { Movie } from '../../types.js';
import { normalizeTitleForMatch } from './cotecine.js';

/**
 * Enrichissement TMDB des films rattrapés par la billetterie (cf. cotecine.ts).
 *
 * La billetterie ne donne ni affiche, ni genre, ni synopsis. On les récupère sur
 * TMDB par recherche titre — mais un titre est ambigu (« In Waves » → 20 résultats).
 * Garde-fou anti-mauvaise-affiche : on n'accepte qu'un résultat au titre STRICTEMENT
 * identique et pourvu d'une affiche ; entre plusieurs, on prend celui dont l'année de
 * sortie colle à l'année des séances (gère les reprises), sinon le plus populaire.
 *
 * Sans TMDB_API_KEY dans l'environnement, l'enrichissement est simplement sauté :
 * l'ingestion reste verte et les films rattrapés gardent leur carte placeholder.
 */

const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const USER_AGENT = 'planplan-ingest/0.1 (projet perso non commercial)';
const REQUEST_DELAY_MS = 300;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parisYearFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric' });

export type TmdbResult = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
  overview?: string;
  popularity?: number;
};

/**
 * Meilleur résultat TMDB pour un film donné, ou null si aucun ne passe le garde-fou.
 * Pur (aucun réseau) → testable directement.
 */
export function pickBestMatch(results: TmdbResult[], title: string, seanceYear: number): TmdbResult | null {
  const target = normalizeTitleForMatch(title);
  const candidates = results.filter((r) => normalizeTitleForMatch(r.title) === target && r.poster_path);
  if (candidates.length === 0) return null;

  const sameYear = candidates.find((r) => r.release_date?.slice(0, 4) === String(seanceYear));
  if (sameYear) return sameYear;

  return candidates.reduce((best, r) => ((r.popularity ?? 0) > (best.popularity ?? 0) ? r : best));
}

async function fetchTmdb(path: string, apiKey: string): Promise<unknown> {
  const separator = path.includes('?') ? '&' : '?';
  const res = await fetch(`${API_BASE}${path}${separator}api_key=${apiKey}`, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`TMDB : HTTP ${res.status} sur ${path}`);
  return res.json();
}

async function fetchGenreMap(apiKey: string): Promise<Map<number, string>> {
  const data = (await fetchTmdb('/genre/movie/list?language=fr-FR', apiKey)) as { genres?: { id: number; name: string }[] };
  return new Map((data.genres ?? []).map((g) => [g.id, g.name]));
}

async function searchMovie(title: string, apiKey: string): Promise<TmdbResult[]> {
  const query = encodeURIComponent(title);
  const data = (await fetchTmdb(`/search/movie?language=fr-FR&query=${query}`, apiKey)) as { results?: TmdbResult[] };
  return data.results ?? [];
}

function seanceYearOf(movie: Movie): number {
  const first = movie.showtimes[0]?.startsAt;
  return first ? Number(parisYearFormat.format(new Date(first))) : Number.NaN;
}

function enrich(movie: Movie, match: TmdbResult, genreMap: Map<number, string>): Movie {
  const genres = (match.genre_ids ?? []).map((id) => genreMap.get(id)).filter((name): name is string => Boolean(name));
  const releaseYear = match.release_date ? Number(match.release_date.slice(0, 4)) : Number.NaN;
  const overview = match.overview?.trim();
  return {
    ...movie,
    tmdbId: String(match.id),
    ...(match.poster_path ? { posterUrl: `${IMAGE_BASE}${match.poster_path}` } : {}),
    ...(genres.length > 0 ? { genres } : {}),
    ...(overview ? { synopsis: overview } : {}),
    ...(Number.isFinite(releaseYear) ? { releaseYear } : {}),
  };
}

/**
 * Complète les films dépourvus d'affiche avec les métadonnées TMDB (affiche, genres,
 * synopsis, année). Best-effort : sans clé, ou si un film ne matche pas / échoue, il
 * est renvoyé inchangé (placeholder). Les films déjà pourvus d'une affiche sont ignorés.
 */
export async function enrichMoviesWithTmdb(movies: Movie[]): Promise<Movie[]> {
  const toEnrich = movies.filter((m) => !m.posterUrl);
  if (toEnrich.length === 0) return movies;

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.warn(`⚠ TMDB_API_KEY absente — ${toEnrich.length} film(s) rattrapé(s) sans affiche (placeholder).`);
    return movies;
  }

  let genreMap: Map<number, string>;
  try {
    genreMap = await fetchGenreMap(apiKey);
  } catch (error) {
    console.warn('⚠ TMDB : liste des genres indisponible — enrichissement sauté', error);
    return movies;
  }

  const enrichedById = new Map<string, Movie>();
  for (const movie of toEnrich) {
    try {
      await sleep(REQUEST_DELAY_MS);
      const match = pickBestMatch(await searchMovie(movie.title, apiKey), movie.title, seanceYearOf(movie));
      if (match) enrichedById.set(movie.id, enrich(movie, match, genreMap));
    } catch (error) {
      console.warn(`⚠ TMDB : enrichissement de « ${movie.title} » échoué — placeholder conservé`, error);
    }
  }

  const enrichedCount = enrichedById.size;
  if (enrichedCount > 0) console.log(`  ↳ TMDB : ${enrichedCount}/${toEnrich.length} film(s) rattrapé(s) enrichi(s) (affiche + genres)`);
  return movies.map((m) => enrichedById.get(m.id) ?? m);
}
