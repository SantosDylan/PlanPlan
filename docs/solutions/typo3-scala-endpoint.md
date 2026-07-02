# Référence : endpoint TYPO3 programmation Scala (Thionville)

> Source non officielle, reverse-engineered. Dernière vérification live : **2026-07-02** (HTTP 200, sans cookie ni session ni cHash). Si l'ingestion casse, relire ce doc puis re-vérifier chaque point avec `curl`.

## Requête

```
GET https://www.thionville.fr/scala/programmation-cinema
```

| Param | Valeur | Rôle |
|---|---|---|
| `contentElements` | `13` | Élément de contenu TYPO3 |
| `elementId` | `352` | ID d'élément |
| `no_cache` | `1` | Bypass cache TYPO3 |
| `tx_cimsearchelastic_displaysearch[action]` | `scroll` | Action Extbase (listing paginé) |
| `tx_cimsearchelastic_displaysearch[controller]` | `Listing` | Controller |
| `tx_cimsearchelastic_displaysearch[format]` | `html` | Réponse JSON (contenant aussi un fragment HTML) |
| `type` | `99992` | Page type AJAX |
| `tx_cimsearchelastic_displaysearch[page]` | `1..N` | **Pagination (1-indexé, 6 films/page)** — absent du handoff d'origine, retrouvé dans `cim_search_elastic/JavaScript/List.min.js` du site |

`cHash` **non requis** (vérifié 2026-06 et 2026-07). Pas de cookies, pas de session → simple fetch Node suffit.

## Pagination — obligatoire

- `nb_results` = taille de l'index (~45), **pas** le nombre de films à l'affiche.
- `resultsPerPage` = 6. Nombre de pages = `ceil(nb_results / resultsPerPage)`.
- `currentPage` dans la réponse reste à 1 quoi qu'on envoie — ne pas s'y fier ; itérer `[page]=1..N` et dédupliquer par `uid`.
- L'index contient films passés + à l'affiche + à venir → **filtrer par `seances[].start` futur**, ne pas se fier à la présence dans la réponse.
- ⚠️ **Piège PHP (vérifié)** : sur une page vide (au-delà de la dernière), `documents` vaut `[]` (array) au lieu de `{"movie": [...]}` — PHP sérialise un tableau associatif vide en liste. Prévoir le cas dans la validation, et s'arrêter à la première page vide (`nb_results` surestime : 45 annoncés, 39 réellement listés le 2026-07-02).

## Réponse (champs consommés)

```jsonc
{
  "nb_results": 45,
  "currentPage": 1,          // toujours 1, ignorer
  "resultsPerPage": 6,
  "documents": {
    "movie": [{
      "uid": 892,
      "title": "Le Vertige",
      "director": "Quentin Dupieux",
      "genre": [{ "title": "Animation", "uid": 526 }],
      "duration": "1h 7m",              // à parser en minutes
      "releaseYear": 2026,
      "synopsis": "...",
      "langues": [{ "title": "VF", ... }],   // "VF" | "VOST" — profondément imbriqué, ne lire que [0].title
      "pictureShow": [{ "originalResource": { "originalFile": { "identifier": "/user_upload/tx_cimtmdb/1668499.jpg" } } }],
      "seances": [
        { "uid": 10502, "start": "2026-07-02T18:30:00+0200" },
        { "uid": 10999 }                // ⚠️ des séances SANS `start` existent en réel → skip + warning
      ],
      "billeterie": "https://www.thionville-scala-vad.cotecine.fr/reserver/",
      "idTmdb": "1668499"
    }]
  },
  "aggs": { "genre.uid": [{ "key": 527, "doc_count": 18 }, ...] }
}
```

- **Poster** : préfixer `identifier` par `https://www.thionville.fr/fileadmin` (l'identifier commence déjà par `/`).
- **Dates** : ISO8601 avec offset Europe/Paris (`+0200`/`+0100` selon DST) — parsables direct.

## Filtres optionnels (vérifiés)

- Période : `tx_cimsearchelastic_displaysearch[fieldset_13][periods][seances@start][startDate]=YYYY-MM-DD` (+ `[endDate]`) — filtre bien, mais **ne lève pas** la limite 6/page.
- Genre : `tx_cimsearchelastic_displaysearch[fieldset_13][categories_parent][genre@uid][]=<uid>` (uids : 515 Action, 526 Animation, 516 Aventure, 517 Comédie, 525 Crime, 527 Drame, 514 Familial, 518 Fantastique, 522 Horreur, 523 Mystère, 524 Science-Fiction, 519 Thriller).
- Recherche texte : `tx_cimsearchelastic_displaysearch[fieldset_13][text][suggest_description@search]=<mot>`.

## Étiquette

- Cron 2×/jour max, délai ≥ 1,5 s entre pages, User-Agent honnête (`planplan-ingest/x.y`).
- Ne jamais appeler depuis le navigateur des visiteurs.

## Si ça casse un jour

1. Re-tester la commande curl de base (dans le README) : 200 ? JSON ?
2. `cHash` devenu obligatoire → il faudra soit extraire le cHash de la page publique HTML (il y figure dans les liens), soit passer par le rendu de la page publique.
3. Format changé → comparer avec `ingest/fixtures/scala-page1.json` (réponse du 2026-07-02) pour identifier le diff.
4. Endpoint disparu → plan B jamais vérifié : AJAX CoteCiné (`thionville-scala-vad.cotecine.fr/reserver/ajax/?modresa_film=<ID>`), voir §3.2 du handoff — à re-vérifier entièrement avant usage.
