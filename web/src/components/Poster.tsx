import { useState, type FC } from 'react';
import { css, cx } from '../../styled-system/css';

const placeholderClass = css({
  bg: 'surfaceRaised',
  backgroundImage: 'repeating-linear-gradient(135deg, {colors.hairline} 0 6px, {colors.hairlineFaint} 6px 12px)',
});

const imgClass = css({
  objectFit: 'cover',
  bg: 'surfaceRaised',
});

type PosterProps = {
  title: string;
  posterUrl?: string;
  className?: string;
};

/**
 * Affiche d'un film avec repli sur un placeholder rayé — que l'URL soit absente ou en échec.
 * Le caller contrôle la taille/l'aspect-ratio/l'arrondi via `className` (tuile grille 2/3,
 * en-tête de fiche 84×120, miniature agenda 38×54).
 */
export const Poster: FC<PosterProps> = ({ title, posterUrl, className }) => {
  const [hasError, setHasError] = useState(false);
  const showPlaceholder = !posterUrl || hasError;

  return showPlaceholder ? (
    <div aria-hidden="true" className={cx(placeholderClass, className)} />
  ) : (
    <img
      src={posterUrl}
      alt={`Affiche de ${title}`}
      loading="lazy"
      onError={() => setHasError(true)}
      className={cx(imgClass, className)}
    />
  );
};
