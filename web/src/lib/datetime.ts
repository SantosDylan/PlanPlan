const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const weekdayShortFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short' });
const dayNumberFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric' });
const dayLabelFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const dayHeadingFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  weekday: 'long',
  day: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
const shortSyncFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const longSyncFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  dateStyle: 'long',
  timeStyle: 'short',
});

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Clé de jour Europe/Paris (`YYYY-MM-DD`) — utilisée pour grouper/comparer les séances par jour. */
export function dayKeyOf(iso: string): string {
  return dayKeyFormat.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`;
}

/** Nom court du jour (« mer. ») avec le point Intl conservé — pour un usage en prose (ex. « dès mer. 15 »). */
export function formatWeekdayShort(iso: string): string {
  return weekdayShortFormat.format(new Date(iso));
}

export function formatDayNumber(iso: string): string {
  return dayNumberFormat.format(new Date(iso));
}

/** Nom + numéro du jour pour une chip (« Mer » / « 15 ») — le point Intl est retiré pour ce format compact. */
export function formatDayTab(iso: string): { name: string; number: string } {
  return {
    name: formatWeekdayShort(iso).replace(/\.$/, ''),
    number: formatDayNumber(iso),
  };
}

/** Étiquette longue d'un jour (« mercredi 15 juillet »), pour le label au-dessus des horaires. */
export function formatDayLabel(iso: string): string {
  return dayLabelFormat.format(new Date(iso));
}

/** « Aujourd'hui » si `iso` tombe le jour de `todayKey`, sinon « Mercredi 15 » (sans mois — en-têtes Agenda). */
export function formatDayHeading(iso: string, todayKey: string): string {
  if (dayKeyOf(iso) === todayKey) return "Aujourd'hui";
  return capitalize(dayHeadingFormat.format(new Date(iso)));
}

export function formatShortSync(iso: string): string {
  return shortSyncFormat.format(new Date(iso));
}

export function formatLongSync(iso: string): string {
  return longSyncFormat.format(new Date(iso));
}
