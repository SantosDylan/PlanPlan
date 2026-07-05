---
title: "Le push du cron d'ingestion ne déclenche pas le déploiement GitHub Pages"
date: 2026-07-02
category: integration-issues
module: deployment
problem_type: integration_issue
component: github-actions
severity: medium
symptoms:
  - "Le workflow \"Ingestion programmation\" tourne avec succès et commit `data: refresh programmation (...)`, mais aucun run \"Deploy GitHub Pages\" n'apparaît juste après dans l'historique Actions"
  - "Le site en ligne reste sur une programmation périmée alors que `catalog.json` a bien été mis à jour sur `main`"
root_cause: config_error
resolution_type: config_change
tags: [github-actions, github-pages, cron, github-token, workflow-trigger]
---

# Le push du cron d'ingestion ne déclenche pas le déploiement GitHub Pages

## Problem

`deploy.yml` écoute `on: push branches: [main]`. `ingest.yml` committe et pousse (`git push`) les artefacts régénérés (`web/public/data`, `web/public/calendar`) quand la programmation a changé. On pourrait s'attendre à ce que ce push relance automatiquement `deploy.yml` — ce n'est pas le cas.

## Root Cause

`actions/checkout@v4` configure git avec le `GITHUB_TOKEN` par défaut de l'action. GitHub bloque volontairement tout déclenchement de workflow (`push`, `pull_request`, etc.) causé par un événement produit avec ce token, pour éviter les boucles infinies (un workflow qui se re-déclencherait lui-même à l'infini). Le `git push` d'`ingest.yml` est donc invisible pour `deploy.yml`, même si le commit apparaît bien sur `main`.

## What Didn't Work

Rien à signaler ici — le symptôme est silencieux (aucune erreur, aucun run raté) : le pipeline a l'air de fonctionner (ingestion verte, commit poussé) alors que le site ne se met simplement jamais à jour tout seul. Le piège est de ne pas remarquer l'absence de run "Deploy GitHub Pages" corrélé.

## Solution

Après un push réussi, déclencher explicitement `deploy.yml` via l'API (`gh workflow run`), qui n'est pas soumise à la même restriction (ce n'est pas un événement `push`) :

```yaml
permissions:
  contents: write
  actions: write   # nécessaire pour `gh workflow run`

- name: Commit si la programmation a changé
  id: commit
  run: |
    ...
    git push
    echo "pushed=true" >> "$GITHUB_OUTPUT"

- name: Déclencher le déploiement du site
  if: steps.commit.outputs.pushed == 'true'
  env:
    GH_TOKEN: ${{ github.token }}
  run: gh workflow run deploy.yml --ref main
```

Le déclenchement est conditionné à `pushed == 'true'` pour ne pas redéployer inutilement quand la programmation n'a pas changé.

## Why This Works

`gh workflow run` (comme tout déclenchement via l'API Actions — `repository_dispatch`, `workflow_dispatch` programmatique) n'est pas concerné par la règle anti-boucle, qui ne s'applique qu'aux événements `push`/`pull_request` générés par le `GITHUB_TOKEN`. C'est le mécanisme documenté par GitHub pour ce cas d'usage exact (job A qui doit en déclencher un autre après une action faite avec le token par défaut).

## Prevention

- Tout workflow qui committe et pousse avec `actions/checkout` + `GITHUB_TOKEN` par défaut ne déclenchera **jamais** un autre workflow `on: push` — à anticiper dès la conception si un second workflow doit réagir à ce commit.
- Alternative si on veut garder un vrai déclenchement `on: push` (plutôt que `gh workflow run` explicite) : utiliser un Personal Access Token ou une clé de déploiement dédiée pour le push, au prix d'un secret supplémentaire à gérer.
- Vérifier après coup : un run "cron" vert suivi d'un commit doit toujours avoir un run "deploy" corrélé dans l'historique Actions si le déploiement est censé suivre automatiquement.

## Related Issues

- [docs/solutions/adr-001-static-first.md](../adr-001-static-first.md) — le choix "100% statique + cron GitHub Actions" qui rend ce pipeline (ingestion → déploiement) nécessaire.
- [docs/solutions/integration-issues/github-pages-requires-public-repo.md](github-pages-requires-public-repo.md) — autre piège opérationnel rencontré sur ce même pipeline GitHub Pages.
