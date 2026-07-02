# Architecture frontend

## Stack

Vite + React 19 + TypeScript + Panda CSS + TanStack Query. Build statique servi par GitHub Pages.

## Chargement des données

Une seule source : `useQuery` sur `${import.meta.env.BASE_URL}data/catalog.json`.

```ts
const useCatalog = () =>
  useQuery({
    queryKey: ['catalog'],
    queryFn: fetchCatalog,       // fetch + cast Catalog (types partagés avec ingest)
    staleTime: 60 * 60 * 1000,   // le fichier change 2×/jour, inutile de refetch agressivement
  });
```

TanStack Query est volontairement sous-exploité au POC (une seule query) — il est là pour la suite (multi-cinémas, éventuelles vraies APIs) et pour les devtools. Pas de cache persistant, pas de mutations.

Les types `Catalog`/`Movie`/`Showtime` sont importés depuis `ingest/src/types.ts` (source de vérité unique, top-down — pas de types réécrits côté web).

## Pages / composants (POC)

```
App
└── MoviesPage               // liste des films à l'affiche
    ├── CatalogFreshness     // "Programmation mise à jour il y a Xh" (métrique fraîcheur)
    ├── MovieCard            // affiche, titre, durée, genres, version VF/VOST, synopsis
    │   └── ShowtimeChip[]   // une séance : date/heure + bouton "→ calendrier"
    └── SubscribeBanner      // lien webcal:// vers le flux .ics du cinéma
```

Pas de router au POC (une seule vue). Si une fiche film par URL devient utile (partage, SEO), ajouter TanStack Router à ce moment-là, pas avant.

## Ajout au calendrier

- **Par séance** : génération client-side d'un `.ics` mono-événement (même helper de formatage que l'ingest, ~30 lignes pures dans `web/src/lib/ics.ts`) téléchargé via Blob — zéro requête serveur.
- **Abonnement** : lien `webcal://<host>/planplan/calendar/scala-thionville.ics` (flux pré-généré par l'ingestion). Google Calendar accepte aussi l'URL https directe.

## Panda CSS

- Tokens dans `panda.config.ts` (palette, spacing) — pas de valeurs en dur dans les composants.
- `css()`/patterns générés dans `styled-system/` (gitignoré, régénéré au `prepare`).

## Points d'attention

- **Base path GitHub Pages** : `base: '/PlanPlan/'` dans `vite.config.ts` (aligné sur le nom du repo). Toutes les URLs d'assets passent par `import.meta.env.BASE_URL`.
- **Posters** : hotlink direct vers `thionville.fr/fileadmin/...` au POC. Acceptable à cette échelle ; à ré-héberger si le projet s'ouvre (cf. avertissement légal étude La Bobine). Prévoir `onError` → placeholder.
- **`<html lang="fr">`** dès le départ (retour d'expérience La Bobine).
- **Dates** : affichage via `Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris' })` — pas de lib de dates au POC.
