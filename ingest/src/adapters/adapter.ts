import type { Cinema, Movie } from '../types.js';

/**
 * Contrat d'extensibilité multi-cinémas (ADR-002).
 * Ajouter un cinéma = implémenter cette interface dans adapters/<cinema-id>/
 * et l'ajouter à la liste de l'orchestrateur. Rien d'autre ne change.
 */
export interface SourceAdapter {
  cinema: Cinema;
  /** Programmation normalisée : séances futures uniquement, films sans séance exclus. */
  fetchProgram(): Promise<Movie[]>;
}
