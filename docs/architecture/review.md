# Review critique du handoff (planplan.md) — 2026-07-02

Vérifications faites en live contre l'endpoint réel avant d'écrire la moindre ligne de code. Bilan : le handoff est solide sur l'approche, **faux ou incomplet sur 4 points factuels**, tous corrigés dans cette architecture.

## Erreurs factuelles corrigées

### 1. « Un seul appel HTTP renvoie tous les films » — FAUX

Le §3.1 affirme qu'un appel unique suffit. En réalité la réponse est **paginée à 6 films/page** (`nb_results: 45`, `resultsPerPage: 6`, action `scroll` = infinite scroll côté site). Le paramètre de pagination, absent du handoff, a été retrouvé dans le JS du site (`cim_search_elastic/JavaScript/List.min.js`) :
`tx_cimsearchelastic_displaysearch[page]=N` (1-indexé). Vérifié : la page 2 renvoie 6 films différents.
→ Un script qui suit le handoff à la lettre **perdrait des films** dès que plus de 6 sont programmés.

### 2. Les séances passées sont incluses — non mentionné

La source renvoie l'historique complet des séances (vérifié : séances du 10 juin retournées le 2 juillet, 143 séances dont seulement ~26 futures). L'index contient ~45 films dont la grande majorité ne sont plus à l'affiche. → Filtrage `startsAt >= now` + suppression des films sans séance future, obligatoires.

### 3. `duration: string` dans le schéma cible — insuffisant

Un événement calendrier exige une heure de fin : `"1h 7m"` doit être parsé en minutes **à l'ingestion** (`durationMinutes`), sinon impossible de générer un DTEND correct. Ce n'est pas une amélioration optionnelle, c'est un prérequis de la feature cœur.

### 4. Champ `langues` (VF/VOST) absent du schéma — dommage

Présent dans la source, et c'est le filtre le plus demandé dans l'étude La Bobine (§9.4 du handoff lui-même). Ajouté au modèle (`version`).

## Données réelles observées (2026-07-02)

- Certaines séances n'ont **pas de champ `start`** → validation défensive avec skip + warning, pas de crash.
- Les compteurs de genres (aggs) sont identiques à ceux relevés dans le handoff 3 semaines plus tôt → l'index Elastic bouge peu ; `nb_results` compte l'index, pas l'affiche courante.
- Le filtre par période (`[periods][seances@start][startDate/endDate]`) fonctionne mais ne lève pas la limite de 6/page → la pagination reste nécessaire.

## Choix challengés (vs handoff)

| Sujet | Handoff | Décision | Raison |
|---|---|---|---|
| Backend + DB (§4) | API interne + cache/DB | **Aucun backend** (ADR-001) | 1 cinéma, MàJ ~1×/sem : statique + cron couvre tout, y compris le webcal |
| Fréquence cron | 1-6 h | **2×/jour** | Respect de la source ; la programmation change le mercredi |
| Nom CinéSync | proposé en tête | **écarté** | Collision avec cineSync (Cospective), outil pro connu de l'industrie du film → nom retenu : Plan-Plan |
| Deep-link séance (§3.2) | « optionnel » | **hors POC, non vérifié** | Endpoint jamais testé en curl ; le lien billetterie générique suffit |
| SQLite/Postgres | évoqués | **non** | `catalog.json` versionné dans git = historique gratuit par les commits |

## Risques restants (assumés)

1. **L'endpoint peut casser sans préavis** (non documenté). Mitigation : zod + fixtures réelles en test + run cron rouge = alerte ; l'ancien catalog reste servi.
2. **`cHash` pourrait redevenir obligatoire** (comportement TYPO3 configurable). Mitigation : le run échouerait bruyamment ; solution de repli documentée dans `docs/solutions/typo3-scala-endpoint.md`.
3. **Cron GitHub désactivé après 60 j d'inactivité** du repo. Acceptable pour un POC ; un push le réactive.
4. **Hotlink des posters** : toléré à cette échelle, à ré-héberger si le projet s'ouvre.
