import { createContext, useContext, type FC, type ReactNode } from 'react';
import { useMovieSelection } from '../hooks/useMovieSelection.js';

type MovieSelectionContextValue = ReturnType<typeof useMovieSelection>;

const MovieSelectionContext = createContext<MovieSelectionContextValue | null>(null);

export const MovieSelectionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const selection = useMovieSelection();
  return <MovieSelectionContext.Provider value={selection}>{children}</MovieSelectionContext.Provider>;
};

export function useMovieSelectionContext(): MovieSelectionContextValue {
  const context = useContext(MovieSelectionContext);
  if (!context) throw new Error('useMovieSelectionContext must be used within a MovieSelectionProvider');
  return context;
}
