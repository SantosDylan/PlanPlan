# ADR-002 — Un « source adapter » par cinéma, modèle multi-cinémas dès le POC

**Date :** 2026-07-02 · **Statut :** accepté

## Contexte

Objectif affiché post-POC : ajouter les cinémas voisins. L'étude La Bobine (handoff §9) confirme que les cinémas indépendants tournent sur un petit nombre de logiciels de billetterie mutualisés (CoteCiné, etc.) : chaque nouveau cinéma = identifier son logiciel + écrire un connecteur, pas réinventer l'app. À l'inverse, construire l'infra multi-sources dès maintenant serait de la sur-ingénierie (le POC n'a qu'une source).

## Décision

- Le modèle porte `cinemaId` sur `Movie` et `Showtime` dès le POC, ids préfixés (`scala-thionville-892`) — coût quasi nul aujourd'hui, migration de données évitée demain.
- L'ingestion est structurée autour de l'interface `SourceAdapter { cinema, fetchProgram() }`. L'orchestrateur ne connaît aucun détail TYPO3.
- On n'écrit **qu'un seul** adapter au POC. Pas d'abstraction spéculative au-delà de l'interface (règle : la 2e implémentation valide ou corrige le contrat).

## Conséquences

- Ajouter un cinéma = 1 dossier `adapters/<cinema-id>/` (schema zod + normalize + fetch) + 1 ligne dans l'orchestrateur + 1 flux .ics automatique.
- Le front est déjà prêt : il groupe/affiche par `cinemaId` trivialement le moment venu.
- Si un adapter casse (source modifiée), les autres continuent de publier.
