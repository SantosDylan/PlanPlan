---
title: "GitHub Pages activation fails (422) on a private repo"
date: 2026-07-02
last_updated: 2026-07-14
category: integration-issues
module: deployment
problem_type: integration_issue
component: tooling
severity: medium
symptoms:
  - "gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow returns HTTP 404 with the wrong gh account active"
  - "Same command returns HTTP 422 \"Your current plan does not support GitHub Pages for this repository\" once the right account is active, on a private repo"
  - "gh pr create fails with \"GraphQL: Unauthorized: As an Enterprise Managed User, you cannot access this content (createPullRequest)\" even though git push just succeeded on the same repo/branch"
root_cause: config_error
resolution_type: config_change
tags: [github-pages, deployment, github-cli, repo-visibility, gh-multi-account, enterprise-managed-user, gh-pr-create]
---

# GitHub Pages refuse de s'activer sur un repo privé (plan gratuit)

## Problem

Le premier déploiement de Plan-Plan sur GitHub Pages échouait à l'étape d'activation : impossible d'activer Pages via l'API GitHub sur le repo `SantosDylan/PlanPlan`, bloquant tout déploiement du site avant même que le workflow GitHub Actions (`deploy.yml`) ait une chance de tourner utilement.

## Symptoms

- Avec le mauvais compte `gh` actif (compte pro sans accès au repo perso) :
  ```
  gh api -X POST repos/SantosDylan/PlanPlan/pages -f build_type=workflow
  → HTTP 404: Not Found
  ```
- Avec le bon compte `gh` actif (compte perso, propriétaire du repo), sur un repo resté privé :
  ```
  gh api -X POST repos/SantosDylan/PlanPlan/pages -f build_type=workflow
  → HTTP 422: {"message":"Your current plan does not support GitHub Pages for this repository.","documentation_url":"...","status":"422"}
  ```

## What Didn't Work

Traiter le premier échec (404 "Not Found") comme LE problème à résoudre en boucle sur l'API Pages elle-même (payloads, paramètres, permissions du token) : ce 404 n'avait rien à voir avec Pages, c'était simplement le compte `gh` actif (pro) qui n'avait aucun droit sur le repo perso `SantosDylan/PlanPlan`. Une fois le bon compte activé, un tout autre message (422) est apparu, révélant la vraie cause. Confondre ces deux échecs aurait fait perdre du temps à déboguer la mauvaise couche du problème.

## Solution

1. Diagnostiquer la visibilité du repo :
   ```
   gh api repos/SantosDylan/PlanPlan --jq '{private: .private, visibility: .visibility}'
   → {"private":true,"visibility":"private"}
   ```
