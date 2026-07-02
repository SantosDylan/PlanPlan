import { describe, expect, it } from 'vitest';
import { buildIcsFeed, buildIcsSingleEvent, escapeIcsText, foldIcsLine, formatIcsParisLocal } from './ics.js';
import type { Cinema, Movie } from './types.js';

const cinema: Cinema = { id: 'scala-thionville', name: 'La Scala', city: 'Thionville' };

const movie: Movie = {
  id: 'scala-thionville-892',
  cinemaId: 'scala-thionville',
  title: 'Le Vertige, ou presque',
  genres: ['Animation'],
  durationMinutes: 67,
  version: 'VF',
  synopsis: 'Un synopsis suffisamment long pour vérifier que le pliage des lignes à 75 octets fonctionne, y compris avec des caractères accentués : éàüîô, et une virgule.',
  bookingUrl: 'https://booking.example/film',
  showtimes: [
    {
      id: 'scala-thionville-10502',
      movieId: 'scala-thionville-892',
      cinemaId: 'scala-thionville',
      startsAt: '2026-07-03T18:30:00+0200',
      endsAtEstimate: '2026-07-03T17:37:00.000Z',
    },
  ],
};

describe('formatIcsParisLocal', () => {
  it('convertit vers l’heure locale Paris (été, +0200)', () => {
    expect(formatIcsParisLocal('2026-07-03T18:30:00+0200')).toBe('20260703T183000');
    expect(formatIcsParisLocal('2026-07-03T16:30:00.000Z')).toBe('20260703T183000');
  });

  it('gère l’hiver (CET, +0100)', () => {
    expect(formatIcsParisLocal('2026-12-15T10:00:00.000Z')).toBe('20261215T110000');
  });
});

describe('escapeIcsText', () => {
  it('échappe virgules, points-virgules et retours à la ligne', () => {
    expect(escapeIcsText('a,b;c\nd')).toBe('a\\,b\\;c\\nd');
  });
});

describe('foldIcsLine', () => {
  it('ne produit que des lignes ≤ 75 octets', () => {
    const long = `DESCRIPTION:${'é'.repeat(200)}`;
    for (const line of foldIcsLine(long).split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('laisse les lignes courtes intactes', () => {
    expect(foldIcsLine('SUMMARY:ok')).toBe('SUMMARY:ok');
  });
});

describe('buildIcsFeed', () => {
  const feed = buildIcsFeed(cinema, [movie], new Date('2026-07-02T10:00:00Z'));

  it('contient le VTIMEZONE Europe/Paris et les métadonnées du flux', () => {
    expect(feed).toContain('BEGIN:VTIMEZONE');
    expect(feed).toContain('TZID:Europe/Paris');
    expect(feed).toContain('X-WR-CALNAME:La Scala (Thionville) — séances');
  });

  it('génère un VEVENT avec UID stable et horaires TZID', () => {
    expect(feed).toContain('UID:scala-thionville-10502@planplan');
    expect(feed).toContain('DTSTART;TZID=Europe/Paris:20260703T183000');
    expect(feed).toContain('DTEND;TZID=Europe/Paris:20260703T193700');
    expect(feed).toContain('SUMMARY:Le Vertige\\, ou presque (VF)');
  });

  it('respecte la limite de 75 octets par ligne sur tout le flux', () => {
    for (const line of feed.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe('buildIcsSingleEvent', () => {
  it('produit un VCALENDAR complet avec un seul VEVENT', () => {
    const single = buildIcsSingleEvent(cinema, movie, movie.showtimes[0]!, new Date('2026-07-02T10:00:00Z'));
    expect(single.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(single).toContain('BEGIN:VTIMEZONE');
    expect(single).toContain('UID:scala-thionville-10502@planplan');
    expect(single.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});
