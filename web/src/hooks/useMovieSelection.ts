import { useMemo, useState } from 'react';
import { readSelectedMovieIds, writeSelectedMovieIds } from '../lib/movieSelection.js';

export function useMovieSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(readSelectedMovieIds()));

  const persist = (next: Set<string>) => {
    writeSelectedMovieIds([...next]);
    setSelectedIds(next);
  };

  const toggle = (movieId: string) => {
    const next = new Set(selectedIds);
    if (next.has(movieId)) {
      next.delete(movieId);
    } else {
      next.add(movieId);
    }
    persist(next);
  };

  const selectAll = (movieIds: string[]) => persist(new Set([...selectedIds, ...movieIds]));

  const deselectAll = (movieIds: string[]) => {
    const next = new Set(selectedIds);
    for (const id of movieIds) next.delete(id);
    persist(next);
  };

  const isSelected = useMemo(() => (movieId: string) => selectedIds.has(movieId), [selectedIds]);

  return { selectedIds, toggle, isSelected, selectAll, deselectAll };
}
