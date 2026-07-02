# 🎬 Plan-Plan

Les séances du cinéma **La Scala (Thionville)**, direct dans ton agenda. POC 100 % statique : un cron ingère la programmation (endpoints TYPO3 reverse-engineered), la normalise, et publie un site + des flux iCalendar abonnables. Zéro serveur, zéro coût.

> Vision & scope : [STRATEGY.md](STRATEGY.md) · Décisions & pièges : [docs/solutions/](docs/solutions/) · Architecture : [docs/architecture/](docs/architecture/)

## Démarrage

```bash
npm install            # installe les 2 workspaces (ingest, web) + panda codegen
npm run ingest         # fetch la programmation réelle → web/public/{data,calendar}
npm run dev            # web app sur http://localhost:5173
```

## Commandes

| Commande | Effet |
|---|---|
| `npm run ingest` | Ingestion complète (paginée, ~10 s) → `catalog.json` + `.ics` |
| `npm run dev` | Dev server Vite |
| `npm run build` | Typecheck + build statique (`web/dist`) |
| `npm run test` | Tests vitest de l'ingestion (fixtures réelles) |
| `npm run typecheck` | `tsc` sur les 2 workspaces |

## Structure

- `ingest/` — pipeline Node+TS : un **source adapter** par cinéma (`adapters/scala-thionville/`), validation zod, normalisation, génération `.ics`. Ajouter un cinéma = un nouvel adapter ([ADR-002](docs/solutions/adr-002-source-adapters.md)).
- `web/` — Vite + React 19 + TS + Panda CSS + TanStack Query. Lit `catalog.json` statique, boutons « + calendrier » par séance, lien d'abonnement `webcal://`.
- `web/public/data` + `web/public/calendar` — **artefacts générés**, commités par le cron. Ne pas éditer à la main.
- `.github/workflows/` — CI (lint/test/build), ingestion cron 2×/jour, déploiement GitHub Pages.

## Mise en ligne (une fois)

1. Créer le repo GitHub (compte perso) puis :
   ```bash
   git remote add origin git@github.com-epitech:<user>/PlanPlan.git
   git push -u origin main
   ```
2. Repo → Settings → Pages → Source : **GitHub Actions**.
3. C'est tout : chaque push sur `main` déploie ; le cron rafraîchit la programmation et ne commit que si elle a changé.

## À savoir

- La source est **non officielle** et peut casser sans préavis — tout est documenté dans [docs/solutions/typo3-scala-endpoint.md](docs/solutions/typo3-scala-endpoint.md) (pagination, pièges PHP, plan B). Un run d'ingestion rouge = alerte ; l'ancien catalog reste en ligne.
- Étiquette : cron 2×/jour max, 1,5 s entre pages, User-Agent honnête. Projet perso non commercial, non affilié au cinéma ni à la ville.
- Le cron GitHub est désactivé après 60 jours sans activité sur le repo (un push le relance).
