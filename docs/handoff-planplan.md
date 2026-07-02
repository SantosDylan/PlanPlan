> **⚠️ Note (2026-07-02)** : document de handoff d'origine, conservé pour référence. Quatre erreurs factuelles ont été identifiées et corrigées après vérification live — voir docs/architecture/review.md (pagination obligatoire, séances passées incluses, durée à parser, champ langues manquant).

# Projet : App films + agenda pour le cinéma Scala (Thionville)

> Document de handoff — à copier dans le nouveau repo au démarrage du projet.
> Contient : objectif, APIs reverse-engineered, architecture recommandée, schémas de données, stratégie de cache, gestion calendrier, et propositions de noms.

---

## 1. Objectif

1. Récupérer automatiquement la programmation du cinéma (films + séances/horaires)
2. Afficher ça dans une web app
3. Permettre à l'utilisateur d'ajouter une séance à son calendrier personnel (Google/Apple/Outlook)

Aucune API publique officielle n'existe pour ça (AlloCiné a fermé la sienne il y a plusieurs années). La solution repose sur deux endpoints internes reverse-engineered depuis le site de Thionville, décrits ci-dessous.

---

## 2. Propositions de noms

| Nom | Idée |
|---|---|
| **CinéSync** | synchro programmation ↔ calendrier |
| **SéanceRadar** | on détecte les séances qui t'intéressent |
| **ReelAgenda** | jeu de mot reel (bobine) / agenda |
| **PopcornPlanner** | ton côté fun, orienté planning |
| **CinéFlux** | flux continu de la programmation |
| **ScalaScope** | si tu restes mono-cinéma (Scala Thionville) |
| **CineCal** | direct, orienté calendrier, générique si tu étends à d'autres salles |
| **FilmWatchr** | anglicisme court, dispo comme nom de package |

