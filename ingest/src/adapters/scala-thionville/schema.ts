import { z } from 'zod';

/**
 * Schéma de la réponse TYPO3 (référence : docs/solutions/typo3-scala-endpoint.md).
 * Volontairement minimal : seuls les champs consommés sont déclarés, les champs
 * inconnus sont ignorés. Politique d'erreur (cf. docs/architecture/review.md) :
 * - film invalide → le parse jette : run rouge = alerte de dérive de format ;
 * - séance invalide (ex. sans `start`, observé en réel) → skip + warning dans normalize.
 */

export const responseSchema = z.object({
  nb_results: z.number(),
  resultsPerPage: z.number(),
  // Piège PHP (vérifié sur la dernière page, vide) : un tableau associatif vide
  // est sérialisé `[]` au lieu de `{}` → `documents` peut être un array.
  documents: z.preprocess(
    (value) => (Array.isArray(value) ? { movie: [] } : value),
    z.object({
      movie: z.array(z.unknown()).default([]),
    }),
  ),
});

export type RawResponse = z.infer<typeof responseSchema>;

export const seanceSchema = z.object({
  uid: z.number(),
  start: z.string(),
});

export const rawMovieSchema = z.object({
  uid: z.number(),
  title: z.string(),
  director: z.string().nullish(),
  genre: z.array(z.object({ title: z.string() })).nullish(),
  duration: z.string().nullish(),
  releaseYear: z.number().nullish(),
  synopsis: z.string().nullish(),
  langues: z.array(z.object({ title: z.string() })).nullish(),
  pictureShow: z
    .array(
      z.object({
        originalResource: z
          .object({
            originalFile: z.object({ identifier: z.string() }).nullish(),
          })
          .nullish(),
      }),
    )
    .nullish(),
  seances: z.array(z.unknown()).nullish(),
  billeterie: z.string().nullish(),
  idTmdb: z.string().nullish(),
});

export type RawMovie = z.infer<typeof rawMovieSchema>;
