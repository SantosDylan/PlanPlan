import { useRef, type FC } from 'react';
import { css } from '#styled-system/css';
import { dayKeyOf } from '#src/lib/datetime.js';
import { nextShowtimeShort, seanceCountLabel } from '#src/lib/showtimes.js';
import type { MovieWithCinema } from './GridView.js';
import { Poster } from './Poster.js';

const tileClass = css({
  display: 'flex',
  flexDir: 'column',
  gap: '2',
  textAlign: 'left',
  bg: 'transparent',
  border: 'none',
  p: '0',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
});

const posterBoxClass = css({
  position: 'relative',
  w: 'full',
  aspectRatio: '2 / 3',
  rounded: 'poster',
  overflow: 'hidden',
});

const posterImgClass = css({
  position: 'absolute',
  inset: '0',
  w: 'full',
  h: 'full',
  rounded: 'poster',
});

const versionTagClass = css({
  position: 'absolute',
  top: '2',
  right: '2',
  fontFamily: 'mono',
  fontSize: '2xs',
  fontWeight: 'medium',
  color: 'accentText',
  bg: 'posterTagBg',
  backdropFilter: 'blur(4px)',
  px: '1.5',
  py: '0.5',
  rounded: 'md',
});

const countPillClass = css({
  position: 'absolute',
  bottom: '2',
  left: '2',
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: 'accentText',
  bg: 'accent',
  px: '2',
  py: '0.5',
  rounded: 'full',
});

type MoviePosterTileProps = {
  entry: MovieWithCinema;
  onSelect: (entry: MovieWithCinema, trigger: HTMLButtonElement) => void;
};

/** Tuile d'affiche de la Grille — tap → ouvre la fiche détail (bottom-sheet) du film. */
export const MoviePosterTile: FC<MoviePosterTileProps> = ({ entry, onSelect }) => {
  const { movie } = entry;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const todayKey = dayKeyOf(new Date().toISOString());

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-haspopup="dialog"
      aria-label={`${movie.title} — ${seanceCountLabel(movie.showtimes.length)}, voir les séances`}
      onClick={() => buttonRef.current && onSelect(entry, buttonRef.current)}
      className={tileClass}
    >
      <div className={posterBoxClass}>
        <Poster title={movie.title} posterUrl={movie.posterUrl} className={posterImgClass} />
        {movie.version && (
          <span aria-hidden="true" className={versionTagClass}>
            {movie.version}
          </span>
        )}
        <span aria-hidden="true" className={countPillClass}>
          {seanceCountLabel(movie.showtimes.length)}
        </span>
      </div>
      <div className={css({ display: 'flex', flexDir: 'column', gap: '0.5' })}>
        <span className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'paper', lineHeight: 'tight', lineClamp: 2 })}>
          {movie.title}
        </span>
        <span className={css({ fontSize: '2xs', color: 'paperFaint' })}>{nextShowtimeShort(movie.showtimes, todayKey)}</span>
      </div>
    </button>
  );
};
