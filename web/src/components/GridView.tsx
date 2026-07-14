import type { FC } from 'react';
import type { Cinema, Movie } from '../../../ingest/src/types.js';
import { css } from '../../styled-system/css';
import { MoviePosterTile } from './MoviePosterTile.js';

export type MovieWithCinema = { movie: Movie; cinema: Cinema };

const gridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '3.5',
});

type GridViewProps = {
  entries: MovieWithCinema[];
  onSelectMovie: (entry: MovieWithCinema, trigger: HTMLButtonElement) => void;
};

/** Vue « butinage visuel » : grille d'affiches, 2 colonnes sur mobile. */
export const GridView: FC<GridViewProps> = ({ entries, onSelectMovie }) =>
  entries.length === 0 ? (
    <p className={css({ color: 'paperMuted', fontSize: 'sm', textAlign: 'center', py: '8', m: '0' })}>
      Aucune séance à venir.
    </p>
  ) : (
    <div className={gridClass}>
      {entries.map((entry) => (
        <MoviePosterTile key={entry.movie.id} entry={entry} onSelect={onSelectMovie} />
      ))}
    </div>
  );
