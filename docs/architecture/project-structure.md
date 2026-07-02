# Structure du projet & stack

## Vue d'ensemble

Monorepo npm workspaces, 100 % statique (ADR-001) :

```
PlanPlan/
├── STRATEGY.md                  # Vision produit (source : ce-strategy)
├── README.md
├── package.json                 # workspaces: ingest, web
├── docs/
│   ├── handoff-planplan.md      # Document de handoff d'origine (corrigé, voir review.md)
│   ├── architecture/            # Ce dossier
│   └── solutions/               # Référence endpoint + ADRs — à lire avant toute feature
├── ingest/                      # Pipeline d'ingestion (Node + TS, exécuté par cron CI)
│   ├── src/
│   │   ├── index.ts             # Orchestrateur : adapters → catalog → JSON + .ics
│   │   ├── types.ts             # Modèle normalisé Cinema/Movie/Showtime/Catalog
│   │   ├── ics.ts               # Génération du flux iCalendar par cinéma
│   │   └── adapters/
│   │       ├── adapter.ts       # Interface SourceAdapter (contrat multi-cinémas)
│   │       └── scala-thionville/
│   │           ├── schema.ts    # Schéma zod de la réponse TYPO3 brute
│   │           ├── normalize.ts # TYPO3 brut → modèle normalisé
│   │           └── index.ts     # Fetch paginé + assemblage
│   └── fixtures/                # Réponses réelles capturées (tests hors-ligne)
├── web/                         # Vite + React + TS + Panda CSS + TanStack Query
│   └── public/
│       ├── data/catalog.json    # ← écrit par ingest, commité par le cron
│       └── calendar/*.ics       # ← flux abonnables, idem
└── .github/workflows/
    ├── ci.yml                   # lint + test + build sur PR/push
    ├── ingest.yml               # cron 2×/jour : ingestion → commit si diff
    └── deploy.yml               # push main → build web → GitHub Pages
```

## Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Ingestion | Node 22 + TypeScript (tsx), zod | Un seul langage dans le repo ; validation défensive obligatoire (source non documentée) |
| Front | Vite + React 19 + TypeScript | Standard, build statique |
| Styling | Panda CSS | Choix perso (MUI = boulot), zéro runtime CSS-in-JS |
| Data fetching | TanStack Query | `useQuery` sur `catalog.json` statique ; prêt pour de vraies APIs si un backend arrive |
| Tests | Vitest (ingest : sur fixtures réelles) | Les fixtures figent le format TYPO3 observé → une régression de parsing se voit en test |
| Calendrier | `.ics` maison (RFC 5545, ~60 lignes) | Pas de dépendance pour un format texte simple ; TZID Europe/Paris explicite |
| Hébergement | GitHub Pages + Actions | Coût 0 €, cron intégré |

## Flux de données

```
TYPO3 (thionville.fr) ──cron 2×/jour──▶ ingest (adapters → zod → normalize)
                                            │
                              ┌─────────────┴─────────────┐
                              ▼                           ▼
                   web/public/data/catalog.json   web/public/calendar/<cinemaId>.ics
                              │                           │
                              └────── commit + deploy ────┘
                                            ▼
                              GitHub Pages (site + webcal)
```

Le front ne parle **jamais** à thionville.fr. Seul le cron le fait (8 requêtes paginées espacées de 1,5 s, User-Agent honnête).

## Conventions

- Identifiants préfixés par cinéma : `movie.id = "scala-thionville-892"`, `showtime.id = "scala-thionville-10502"` — pas de collision possible entre cinémas (préparation multi-cinémas, ADR-002).
- `catalog.json` est un artefact généré : ne jamais l'éditer à la main, il est écrasé au prochain run.
- Tout ce qui vient de TYPO3 passe par `schema.ts` (zod) avant usage — aucun accès direct au JSON brut hors de l'adapter.
