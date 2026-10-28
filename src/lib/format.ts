// Formats de date et de prix en français, fuseau de la commune
const TZ = 'Europe/Paris';

export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  }).format(d);

export const formatTime = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
    .format(d)
    .replace(':', ' h ');

export const formatDayMonth = (d: Date) => {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    timeZone: TZ,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { weekday: get('weekday'), day: get('day'), month: get('month') };
};

export const formatPrice = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

// Date ISO (AAAA-MM-JJ) dans le fuseau de la commune
export const isoDate = (d: Date) => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(d);
