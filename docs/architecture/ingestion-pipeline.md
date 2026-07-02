# Pipeline d'ingestion

## Contrat : SourceAdapter

Chaque cinéma est branché derrière la même interface — c'est **la** frontière d'extensibilité du projet (ADR-002) :

```ts
interface SourceAdapter {
  cinema: Cinema;                    // métadonnées statiques (id, nom, ville, url billetterie)
  fetchProgram(): Promise<Movie[]>;  // programmation normalisée, séances futures uniquement
}
```

Ajouter un cinéma = écrire un adapter (fetch + schéma zod + normalize) et l'ajouter à la liste dans `index.ts`. Rien d'autre ne change.

## Modèle normalisé

```ts
type Catalog = {
  generatedAt: string;      // ISO8601 — affiché sur le site (métrique fraîcheur)
  cinemas: Cinema[];
  movies: Movie[];
};

type Movie = {
  id: string;               // `${cinemaId}-${uidSource}`
  cinemaId: string;
  title: string;
  director?: string;
  genres: string[];
  durationMinutes?: number; // parsé depuis "1h 7m" — requis pour le DTEND des .ics
  synopsis?: string;
  posterUrl?: string;
  version?: string;         // "VF" | "VOST" (champ `langues` TYPO3)
  releaseYear?: number;
  tmdbId?: string;          // enrichissement TMDB possible post-POC
  bookingUrl?: string;
  showtimes: Showtime[];    // triées, futures uniquement
};

type Showtime = {
  id: string;               // `${cinemaId}-${uidSeance}`
  movieId: string;
  cinemaId: string;
  startsAt: string;         // ISO8601 avec offset, tel que fourni par la source
  endsAtEstimate: string;   // startsAt + durationMinutes (défaut 120 min si durée inconnue)
};
```

Corrections vs le schéma §5 du handoff : `duration` devient `durationMinutes` (un `.ics` exige une heure de fin), ajout de `version` VF/VOST (présent dans la source, absent du handoff, et 1er filtre demandé dans l'étude La Bobine), ajout de `cinemaId` partout.

## Étapes de l'adapter Scala (TYPO3)

1. **Fetch paginé** — GET page 1, lire `nb_results` et `resultsPerPage`, boucler `tx_cimsearchelastic_displaysearch[page]=2..N` (voir `docs/solutions/typo3-scala-endpoint.md` pour la référence complète). Délai 1,5 s entre requêtes, User-Agent `planplan-ingest/x.y (+repo url)`.
2. **Validation zod** (`schema.ts`) — schéma volontairement minimal : seuls les champs consommés sont déclarés, le reste passe en `passthrough`. Une séance sans `start` (observé en réel !) est ignorée avec un warning, pas une erreur fatale. Un film sans `uid`/`title` fait échouer le run (donnée inutilisable = mieux vaut garder l'ancien catalog que publier du vide).
3. **Normalisation** (`normalize.ts`) — parsing durée `"1h 7m"` → 67 ; poster : préfixer `identifier` par `https://www.thionville.fr/fileadmin` ; dédup des films par `uid` entre pages.
4. **Filtrage temporel** — ne garder que `startsAt >= now` ; jeter les films sans séance future. La source renvoie l'historique complet (vérifié : séances du 10 juin retournées le 2 juillet) et son index contient ~45 films dont la plupart ne sont plus à l'affiche.

## Orchestrateur (`index.ts`)

- Exécute chaque adapter ; si **tous** échouent → exit 1 (le cron ne commit rien, l'ancien catalog reste en ligne, le run rouge sert d'alerte).
- Si un adapter échoue parmi plusieurs (futur multi-cinémas) → log + on publie les autres.
- Écrit `web/public/data/catalog.json` et un flux `web/public/calendar/<cinemaId>.ics` par cinéma.

## Flux .ics (généré à l'ingestion)

- Un VEVENT par séance future : `UID <showtime.id>@planplan`, `DTSTART;TZID=Europe/Paris`, `DTEND` = `endsAtEstimate`, `SUMMARY` = titre (+ version), `DESCRIPTION` = synopsis tronqué + lien billetterie, `URL` = billetterie.
- `VTIMEZONE` Europe/Paris embarqué (DST correct chez tous les clients calendrier).
- Les UID stables permettent aux clients abonnés de mettre à jour/supprimer proprement les événements quand la programmation change.

## Planification

Cron GitHub Actions 2×/jour (08h et 18h Europe/Paris ≈ `0 6,16 * * *` UTC). Le handoff proposait 1-6 h : inutile, la programmation change ~1×/semaine (mercredi) — 2×/jour couvre les annulations sans charger le site. Caveat connu : GitHub désactive les crons après 60 jours sans activité sur le repo (un push relance).
