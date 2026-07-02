import { useMemo, useState } from 'react';
import { readSelectedMovieIds, writeSelectedMovieIds } from '../lib/movieSelection.js';

export function useMovieSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(readSelectedMovieIds()));

  const toggle = (movieId: string) => {
    const next = new Set(selectedIds);
    if (next.has(movieId)) {
      next.delete(movieId);
    } else {
      next.add(movieId);
    }
    writeSelectedMovieIds([...next]);
    setSelectedIds(next);
  };

  const isSelected = useMemo(() => (movieId: string) => selectedIds.has(movieId), [selectedIds]);

  return { selectedIds, toggle, isSelected };
}
