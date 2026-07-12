import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pickBestMatch, type TmdbResult } from './tmdb.js';

const inWaves: { results: TmdbResult[] } = JSON.parse(
  readFileSync(new URL('../../../fixtures/tmdb-search-in-waves.json', import.meta.url), 'utf8'),
);

describe('pickBestMatch', () => {
  it('choisit le « In Waves » 2026 (année des séances) parmi les homonymes', () => {
    const match = pickBestMatch(inWaves.results, 'In Waves', 2026);
    expect(match?.id).toBe(947502);
    expect(match?.release_date).toBe('2026-07-01');
    expect(match?.poster_path).toBeTruthy();
  });

  it('à défaut d’année concordante, retombe sur le titre exact le plus populaire', () => {
    const results: TmdbResult[] = [
      { id: 1, title: 'Ulysse', release_date: '1954-10-05', poster_path: '/a.jpg', popularity: 3 },
      { id: 2, title: 'Ulysse', release_date: '2022-01-01', poster_path: '/b.jpg', popularity: 9 },
      { id: 3, title: 'Ulysse 31', release_date: '2026-01-01', poster_path: '/c.jpg', popularity: 50 },
    ];
    expect(pickBestMatch(results, 'Ulysse', 2026)?.id).toBe(2); // pas le 31 (titre différent)
  });

  it('rejette un résultat sans affiche même si le titre est exact', () => {
    const results: TmdbResult[] = [{ id: 1, title: 'In Waves', release_date: '2026-07-01', poster_path: null, popularity: 9 }];
    expect(pickBestMatch(results, 'In Waves', 2026)).toBeNull();
  });

  it('rejette quand aucun titre ne correspond exactement (anti-mauvaise-affiche)', () => {
    const results: TmdbResult[] = [{ id: 1, title: 'In Waves of Grace', release_date: '2026-01-01', poster_path: '/x.jpg', popularity: 99 }];
    expect(pickBestMatch(results, 'In Waves', 2026)).toBeNull();
  });
});
