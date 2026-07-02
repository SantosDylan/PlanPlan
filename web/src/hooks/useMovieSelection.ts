import { useMemo, useState } from 'react';
import { readSelectedMovieIds, writeSelectedMovieIds } from '../lib/movieSelection.js';

export function useMovieSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(readSelectedMovieIds()));

  const toggle = (movieId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(movieId)) {
        next.delete(movieId);
      } else {
        next.add(movieId);
      }
      writeSelectedMovieIds([...next]);
      return next;
    });
  };

  const isSelected = useMemo(() => (movieId: string) => selectedIds.has(movieId), [selectedIds]);

  return { selectedIds, toggle, isSelected };
}
