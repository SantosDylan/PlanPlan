---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-brainstorm
execution: code
---

# Abonnement calendrier filtré par film - Plan

## Goal Capsule

- **Objectif** : permettre de choisir quels films suivre, et d'obtenir un `.ics` (Google/Apple/Outlook) contenant uniquement leurs séances — plutôt que de recevoir tout le programme du cinéma.
- **Autorité produit** : [STRATEGY.md](../../STRATEGY.md) (track "Expérience séances → calendrier"). **Révision (2026-07-03)** : après discussion, la feature reste 100 % statique — pas de dérogation à [ADR-001](../solutions/adr-001-static-first.md), pas de fonction serverless.
- **Blocages ouverts** : aucun — prêt pour `/ce-work`.
- **Product Contract preservation** : changé — Approche retenue, Comportement attendu, Hors scope, Hypothèses et Questions ouvertes révisés le 2026-07-03 pour abandonner l'abonnement live filtré (serverless) au profit d'un export `.ics` ponctuel côté client. Voir la note de révision dans le Goal Capsule.

## Product Contract

### Problème

La page actuelle n'offre qu'un abonnement "tout ou rien" par cinéma (un `.ics` statique contenant tous les films) ou un ajout séance-par-séance sans suivi automatique. Dylan (et ses proches) veulent suivre uniquement certains films dans la durée, sans polluer leur agenda avec le reste du programme.

### Utilisateurs

Primaire : Dylan et ses proches, spectateurs réguliers du Scala (Thionville) — inchangé par rapport à STRATEGY.md. Pas de notion de compte : chaque personne génère son propre lien à partir de sa propre sélection.

### Approche retenue

Export ponctuel généré côté client, 100 % statique — pas d'abonnement live filtré :

1. Une page dédiée "Gérer mon abonnement" liste tous les films du catalogue avec une case à cocher par film.
2. La sélection est mémorisée en `localStorage` (persiste entre les visites du même navigateur).
3. Un bouton génère et télécharge, entièrement côté navigateur, un fichier `.ics` contenant les séances de tous les films cochés — même mécanisme que le bouton "+📅" par séance déjà existant (`downloadShowtimeIcs`), étendu à plusieurs films en une fois.
4. Le flux "s'abonner à tout le programme" existant (par cinéma, statique, live) reste disponible tel quel pour qui le préfère.

Aucune dérogation à ADR-001 : pas de fonction serverless, pas de nouvel endpoint, pas de génération dynamique côté serveur.

### Comportement attendu

