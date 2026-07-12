import type { Cinema, Movie, Showtime } from '../../types.js';

/**
 * Source de rattrapage : la billetterie cotecine du Scala.
 *
 * La page « programmation » TYPO3 (source primaire) laisse parfois tomber un film
 * encore à l'affiche : elle ne renvoie qu'une fenêtre glissante d'uid récents, si
 * bien qu'un film peut en sortir alors qu'il a encore des séances à venir (observé
 * en 2026-07 avec « In Waves » : réservable mais absent du flux). La billetterie,
 * elle, est la vérité sur ce qui est réservable. On l'utilise donc pour compléter :
 * on ajoute les films réservables que la source primaire ne couvre pas.
 *
 * L'API n'est pas documentée mais stable (formulaire `relatedSelects`) :
 * - page /reserver/            → <select name="modresa_film"> : id + titre par film ;
 * - /reserver/ajax/?modresa_film=<id>                 → { "YYYY-MM-DD": "libellé", … } ;
 * - /reserver/ajax/?modresa_film=<id>&modresa_jour=<j> → { "<ts>/<version>/<seanceId>": "19h30 - VF", … }.
 */

const RESERVER_URL = 'https://www.thionville-scala-vad.cotecine.fr/reserver/';
const AJAX_URL = 'https://www.thionville-scala-vad.cotecine.fr/reserver/ajax/';
const USER_AGENT = 'planplan-ingest/0.1 (projet perso non commercial)';
const REQUEST_DELAY_MS = 400; // politesse : on ne martèle pas la billetterie
const DEFAULT_DURATION_MINUTES = 120; // la billetterie ne donne pas la durée

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
};

/** Décode les entités HTML numériques (`&#233;`, `&#xE9;`) et nommées courantes. */
export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

export type CotecineFilm = { id: string; title: string };

/** Extrait `{ id, title }` des <option> du menu déroulant des films (hors option vide). */
export function parseFilmOptions(html: string): CotecineFilm[] {
  const films: CotecineFilm[] = [];
  for (const match of html.matchAll(/<option value="(\d+)">([^<]*)<\/option>/g)) {
    const id = match[1];
    const rawTitle = match[2];
    if (!id || rawTitle === undefined) continue;
    const title = decodeHtmlEntities(rawTitle).trim();
    if (title) films.push({ id, title });
  }
  return films;
}

/**
 * Titre → forme canonique pour rapprocher deux sources : casse, accents, ponctuation
 * et suffixe d'année ignorés. « Barry Lyndon (1975) » ≡ « Barry Lyndon » (le Scala
 * expose parfois une reprise en doublon dans la billetterie).
 */
export function normalizeTitleForMatch(title: string): string {
  return decodeHtmlEntities(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(\d{4}\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export type ParsedSeance = { seanceId: string; startsAtMs: number; version?: string };

/** Clé cotecine `1783963800/VF/270215` → { startsAtMs, version, seanceId }, ou null si illisible. */
export function parseSeanceKey(key: string): ParsedSeance | null {
  const match = /^(\d+)\/([^/]*)\/(\d+)$/.exec(key);
  if (!match) return null;
  const [, ts, version, seanceId] = match;
  if (!ts || !seanceId) return null;
  const seconds = Number(ts);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return { startsAtMs: seconds * 1000, seanceId, ...(version ? { version } : {}) };
}

async function fetchAjaxKeys(url: string): Promise<string[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'X-Requested-With': 'XMLHttpRequest', Referer: RESERVER_URL },
  });
  if (!res.ok) throw new Error(`cotecine : HTTP ${res.status} sur ${url}`);
  // En cas d'erreur applicative la billetterie renvoie « oups » (non-JSON) → on l'ignore.
  try {
    const data: unknown = JSON.parse(await res.text());
    return data && typeof data === 'object' ? Object.keys(data as Record<string, unknown>) : [];
  } catch {
    return [];
  }
}

async function fetchFilms(): Promise<CotecineFilm[]> {
  const res = await fetch(RESERVER_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`cotecine : HTTP ${res.status} sur la page réservation`);
  // La page est servie en iso-8859-1 ; les titres passent par des entités HTML de toute façon.
  const html = Buffer.from(await res.arrayBuffer()).toString('latin1');
  return parseFilmOptions(html);
}

/**
 * Films réservables que la source primaire ne fournit pas, normalisés au modèle Movie
 * (métadonnées minimales : ni affiche ni genre — la billetterie ne les expose pas).
 * `isCoveredByPrimary` évite de re-télécharger les séances des films déjà couverts.
 */
export async function fetchCotecineRescues(
  cinema: Cinema,
  now: Date,
  isCoveredByPrimary: (title: string) => boolean,
): Promise<Movie[]> {
  const films = await fetchFilms();
  const rescued: Movie[] = [];

  for (const film of films) {
    if (isCoveredByPrimary(film.title)) continue; // TYPO3 le fournit déjà, en plus riche

    await sleep(REQUEST_DELAY_MS);
    const days = await fetchAjaxKeys(`${AJAX_URL}?modresa_film=${film.id}`);

    const movieId = `${cinema.id}-cot-${film.id}`;
    const showtimes: Showtime[] = [];
    // ⚠ Le `seanceId` de la clé (ex. 270215) n'est PAS unique : la billetterie le
    // réutilise sur plusieurs jours/horaires (c'est un id de copie/VAD, pas de séance).
    // La vraie identité d'une séance est son instant → on déduplique par timestamp.
    const seenStarts = new Set<number>();
    let version: string | undefined;

    for (const day of days) {
      await sleep(REQUEST_DELAY_MS);
      const keys = await fetchAjaxKeys(`${AJAX_URL}?modresa_film=${film.id}&modresa_jour=${day}`);
      for (const key of keys) {
        const parsed = parseSeanceKey(key);
        if (!parsed || parsed.startsAtMs < now.getTime()) continue;
        if (seenStarts.has(parsed.startsAtMs)) continue;
        seenStarts.add(parsed.startsAtMs);
        version ??= parsed.version;
        showtimes.push({
          id: `${movieId}-${Math.floor(parsed.startsAtMs / 1000)}`,
          movieId,
          cinemaId: cinema.id,
          startsAt: new Date(parsed.startsAtMs).toISOString(),
          endsAtEstimate: new Date(parsed.startsAtMs + DEFAULT_DURATION_MINUTES * 60_000).toISOString(),
        });
      }
    }

    if (showtimes.length === 0) continue;
    showtimes.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    rescued.push({
      id: movieId,
      cinemaId: cinema.id,
      title: film.title,
      genres: [],
      showtimes,
      ...(version ? { version } : {}),
      ...(cinema.bookingUrl ? { bookingUrl: cinema.bookingUrl } : {}),
    });
  }

  return rescued;
}
