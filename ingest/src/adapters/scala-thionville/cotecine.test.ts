import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeHtmlEntities, normalizeTitleForMatch, parseFilmOptions, parseSeanceKey } from './cotecine.js';

describe('decodeHtmlEntities', () => {
  it('décode les entités numériques et nommées', () => {
    expect(decodeHtmlEntities('Jour de f&#234;te')).toBe('Jour de fête');
    expect(decodeHtmlEntities('L&#39;&#201;trang&#232;re')).toBe("L'Étrangère");
    expect(decodeHtmlEntities('R&#xE9;server')).toBe('Réserver');
    expect(decodeHtmlEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });
});

describe('normalizeTitleForMatch', () => {
  it('ignore casse, accents et ponctuation', () => {
    expect(normalizeTitleForMatch('La Chaleur')).toBe(normalizeTitleForMatch('La chaleur'));
    expect(normalizeTitleForMatch("L'Aventure rêvée")).toBe(normalizeTitleForMatch("L'aventure rêvée"));
  });

  it('neutralise le suffixe d’année (doublon de reprise)', () => {
    expect(normalizeTitleForMatch('Barry Lyndon (1975)')).toBe(normalizeTitleForMatch('Barry Lyndon'));
  });

  it('tolère les entités et espaces superflus', () => {
    expect(normalizeTitleForMatch('Le Gar&#231;on  ')).toBe(normalizeTitleForMatch('Le Garçon'));
  });
});

describe('parseSeanceKey', () => {
  it('extrait timestamp, version et id de séance', () => {
    // 1783963800 = 2026-07-13 17:30 UTC = 19h30 Paris (cf. libellé « 19h30 - VF »)
    expect(parseSeanceKey('1783963800/VF/270215')).toEqual({
      startsAtMs: 1783963800_000,
      version: 'VF',
      seanceId: '270215',
    });
  });

  it('gère une version vide', () => {
    expect(parseSeanceKey('1783963800//270215')).toEqual({ startsAtMs: 1783963800_000, seanceId: '270215' });
  });

  it('retourne null sur une clé illisible', () => {
    expect(parseSeanceKey('nawak')).toBeNull();
    expect(parseSeanceKey('0/VF/1')).toBeNull();
  });
});

describe('parseFilmOptions — fixture réelle (2026-07-12), détecteur de dérive', () => {
  const html = readFileSync(new URL('../../../fixtures/cotecine-films.html', import.meta.url), 'utf8');
  const films = parseFilmOptions(html);

  it('extrait tous les films et écarte l’option vide « Sélectionner un film »', () => {
    expect(films).toHaveLength(18);
    expect(films.every((f) => f.id && f.title)).toBe(true);
    expect(films.map((f) => f.title)).not.toContain('Sélectionner un film');
  });

  it('décode les titres accentués et retrouve « In Waves » (le film disparu de TYPO3)', () => {
    expect(films).toContainEqual({ id: '376520', title: 'In Waves' });
    expect(films.map((f) => f.title)).toContain('Jour de fête');
    expect(films.map((f) => f.title)).toContain("L'Étrangère");
  });
});
