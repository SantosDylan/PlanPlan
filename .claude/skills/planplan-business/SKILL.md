---
name: planplan-business
description: >-
  Règles métier, entités et parcours utilisateur de Plan-Plan (agrégateur de
  programmation cinéma → agenda personnel). À charger dès qu'on écrit, revoit ou
  discute une feature, un composant, un type ou une donnée touchant au domaine :
  film (movie), séance (showtime), catalogue (catalog), cinéma (cinema),
  abonnement calendrier (subscribe / .ics / webcal), ajout d'une séance à
  l'agenda, version VF/VO/VOST, fraîcheur (generatedAt), ou tout parcours
  utilisateur de l'app. Sert de référence métier par défaut pour comprendre
  « ce que fait l'app » et « pourquoi » avant toute décision produit ou UX.
metadata:
  type: reference
---

# Plan-Plan — Skill business

## Objectif de l'app

Plan-Plan est un **agrégateur de programmation cinéma orienté agenda**, hyper-local.
Il expose la programmation d'un cinéma (aujourd'hui **La Scala, Thionville**) et permet
à l'utilisateur, en un clic, soit d'**envoyer une séance dans son agenda perso**
(Google / Apple / Outlook) via un `.ics`, soit de **s'abonner** au flux complet du cinéma.

**Job-to-be-done principal** : « Je repère un film → je le mets dans mon agenda sans effort. »

**Architecture métier importante** :
- 100 % statique, **zéro serveur**. Un pipeline d'ingestion (`ingest/`) fetch la
  programmation ~2×/jour et génère deux artefacts commités :
  `web/public/data/catalog.json` + un flux `.ics` par cinéma
  (`web/public/calendar/<cinemaId>.ics`).
- Le front (`web/`) lit `catalog.json` statique et **ne fait aucun appel serveur**.
- Ces artefacts sont **générés** → ne jamais les éditer à la main.
- Source de vérité des types métier : `ingest/src/types.ts` (importé en type-only par le front).

## Entités métier & vocabulaire

| Terme | Définition |
|---|---|
| **Cinema** | Un cinéma : `id`, `name`, `city`, `bookingUrl`, `website`. |
| **Movie** (film) | Film à l'affiche : `id`, `cinemaId`, `title`, `director?`, `genres[]`, `durationMinutes?`, `synopsis?`, `posterUrl?`, `version?`, `releaseYear?`, `tmdbId?`, `bookingUrl?`, `showtimes[]`. |
| **Showtime** (séance) | Une projection datée : `id` (= UID iCalendar), `movieId`, `cinemaId`, `startsAt` (ISO8601), `endsAtEstimate`. **Séances futures uniquement, triées par date croissante.** |
| **Catalog** (catalogue / programmation) | Racine de `catalog.json` : `generatedAt`, `cinemas[]`, `movies[]`. |
| **version** | Champ **libre** issu de la source : "VF" / "VOST" / "VO". Pas d'énumération stricte. |
| **generatedAt** | Timestamp de génération → affiché comme indicateur de fraîcheur (« Synchronisé le … »). |
| **subscribe / feed** | Abonnement au flux `.ics` d'un cinéma, via `webcal://` (Apple/Outlook) ou URL `https` (Google). |
| **ThemePreference** | `'system' \| 'light' \| 'dark'`, persisté en localStorage. |

## Règles métier à respecter

- **Séances futures uniquement**, triées par date croissante. Ne pas afficher/générer de séance passée.
- **`endsAtEstimate`** = `startsAt` + `durationMinutes`, avec **défaut 120 min** si durée absente.
  C'est une estimation, pas une donnée garantie.
- **`version`** est une chaîne libre : ne pas coder en dur une enum ; afficher tel quel (badge).
- Les `.ics` utilisent **VTIMEZONE Europe/Paris**, des **UID stables** (l'`id` de la séance),
  et injectent le `bookingUrl` dans le champ `URL`.
- **`generatedAt`** est le signal de confiance de l'utilisateur : toujours le rendre visible
  (pastille « Synchronisé le … » + footer). Ne pas le masquer.
- Le modèle est **multi-cinémas** (itérer sur `cinemas[]`), même si en prod il n'y a qu'un cinéma.
  Ne pas hardcoder « scala-thionville ».

## Features actuelles

1. **Liste de la programmation** — une `MovieCard` par film (`CatalogPage`).
2. **Fiche film** — affiche, titre, badge version, méta (réalisateur · durée · genres · année), synopsis.
3. **Sélecteur de jour par film** — séances groupées par jour (`role="tablist"`).
4. **Ajout d'une séance à l'agenda** — clic sur un horaire → télécharge un `.ics` mono-événement,
   séance marquée « ✓ », toast de confirmation.
5. **Abonnement au flux d'un cinéma (SubscribeDrawer)** — `webcal://` (« Ouvrir dans mon agenda »)
   + copie de l'URL `https` (Google Agenda).
6. **Sélecteur de thème** — Système / Clair / Sombre, persisté, anti-flash pre-paint.
7. **Menu responsive** — popover (desktop ≥md) vs bottom-sheet draggable (mobile).
8. **Indicateur de fraîcheur**, **gestion d'erreur** (`role="alert"`), **états vides/chargement**, **toasts**.

## Parcours utilisateur

**A. Ajouter une séance à son agenda** (principal)
1. Ouvre le site → chargement de `catalog.json`.
2. Voit « Synchronisé le … » + liste des films.
3. Choisit un jour dans le sélecteur d'onglets d'une fiche film.
4. Clique l'horaire → `.ics` téléchargé, séance « ✓ », toast « Ajouté à ton agenda (HH:MM) ».
5. Ouvre le `.ics` dans son app d'agenda.

**B. S'abonner à toute la programmation**
1. Icône calendrier dans l'en-tête → ouvre le SubscribeDrawer.
2. « Ouvrir dans mon agenda » (`webcal://`) **ou** « Copier » l'URL `https`.
3. Ferme (bouton, backdrop, Escape, ou drag vers le bas).

**C. Changer l'apparence**
1. Menu « Apparence » → popover/sheet.
2. Système / Clair / Sombre → application immédiate + persistance.

## Contraintes & limites connues (hors périmètre actuel)

- **Mono-écran, pas de routeur** : `App` rend directement `CatalogPage`. Pas de page « détail film »
  dédiée — tout est dans la carte.
- **Pas de bouton de réservation** dans l'UI web, bien que `bookingUrl` existe et soit injecté dans
  les `.ics` (deep-link réservation classé post-POC).
- **Enrichissement TMDB** (`tmdbId`, `posterUrl`) : présent dans les données mais classé post-POC dans
  la stratégie — vérifier la provenance avant de s'appuyer dessus.

## Où regarder dans le code

- Types métier (source de vérité) : `ingest/src/types.ts`
- Page principale : `web/src/pages/CatalogPage.tsx`
- Fiche film + séances : `web/src/components/MovieCard.tsx`
- Abonnement : `web/src/components/SubscribeDrawer.tsx`, `web/src/lib/calendar.ts`
- Génération .ics : `ingest/src/ics.ts`
- Chargement données : `web/src/api/useCatalog.ts`
- Thème : `web/src/lib/theme.ts`, `web/src/hooks/useColorTheme.ts`
- Doc produit : `README.md`, `STRATEGY.md`