2. Passer le repo en public (après validation explicite avec l'utilisateur, qui a choisi cette option parmi : passer public / héberger ailleurs / rester privé sans déployer) :
   ```
   gh repo edit SantosDylan/PlanPlan --visibility public --accept-visibility-change-consequences
   ```
3. Réactiver GitHub Pages, qui réussit cette fois :
   ```
   gh api -X POST repos/SantosDylan/PlanPlan/pages -f build_type=workflow
   → {"url":"...","html_url":"https://santosdylan.github.io/PlanPlan/","build_type":"workflow","source":{"branch":"main","path":"/"},...}
   ```

Note secondaire — gestion multi-comptes `gh` : quand le compte `gh` actif par défaut (ici un compte pro) n'a pas accès au repo cible, ajouter le second compte sans perdre la session existante via device-flow :
```
gh auth login --hostname github.com --git-protocol ssh --web
```
(ouvrir manuellement https://github.com/login/device, authentifier avec le compte perso). `gh auth status` liste alors les deux comptes ; utiliser `gh auth switch` pour rebasculer vers le compte souhaité selon le repo à manipuler. Le remote git lui-même doit aussi pointer vers l'alias SSH de l'identité perso (`github.com-epitech`, cf. README § Mise en ligne) et non l'alias `github.com` par défaut.

**Autre manifestation (2026-07-14) — `gh pr create` en Unauthorized malgré un `git push` réussi :** même cause racine, signature d'erreur différente. Après un `git push` réussi, `gh pr create --title "..." --body "..."` échouait avec :
```
pull request create failed: GraphQL: Unauthorized: As an Enterprise Managed User, you cannot access this content (createPullRequest)
```
`gh auth status` a montré deux comptes sur `github.com` : `dylan-santos_loreal` (Enterprise Managed User de l'employeur, actif par défaut) et `SantosDylan` (compte perso, propriétaire réel de `SantosDylan/PlanPlan`). Un compte EMU est structurellement restreint aux ressources de son enterprise et ne peut pas authentifier un appel API/GraphQL (`createPullRequest`) sur un repo extérieur, même si le remote Git reste parfaitement joignable — c'est pourquoi le `push` (authentifié en SSH via l'alias `github.com-epitech`) réussissait pendant que `gh pr create` (authentifié via le compte `gh` actif) échouait : les deux n'empruntent pas le même canal d'authentification. Fix : `gh auth switch --user SantosDylan --hostname github.com`, relancer `gh pr create` (succès), puis **rebasculer vers le compte par défaut ensuite** (`gh auth switch --user dylan-santos_loreal --hostname github.com`) pour ne pas affecter silencieusement le reste du travail (cette machine sert aussi à des projets d'entreprise).

## Why This Works

GitHub restreint GitHub Pages aux dépôts publics sur le plan gratuit ; l'activer sur un dépôt privé nécessite un plan payant (Pro, Team ou Enterprise). Cette contrainte est documentée par GitHub mais reste peu visible avant de la rencontrer : le message d'erreur 422 ne mentionne explicitement ni "privé" ni "plan gratuit", ce qui la rend difficile à anticiper sans être passé par le diagnostic (`private`/`visibility`) au moins une fois.

## Prevention

- Avant tout appel à `gh api .../pages` sur un repo dont le compte GitHub est sur le plan gratuit, vérifier d'abord sa visibilité : `gh api repos/<owner>/<repo> --jq '{private, visibility}'`.
- Si le repo doit impérativement rester privé, ne pas s'acharner sur l'API Pages : orienter directement vers une alternative compatible (Netlify, Vercel, Cloudflare Pages) ou vers un plan GitHub payant qui débloque Pages sur repos privés.
- Sur une machine où plusieurs comptes GitHub coexistent (pro/perso), toujours vérifier `gh auth status` avant d'agir sur un repo personnel — un 404 inattendu, ou une erreur Unauthorized/EMU, sur un repo qu'on sait pourtant exister est souvent un symptôme de mauvais compte actif, pas un vrai problème de ressource introuvable ou de permission.
- Cette précaution ne concerne pas que l'API Pages : elle s'applique à toute sous-commande `gh` qui fait un appel API/GraphQL sous l'identité active (`gh pr create`, `gh pr view`, `gh issue create`, `gh repo edit`, `gh api ...`). Un `git push`/`pull` réussi ne garantit rien sur le compte `gh` actif : les deux n'empruntent pas le même canal d'authentification (SSH pour Git, compte `gh` actif pour l'API/GraphQL).
- Après avoir basculé de compte pour une opération ponctuelle sur un repo perso, toujours rebasculer vers le compte par défaut/entreprise ensuite (`gh auth switch --user <compte-par-défaut> --hostname github.com`), pour ne pas laisser le mauvais compte actif affecter d'autres opérations `gh` sur d'autres projets.

## Related Issues

- [docs/solutions/adr-001-static-first.md](../adr-001-static-first.md) — explique le choix architectural "100% statique + GitHub Pages" (le pourquoi) que ce doc complète avec le piège opérationnel rencontré en l'activant (le comment faire si ça échoue).
- [README.md](../../../README.md) § Mise en ligne — documente le happy-path d'activation manuelle (Settings → Pages) et l'alias SSH `github.com-epitech` ; ce doc couvre le cas d'échec via `gh api`/`gh repo edit` non traité là-bas.
