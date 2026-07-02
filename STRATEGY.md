---
name: Plan-Plan
last_updated: 2026-07-02
---

# Plan-Plan Strategy

## Target problem

La programmation du cinéma Scala (Thionville) n'est consultable que sur le site de la ville, sans moyen d'envoyer une séance dans son calendrier — on repère un film, puis on l'oublie. Aucune API publique n'existe (AlloCiné a fermé la sienne) : la donnée n'est accessible que via des endpoints TYPO3 internes, non documentés, paginés, et susceptibles de casser sans préavis.

## Our approach

Ne jamais interroger la source en direct : un cron ingère la programmation 2×/jour via un « source adapter » par cinéma, la normalise dans un schéma propre validé (zod), et publie un site 100 % statique + flux `.ics` abonnable — zéro serveur, zéro coût, zéro OAuth. Le POC est mono-cinéma, mais le modèle (`cinemaId`, adapters isolés) est prêt pour brancher les cinémas voisins sans réécriture.

## Who it's for

**Primary:** Dylan (et ses proches à Thionville) — spectateur régulier du Scala. Il embauche Plan-Plan pour repérer les prochaines séances et les pousser dans son calendrier (Google/Apple/Outlook) en un clic, sans re-consulter le site de la ville.

## Key metrics

- **Fraîcheur des données** — âge de `movies.json` < 24 h (timestamp `generatedAt` affiché sur le site ; run GitHub Actions rouge = alerte).
- **Taux de succès de l'ingestion** — runs cron verts vs rouges ; un champ manquant côté TYPO3 doit produire une erreur de validation loggée, jamais un crash silencieux ni des données corrompues publiées.
- **Couverture de la programmation** — les films affichés par Plan-Plan = les films réellement à l'affiche (contrôle manuel hebdo au début ; une régression signale que la pagination ou le format source a changé).
- **Usage calendrier** — téléchargements `.ics` / abonnements webcal (mesure à outiller post-POC) ; c'est la valeur différenciante vs le site de la ville.

## Tracks

### Ingestion résiliente

Pipeline fetch → validation zod → normalisation, par adapter source (TYPO3/Scala d'abord), avec pagination complète, filtrage des séances passées et alerte sur dérive de schéma.

_Why it serves the approach:_ toute l'app repose sur des endpoints non officiels ; la résilience de l'ingestion est le risque n° 1 du projet.

### Expérience séances → calendrier

Site statique (films + prochaines séances, VF/VOST) et génération `.ics` : par séance côté client, flux abonnable par cinéma généré à l'ingestion.

_Why it serves the approach:_ c'est le job-to-be-done ; tout le reste n'est que de la donnée.

### Extensibilité multi-cinémas

Modèle `Cinema`/`Movie`/`Showtime` avec `cinemaId` partout, adapters isolés derrière une interface commune, pattern documenté dans `docs/solutions/`.

_Why it serves the approach:_ l'objectif affiché post-POC est d'ajouter les cinémas voisins (CoteCiné ou autres) en écrivant un adapter, pas en réécrivant l'app.

## Not working on

- **Backend / API serveur** — le statique couvre le POC ; à réévaluer seulement si le multi-cinémas crée un besoin réel (recherche, géoloc).
- **Deep-link de réservation par séance** (endpoint CoteCiné §3.2 du handoff, non vérifié) — le lien billetterie générique suffit.
- **Enrichissement TMDB, notifications, comptes, notation** — post-POC.
- **Concurrencer La Bobine** (couverture nationale, 1800 cinémas) — Plan-Plan reste hyper-local et orienté calendrier.
