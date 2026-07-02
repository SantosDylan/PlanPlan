import type { Cinema, Movie, Showtime } from './types.js';

/**
 * Génération iCalendar (RFC 5545) maison — cf. ADR-003.
 * Trois pièges traités explicitement : VTIMEZONE Europe/Paris (DST),
 * UID stables (sinon les clients abonnés dupliquent les événements),
 * pliage des lignes à 75 octets.
 */

const CRLF = '\r\n';
const PARIS_TZ = 'Europe/Paris';
const SYNOPSIS_MAX_LENGTH = 200;

const VTIMEZONE_PARIS = [
  'BEGIN:VTIMEZONE',
  `TZID:${PARIS_TZ}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Plie une ligne à 75 octets max, continuation = CRLF + espace (RFC 5545 §3.1). */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const segments: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    const limit = segments.length === 0 ? 75 : 74; // les continuations perdent 1 octet (l'espace)
    if (currentBytes + charBytes > limit) {
      segments.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += charBytes;
  }
  segments.push(current);
  return segments.map((segment, i) => (i === 0 ? segment : ` ${segment}`)).join(CRLF);
}

/** Date ISO (offset quelconque) → heure locale Paris au format iCalendar `YYYYMMDDTHHMMSS`. */
export function formatIcsParisLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}${get('month')}${get('day')}T${get('hour')}${get('minute')}${get('second')}`;
}

function formatUtcStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
}

function buildVEventLines(cinema: Cinema, movie: Movie, showtime: Showtime, stamp: string): string[] {
  const summary = movie.version ? `${movie.title} (${movie.version})` : movie.title;
  const synopsis = movie.synopsis
    ? movie.synopsis.length > SYNOPSIS_MAX_LENGTH
      ? `${movie.synopsis.slice(0, SYNOPSIS_MAX_LENGTH)}…`
      : movie.synopsis
    : '';
  const description = [synopsis, movie.bookingUrl ? `Réservation : ${movie.bookingUrl}` : '']
    .filter(Boolean)
    .join('\n');
  return [
    'BEGIN:VEVENT',
    `UID:${showtime.id}@planplan`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${PARIS_TZ}:${formatIcsParisLocal(showtime.startsAt)}`,
    `DTEND;TZID=${PARIS_TZ}:${formatIcsParisLocal(showtime.endsAtEstimate)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    ...(description ? [`DESCRIPTION:${escapeIcsText(description)}`] : []),
    `LOCATION:${escapeIcsText(`${cinema.name}, ${cinema.city}`)}`,
    ...(movie.bookingUrl ? [`URL:${movie.bookingUrl}`] : []),
    'END:VEVENT',
  ];
}

export function buildIcsFeed(cinema: Cinema, movies: Movie[], generatedAt: Date): string {
  const stamp = formatUtcStamp(generatedAt);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//planplan//ingest//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(`${cinema.name} (${cinema.city}) — séances`)}`,
    `X-WR-TIMEZONE:${PARIS_TZ}`,
    ...VTIMEZONE_PARIS,
  ];
  for (const movie of movies) {
    for (const showtime of movie.showtimes) {
      lines.push(...buildVEventLines(cinema, movie, showtime, stamp));
    }
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}

/** `.ics` mono-événement — utilisé par le bouton « ajouter au calendrier » du front. */
export function buildIcsSingleEvent(cinema: Cinema, movie: Movie, showtime: Showtime, generatedAt: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//planplan//ingest//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...VTIMEZONE_PARIS,
    ...buildVEventLines(cinema, movie, showtime, formatUtcStamp(generatedAt)),
    'END:VCALENDAR',
  ];
  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}
