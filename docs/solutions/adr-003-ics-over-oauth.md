# ADR-003 — Fichiers .ics plutôt qu'intégration OAuth calendrier

**Date :** 2026-07-02 · **Statut :** accepté

## Contexte

« Ajouter une séance à son calendrier » peut se faire via les APIs Google/Microsoft (OAuth, consentement, credentials cloud, quotas) ou via le format ouvert iCalendar (RFC 5545), supporté nativement par Google Calendar, Apple Calendar et Outlook.

## Décision

Double mécanisme, tout en `.ics` :

1. **Par séance** : `.ics` mono-événement généré côté client (Blob + download) — zéro requête, zéro auth.
2. **Abonnement** : flux `webcal://…/calendar/<cinemaId>.ics` pré-généré à l'ingestion ; le calendrier de l'utilisateur se resynchronise tout seul quand la programmation change.

Implémentation maison (~60 lignes) plutôt qu'une lib : le format est du texte simple, mais trois pièges sont traités explicitement — `VTIMEZONE`/`TZID=Europe/Paris` (DST), **UID stables** (`<showtimeId>@planplan`, sinon les clients abonnés dupliquent les événements à chaque refresh), et pliage des lignes à 75 octets (RFC 5545 §3.1).

## Conséquences

- Aucun credential à provisionner, aucune donnée utilisateur chez nous.
- `DTEND` estimé = début + `durationMinutes` (sans pubs/bandes-annonces) ; défaut 120 min si durée absente.
- Limite : pas de push proactif (« nouveau film ! ») — nécessiterait de vraies intégrations, hors POC (cf. STRATEGY « Not working on »).