- Cocher/décocher un film met à jour immédiatement le nombre de séances que contiendra le fichier `.ics` généré (retour visuel avant téléchargement).
- Le bouton "Télécharger mon .ics" produit un fichier contenant l'ensemble des séances des films cochés, au moment du clic.
- Ce fichier est un **instantané** : il ne se met pas à jour tout seul. Pour capter de nouvelles séances (nouveau run de l'ingestion, films qui prolongent), l'utilisateur doit revenir sur la page et re-télécharger/ré-importer. La page doit rendre ce point explicite (ex. mention "à re-télécharger après chaque mise à jour du programme").
- Un film qui quitte l'affiche (absent du `catalog.json` courant) est simplement absent du prochain export — pas d'erreur, et sa case à cocher reste mémorisée si l'utilisateur veut le re-suivre plus tard.

### Hors scope (pour l'instant)

- Comptes utilisateurs ou authentification.
- Filtrage par critère autre que le film (genre, VF/VOST, jour...) — sélection film par film uniquement.
- Abonnement live qui se met à jour automatiquement dans le calendrier externe (nécessiterait une génération dynamique côté serveur) — écarté pour ce lot, à réévaluer seulement si l'usage réel du POC le justifie.
- Multi-cinémas pour cette feature (suit le même scope mono-cinéma que le reste du POC).

### Critères de succès

- Depuis la page de gestion, sélectionner un sous-ensemble de films et télécharger produit un `.ics` valide contenant exactement les séances de ces films.
- Réimporter ce fichier dans Google/Apple/Outlook Calendar affiche les bonnes séances, sans doublon avec un import précédent (mêmes UID d'événement que `downloadShowtimeIcs`).
- Le flux global existant (tous les films, par cinéma, live) continue de fonctionner sans régression.

### Hypothèses

- Les IDs de film (`cinemaId-uid`, voir `ingest/src/adapters/scala-thionville/normalize.ts:23`) sont stables d'un run d'ingestion à l'autre pour un même film — utilisés comme clé de sélection en `localStorage`. Assomption non vérifiée en profondeur au-delà de la lecture du code de normalisation.
- Un export ponctuel (sans live-sync) répond au besoin réel ; si l'usage montre que la re-synchronisation manuelle est trop pénible, une version live (serverless) pourra être réévaluée plus tard.

### Questions ouvertes pour le planning

- Faut-il nettoyer automatiquement de la sélection les IDs de films qui n'existent plus dans le catalogue courant, ou juste les signaler sur la page de gestion ? *(Résolu ci-dessous, voir U3.)*

---

## Planning Contract

### Décision de test (2026-07-03)

Pas de tests automatisés ajoutés à `web/` pour ce lot — décision explicite de l'utilisateur (POC personnel, vérification manuelle acceptée). Le workspace `ingest/` garde sa couverture vitest existante, inchangée par ce plan.

### Key Technical Decisions

**KTD1 — Router : react-router avec `HashRouter`, pas `BrowserRouter`.**
Le site est déployé sur GitHub Pages en sous-chemin (`base` dynamique via `BASE_PATH`, voir `web/vite.config.ts:6`), qui ne sait servir que des fichiers statiques : un rafraîchissement ou un lien direct vers `/gerer` renverrait un 404 avec un routeur à chemins réels, sauf à ajouter un mécanisme de repli (`404.html` custom). `HashRouter` (URLs en `#/gerer`) évite ce problème sans configuration de déploiement supplémentaire — cohérent avec l'esprit "zéro complexité ajoutée" du projet. Compromis assumé : URLs avec `#`, moins élégantes qu'un vrai chemin.

**KTD2 — Réutiliser `buildIcsFeed` (`ingest/src/ics.ts:107`) tel quel pour l'export filtré.**
Cette fonction prend déjà `(cinema, movies[], generatedAt)` et produit un flux multi-films — exactement ce dont l'export filtré a besoin. Il suffit de lui passer un sous-ensemble de `catalog.movies` (ceux cochés) au lieu de la liste complète. Pas de nouvelle fonction de génération ICS à écrire ni à tester : la fonction est déjà couverte par `ingest/src/ics.test.ts`.

**KTD3 — Persistance de sélection : IDs de film dans `localStorage`, pas d'URL.**
Le Product Contract a abandonné l'encodage de la sélection dans une URL d'abonnement (plus d'abonnement live). La sélection est donc un pur état local du navigateur : `localStorage` sous une clé dédiée (`planplan.selectedMovies`), lu/écrit par un hook React dédié, indépendant du routeur.

### Requirements traceability

| Exigence | Où c'est couvert |
|---|---|
| Choisir les films à suivre | U2 (persistance), U3 (UI de sélection) |
| Ne pas polluer le calendrier avec tout le programme | U4 (export filtré), U3 (bouton dédié) |
| Rester 100 % statique (pas de dérogation ADR-001) | U4 (tout le calcul et le fichier sont générés dans le navigateur) |
| Flux global existant non régressé | U1 (le routeur isole la page catalogue existante sans la modifier fonctionnellement) |

---

## Implementation Units

### U1. Routage : séparer catalogue et page de gestion

**Goal :** introduire `react-router` pour avoir deux vues distinctes (`/` catalogue, `/gerer` gestion d'abonnement) sans casser la page actuelle.

**Requirements :** Product Contract — Approche retenue (étape 1).

**Dependencies :** aucune.

**Files :**
- `web/package.json` — ajouter la dépendance `react-router`.
- `web/src/pages/CatalogPage.tsx` — nouveau, contient le JSX actuellement dans `App.tsx` (bandeau d'abonnement + liste des films + footer), inchangé fonctionnellement.
- `web/src/App.tsx` — devient le shell de routage (`HashRouter` + `Routes` : `/` → `CatalogPage`, `/gerer` → `ManageSubscriptionPage`).

**Approach :** Voir KTD1 pour le choix de `HashRouter`. `App.tsx` ne contient plus de logique métier, seulement la déclaration des routes. Le contenu actuel de `App.tsx` (lignes 12-70) est déplacé tel quel dans `CatalogPage.tsx`.

**Patterns to follow :** structure actuelle de `web/src/App.tsx` (imports relatifs vers `styled-system/css`, `api/useCatalog`, `components/MovieCard`).

**Test scenarios :**
Test expectation: none -- décision explicite (voir "Décision de test" ci-dessus), vérification manuelle.

**Verification :** `npm run dev` puis naviguer vers `/` (catalogue inchangé) et `/#/gerer` (page vide/à venir, pas de 404) ; `npm run build` passe (typecheck compris).

---

### U2. Persistance de la sélection de films

**Goal :** mémoriser, par navigateur, l'ensemble des films que l'utilisateur souhaite suivre.

**Requirements :** Product Contract — Comportement attendu (mémorisation), Hypothèses (clé = ID film).

**Dependencies :** aucune (peut être développé en parallèle de U1).

**Files :**
- `web/src/lib/movieSelection.ts` — nouveau : fonctions pures `readSelectedMovieIds(): string[]`, `writeSelectedMovieIds(ids: string[]): void` (lecture/écriture JSON dans `localStorage`, clé `planplan.selectedMovies`).
- `web/src/hooks/useMovieSelection.ts` — nouveau : hook React exposant `{ selectedIds: Set<string>, toggle(movieId: string): void, isSelected(movieId: string): boolean }`, initialisé depuis `readSelectedMovieIds()`, persistant à chaque `toggle` via `writeSelectedMovieIds`.

**Approach :** `localStorage.getItem` peut lever ou renvoyer un JSON invalide (édition manuelle, quota) — `readSelectedMovieIds` doit retourner `[]` dans ces cas plutôt que de faire planter la page au chargement.

**Test scenarios :**
Test expectation: none -- décision explicite (voir "Décision de test" ci-dessus), vérification manuelle.

**Verification :** cocher un film, recharger la page (`F5`), vérifier que la case reste cochée ; vérifier dans les devtools que `localStorage.planplan.selectedMovies` contient bien l'ID.

---

### U3. Page "Gérer mon abonnement"

**Goal :** offrir une vue listant tous les films avec une case à cocher, indiquant combien de séances seront exportées.

**Requirements :** Product Contract — Approche retenue (étape 1), Comportement attendu (retour visuel, film disparu du catalogue), Questions ouvertes (nettoyage de sélection).

**Dependencies :** U1 (route `/gerer`), U2 (hook de sélection).

**Files :**
- `web/src/pages/ManageSubscriptionPage.tsx` — nouveau.

**Approach :** Réutilise `useCatalog()` (déjà existant) pour lister `catalog.movies`. Pour chaque film : case à cocher liée à `useMovieSelection`, titre, nombre de séances à venir. Un compteur global "N séances sélectionnées, sur M films" au-dessus du bouton de téléchargement (U4). Lien de retour vers `/` (catalogue).

**Résolution de la question ouverte (nettoyage de sélection) :** ne rien nettoyer automatiquement — un ID sélectionné qui n'existe plus dans `catalog.movies` est simplement ignoré à l'affichage (rien à cocher pour lui) et lors de l'export (U4, puisque le filtre part de `catalog.movies`). Pas de logique de purge active : plus simple, et sans effet de bord si le film revient à l'affiche plus tard avec le même ID.

**Patterns to follow :** style visuel de `web/src/components/MovieCard.tsx` (styled-system `css`, palette `amber`/`stone`) pour rester cohérent avec le reste du site.

**Test scenarios :**
Test expectation: none -- décision explicite (voir "Décision de test" ci-dessus), vérification manuelle.

**Verification :** la page liste bien tous les films du catalogue courant ; cocher/décocher met à jour le compteur immédiatement ; naviguer ailleurs puis revenir conserve les coches (via U2).

---

### U4. Export `.ics` filtré (téléchargement côté client)

**Goal :** générer et télécharger, au clic, un fichier `.ics` contenant uniquement les séances des films sélectionnés.

**Requirements :** Product Contract — Approche retenue (étape 3), Critères de succès (fichier valide, pas de doublon).

**Dependencies :** U2 (liste des IDs sélectionnés), U3 (bouton déclencheur).

**Files :**
- `web/src/lib/calendar.ts` — ajouter `downloadFilteredIcs(cinema: Cinema, movies: Movie[], selectedIds: Set<string>): void`.

**Approach :** Filtrer `movies` sur `selectedIds.has(movie.id)`, appeler `buildIcsFeed(cinema, filteredMovies, new Date())` (KTD2, déjà importé via `ingest/src/ics.js` comme `downloadShowtimeIcs` le fait pour `buildIcsSingleEvent`), puis même mécanique Blob + lien de téléchargement que `downloadShowtimeIcs` (`web/src/lib/calendar.ts:5-14`). Nom de fichier suggéré : `mon-abonnement-${cinema.id}.ics`. Si `selectedIds` est vide, le bouton appelant (U3) doit être désactivé plutôt que de laisser cette fonction gérer le cas — pas de garde défensive supplémentaire ici.

**Patterns to follow :** `downloadShowtimeIcs` (`web/src/lib/calendar.ts:5-14`) pour la création du Blob et du lien de téléchargement.

**Test scenarios :**
Test expectation: none -- décision explicite (voir "Décision de test" ci-dessus) ; `buildIcsFeed` lui-même reste couvert par `ingest/src/ics.test.ts`, inchangé par ce plan.

**Verification :** sélectionner 2-3 films sur la page de gestion, télécharger, ouvrir le `.ics` généré et vérifier qu'il ne contient que les séances des films cochés ; l'importer dans un calendrier (Google/Apple) et vérifier l'absence de doublon avec un import précédent via le bouton "+📅" existant (mêmes UID `showtime.id@planplan`).

---

## Scope Boundaries

Voir Product Contract — "Hors scope (pour l'instant)". Rien à ajouter côté planning : aucun refactor ou nettoyage tangentiel identifié pendant la recherche.

## Open Questions

Aucune question bloquante restante — la question de nettoyage de sélection a été résolue dans U3.

## Verification Contract

- `npm run typecheck` (les deux workspaces) passe.
- `npm run build` (workspace `web`) passe, y compris avec `HashRouter` et les nouvelles pages.
- `npm run test` (workspace `ingest`) reste vert, inchangé par ce plan.
- Parcours manuel complet : catalogue → lien vers `/gerer` → cocher des films → télécharger `.ics` → vérifier le contenu du fichier → import calendrier sans doublon.

## Definition of Done

- U1 à U4 implémentées et vérifiées manuellement selon leurs critères de vérification respectifs.
- `npm run typecheck` et `npm run build` verts.
- Le flux d'abonnement global existant (par cinéma, tous les films) fonctionne toujours sans régression visible.
