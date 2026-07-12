import type { Cinema, Movie } from '../../types.js';
import type { SourceAdapter } from '../adapter.js';
import { rawMovieSchema, responseSchema, type RawMovie } from './schema.js';
import { normalizeMovie } from './normalize.js';
import { fetchCotecineRescues, normalizeTitleForMatch } from './cotecine.js';
import { enrichMoviesWithTmdb } from './tmdb.js';

const cinema: Cinema = {
  id: 'scala-thionville',
  name: 'La Scala',
  city: 'Thionville',
  bookingUrl: 'https://www.thionville-scala-vad.cotecine.fr/reserver/',
  website: 'https://www.thionville.fr/scala/programmation-cinema',
};

const ENDPOINT = 'https://www.thionville.fr/scala/programmation-cinema';
const BASE_PARAMS: Record<string, string> = {
  contentElements: '13',
  elementId: '352',
  no_cache: '1',
  'tx_cimsearchelastic_displaysearch[action]': 'scroll',
  'tx_cimsearchelastic_displaysearch[controller]': 'Listing',
  'tx_cimsearchelastic_displaysearch[format]': 'html',
  type: '99992',
};
const USER_AGENT = 'planplan-ingest/0.1 (projet perso non commercial)';
const PAGE_DELAY_MS = 1_500;
const MAX_PAGES = 20; // garde-fou : ~8 pages attendues, au-delà quelque chose cloche

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildPageUrl(page: number): string {
  const url = new URL(ENDPOINT);
  for (const [key, value] of Object.entries(BASE_PARAMS)) url.searchParams.set(key, value);
  url.searchParams.set('tx_cimsearchelastic_displaysearch[page]', String(page));
  return url.toString();
}

async function fetchPage(page: number) {
  const res = await fetch(buildPageUrl(page), { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`scala-thionville : HTTP ${res.status} sur la page ${page}`);
  return responseSchema.parse(await res.json());
}

export const scalaThionville: SourceAdapter = {
  cinema,
  async fetchProgram(): Promise<Movie[]> {
    const now = new Date();
    const first = await fetchPage(1);
    const totalPages = Math.min(Math.ceil(first.nb_results / first.resultsPerPage), MAX_PAGES);
    const rawItems = [...first.documents.movie];
    for (let page = 2; page <= totalPages; page += 1) {
      await sleep(PAGE_DELAY_MS);
      const pageMovies = (await fetchPage(page)).documents.movie;
      if (pageMovies.length === 0) break; // dernière page atteinte (nb_results surestime parfois)
      rawItems.push(...pageMovies);
    }

    // Dédup par uid : l'index peut bouger entre deux pages du scroll.
    const byUid = new Map<number, RawMovie>();
    for (const item of rawItems) {
      const movie = rawMovieSchema.parse(item);
      byUid.set(movie.uid, movie);
    }

    const primary = [...byUid.values()]
      .map((movie) => normalizeMovie(movie, cinema, now))
      .filter((movie): movie is Movie => movie !== null);

    // Rattrapage billetterie : la programmation TYPO3 laisse tomber des films encore
    // à l'affiche (cf. cotecine.ts). On complète avec les réservables qu'elle omet.
    // Best-effort : un échec du rattrapage ne doit pas priver le site de la programmation.
    const covered = new Set(primary.map((movie) => normalizeTitleForMatch(movie.title)));
    let rescues: Movie[] = [];
    try {
      rescues = await fetchCotecineRescues(cinema, now, (title) => covered.has(normalizeTitleForMatch(title)));
      if (rescues.length > 0) {
        console.log(`  ↳ billetterie : ${rescues.length} film(s) rattrapé(s) hors programmation (${rescues.map((m) => m.title).join(', ')})`);
        // La billetterie ne fournit pas d'affiche : on enrichit ces films via TMDB.
        rescues = await enrichMoviesWithTmdb(rescues);
      }
    } catch (error) {
      console.warn('⚠ rattrapage billetterie cotecine échoué — programmation TYPO3 conservée', error);
    }

    return [...primary, ...rescues].sort((a, b) =>
      (a.showtimes[0]?.startsAt ?? '').localeCompare(b.showtimes[0]?.startsAt ?? ''),
    );
  },
};
