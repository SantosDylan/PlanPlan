# ADR-001 — 100 % statique, pas de backend

**Date :** 2026-07-02 · **Statut :** accepté (POC)

## Contexte

Le handoff (§4) recommandait : job cron → cache/DB → **API backend** → front + génération .ics. Pour un POC mono-cinéma dont la source change ~1×/semaine, chaque brique serveur ajoute du coût (hébergement, maintenance, surface de panne) sans bénéfice utilisateur.

## Décision

Aucun serveur applicatif. Le cron GitHub Actions exécute l'ingestion et **commit les artefacts** (`catalog.json`, `*.ics`) dans le repo ; GitHub Pages sert le tout. Le flux calendrier abonnable fonctionne en statique (un fichier `.ics` à URL stable, resynchronisé par les clients calendrier à chaque refresh du cron).

## Conséquences

- Coût d'infra : 0 €. Une seule techno à maintenir (TS).
- L'historique de la programmation est gratuit : c'est le git log de `catalog.json`.
- Limite assumée : pas de recherche server-side, pas de géoloc, pas de notifications push. **Signal de sortie du statique** : le multi-cinémas dépasse ~20 cinémas ou une feature exige du temps réel/du push → réévaluer (l'API pourra alors servir le même `Catalog` normalisé, le front ne changerait que `queryFn`).
- Les commits de données pollueront l'historique → messages préfixés `data:` pour pouvoir les filtrer.
