import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { Cinema } from '../../types.js';
import { normalizeMovie, parseDurationToMinutes } from './normalize.js';
import { rawMovieSchema, responseSchema } from './schema.js';

vi.spyOn(console, 'warn').mockImplementation(() => {});

const cinema: Cinema = {
  id: 'scala-thionville',
  name: 'La Scala',
  city: 'Thionville',
  bookingUrl: 'https://resa.example/',
};

const NOW = new Date('2026-07-02T12:00:00+02:00');

const rawMovie = rawMovieSchema.parse({
  uid: 892,
  title: 'Le Vertige',
  director: 'Quentin Dupieux',
  genre: [{ title: 'Animation', uid: 526 }],
  duration: '1h 7m',
  releaseYear: 2026,
  synopsis: 'Jacques se rend chez son ami Bruno.',
  langues: [{ title: 'VF' }],
  pictureShow: [{ originalResource: { originalFile: { identifier: '/user_upload/tx_cimtmdb/1668499.jpg' } } }],
  seances: [
    { uid: 1, start: '2026-06-10T13:30:00+0200' }, // passée → exclue
    { uid: 2, start: '2026-07-03T18:30:00+0200' }, // future
    { uid: 3 }, // sans start (observé en réel) → ignorée avec warning
    { uid: 4, start: '2026-07-02T13:55:00+0200' }, // future, plus proche
  ],
  billeterie: 'https://booking.example/film',
  idTmdb: '1668499',
});

describe('parseDurationToMinutes', () => {
  it.each([
    ['1h 7m', 67],
    ['2h', 120],
    ['45m', 45],
    ['1h 30m', 90],
  ])('%s → %d', (input, expected) => {
    expect(parseDurationToMinutes(input)).toBe(expected);
  });

  it('retourne undefined si illisible, absent ou nul', () => {
    expect(parseDurationToMinutes('bientôt')).toBeUndefined();
    expect(parseDurationToMinutes('')).toBeUndefined();
    expect(parseDurationToMinutes(null)).toBeUndefined();
    expect(parseDurationToMinutes('0m')).toBeUndefined(); // Toy Story 5, vu en réel
  });
});

describe('normalizeMovie', () => {
  it('normalise les champs et préfixe les ids par le cinéma', () => {
    const movie = normalizeMovie(rawMovie, cinema, NOW);
    expect(movie).not.toBeNull();
    expect(movie?.id).toBe('scala-thionville-892');
    expect(movie?.cinemaId).toBe('scala-thionville');
    expect(movie?.durationMinutes).toBe(67);
    expect(movie?.version).toBe('VF');
    expect(movie?.genres).toEqual(['Animation']);
    expect(movie?.posterUrl).toBe('https://www.thionville.fr/fileadmin/user_upload/tx_cimtmdb/1668499.jpg');
    expect(movie?.bookingUrl).toBe('https://booking.example/film'); // le lien du film prime sur celui du cinéma
    expect(movie?.tmdbId).toBe('1668499');
  });

  it('ne garde que les séances futures, triées, et ignore celles sans start', () => {
    const movie = normalizeMovie(rawMovie, cinema, NOW);
    expect(movie?.showtimes.map((s) => s.id)).toEqual(['scala-thionville-4', 'scala-thionville-2']);
  });

  it('calcule endsAtEstimate = début + durée', () => {
    const movie = normalizeMovie(rawMovie, cinema, NOW);
    const late = movie?.showtimes.at(-1);
    // 18:30 +0200 + 67 min = 19:37 +0200 = 17:37 UTC
    expect(late?.endsAtEstimate).toBe('2026-07-03T17:37:00.000Z');
  });

  it("retourne null quand plus aucune séance à venir (l'index source contient l'historique)", () => {
    expect(normalizeMovie(rawMovie, cinema, new Date('2027-01-01T00:00:00Z'))).toBeNull();
  });
});

describe('fixtures réelles (2026-07-02) — détecteur de dérive de format', () => {
  const page1 = JSON.parse(readFileSync(new URL('../../../fixtures/scala-page1.json', import.meta.url), 'utf8'));
  const page2 = JSON.parse(readFileSync(new URL('../../../fixtures/scala-page2.json', import.meta.url), 'utf8'));
  const pageVide = JSON.parse(readFileSync(new URL('../../../fixtures/scala-page-vide.json', import.meta.url), 'utf8'));

  it('la réponse et les 6 films de chaque page passent la validation', () => {
    for (const page of [page1, page2]) {
      const parsed = responseSchema.parse(page);
      expect(parsed.resultsPerPage).toBe(6);
      expect(parsed.documents.movie).toHaveLength(6);
      for (const item of parsed.documents.movie) {
        expect(() => rawMovieSchema.parse(item)).not.toThrow();
      }
    }
  });

  it('tolère la dernière page vide où PHP sérialise documents en tableau', () => {
    const parsed = responseSchema.parse(pageVide);
    expect(parsed.documents.movie).toEqual([]);
  });

  it('normalise un film réel avec des séances futures à la date de capture', () => {
    const raw = rawMovieSchema.parse(responseSchema.parse(page1).documents.movie[0]);
    const movie = normalizeMovie(raw, cinema, NOW);
    expect(movie?.title).toBe('Le Vertige');
    expect(movie?.showtimes.length).toBeGreaterThan(0);
    expect(movie?.showtimes.every((s) => Date.parse(s.startsAt) >= NOW.getTime())).toBe(true);
  });
});
