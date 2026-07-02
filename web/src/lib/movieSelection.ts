const STORAGE_KEY = 'planplan.selectedMovies';

/** Lecture défensive : localStorage indisponible, quota dépassé ou JSON corrompu → sélection vide. */
export function readSelectedMovieIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function writeSelectedMovieIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la sélection ne persiste pas, mais l'app reste utilisable.
  }
}