Si tu comptes un jour étendre au-delà du Scala (d'autres cinémas utilisant CoteCiné), privilégie un nom générique (**CinéSync**, **CineCal**, **CinéFlux**) plutôt que "Scala" en dur.

---

## 3. Sources de données (APIs reverse-engineered)

### 3.1 Endpoint principal — programmation complète (films + horaires)

C'est la **source de vérité unique recommandée**. Un seul appel HTTP renvoie tous les films actuellement à l'affiche avec toutes leurs séances (dates ISO8601 incluses).

```
GET https://www.thionville.fr/scala/programmation-cinema
```

**Query params requis :**

| Param | Valeur | Rôle |
|---|---|---|
| `contentElements` | `13` | ID de l'élément de contenu TYPO3 sur la page |
| `elementId` | `352` | ID d'élément |
| `no_cache` | `1` | Désactive le cache TYPO3 |
| `tx_cimsearchelastic_displaysearch[action]` | `scroll` | Action du controller Extbase |
| `tx_cimsearchelastic_displaysearch[controller]` | `Listing` | Controller Extbase |
| `tx_cimsearchelastic_displaysearch[format]` | `html` | Format de sortie (JSON contenant un fragment HTML + données structurées) |
| `type` | `99992` | Page type TypoScript dédié à cette sortie AJAX |

**⚠️ Important — vérifié en live :** le paramètre `cHash` (habituellement obligatoire sur TYPO3) **n'est PAS requis**. Testé avec un simple `curl` sans navigateur, sans cookies, sans session → réponse 200 avec les données complètes. Ça veut dire qu'un script serveur simple (Node/Python/cron) suffit, pas besoin de Playwright/headless browser pour cette partie.

**Exemple de commande de test :**
```bash
curl -s "https://www.thionville.fr/scala/programmation-cinema?contentElements=13&elementId=352&no_cache=1&tx_cimsearchelastic_displaysearch%5Baction%5D=scroll&tx_cimsearchelastic_displaysearch%5Bcontroller%5D=Listing&tx_cimsearchelastic_displaysearch%5Bformat%5D=html&type=99992"
```

**Filtres optionnels disponibles (vus dans `form.fieldset[0].fields`) :**
- `tx_cimsearchelastic_displaysearch[fieldset_13][categories_parent][genre@uid][]` → filtrer par genre (uid ci-dessous)
- `tx_cimsearchelastic_displaysearch[fieldset_13][periods][seances@start][startDate]` / `[endDate]` → filtrer par période
- `tx_cimsearchelastic_displaysearch[fieldset_13][text][suggest_description@search]` → recherche mot-clé

**Table des genres (uid → titre, avec nb de films au moment du test) :**
```
515 Action (2)         526 Animation (13)      516 Aventure (8)
517 Comédie (14)        525 Crime (3)           527 Drame (18)
514 Familial (11)       518 Fantastique (5)     522 Horreur (2)
523 Mystère (4)         524 Science-Fiction (5) 519 Thriller (5)
```

#### Schéma de la réponse (champs utiles)

```jsonc
{
  "documents": {
    "movie": [
      {
        "uid": 892,
        "title": "Le Vertige",
        "director": "Quentin Dupieux",
        "genre": [{ "title": "Animation", "uid": 526 }],
        "actors": "Alain Chabat, Jonathan Cohen, ...",
        "duration": "1h 7m",
        "releaseYear": 2026,
        "countryProduction": "France",
        "synopsis": "Jacques se rend chez son ami Bruno...",
        "pathSegment": "/le-vertige",
        "availabilityStartdate": "2026-06-10T17:28:00+0200",
        "availabilityEnddate": "2026-07-07T00:00:00+0200",
        "pictureShow": [
          { "originalResource": { "originalFile": { "identifier": "/user_upload/tx_cimtmdb/1668499.jpg" } } }
        ],
        "seances": [
          { "uid": 10502, "title": "Le Vertige", "start": "2026-07-02T18:30:00+0200" },
          { "uid": 10503, "title": "Le Vertige", "start": "2026-07-03T13:55:00+0200" }
        ],
        "billeterie": "https://www.thionville-scala-vad.cotecine.fr/reserver/",
        "idTmdb": "1668499"
      }
    ]
  }
}
```

Champs clés à retenir pour le modèle interne : `uid`, `title`, `director`, `genre[].title`, `duration`, `synopsis`, `pathSegment`, `pictureShow[0].originalResource.originalFile.identifier` (préfixer avec `https://www.thionville.fr/fileadmin/`), `seances[].start` (ISO8601, déjà exploitable pour l'agenda), `billeterie`, `idTmdb` (permet d'enrichir via TMDB si besoin : affiche HD, note, bande-annonce...).

---

### 3.2 Endpoint secondaire — billetterie CoteCiné (optionnel, pour lien de résa précis)

Non indispensable pour l'objectif "afficher + calendrier" puisque chaque film a déjà un lien `billeterie` générique. Utile seulement si tu veux un **deep-link vers une séance précise**.

```
GET https://www.thionville-scala-vad.cotecine.fr/reserver/ajax/?modresa_film=<ID_FILM>
```
→ JSON `{ "2026-07-03": "vendredi 3 juillet (Demain)", ... }` (dates disponibles pour ce film)

Puis navigation vers :
```
https://www.thionville-scala-vad.cotecine.fr/reserver/F<ID_FILM>/D<TIMESTAMP_UNIX_JOUR>/VO/<ID_SEANCE>/
```
→ page HTML de la séance (horaire, tarifs, VOST/VF...)

**⚠️ Non vérifié :** l'`ID_FILM` (ex: `626537` pour "Cocotte") n'est pas directement le texte visible dans le `<select>` du formulaire — il faut inspecter le HTML source de `/reserver/` pour trouver l'attribut qui porte cet ID sur chaque `<option>` (probablement un `data-*` ou une `value` numérique). À faire au moment de l'implémentation si vous décidez d'exploiter cette partie.

Cet endpoint n'a pas été testé en `curl` pur (juste observé via navigateur) — à vérifier s'il nécessite des cookies/session avant de compter dessus dans un script headless.

---

## 4. Architecture recommandée

```
┌─────────────────┐     cron (1-6h)     ┌──────────────┐      ┌─────────────┐
│ Endpoint TYPO3   │ ───────────────────▶│ Fetch + norm  │─────▶│ Cache/DB     │
│ (thionville.fr)  │                     │ (script/job)  │      │ (JSON/SQLite)│
└─────────────────┘                     └──────────────┘      └──────┬──────┘
                                                                       │
                                                                       ▼
                                                              ┌─────────────────┐
                                                              │ API interne      │
                                                              │ (votre backend)  │
                                                              └────────┬─────────┘
                                                                       │
                                                       ┌───────────────┼────────────────┐
                                                       ▼                                ▼
                                              ┌─────────────────┐            ┌────────────────────┐
                                              │ Web app (front)  │            │ Génération .ics     │
                                              │ liste des films  │            │ par séance/film      │
                                              └─────────────────┘            └────────────────────┘
```

**Points clés :**

1. **Ne jamais taper l'endpoint TYPO3 directement depuis le front / à chaque visite utilisateur.** Ce n'est pas une API publique officielle — la traiter comme telle serait irrespectueux du site et fragile (risque de rate-limit / blocage IP). Un job planifié (cron toutes les 1 à 6h, via GitHub Actions, Cloud Function, ou simple cron local) suffit largement : la programmation cinéma ne change pas à la minute.
2. **Normaliser** la réponse brute TYPO3 dans un schéma propre à vous (voir §5) dès l'ingestion — évite de propager les bizarreries du format source (champs imbriqués TYPO3, HTML brut dans `content`) dans tout le reste de l'app.
3. **Stocker en cache** (fichier JSON suffit pour un projet perso ; SQLite/Postgres si vous voulez historiser ou scaler).
4. **Défensif** : le format n'est pas documenté officiellement, il peut changer sans préavis. Prévoir une validation de schéma (zod/pydantic) à l'ingestion qui log/alerte si un champ attendu disparaît, plutôt qu'un crash silencieux.

---

## 5. Schéma de données cible (proposition)

```ts
type Movie = {
  id: string;              // uid TYPO3
  title: string;
  director: string;
  genres: string[];
  duration: string;        // ou minutes: number si vous parsez "1h 7m"
  synopsis: string;
  posterUrl: string;
  tmdbId?: string;
  showtimes: Showtime[];
};

type Showtime = {
  id: string;               // uid de la séance
  movieId: string;
  startsAt: string;         // ISO8601, direct depuis seances[].start
  bookingUrl: string;        // billeterie générique (ou deep-link si vous implémentez §3.2)
};
```

---

## 6. Fonctionnalité calendrier

**Recommandation : génération de fichiers `.ics` (iCalendar), pas d'intégration OAuth Google Calendar.**

Pourquoi :
- Zéro authentification à gérer côté utilisateur (pas de consentement OAuth, pas de credentials Google Cloud à provisionner)
- Compatible nativement avec Google Calendar, Apple Calendar, Outlook — un simple lien de téléchargement/`webcal://`
- Librairies minces disponibles dans tous les langages (`ics` en JS/Python)

Deux façons de le proposer :
1. **Bouton "Ajouter au calendrier"** par séance → génère un `.ics` à la volée avec `startsAt`, `title`, `duration`, `bookingUrl` en description
2. (Plus avancé) **Flux `.ics` abonnable** par cinéma/genre favori → l'utilisateur s'abonne une fois, son calendrier se resynchronise automatiquement à chaque refresh de votre cache

Si plus tard vous voulez du push automatique (sans action utilisateur), l'intégration Google Calendar API devient nécessaire — mais ce n'est pas justifié pour un MVP.

---

## 7. Étapes suggérées (roadmap MVP)

1. Script d'ingestion : `fetch` endpoint TYPO3 → parse → écrit `movies.json` normalisé
2. Vérifier le comportement au fil du temps (le cHash restera-t-il optionnel ? tester une fois par semaine au début)
3. API backend minimal qui sert `movies.json` (routes : liste films, détail film + séances)
4. Front : liste de films + leurs prochaines séances
5. Génération `.ics` par séance
6. (Optionnel) Cron pour rafraîchir le cache automatiquement
7. (Optionnel) Enrichissement TMDB via `idTmdb` (affiche HD, note, bande-annonce)
8. (Optionnel, plus tard) Généraliser à d'autres cinémas CoteCiné si le pattern se confirme identique ailleurs

---

## 8. Bonnes pratiques / éthique

- Respecter un intervalle de rafraîchissement raisonnable (1-6h) — ne pas transformer ça en scraping agressif
- Mettre un `User-Agent` identifiable et honnête dans vos requêtes (pas besoin de se faire passer pour un navigateur)
- Garder en tête que ce sont des endpoints internes non documentés : prévoir que ça casse un jour, et ne pas en faire un produit commercial sans contacter le cinéma/la mairie de Thionville pour validation si le projet grossit

---

## 9. Étude de cas : "La Bobine" (app similaire, France entière)

Analyse d'un post Reddit (r/CineSeries) du créateur (`theharadwaith`) + ses réponses en commentaires. Confirme directement l'architecture recommandée ci-dessus et donne des pistes concrètes pour la suite.

### 9.1 Sources de données — confirmation clé

Citation de l'auteur, en réponse à "comment tu récupères la programmation des petits cinémas sans site web ?" :

> *"Les petits cinémas n'ont pas forcément de site web, mais ils utilisent quand même un logiciel de gestion du cinéma qui centralise les données. Donc en général leur programmation est disponible par API."*

→ **Ça confirme exactement l'approche CoteCiné de ce projet.** Les cinémas indépendants tournent sur un nombre restreint de logiciels de billetterie mutualisés (CoteCiné, Vista, etc.), chacun exposant une API/AJAX interne similaire à celle documentée en §3.2. Généraliser au-delà de Thionville consiste probablement à identifier quel logiciel de billetterie utilise chaque cinéma indépendant, plutôt qu'à réinventer un scraper par salle.

Répartition observée des sources selon la taille du cinéma :
- **Grosses chaînes (CGR confirmé, probablement Pathé/UGC/Gaumont)** : pas d'API trouvée → scraping direct du site, lent (~10s/jour/cinéma) mais fait de façon asynchrone donc sans impact perçu
- **Cinémas indépendants** : logiciel de billetterie mutualisé → API interne (notre cas CoteCiné)
- **Métadonnées films (poster, synopsis, notes)** : agrégées depuis Allociné + IMDb + SensCritique — zone grise légale à petite échelle, l'auteur note qu'il faudrait ré-héberger les images lui-même avant de monétiser

### 9.2 Confirmation de l'architecture (cron + cache)

> *"La base de données est alimentée chaque nuit, et l'appli peut y accéder instantanément."*

Exactement le pattern recommandé en §4 : ingestion asynchrone planifiée (ici nocturne) → DB propre → app qui ne lit jamais les sources en direct.

### 9.3 Stack technique mentionnée (par un commentateur, confirmée par l'auteur)

- Frontend : React (build statique, probablement Vite) + Tailwind CSS
- Hébergement : Cloudflare
- SSR partiel réservé aux requêtes de bots (pour le référencement des fiches film — sinon coût de SSR complet trop élevé)
- Recherche de lieu : Google Places Autocomplete (facturé par session de recherche, donc un debounce n'a pas d'impact sur le coût)
- Coût d'infra total : **~5€/mois**
- Deep-link de réservation : cliquer sur un horaire redirige vers la page de résa **de cette séance précise**, pas juste le lien générique du cinéma

### 9.4 Backlog de features (issu des retours utilisateurs, à prioriser pour une v2)

**Filtres (très demandés, quasi "must-have" selon les retours) :**
- Genre du film (demandé par au moins 4 commentateurs différents — absent dans l'app d'origine)
- Pays d'origine / décennie de sortie / réalisateur
- Classification d'âge (utile pour les parents, ex. "à partir de 6 ans")
- VO/VF (bug signalé : "VO" affichait aussi des films français en VO)
- VFSTF (VF sous-titré pour malentendants) — donnée difficile à centraliser selon l'auteur lui-même

**Découverte / tri :**
- Tri par pertinence (note agrégée) par défaut, avec option tri par distance / heure / date de sortie
- Distinguer "déjà sorti" vs pas encore sorti
- Bouton "déjà vu" / "pas intéressé" pour filtrer les films déjà vus des résultats

**Notifications / alertes (déjà en partie implémenté sur mobile via une icône cloche) :**
- Alerte quand un film pas encore sorti devient réservable
- Alerte quand un "vieux film" d'une liste de favoris est reprogrammé (rétrospective, cinémathèque) — feature très demandée, plusieurs commentateurs
- Filtres favoris avec notification à chaque nouveau film correspondant

**Cartographie / localisation :**
- Carte interactive avec zoom, affichant les séances géolocalisées (pas juste une liste)
- Le tri par défaut affichait "le cinéma avec la séance la plus tôt" plutôt que "le plus proche" — problématique pour les petits cinémas associatifs qui se retrouvent masqués par un multiplexe plus loin mais avec un horaire plus tôt (point reconnu comme non résolu par l'auteur)
- Distance à vol d'oiseau jugée peu utile en ville dense — un temps de trajet transports en commun serait plus pertinent (mais jugé par d'autres commentateurs comme hors scope, "Google Maps fait déjà ça")

**UX / social :**
- Sauvegarder une sélection de séances repérées pour comparer avant de choisir
- Marque-page/URL partageable avec la ville pré-remplie (`/search?q=Paris`)
- Cliquer sur le nom d'un cinéma → sa programmation complète
- Système de notation communautaire ("bobineur") en plus des notes agrégées officielles

**Légal / SEO (retour d'un dev en commentaire, confirmé par l'auteur) :**
- Attention à la réutilisation d'assets Allociné (images/textes) à grande échelle si le projet monétise un jour
- URLs dynamiques par fiche film + SSR/SSG nécessaires pour un bon référencement
- Détail bête mais réel : penser à `<html lang="fr">` dès le départ

### 9.5 Pour ce projet (Scala Thionville)

Vu l'échelle (un seul cinéma vs. 1800 pour La Bobine), tout le volet "scraping multi-chaînes + agrégation multi-sources" ne s'applique pas — l'endpoint TYPO3 unique suffit. Les enseignements directement réutilisables sont : le pattern cron nocturne + cache, le deep-link de réservation par séance plutôt que par film, et le backlog de filtres (genre, notamment, déjà présent nativement dans les données TYPO3 via `genre[].title`).


J'aimerais pottentillement ajouter les cinémas aussi autour de chez moi facilement.